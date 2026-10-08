const router = require('express').Router();
const { body } = require('express-validator');
const Event = require('../models/Event');
const Group = require('../models/Group');
const Thread = require('../models/Thread');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');
const httpError = require('../utils/httpError');

const includes = (list, id) => list.some((item) => String(item?._id || item) === String(id));
const organizerOnly = (event, userId) => {
  if (!includes(event.organizers, userId)) throw httpError(403, 'Droits organisateur requis', 'FORBIDDEN');
};

router.get('/', asyncHandler(async (req, res) => {
  const filter = req.query.mine === 'true'
    ? { $or: [{ organizers: req.user?.id }, { participants: req.user?.id }] }
    : { $or: [{ visibility: 'public' }, { organizers: req.user?.id }, { participants: req.user?.id }] };
  if (!req.user && req.query.mine === 'true') throw httpError(401, 'Authentification requise', 'AUTH_REQUIRED');
  const events = await Event.find(filter).populate('organizers', 'firstName lastName').populate('group', 'name visibility');
  res.json({ data: events });
}));

router.post('/', authenticate,
  body('name').trim().notEmpty().isLength({ max: 160 }),
  body('description').optional().isLength({ max: 5000 }),
  body('startsAt').isISO8601(), body('endsAt').isISO8601(),
  body('location').trim().notEmpty().isLength({ max: 300 }),
  body('visibility').optional().isIn(['public', 'private']),
  body('groupId').optional().isMongoId(),
  body('shoppingListEnabled').optional().isBoolean(), body('carpoolEnabled').optional().isBoolean(), body('ticketingEnabled').optional().isBoolean(), validate,
  asyncHandler(async (req, res) => {
    let participants = [req.user.id];
    let group = null;
    if (req.body.groupId) {
      group = await Group.findById(req.body.groupId);
      if (!group) throw httpError(404, 'Groupe introuvable', 'GROUP_NOT_FOUND');
      if (!includes(group.members, req.user.id)) throw httpError(403, 'Vous devez etre membre du groupe', 'FORBIDDEN');
      if (!group.allowMemberEvents && !includes(group.admins, req.user.id)) throw httpError(403, 'La creation d evenements est desactivee', 'FORBIDDEN');
      participants = [...group.members];
    }
    const event = await Event.create({ ...req.body, group: group?.id || null, startsAt: new Date(req.body.startsAt), endsAt: new Date(req.body.endsAt), organizers: [req.user.id], participants });
    const thread = await Thread.create({ event: event.id });
    event.thread = thread.id;
    await event.save();
    res.status(201).json({ data: event });
  }));

router.get('/:id', asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id).populate('organizers', 'firstName lastName').populate('participants', 'firstName lastName avatarUrl').populate('group', 'name visibility');
  if (!event) throw httpError(404, 'Evenement introuvable', 'EVENT_NOT_FOUND');
  if (event.visibility === 'private' && !includes(event.participants, req.user?.id) && !includes(event.organizers, req.user?.id)) throw httpError(req.user ? 403 : 401, 'Acces a cet evenement refuse', 'FORBIDDEN');
  res.json({ data: event });
}));

router.patch('/:id', authenticate,
  body('name').optional().trim().notEmpty().isLength({ max: 160 }),
  body('description').optional().isLength({ max: 5000 }),
  body('startsAt').optional().isISO8601(), body('endsAt').optional().isISO8601(),
  body('location').optional().trim().notEmpty().isLength({ max: 300 }),
  body('visibility').optional().isIn(['public', 'private']),
  body('shoppingListEnabled').optional().isBoolean(), body('carpoolEnabled').optional().isBoolean(), body('ticketingEnabled').optional().isBoolean(), validate,
  asyncHandler(async (req, res) => {
    const event = await Event.findById(req.params.id);
    if (!event) throw httpError(404, 'Evenement introuvable', 'EVENT_NOT_FOUND');
    organizerOnly(event, req.user.id);
    const fields = ['name', 'description', 'startsAt', 'endsAt', 'location', 'coverPhotoUrl', 'visibility', 'shoppingListEnabled', 'carpoolEnabled', 'ticketingEnabled'];
    for (const field of fields) if (req.body[field] !== undefined) event[field] = req.body[field];
    await event.save();
    res.json({ data: event });
  }));

router.post('/:id/organizers', authenticate, body('userId').isMongoId(), validate, asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) throw httpError(404, 'Evenement introuvable', 'EVENT_NOT_FOUND');
  organizerOnly(event, req.user.id);
  if (!includes(event.organizers, req.body.userId)) event.organizers.push(req.body.userId);
  if (!includes(event.participants, req.body.userId)) event.participants.push(req.body.userId);
  await event.save();
  res.json({ data: event });
}));

router.post('/:id/participants', authenticate, body('userId').isMongoId(), validate, asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) throw httpError(404, 'Evenement introuvable', 'EVENT_NOT_FOUND');
  organizerOnly(event, req.user.id);
  if (!includes(event.participants, req.body.userId)) event.participants.push(req.body.userId);
  await event.save();
  res.json({ data: event });
}));

router.post('/:id/rsvp', authenticate, asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) throw httpError(404, 'Evenement introuvable', 'EVENT_NOT_FOUND');
  if (event.visibility === 'private' && !includes(event.participants, req.user.id)) throw httpError(403, 'Cet evenement est prive', 'FORBIDDEN');
  if (!includes(event.participants, req.user.id)) event.participants.push(req.user.id);
  await event.save();
  res.json({ data: { eventId: event.id, status: 'going' } });
}));

router.delete('/:id/rsvp', authenticate, asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) throw httpError(404, 'Evenement introuvable', 'EVENT_NOT_FOUND');
  if (includes(event.organizers, req.user.id)) throw httpError(409, 'Un organisateur ne peut pas quitter son evenement', 'ORGANIZER_REQUIRED');
  event.participants = event.participants.filter((id) => String(id) !== String(req.user.id));
  await event.save();
  res.json({ data: { eventId: event.id, status: 'not-going' } });
}));

module.exports = router;
