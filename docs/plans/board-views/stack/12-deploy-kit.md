# PR 12 - Kit de déploiement

**Branche :** `chore/deploy-kit` · **Base :** `ci/fork-docker-image`

Spécification : [D16 à D22](../decisions.md#déploiement). Tout est générique : **aucune valeur réelle** n'entre dans le dépôt ([confidentialité](../README.md#confidentialité)).

## Contenu

```text
deploy/
├── README.md                 procédure
├── docker-compose.yml        application et Postgres
├── .env.example              variables, valeurs factices
├── apache-vhost.conf.example
├── backup.sh                 dump + restic
├── restore.sh
└── MAINTENANCE.md            mises à jour et fusion d'upstream
```

`.gitignore` ignore `deploy/.env` et `deploy/*.local*`.

## Étapes

### 1. Compose

- `planka` : image `ghcr.io/r-gld/planka:${IMAGE_TAG}`, jamais `latest`.
- Port : `127.0.0.1:${APP_PORT}:1337`, jamais sur toutes les interfaces.
- `postgres:16-alpine` sur un réseau `internal`, sans port publié, avec `POSTGRES_PASSWORD` et sans mode `trust`.
- Volumes nommés, healthchecks, `restart: unless-stopped`.

**Fini quand** `docker compose config` passe avec `.env.example`, et que la pile démarre en local sur une machine de test, sans Postgres joignable depuis l'hôte.

### 2. Variables

`.env.example` documente chaque variable avec une valeur factice et, pour les secrets, la commande qui les génère :

- `BASE_URL=https://kanban.example.com`, `TRUST_PROXY=true`, `SECRET_KEY`, `POSTGRES_PASSWORD` ;
- `SMTP_*` ;
- `MAX_UPLOAD_FILE_SIZE` à 100 Mo, dans le format réel attendu par `envToBytes`, à vérifier dans le code ;
- `MAP_TILE_URL` et `MAP_TILE_ATTRIBUTION`, optionnelles ;
- pas de `DEFAULT_ADMIN_PASSWORD` permanent : la procédure utilise `db:create-admin-user`, à vérifier dans l'image.

**Fini quand** chaque variable utilisée par le compose existe dans l'exemple, et l'inverse.

### 3. Apache

Modèle générique : redirection HTTP vers HTTPS, `ProxyPreserveHost`, `X-Forwarded-Proto: https`, en-têtes de sécurité, et WebSockets relayés **avant** le `ProxyPass /` :

```apache
ProxyPass /socket.io/ ws://127.0.0.1:<PORT>/socket.io/
ProxyPassReverse /socket.io/ ws://127.0.0.1:<PORT>/socket.io/
ProxyPass / http://127.0.0.1:<PORT>/
ProxyPassReverse / http://127.0.0.1:<PORT>/
```

- Indiquer les modules nécessaires (`proxy_http`, `proxy_wstunnel`, `headers`, `ssl`).
- Vérifier que `TimeOut` et `ProxyTimeout` laissent passer un envoi de 100 Mo.
- Le modèle n'ajoute pas de `Content-Security-Policy` : si l'administrateur en a une, il doit autoriser le serveur de tuiles et Nominatim.

**Fini quand** le modèle est testé derrière un Apache local en conteneur, avec le temps réel fonctionnel (`/socket.io` passe bien en WebSocket) et l'IP du client transmise.

### 4. Sauvegarde et restauration

`backup.sh` et `restore.sh`, configurés uniquement par variables d'environnement (`RESTIC_REPOSITORY`, `RESTIC_PASSWORD_FILE`) :

- `pg_dump` cohérent, jamais une copie à chaud des fichiers de Postgres ;
- volume `data` et dump envoyés par `restic backup` ;
- `restic forget --keep-daily 30 --prune` ;
- `set -euo pipefail` et code de sortie différent de 0 en cas d'échec, pour que le planificateur le remarque.

Ils peuvent être lancés seuls ou appelés par un autre script ou un planificateur.

**Fini quand** une sauvegarde suivie d'une restauration, vers un dépôt restic local et une pile vide, redonne exactement les mêmes cartes et pièces jointes.

### 5. Procédure et maintenance

- `deploy/README.md` : déploiement pas à pas, vérifications après chaque étape, retour à la version précédente en changeant `IMAGE_TAG`. Pour un retour après migration, restaurer la sauvegarde prise avant la mise à jour.
- `MAINTENANCE.md` : fusion mensuelle d'`upstream` ([D22](../decisions.md#d22---maintenance)), test local, tag, sauvegarde, déploiement. Abonnement aux releases GitHub. Marche à suivre en cas de faille annoncée.

**Fini quand** la procédure a été suivie du début à la fin sur une machine de test, sans étape implicite, et que `grep` ne trouve aucune valeur réelle dans `deploy/`.

## Merge Danger

Porte réversible. Rayon d'action : rien en production tant que la mise en service n'a pas lieu. Le risque principal est une fuite d'information, d'où le contrôle de confidentialité.
