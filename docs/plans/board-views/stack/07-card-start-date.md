# PR 07 - Date de début des cartes

**Branche :** `feat/card-start-date` · **Base :** `feat/dashboard-home-view`

Spécification : [D13](../decisions.md#d13---timeline). Les fichiers à modifier sont listés dans [les points d'intégration](../architecture.md#points-dintégration-côté-serveur).

## Étapes

### 1. Migration

`server/db/migrations/<date>_add_start_date_to_card.js` : colonne `start_date`, `timestamp` nullable, avec `down` qui la retire.

Tests dans la suite PostgreSQL : `up` puis `down`.

**Fini quand** les cartes existantes gardent `start_date = null` et que `down` restaure le schéma.

### 2. API

Tests dans la suite PostgreSQL d'abord, une tranche à la fois :

1. `PATCH` avec `startDate` : enregistré et renvoyé.
2. `startDate: null` : efface la date.
3. `startDate` après `dueDate` : rejeté par une erreur 422 claire, et rien n'est enregistré.
4. Modifier seulement `dueDate` pour la placer avant le `startDate` existant : rejeté. La règle compare les valeurs fusionnées, pas seulement celles de la requête.
5. Dates égales : acceptées.
6. Un seul des deux champs renseigné : accepté.
7. Utilisateur en lecture seule : refusé, comme pour `dueDate`.
8. `POST` de création avec `startDate`.
9. Duplication d'une carte : `startDate` copié.

Implémentation :

- `Card.js`, entrées et Swagger de `cards/create.js` et `cards/update.js`, listes de champs autorisés (`update.js` en a deux).
- Règle dans `helpers/cards/update-one.js`, à côté de celle de `dueDate`, avec la même règle à la création dans `create-one.js`.
- `duplicate-one.js`.

**Fini quand** les neuf cas passent.

### 3. Client

- `transformCard` et `transformCardData` dans `src/api/cards.js`.
- `startDate` dans `fields` et dans la duplication de `models/Card.js`.
- Ajouter un test Jest des transformations si elles deviennent autre chose qu'une conversion directe.

**Fini quand** la date survit à un aller-retour et à une mise à jour par socket.

### 4. Édition dans la fenêtre de carte

`EditDueDateStep` sait déjà saisir une date. Selon sa forme, soit le généraliser avec le champ cible et le libellé en props, soit créer `EditStartDateStep` qui s'appuie sur les mêmes composants internes. Le choix se fait à la lecture du code, en préférant ne pas dupliquer sa logique.

- `ProjectContent.jsx` : bloc « Début » à côté de « Échéance », avec un `StartDateChip` ou un `DueDateChip` adapté, sans la couleur d'alerte d'échéance.
- `StoryContent.jsx` n'a qu'une référence à `dueDate` : vérifier son usage et n'ajouter le début que si les cartes « story » affichent vraiment une échéance.
- Message clair quand le début est après l'échéance : l'interface empêche le cas avant même l'envoi.
- Clés `en-US` et `fr-FR`.

**Fini quand** on peut poser, changer et effacer un début dans la fenêtre de carte, et que la date reste affichée après rechargement. Capture dans la PR.

## Merge Danger

**Porte à sens unique pour les données :** la migration est réversible, mais `down` perd les dates saisies. Rayon d'action : toutes les cartes reçoivent une colonne nullable, sans réécriture coûteuse. Le contrat d'API gagne un champ optionnel, et les clients existants ne sont pas touchés.
