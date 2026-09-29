const { query, queryOne, transaction } = require('../config/database');
const { generateId } = require('../utils/helpers');

// ─── Portfolios ──────────────────────────────────────────────────────────────

const findPortfoliosByUser = (userId) =>
  query(
    `SELECT p.*, 
            COUNT(h.id) AS holding_count
     FROM portfolios p
     LEFT JOIN holdings h ON h.portfolio_id = p.id
     WHERE p.user_id = ?
     GROUP BY p.id
     ORDER BY p.is_default DESC, p.created_at ASC`,
    [userId]
  );

const findPortfolioById = (portfolioId) =>
  queryOne('SELECT * FROM portfolios WHERE id = ?', [portfolioId]);

const findPortfolioByIdAndUser = (portfolioId, userId) =>
  queryOne('SELECT * FROM portfolios WHERE id = ? AND user_id = ?', [portfolioId, userId]);

const createPortfolio = async ({ userId, name, description, currency = 'USD', isDefault = 0 }) => {
  const id = generateId();
  if (isDefault) {
    await query('UPDATE portfolios SET is_default = 0 WHERE user_id = ?', [userId]);
  }
  await query(
    'INSERT INTO portfolios (id, user_id, name, description, currency, is_default) VALUES (?, ?, ?, ?, ?, ?)',
    [id, userId, name, description || null, currency, isDefault ? 1 : 0]
  );
  return findPortfolioById(id);
};

const updatePortfolio = async (portfolioId, { name, description, currency }) => {
  const fields = [];
  const values = [];
  if (name !== undefined) { fields.push('name = ?'); values.push(name); }
  if (description !== undefined) { fields.push('description = ?'); values.push(description); }
  if (currency !== undefined) { fields.push('currency = ?'); values.push(currency); }
  if (!fields.length) return;
  values.push(portfolioId);
  await query(`UPDATE portfolios SET ${fields.join(', ')} WHERE id = ?`, values);
};

const deletePortfolio = (portfolioId) =>
  query('DELETE FROM portfolios WHERE id = ?', [portfolioId]);

// ─── Holdings ────────────────────────────────────────────────────────────────

const findHoldingsByPortfolio = (portfolioId) =>
  query(
    `SELECT h.*, 
            a.symbol, a.name AS asset_name, a.exchange, a.currency AS asset_currency,
            ac.name AS category_name, ac.slug AS category_slug,
            mp.current_price, mp.change_pct, mp.fetched_at AS price_fetched_at
     FROM holdings h
     JOIN assets a ON a.id = h.asset_id
     JOIN asset_categories ac ON ac.id = a.category_id
     LEFT JOIN market_prices mp ON mp.asset_id = h.asset_id
     WHERE h.portfolio_id = ?
     ORDER BY h.total_invested DESC`,
    [portfolioId]
  );

const findHoldingById = (holdingId) =>
  queryOne(
    `SELECT h.*, a.symbol, a.name AS asset_name
     FROM holdings h
     JOIN assets a ON a.id = h.asset_id
     WHERE h.id = ?`,
    [holdingId]
  );

const findHoldingByPortfolioAndAsset = (portfolioId, assetId) =>
  queryOne(
    'SELECT * FROM holdings WHERE portfolio_id = ? AND asset_id = ?',
    [portfolioId, assetId]
  );

const upsertHolding = async (conn, { portfolioId, assetId, quantity, avgBuyPrice, totalInvested }) => {
  const existing = await conn.execute(
    'SELECT id FROM holdings WHERE portfolio_id = ? AND asset_id = ?',
    [portfolioId, assetId]
  );

  if (existing[0].length > 0) {
    const holdingId = existing[0][0].id;
    await conn.execute(
      `UPDATE holdings SET quantity = ?, avg_buy_price = ?, total_invested = ? WHERE id = ?`,
      [quantity, avgBuyPrice, totalInvested, holdingId]
    );
    return holdingId;
  } else {
    const holdingId = generateId();
    await conn.execute(
      'INSERT INTO holdings (id, portfolio_id, asset_id, quantity, avg_buy_price, total_invested) VALUES (?, ?, ?, ?, ?, ?)',
      [holdingId, portfolioId, assetId, quantity, avgBuyPrice, totalInvested]
    );
    return holdingId;
  }
};

const updateHolding = (holdingId, { quantity, avgBuyPrice, totalInvested, notes }) =>
  query(
    'UPDATE holdings SET quantity = ?, avg_buy_price = ?, total_invested = ?, notes = ? WHERE id = ?',
    [quantity, avgBuyPrice, totalInvested, notes ?? null, holdingId]
  );

const deleteHolding = (holdingId) =>
  query('DELETE FROM holdings WHERE id = ?', [holdingId]);

// ─── Transactions ─────────────────────────────────────────────────────────────

