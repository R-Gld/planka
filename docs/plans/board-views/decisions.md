# Décisions

Chaque entrée indique le choix retenu et sa raison. Les décisions marquées **à valider** n'ont pas été discutées telles quelles avant la rédaction du plan : la revue de la PR 00 les confirme ou les change.

## Cadre

### D1 - Usage et licence

Usage strictement privé et non commercial. La licence Fair Use autorise ce cadre, ainsi que la distribution d'une version modifiée, à condition de conserver les avis de licence et de signaler les modifications.

Tout le code est écrit de zéro. Aucun code, texte ou visuel de PLANKA Pro n'est consulté ni repris, y compris sur sa démo publique. Les fonctionnalités sont définies uniquement par ce document.

### D2 - Dépôt

Fork public `R-Gld/planka`, avec le dépôt officiel en `upstream`. Le nouveau code reste regroupé et les fichiers existants sont touchés le moins possible, pour que les fusions restent simples. Aucune contribution vers le dépôt officiel.

### D3 - Passage à Pro

Non garanti. Le fork ajoute des colonnes et des valeurs d'énumération sans chercher à rester compatible avec une migration Pro, dont le schéma n'est pas connu.

### D4 - Livraison en pile de PR

Une pile de petites PR relues une à une, chaque vue restant isolée dans ses commits. Elle remplace l'idée initiale d'une seule grosse revue, sans changer l'objectif de tout livrer dans le même ensemble.

## Données et temps réel

### D5 - Les vues de tableau lisent le store existant (à valider)

Calendrier, timeline, carte et média lisent `Board.getFilteredCardsModelArray()` et les attachments déjà présents dans le store. Ils n'ajoutent aucun endpoint de lecture.

**Correction par rapport à la discussion initiale.** Des endpoints dédiés avaient été retenus à cause d'une limite supposée de 50 cartes. Vérification faite, cette limite ne concerne que `getByEndlessListId`, donc les archives et la corbeille. `boards/show` charge déjà toutes les cartes des listes `active` et `closed`, avec leurs membres, labels et pièces jointes.

Ce choix atteint les objectifs d'origine sans nouveau code serveur :

- aucune carte manquante ;
- mêmes droits, puisque l'accès au tableau est déjà contrôlé ;
- filtres du tableau conservés ;
- temps réel fourni par le canal `board:<id>` et les handlers de socket existants.

Seul le tableau de bord, qui couvre plusieurs tableaux, a besoin d'un endpoint ([D10](#d10---tableau-de-bord)).

### D6 - Volume visé

