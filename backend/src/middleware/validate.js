const { validationResult } = require('express-validator');
const { ValidationError } = require('../utils/errors');

/**
 * Runs after express-validator chains and throws if there are errors
 */
const validate = (req, res, next) => {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    const formatted = result.array().map((e) => ({
      field: e.path,
      message: e.msg,
    }));
    throw new ValidationError('Validation failed', formatted);
  }
  next();
};

module.exports = { validate };
