const CACHE_KEYS = {
  // User-specific
  USER_PROFILE: (userId) => `user:${userId}:profile`,

  // Portfolio
  PORTFOLIO_LIST: (userId) => `user:${userId}:portfolios`,
  PORTFOLIO_DETAIL: (portfolioId) => `portfolio:${portfolioId}:detail`,
  PORTFOLIO_HOLDINGS: (portfolioId) => `portfolio:${portfolioId}:holdings`,
  PORTFOLIO_SUMMARY: (portfolioId) => `portfolio:${portfolioId}:summary`,
  PORTFOLIO_TRANSACTIONS: (portfolioId) => `portfolio:${portfolioId}:txns`,

  // Dashboard
  DASHBOARD_SUMMARY: (userId) => `user:${userId}:dashboard`,

  // Watchlist
  WATCHLIST: (watchlistId) => `watchlist:${watchlistId}:items`,
  USER_WATCHLIST: (userId) => `user:${userId}:watchlist`,

  // Market data
  MARKET_PRICE: (symbol) => `market:price:${symbol}`,
  MARKET_PRICES_BULK: 'market:prices:bulk',
  ASSET_SEARCH: (query) => `assets:search:${query.toLowerCase()}`,
  ASSETS_ALL: 'assets:all',
};

const CACHE_TTL = {
  MARKET_PRICE: 60,       // 1 min - very volatile
  DASHBOARD: 120,         // 2 min
  PORTFOLIO_SUMMARY: 180, // 3 min
  PORTFOLIO_HOLDINGS: 300, // 5 min
  ASSET_SEARCH: 600,      // 10 min
  USER_PROFILE: 900,      // 15 min
  ASSETS_ALL: 3600,       // 1 hour - rarely changes
};

module.exports = { CACHE_KEYS, CACHE_TTL };
