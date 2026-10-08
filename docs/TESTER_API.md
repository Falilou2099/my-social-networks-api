# Tester l'API avec Swagger et Postman

## 1. Demarrer l'API

Depuis la racine du projet, renseigner les variables `MONGODB_URI` et `JWT_SECRET` dans `.env`, puis lancer :

```bash
npm install
npm run dev
```

Le serveur utilise `PORT` (3000 par defaut). Il doit pouvoir se connecter a MongoDB avant de commencer a ecouter.

## 2. Explorer Swagger

Avec le serveur demarre, ouvrir :

- Interface Swagger UI : <http://localhost:3000/docs>
- Document OpenAPI JSON : <http://localhost:3000/openapi.json>
- Sante du serveur : <http://localhost:3000/health>

Dans Swagger UI, ouvrir une operation pour consulter son resume et l'essayer. Les routes protegees utilisent un jeton Bearer : executer d'abord `POST /api/auth/login`, copier `data.token`, puis cliquer sur **Authorize** et saisir `Bearer <jeton>`.

## 3. Importer la collection Postman

1. Dans Postman, choisir **Import**.
2. Selectionner `postman/My-Social-Networks-API.postman_collection.json`.
3. Verifier la variable `baseUrl` (par defaut `http://localhost:3000`).
4. Ouvrir la collection, choisir **Run**, puis lancer les requetes dans l'ordre.

La collection cree un compte avec une adresse e-mail unique, se connecte, enregistre le JWT et les identifiants renvoyes par l'API, puis teste un groupe, un evenement, le fil de discussion, l'album et les commentaires, un sondage, la liste shopping, le covoiturage et la billetterie. Les scripts Postman verifient les codes HTTP et quelques donnees de reponse.

Le mot de passe de demonstration de la collection est uniquement un exemple local. La collection ne contient ni URI MongoDB, ni secret JWT, ni compte Atlas.

## 4. Resultats et donnees creees

Dans le Collection Runner, les assertions de chaque requete apparaissent dans **Test Results**. Une execution reussie termine sans assertion en echec. `GET /health`, `/openapi.json` et `/docs/` peuvent aussi etre executes seuls.

Les parcours d'inscription et de creation ajoutent des documents dans la base MongoDB configuree : compte, groupe, evenement et activites associees. L'e-mail d'inscription est unique a chaque execution; les documents de test ne sont pas automatiquement supprimes. Utiliser une base de developpement/test pour la collection.

## 5. Parcours manuel d'authentification

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"firstName":"Ada","lastName":"Lovelace","email":"ada@example.com","password":"une-phrase-de-passe-longue"}'

curl -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"ada@example.com","password":"une-phrase-de-passe-longue"}'
```

Copier le champ `data.token` de la seconde reponse pour appeler les routes protegees :

```bash
curl http://localhost:3000/api/auth/me \
  -H 'Authorization: Bearer <jeton>'
```
