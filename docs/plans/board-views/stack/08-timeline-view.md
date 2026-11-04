# PR 08 - Vue timeline

**Branche :** `feat/timeline-view` · **Base :** `feat/card-start-date`

Spécification : [D13](../decisions.md#d13---timeline). C'est la vue la plus risquée, à cause du glisser-déposer.

## Étapes

### 1. Autoriser la vue

Ajouter `TIMELINE: 'timeline'` à `Board.Views`, avec le test habituel.

**Fini quand** ce test passe.

### 2. Écrire le calcul de placement

`Board/TimelineView/timeline-layout.js`, fonction `computeTimelineLayout(cards, lists, range, zoom)`. Tranches :

1. Début et échéance : une barre à la bonne position.
2. Début seul : un jalon. Échéance seule : un jalon.
3. Aucune date : carte non placée, comptée.
4. Barre partiellement hors plage : coupée, avec l'indication qu'elle continue.
5. Barre entièrement hors plage : absente du rendu, sans être comptée comme non placée.
6. Regroupement par liste, dans l'ordre des listes.
7. Liste sans carte visible : pas de ligne.
8. Zooms jour, semaine et mois : largeurs attendues écrites à la main.
9. Passage à l'heure d'été : une barre de 7 jours fait 7 colonnes (`TZ=Europe/Paris`).

**Fini quand** ces neuf cas passent.

### 3. Écrire le calcul de déplacement

`timeline-drag.js`, fonction `applyDrag(card, kind, deltaDays)`, avec `kind` valant `move`, `resize-start` ou `resize-end`. Tranches :

1. `move` décale les deux dates du même nombre de jours.
2. L'heure de chaque date est conservée, y compris à travers un changement d'heure (`addDays`, jamais un calcul en millisecondes).
3. `resize-start` et `resize-end` ne changent qu'une date.
4. Un redimensionnement qui inverserait les dates s'arrête à l'égalité.
5. `move` d'un jalon déplace sa seule date.
6. `deltaDays = 0` renvoie `null` : rien à enregistrer.

**Fini quand** ces six cas passent.

### 4. Enregistrer avec retour en arrière

`updateCard` n'annule rien en cas d'échec ([D13](../decisions.md#d13---timeline)).

- Nouvelle action et saga `rescheduleCard(id, { startDate, dueDate })`, dans `sagas/core/services/cards.js` :
  1. garder les valeurs précédentes ;
  2. appliquer le changement ;
  3. appeler l'API ;
  4. en cas d'échec, remettre les valeurs précédentes et afficher un toast via le `Toaster` existant.
- Ne pas changer `updateCard`, utilisé partout et dont le comportement vient du dépôt officiel.
- Une mise à jour par socket arrivée pendant le déplacement l'emporte sur la valeur gardée : ne restaurer que si la carte porte encore la valeur envoyée.

Pas de test de saga : ce seam n'est pas prévu. Le parcours d'échec est vérifié en acceptation, en faisant échouer la requête par le routage réseau de Playwright.

**Fini quand** une requête refusée remet la barre en place et affiche un message.

### 5. Construire la vue

```text
<TimelineView cardIds>
  useState(zoom, range)
  <TimelineToolbar>     zoom, précédent, aujourd'hui, suivant
  <ViewNotice>          N cartes sans date, limite
  <TimelineHeader>      colonnes de dates, ligne « aujourd'hui »
  <TimelineRows>        rendu limité aux lignes visibles
    <TimelineRow>       par liste
      <TimelineBar>     useTimelineDrag(), poignées de redimensionnement
      <TimelineMilestone>
```

- Glisser-déposer par Pointer Events, sans la bibliothèque de drag-and-drop du kanban, qui sert à réordonner et non à déplacer dans le temps. Aimantation au jour, aperçu pendant le déplacement, `Échap` pour annuler.
- Un clic sans déplacement ouvre la carte. Le seuil de déplacement distingue les deux.
- Sans droit d'édition (`isEditor` faux), pas de poignées ni de déplacement. La vérification réelle reste côté serveur.
- Registre, énumération, icône, clés `en-US` et `fr-FR`.

**Fini quand** :

- on peut déplacer et redimensionner à la souris ;
- le déplacement est visible en temps réel dans un second onglet ;
- une carte déplacée ne provoque pas d'ouverture de sa fenêtre ;
- avec 2 000 cartes, le défilement reste fluide, mesuré une fois et indiqué dans la PR.

### 6. Couvrir le parcours

`timeline-view.feature` : voir une barre, ouvrir la carte au clic, déplacer une barre et retrouver la date après rechargement, faire échouer la sauvegarde et voir la barre revenir.

**Fini quand** les scénarios passent en CI.

## Merge Danger

Porte réversible pour le code. Le glisser-déposer modifie de vraies dates : une erreur de calcul corromprait des échéances, d'où les tests de `timeline-drag.js`. Rayon d'action : les cartes déplacées dans cette vue. `updateCard` reste inchangé.
