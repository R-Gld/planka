# PR 01 - Fondations du fork

**Branche :** `chore/fork-foundation` · **Base :** `docs/board-views-plan`

Rendre le fork conforme à la licence et fiable en CI, avant tout code de vue.

## Étapes

### 1. Signaler la version modifiée

- Ajouter en tête de `README.md` un encadré court : version modifiée et non officielle de PLANKA, ajouts listés, licence conservée, lien vers le dépôt officiel.
- Ne toucher à aucun autre contenu du README, pour limiter les conflits.

**Fini quand** l'avis est la première chose visible sur la page GitHub et que `LICENSE.md` et `LICENSES/` sont inchangés.

### 2. Faire tourner la CI sur toute la pile

Deux obstacles :

- **Workflows inactifs sur le fork.** Actions est activé, mais aucun workflow du dépôt n'y est enregistré, et aucun n'a tourné sur la PR 00. GitHub peut exiger une activation manuelle dans l'onglet Actions du fork : si l'API ne suffit pas, demander à l'administrateur du dépôt de le faire.
- **Filtre de branches.** `build-and-test.yml` et `lint.yml` ne se déclenchent que sur les PR visant `master`, donc les PR empilées passeraient sans contrôle. Retirer le filtre `branches` de `pull_request` dans ces deux fichiers.

**Fini quand** le lint et le build se lancent sur une PR dont la base n'est pas `master`. Cette PR en est le premier exemple, puisque sa base est `docs/board-views-plan`.

### 3. Créer la suite PostgreSQL

La suite existante tourne sur `sails-disk` en mémoire et n'atteint jamais PostgreSQL ([deux suites serveur](../architecture.md#deux-suites-serveur)).

- `server/test/postgres/lifecycle.test.js` : applique les migrations knex sur la base de test, puis lance Sails avec `datastores.default` sur `sails-postgresql` et cette même base. Les migrations et l'application utilisent donc le même schéma.
- Base lue dans `TEST_DATABASE_URL`, jamais dans `DATABASE_URL`. **Le harnais refuse de démarrer si le nom de la base ne finit pas par `_test`**, pour qu'il ne puisse pas toucher une base de dev ou de production.
- Données nettoyées entre les tests.
- Script `server:test:postgres` à la racine et `test:postgres` dans `server/`, documentés pour un usage local.
- `npm run server:test` garde son comportement actuel et n'exécute pas ce dossier.

Tests, une tranche à la fois :

1. Une requête brute sur `sails.sendNativeQuery` répond depuis PostgreSQL, ce qui prouve qu'on n'est pas sur `sails-disk`.
2. Une table issue d'une migration existe.
3. Une URL sans suffixe `_test` fait échouer le démarrage.

**Fini quand** ces trois cas passent en local.

### 4. Ajouter les tests serveur à la CI

`build-and-test.yml` ne lance que les tests d'acceptation.

- Ajouter un job qui lance `npm test` dans `server/`.
- Ajouter un job avec un service Postgres, qui lance `npm run test:postgres`.

**Fini quand** les deux jobs passent et échouent bien si un test échoue, ce qu'on vérifie une fois avec un test volontairement faux, retiré avant le push final.

### 5. Corriger le blocage de `server:test`

Les 94 tests passent, mais `mocha` ne rend pas la main, et `test/mocha.opts` est vide.

- Chercher la cause (connexion ou timer resté ouvert après `sails.lower`) et la corriger si elle est simple.
- Sinon, ajouter `--exit` au script `test` de `server/package.json`, avec un commentaire qui explique pourquoi.

**Fini quand** `npm run server:test` se termine seul, avec le code 0, et qu'un test en échec donne un code différent de 0.

### 6. Figer les versions d'outils

- Ajouter `.nvmrc` à la racine, avec `24`.
- Dans `README.md`, indiquer npm 12 et Node 24.15 ou plus pour éviter le bruit dans les lockfiles.

**Fini quand** `npm install` avec ces versions laisse `git status` vide.

### 7. Désactiver les workflows de publication officiels

Réglage du dépôt, sans changement de fichier pour ne pas créer de conflit avec `upstream` :

```sh
gh workflow disable build-and-push-docker-image.yml --repo R-Gld/planka
gh workflow disable build-and-push-docker-nightly-image.yml --repo R-Gld/planka
gh workflow disable build-and-publish-release-package.yml --repo R-Gld/planka
gh workflow disable release-helm-chart.yml --repo R-Gld/planka
```

À faire **avant** d'activer les workflows à l'étape 2 si GitHub le permet, sinon juste après : une fois actifs, ceux-ci pourraient se déclencher sur une release ou un push sur `master`.

**Fini quand** `gh workflow list --all` les montre désactivés. Consigner le résultat dans la PR.

## Merge Danger

Porte réversible. Rayon d'action : CI et outillage de test, plus un encadré dans le README. Le garde-fou sur le suffixe `_test` protège les autres bases.
