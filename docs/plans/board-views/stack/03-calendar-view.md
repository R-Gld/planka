# PR 03 - Vue calendrier

**Branche :** `feat/calendar-view` · **Base :** `refactor/board-view-registry`

Spécification : [D11](../decisions.md#d11---calendrier).

## Étapes

### 1. Autoriser la vue côté serveur

- Ajouter `CALENDAR: 'calendar'` à `Board.Views` dans `server/api/models/Board.js`. La colonne `default_view` est un `text` sans contrainte, donc aucune migration.

Test serveur : `PATCH /api/boards/:id` accepte `defaultView: 'calendar'` et rejette une valeur inconnue.

**Fini quand** ce test passe.

### 2. Écrire la logique pure

`client/src/components/boards/Board/CalendarView/calendar-grid.js`. Cycles rouge → vert, une tranche à la fois :

1. `buildCalendarRange` en mode mois : 1er du mois un mercredi, début de semaine lundi. Le résultat commence le lundi d'avant.
2. Mois de février 2028 (bissextile).
3. Mode semaine.
4. Début de semaine dimanche, selon la locale.
5. `groupCardsByDay` : deux échéances le même jour local.
6. Échéance à 23 h 30 : reste sur son jour local.
7. Passage à l'heure d'été : aucun jour sauté ni doublé (test lancé avec `TZ=Europe/Paris`).
8. Carte sans `dueDate` : comptée à part.

**Fini quand** ces huit cas passent, avec des valeurs attendues écrites à la main.

### 3. Construire la vue

```text
<CalendarView> (entrée du registre, lit selectFilteredCardsForCurrentBoard)
  useState(anchor, mode)
  <CalendarToolbar>    précédent, aujourd'hui, suivant, mois/semaine
  <ViewNotice>         N cartes sans date
  <CalendarGrid>
    jour               +N au-delà de 4 cartes, qui déplie le jour au clic
      carte            lien vers Paths.CARDS, atténuée si isDueCompleted
```

- Ajouter `CALENDAR` à `BoardViews` et `BoardViewIcons`, et l'entrée au registre avec `contexts: [BOARD]`.
- Formater avec `date-fns` et la locale active, comme les composants existants. Le début de semaine vient de la locale.
- Les couleurs et thèmes suivent les variables SCSS du projet.
- Clés `en-US` et `fr-FR` : `action.switchToCalendarView`, `common.calendar`, description de la vue par défaut, boutons, compteur.

**Fini quand** :

- le changement d'échéance dans une carte déplace la carte sans recharger la page ;
- une carte modifiée par un autre onglet se met à jour en temps réel ;
- les filtres du tableau agissent sur le calendrier ;
- la vue est disponible comme vue par défaut, et le sélecteur ne la propose pas en archive ni en corbeille.

### 4. Couvrir le parcours

`client/tests/acceptance/features/calendar-view.feature` : passer en vue calendrier, voir une carte le jour de son échéance, l'ouvrir, la fermer et rester sur le calendrier.

**Fini quand** le scénario passe en CI.

## Merge Danger

Porte réversible : retirer la valeur d'énumération suffit, sauf pour les tableaux déjà réglés sur cette vue, qu'il faudrait remettre sur `kanban`. Rayon d'action : uniquement les tableaux qui utilisent la vue.
