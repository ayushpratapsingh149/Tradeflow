const { query, queryOne } = require('../config/database');
const { generateId } = require('../utils/helpers');

// ─── Assets ──────────────────────────────────────────────────────────────────

const findAllAssets = (categorySlug = null) => {
  if (categorySlug) {
    return query(
      `SELECT a.*, ac.name AS category_name, ac.slug AS category_slug
       FROM assets a
       JOIN asset_categories ac ON ac.id = a.category_id
       WHERE a.is_active = 1 AND ac.slug = ?
       ORDER BY a.symbol`,
      [categorySlug]
    );
  }
  return query(
    `SELECT a.*, ac.name AS category_name, ac.slug AS category_slug
     FROM assets a
     JOIN asset_categories ac ON ac.id = a.category_id
     WHERE a.is_active = 1
     ORDER BY a.symbol`
  );
};

const findAssetById = (assetId) =>
  queryOne(
    `SELECT a.*, ac.name AS category_name, ac.slug AS category_slug
     FROM assets a
     JOIN asset_categories ac ON ac.id = a.category_id
     WHERE a.id = ?`,
    [assetId]
  );

const findAssetBySymbol = (symbol) =>
  queryOne(
    `SELECT a.*, ac.name AS category_name, ac.slug AS category_slug
     FROM assets a
     JOIN asset_categories ac ON ac.id = a.category_id
     WHERE a.symbol = ?`,
    [symbol.toUpperCase()]
  );

const searchAssets = (searchTerm, limit = 20, offset = 0) =>
  query(
    `SELECT a.*, ac.name AS category_name, ac.slug AS category_slug,
            mp.current_price, mp.change_pct
     FROM assets a
     JOIN asset_categories ac ON ac.id = a.category_id
     LEFT JOIN market_prices mp ON mp.asset_id = a.id
     WHERE a.is_active = 1
       AND (a.symbol LIKE ? OR a.name LIKE ?)
     ORDER BY 
       CASE WHEN a.symbol = ? THEN 0 
            WHEN a.symbol LIKE ? THEN 1 
            ELSE 2 END,
       a.symbol
     LIMIT ? OFFSET ?`,
    [
      `${searchTerm}%`,
      `%${searchTerm}%`,
      searchTerm.toUpperCase(),
      `${searchTerm.toUpperCase()}%`,
      limit,
      offset,
    ]
  );

const countSearchAssets = (searchTerm) =>
  queryOne(
    `SELECT COUNT(*) AS total FROM assets a
     WHERE a.is_active = 1 AND (a.symbol LIKE ? OR a.name LIKE ?)`,
    [`${searchTerm}%`, `%${searchTerm}%`]
  );

const upsertMarketPrice = (assetId, data) => {
  const { currentPrice, openPrice, highPrice, lowPrice, volume, changeAmount, changePct, marketCap } = data;
  return query(
    `INSERT INTO market_prices 
       (asset_id, current_price, open_price, high_price, low_price, volume, change_amount, change_pct, market_cap, fetched_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
     ON DUPLICATE KEY UPDATE
       current_price = VALUES(current_price),
       open_price    = VALUES(open_price),
       high_price    = VALUES(high_price),
       low_price     = VALUES(low_price),
       volume        = VALUES(volume),
       change_amount = VALUES(change_amount),
       change_pct    = VALUES(change_pct),
       market_cap    = VALUES(market_cap),
       fetched_at    = NOW()`,
    [assetId, currentPrice, openPrice ?? null, highPrice ?? null, lowPrice ?? null,
      volume ?? null, changeAmount ?? null, changePct ?? null, marketCap ?? null]
  );
};

const getMarketPrice = (assetId) =>
  queryOne('SELECT * FROM market_prices WHERE asset_id = ?', [assetId]);

// ─── Watchlists ───────────────────────────────────────────────────────────────

const findOrCreateWatchlist = async (userId, name = 'Default Watchlist') => {
  let wl = await queryOne('SELECT * FROM watchlists WHERE user_id = ? LIMIT 1', [userId]);
  if (!wl) {
    const id = generateId();
    await query('INSERT INTO watchlists (id, user_id, name) VALUES (?, ?, ?)', [id, userId, name]);
    wl = await queryOne('SELECT * FROM watchlists WHERE id = ?', [id]);
  }
  return wl;
};

const findWatchlistByUser = (userId) =>
  queryOne('SELECT * FROM watchlists WHERE user_id = ?', [userId]);

const findWatchlistItems = (watchlistId, { limit = 20, offset = 0 } = {}) =>
  query(
    `SELECT wi.*, 
            a.symbol, a.name AS asset_name, a.exchange, a.currency AS asset_currency,
            ac.name AS category_name, ac.slug AS category_slug,
            mp.current_price, mp.change_amount, mp.change_pct,
            mp.open_price, mp.high_price, mp.low_price, mp.volume, mp.fetched_at AS price_fetched_at
     FROM watchlist_items wi
     JOIN assets a ON a.id = wi.asset_id
     JOIN asset_categories ac ON ac.id = a.category_id
     LEFT JOIN market_prices mp ON mp.asset_id = wi.asset_id
     WHERE wi.watchlist_id = ?
     ORDER BY wi.added_at DESC
     LIMIT ? OFFSET ?`,
    [watchlistId, limit, offset]
  );

const countWatchlistItems = (watchlistId) =>
  queryOne('SELECT COUNT(*) AS total FROM watchlist_items WHERE watchlist_id = ?', [watchlistId]);

const findWatchlistItem = (watchlistId, assetId) =>
  queryOne('SELECT * FROM watchlist_items WHERE watchlist_id = ? AND asset_id = ?', [watchlistId, assetId]);

const addWatchlistItem = async (watchlistId, assetId) => {
  const id = generateId();
  await query(
    'INSERT INTO watchlist_items (id, watchlist_id, asset_id) VALUES (?, ?, ?)',
    [id, watchlistId, assetId]
  );
  return id;
};

const removeWatchlistItem = (watchlistId, assetId) =>
  query('DELETE FROM watchlist_items WHERE watchlist_id = ? AND asset_id = ?', [watchlistId, assetId]);

module.exports = {
  findAllAssets,
  findAssetById,
  findAssetBySymbol,
  searchAssets,
  countSearchAssets,
  upsertMarketPrice,
  getMarketPrice,
  findOrCreateWatchlist,
  findWatchlistByUser,
  findWatchlistItems,
  countWatchlistItems,
  findWatchlistItem,
  addWatchlistItem,
  removeWatchlistItem,
};
