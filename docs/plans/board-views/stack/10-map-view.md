# PR 10 - Vue carte géographique

**Branche :** `feat/map-view` · **Base :** `feat/card-location`

Spécification : [D14](../decisions.md#d14---carte-géographique). Le module Leaflet existe déjà depuis la PR 09.

## Étapes

### 1. Autoriser la vue

Ajouter `MAP: 'map'` à `Board.Views`, avec le test habituel.

**Fini quand** ce test passe.

### 2. Regrouper les marqueurs

- Ajouter `leaflet.markercluster` 1.5, en version exacte, licence vérifiée (MIT).
- `LeafletMap` gagne une option `isClustered`, pour que ce module reste le seul à importer Leaflet.

**Fini quand** 2 000 marqueurs restent fluides, mesuré une fois et indiqué dans la PR.

### 3. Construire la vue

```text
<MapView cardIds>
  groupMappableCards(cards) -> { mappable, unplacedCount }
  <ViewNotice>       N cartes sans position
  <LeafletMap isClustered>
    marqueur -> popup : nom de la carte, liste, lien Paths.CARDS
```

- Cadrage initial sur l'ensemble des marqueurs, et vue du monde si aucune carte n'a de position.
- Le cadrage n'est recalculé qu'à l'ouverture : une mise à jour en temps réel ne déplace pas ce que l'utilisateur regarde.
- `isVerticalLayout` et la hauteur doivent laisser à Leaflet une zone de taille non nulle, avec `invalidateSize()` si le conteneur change.
- Registre, énumération, icône, clés `en-US` et `fr-FR`.

**Fini quand** :

- une position modifiée dans un autre onglet déplace le marqueur en temps réel ;
- les filtres du tableau agissent sur les marqueurs ;
- un fond de carte en panne laisse les marqueurs utilisables et n'empêche pas le reste de l'app de fonctionner ;
- une URL `MAP_TILE_URL` personnalisée est bien utilisée.

### 4. Couvrir le parcours

`map-view.feature`, avec les tuiles simulées par le routage réseau de Playwright pour ne pas dépendre d'OpenStreetMap en CI : voir le marqueur d'une carte, ouvrir la carte depuis sa popup, voir le compteur des cartes sans position.

**Fini quand** le scénario passe en CI.

### 5. Vérification d'ensemble

C'est la dernière PR fonctionnelle. Passer sur chaque vue, avec un tableau de 5 000 cartes générées localement :

- sélecteur à sept boutons, sur grand et petit écran ;
- chaque vue choisie comme vue par défaut ;
- thèmes et contraste ;
- archives et corbeille inchangées ;
- `locales:check` sans clé manquante pour `fr-FR`.

**Fini quand** tous les points sont vérifiés et consignés dans la PR, et que tout écart a été corrigé dans la PR concernée.

## Merge Danger

Porte réversible. Rayon d'action : les tableaux qui utilisent la vue, et le poids du bundle.
