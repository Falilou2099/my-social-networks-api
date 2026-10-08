const router = require('express').Router();
const { body } = require('express-validator');
const Thread = require('../models/Thread');
const Message = require('../models/Message');
const Group = require('../models/Group');
const Event = require('../models/Event');
const { authenticate, optionalAuthenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');
const httpError = require('../utils/httpError');

const contains = (list, id) => list.some((item) => String(item?._id || item) === String(id));
async function canRead(thread, userId) {
  if (thread.group) {
    const group = await Group.findById(thread.group);
    if (!group) return false;
    if (group.visibility === 'public') return true;
    if (!userId) return false;
    if (group.visibility === 'secret') return contains(group.members, userId);
    return contains(group.members, userId);
  }
  const event = await Event.findById(thread.event);
  if (!event) return false;
  if (event.visibility === 'public') return true;
  return Boolean(userId) && (contains(event.participants, userId) || contains(event.organizers, userId));
}

router.get('/:id/messages', optionalAuthenticate, asyncHandler(async (req, res) => {
  const thread = await Thread.findById(req.params.id);
  if (!thread) throw httpError(404, 'Fil introuvable', 'THREAD_NOT_FOUND');
  if (!await canRead(thread, req.user?.id)) throw httpError(req.user ? 403 : 401, 'Acces au fil refuse', 'FORBIDDEN');
  const messages = await Message.find({ thread: thread.id }).populate('author', 'firstName lastName avatarUrl').sort({ createdAt: 1 });
  res.json({ data: messages });
}));

router.post('/:id/messages', authenticate,
  body('body').trim().notEmpty().isLength({ max: 5000 }),
  body('parentId').optional().isMongoId(), validate,
  asyncHandler(async (req, res) => {
    const thread = await Thread.findById(req.params.id);
    if (!thread) throw httpError(404, 'Fil introuvable', 'THREAD_NOT_FOUND');
    if (!await canRead(thread, req.user.id)) throw httpError(403, 'Acces au fil refuse', 'FORBIDDEN');
    if (thread.group) {
      const group = await Group.findById(thread.group);
      if (!contains(group.members, req.user.id)) throw httpError(403, 'Vous devez etre membre du groupe pour publier', 'FORBIDDEN');
      if (!group.allowMemberPosts && !contains(group.admins, req.user.id)) throw httpError(403, 'La publication est desactivee dans ce groupe', 'FORBIDDEN');
    } else {
      const event = await Event.findById(thread.event);
      if (!contains(event.participants, req.user.id) && !contains(event.organizers, req.user.id)) throw httpError(403, 'Vous devez participer a cet evenement pour publier', 'FORBIDDEN');
    }
    let parent = null;
    if (req.body.parentId) {
      parent = await Message.findOne({ _id: req.body.parentId, thread: thread.id });
      if (!parent) throw httpError(404, 'Message parent introuvable dans ce fil', 'MESSAGE_NOT_FOUND');
    }
    const message = await Message.create({ thread: thread.id, author: req.user.id, body: req.body.body, parent: parent?.id || null });
    res.status(201).json({ data: message });
  }));

module.exports = router;
