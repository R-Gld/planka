# Étape 13 - Mise en service

Aucune PR. Cette étape est exécutée sur le serveur par son administrateur, en suivant `deploy/README.md`. Il n'y a aucun accès au serveur depuis l'outil de développement, et aucune valeur réelle ne doit revenir dans le dépôt.

**Prérequis :** toutes les PR fusionnées, puis une image publiée avec un tag `fork-v1.0.0`.

## Checklist

Chaque point se termine sur une observation concrète.

### Installation

- [ ] Sous-domaine choisi ([D17](../decisions.md#d17---nom-dhôte-à-valider)) et enregistrement DNS créé. `dig` renvoie l'adresse attendue.
- [ ] Port local libre : `ss -ltn` ne montre rien sur ce port.
- [ ] `.env` créé sur le serveur, avec des secrets générés et des droits `600`.
- [ ] `docker compose up -d` : les deux conteneurs sont `healthy`.
- [ ] Postgres injoignable depuis l'extérieur et l'hôte. L'application n'écoute que sur `127.0.0.1`.
- [ ] Vhost activé et `apachectl configtest` valide. Le certificat couvre le sous-domaine.

### Comptes et sécurité

- [ ] Compte admin créé, conditions d'utilisation acceptées.
- [ ] Comptes normaux créés pour les autres utilisateurs.
- [ ] 2FA activé sur tous les comptes, codes de récupération rangés en lieu sûr.
- [ ] Aucun compte `demo`, et `SECRET_KEY` différente de `notsecretkey`.
- [ ] `SHOW_DETAILED_AUTH_ERRORS` non activé.
- [ ] **Limitation des connexions :** depuis une IP externe, répéter les échecs jusqu'au blocage, puis vérifier dans les journaux de l'application que l'IP enregistrée est bien la vraie IP cliente et non `127.0.0.1`. Sinon, corriger la transmission de l'IP avant d'ouvrir l'accès, car tous les clients partageraient une même limite.
- [ ] **Usurpation d'IP :** refaire le test en envoyant un `X-Forwarded-For` différent à chaque essai. Le blocage arrive au même moment, et les journaux montrent toujours la vraie IP. Vérifier aussi une connexion WebSocket. Tant que ce point échoue, le service ne doit pas être ouvert ([D19](../decisions.md#d19---connexion-et-comptes)).

### Fonctionnement

- [ ] HTTPS valide et redirection depuis HTTP.
- [ ] Temps réel : une carte modifiée dans un navigateur change dans un autre, sans recharger.
- [ ] Les sept vues de tableau et le tableau de bord fonctionnent.
- [ ] Fond de carte et recherche d'adresse fonctionnels.
- [ ] Envoi d'un fichier de près de 100 Mo réussi, et refus au-delà.
- [ ] E-mail de test reçu, sans tomber dans les indésirables.

### Sauvegardes

- [ ] `backup.sh` programmé pour une exécution quotidienne.
- [ ] Une première sauvegarde visible avec `restic snapshots`.
- [ ] L'application redémarre seule après une sauvegarde, y compris après un échec provoqué.
- [ ] **Restauration testée** vers une pile séparée : cartes et pièces jointes retrouvées, chaque pièce jointe avec son fichier.
- [ ] Mot de passe du dépôt restic conservé hors du serveur. Sans lui, les sauvegardes sont perdues.

### Exploitation

- [ ] Vérification de disponibilité active, avec une alerte reçue lors d'un arrêt volontaire.
- [ ] Abonnement aux releases du dépôt officiel.
- [ ] Rappel mensuel de fusion d'`upstream` en place.

## Fini quand

Toutes les cases sont cochées et que chaque utilisateur s'est connecté avec son 2FA depuis son propre réseau. Le tableau d'avancement du [README](../README.md#avancement) passe alors à « terminé », dans une PR de documentation sans aucune valeur réelle.
