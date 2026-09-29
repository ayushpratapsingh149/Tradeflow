const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimiter');
const { registerRules, loginRules, refreshRules } = require('../validators/authValidators');

router.post('/register', authLimiter, registerRules, validate, authController.register);
router.post('/login',    authLimiter, loginRules,    validate, authController.login);
router.post('/refresh',              refreshRules,  validate, authController.refresh);
router.post('/logout',                                         authController.logout);
router.get('/me',        authenticate,                         authController.me);

module.exports = router;
