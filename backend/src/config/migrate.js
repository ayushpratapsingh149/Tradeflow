require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { createPool, testConnection } = require('./database');
const logger = require('../utils/logger');

const SCHEMA = `
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id            CHAR(36)      NOT NULL,
  email         VARCHAR(255)  NOT NULL,
  username      VARCHAR(50)   NOT NULL,
  password_hash VARCHAR(255)  NOT NULL,
  full_name     VARCHAR(100)  NOT NULL,
  role          ENUM('user','admin') NOT NULL DEFAULT 'user',
  is_active     TINYINT(1)    NOT NULL DEFAULT 1,
  last_login_at DATETIME      NULL,
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email    (email),
  UNIQUE KEY uq_users_username (username),
  INDEX idx_users_role (role),
  INDEX idx_users_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Refresh tokens table
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id         CHAR(36)     NOT NULL,
  user_id    CHAR(36)     NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  expires_at DATETIME     NOT NULL,
  revoked    TINYINT(1)   NOT NULL DEFAULT 0,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_refresh_tokens_hash (token_hash),
  INDEX idx_refresh_tokens_user_id (user_id),
  CONSTRAINT fk_refresh_tokens_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Asset categories
CREATE TABLE IF NOT EXISTS asset_categories (
  id         TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name       VARCHAR(50)      NOT NULL,
  slug       VARCHAR(50)      NOT NULL,
  created_at DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_asset_categories_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Assets/instruments master
CREATE TABLE IF NOT EXISTS assets (
  id          CHAR(36)         NOT NULL,
  symbol      VARCHAR(20)      NOT NULL,
  name        VARCHAR(255)     NOT NULL,
  category_id TINYINT UNSIGNED NOT NULL,
  exchange    VARCHAR(50)      NULL,
  currency    CHAR(3)          NOT NULL DEFAULT 'USD',
  is_active   TINYINT(1)       NOT NULL DEFAULT 1,
  created_at  DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_assets_symbol (symbol),
  INDEX idx_assets_category (category_id),
  INDEX idx_assets_symbol (symbol),
  FULLTEXT INDEX ft_assets_search (symbol, name),
  CONSTRAINT fk_assets_category FOREIGN KEY (category_id) REFERENCES asset_categories(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Portfolios (users can have multiple)
CREATE TABLE IF NOT EXISTS portfolios (
  id          CHAR(36)     NOT NULL,
  user_id     CHAR(36)     NOT NULL,
  name        VARCHAR(100) NOT NULL,
  description TEXT         NULL,
  currency    CHAR(3)      NOT NULL DEFAULT 'USD',
  is_default  TINYINT(1)   NOT NULL DEFAULT 0,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_portfolios_user_id (user_id),
  CONSTRAINT fk_portfolios_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Portfolio holdings (individual investment positions)
CREATE TABLE IF NOT EXISTS holdings (
  id              CHAR(36)       NOT NULL,
  portfolio_id    CHAR(36)       NOT NULL,
  asset_id        CHAR(36)       NOT NULL,
  quantity        DECIMAL(18,8)  NOT NULL DEFAULT 0,
  avg_buy_price   DECIMAL(18,4)  NOT NULL DEFAULT 0,
  total_invested  DECIMAL(18,4)  NOT NULL DEFAULT 0,
  notes           TEXT           NULL,
  created_at      DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_holdings_portfolio_asset (portfolio_id, asset_id),
  INDEX idx_holdings_portfolio_id (portfolio_id),
  INDEX idx_holdings_asset_id (asset_id),
  CONSTRAINT fk_holdings_portfolio FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE CASCADE,
  CONSTRAINT fk_holdings_asset     FOREIGN KEY (asset_id)     REFERENCES assets(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Transactions (buy/sell history for each holding)
CREATE TABLE IF NOT EXISTS transactions (
  id             CHAR(36)            NOT NULL,
  holding_id     CHAR(36)            NOT NULL,
  portfolio_id   CHAR(36)            NOT NULL,
  asset_id       CHAR(36)            NOT NULL,
  type           ENUM('buy','sell')  NOT NULL,
  quantity       DECIMAL(18,8)       NOT NULL,
  price          DECIMAL(18,4)       NOT NULL,
  total_amount   DECIMAL(18,4)       NOT NULL,
  fee            DECIMAL(18,4)       NOT NULL DEFAULT 0,
  notes          TEXT                NULL,
  transacted_at  DATETIME            NOT NULL,
  created_at     DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_transactions_holding_id   (holding_id),
  INDEX idx_transactions_portfolio_id (portfolio_id),
  INDEX idx_transactions_asset_id     (asset_id),
  INDEX idx_transactions_type         (type),
  INDEX idx_transactions_transacted_at (transacted_at),
  CONSTRAINT fk_transactions_holding   FOREIGN KEY (holding_id)   REFERENCES holdings(id) ON DELETE CASCADE,
  CONSTRAINT fk_transactions_portfolio FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE CASCADE,
  CONSTRAINT fk_transactions_asset     FOREIGN KEY (asset_id)     REFERENCES assets(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Watchlists
CREATE TABLE IF NOT EXISTS watchlists (
  id         CHAR(36)     NOT NULL,
  user_id    CHAR(36)     NOT NULL,
  name       VARCHAR(100) NOT NULL DEFAULT 'Default Watchlist',
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_watchlists_user_id (user_id),
  CONSTRAINT fk_watchlists_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Watchlist items
CREATE TABLE IF NOT EXISTS watchlist_items (
  id           CHAR(36)  NOT NULL,
  watchlist_id CHAR(36)  NOT NULL,
  asset_id     CHAR(36)  NOT NULL,
  added_at     DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_watchlist_items (watchlist_id, asset_id),
  INDEX idx_watchlist_items_watchlist_id (watchlist_id),
  INDEX idx_watchlist_items_asset_id     (asset_id),
  CONSTRAINT fk_watchlist_items_watchlist FOREIGN KEY (watchlist_id) REFERENCES watchlists(id) ON DELETE CASCADE,
  CONSTRAINT fk_watchlist_items_asset     FOREIGN KEY (asset_id)     REFERENCES assets(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Market price snapshots (cached prices)
CREATE TABLE IF NOT EXISTS market_prices (
  asset_id      CHAR(36)      NOT NULL,
  current_price DECIMAL(18,4) NOT NULL,
  open_price    DECIMAL(18,4) NULL,
  high_price    DECIMAL(18,4) NULL,
  low_price     DECIMAL(18,4) NULL,
  volume        BIGINT        NULL,
  change_amount DECIMAL(18,4) NULL,
  change_pct    DECIMAL(10,4) NULL,
  market_cap    BIGINT        NULL,
  fetched_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (asset_id),
  CONSTRAINT fk_market_prices_asset FOREIGN KEY (asset_id) REFERENCES assets(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Activity log
CREATE TABLE IF NOT EXISTS activity_logs (
  id         CHAR(36)     NOT NULL,
  user_id    CHAR(36)     NOT NULL,
  action     VARCHAR(100) NOT NULL,
  entity     VARCHAR(50)  NULL,
  entity_id  CHAR(36)     NULL,
  meta       JSON         NULL,
  ip_address VARCHAR(45)  NULL,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_activity_logs_user_id    (user_id),
  INDEX idx_activity_logs_created_at (created_at),
  CONSTRAINT fk_activity_logs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

const SEED_CATEGORIES = `
INSERT IGNORE INTO asset_categories (name, slug) VALUES
  ('Stocks', 'stocks'),
  ('ETFs', 'etfs'),
  ('Cryptocurrency', 'crypto'),
  ('Bonds', 'bonds'),
  ('Commodities', 'commodities'),
  ('Mutual Funds', 'mutual-funds');
