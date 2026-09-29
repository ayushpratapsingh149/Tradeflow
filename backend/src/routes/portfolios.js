const express = require('express');
const router = express.Router();
const portfolioController = require('../controllers/portfolioController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { portfolioRules, transactionRules, portfolioIdRule, holdingIdRule } = require('../validators/portfolioValidators');

// All portfolio routes are protected
router.use(authenticate);

// Dashboard
router.get('/dashboard', portfolioController.getDashboard);

// Portfolio CRUD
router.get('/',    portfolioController.listPortfolios);
router.post('/',   portfolioRules, validate, portfolioController.createPortfolio);

router.get('/:portfolioId',         portfolioIdRule, validate, portfolioController.getPortfolio);
router.put('/:portfolioId',         portfolioIdRule, validate, portfolioController.updatePortfolio);
router.delete('/:portfolioId',      portfolioIdRule, validate, portfolioController.deletePortfolio);
router.get('/:portfolioId/summary', portfolioIdRule, validate, portfolioController.getPortfolioSummary);

// Holdings
router.get('/:portfolioId/holdings',    portfolioIdRule, validate, portfolioController.getHoldings);
router.post('/:portfolioId/transactions', portfolioIdRule, transactionRules, validate, portfolioController.addTransaction);
router.delete('/:portfolioId/holdings/:holdingId', [...portfolioIdRule, ...holdingIdRule], validate, portfolioController.deleteHolding);

// Transactions
router.get('/:portfolioId/transactions', portfolioIdRule, validate, portfolioController.getTransactions);

module.exports = router;
