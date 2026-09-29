# TradeFlow — Deployment & Setup Guide

## Architecture Overview

```
tradeflow/
├── backend/                   # Node.js + Express API
│   └── src/
│       ├── config/            # DB, Redis, env config + migrations
│       ├── controllers/       # Route handlers (thin layer)
│       ├── middleware/        # Auth, error handling, rate limit, validate
│       ├── models/            # (reserved for ORM expansion)
│       ├── repositories/      # Raw SQL query functions per domain
│       ├── routes/            # Express router definitions
│       ├── services/          # Business logic layer
│       ├── utils/             # Logger, JWT, helpers, errors, cache keys
│       └── validators/        # express-validator rule sets
├── frontend/                  # React + Vite + Tailwind
│   └── src/
│       ├── api/               # Axios client + service modules
│       ├── components/        # Reusable UI components
│       ├── hooks/             # useApi, useMutation custom hooks
│       ├── pages/             # Route-level page components
│       ├── store/             # Context providers (Auth, Toast)
│       ├── styles/            # Global CSS, Tailwind tokens
│       └── utils/             # Formatters, helpers
└── docker-compose.yml         # Local full-stack environment
```

---

## MySQL Schema

Run `npm run migrate` after setting up the DB. Tables created:

| Table | Purpose |
|---|---|
| `users` | Auth accounts with role |
| `refresh_tokens` | Persisted refresh token hashes |
| `asset_categories` | Stocks, ETFs, Crypto, etc. |
| `assets` | Master instrument list (AAPL, BTC…) |
| `portfolios` | User-owned portfolio groups |
| `holdings` | Aggregated position per asset per portfolio |
| `transactions` | Buy/sell audit trail |
| `watchlists` | User watchlist container |
| `watchlist_items` | Asset entries in a watchlist |
| `market_prices` | Cached price snapshots |
| `activity_logs` | User action audit log |

---

## API Endpoints

### Auth — `/api/v1/auth`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/register` | Public | Create account |
| POST | `/login` | Public | Get tokens |
| POST | `/refresh` | Public | Rotate refresh token |
| POST | `/logout` | Public | Revoke refresh token |
| GET | `/me` | Bearer | Current user profile |

### Portfolios — `/api/v1/portfolios`
| Method | Path | Description |
|---|---|---|
| GET | `/dashboard` | Summary + distribution + activity |
| GET | `/` | List user portfolios |
| POST | `/` | Create portfolio |
| GET | `/:id` | Get single portfolio |
| PUT | `/:id` | Update portfolio |
| DELETE | `/:id` | Delete portfolio |
| GET | `/:id/summary` | Portfolio P&L summary |
| GET | `/:id/holdings` | Holdings with current value & P&L |
| POST | `/:id/transactions` | Add buy/sell transaction |
| GET | `/:id/transactions` | Transaction history |
| DELETE | `/:id/holdings/:hId` | Remove holding + history |

### Assets — `/api/v1/assets`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | Public | List all assets (filter by category) |
| GET | `/search?q=` | Public | Full-text asset search |
| GET | `/:id` | Public | Asset detail |
| GET | `/watchlist` | Bearer | User watchlist |
| POST | `/watchlist` | Bearer | Add to watchlist |
| DELETE | `/watchlist/:assetId` | Bearer | Remove from watchlist |

---

## Redis Caching Strategy

| Cache Key Pattern | TTL | Invalidated On |
|---|---|---|
| `user:{id}:dashboard` | 2 min | New transaction |
| `portfolio:{id}:summary` | 3 min | New transaction, delete holding |
| `portfolio:{id}:holdings` | 5 min | New transaction, delete holding |
| `user:{id}:portfolios` | 5 min | Create/delete portfolio |
| `watchlist:{id}:*` | 5 min | Add/remove watchlist item |
| `assets:search:{q}` | 10 min | Automatic TTL |
| `market:price:{sym}` | 1 min | Price update job |
| `assets:all` | 1 hour | Asset changes (rare) |

---

## Local Development Setup

### Prerequisites
- Node.js 18+
- MySQL 8.0
- Redis 7+

### Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your DB credentials and JWT secrets
npm install
npm run migrate       # Creates schema + seeds categories/assets
npm run dev           # Starts on http://localhost:5000
```

### Frontend

```bash
cd frontend
cp .env.example .env.local
# Set VITE_API_BASE_URL=http://localhost:5000/api/v1
npm install
npm run dev           # Starts on http://localhost:5173
```

### Docker (recommended for full stack)

```bash
# From project root
docker-compose up -d          # Starts MySQL + Redis + Backend
cd backend && npm run migrate  # Run migrations against Dockerized MySQL
cd ../frontend && npm run dev  # Start frontend locally
```

---

## Deployment

### Frontend → Vercel

1. Push `frontend/` to a GitHub repo
2. Import in Vercel dashboard
3. Set environment variable:
   ```
   VITE_API_BASE_URL = https://your-api-domain.com/api/v1
   ```
4. Build settings: framework = Vite, output dir = `dist`
5. `vercel.json` handles SPA rewrites automatically

### Backend → Railway / Render / Fly.io

**Railway:**
```bash
railway init
railway add --plugin mysql
railway add --plugin redis
railway up
# Set all .env vars in Railway dashboard
# Run migration: railway run npm run migrate
```

**Render:**
1. New Web Service → connect repo
2. Build command: `npm install`
3. Start command: `npm start`
4. Add all environment variables
5. Add managed MySQL + Redis from Render dashboard

**Fly.io:**
```bash
fly launch --dockerfile backend/Dockerfile
fly secrets set JWT_SECRET=... DB_HOST=... # etc
fly deploy
```

---

## Environment Variables Reference

### Backend `.env`
```env
NODE_ENV=production
PORT=5000
API_PREFIX=/api/v1

JWT_SECRET=<min 32 chars, random>
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=<min 32 chars, different from above>
JWT_REFRESH_EXPIRES_IN=30d

DB_HOST=<mysql host>
DB_PORT=3306
DB_USER=<db user>
DB_PASSWORD=<db password>
DB_NAME=tradeflow_db
DB_CONNECTION_LIMIT=10

REDIS_HOST=<redis host>
REDIS_PORT=6379
REDIS_PASSWORD=<redis password if any>

CORS_ORIGIN=https://your-frontend.vercel.app
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

### Frontend `.env.local`
```env
VITE_API_BASE_URL=https://your-api.com/api/v1
VITE_APP_NAME=TradeFlow
```

---

## Production Checklist

- [ ] JWT secrets are random, minimum 32 chars, stored securely
- [ ] CORS_ORIGIN set to exact frontend domain (no trailing slash)
- [ ] BCRYPT_ROUNDS=12 (don't lower this)
- [ ] MySQL user has least-privilege access
- [ ] Redis password enabled in production
- [ ] Rate limiting tuned for expected traffic
- [ ] DB_CONNECTION_LIMIT set to ≤ MySQL max_connections
- [ ] `NODE_ENV=production` set
- [ ] Vercel environment variables configured
- [ ] HTTPS enforced on backend (via reverse proxy/platform)
- [ ] Health endpoint monitored: `GET /api/v1/health`
- [ ] Log aggregation set up (Winston → stdout → platform log drain)
- [ ] Database backups enabled
- [ ] Migration ran successfully before first deploy

---

## Adding Real Market Data

The schema supports a `market_prices` table. To populate it:

1. Get a free API key from [Alpha Vantage](https://www.alphavantage.co/support/#api-key)
2. Set `MARKET_API_KEY` in `.env`
3. Create a scheduled job (cron/Bull queue) that calls Alpha Vantage and upserts via `assetRepository.upsertMarketPrice()`
4. Redis cache at `market:price:{symbol}` will serve subsequent reads for 60s

---

## Key Engineering Patterns Used

- **Repository pattern** — DB queries isolated per domain, swappable
- **Service layer** — Business logic decoupled from HTTP
- **Async wrapper** — `asyncHandler` prevents try/catch boilerplate in controllers
- **Token rotation** — Refresh tokens are single-use, hashed before storage
- **Cache-aside** — Check Redis → miss → DB query → write to Redis
- **TTL invalidation** — Cache busted on writes, not polled
- **Weighted avg price** — Buy transactions recalculate avg_buy_price correctly
- **Cursor-ready** — Utilities for cursor-based pagination built in
- **Graceful shutdown** — SIGTERM/SIGINT handlers on server
