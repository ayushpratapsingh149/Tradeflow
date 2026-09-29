const assetService = require('../services/assetService');
const response = require('../utils/response');
const { asyncHandler } = require('../utils/helpers');

// ─── Assets ──────────────────────────────────────────────────────────────────

const listAssets = asyncHandler(async (req, res) => {
  const assets = await assetService.getAllAssets(req.query.category || null);
  return response.success(res, { assets });
});

const searchAssets = asyncHandler(async (req, res) => {
  const { q, limit, offset } = req.query;
  const result = await assetService.searchAssets({
    q,
    limit: parseInt(limit, 10) || 20,
    offset: parseInt(offset, 10) || 0,
  });
  return response.success(res, result);
});

const getAsset = asyncHandler(async (req, res) => {
  const asset = await assetService.getAsset(req.params.assetId);
  return response.success(res, { asset });
});

// ─── Watchlist ────────────────────────────────────────────────────────────────

const getWatchlist = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 20;
  const offset = parseInt(req.query.offset, 10) || 0;
  const data = await assetService.getWatchlist(req.user.id, { limit, offset });
  return response.success(res, data);
});

const addToWatchlist = asyncHandler(async (req, res) => {
  const { assetId } = req.body;
  const result = await assetService.addToWatchlist(req.user.id, assetId);
  return response.created(res, result, 'Added to watchlist');
});

const removeFromWatchlist = asyncHandler(async (req, res) => {
  await assetService.removeFromWatchlist(req.user.id, req.params.assetId);
  return response.success(res, null, 'Removed from watchlist');
});

module.exports = {
  listAssets,
  searchAssets,
  getAsset,
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist,
};
