const express = require('express');
const router = express.Router();
const assetController = require('../controllers/assetController');
const { authenticate } = require('../middleware/auth');
const { body, param } = require('express-validator');
const { validate } = require('../middleware/validate');

// Public asset routes
router.get('/',        assetController.listAssets);
router.get('/search',  assetController.searchAssets);
router.get('/:assetId', [param('assetId').isUUID()], validate, assetController.getAsset);

// Watchlist routes (protected)
router.get('/watchlist',           authenticate, assetController.getWatchlist);
router.post('/watchlist',          authenticate, [body('assetId').isUUID().withMessage('Valid asset ID required')], validate, assetController.addToWatchlist);
router.delete('/watchlist/:assetId', authenticate, [param('assetId').isUUID()], validate, assetController.removeFromWatchlist);

module.exports = router;
