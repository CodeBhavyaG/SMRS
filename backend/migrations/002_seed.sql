-- ============================================================
-- Feature Frenzy - Seed Data
-- Run AFTER 001_schema.sql
-- ============================================================

-- Products
INSERT INTO products (sku, name, category, base_price) VALUES
  ('SKU-001', 'Wireless Earbuds Pro',     'Electronics', 1500),
  ('SKU-002', 'Cotton T-Shirt Pack',      'Clothing',    999),
  ('SKU-003', 'Organic Green Tea 100g',   'Groceries',   499),
  ('SKU-004', 'Smart LED Bulb 12W',       'Home',        800),
  ('SKU-005', 'Running Sneakers',         'Clothing',    2999),
  ('SKU-006', 'Stainless Steel Bottle',   'Home',        650),
  ('SKU-007', 'Bluetooth Speaker',        'Electronics', 3200),
  ('SKU-008', 'Basmati Rice 5kg',         'Groceries',   450)
ON CONFLICT (sku) DO NOTHING;

-- Inventory
INSERT INTO inventory (product_id, stock, reorder_point, demand_level)
SELECT id, stock, reorder, demand FROM (VALUES
  ('SKU-001',  42, 50, 'High'),
  ('SKU-002', 189,100, 'Medium'),
  ('SKU-003',   8, 30, 'High'),
  ('SKU-004', 234, 80, 'Low'),
  ('SKU-005',  56, 60, 'High'),
  ('SKU-006', 312, 50, 'Medium'),
  ('SKU-007',   3, 25, 'High'),
  ('SKU-008', 145,100, 'Medium')
) AS v(sku, stock, reorder, demand)
JOIN products p ON p.sku = v.sku
ON CONFLICT DO NOTHING;

-- Pricing rules
INSERT INTO pricing_rules (product_id, current_price, change_pct, reason, status)
SELECT p.id, cp, chg, rsn, sts FROM (VALUES
  ('SKU-001', 1580,  5.3, 'High demand detected',        'Active'),
  ('SKU-002',  899,-10.0, 'Clearance - seasonal end',    'Active'),
  ('SKU-003',  549, 10.0, 'Low stock, high demand',      'Active'),
  ('SKU-004',  750, -6.2, 'Competitor price match',      'Pending'),
  ('SKU-005', 3299, 10.0, 'New arrival premium',         'Active'),
  ('SKU-007', 2899, -9.4, 'Expiry approaching',          'Active')
) AS v(sku, cp, chg, rsn, sts)
JOIN products p ON p.sku = v.sku
ON CONFLICT DO NOTHING;

-- Customers
INSERT INTO customers (name, email, loyalty_tier, points, total_spend, visits, segment, last_visit) VALUES
  ('Priya Sharma',  'priya@example.com',  'Platinum', 4800, 124000, 48, 'High Value',  NOW() - INTERVAL '2 days'),
  ('Vikram Singh',  'vikram@example.com', 'Gold',     3200,  89000, 36, 'High Value',  NOW() - INTERVAL '7 days'),
  ('Meera Patel',   'meera@example.com',  'Gold',     2900,  76000, 32, 'High Value',  NOW() - INTERVAL '3 days'),
  ('Amit Kumar',    'amit@example.com',   'Silver',   2100,  62000, 28, 'Regular',     NOW() - INTERVAL '5 days'),
  ('Sneha Reddy',   'sneha@example.com',  'Silver',   1800,  54000, 24, 'Regular',     NOW() - INTERVAL '1 day'),
  ('Rahul Verma',   'rahul@example.com',  'Silver',   1200,  32000, 18, 'Regular',     NOW() - INTERVAL '3 days'),
  ('Anita Desai',   'anita@example.com',  'Bronze',    600,  15000, 10, 'Occasional',  NOW() - INTERVAL '14 days')
ON CONFLICT (email) DO NOTHING;

