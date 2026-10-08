const router = require('express').Router();
const { body } = require('express-validator');
const Event = require('../models/Event');
const Album = require('../models/Album');
const Poll = require('../models/Poll');
const TicketType = require('../models/TicketType');
const TicketPurchase = require('../models/TicketPurchase');
const ShoppingItem = require('../models/ShoppingItem');
const CarpoolOffer = require('../models/CarpoolOffer');
const { authenticate, optionalAuthenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');
const httpError = require('../utils/httpError');

const includes = (list, id) => list.some((item) => String(item?._id || item) === String(id));
async function loadEvent(id) {
  const event = await Event.findById(id);
  if (!event) throw httpError(404, 'Evenement introuvable', 'EVENT_NOT_FOUND');
  return event;
}
function participantOnly(event, userId) {
  if (!includes(event.participants, userId) && !includes(event.organizers, userId)) throw httpError(403, 'Participation a l evenement requise', 'FORBIDDEN');
}
function organizerOnly(event, userId) {
  if (!includes(event.organizers, userId)) throw httpError(403, 'Droits organisateur requis', 'FORBIDDEN');
}
function featureEnabled(event, field) {
  if (!event[field]) throw httpError(403, 'Cette fonctionnalite est desactivee pour cet evenement', 'FEATURE_DISABLED');
}

// Albums and event photos
router.get('/events/:eventId/album', optionalAuthenticate, asyncHandler(async (req, res) => {
  const event = await loadEvent(req.params.eventId);
  participantOnly(event, req.user?.id);
  const album = await Album.findOne({ event: event.id }).populate('photos.postedBy', 'firstName lastName').populate('photos.comments.author', 'firstName lastName');
  res.json({ data: album || { event: event.id, title: 'Photos de l evenement', photos: [] } });
}));

router.post('/events/:eventId/album/photos', authenticate,
  body('url').isURL({ require_protocol: true }).isLength({ max: 2048 }), body('caption').optional().isLength({ max: 500 }), validate,
  asyncHandler(async (req, res) => {
    const event = await loadEvent(req.params.eventId);
    participantOnly(event, req.user.id);
    let album = await Album.findOne({ event: event.id });
    if (!album) album = new Album({ event: event.id });
    album.photos.push({ url: req.body.url, caption: req.body.caption, postedBy: req.user.id });
    await album.save();
    res.status(201).json({ data: album.photos.at(-1) });
  }));

router.post('/events/:eventId/album/photos/:photoId/comments', authenticate,
  body('body').trim().notEmpty().isLength({ max: 1000 }), validate,
  asyncHandler(async (req, res) => {
    const event = await loadEvent(req.params.eventId);
    participantOnly(event, req.user.id);
    const album = await Album.findOne({ event: event.id });
    const photo = album?.photos.id(req.params.photoId);
    if (!photo) throw httpError(404, 'Photo introuvable', 'PHOTO_NOT_FOUND');
    photo.comments.push({ author: req.user.id, body: req.body.body });
    await album.save();
    res.status(201).json({ data: photo.comments.at(-1) });
  }));

// Polls: one response per participant and question, with one selected option.
router.get('/events/:eventId/polls', optionalAuthenticate, asyncHandler(async (req, res) => {
  const event = await loadEvent(req.params.eventId);
  participantOnly(event, req.user?.id);
  res.json({ data: await Poll.find({ event: event.id }).select('-votes').populate('createdBy', 'firstName lastName') });
}));

router.post('/events/:eventId/polls', authenticate,
  body('title').trim().notEmpty().isLength({ max: 160 }),
  body('questions').isArray({ min: 1 }),
  body('questions.*.text').trim().notEmpty().isLength({ max: 500 }),
  body('questions.*.options').isArray({ min: 2 }),
  body('questions.*.options.*.text').trim().notEmpty().isLength({ max: 300 }), validate,
  asyncHandler(async (req, res) => {
    const event = await loadEvent(req.params.eventId);
    organizerOnly(event, req.user.id);
    const poll = await Poll.create({ event: event.id, createdBy: req.user.id, title: req.body.title, questions: req.body.questions });
    res.status(201).json({ data: poll });
  }));

router.post('/polls/:pollId/votes', authenticate,
  body('answers').isArray({ min: 1 }),
  body('answers.*.questionId').isMongoId(), body('answers.*.optionId').isMongoId(), validate,
  asyncHandler(async (req, res) => {
    const poll = await Poll.findById(req.params.pollId);
    if (!poll) throw httpError(404, 'Sondage introuvable', 'POLL_NOT_FOUND');
    const event = await loadEvent(poll.event);
    participantOnly(event, req.user.id);
    const questionIds = req.body.answers.map((answer) => answer.questionId);
    if (new Set(questionIds).size !== questionIds.length) throw httpError(400, 'Une question ne peut apparaitre qu une fois', 'DUPLICATE_ANSWER');
    for (const answer of req.body.answers) {
      const question = poll.questions.id(answer.questionId);
      if (!question || !question.options.id(answer.optionId)) throw httpError(400, 'Question ou choix invalide', 'INVALID_OPTION');
      if (poll.votes.some((vote) => String(vote.participant) === req.user.id && String(vote.question) === answer.questionId)) {
        throw httpError(409, 'Une reponse existe deja pour cette question', 'ALREADY_ANSWERED');
      }
    }
    poll.votes.push(...req.body.answers.map((answer) => ({ participant: req.user.id, question: answer.questionId, option: answer.optionId })));
    await poll.save();
    res.json({ data: { pollId: poll.id, answered: req.body.answers.length } });
  }));

router.get('/polls/:pollId/results', optionalAuthenticate, asyncHandler(async (req, res) => {
  const poll = await Poll.findById(req.params.pollId);
  if (!poll) throw httpError(404, 'Sondage introuvable', 'POLL_NOT_FOUND');
  const event = await loadEvent(poll.event);
  participantOnly(event, req.user?.id);
  const data = poll.questions.map((question) => ({
    questionId: question.id,
    text: question.text,
    options: question.options.map((option) => ({
      optionId: option.id, text: option.text,
      votes: poll.votes.filter((vote) => String(vote.question) === question.id && String(vote.option) === option.id).length
    }))
  }));
  res.json({ data });
}));

// Ticket sales are recorded only; no payment processor is connected.
router.get('/events/:eventId/ticket-types', optionalAuthenticate, asyncHandler(async (req, res) => {
  const event = await loadEvent(req.params.eventId);
  if (event.visibility === 'private') participantOnly(event, req.user?.id);
  res.json({ data: await TicketType.find({ event: event.id }).select('-createdBy') });
}));

router.post('/events/:eventId/ticket-types', authenticate,
  body('name').trim().notEmpty().isLength({ max: 100 }),
  body('amount').isFloat({ min: 0 }), body('quantity').isInt({ min: 1 }),
  body('currency').optional().isISO4217(), validate,
  asyncHandler(async (req, res) => {
    const event = await loadEvent(req.params.eventId);
    organizerOnly(event, req.user.id);
    featureEnabled(event, 'ticketingEnabled');
    const type = await TicketType.create({ event: event.id, createdBy: req.user.id, name: req.body.name, amount: req.body.amount, currency: req.body.currency || 'EUR', quantity: req.body.quantity, remaining: req.body.quantity });
    res.status(201).json({ data: type });
  }));

router.post('/ticket-types/:ticketTypeId/purchases',
  body('firstName').trim().notEmpty().isLength({ max: 80 }), body('lastName').trim().notEmpty().isLength({ max: 80 }),
  body('email').isEmail().normalizeEmail(), body('address').trim().notEmpty().isLength({ max: 500 }), validate,
  asyncHandler(async (req, res) => {
    const type = await TicketType.findById(req.params.ticketTypeId);
    if (!type) throw httpError(404, 'Type de billet introuvable', 'TICKET_TYPE_NOT_FOUND');
    const event = await loadEvent(type.event);
    featureEnabled(event, 'ticketingEnabled');
    if (event.visibility !== 'public') throw httpError(403, 'La billetterie est reservee aux evenements publics', 'FORBIDDEN');
    if (await TicketPurchase.exists({ event: event.id, email: req.body.email })) throw httpError(409, 'Une seule place est autorisee par personne', 'TICKET_LIMIT_REACHED');
    const updated = await TicketType.findOneAndUpdate({ _id: type.id, remaining: { $gt: 0 } }, { $inc: { remaining: -1 } }, { new: true });
    if (!updated) throw httpError(409, 'Ce type de billet est epuise', 'SOLD_OUT');
    try {
      const purchase = await TicketPurchase.create({ event: event.id, ticketType: type.id, ...req.body });
      res.status(201).json({ data: purchase });
    } catch (error) {
      await TicketType.updateOne({ _id: type.id }, { $inc: { remaining: 1 } });
      throw error;
    }
  }));

// Optional event features: shopping list and carpool offers.
router.get('/events/:eventId/shopping-list', optionalAuthenticate, asyncHandler(async (req, res) => {
  const event = await loadEvent(req.params.eventId);
  participantOnly(event, req.user?.id);
  featureEnabled(event, 'shoppingListEnabled');
  res.json({ data: await ShoppingItem.find({ event: event.id }).populate('broughtBy', 'firstName lastName') });
}));

router.post('/events/:eventId/shopping-list', authenticate,
  body('name').trim().notEmpty().isLength({ max: 120 }), body('quantity').isInt({ min: 1 }), body('arrivalAt').isISO8601(), validate,
  asyncHandler(async (req, res) => {
    const event = await loadEvent(req.params.eventId);
    participantOnly(event, req.user.id);
    featureEnabled(event, 'shoppingListEnabled');
    const name = req.body.name.trim();
    const item = await ShoppingItem.create({ event: event.id, name, normalizedName: name.toLocaleLowerCase('fr'), quantity: req.body.quantity, arrivalAt: new Date(req.body.arrivalAt), broughtBy: req.user.id });
    res.status(201).json({ data: item });
  }));

router.get('/events/:eventId/carpools', optionalAuthenticate, asyncHandler(async (req, res) => {
  const event = await loadEvent(req.params.eventId);
  participantOnly(event, req.user?.id);
  featureEnabled(event, 'carpoolEnabled');
  res.json({ data: await CarpoolOffer.find({ event: event.id }).populate('driver', 'firstName lastName').populate('passengers', 'firstName lastName') });
}));

router.post('/events/:eventId/carpools', authenticate,
  body('departureLocation').trim().notEmpty().isLength({ max: 300 }), body('departureAt').isISO8601(),
  body('price').isFloat({ min: 0 }), body('currency').optional().isISO4217(),
  body('seatsTotal').isInt({ min: 1, max: 20 }), body('maxDeviationMinutes').isInt({ min: 0, max: 1440 }), validate,
  asyncHandler(async (req, res) => {
    const event = await loadEvent(req.params.eventId);
    participantOnly(event, req.user.id);
    featureEnabled(event, 'carpoolEnabled');
    const offer = await CarpoolOffer.create({ event: event.id, driver: req.user.id, departureLocation: req.body.departureLocation, departureAt: new Date(req.body.departureAt), price: req.body.price, currency: req.body.currency || 'EUR', seatsTotal: req.body.seatsTotal, seatsAvailable: req.body.seatsTotal, maxDeviationMinutes: req.body.maxDeviationMinutes });
    res.status(201).json({ data: offer });
  }));

router.post('/carpools/:offerId/join', authenticate, asyncHandler(async (req, res) => {
  const offer = await CarpoolOffer.findById(req.params.offerId);
  if (!offer) throw httpError(404, 'Offre de covoiturage introuvable', 'CARPOOL_NOT_FOUND');
  const event = await loadEvent(offer.event);
  participantOnly(event, req.user.id);
  if (String(offer.driver) === req.user.id || includes(offer.passengers, req.user.id)) throw httpError(409, 'Vous etes deja inscrit a ce trajet', 'ALREADY_JOINED');
  const updated = await CarpoolOffer.findOneAndUpdate(
    { _id: offer.id, seatsAvailable: { $gt: 0 }, passengers: { $ne: req.user.id } },
    { $inc: { seatsAvailable: -1 }, $addToSet: { passengers: req.user.id } }, { new: true }
  );
  if (!updated) throw httpError(409, 'Aucune place disponible', 'CARPOOL_FULL');
  res.json({ data: updated });
}));

module.exports = router;
