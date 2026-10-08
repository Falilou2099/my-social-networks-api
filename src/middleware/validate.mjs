import expressValidator from 'express-validator';
const { validationResult } = expressValidator;

export default function validate(req, res, next) {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Les donnees fournies sont invalides',
        details: result.array().map(({ path, msg }) => ({ field: path, message: msg }))
      }
    });
  }
  next();
};
