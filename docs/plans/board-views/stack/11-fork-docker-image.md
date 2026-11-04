# PR 11 - Image Docker du fork

**Branche :** `ci/fork-docker-image` · **Base :** `feat/map-view`

Spécification : [D18](../decisions.md#d18---image).

## Étapes

### 1. Ajouter le workflow

Nouveau fichier `.github/workflows/fork-docker-image.yml`, séparé des workflows officiels pour éviter les conflits avec `upstream` :

- déclencheur : `push` de tags `fork-v*` ;
- `runs-on: ubuntu-latest` ;
- `platforms: linux/amd64`, sans QEMU ;
- `permissions: contents: read, packages: write`, avec `GITHUB_TOKEN` ;
- tags d'image : la version du tag git, sans `latest` ;
- labels conservés : licence et source vers le fork.

Le `Dockerfile` existant reste inchangé, car il sait déjà construire le client et le serveur.

**Fini quand** `actionlint` ne signale rien, ou à défaut une relecture attentive si l'outil n'est pas disponible.

### 2. Vérifier en réel

- Après fusion, ou depuis la branche : pousser un tag de test `fork-v0.0.0-test`.
- Vérifier l'image : `docker pull`, démarrage avec Postgres en local, `/` répond, les sept vues sont proposées.
- Supprimer le tag et la version de test du registre.

**Fini quand** l'image se récupère sans authentification et démarre, ce qui est indiqué dans la PR, puis que le tag de test est supprimé.

### 3. Vérifier ce que contient l'image

Comme le dépôt et l'image sont publics, contrôler qu'aucun fichier de déploiement réel n'y entre, en relisant `.dockerignore` et le contenu de l'image.

**Fini quand** l'image ne contient ni `.env` ni fichier local.

## Merge Danger

Porte réversible. Rayon d'action : publication d'une image publique. Une version publiée peut être supprimée, mais a pu être récupérée entre-temps, d'où le contrôle de l'étape 3.
