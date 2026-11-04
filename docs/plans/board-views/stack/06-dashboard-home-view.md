# PR 06 - Vue d'accueil « tableau de bord »

**Branche :** `feat/dashboard-home-view` · **Base :** `feat/dashboard-api`

Spécification : [D10](../decisions.md#d10---tableau-de-bord).

## Étapes

### 1. Autoriser la vue

- Ajouter `DASHBOARD: 'dashboard'` à `User.HomeViews` côté serveur. `default_home_view` est un `text` sans contrainte, donc aucune migration.
- Test : `PATCH /api/users/:id` accepte `defaultHomeView: 'dashboard'`.

**Fini quand** ce test passe et qu'un utilisateur existant garde son accueil actuel.

### 2. Écrire le classement pur

`components/common/Home/DashboardView/dashboard-buckets.js`, fonction `bucketDashboardCards(cards, now)`. Tranches, avec `now` fixé dans les tests :

1. Échéance hier : en retard.
2. Plus tôt aujourd'hui : aujourd'hui, et non en retard. Aujourd'hui est un jour entier local.
3. Demain et dans 7 jours : 7 prochains jours.
4. Dans 8 jours : plus tard.
5. Sans date : sans date.
6. Chronomètre en cours : dans la section dédiée et aussi dans son groupe de date.
7. Tri par échéance croissante dans chaque groupe.
8. Passage à l'heure d'été : les limites restent correctes (`TZ=Europe/Paris`).

**Fini quand** ces huit cas passent.

### 3. Charger les données hors du store principal

Les cartes du tableau de bord appartiennent à des tableaux non chargés. Les placer dans le store `redux-orm` perturberait `selectIsCardWithIdAvailableForCurrentUser` et le chargement normal d'un tableau.

- `src/api/dashboard.js`, avec les transformations de dates réutilisées depuis `transformCard`.
- Un état dédié `reducers/dashboard.js`, avec son action, son saga et son sélecteur, suivant les conventions de `sagas/core`.
- Rafraîchissement : à l'affichage, au retour du focus et toutes les 60 secondes pendant que la vue est visible. Arrêt quand la vue n'est plus affichée. Pas de requête si l'onglet est masqué.
- Une erreur de rafraîchissement conserve les dernières données et affiche un indicateur discret.

**Fini quand** changer de vue arrête bien le minuteur, vérifié dans l'onglet réseau, et qu'une panne de serveur ne vide pas l'écran.

### 4. Construire la vue

```text
<Home>
  view === DASHBOARD -> <DashboardView>
    <RunningStopwatches>   section masquée si vide, réutilise StopwatchChip
    <DashboardGroup>       en retard, aujourd'hui, 7 jours, plus tard, sans date
      <DashboardCard>      lien Paths.CARDS, nom, projet / tableau, DueDateChip, labels
```

- Ajouter la vue à `HomeViews`, `HomeViewIcons` et `TOOLTIP_BY_VIEW` dans `HomeActions/RightSide`, ainsi que le `switch` de `Home.jsx`.
- Masquer dans `HomeActions` les contrôles qui ne concernent que les projets : recherche, tri, projets masqués.
- Conserver `GROUPED_PROJECTS` comme vue initiale.
- État vide utile : un message qui explique que seules les cartes dont on est membre apparaissent.
- Clés `en-US` et `fr-FR`.

**Fini quand** :

- la vue choisie est conservée après rechargement ;
- ouvrir une carte puis revenir en arrière ramène au tableau de bord ou permet d'y revenir simplement ;
- une carte terminée disparaît au rafraîchissement suivant.

### 5. Couvrir le parcours

`dashboard-view.feature` : activer la vue, voir une carte dont on est membre dans le bon groupe, l'ouvrir.

**Fini quand** le scénario passe en CI.

## Merge Danger

Porte réversible : si la valeur est retirée, les utilisateurs réglés sur `dashboard` doivent revenir sur une autre vue. Rayon d'action : uniquement ceux qui activent la vue.
