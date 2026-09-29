const { v4: uuidv4 } = require('uuid');

/**
 * Wraps an async route handler so errors propagate to Express error middleware
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Generate a new UUID v4
 */
const generateId = () => uuidv4();

/**
 * Parse cursor-based pagination params from query
 */
const parsePagination = (query) => {
  const limit = Math.min(parseInt(query.limit, 10) || 20, 100);
  const cursor = query.cursor || null;
  const sortBy = query.sortBy || 'created_at';
  const sortDir = query.sortDir === 'asc' ? 'ASC' : 'DESC';
  return { limit, cursor, sortBy, sortDir };
};

/**
 * Build cursor-based pagination metadata
 */
const buildPaginationMeta = (items, limit, cursorField = 'id') => {
  const hasMore = items.length > limit;
  const data = hasMore ? items.slice(0, limit) : items;
  const nextCursor = hasMore ? data[data.length - 1][cursorField] : null;
  return { data, meta: { hasMore, nextCursor, count: data.length } };
};

/**
 * Sanitize an object to only include allowed keys
 */
const pick = (obj, keys) => {
  return keys.reduce((acc, key) => {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      acc[key] = obj[key];
    }
    return acc;
  }, {});
};

/**
 * Omit specific keys from an object
 */
const omit = (obj, keys) => {
  return Object.fromEntries(
    Object.entries(obj).filter(([k]) => !keys.includes(k))
  );
};

/**
 * Safe parse JSON, return null on failure
 */
const safeJsonParse = (str, fallback = null) => {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
};

/**
 * Calculate profit/loss metrics
 */
const calcPnL = (totalInvested, currentValue) => {
  const pnl = currentValue - totalInvested;
  const pnlPct = totalInvested > 0 ? (pnl / totalInvested) * 100 : 0;
  return { pnl: parseFloat(pnl.toFixed(4)), pnlPct: parseFloat(pnlPct.toFixed(4)) };
};

/**
 * Format decimals to fixed precision
 */
const toFixed = (val, decimals = 4) => parseFloat(Number(val || 0).toFixed(decimals));

module.exports = {
  asyncHandler,
  generateId,
  parsePagination,
  buildPaginationMeta,
  pick,
  omit,
  safeJsonParse,
  calcPnL,
  toFixed,
};
