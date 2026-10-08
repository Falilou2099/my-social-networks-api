const mongoose = require('mongoose');

function notFound(req, res) {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Ressource introuvable' } });
}

function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  let status = error.status || 500;
  let code = error.code || 'INTERNAL_ERROR';
  let message = status === 500 ? 'Une erreur interne est survenue' : error.message;
  let details;
  if (error instanceof mongoose.Error.ValidationError) {
    status = 400;
    code = 'VALIDATION_ERROR';
    message = 'Les donnees fournies sont invalides';
    details = Object.values(error.errors).map((item) => ({ field: item.path, message: item.message }));
  } else if (error.code === 11000) {
    status = 409;
    code = 'DUPLICATE_RESOURCE';
    message = 'Une ressource avec ces informations existe deja';
  } else if (error.name === 'CastError') {
    status = 400;
    code = 'INVALID_ID';
    message = 'Identifiant invalide';
  }
  res.status(status).json({ error: { code, message, ...(details ? { details } : {}) } });
}

module.exports = { notFound, errorHandler };
