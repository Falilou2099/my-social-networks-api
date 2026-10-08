import express from 'express';
const router = express.Router();
import expressValidator from 'express-validator';
const { body } = expressValidator;
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.mjs';
import validate from '../middleware/validate.mjs';
import asyncHandler from '../utils/asyncHandler.mjs';
import { authenticate } from '../middleware/auth.mjs';
import httpError from '../utils/httpError.mjs';

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

export default router;