Moins de 50 utilisateurs et environ 5 000 cartes par tableau. Au-delà de `MAX_RENDERED_ITEMS` (voir [architecture](architecture.md#limite-daffichage)), une vue affiche un message clair et n'essaie pas de tout rendre.

### D7 - Niveau d'interaction

On consulte les cartes et on les ouvre dans la fenêtre de carte existante, qui reste le lieu d'édition. Seule exception : le glisser-déposer de la timeline. Pas de création de carte depuis les nouvelles vues.

### D8 - Traductions

`en-US` et `fr-FR` sont obligatoires, et les 34 autres langues se rabattent sur l'anglais à l'exécution.

**Conséquence (à valider) :** `npm run locales:check` est vert aujourd'hui, mais il échoue dès qu'une langue manque une clé, donc il passera au rouge à partir de la PR 02. Son en-tête prévoit ce cas, et il ne fait partie ni de `lint` ni de la CI.

Sa sortie donne le nombre de langues concernées par une clé, mais pas lesquelles, et ne permet donc pas de contrôler `fr-FR`. La [PR 02](stack/02-board-view-registry.md) ajoute une option `--only=fr-FR`, avec un code de sortie non nul si cette langue est incomplète. Ce contrôle ciblé devient le critère, et il est lancé en CI.

### D9 - Mobile

Pas de vraie version mobile. Les vues restent lisibles sur petit écran, sans promesse pour le glisser-déposer.

## Vues

### D10 - Tableau de bord

- Vue d'accueil optionnelle, activée dans le sélecteur. L'accueil par défaut reste celui d'aujourd'hui.
- Contenu : les cartes dont l'utilisateur est membre, tous projets confondus, sur des tableaux auxquels il a encore accès.
- Groupes : en retard, aujourd'hui, 7 prochains jours, plus tard, sans date. Les chronomètres en cours forment une section à part.
- Exclusions : cartes archivées ou à la corbeille, échéances terminées.
- **Cartes des listes fermées : exclues (à valider).** Une liste `closed` marque un travail fini, ce qui rejoint l'exclusion des échéances terminées. Ce cas n'a pas été discuté.
- Rafraîchissement au retour du focus et toutes les 60 secondes, sans abonnement à tous les tableaux.

### D11 - Calendrier

Basé sur `dueDate`, avec vues mois et semaine. Les échéances terminées restent visibles mais atténuées. Les cartes sans date sont masquées et comptées. Les heures suivent le fuseau du navigateur.

### D12 - Média

Images et vidéos seulement, les plus récentes d'abord. Les autres fichiers et les liens sont exclus. Aperçu au clic, avec un lien vers la carte.

### D13 - Timeline

- Colonne optionnelle `start_date`, avec la contrainte début ≤ échéance.
- Avec les deux dates, la carte est une barre. Avec une seule, c'est un jalon. Sans date, elle est masquée et comptée.
- Lignes regroupées par liste, zoom jour, semaine ou mois.
- Glisser-déposer pour déplacer et redimensionner, avec annulation visible si la sauvegarde échoue. Pas de dépendances.

**Conséquence :** `updateCard` applique le changement à l'écran et ne le retire pas si le serveur refuse, car aucun handler ne traite `CARD_UPDATE__FAILURE`. La timeline apporte donc son propre retour en arrière ([PR 08](stack/08-timeline-view.md)).

### D14 - Carte géographique

- Colonnes optionnelles `latitude`, `longitude` et `location_name`.
- Saisie dans la fenêtre de carte, par clic sur la carte ou recherche d'adresse.
- Leaflet avec les fonds OpenStreetMap et le géocodage Nominatim, déclenché seulement à la validation de la recherche.
- URL du fond configurable, marqueurs proches regroupés, compteur des cartes sans position.
- Le navigateur contacte ces services externes, ce qui est accepté pour cet usage.

**Bibliothèques :** `leaflet` 1.9 et `leaflet.markercluster` 1.5. `react-leaflet` 5 exige React 19 alors que le projet est en React 18.2. On se limite donc à Leaflet directement, enveloppé dans un seul module ([PR 10](stack/10-map-view.md)).

### D15 - Tests (à valider)

Les seams sont listés dans [`architecture.md`](architecture.md#seams-de-test). Le client n'a aujourd'hui que des tests Jest de fonctions pures et des tests d'acceptation Cucumber + Playwright, sans tests de composants React. Le plan garde ce modèle : logique en fonctions pures, parcours en acceptation, sans ajouter de bibliothèque de test de composants.

## Déploiement

### D16 - Hébergement

Un VPS, avec Apache en reverse proxy et l'application en Docker Compose. HTTPS public avec Let's Encrypt. Postgres n'est jamais exposé.

### D17 - Nom d'hôte (à valider)

La licence demande un accord écrit pour utiliser le nom PLANKA dans un nom de domaine. Le plan recommande donc un sous-domaine neutre, par exemple un équivalent de `kanban.example.com`. Le choix reste à toi : c'est un point juridique sur lequel seul l'éditeur peut trancher (license@planka.group).

### D18 - Image

`ghcr.io/r-gld/planka`, publique, en `amd64`, construite par GitHub Actions sur `ubuntu-latest` à chaque tag. Tags de version seulement en production, jamais `latest`. Les workflows de publication officiels sont désactivés sur le fork, car leurs jobs `self-hosted` resteraient bloqués sans runner.

### D19 - Connexion et comptes

- Base vierge, sans compte `demo`, avec des secrets générés.
- Un compte admin et des comptes normaux, avec 2FA activé à la main sur chacun, car rien ne permet de l'imposer.
- La limitation des connexions intégrée à Planka suffit, sans fail2ban, à une condition : le client ne doit pas pouvoir choisir l'IP vue par l'application.

**Risque d'usurpation d'IP.** Avec `TRUST_PROXY=true`, `utils/remote-address.js` retient `request.ips[0]`, soit l'adresse la plus à gauche de `X-Forwarded-For`. Apache ajoute l'IP réelle à la suite de l'en-tête reçu, donc cette première adresse peut venir du client. Sans correction, un attaquant contourne la limite par IP et fausse les journaux. Le proxy supprime donc l'en-tête entrant ([PR 12](stack/12-deploy-kit.md)), et la mise en service le vérifie avec un en-tête falsifié.

### D20 - E-mails et fichiers

SMTP par variables d'environnement, avec un envoi de test. 100 Mo maximum par fichier.

### D21 - Sauvegardes

`pg_dump` et volume `data` envoyés par restic vers un dépôt hors du VPS. Rétention de 30 jours. Restauration testée avant la mise en service.

L'application est arrêtée le temps de la sauvegarde, puis relancée même en cas d'échec. Un dump cohérent ne suffit pas : une pièce jointe supprimée entre le dump et la lecture des fichiers laisserait une référence SQL sans son fichier, car `attachments/delete-one.js` efface aussi le fichier. Cette courte interruption nocturne est acceptable pour cet usage. `docker-backup.sh` n'est pas utilisé, car il se présente lui-même comme un exemple.

### D22 - Maintenance

- Fusion d'`upstream` chaque mois, ou immédiatement en cas de faille annoncée, avec suivi des releases.
- Chaque fusion est testée en local, puis déployée après une sauvegarde.
- Vérification de disponibilité par un outil de surveillance externe.
- Le système du serveur reste géré par son administrateur, hors de ce plan.
