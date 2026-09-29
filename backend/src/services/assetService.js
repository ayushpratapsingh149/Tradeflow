const assetRepo = require('../repositories/assetRepository');
const redis = require('../config/redis');
const { NotFoundError, ConflictError } = require('../utils/errors');
const { CACHE_KEYS, CACHE_TTL } = require('../utils/cacheKeys');

// ─── Assets ──────────────────────────────────────────────────────────────────

const getAllAssets = async (categorySlug = null) => {
  const cacheKey = categorySlug ? `assets:cat:${categorySlug}` : CACHE_KEYS.ASSETS_ALL;
  const cached = await redis.get(cacheKey);
  if (cached) return cached;

  const assets = await assetRepo.findAllAssets(categorySlug);
  await redis.set(cacheKey, assets, CACHE_TTL.ASSETS_ALL);
  return assets;
};

const getAsset = async (assetId) => {
  const asset = await assetRepo.findAssetById(assetId);
  if (!asset) throw new NotFoundError('Asset not found');
  return asset;
};

const searchAssets = async ({ q, limit = 20, offset = 0 }) => {
  if (!q || q.length < 1) return { items: [], total: 0 };

  const cacheKey = CACHE_KEYS.ASSET_SEARCH(`${q}:${limit}:${offset}`);
  const cached = await redis.get(cacheKey);
  if (cached) return cached;

  const [items, countRow] = await Promise.all([
    assetRepo.searchAssets(q, limit, offset),
    assetRepo.countSearchAssets(q),
  ]);

  const result = { items, total: countRow?.total || 0 };
  await redis.set(cacheKey, result, CACHE_TTL.ASSET_SEARCH);
  return result;
};

// ─── Watchlist ────────────────────────────────────────────────────────────────

const getWatchlist = async (userId, { limit = 20, offset = 0 } = {}) => {
  const watchlist = await assetRepo.findOrCreateWatchlist(userId);
  const cacheKey = `${CACHE_KEYS.WATCHLIST(watchlist.id)}:${limit}:${offset}`;
  const cached = await redis.get(cacheKey);
  if (cached) return cached;

  const [items, countRow] = await Promise.all([
    assetRepo.findWatchlistItems(watchlist.id, { limit, offset }),
    assetRepo.countWatchlistItems(watchlist.id),
  ]);

  const result = { watchlist, items, total: parseInt(countRow?.total || 0) };
  await redis.set(cacheKey, result, CACHE_TTL.PORTFOLIO_HOLDINGS);
  return result;
};

const addToWatchlist = async (userId, assetId) => {
  const [watchlist, asset] = await Promise.all([
    assetRepo.findOrCreateWatchlist(userId),
    assetRepo.findAssetById(assetId),
  ]);

  if (!asset) throw new NotFoundError('Asset not found');

  const existing = await assetRepo.findWatchlistItem(watchlist.id, assetId);
  if (existing) throw new ConflictError('Asset already in watchlist');

  await assetRepo.addWatchlistItem(watchlist.id, assetId);
  await redis.delPattern(`watchlist:${watchlist.id}:*`);
  await redis.del(CACHE_KEYS.USER_WATCHLIST(userId));
  return { watchlistId: watchlist.id, assetId };
};

const removeFromWatchlist = async (userId, assetId) => {
  const watchlist = await assetRepo.findWatchlistByUser(userId);
  if (!watchlist) throw new NotFoundError('Watchlist not found');

  const item = await assetRepo.findWatchlistItem(watchlist.id, assetId);
  if (!item) throw new NotFoundError('Asset not in watchlist');

  await assetRepo.removeWatchlistItem(watchlist.id, assetId);
  await redis.delPattern(`watchlist:${watchlist.id}:*`);
  await redis.del(CACHE_KEYS.USER_WATCHLIST(userId));
};

module.exports = {
  getAllAssets,
  getAsset,
  searchAssets,
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist,
};
