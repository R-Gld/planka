# Vues de tableau et déploiement du fork

Plan complet d'un fork de PLANKA Community : cinq vues écrites de zéro, puis la mise en production sur un VPS. Une instance privée, sans usage commercial.

## Comment lire ce plan

1. [`decisions.md`](decisions.md) : les décisions prises et leur raison. C'est la référence en cas de doute.
2. [`architecture.md`](architecture.md) : les modules communs, le vocabulaire et les seams de test.
3. `stack/NN-*.md` : une PR par fichier, avec ses étapes et ses critères de fin.

Chaque fait ne figure qu'à un seul endroit. Une PR qui change une décision met à jour `decisions.md` dans le même commit.

## Périmètre

| Vue ou chantier | Résumé | PR |
|---|---|---|
| Calendrier | Cartes par échéance, vues mois et semaine | 03 |
| Média | Galerie des images et vidéos du tableau | 04 |
| Tableau de bord personnel | Vue d'accueil multi-projets | 05, 06 |
| Timeline | Barres et jalons, glisser-déposer | 07, 08 |
| Carte géographique | Position des cartes sur un fond OpenStreetMap | 09, 10 |
| Image Docker du fork | Construite par GitHub Actions | 11 |
| Kit de déploiement | Compose, Apache, sauvegardes, maintenance | 12 |
| Mise en service | Exécutée à la main, sans PR | 13 |

Hors périmètre : vraie version mobile, dépendances entre cartes, compatibilité avec une migration vers PLANKA Pro, traduction des 34 autres langues.

## La pile de PR

Chaque PR a pour base la branche de la précédente.

| # | Branche | Base | Plan |
|---|---|---|---|
| 00 | `docs/board-views-plan` | `master` | ce dossier |
| 01 | `chore/fork-foundation` | 00 | [01](stack/01-fork-foundation.md) |
| 02 | `refactor/board-view-registry` | 01 | [02](stack/02-board-view-registry.md) |
| 03 | `feat/calendar-view` | 02 | [03](stack/03-calendar-view.md) |
| 04 | `feat/media-view` | 03 | [04](stack/04-media-view.md) |
| 05 | `feat/dashboard-api` | 04 | [05](stack/05-dashboard-api.md) |
| 06 | `feat/dashboard-home-view` | 05 | [06](stack/06-dashboard-home-view.md) |
| 07 | `feat/card-start-date` | 06 | [07](stack/07-card-start-date.md) |
| 08 | `feat/timeline-view` | 07 | [08](stack/08-timeline-view.md) |
| 09 | `feat/card-location` | 08 | [09](stack/09-card-location.md) |
| 10 | `feat/map-view` | 09 | [10](stack/10-map-view.md) |
| 11 | `ci/fork-docker-image` | 10 | [11](stack/11-fork-docker-image.md) |
| 12 | `chore/deploy-kit` | 11 | [12](stack/12-deploy-kit.md) |
| — | aucune | — | [13](stack/13-go-live.md) |

### Règles de la pile

- **Cible des PR :** toujours `--repo R-Gld/planka`. Sur un fork, `gh pr create` vise par défaut le dépôt parent, et aucune PR ne doit y partir.
- **Avancement :** une PR est ouverte quand ses critères de fin sont remplis. Le travail continue sur la suivante sans attendre la revue, puisque la pile est prévue pour ça.
- **Correction après revue :** corriger sur la branche concernée, puis `git rebase --update-refs` depuis le sommet de la pile et `git push --force-with-lease` sur chaque branche touchée.
- **Fusion :** du bas vers le haut, en « merge commit ». Un squash réécrirait les commits et casserait les branches au-dessus. GitHub recible la PR suivante quand la branche de base est supprimée.
- **Identité de fusion :** toujours `gh pr merge --merge --author-email "$(git config user.email)"`. Sans cette option, GitHub écrit l'adresse principale du compte dans le commit de fusion, qui devient public.
- **Synchronisation avec `upstream` pendant la pile :** uniquement sur `master`, puis rebase de toute la pile.

## Critères communs à toute PR

Ils s'ajoutent aux critères de chaque plan. Une PR n'est ouverte que lorsqu'ils sont tous remplis.

- `npm run lint` passe à la racine.
- `npm run server:test`, `npm run server:test:postgres` et `npm run client:test` passent, et tout nouveau comportement a suivi le cycle rouge → vert à un seam prévu dans [`architecture.md`](architecture.md#seams-de-test).
- Une PR qui touche à l'interface a été vérifiée dans l'app lancée, avec une capture ou un scénario d'acceptation joint à la PR.
- Les chaînes nouvelles existent en `en-US` et `fr-FR` (voir [D8](decisions.md#d8---traductions)).
- Le diff respecte la [confidentialité](#confidentialité).
- Le corps de la PR suit le modèle Summary / Evidence / Merge Danger.

## Conventions

- **Langue :** commits, code et commentaires en anglais, comme le dépôt. Documents de ce dossier et corps de PR en français.
- **Commits :** [Conventional Commits](https://conventionalcommits.org), avec les règles de `CONTRIBUTING.md` (sujet en majuscule, 70 caractères au plus, impératif). Chaque commit laisse le dépôt stable.
- **En-tête des nouveaux fichiers :**

  ```js
  /*!
   * Part of a modified version of PLANKA (R-Gld/planka).
   * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
   */
  ```

  Le copyright de PLANKA Software GmbH reste en place sur les fichiers existants et n'est pas attribué au code nouveau.
- **npm :** npm 12 avec Node 24.15 ou plus. Les versions 11.x réécrivent les lockfiles sans changer de dépendance, et ce bruit ne doit pas entrer dans une PR.

## Confidentialité

Le dépôt est public. Seules des informations génériques y entrent : Apache, Docker Compose, restic, Let's Encrypt, GitHub Actions.

**Interdit dans le dépôt, les PR, les commits et les messages de CI :** nom de domaine ou sous-domaine réel, IP, fournisseur d'hébergement, port réel, chemins de la machine, nom du service de stockage des sauvegardes, identifiants, autres adresses e-mail, informations sur les utilisateurs et les autres services du serveur.

**À la place :** des valeurs factices comme `kanban.example.com`, `<PORT>` ou `<RESTIC_REPOSITORY>`. Les vraies valeurs vivent uniquement sur le serveur, dans des fichiers ignorés par git.

**Identité git :** les commits de ce dépôt sont signés et utilisent l'adresse publique choisie pour ce projet, en configuration locale. C'est la seule adresse autorisée dans l'historique. Vérifier avant chaque push :

```sh
git log --format='%ae %ce' origin/master..HEAD | sort -u
```

## Avancement

Mettre à jour cette ligne de chaque PR dans la PR elle-même, au moment où elle est ouverte.

| PR | État |
|---|---|
| 00 | fusionnée |
| 01 | en revue |
| 02 à 12 | à faire |
| Mise en service | à faire |
