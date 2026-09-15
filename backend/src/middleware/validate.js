const { validationResult } = require('express-validator');
const { ValidationError } = require('../utils/errors');

const validateMiddleware = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new ValidationError('Validation failed', errors.array()));
  }
  next();
};

const validate = (reqOrValidations, res, next) => {
  if (Array.isArray(reqOrValidations)) {
    return [...reqOrValidations, validateMiddleware];
  }
  return validateMiddleware(reqOrValidations, res, next);
};

module.exports = validate;