-- Orders
INSERT INTO orders (order_ref, customer_id, total, status, created_at)
SELECT ref, c.id, total, sts, ts FROM (VALUES
  ('ORD-4291', 'priya@example.com',  2450, 'Delivered',  NOW() - INTERVAL '2 hours'),
  ('ORD-4290', 'rahul@example.com',  1890, 'Processing', NOW() - INTERVAL '3 hours'),
  ('ORD-4289', 'anita@example.com',  3200, 'Shipped',    NOW() - INTERVAL '5 hours'),
  ('ORD-4288', 'vikram@example.com',  890, 'Delivered',  NOW() - INTERVAL '6 hours'),
  ('ORD-4287', 'meera@example.com',  4100, 'Processing', NOW() - INTERVAL '7 hours')
) AS v(ref, email, total, sts, ts)
JOIN customers c ON c.email = v.email
ON CONFLICT (order_ref) DO NOTHING;

-- Loyalty Offers
INSERT INTO loyalty_offers (title, target_tier, redemptions, expiry_date) VALUES
  ('10% off Electronics',         'Platinum members',    89,  CURRENT_DATE + 8),
  ('Buy 2 Get 1 Free - Groceries','All loyalty members', 234, CURRENT_DATE + 3),
  ('₹500 off on ₹3000+',          'Gold & above',        156, CURRENT_DATE + 14),
  ('Free Delivery Weekend',       'Silver & above',      312, CURRENT_DATE)
ON CONFLICT DO NOTHING;

-- Sales Analytics (monthly)
INSERT INTO sales_analytics (period, period_type, sales, profit) VALUES
  ('Jan', 'monthly', 4200000, 1800000),
  ('Feb', 'monthly', 3800000, 1600000),
  ('Mar', 'monthly', 5100000, 2200000),
  ('Apr', 'monthly', 4700000, 2000000),
  ('May', 'monthly', 5800000, 2600000),
  ('Jun', 'monthly', 6200000, 2900000),
  ('Jul', 'monthly', 5900000, 2700000)
ON CONFLICT DO NOTHING;

-- Sales Analytics (weekly purchase patterns)
INSERT INTO sales_analytics (period, period_type, visits, purchases) VALUES
  ('Mon', 'daily', 120, 45),
  ('Tue', 'daily',  98, 38),
  ('Wed', 'daily', 145, 62),
  ('Thu', 'daily', 132, 55),
  ('Fri', 'daily', 178, 89),
  ('Sat', 'daily', 245,134),
  ('Sun', 'daily', 198, 98)
ON CONFLICT DO NOTHING;

-- Demand Forecast
INSERT INTO demand_forecast (product_id, current_qty, predicted_qty)
SELECT p.id, curr, pred FROM (VALUES
  ('SKU-001', 120, 180),
  ('SKU-002', 200, 160),
  ('SKU-003',  80, 110),
  ('SKU-004', 150, 190),
  ('SKU-005',  90, 140)
) AS v(sku, curr, pred)
JOIN products p ON p.sku = v.sku
ON CONFLICT DO NOTHING;

-- Recommendations
INSERT INTO recommendations (customer_id, product_id, confidence_pct, reason)
SELECT c.id, p.id, conf, rsn FROM (VALUES
  ('priya@example.com', 'SKU-007', 92, 'Frequently bought together'),
  ('priya@example.com', 'SKU-001', 87, 'Complementary product'),
  ('rahul@example.com', 'SKU-005', 95, 'Frequently bought together'),
  ('anita@example.com', 'SKU-003', 91, 'Frequently bought together')
) AS v(email, sku, conf, rsn)
JOIN customers c ON c.email = v.email
JOIN products  p ON p.sku   = v.sku
ON CONFLICT DO NOTHING;

-- Product Bundles
INSERT INTO product_bundles (name, sales, revenue) VALUES
  ('Work From Home Kit', 156, 3120000),
  ('Fitness Starter',     98, 4890000),
  ('Tea Lover Set',      134, 1780000),
  ('Audio Bundle',        87, 5210000)
ON CONFLICT DO NOTHING;