`;

const SEED_ASSETS = `
INSERT IGNORE INTO assets (id, symbol, name, category_id, exchange, currency) VALUES
  (UUID(), 'AAPL',  'Apple Inc.',                       1, 'NASDAQ', 'USD'),
  (UUID(), 'MSFT',  'Microsoft Corporation',             1, 'NASDAQ', 'USD'),
  (UUID(), 'GOOGL', 'Alphabet Inc. Class A',             1, 'NASDAQ', 'USD'),
  (UUID(), 'AMZN',  'Amazon.com Inc.',                   1, 'NASDAQ', 'USD'),
  (UUID(), 'NVDA',  'NVIDIA Corporation',                1, 'NASDAQ', 'USD'),
  (UUID(), 'META',  'Meta Platforms Inc.',               1, 'NASDAQ', 'USD'),
  (UUID(), 'TSLA',  'Tesla Inc.',                        1, 'NASDAQ', 'USD'),
  (UUID(), 'NFLX',  'Netflix Inc.',                      1, 'NASDAQ', 'USD'),
  (UUID(), 'JPM',   'JPMorgan Chase & Co.',              1, 'NYSE',   'USD'),
  (UUID(), 'BRK.B', 'Berkshire Hathaway Inc. Class B',  1, 'NYSE',   'USD'),
  (UUID(), 'SPY',   'SPDR S&P 500 ETF Trust',            2, 'NYSE',   'USD'),
  (UUID(), 'QQQ',   'Invesco QQQ Trust',                 2, 'NASDAQ', 'USD'),
  (UUID(), 'VTI',   'Vanguard Total Stock Market ETF',   2, 'NYSE',   'USD'),
  (UUID(), 'BTC',   'Bitcoin',                           3, 'CRYPTO', 'USD'),
  (UUID(), 'ETH',   'Ethereum',                          3, 'CRYPTO', 'USD'),
  (UUID(), 'BNB',   'Binance Coin',                      3, 'CRYPTO', 'USD'),
  (UUID(), 'SOL',   'Solana',                            3, 'CRYPTO', 'USD'),
  (UUID(), 'GLD',   'SPDR Gold Shares',                  5, 'NYSE',   'USD'),
  (UUID(), 'SLV',   'iShares Silver Trust',              5, 'NYSE',   'USD');
`;

const run = async () => {
  logger.info('Starting database migration...');
  await testConnection();
  const pool = createPool();
  const conn = await pool.getConnection();

  try {
    const statements = SCHEMA.split(';').map((s) => s.trim()).filter(Boolean);
    for (const stmt of statements) {
      await conn.execute(stmt);
    }
    logger.info('Schema applied successfully');

    await conn.execute(SEED_CATEGORIES);
    logger.info('Asset categories seeded');

    await conn.execute(SEED_ASSETS);
    logger.info('Sample assets seeded');

    logger.info('Migration completed successfully');
  } catch (err) {
    logger.error('Migration failed:', err);
    throw err;
  } finally {
    conn.release();
    await pool.end();
  }
};

run().catch((err) => {
  logger.error(err);
  process.exit(1);
});