const createTransaction = async (conn, {
  holdingId, portfolioId, assetId, type, quantity, price, totalAmount, fee, notes, transactedAt
}) => {
  const id = generateId();
  await conn.execute(
    `INSERT INTO transactions 
     (id, holding_id, portfolio_id, asset_id, type, quantity, price, total_amount, fee, notes, transacted_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, holdingId, portfolioId, assetId, type, quantity, price, totalAmount, fee || 0, notes || null, transactedAt]
  );
  return id;
};

const findTransactionsByPortfolio = (portfolioId, { limit = 20, offset = 0 } = {}) =>
  query(
    `SELECT t.*, a.symbol, a.name AS asset_name
     FROM transactions t
     JOIN assets a ON a.id = t.asset_id
     WHERE t.portfolio_id = ?
     ORDER BY t.transacted_at DESC
     LIMIT ? OFFSET ?`,
    [portfolioId, limit, offset]
  );

const findTransactionsByHolding = (holdingId) =>
  query(
    'SELECT * FROM transactions WHERE holding_id = ? ORDER BY transacted_at DESC',
    [holdingId]
  );

// ─── Portfolio Summary (aggregated) ──────────────────────────────────────────

const getPortfolioSummary = (portfolioId) =>
  queryOne(
    `SELECT 
       p.id,
       p.name,
       p.currency,
       COUNT(h.id)                                   AS holding_count,
       COALESCE(SUM(h.total_invested), 0)            AS total_invested,
       COALESCE(SUM(h.quantity * mp.current_price), 0) AS current_value,
       COALESCE(SUM(h.quantity * mp.current_price) - SUM(h.total_invested), 0) AS pnl,
       CASE WHEN SUM(h.total_invested) > 0 
            THEN ((SUM(h.quantity * mp.current_price) - SUM(h.total_invested)) / SUM(h.total_invested)) * 100
            ELSE 0 END                                AS pnl_pct
     FROM portfolios p
     LEFT JOIN holdings h ON h.portfolio_id = p.id
     LEFT JOIN market_prices mp ON mp.asset_id = h.asset_id
     WHERE p.id = ?
     GROUP BY p.id`,
    [portfolioId]
  );

const getUserDashboardSummary = (userId) =>
  queryOne(
    `SELECT 
       COUNT(DISTINCT p.id)                            AS portfolio_count,
       COUNT(DISTINCT h.id)                            AS total_holdings,
       COALESCE(SUM(h.total_invested), 0)              AS total_invested,
       COALESCE(SUM(h.quantity * mp.current_price), 0) AS current_value,
       COALESCE(SUM(h.quantity * mp.current_price) - SUM(h.total_invested), 0) AS total_pnl,
       CASE WHEN SUM(h.total_invested) > 0
            THEN ((SUM(h.quantity * mp.current_price) - SUM(h.total_invested)) / SUM(h.total_invested)) * 100
            ELSE 0 END                                 AS total_pnl_pct
     FROM portfolios p
     LEFT JOIN holdings h ON h.portfolio_id = p.id
     LEFT JOIN market_prices mp ON mp.asset_id = h.asset_id
     WHERE p.user_id = ?`,
    [userId]
  );

const getAssetDistribution = (userId) =>
  query(
    `SELECT 
       ac.name AS category,
       ac.slug,
       COALESCE(SUM(h.total_invested), 0) AS invested,
       COALESCE(SUM(h.quantity * mp.current_price), 0) AS current_value
     FROM portfolios p
     JOIN holdings h ON h.portfolio_id = p.id
     JOIN assets a ON a.id = h.asset_id
     JOIN asset_categories ac ON ac.id = a.category_id
     LEFT JOIN market_prices mp ON mp.asset_id = h.asset_id
     WHERE p.user_id = ?
     GROUP BY ac.id
     ORDER BY current_value DESC`,
    [userId]
  );

const getRecentActivity = (userId, limit = 10) =>
  query(
    `SELECT t.*, a.symbol, a.name AS asset_name, p.name AS portfolio_name
     FROM transactions t
     JOIN assets a ON a.id = t.asset_id
     JOIN portfolios p ON p.id = t.portfolio_id
     WHERE p.user_id = ?
     ORDER BY t.transacted_at DESC
     LIMIT ?`,
    [userId, limit]
  );

module.exports = {
  findPortfoliosByUser,
  findPortfolioById,
  findPortfolioByIdAndUser,
  createPortfolio,
  updatePortfolio,
  deletePortfolio,
  findHoldingsByPortfolio,
  findHoldingById,
  findHoldingByPortfolioAndAsset,
  upsertHolding,
  updateHolding,
  deleteHolding,
  createTransaction,
  findTransactionsByPortfolio,
  findTransactionsByHolding,
  getPortfolioSummary,
  getUserDashboardSummary,
  getAssetDistribution,
  getRecentActivity,
};
