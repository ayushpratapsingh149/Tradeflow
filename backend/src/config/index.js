require('dotenv').config();

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5000,
  apiPrefix: process.env.API_PREFIX || '/api/v1',

  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },

  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    name: process.env.DB_NAME || 'tradeflow_db',
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT, 10) || 10,
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    ttl: {
      short: parseInt(process.env.REDIS_TTL_SHORT, 10) || 300,
      medium: parseInt(process.env.REDIS_TTL_MEDIUM, 10) || 1800,
      long: parseInt(process.env.REDIS_TTL_LONG, 10) || 3600,
    },
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000,
    max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
  },

  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  },

  bcrypt: {
    rounds: parseInt(process.env.BCRYPT_ROUNDS, 10) || 12,
  },

  market: {
    apiKey: process.env.MARKET_API_KEY || '',
    baseUrl: process.env.MARKET_API_BASE_URL || 'https://www.alphavantage.co/query',
  },
};

const requiredVars = ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'DB_PASSWORD'];
if (config.env === 'production') {
  requiredVars.forEach((varName) => {
    if (!process.env[varName]) {
      throw new Error(`Missing required environment variable: ${varName}`);
    }
  });
}

module.exports = config;
