const { body, param, query } = require('express-validator');

const portfolioRules = [
  body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Portfolio name is required (max 100 chars)'),
  body('description').optional().isLength({ max: 500 }).withMessage('Description max 500 chars'),
  body('currency').optional().isLength({ min: 3, max: 3 }).toUpperCase().withMessage('Currency must be 3-letter code'),
];

const transactionRules = [
  body('assetId').isUUID().withMessage('Valid asset ID required'),
  body('type').isIn(['buy', 'sell']).withMessage('Type must be buy or sell'),
  body('quantity').isFloat({ gt: 0 }).withMessage('Quantity must be positive'),
  body('price').isFloat({ gt: 0 }).withMessage('Price must be positive'),
  body('fee').optional().isFloat({ min: 0 }).withMessage('Fee must be non-negative'),
  body('notes').optional().isLength({ max: 500 }),
  body('transactedAt').optional().isISO8601().withMessage('transactedAt must be valid ISO date'),
];

const paginationRules = [
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('offset').optional().isInt({ min: 0 }).toInt(),
];

const portfolioIdRule = [
  param('portfolioId').isUUID().withMessage('Valid portfolio ID required'),
];

const holdingIdRule = [
  param('holdingId').isUUID().withMessage('Valid holding ID required'),
];

module.exports = { portfolioRules, transactionRules, paginationRules, portfolioIdRule, holdingIdRule };
