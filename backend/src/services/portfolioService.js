const portfolioRepo = require('../repositories/portfolioRepository');
const assetRepo = require('../repositories/assetRepository');
const redis = require('../config/redis');
const { transaction } = require('../config/database');
const { NotFoundError, ForbiddenError, ValidationError } = require('../utils/errors');
const { CACHE_KEYS, CACHE_TTL } = require('../utils/cacheKeys');
const { toFixed } = require('../utils/helpers');

// ─── Portfolio CRUD ──────────────────────────────────────────────────────────

const getPortfolios = async (userId) => {
  const cacheKey = CACHE_KEYS.PORTFOLIO_LIST(userId);
  const cached = await redis.get(cacheKey);
  if (cached) return cached;

  const portfolios = await portfolioRepo.findPortfoliosByUser(userId);
  await redis.set(cacheKey, portfolios, CACHE_TTL.PORTFOLIO_HOLDINGS);
  return portfolios;
};

const getPortfolio = async (portfolioId, userId) => {
  const portfolio = await portfolioRepo.findPortfolioByIdAndUser(portfolioId, userId);
  if (!portfolio) throw new NotFoundError('Portfolio not found');
  return portfolio;
};

const createPortfolio = async (userId, data) => {
  const portfolios = await portfolioRepo.findPortfoliosByUser(userId);
  const isDefault = portfolios.length === 0 ? 1 : data.isDefault ? 1 : 0;
  const portfolio = await portfolioRepo.createPortfolio({ ...data, userId, isDefault });
  await redis.del(CACHE_KEYS.PORTFOLIO_LIST(userId));
  return portfolio;
};

const updatePortfolio = async (portfolioId, userId, data) => {
  const portfolio = await portfolioRepo.findPortfolioByIdAndUser(portfolioId, userId);
  if (!portfolio) throw new NotFoundError('Portfolio not found');
  await portfolioRepo.updatePortfolio(portfolioId, data);
  await redis.del(CACHE_KEYS.PORTFOLIO_LIST(userId), CACHE_KEYS.PORTFOLIO_DETAIL(portfolioId));
  return portfolioRepo.findPortfolioById(portfolioId);
};

const deletePortfolio = async (portfolioId, userId) => {
  const portfolio = await portfolioRepo.findPortfolioByIdAndUser(portfolioId, userId);
  if (!portfolio) throw new NotFoundError('Portfolio not found');
  if (portfolio.is_default) throw new ValidationError('Cannot delete the default portfolio');
  await portfolioRepo.deletePortfolio(portfolioId);
  await redis.del(
    CACHE_KEYS.PORTFOLIO_LIST(userId),
    CACHE_KEYS.PORTFOLIO_DETAIL(portfolioId),
    CACHE_KEYS.PORTFOLIO_HOLDINGS(portfolioId),
    CACHE_KEYS.PORTFOLIO_SUMMARY(portfolioId)
  );
};

// ─── Holdings ─────────────────────────────────────────────────────────────────

const getHoldings = async (portfolioId, userId) => {
  const portfolio = await portfolioRepo.findPortfolioByIdAndUser(portfolioId, userId);
  if (!portfolio) throw new NotFoundError('Portfolio not found');

  const cacheKey = CACHE_KEYS.PORTFOLIO_HOLDINGS(portfolioId);
  const cached = await redis.get(cacheKey);
  if (cached) return cached;

  const holdings = await portfolioRepo.findHoldingsByPortfolio(portfolioId);
  const enriched = holdings.map((h) => {
    const currentValue = parseFloat(h.quantity) * parseFloat(h.current_price || 0);
    const invested = parseFloat(h.total_invested);
    const pnl = currentValue - invested;
    const pnlPct = invested > 0 ? (pnl / invested) * 100 : 0;
    return {
      ...h,
      current_value: toFixed(currentValue),
      pnl: toFixed(pnl),
      pnl_pct: toFixed(pnlPct),
    };
  });

  await redis.set(cacheKey, enriched, CACHE_TTL.PORTFOLIO_HOLDINGS);
  return enriched;
};

