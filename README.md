# My Social Networks API

API REST en Node.js (modules ES `.mjs`), Express et MongoDB pour gerer des utilisateurs, des groupes et des evenements avec leurs discussions et activites.

## Prerequis

- Node.js 18 ou plus recent
- MongoDB local ou une instance accessible par URI

## Installation et demarrage

```bash
npm install
cp .env.example .env
```

Renseigner `MONGODB_URI` et remplacer `JWT_SECRET` par une valeur longue et aleatoire, puis lancer :

```bash
npm run dev
```

L'API ecoute par defaut sur `http://localhost:3000`. La page interactive est disponible sur `/docs`, le document OpenAPI sur `/openapi.json` et l'etat du service sur `/health`.

La collection Postman importable est dans [`postman/My-Social-Networks-API.postman_collection.json`](postman/My-Social-Networks-API.postman_collection.json).

## Authentification

Creer un compte avec `POST /api/auth/register`, puis obtenir un jeton avec `POST /api/auth/login`. Pour les routes protegees, envoyer :

```http
Authorization: Bearer <jeton>
```

Les mots de passe sont haches avec bcrypt. L'adresse e-mail est unique et normalisee en minuscules. Les erreurs suivent cette structure :

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Les donnees fournies sont invalides",
    "details": [{ "field": "email", "message": "Invalid value" }]
  }
}
```

## Principales routes

Toutes les routes ci-dessous sont prefixees par `/api`.

| Methode | Route | Acces / usage |
| --- | --- | --- |
| POST | `/auth/register` | Inscription (`firstName`, `lastName`, `email`, `password`) |
| POST | `/auth/login` | Connexion et emission du jeton JWT |
| GET | `/auth/me` | Profil du compte connecte |
| GET, PATCH | `/users/:id`, `/users/me` | Profil public / modification de son profil |
| GET, POST | `/groups` | Groupes visibles / creation d'un groupe |
| GET, PATCH | `/groups/:id` | Consultation et modification par un administrateur |
| POST | `/groups/:id/join` | Rejoindre un groupe public ou prive; les groupes secrets sont sur invitation |
| DELETE | `/groups/:id/members/:userId` | Quitter ou retirer un membre |
| POST | `/groups/:id/admins/:userId` | Nommer un administrateur |
| POST | `/groups/:id/events` | Creer un evenement et inviter les membres du groupe |
| GET, POST | `/events` | Lister les evenements accessibles / creer un evenement |
| GET, PATCH | `/events/:id` | Consulter ou modifier un evenement |
| POST, DELETE | `/events/:id/rsvp` | Confirmer ou annuler sa participation |
| POST | `/events/:id/organizers`, `/events/:id/participants` | Ajouter un organisateur ou inviter un participant |
| GET, POST | `/threads/:id/messages` | Lire, publier ou repondre (`parentId`) dans un fil |
| GET | `/events/:eventId/album` | Album et commentaires de photos |
| POST | `/events/:eventId/album/photos` | Ajouter une photo (`url`, `caption` optionnel) |
| POST | `/events/:eventId/album/photos/:photoId/comments` | Commenter une photo |
| GET, POST | `/events/:eventId/polls` | Lister les sondages / creation par organisateur |
| POST | `/polls/:pollId/votes` | Repondre avec `answers: [{ questionId, optionId }]` |
| GET | `/polls/:pollId/results` | Resultats agreges du sondage |
| GET, POST | `/events/:eventId/ticket-types` | Types de billets / creation par organisateur |
| POST | `/ticket-types/:ticketTypeId/purchases` | Reserver un billet avec les coordonnees du participant |
| GET, POST | `/events/:eventId/shopping-list` | Voir ou completer la liste (option activee) |
| GET, POST | `/events/:eventId/carpools` | Voir ou proposer un trajet (option activee) |
| POST | `/carpools/:offerId/join` | Reserver une place disponible |

## Regles de gestion

- Un organisateur est automatiquement participant de son evenement; un groupe conserve son createur comme premier administrateur.
- La creation d'un evenement depuis un groupe ajoute les membres du groupe comme participants. Un groupe peut interdire la creation d'evenements ou les publications de ses membres.
- Un fil appartient a exactement un evenement ou un groupe. Les reponses sont des messages rattaches au message parent dans le meme fil.
- Les sondages appartiennent a un evenement, sont crees par un organisateur, et un participant ne peut voter qu'une fois par question. Une requete peut contenir une reponse pour chaque question.
- La billetterie ne s'ouvre que pour les evenements publics dont l'organisateur a active l'option. Une adresse e-mail ne peut obtenir qu'un billet par evenement et le stock restant est reserve de maniere atomique. Aucun paiement n'est traite par cette API.
- Les noms d'articles de la liste sont uniques par evenement sans tenir compte de la casse. Le covoiturage decremente les places de maniere atomique.
- Les URLs de couverture, d'icone et de photo sont stockees comme references; l'API ne televerse pas de fichiers.
- Les dates sont transmises en ISO 8601 avec fuseau horaire. Les montants sont exprimes dans la devise indiquee, par defaut EUR.

## Exemple rapide

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"firstName":"Ada","lastName":"Lovelace","email":"ada@example.com","password":"une-phrase-de-passe-longue"}'
```

Apres connexion, utiliser le jeton obtenu pour creer un evenement :

```bash
curl -X POST http://localhost:3000/api/events \
  -H 'Authorization: Bearer <jeton>' -H 'Content-Type: application/json' \
  -d '{"name":"Rencontre","description":"Une rencontre ouverte","startsAt":"2027-05-20T17:00:00Z","endsAt":"2027-05-20T20:00:00Z","location":"Paris","visibility":"public"}'
```
