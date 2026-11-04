# Architecture commune

## Vocabulaire

| Terme | Sens |
|---|---|
| **Vue de tableau** | Une façon d'afficher les cartes d'un tableau, comme `kanban`, `grid` ou `list`, enregistrée dans `Board.Views`. |
| **Registre des vues** | Le module client qui décrit toutes les vues de tableau en un seul endroit. |
| **Cartes filtrées** | Le résultat de `Board.getFilteredCardsModelArray()` : cartes des listes `active` et `closed`, après filtres du tableau. |
| **Carte planifiée** | Une carte qui a au moins une date utile à la vue courante. |
| **Barre / jalon** | Dans la timeline, une carte avec deux dates ou une seule. |
| **Carte non placée** | Une carte absente d'une vue parce qu'il lui manque la donnée requise. Elle est comptée, jamais ignorée en silence. |
| **Tableau de bord** | La vue d'accueil personnelle, alimentée par son propre endpoint. |

Dans ces documents, « carte » désigne une carte kanban, et « carte géographique » la vue basée sur Leaflet.

## Le socle existant

```text
boards/show ──> store redux-orm ──> getFilteredCardsModelArray()
                     ▲                        │
 sockets board:<id> ─┘                        ▼
 (cardUpdate, attachmentCreate...)     FiniteContent ──> vue active
```

Une vue de tableau n'a qu'à recevoir `cardIds` et les lire depuis le store. Le chargement, les droits, les filtres et le temps réel sont déjà assurés ([D5](decisions.md#d5---les-vues-de-tableau-lisent-le-store-existant-à-valider)).

Une carte s'ouvre en naviguant vers `Paths.CARDS`, et `Board.jsx` affiche alors `CardModal` par-dessus la vue courante. Les nouvelles vues réutilisent ce mécanisme.

## Registre des vues

Ajouter une vue touche aujourd'hui `Enums.js`, `Icons.js`, `RightSide.jsx`, `DefaultView.jsx`, `FiniteContent.jsx`, `Static.jsx` et les locales. Le registre concentre cette connaissance.

```js
// client/src/components/boards/Board/board-view-registry.js
export const getBoardView = (view) => /* descripteur */;
export const getSelectableBoardViews = (context) => /* descripteurs */;
```

Un descripteur contient `id`, `icon`, `tooltipKey`, `descriptionKey`, `Component`, `contexts` et `isVerticalLayout`.

- Ajouter une vue revient à ajouter une valeur à l'énumération, une entrée au registre et ses traductions.
- `contexts` limite les nouvelles vues à `BoardContexts.BOARD`. Les archives et la corbeille gardent leurs vues actuelles.
- `kanban` reste à part dans `Board.jsx`, qui l'affiche sans passer par `FiniteContent`.
- Les comparaisons sémantiques existantes restent en place : `view === KANBAN` dans `Header.jsx`, `ShortcutsProvider.jsx`, `Card/*` et `sagas/core/services/cards.js` signifient « kanban ou autre » et se comportent correctement pour les nouvelles vues. Il en va de même pour `isListView` dans `Filters.jsx`.

## Modules profonds

La logique difficile vit dans des fonctions pures, sans React ni store, testables par leur seule interface.

| Module | Interface | Ce qu'il cache |
|---|---|---|
| `calendar-grid.js` | `buildCalendarRange(anchor, mode, weekStartsOn)`, `groupCardsByDay(cards)` | Semaines à cheval sur deux mois, changements d'heure, fuseau local |
| `media-attachments.js` | `selectMediaItems(attachments, cardIds)` | Types MIME, liens exclus, tri |
| `dashboard-buckets.js` | `bucketDashboardCards(cards, now)` | Limites de jours locales et classement |
| `timeline-layout.js` | `computeTimelineLayout(cards, lists, range, zoom)` | Barres, jalons, cartes hors plage, cartes non placées |
| `timeline-drag.js` | `applyDrag(card, kind, deltaDays)` | Déplacement, redimensionnement, conservation de l'heure, contrainte début ≤ échéance |
| `geo-location.js` | `parseLocation(input)`, `groupMappableCards(cards)` | Validation des coordonnées, couple incomplet |

Côté serveur, `Card.qm.getDashboardForUser` et le helper `cards/get-dashboard-for-user` concentrent la requête et les droits du tableau de bord. Le contrôleur reste mince.

Pas de seam hypothétique : aucune abstraction de « fournisseur de carte » ou de « source de données » tant qu'une seule implémentation existe.

## Limite d'affichage

`MAX_RENDERED_ITEMS = 2000` par vue, défini dans le registre. Au-delà, la vue affiche les éléments les plus proches de la période ou les plus récents, avec un message qui donne le nombre total et invite à filtrer.

Autres protections :

- Calendrier : `+N` par jour au-delà de 4 cartes.
- Média : pages de 100 éléments, images en `loading="lazy"`, vidéos en `preload="metadata"`.
- Timeline : rendu limité aux lignes visibles.
- Carte géographique : regroupement des marqueurs.

## Seams de test

**Ces seams sont à valider dans la revue de la PR 00.** Aucun test n'est écrit ailleurs.

| Seam | Outil | Attrape | Laisse passer |
|---|---|---|---|
| Fonctions pures listées ci-dessus | Jest, valeurs attendues écrites à la main | Dates, classements, regroupements, validation | Rendu, navigateur |
| Endpoints et `PATCH /api/cards/:id` | Mocha + supertest, sur une vraie base | Droits, validation, forme des réponses, fuite de champs | Interface |
| Migrations | Mocha : `up` puis `down` sur la base de test | Schéma et réversibilité | Volume réel |
| Parcours complet d'une vue | Cucumber + Playwright, déjà en CI | Enregistrement de la vue, navigation, ouverture de carte | Finesse visuelle |

**Vérifié à la main, avec une capture dans la PR :** rendu visuel, glisser-déposer au pointeur, affichage sur petit écran, tuiles et Nominatim réels.

Pas de mock de la base : les tests serveur existants utilisent une vraie base, et ceux-ci aussi. Les services externes (Nominatim, tuiles) sont bloqués ou simulés dans les tests d'acceptation par le routage réseau de Playwright, pour que la CI n'en dépende pas.

## Points d'intégration côté serveur

Ajouter un champ à une carte touche toujours les mêmes endroits, vérifiés pour `dueDate` :

- une migration dans `server/db/migrations/` ;
- `api/models/Card.js`, attribut et documentation Swagger ;
- `api/controllers/cards/create.js` et `update.js`, entrées, documentation et listes de champs autorisés ;
- `api/helpers/cards/duplicate-one.js`, liste de champs copiés ;
- `api/helpers/cards/update-one.js` pour les règles entre champs.

Côté client :

- `src/api/cards.js`, `transformCard` et `transformCardData` pour les dates ;
- `src/models/Card.js`, `fields` et duplication.

## Migrations et fusions avec `upstream`

Les migrations du fork portent la date de leur création, comme celles du dépôt. knex les exécute dans l'ordre des noms de fichiers et ne relève une anomalie que si une migration déjà appliquée a disparu, donc une migration officielle plus ancienne qui arrive ensuite s'applique normalement.
