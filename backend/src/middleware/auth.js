const { verifyAccessToken } = require('../utils/jwt');
const { UnauthorizedError, ForbiddenError } = require('../utils/errors');
const { asyncHandler } = require('../utils/helpers');
const { queryOne } = require('../config/database');

/**
 * Verifies JWT and attaches user to req.user
 */
const authenticate = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('No token provided');
  }

  const token = authHeader.split(' ')[1];

  let decoded;
  try {
    decoded = verifyAccessToken(token);
  } catch (err) {
    if (err.name === 'TokenExpiredError') throw new UnauthorizedError('Token expired');
    throw new UnauthorizedError('Invalid token');
  }

  const user = await queryOne(
    'SELECT id, email, username, full_name, role, is_active FROM users WHERE id = ?',
    [decoded.sub]
  );

  if (!user) throw new UnauthorizedError('User not found');
  if (!user.is_active) throw new UnauthorizedError('Account deactivated');

  req.user = user;
  next();
});

/**
 * Role-based authorization middleware factory
 * @param {...string} roles - allowed roles
 */
const authorize = (...roles) =>
  asyncHandler(async (req, res, next) => {
    if (!req.user) throw new UnauthorizedError();
    if (!roles.includes(req.user.role)) {
      throw new ForbiddenError('Insufficient permissions');
    }
    next();
  });

/**
 * Optional auth - attaches user if token present, but doesn't fail if not
 */
const optionalAuth = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);
    const user = await queryOne(
      'SELECT id, email, username, full_name, role, is_active FROM users WHERE id = ?',
      [decoded.sub]
    );
    req.user = user && user.is_active ? user : null;
  } catch {
    req.user = null;
  }
  next();
});

module.exports = { authenticate, authorize, optionalAuth };