const addTransaction = async (portfolioId, userId, txData) => {
  const portfolio = await portfolioRepo.findPortfolioByIdAndUser(portfolioId, userId);
  if (!portfolio) throw new NotFoundError('Portfolio not found');

  const asset = await assetRepo.findAssetById(txData.assetId);
  if (!asset) throw new NotFoundError('Asset not found');

  const result = await transaction(async (conn) => {
    // Get or create holding
    let existing = await portfolioRepo.findHoldingByPortfolioAndAsset(portfolioId, txData.assetId);
    let newQty, newAvgPrice, newTotalInvested;

    if (txData.type === 'buy') {
      if (existing) {
        // Weighted average price calculation
        const totalQty = parseFloat(existing.quantity) + parseFloat(txData.quantity);
        const totalCost = parseFloat(existing.total_invested) + (parseFloat(txData.quantity) * parseFloat(txData.price));
        newQty = toFixed(totalQty, 8);
        newAvgPrice = toFixed(totalCost / totalQty);
        newTotalInvested = toFixed(totalCost);
      } else {
        newQty = toFixed(txData.quantity, 8);
        newAvgPrice = toFixed(txData.price);
        newTotalInvested = toFixed(parseFloat(txData.quantity) * parseFloat(txData.price));
      }
    } else {
      // sell
      if (!existing || parseFloat(existing.quantity) < parseFloat(txData.quantity)) {
        throw new ValidationError('Insufficient quantity to sell');
      }
      newQty = toFixed(parseFloat(existing.quantity) - parseFloat(txData.quantity), 8);
      newAvgPrice = parseFloat(existing.avg_buy_price);
      const soldCost = parseFloat(existing.avg_buy_price) * parseFloat(txData.quantity);
      newTotalInvested = toFixed(Math.max(0, parseFloat(existing.total_invested) - soldCost));
    }

    const holdingId = await portfolioRepo.upsertHolding(conn, {
      portfolioId,
      assetId: txData.assetId,
      quantity: newQty,
      avgBuyPrice: newAvgPrice,
      totalInvested: newTotalInvested,
    });

    const txId = await portfolioRepo.createTransaction(conn, {
      holdingId,
      portfolioId,
      assetId: txData.assetId,
      type: txData.type,
      quantity: txData.quantity,
      price: txData.price,
      totalAmount: parseFloat(txData.quantity) * parseFloat(txData.price),
      fee: txData.fee || 0,
      notes: txData.notes,
      transactedAt: txData.transactedAt || new Date(),
    });

    return { holdingId, txId };
  });

  // Invalidate caches
  await redis.del(
    CACHE_KEYS.PORTFOLIO_HOLDINGS(portfolioId),
    CACHE_KEYS.PORTFOLIO_SUMMARY(portfolioId),
    CACHE_KEYS.DASHBOARD_SUMMARY(userId)
  );

  return result;
};

const deleteHolding = async (holdingId, portfolioId, userId) => {
  const portfolio = await portfolioRepo.findPortfolioByIdAndUser(portfolioId, userId);
  if (!portfolio) throw new NotFoundError('Portfolio not found');

  const holding = await portfolioRepo.findHoldingById(holdingId);
  if (!holding || holding.portfolio_id !== portfolioId) throw new NotFoundError('Holding not found');

  await portfolioRepo.deleteHolding(holdingId);
  await redis.del(
    CACHE_KEYS.PORTFOLIO_HOLDINGS(portfolioId),
    CACHE_KEYS.PORTFOLIO_SUMMARY(portfolioId),
    CACHE_KEYS.DASHBOARD_SUMMARY(userId)
  );
};

// ─── Portfolio Summary ────────────────────────────────────────────────────────

const getPortfolioSummary = async (portfolioId, userId) => {
  const portfolio = await portfolioRepo.findPortfolioByIdAndUser(portfolioId, userId);
  if (!portfolio) throw new NotFoundError('Portfolio not found');

  const cacheKey = CACHE_KEYS.PORTFOLIO_SUMMARY(portfolioId);
  const cached = await redis.get(cacheKey);
  if (cached) return cached;

  const summary = await portfolioRepo.getPortfolioSummary(portfolioId);
  await redis.set(cacheKey, summary, CACHE_TTL.PORTFOLIO_SUMMARY);
  return summary;
};

// ─── Dashboard ────────────────────────────────────────────────────────────────

const getDashboard = async (userId) => {
  const cacheKey = CACHE_KEYS.DASHBOARD_SUMMARY(userId);
  const cached = await redis.get(cacheKey);
  if (cached) return cached;

  const [summary, distribution, recent] = await Promise.all([
    portfolioRepo.getUserDashboardSummary(userId),
    portfolioRepo.getAssetDistribution(userId),
    portfolioRepo.getRecentActivity(userId, 10),
  ]);

  const result = { summary, distribution, recentActivity: recent };
  await redis.set(cacheKey, result, CACHE_TTL.DASHBOARD);
  return result;
};

// ─── Transactions ─────────────────────────────────────────────────────────────

const getTransactions = async (portfolioId, userId, { limit = 20, offset = 0 } = {}) => {
  const portfolio = await portfolioRepo.findPortfolioByIdAndUser(portfolioId, userId);
  if (!portfolio) throw new NotFoundError('Portfolio not found');
  return portfolioRepo.findTransactionsByPortfolio(portfolioId, { limit, offset });
};

module.exports = {
  getPortfolios,
  getPortfolio,
  createPortfolio,
  updatePortfolio,
  deletePortfolio,
  getHoldings,
  addTransaction,
  deleteHolding,
  getPortfolioSummary,
  getDashboard,
  getTransactions,
};
