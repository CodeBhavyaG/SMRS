# Feature Frenzy — Backend API

Express.js + PostgreSQL (Supabase) backend for the Feature Frenzy retail dashboard.

## Stack
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL via Supabase
- **Libraries**: `pg`, `express-validator`, `helmet`, `cors`, `morgan`, `dotenv`

---

## Setup

### 1. Clone & install
```bash
cd backend
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env with your Supabase credentials
```

### 3. Set up Supabase database

Go to your [Supabase project](https://supabase.com) → **SQL Editor** and run in order:

1. `migrations/001_schema.sql` — creates all tables
2. `migrations/002_seed.sql` — inserts sample data

Or if you have `psql` + your `DATABASE_URL` set:
```bash
npm run db:setup
```

### 4. Start the server
```bash
npm run dev     # development (nodemon)
npm start       # production
```

Server runs at `http://localhost:3000`

---

## API Reference

### Health
| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Server health check |

### Dashboard
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/dashboard/stats` | KPI cards (revenue, orders, customers, inventory) |
| GET | `/api/dashboard/sales-trend` | Monthly sales & profit data |
| GET | `/api/dashboard/category-distribution` | Sales % by category |
| GET | `/api/dashboard/recent-orders` | Latest 10 orders |
| GET | `/api/dashboard/top-products` | Best selling products |

### Inventory
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/inventory` | List products (supports `?search=`, `?status=`, `?category=`) |
| GET | `/api/inventory/stats` | Total, low stock, critical counts |
| GET | `/api/inventory/demand-forecast` | Current vs predicted demand |
| POST | `/api/inventory` | Add new product |
| PATCH | `/api/inventory/:sku/stock` | Update stock level |

### Pricing
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/pricing/rules` | All pricing rules |
| GET | `/api/pricing/stats` | Active/pending counts, avg change % |
| GET | `/api/pricing/history/:sku` | Price history for a product |
| POST | `/api/pricing/rules` | Create a new pricing rule |
| PATCH | `/api/pricing/rules/:id/approve` | Approve a pending rule |

### Customers & Loyalty
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/customers` | List customers (supports `?segment=`, `?tier=`, `?search=`) |
| GET | `/api/customers/stats` | Total members, avg visits, new this month |
| GET | `/api/customers/segments` | Segment breakdown |
| GET | `/api/customers/retention` | New vs returning by month |
| GET | `/api/customers/loyalty/offers` | Active loyalty offers |
| POST | `/api/customers/loyalty/offers` | Create a new offer |
| POST | `/api/customers/:id/points` | Add/deduct loyalty points |

### Recommendations
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/recommendations` | All recs grouped by customer |
| GET | `/api/recommendations/stats` | Active profiles, avg confidence |
| GET | `/api/recommendations/bundles` | Popular product bundles |
| GET | `/api/recommendations/customer/:id` | Recs for a specific customer |

### Analytics
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/analytics/stats` | Avg basket size, repeat rate, conversion |
| GET | `/api/analytics/weekly-patterns` | Visits & purchases by day of week |
| GET | `/api/analytics/seasonal-trends` | Category demand by month |
| GET | `/api/analytics/segments` | Customer segment data |

### Orders
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/orders` | List orders (supports `?status=`, `?customer_id=`) |
| GET | `/api/orders/:ref` | Order detail with items |
| POST | `/api/orders` | Create order (decrements stock, updates customer spend) |
| PATCH | `/api/orders/:ref/status` | Update order status |

### Chatbot
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/chat/:sessionId` | Get chat history |
| POST | `/api/chat/:sessionId` | Send message, get bot reply (queries live DB) |
| DELETE | `/api/chat/:sessionId` | Clear chat history |

---

## Connecting to the Frontend

In the frontend repo, set your API base URL in a `.env` file:
```
VITE_API_URL=http://localhost:3000
```

Then replace the hardcoded data in each page with `fetch` calls to the corresponding API endpoints above.

---

## Project Structure
```
backend/
├── src/
│   ├── config/
│   │   └── db.js              # Supabase PostgreSQL pool
│   ├── middleware/
│   │   └── errorHandler.js    # 404 + error middleware
│   ├── routes/
│   │   ├── dashboard.js
│   │   ├── inventory.js
│   │   ├── pricing.js
│   │   ├── customers.js
│   │   ├── recommendations.js
│   │   ├── analytics.js
│   │   ├── orders.js
│   │   └── chat.js
│   └── server.js              # App entry point
├── migrations/
│   ├── 001_schema.sql         # All table definitions
│   └── 002_seed.sql           # Sample data
├── .env.example
├── package.json
└── README.md
```
