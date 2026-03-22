const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { body, validationResult } = require('express-validator');

// GET /api/customers  - list customers
router.get('/', async (req, res) => {
  try {
    const { segment, tier, search } = req.query;
    let conditions = [];
    let values = [];
    let idx = 1;

    if (search) {
      conditions.push(`(name ILIKE $${idx} OR email ILIKE $${idx})`);
      values.push(`%${search}%`);
      idx++;
    }
    if (segment) { conditions.push(`segment = $${idx++}`); values.push(segment); }
    if (tier)    { conditions.push(`loyalty_tier = $${idx++}`); values.push(tier); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = await pool.query(
      `SELECT id, name, email, loyalty_tier, points, total_spend, visits, segment, last_visit
       FROM customers ${where} ORDER BY total_spend DESC`,
      values
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// GET /api/customers/stats
router.get('/stats', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         COUNT(*) AS total_members,
         ROUND(AVG(visits), 1) AS avg_visits,
         SUM(points) AS total_points,
         COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') AS new_this_month
       FROM customers`
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch customer stats' });
  }
});

// GET /api/customers/segments
router.get('/segments', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT segment, COUNT(*) AS count,
              ROUND(AVG(total_spend), 0) AS avg_spend,
              ROUND(
                COUNT(*) FILTER (WHERE last_visit >= NOW() - INTERVAL '90 days') * 100.0 / COUNT(*),
                0
              ) AS retention_pct
       FROM customers
       GROUP BY segment
       ORDER BY avg_spend DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch segments' });
  }
});

// GET /api/customers/retention
router.get('/retention', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT TO_CHAR(DATE_TRUNC('month', created_at), 'Mon') AS month,
              COUNT(*) FILTER (WHERE visits <= 1) AS new,
              COUNT(*) FILTER (WHERE visits > 1)  AS returning
       FROM customers
       GROUP BY DATE_TRUNC('month', created_at)
       ORDER BY DATE_TRUNC('month', created_at) ASC
       LIMIT 6`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch retention data' });
  }
});

// GET /api/customers/loyalty/offers
router.get('/loyalty/offers', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, title, target_tier, redemptions,
              TO_CHAR(expiry_date, 'Mon DD') AS expiry,
              is_active
       FROM loyalty_offers
       ORDER BY expiry_date ASC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch offers' });
  }
});

// POST /api/customers/loyalty/offers  - create offer
router.post(
  '/loyalty/offers',
  [
    body('title').notEmpty().trim(),
    body('target_tier').notEmpty(),
    body('expiry_date').isISO8601(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { title, target_tier, expiry_date } = req.body;
    try {
      const result = await pool.query(
        `INSERT INTO loyalty_offers (title, target_tier, expiry_date) VALUES ($1,$2,$3) RETURNING id`,
        [title, target_tier, expiry_date]
      );
      res.status(201).json({ message: 'Offer created', offerId: result.rows[0].id });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to create offer' });
    }
  }
);

// POST /api/customers/:id/points  - add/deduct loyalty points
router.post(
  '/:id/points',
  [body('points').isInt()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { points } = req.body;
    try {
      const result = await pool.query(
        `UPDATE customers SET points = GREATEST(points + $1, 0) WHERE id = $2 RETURNING points`,
        [points, req.params.id]
      );
      if (!result.rowCount) return res.status(404).json({ error: 'Customer not found' });
      res.json({ message: 'Points updated', points: result.rows[0].points });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to update points' });
    }
  }
);

module.exports = router;
