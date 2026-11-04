# PR 02 - Registre des vues

**Branche :** `refactor/board-view-registry` · **Base :** `chore/fork-foundation`

Refactoring sans changement de comportement, qui prépare l'ajout des vues. Voir [le registre](../architecture.md#registre-des-vues).

## Étapes

### 1. Créer le registre

- `client/src/components/boards/Board/board-view-registry.js`, avec les trois vues existantes et `MAX_RENDERED_ITEMS`.
- Test Jest : `getSelectableBoardViews(BOARD)` renvoie `kanban`, `grid`, `list` dans cet ordre, et les contextes `ARCHIVE` et `TRASH` renvoient `grid`, `list`.

`GridView` et `ListView` importent des composants, ce qui peut compliquer le test sous Jest. Si c'est le cas, séparer les métadonnées (`board-view-meta.js`, testé) de l'association avec les composants.

**Fini quand** le test passe.

### 2. Brancher les consommateurs

| Fichier | Changement |
|---|---|
| `BoardActions/RightSide/RightSide.jsx` | Liste et infobulles viennent du registre |
| `BoardSettingsModal/PreferencesPane/DefaultView.jsx` | Liste et descriptions viennent du registre |
| `Board/FiniteContent.jsx` | Le `switch` devient une lecture du registre |
| `Static/Static.jsx` | `isVerticalLayout` remplace la liste en dur |

Le sélecteur doit aussi passer à la ligne proprement quand il aura sept boutons sur un petit écran. On le vérifie ici à sept boutons factices, retirés avant le commit.

**Fini quand** les trois vues se comportent exactement comme avant, y compris en archive et en corbeille, vérifié à la main et par les tests d'acceptation.

### 3. Préparer le squelette commun des nouvelles vues

Le message de limite et le compteur de cartes non placées servent à plusieurs vues.

- `Board/ViewNotice.jsx` : affiche un compteur ou un message de limite.
- Clés de traduction `en-US` et `fr-FR` associées.

**Fini quand** le composant est utilisé par la PR 03, qui reste la preuve de son utilité. S'il n'y sert pas, le retirer plutôt que de le garder sans usage.

### 4. Contrôler les traductions françaises

Ces clés sont les premières à laisser les autres langues incomplètes, et la sortie actuelle de `client/scripts/check-locales.js` ne dit pas lesquelles ([D8](../decisions.md#d8---traductions)).

- Ajouter l'option `--only=<langue>` au script, sur `login.js` et `core.js`. Sans option, il garde son comportement actuel.
- Ajouter le script `locales:check:fr` dans `client/package.json` et le lancer en CI dans `lint.yml`.

**Fini quand** le contrôle passe, puis échoue avec un code non nul et le nom de la clé quand une clé est retirée temporairement de `fr-FR`, et passe même si d'autres langues sont incomplètes.

## Merge Danger

Porte réversible. Rayon d'action : sélecteur de vue et réglage de vue par défaut. Une régression toucherait tous les tableaux, d'où la vérification manuelle des trois contextes.
