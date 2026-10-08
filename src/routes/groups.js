const router = require('express').Router();
const { body } = require('express-validator');
const Group = require('../models/Group');
const Thread = require('../models/Thread');
const Event = require('../models/Event');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');
const httpError = require('../utils/httpError');

const isId = (list, id) => list.some((item) => String(item?._id || item) === String(id));
const requireAdmin = (group, userId) => {
  if (!isId(group.admins, userId)) throw httpError(403, 'Droits administrateur requis', 'FORBIDDEN');
};

router.get('/', asyncHandler(async (req, res) => {
  const filter = req.query.mine === 'true'
    ? { members: req.user?.id }
    : { $or: [{ visibility: 'public' }, { members: req.user?.id }] };
  if (!req.user && req.query.mine === 'true') throw httpError(401, 'Authentification requise', 'AUTH_REQUIRED');
  res.json({ data: await Group.find(filter).select('name description iconUrl coverPhotoUrl visibility members admins createdAt') });
}));

router.post('/', authenticate,
  body('name').trim().notEmpty().isLength({ max: 120 }),
  body('description').optional().isLength({ max: 2000 }),
  body('visibility').optional().isIn(['public', 'private', 'secret']),
  body('allowMemberPosts').optional().isBoolean(), body('allowMemberEvents').optional().isBoolean(), validate,
  asyncHandler(async (req, res) => {
    const group = await Group.create({
      ...req.body,
      members: [req.user.id], admins: [req.user.id]
    });
    const thread = await Thread.create({ group: group.id });
    group.thread = thread.id;
    await group.save();
    res.status(201).json({ data: group });
  }));

router.get('/:id', asyncHandler(async (req, res) => {
  const group = await Group.findById(req.params.id).populate('members', 'firstName lastName avatarUrl').populate('admins', 'firstName lastName avatarUrl');
  if (!group) throw httpError(404, 'Groupe introuvable', 'GROUP_NOT_FOUND');
  if (group.visibility !== 'public' && !req.user) throw httpError(401, 'Authentification requise', 'AUTH_REQUIRED');
  if (group.visibility === 'secret' && !isId(group.members, req.user?.id)) throw httpError(404, 'Groupe introuvable', 'GROUP_NOT_FOUND');
  if (group.visibility === 'private' && !isId(group.members, req.user?.id)) throw httpError(403, 'Vous devez etre membre du groupe', 'FORBIDDEN');
  res.json({ data: group });
}));

router.patch('/:id', authenticate,
  body('name').optional().trim().notEmpty().isLength({ max: 120 }),
  body('description').optional().isLength({ max: 2000 }),
  body('visibility').optional().isIn(['public', 'private', 'secret']),
  body('allowMemberPosts').optional().isBoolean(), body('allowMemberEvents').optional().isBoolean(), validate,
  asyncHandler(async (req, res) => {
    const group = await Group.findById(req.params.id);
    if (!group) throw httpError(404, 'Groupe introuvable', 'GROUP_NOT_FOUND');
    requireAdmin(group, req.user.id);
    const fields = ['name', 'description', 'iconUrl', 'coverPhotoUrl', 'visibility', 'allowMemberPosts', 'allowMemberEvents'];
    for (const field of fields) if (req.body[field] !== undefined) group[field] = req.body[field];
    await group.save();
    res.json({ data: group });
  }));

router.post('/:id/join', authenticate, asyncHandler(async (req, res) => {
  const group = await Group.findById(req.params.id);
  if (!group) throw httpError(404, 'Groupe introuvable', 'GROUP_NOT_FOUND');
  if (group.visibility === 'secret') throw httpError(403, 'Ce groupe fonctionne sur invitation', 'FORBIDDEN');
  if (!isId(group.members, req.user.id)) group.members.push(req.user.id);
  await group.save();
  res.json({ data: group });
}));

router.delete('/:id/members/:userId', authenticate, asyncHandler(async (req, res) => {
  const group = await Group.findById(req.params.id);
  if (!group) throw httpError(404, 'Groupe introuvable', 'GROUP_NOT_FOUND');
  const selfLeave = String(req.user.id) === req.params.userId;
  if (!selfLeave) requireAdmin(group, req.user.id);
  if (String(group.admins[0]) === req.params.userId && group.admins.length === 1) throw httpError(409, 'Un groupe doit conserver un administrateur', 'LAST_ADMIN');
  group.members = group.members.filter((id) => String(id) !== req.params.userId);
  group.admins = group.admins.filter((id) => String(id) !== req.params.userId);
  await group.save();
  res.json({ data: group });
}));

router.post('/:id/admins/:userId', authenticate, asyncHandler(async (req, res) => {
  const group = await Group.findById(req.params.id);
  if (!group) throw httpError(404, 'Groupe introuvable', 'GROUP_NOT_FOUND');
  requireAdmin(group, req.user.id);
  if (!isId(group.members, req.params.userId)) throw httpError(400, 'La personne doit etre membre du groupe', 'NOT_A_MEMBER');
  if (!isId(group.admins, req.params.userId)) group.admins.push(req.params.userId);
  await group.save();
  res.json({ data: group });
}));

router.post('/:id/events', authenticate,
  body('name').trim().notEmpty().isLength({ max: 160 }),
  body('description').optional().isLength({ max: 5000 }),
  body('startsAt').isISO8601(), body('endsAt').isISO8601(), body('location').trim().notEmpty().isLength({ max: 300 }), validate,
  asyncHandler(async (req, res) => {
    const group = await Group.findById(req.params.id);
    if (!group) throw httpError(404, 'Groupe introuvable', 'GROUP_NOT_FOUND');
    if (!isId(group.members, req.user.id)) throw httpError(403, 'Vous devez etre membre du groupe', 'FORBIDDEN');
    if (!group.allowMemberEvents && !isId(group.admins, req.user.id)) throw httpError(403, 'La creation d evenements est desactivee', 'FORBIDDEN');
    const event = await Event.create({
      ...req.body,
      startsAt: new Date(req.body.startsAt), endsAt: new Date(req.body.endsAt),
      group: group.id, organizers: [req.user.id], participants: group.members
    });
    const thread = await Thread.create({ event: event.id });
    event.thread = thread.id;
    await event.save();
    res.status(201).json({ data: event });
  }));

module.exports = router;
