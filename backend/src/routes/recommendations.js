const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// GET /api/recommendations  - all recs grouped by customer
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.name AS customer,
              -- last purchase
              (SELECT p2.name FROM orders o2
               JOIN order_items oi2 ON oi2.order_id = o2.id
               JOIN products p2 ON p2.id = oi2.product_id
               WHERE o2.customer_id = c.id
               ORDER BY o2.created_at DESC LIMIT 1) AS last_purchased,
              JSON_AGG(
                JSON_BUILD_OBJECT(
                  'name',       p.name,
                  'confidence', r.confidence_pct,
                  'reason',     r.reason
                ) ORDER BY r.confidence_pct DESC
              ) AS recommended
       FROM recommendations r
       JOIN customers c ON c.id = r.customer_id
       JOIN products  p ON p.id = r.product_id
       GROUP BY c.id, c.name
       ORDER BY c.name`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
});

// GET /api/recommendations/stats
router.get('/stats', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         COUNT(DISTINCT customer_id) AS active_profiles,
         ROUND(AVG(confidence_pct), 1) AS avg_confidence
       FROM recommendations`
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch recommendation stats' });
  }
});

// GET /api/recommendations/bundles  - popular bundles
router.get('/bundles', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT pb.name, pb.sales, pb.revenue,
              ARRAY_AGG(p.name ORDER BY p.name) AS items
       FROM product_bundles pb
       JOIN bundle_items bi ON bi.bundle_id = pb.id
       JOIN products p ON p.id = bi.product_id
       GROUP BY pb.id, pb.name, pb.sales, pb.revenue
       ORDER BY pb.sales DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch bundles' });
  }
});

// GET /api/recommendations/customer/:id  - recs for a specific customer
router.get('/customer/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.name, p.sku, r.confidence_pct, r.reason, pr.current_price
       FROM recommendations r
       JOIN products p ON p.id = r.product_id
       LEFT JOIN pricing_rules pr ON pr.product_id = p.id AND pr.status = 'Active'
       WHERE r.customer_id = $1
       ORDER BY r.confidence_pct DESC`,
      [req.params.id]
    );
    if (!result.rowCount) return res.status(404).json({ error: 'No recommendations found' });
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
});

module.exports = router;
