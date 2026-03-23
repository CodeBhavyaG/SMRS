const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// GET /api/analytics/stats
router.get('/stats', async (req, res) => {
  try {
    const [basketRes, repeatRes, convRes] = await Promise.all([
      pool.query(`SELECT ROUND(AVG(total), 0) AS avg_basket FROM orders WHERE status != 'Cancelled'`),
      pool.query(`SELECT
         ROUND(
           COUNT(*) FILTER (WHERE visits > 1) * 100.0 / NULLIF(COUNT(*), 0), 1
         ) AS repeat_pct
         FROM customers`),
      pool.query(`SELECT
         ROUND(
           COUNT(DISTINCT o.customer_id) * 100.0 / NULLIF(COUNT(DISTINCT c.id), 0), 1
         ) AS conversion_rate
         FROM customers c
         LEFT JOIN orders o ON o.customer_id = c.id
           AND o.created_at >= NOW() - INTERVAL '30 days'`),
    ]);
    res.json({
      avg_basket_size:   parseFloat(basketRes.rows[0].avg_basket || 0),
      repeat_customer_pct: parseFloat(repeatRes.rows[0].repeat_pct || 0),
      conversion_rate:   parseFloat(convRes.rows[0].conversion_rate || 0),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch analytics stats' });
  }
});

// GET /api/analytics/weekly-patterns
router.get('/weekly-patterns', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT period AS day, visits, purchases
       FROM sales_analytics
       WHERE period_type = 'daily'
       ORDER BY CASE period
         WHEN 'Mon' THEN 1 WHEN 'Tue' THEN 2 WHEN 'Wed' THEN 3
         WHEN 'Thu' THEN 4 WHEN 'Fri' THEN 5 WHEN 'Sat' THEN 6 ELSE 7
       END`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch weekly patterns' });
  }
});

router.get('/seasonal-trends', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT period AS month, category,
              ROUND(AVG(sales) / 1000, 0) AS value
       FROM sales_analytics
       WHERE period_type = 'monthly' AND category IS NOT NULL
       GROUP BY period, category
       ORDER BY MIN(recorded_at) ASC`
    );

    const pivoted = {};
    result.rows.forEach(({ month, category, value }) => {
      if (!pivoted[month]) pivoted[month] = { month };
      pivoted[month][category.toLowerCase()] = parseInt(value);
    });

    res.json(Object.values(pivoted));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch seasonal trends' });
  }
});

// GET /api/analytics/segments
router.get('/segments', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT segment,
              COUNT(*) AS count,
              ROUND(AVG(total_spend), 0) AS avg_spend,
              ROUND(
                COUNT(*) FILTER (WHERE last_visit >= NOW() - INTERVAL '90 days') * 100.0 / COUNT(*),
                0
              ) AS retention
       FROM customers
       GROUP BY segment
       ORDER BY avg_spend DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch segment data' });
  }
});

module.exports = router;
