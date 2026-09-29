const express = require('express');
const router = express.Router();
const config = require('../config');

const authRoutes      = require('./auth');
const portfolioRoutes = require('./portfolios');
const assetRoutes     = require('./assets');

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'ok',
    service: 'TradeFlow API',
    version: '1.0.0',
    env: config.env,
    timestamp: new Date().toISOString(),
  });
});

router.use('/auth',       authRoutes);
router.use('/portfolios', portfolioRoutes);
router.use('/assets',     assetRoutes);

module.exports = router;
