# PR 09 - Position des cartes

**Branche :** `feat/card-location` · **Base :** `feat/timeline-view`

Spécification : [D14](../decisions.md#d14---carte-géographique).

## Étapes

### 1. Migration

`<date>_add_location_to_card.js` : `latitude` et `longitude` en `double precision` nullable, `location_name` en `text` nullable, et une contrainte `CHECK` : les deux coordonnées sont nulles ensemble ou renseignées ensemble.

Tests : `up` puis `down`, et rejet d'une ligne avec une seule coordonnée.

**Fini quand** ces tests passent.

### 2. API

Tests d'intégration d'abord :

1. `PATCH` avec latitude, longitude et nom : enregistrés.
2. Les trois à `null` : position effacée.
3. Une seule coordonnée : rejet par une erreur 422.
4. Latitude hors de -90 à 90, longitude hors de -180 à 180 : rejet.
5. Nom sans coordonnées : rejet.
6. Nom de plus de 255 caractères : rejet.
7. Lecture seule : refusé.
8. Duplication : position copiée.

Implémentation aux [points d'intégration habituels](../architecture.md#points-dintégration-côté-serveur), avec la règle de cohérence dans `update-one.js` et `create-one.js`.

**Fini quand** les huit cas passent.

### 3. Logique et URL configurables

- `src/utils/geo-location.js` : `parseLocation(input)` et `groupMappableCards(cards)`, testés en Jest (coordonnées valides, limites, valeurs nulles, cartes non placées).
- Variable serveur `MAP_TILE_URL`, avec l'URL OpenStreetMap comme valeur par défaut et son attribution dans `MAP_TILE_ATTRIBUTION`. Elles sont transmises au client par `api/controllers/config`, en suivant la façon dont le reste de la configuration publique est exposé, et documentées dans `.env.sample`.

Test : `GET /api/config` renvoie ces valeurs, sans exposer d'autre variable.

**Fini quand** ces tests passent.

### 4. Module Leaflet unique

`components/common/LeafletMap/` : seul endroit qui importe `leaflet`.

- Enveloppe une instance Leaflet dans un composant React, gère son cycle de vie et la mise à jour des marqueurs, et corrige les chemins d'icônes de Leaflet sous Vite.
- Interface : `center`, `zoom`, `markers`, `onMapClick`, `onMarkerClick`.
- Dépendances : `leaflet` 1.9, en version exacte, et leur licence vérifiée (BSD-2-Clause). Vérifier le lockfile avec npm 12.

**Fini quand** une carte s'affiche, sans erreur à l'ouverture et à la fermeture répétées de la fenêtre.

### 5. Édition dans la fenêtre de carte

```text
<ProjectContent>
  <LocationChip>        nom ou coordonnées
  <EditLocationStep>
    <input> + bouton     recherche Nominatim à la validation
    <LeafletMap>         clic pour placer, marqueur déplaçable
    Enregistrer / Retirer
```

- `src/api/geocoding.js` : `fetch` direct vers `https://nominatim.openstreetmap.org/search`, sans passer par `api/http.js` qui ajoute le jeton de session. **Le jeton ne doit jamais partir vers ce service**, et un test Jest vérifie que la requête ne contient pas d'en-tête `Authorization`.
- Pas d'autocomplétion : une requête par validation, comme l'exige la politique d'usage de Nominatim. L'attribution OpenStreetMap reste visible.
- Une panne du service n'empêche pas de placer la position par clic.
- Clés `en-US` et `fr-FR`.

**Fini quand** on peut poser une position par clic et par recherche, la corriger et la retirer, et qu'elle reste affichée après rechargement.

## Merge Danger

**Porte à sens unique pour les données :** `down` perd les positions. Rayon d'action : ajout d'une dépendance au bundle et, à l'usage, de requêtes externes depuis le navigateur, déclenchées seulement quand un fond de carte s'affiche ou qu'une recherche est validée.
