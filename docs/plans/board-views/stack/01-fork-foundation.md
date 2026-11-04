# PR 01 - Fondations du fork

**Branche :** `chore/fork-foundation` · **Base :** `docs/board-views-plan`

Rendre le fork conforme à la licence et fiable en CI, avant tout code de vue.

## Étapes

### 1. Signaler la version modifiée

- Ajouter en tête de `README.md` un encadré court : version modifiée et non officielle de PLANKA, ajouts listés, licence conservée, lien vers le dépôt officiel.
- Ne toucher à aucun autre contenu du README, pour limiter les conflits.

**Fini quand** l'avis est la première chose visible sur la page GitHub et que `LICENSE.md` et `LICENSES/` sont inchangés.

### 2. Faire tourner la CI sur toute la pile

`build-and-test.yml` et `lint.yml` ne se déclenchent que sur les PR visant `master`. Les PR empilées passeraient donc sans contrôle.

- Retirer le filtre `branches` de `pull_request` dans ces deux fichiers.

**Fini quand** le lint et le build se lancent sur une PR dont la base n'est pas `master`. Cette PR en est le premier exemple, puisque sa base est `docs/board-views-plan`.

### 3. Ajouter les tests serveur à la CI

`build-and-test.yml` ne lance que les tests d'acceptation.

- Ajouter un job avec un service Postgres, qui lance `npm run db:init` puis `npm test` dans `server/`, avec un `.env` de test construit comme le fait le job existant.

**Fini quand** le job passe et échoue bien si un test échoue, ce qu'on vérifie une fois avec un test volontairement faux, retiré avant le push final.

### 4. Corriger le blocage de `server:test`

Les 94 tests passent, mais `mocha` ne rend pas la main, et `test/mocha.opts` est vide.

- Chercher la cause (connexion ou timer resté ouvert après `sails.lower`) et la corriger si elle est simple.
- Sinon, ajouter `--exit` au script `test` de `server/package.json`, avec un commentaire qui explique pourquoi.

**Fini quand** `npm run server:test` se termine seul, avec le code 0, et qu'un test en échec donne un code différent de 0.

### 5. Figer les versions d'outils

- Ajouter `.nvmrc` à la racine, avec `24`.
- Dans `README.md`, indiquer npm 12 et Node 24.15 ou plus pour éviter le bruit dans les lockfiles.

**Fini quand** `npm install` avec ces versions laisse `git status` vide.

### 6. Désactiver les workflows de publication officiels

Réglage du dépôt, sans changement de fichier pour ne pas créer de conflit avec `upstream` :

```sh
gh workflow disable build-and-push-docker-image.yml --repo R-Gld/planka
gh workflow disable build-and-push-docker-nightly-image.yml --repo R-Gld/planka
gh workflow disable build-and-publish-release-package.yml --repo R-Gld/planka
gh workflow disable release-helm-chart.yml --repo R-Gld/planka
```

GitHub peut ne pas lister ces workflows tant que le fork n'a pas de run : refaire cette étape après le premier push si besoin.

**Fini quand** `gh workflow list --all` les montre désactivés. Consigner le résultat dans la PR.

## Merge Danger

Porte réversible. Rayon d'action : CI uniquement, plus un encadré dans le README.
