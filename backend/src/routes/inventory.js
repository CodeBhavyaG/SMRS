const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { body, query, param, validationResult } = require('express-validator');

// GET /api/inventory  - list with search & filter
router.get('/', async (req, res) => {
  try {
    const { search = '', status, category } = req.query;

    let conditions = [];
    let values = [];
    let idx = 1;

    if (search) {
      conditions.push(`(p.name ILIKE $${idx} OR p.sku ILIKE $${idx})`);
      values.push(`%${search}%`);
      idx++;
    }

    if (status && status !== 'All') {
      const statusMap = {
        'In Stock':   `i.stock >= i.reorder_point`,
        'Low Stock':  `i.stock < i.reorder_point AND i.stock > 0`,
        'Critical':   `i.stock <= 10`,
      };
      if (statusMap[status]) conditions.push(statusMap[status]);
    }

    if (category) {
      conditions.push(`p.category = $${idx}`);
      values.push(category);
      idx++;
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await pool.query(
      `SELECT p.sku AS id, p.name, p.category, i.stock, i.reorder_point AS reorder,
              pr.current_price AS price, i.demand_level AS demand,
              CASE
                WHEN i.stock <= 10              THEN 'Critical'
                WHEN i.stock < i.reorder_point  THEN 'Low Stock'
                ELSE 'In Stock'
              END AS status
       FROM products p
       JOIN inventory i ON i.product_id = p.id
       LEFT JOIN pricing_rules pr ON pr.product_id = p.id AND pr.status = 'Active'
       ${where}
       ORDER BY p.sku`,
      values
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
});

// GET /api/inventory/stats
router.get('/stats', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         COUNT(*) AS total_products,
         COUNT(*) FILTER (WHERE i.stock < i.reorder_point AND i.stock > 10) AS low_stock,
         COUNT(*) FILTER (WHERE i.stock <= 10) AS critical_stock
       FROM inventory i`
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch inventory stats' });
  }
});

// GET /api/inventory/demand-forecast
router.get('/demand-forecast', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.name AS product, df.current_qty AS current, df.predicted_qty AS predicted
       FROM demand_forecast df
       JOIN products p ON p.id = df.product_id
       ORDER BY df.forecast_date DESC, p.name`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch demand forecast' });
  }
});

// POST /api/inventory  - add product
router.post(
  '/',
  [
    body('sku').notEmpty().trim(),
    body('name').notEmpty().trim(),
    body('category').notEmpty().trim(),
    body('base_price').isFloat({ min: 0 }),
    body('stock').isInt({ min: 0 }),
    body('reorder_point').optional().isInt({ min: 0 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { sku, name, category, base_price, stock, reorder_point = 50, demand_level = 'Medium' } = req.body;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const product = await client.query(
        `INSERT INTO products (sku, name, category, base_price) VALUES ($1,$2,$3,$4) RETURNING id`,
        [sku, name, category, base_price]
      );
      await client.query(
        `INSERT INTO inventory (product_id, stock, reorder_point, demand_level) VALUES ($1,$2,$3,$4)`,
        [product.rows[0].id, stock, reorder_point, demand_level]
      );
      await client.query('COMMIT');
      res.status(201).json({ message: 'Product added', productId: product.rows[0].id });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(err);
      if (err.code === '23505') return res.status(409).json({ error: 'SKU already exists' });
      res.status(500).json({ error: 'Failed to add product' });
    } finally {
      client.release();
    }
  }
);

// PATCH /api/inventory/:sku/stock  - update stock
router.patch(
  '/:sku/stock',
  [body('stock').isInt({ min: 0 })],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { sku } = req.params;
    const { stock } = req.body;
    try {
      const result = await pool.query(
        `UPDATE inventory i SET stock = $1, updated_at = NOW()
         FROM products p WHERE p.id = i.product_id AND p.sku = $2
         RETURNING i.stock`,
        [stock, sku]
      );
      if (!result.rowCount) return res.status(404).json({ error: 'Product not found' });
      res.json({ message: 'Stock updated', stock: result.rows[0].stock });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to update stock' });
    }
  }
);

module.exports = router;
