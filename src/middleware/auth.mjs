import jwt from 'jsonwebtoken';
import asyncHandler from '../utils/asyncHandler.mjs';
import httpError from '../utils/httpError.mjs';
import User from '../models/User.mjs';

const authenticate = asyncHandler(async (req, res, next) => {
  const token = req.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) throw httpError(401, 'Authentification requise', 'AUTH_REQUIRED');
  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw httpError(401, 'Jeton invalide ou expire', 'INVALID_TOKEN');
  }
  req.user = await User.findById(payload.sub).select('-passwordHash');
  if (!req.user) throw httpError(401, 'Compte introuvable', 'INVALID_TOKEN');
  next();
});

const optionalAuthenticate = asyncHandler(async (req, res, next) => {
  const token = req.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return next();
  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw httpError(401, 'Jeton invalide ou expire', 'INVALID_TOKEN');
  }
  req.user = await User.findById(payload.sub).select('-passwordHash');
  if (!req.user) throw httpError(401, 'Compte introuvable', 'INVALID_TOKEN');
  next();
});

export { authenticate, optionalAuthenticate };
