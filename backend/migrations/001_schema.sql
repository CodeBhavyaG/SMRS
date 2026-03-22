-- ============================================================
-- Feature Frenzy - Supabase PostgreSQL Schema
-- Run this in your Supabase SQL Editor to set up all tables
-- ============================================================

-- ─── PRODUCTS / INVENTORY ───────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id          SERIAL PRIMARY KEY,
  sku         VARCHAR(20) UNIQUE NOT NULL,
  name        VARCHAR(255) NOT NULL,
  category    VARCHAR(100) NOT NULL,
  base_price  NUMERIC(12, 2) NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory (
  id             SERIAL PRIMARY KEY,
  product_id     INT REFERENCES products(id) ON DELETE CASCADE,
  stock          INT NOT NULL DEFAULT 0,
  reorder_point  INT NOT NULL DEFAULT 50,
  demand_level   VARCHAR(20) CHECK (demand_level IN ('High','Medium','Low')) DEFAULT 'Medium',
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ─── PRICING ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pricing_rules (
  id             SERIAL PRIMARY KEY,
  product_id     INT REFERENCES products(id) ON DELETE CASCADE,
  current_price  NUMERIC(12, 2) NOT NULL,
  change_pct     NUMERIC(6, 2) NOT NULL DEFAULT 0,
  reason         TEXT,
  status         VARCHAR(20) CHECK (status IN ('Active','Pending','Inactive')) DEFAULT 'Active',
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS price_history (
  id         SERIAL PRIMARY KEY,
  product_id INT REFERENCES products(id) ON DELETE CASCADE,
  price      NUMERIC(12, 2) NOT NULL,
  source     VARCHAR(50) DEFAULT 'system', -- 'system', 'competitor', 'manual'
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── CUSTOMERS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS customers (
  id           SERIAL PRIMARY KEY,
  name         VARCHAR(255) NOT NULL,
  email        VARCHAR(255) UNIQUE,
  phone        VARCHAR(20),
  segment      VARCHAR(50) CHECK (segment IN ('High Value','Regular','Occasional','At Risk')) DEFAULT 'Regular',
  loyalty_tier VARCHAR(20) CHECK (loyalty_tier IN ('Platinum','Gold','Silver','Bronze')) DEFAULT 'Bronze',
  points       INT DEFAULT 0,
  total_spend  NUMERIC(14, 2) DEFAULT 0,
  visits       INT DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  last_visit   TIMESTAMPTZ
);

-- ─── ORDERS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id          SERIAL PRIMARY KEY,
  order_ref   VARCHAR(20) UNIQUE NOT NULL,
  customer_id INT REFERENCES customers(id) ON DELETE SET NULL,
  total       NUMERIC(12, 2) NOT NULL,
  status      VARCHAR(30) CHECK (status IN ('Processing','Shipped','Delivered','Cancelled')) DEFAULT 'Processing',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
  id         SERIAL PRIMARY KEY,
  order_id   INT REFERENCES orders(id) ON DELETE CASCADE,
  product_id INT REFERENCES products(id) ON DELETE SET NULL,
  quantity   INT NOT NULL,
  unit_price NUMERIC(12, 2) NOT NULL
);

-- ─── LOYALTY ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS loyalty_offers (
  id           SERIAL PRIMARY KEY,
  title        VARCHAR(255) NOT NULL,
  target_tier  VARCHAR(50),   -- 'All', 'Platinum', 'Gold & above', etc.
  redemptions  INT DEFAULT 0,
  expiry_date  DATE,
  is_active    BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS loyalty_redemptions (
  id         SERIAL PRIMARY KEY,
  customer_id INT REFERENCES customers(id) ON DELETE CASCADE,
  offer_id    INT REFERENCES loyalty_offers(id) ON DELETE CASCADE,
  points_used INT DEFAULT 0,
  redeemed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── RECOMMENDATIONS ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS recommendations (
  id              SERIAL PRIMARY KEY,
  customer_id     INT REFERENCES customers(id) ON DELETE CASCADE,
  product_id      INT REFERENCES products(id) ON DELETE CASCADE,
  confidence_pct  INT CHECK (confidence_pct BETWEEN 0 AND 100),
  reason          TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_bundles (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(255) NOT NULL,
  sales      INT DEFAULT 0,
  revenue    NUMERIC(14, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bundle_items (
  bundle_id  INT REFERENCES product_bundles(id) ON DELETE CASCADE,
  product_id INT REFERENCES products(id) ON DELETE CASCADE,
  PRIMARY KEY (bundle_id, product_id)
);

-- ─── ANALYTICS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sales_analytics (
  id         SERIAL PRIMARY KEY,
  period     VARCHAR(10) NOT NULL, -- 'Jan', 'Feb', 'W1', 'Mon', etc.
  period_type VARCHAR(20) NOT NULL, -- 'monthly', 'weekly', 'daily'
  category   VARCHAR(100),
  sales      NUMERIC(14, 2) DEFAULT 0,
  profit     NUMERIC(14, 2) DEFAULT 0,
  visits     INT DEFAULT 0,
  purchases  INT DEFAULT 0,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── DEMAND FORECAST ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS demand_forecast (
  id          SERIAL PRIMARY KEY,
  product_id  INT REFERENCES products(id) ON DELETE CASCADE,
  current_qty INT,
  predicted_qty INT,
  forecast_date DATE DEFAULT CURRENT_DATE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── CHAT MESSAGES ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_messages (
  id         SERIAL PRIMARY KEY,
  session_id VARCHAR(100) NOT NULL,
  role       VARCHAR(10) CHECK (role IN ('user','bot')) NOT NULL,
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── INDEXES ────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_orders_customer    ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status      ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created     ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_product  ON inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_pricing_product    ON pricing_rules(product_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_customer ON recommendations(customer_id);
CREATE INDEX IF NOT EXISTS idx_chat_session       ON chat_messages(session_id);

-- ─── AUTO-UPDATE updated_at ─────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['products','pricing_rules','orders','inventory']
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS trg_%I_updated ON %I;
       CREATE TRIGGER trg_%I_updated BEFORE UPDATE ON %I
       FOR EACH ROW EXECUTE FUNCTION update_updated_at();',
      t, t, t, t
    );
  END LOOP;
END;
$$;
