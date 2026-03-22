-- Seed data for SMRS Database

-- Insert sample customers
INSERT INTO customers (name, email, phone) VALUES
('John Doe', 'john@example.com', '1234567890'),
('Jane Smith', 'jane@example.com', '0987654321'),
('Bob Johnson', 'bob@example.com', '1122334455'),
('Alice Brown', 'alice@example.com', '5566778899'),
('Charlie Wilson', 'charlie@example.com', '9988776655')
ON CONFLICT (email) DO NOTHING;

-- Insert sample products
INSERT INTO products (name, description, category, price) VALUES
('Laptop', 'High-performance laptop', 'Electronics', 999.99),
('Mouse', 'Wireless mouse', 'Electronics', 29.99),
('Keyboard', 'Mechanical keyboard', 'Electronics', 79.99),
('Monitor', '27-inch monitor', 'Electronics', 299.99),
('Headphones', 'Noise-cancelling headphones', 'Electronics', 149.99),
('T-shirt', 'Cotton t-shirt', 'Clothing', 19.99),
('Jeans', 'Denim jeans', 'Clothing', 49.99),
('Sneakers', 'Running sneakers', 'Footwear', 89.99)
ON CONFLICT DO NOTHING;

-- Insert inventory
INSERT INTO inventory (product_id, stock, reorder_point) VALUES
(1, 50, 10),
(2, 100, 20),
(3, 75, 15),
(4, 30, 5),
(5, 40, 8),
(6, 200, 50),
(7, 150, 30),
(8, 80, 15)
ON CONFLICT DO NOTHING;

-- Insert sample orders
INSERT INTO orders (customer_id, total, status, created_at) VALUES
(1, 1029.98, 'Completed', CURRENT_TIMESTAMP - INTERVAL '10 days'),
(2, 149.99, 'Completed', CURRENT_TIMESTAMP - INTERVAL '8 days'),
(3, 319.98, 'Pending', CURRENT_TIMESTAMP - INTERVAL '5 days'),
(4, 19.99, 'Completed', CURRENT_TIMESTAMP - INTERVAL '3 days'),
(5, 139.98, 'Shipped', CURRENT_TIMESTAMP - INTERVAL '1 day')
ON CONFLICT DO NOTHING;

-- Insert order items
INSERT INTO order_items (order_id, product_id, quantity, price) VALUES
(1, 1, 1, 999.99),
(1, 2, 1, 29.99),
(2, 5, 1, 149.99),
(3, 4, 1, 299.99),
(3, 3, 1, 79.99),
(4, 6, 1, 19.99),
(5, 7, 1, 49.99),
(5, 8, 1, 89.99)
ON CONFLICT DO NOTHING;

-- Insert pricing rules
INSERT INTO pricing_rules (product_id, rule_type, value) VALUES
(1, 'discount', 10.00),
(5, 'discount', 15.00),
(6, 'discount', 5.00)
ON CONFLICT DO NOTHING;

-- Insert recommendations
INSERT INTO recommendations (customer_id, product_id, score) VALUES
(1, 4, 0.85),
(1, 5, 0.75),
(2, 1, 0.90),
(3, 2, 0.80),
(4, 7, 0.70)
ON CONFLICT DO NOTHING;

-- Insert chat messages
INSERT INTO chat_messages (session_id, message, is_bot) VALUES
('session1', 'Hello, how can I help you?', true),
('session1', 'I need help with my order', false),
('session1', 'I can assist with order inquiries', true)
ON CONFLICT DO NOTHING;

-- Insert sales analytics
INSERT INTO sales_analytics (date, revenue, orders_count, customers_count) VALUES
(CURRENT_DATE - INTERVAL '30 days', 5000.00, 20, 15),
(CURRENT_DATE - INTERVAL '29 days', 4500.00, 18, 12),
(CURRENT_DATE - INTERVAL '28 days', 5200.00, 22, 16),
(CURRENT_DATE - INTERVAL '7 days', 4800.00, 19, 14),
(CURRENT_DATE - INTERVAL '6 days', 5100.00, 21, 17),
(CURRENT_DATE - INTERVAL '5 days', 4900.00, 20, 15),
(CURRENT_DATE - INTERVAL '4 days', 5300.00, 23, 18),
(CURRENT_DATE - INTERVAL '3 days', 4700.00, 18, 13),
(CURRENT_DATE - INTERVAL '2 days', 5000.00, 20, 16),
(CURRENT_DATE - INTERVAL '1 day', 4800.00, 19, 14),
(CURRENT_DATE, 5200.00, 22, 17)
ON CONFLICT (date) DO NOTHING;