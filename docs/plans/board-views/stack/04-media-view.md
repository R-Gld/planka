# PR 04 - Vue média

**Branche :** `feat/media-view` · **Base :** `feat/calendar-view`

Spécification : [D12](../decisions.md#d12---média).

## Étapes

### 1. Autoriser la vue côté serveur

Ajouter `MEDIA: 'media'` à `Board.Views`, avec le même test que pour le calendrier.

**Fini quand** ce test passe.

### 2. Écrire la sélection pure

`Board/MediaView/media-attachments.js`, fonction `selectMediaItems(attachments, cardIds)`. Tranches :

1. Un fichier `image/png` est retenu.
2. Un fichier `video/mp4` est retenu.
3. `application/pdf` est exclu.
4. Un attachment de type `link` est exclu.
5. Un `mimeType` nul ne fait pas planter la fonction et l'élément est exclu.
6. Une carte hors de `cardIds` est exclue, ce qui applique les filtres du tableau.
7. Tri du plus récent au plus ancien.

**Fini quand** ces sept cas passent.

### 3. Construire la vue

```text
<MediaView>
  useSelector(attachments des cartes filtrées)
  <ViewNotice>        limite ou galerie vide
  <Gallery>           react-photoswipe-gallery, déjà une dépendance
    <MediaItem>       thumbnailUrls.outside360, loading="lazy"
                      <video preload="metadata"> pour les vidéos
```

- Réutiliser `react-photoswipe-gallery`, déjà utilisée par `Attachments/Item.jsx`, pour l'aperçu.
- Chaque élément porte le nom de la carte et un lien vers elle.
- Pagination côté client par 100, avec un bouton « Afficher plus ».
- Vérifier qu'une vidéo se lit et qu'on peut s'y déplacer (requêtes `Range` sur la route de téléchargement). Si la lecture dans PhotoSwipe n'est pas fiable, ouvrir la vidéo dans `ContentViewer` existant ou dans une balise `<video>` simple.
- Registre, énumération, icône, clés `en-US` et `fr-FR`.

**Fini quand** :

- une image ajoutée à une carte apparaît sans recharger la page ;
- une pièce jointe supprimée disparaît ;
- un fichier PDF n'apparaît jamais ;
- les filtres du tableau agissent sur la galerie.

### 4. Couvrir le parcours

`media-view.feature` : ajouter une image à une carte, passer en vue média, la voir, suivre le lien vers la carte.

**Fini quand** le scénario passe en CI.

## Merge Danger

Porte réversible. Rayon d'action : les tableaux qui utilisent la vue. Le chargement des miniatures peut peser sur les tableaux riches en images, d'où le `lazy` et la pagination.
