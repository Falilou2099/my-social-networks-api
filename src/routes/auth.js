const router = require('express').Router();
const { body } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const validate = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');
const { authenticate } = require('../middleware/auth');
const httpError = require('../utils/httpError');

router.post('/register',
  body('firstName').trim().notEmpty().isLength({ max: 80 }),
  body('lastName').trim().notEmpty().isLength({ max: 80 }),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 10, max: 128 }),
  validate,
  asyncHandler(async (req, res) => {
    const { firstName, lastName, email, password } = req.body;
    if (await User.exists({ email })) throw httpError(409, 'Cette adresse e-mail est deja utilisee', 'EMAIL_IN_USE');
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ firstName, lastName, email, passwordHash });
    res.status(201).json({ data: user });
  }));

router.post('/login',
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
  validate,
  asyncHandler(async (req, res) => {
    const user = await User.findOne({ email: req.body.email }).select('+passwordHash');
    if (!user || !(await bcrypt.compare(req.body.password, user.passwordHash))) {
      throw httpError(401, 'E-mail ou mot de passe incorrect', 'INVALID_CREDENTIALS');
    }
    if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET est obligatoire');
    const token = jwt.sign({}, process.env.JWT_SECRET, { subject: user.id, expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
    user.passwordHash = undefined;
    res.json({ data: { token, user } });
  }));

router.get('/me', authenticate, (req, res) => res.json({ data: req.user }));

module.exports = router;
