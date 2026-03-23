const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { body, validationResult } = require('express-validator');

// GET /api/orders  - list with optional filters
router.get('/', async (req, res) => {
  try {
    const { status, customer_id, limit = 20, offset = 0 } = req.query;
    let conditions = [];
    let values = [];
    let idx = 1;

    if (status)      { conditions.push(`o.status = $${idx++}`);       values.push(status); }
    if (customer_id) { conditions.push(`o.customer_id = $${idx++}`);  values.push(customer_id); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    values.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(
      `SELECT o.id, o.order_ref, c.name AS customer, o.total, o.status, o.created_at,
              COUNT(oi.id) AS item_count
       FROM orders o
       LEFT JOIN customers c ON c.id = o.customer_id
       LEFT JOIN order_items oi ON oi.order_id = o.id
       ${where}
       GROUP BY o.id, o.order_ref, c.name, o.total, o.status, o.created_at
       ORDER BY o.created_at DESC
       LIMIT $${idx++} OFFSET $${idx}`,
      values
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// GET /api/orders/:ref  - single order detail
router.get('/:ref', async (req, res) => {
  try {
    const orderRes = await pool.query(
      `SELECT o.*, c.name AS customer_name, c.email, c.loyalty_tier
       FROM orders o
       LEFT JOIN customers c ON c.id = o.customer_id
       WHERE o.order_ref = $1`,
      [req.params.ref]
    );
    if (!orderRes.rowCount) return res.status(404).json({ error: 'Order not found' });

    const itemsRes = await pool.query(
      `SELECT p.name, p.sku, oi.quantity, oi.unit_price,
              oi.quantity * oi.unit_price AS subtotal
       FROM order_items oi
       JOIN products p ON p.id = oi.product_id
       WHERE oi.order_id = $1`,
      [orderRes.rows[0].id]
    );

    res.json({ ...orderRes.rows[0], items: itemsRes.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// POST /api/orders  - create order
router.post(
  '/',
  [
    body('customer_id').optional().isInt(),
    body('items').isArray({ min: 1 }),
    body('items.*.product_id').isInt(),
    body('items.*.quantity').isInt({ min: 1 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { customer_id, items } = req.body;
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Fetch prices & validate stock
      let total = 0;
      const enriched = [];
      for (const item of items) {
        const pRes = await client.query(
          `SELECT p.id, COALESCE(pr.current_price, p.base_price) AS price, i.stock
           FROM products p
           LEFT JOIN pricing_rules pr ON pr.product_id = p.id AND pr.status = 'Active'
           LEFT JOIN inventory i ON i.product_id = p.id
           WHERE p.id = $1`,
          [item.product_id]
        );
        if (!pRes.rowCount) throw new Error(`Product ${item.product_id} not found`);
        const { price, stock } = pRes.rows[0];
        if (stock < item.quantity) throw new Error(`Insufficient stock for product ${item.product_id}`);

        total += parseFloat(price) * item.quantity;
        enriched.push({ ...item, unit_price: price });
      }

      // Generate order ref
      const countRes = await client.query(`SELECT COUNT(*) FROM orders`);
      const orderRef = `ORD-${4300 + parseInt(countRes.rows[0].count)}`;

      const orderRes = await client.query(
        `INSERT INTO orders (order_ref, customer_id, total) VALUES ($1,$2,$3) RETURNING id`,
        [orderRef, customer_id || null, total]
      );
      const orderId = orderRes.rows[0].id;

      // Insert items & decrement stock
      for (const item of enriched) {
        await client.query(
          `INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES ($1,$2,$3,$4)`,
          [orderId, item.product_id, item.quantity, item.unit_price]
        );
        await client.query(
          `UPDATE inventory SET stock = stock - $1 WHERE product_id = $2`,
          [item.quantity, item.product_id]
        );
      }

      // Update customer spend & visits
      if (customer_id) {
        await client.query(
          `UPDATE customers SET total_spend = total_spend + $1, visits = visits + 1, last_visit = NOW() WHERE id = $2`,
          [total, customer_id]
        );
      }

      await client.query('COMMIT');
      res.status(201).json({ message: 'Order created', orderRef, total });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(err);
      res.status(err.message.includes('not found') || err.message.includes('stock') ? 400 : 500)
        .json({ error: err.message });
    } finally {
      client.release();
    }
  }
);

// PATCH /api/orders/:ref/status  - update order status
router.patch(
  '/:ref/status',
  [body('status').isIn(['Processing', 'Shipped', 'Delivered', 'Cancelled'])],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const result = await pool.query(
        `UPDATE orders SET status = $1, updated_at = NOW() WHERE order_ref = $2 RETURNING order_ref, status`,
        [req.body.status, req.params.ref]
      );
      if (!result.rowCount) return res.status(404).json({ error: 'Order not found' });
      res.json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to update order status' });
    }
  }
);

module.exports = router;
