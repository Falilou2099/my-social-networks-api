module.exports = {
  openapi: '3.0.3',
  info: {
    title: 'My Social Networks API',
    version: '1.0.0',
    description: 'Gestion des comptes, groupes, evenements, discussions et activites.'
  },
  servers: [{ url: '/api' }],
  components: {
    securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
    schemas: {
      Error: {
        type: 'object', properties: { error: { type: 'object', properties: {
          code: { type: 'string' }, message: { type: 'string' }, details: { type: 'array', items: { type: 'object' } }
        } } }
      }
    }
  },
  paths: {
    '/auth/register': { post: { summary: 'Creer un compte', responses: { 201: { description: 'Compte cree' }, 400: { description: 'Donnees invalides' }, 409: { description: 'Adresse deja utilisee' } } } },
    '/auth/login': { post: { summary: 'Ouvrir une session et obtenir un jeton JWT', responses: { 200: { description: 'Session ouverte' }, 401: { description: 'Identifiants incorrects' } } } },
    '/auth/me': { get: { summary: 'Afficher le compte connecte', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Compte courant' } } } },
    '/users/{id}': { get: { summary: 'Afficher un profil public', parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Profil' }, 404: { description: 'Utilisateur introuvable' } } } },
    '/users/me': { patch: { summary: 'Modifier son profil', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Profil modifie' } } } },
    '/groups': {
      get: { summary: 'Lister les groupes publics ou rejoints', responses: { 200: { description: 'Groupes' } } },
      post: { summary: 'Creer un groupe', security: [{ bearerAuth: [] }], responses: { 201: { description: 'Groupe cree' } } }
    },
    '/groups/{id}': { get: { summary: 'Consulter un groupe', responses: { 200: { description: 'Groupe' }, 404: { description: 'Groupe introuvable' } } }, patch: { summary: 'Modifier un groupe (administrateur)', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Groupe modifie' } } } },
    '/groups/{id}/join': { post: { summary: 'Rejoindre un groupe public ou prive', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Membre ajoute' } } } },
    '/groups/{id}/events': { post: { summary: 'Creer un evenement de groupe et inviter les membres', security: [{ bearerAuth: [] }], responses: { 201: { description: 'Evenement cree' } } } },
    '/events': {
      get: { summary: 'Lister les evenements publics ou accessibles', responses: { 200: { description: 'Evenements' } } },
      post: { summary: 'Creer un evenement', security: [{ bearerAuth: [] }], responses: { 201: { description: 'Evenement cree' } } }
    },
    '/events/{id}': { get: { summary: 'Consulter un evenement', responses: { 200: { description: 'Evenement' } } }, patch: { summary: 'Modifier un evenement (organisateur)', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Evenement modifie' } } } },
    '/events/{id}/rsvp': { post: { summary: 'Confirmer sa participation', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Participation confirmee' } } }, delete: { summary: 'Annuler sa participation', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Participation annulee' } } } },
    '/events/{id}/participants': { post: { summary: 'Inviter un participant (organisateur)', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Participant ajoute' } } } },
    '/threads/{id}/messages': { get: { summary: 'Lister les messages d un fil', responses: { 200: { description: 'Messages et reponses' } } }, post: { summary: 'Publier ou repondre a un message', security: [{ bearerAuth: [] }], responses: { 201: { description: 'Message publie' } } } },
    '/events/{eventId}/album': { get: { summary: 'Consulter l album de l evenement', responses: { 200: { description: 'Album photo' } } } },
    '/events/{eventId}/album/photos': { post: { summary: 'Ajouter une photo a l album', security: [{ bearerAuth: [] }], responses: { 201: { description: 'Photo ajoutee' } } } },
    '/events/{eventId}/polls': { get: { summary: 'Lister les sondages', responses: { 200: { description: 'Sondages' } } }, post: { summary: 'Creer un sondage (organisateur)', security: [{ bearerAuth: [] }], responses: { 201: { description: 'Sondage cree' } } } },
    '/polls/{pollId}/votes': { post: { summary: 'Repondre aux questions d un sondage', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Votes enregistres' }, 409: { description: 'Question deja repondue' } } } },
    '/polls/{pollId}/results': { get: { summary: 'Consulter les resultats du sondage', responses: { 200: { description: 'Resultats' } } } },
    '/events/{eventId}/ticket-types': { get: { summary: 'Lister les types de billets', responses: { 200: { description: 'Billets disponibles' } } }, post: { summary: 'Creer un type de billet (organisateur)', security: [{ bearerAuth: [] }], responses: { 201: { description: 'Type cree' } } } },
    '/ticket-types/{ticketTypeId}/purchases': { post: { summary: 'Reserver un billet nominatif', responses: { 201: { description: 'Billet reserve' }, 409: { description: 'Limite atteinte ou stock epuise' } } } },
    '/events/{eventId}/shopping-list': { get: { summary: 'Lister les apports', responses: { 200: { description: 'Liste des apports' } } }, post: { summary: 'Ajouter un apport unique a la liste', security: [{ bearerAuth: [] }], responses: { 201: { description: 'Apport ajoute' }, 409: { description: 'Nom deja reserve' } } } },
    '/events/{eventId}/carpools': { get: { summary: 'Lister les offres de covoiturage', responses: { 200: { description: 'Offres' } } }, post: { summary: 'Proposer un trajet', security: [{ bearerAuth: [] }], responses: { 201: { description: 'Trajet propose' } } } },
    '/carpools/{offerId}/join': { post: { summary: 'Reserver une place de covoiturage', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Place reservee' }, 409: { description: 'Aucune place disponible' } } } }
  }
};
