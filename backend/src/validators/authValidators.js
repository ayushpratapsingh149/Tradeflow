const { body } = require('express-validator');

const registerRules = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('username')
    .isAlphanumeric()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be 3-30 alphanumeric characters'),
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must be at least 8 characters with uppercase, lowercase, and a number'),
  body('fullName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be 2-100 characters'),
];

const loginRules = [
  body('identifier').notEmpty().withMessage('Email or username required'),
  body('password').notEmpty().withMessage('Password required'),
];

const refreshRules = [
  body('refreshToken').notEmpty().withMessage('Refresh token required'),
];

module.exports = { registerRules, loginRules, refreshRules };
