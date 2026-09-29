const portfolioService = require('../services/portfolioService');
const response = require('../utils/response');
const { asyncHandler } = require('../utils/helpers');

// ─── Portfolio CRUD ──────────────────────────────────────────────────────────

const listPortfolios = asyncHandler(async (req, res) => {
  const portfolios = await portfolioService.getPortfolios(req.user.id);
  return response.success(res, { portfolios });
});

const getPortfolio = asyncHandler(async (req, res) => {
  const portfolio = await portfolioService.getPortfolio(req.params.portfolioId, req.user.id);
  return response.success(res, { portfolio });
});

const createPortfolio = asyncHandler(async (req, res) => {
  const portfolio = await portfolioService.createPortfolio(req.user.id, req.body);
  return response.created(res, { portfolio }, 'Portfolio created');
});

const updatePortfolio = asyncHandler(async (req, res) => {
  const portfolio = await portfolioService.updatePortfolio(req.params.portfolioId, req.user.id, req.body);
  return response.success(res, { portfolio }, 'Portfolio updated');
});

const deletePortfolio = asyncHandler(async (req, res) => {
  await portfolioService.deletePortfolio(req.params.portfolioId, req.user.id);
  return response.success(res, null, 'Portfolio deleted');
});

// ─── Holdings ─────────────────────────────────────────────────────────────────

const getHoldings = asyncHandler(async (req, res) => {
  const holdings = await portfolioService.getHoldings(req.params.portfolioId, req.user.id);
  return response.success(res, { holdings });
});

const addTransaction = asyncHandler(async (req, res) => {
  const result = await portfolioService.addTransaction(req.params.portfolioId, req.user.id, req.body);
  return response.created(res, result, 'Transaction recorded');
});

const deleteHolding = asyncHandler(async (req, res) => {
  await portfolioService.deleteHolding(req.params.holdingId, req.params.portfolioId, req.user.id);
  return response.success(res, null, 'Holding removed');
});

// ─── Summary / Dashboard ──────────────────────────────────────────────────────

const getPortfolioSummary = asyncHandler(async (req, res) => {
  const summary = await portfolioService.getPortfolioSummary(req.params.portfolioId, req.user.id);
  return response.success(res, { summary });
});

const getDashboard = asyncHandler(async (req, res) => {
  const data = await portfolioService.getDashboard(req.user.id);
  return response.success(res, data);
});

// ─── Transactions ─────────────────────────────────────────────────────────────

const getTransactions = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 20;
  const offset = parseInt(req.query.offset, 10) || 0;
  const transactions = await portfolioService.getTransactions(req.params.portfolioId, req.user.id, { limit, offset });
  return response.success(res, { transactions });
});

module.exports = {
  listPortfolios,
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
