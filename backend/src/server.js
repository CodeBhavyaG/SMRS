require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const dashboardRoutes     = require('./routes/dashboard');
const inventoryRoutes     = require('./routes/inventory');
const pricingRoutes       = require('./routes/pricing');
const customersRoutes     = require('./routes/customers');
const recommendRoutes     = require('./routes/recommendations');
const analyticsRoutes     = require('./routes/analytics');
const ordersRoutes        = require('./routes/orders');
const chatRoutes          = require('./routes/chat');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

function normalizeOrigin(value) {
  return (value || '').trim().replace(/\/+$/, '');
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function ruleToRegExp(rule) {
  const escaped = escapeRegExp(rule).replace(/\\\*/g, '[^.]+');
  return new RegExp(`^${escaped}$`);
}

const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map(normalizeOrigin)
  .filter(Boolean);

const allowedOriginPatterns = allowedOrigins.map(ruleToRegExp);

// ─── Middleware ──────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests like curl/postman with no Origin header.
    if (!origin) {
      return callback(null, true);
    }

    const requestOrigin = normalizeOrigin(origin);
    if (allowedOriginPatterns.some((pattern) => pattern.test(requestOrigin))) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json());

// ─── Health check ────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), env: process.env.NODE_ENV });
});

// ─── API Routes ──────────────────────────────────────────────
app.use('/api/dashboard',       dashboardRoutes);
app.use('/api/inventory',       inventoryRoutes);
app.use('/api/pricing',         pricingRoutes);
app.use('/api/customers',       customersRoutes);
app.use('/api/recommendations', recommendRoutes);
app.use('/api/analytics',       analyticsRoutes);
app.use('/api/orders',          ordersRoutes);
app.use('/api/chat',            chatRoutes);

// ─── Error handling ──────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Start ───────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Feature Frenzy API running on http://localhost:${PORT}`);
  console.log(`   Environment : ${process.env.NODE_ENV || 'development'}`);
  console.log(`   CORS origin : ${allowedOrigins.join(', ') || 'http://localhost:5173'}`);
});

module.exports = app;
