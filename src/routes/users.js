const router = require('express').Router();
const { body } = require('express-validator');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');
const httpError = require('../utils/httpError');

router.get('/:id', asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('firstName lastName avatarUrl bio createdAt');
  if (!user) throw httpError(404, 'Utilisateur introuvable', 'USER_NOT_FOUND');
  res.json({ data: user });
}));

router.patch('/me', authenticate,
  body('firstName').optional().trim().notEmpty().isLength({ max: 80 }),
  body('lastName').optional().trim().notEmpty().isLength({ max: 80 }),
  body('avatarUrl').optional().isURL({ require_protocol: true }),
  body('bio').optional().isLength({ max: 500 }), validate,
  asyncHandler(async (req, res) => {
    const allowed = ['firstName', 'lastName', 'avatarUrl', 'bio'];
    const changes = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));
    const user = await User.findByIdAndUpdate(req.user.id, changes, { new: true, runValidators: true });
    res.json({ data: user });
  }));

module.exports = router;
