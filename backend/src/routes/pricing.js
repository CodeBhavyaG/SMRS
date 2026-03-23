const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { body, validationResult } = require('express-validator');

// GET /api/pricing/rules  - active pricing rules
router.get('/rules', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.name AS product, p.base_price, pr.current_price,
              pr.change_pct, pr.reason, pr.status, pr.updated_at
       FROM pricing_rules pr
       JOIN products p ON p.id = pr.product_id
       ORDER BY pr.updated_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch pricing rules' });
  }
});

// GET /api/pricing/stats
router.get('/stats', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'Active')  AS active_rules,
         COUNT(*) FILTER (WHERE status = 'Pending') AS pending_rules,
         ROUND(AVG(ABS(change_pct)), 1)             AS avg_change_pct
       FROM pricing_rules`
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch pricing stats' });
  }
});

// GET /api/pricing/history/:sku  - price history for a product
router.get('/history/:sku', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ph.price, ph.source, ph.recorded_at
       FROM price_history ph
       JOIN products p ON p.id = ph.product_id
       WHERE p.sku = $1
       ORDER BY ph.recorded_at ASC
       LIMIT 50`,
      [req.params.sku]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch price history' });
  }
});

// POST /api/pricing/rules  - create a pricing rule
router.post(
  '/rules',
  [
    body('sku').notEmpty(),
    body('current_price').isFloat({ min: 0 }),
    body('reason').optional().isString(),
    body('status').optional().isIn(['Active', 'Pending']),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { sku, current_price, reason = '', status = 'Pending' } = req.body;
    try {
      const productRes = await pool.query('SELECT id, base_price FROM products WHERE sku = $1', [sku]);
      if (!productRes.rowCount) return res.status(404).json({ error: 'Product not found' });

      const { id, base_price } = productRes.rows[0];
      const change_pct = parseFloat((((current_price - base_price) / base_price) * 100).toFixed(2));

      const rule = await pool.query(
        `INSERT INTO pricing_rules (product_id, current_price, change_pct, reason, status)
         VALUES ($1,$2,$3,$4,$5) RETURNING id`,
        [id, current_price, change_pct, reason, status]
      );

      // log to price history
      await pool.query(
        `INSERT INTO price_history (product_id, price, source) VALUES ($1,$2,'manual')`,
        [id, current_price]
      );

      res.status(201).json({ message: 'Pricing rule created', ruleId: rule.rows[0].id, change_pct });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to create pricing rule' });
    }
  }
);

// PATCH /api/pricing/rules/:id/approve
router.patch('/rules/:id/approve', async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE pricing_rules SET status = 'Active', updated_at = NOW()
       WHERE id = $1 RETURNING id`,
      [req.params.id]
    );
    if (!result.rowCount) return res.status(404).json({ error: 'Rule not found' });
    res.json({ message: 'Pricing rule approved' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to approve rule' });
  }
});

module.exports = router;
