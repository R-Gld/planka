# PR 05 - API du tableau de bord

**Branche :** `feat/dashboard-api` · **Base :** `feat/media-view`

Spécification : [D10](../decisions.md#d10---tableau-de-bord). Seule lecture multi-tableaux du projet, donc la seule qui exige de nouveaux contrôles de droits.

## Interface

`GET /api/dashboard`, sans paramètre : l'utilisateur est toujours celui de la session, ce qui écarte toute lecture des cartes d'un autre.

```jsonc
{
  "items": [ /* cartes */ ],
  "included": {
    "boards": [ /* id, name, projectId */ ],
    "projects": [ /* id, name */ ],
    "lists": [ /* id, name, type */ ],
    "labels": [],
    "cardLabels": []
  }
}
```

Le classement par groupes reste côté client, car il dépend du fuseau du navigateur.

Une carte est renvoyée si **toutes** ces conditions sont vraies :

1. l'utilisateur est dans `card_membership` de la carte ;
2. il a accès au tableau, selon la même règle que `projects/index` : membre du tableau, responsable du projet, ou admin sur un projet partagé ;
3. la liste est de type `active` (archives, corbeille et listes fermées exclues) ;
4. `is_due_completed` n'est pas vrai.

Les chronomètres en cours sont dans les mêmes `items`, repérables par `stopwatch.startedAt` : la section en est dérivée côté client.

## Étapes

Tests dans la suite PostgreSQL, `server/test/postgres/dashboard.test.js`, car la requête doit s'exécuter pour de vrai. Une tranche à la fois :

1. Sans authentification : 401.
2. Carte dont l'utilisateur est membre : renvoyée.
3. Carte du même tableau dont il n'est pas membre : absente.
4. Carte dont il est encore membre, sur un tableau d'où il a été retiré : absente. C'est le test de droits le plus important.
5. Carte en archive, à la corbeille, en liste fermée : absentes.
6. Échéance terminée : absente. Sans date : présente. Chronomètre en cours : présent.
7. Plusieurs projets : tous présents, avec `boards`, `projects` et `lists` associés.
8. `included` ne contient aucun champ de `FORBIDDEN_FIELD_NAMES` et aucune donnée d'un tableau non lié à une carte renvoyée.
9. Responsable de projet et admin : la règle d'accès est la même que `projects/index`.

Implémentation :

- `Card.qm.getDashboardForUser(userId, boardIds)` dans `query-methods/models/Card.js`, requête unique.
- `api/helpers/cards/get-dashboard-for-user.js` : calcule les tableaux accessibles et assemble la réponse.
- `api/controllers/dashboard/show.js`, avec sa documentation Swagger, et la route dans `config/routes.js`.
- Un index sur `card_membership(user_id)` s'il n'existe pas déjà : vérifier le schéma, et ajouter la migration seulement si `EXPLAIN` montre un parcours complet.

**Fini quand** les neuf cas passent et que la réponse prend moins de 200 ms avec 5 000 cartes en base locale, mesuré une fois et indiqué dans la PR.

## Merge Danger

Porte réversible, en lecture seule. Rayon d'action : une erreur de droits exposerait des cartes d'autres tableaux, d'où la priorité donnée aux cas 3, 4 et 8.
