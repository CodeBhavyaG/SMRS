const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// GET /api/dashboard/stats
router.get('/stats', async (req, res) => {
  try {
    const [revenueRes, ordersRes, customersRes, inventoryRes] = await Promise.all([
      pool.query(`SELECT COALESCE(SUM(total), 0) AS total_revenue,
                         COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') AS monthly_orders
                  FROM orders WHERE status != 'Cancelled'`),
      pool.query(`SELECT COUNT(*) AS total_orders,
                         COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') AS monthly_orders
                  FROM orders`),
      pool.query(`SELECT COUNT(*) AS total_customers,
                         COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') AS new_this_month
                  FROM customers`),
      pool.query(`SELECT COUNT(*) AS total_items,
                         COUNT(*) FILTER (WHERE i.stock < i.reorder_point) AS low_stock
                  FROM inventory i`),
    ]);

    res.json({
      revenue: {
        total: parseFloat(revenueRes.rows[0].total_revenue),
        label: '₹' + (parseFloat(revenueRes.rows[0].total_revenue) / 100000).toFixed(1) + 'L',
      },
      orders: {
        total: parseInt(ordersRes.rows[0].total_orders),
        monthly: parseInt(ordersRes.rows[0].monthly_orders),
      },
      customers: {
        total: parseInt(customersRes.rows[0].total_customers),
        newThisMonth: parseInt(customersRes.rows[0].new_this_month),
      },
      inventory: {
        totalItems: parseInt(inventoryRes.rows[0].total_items),
        lowStock: parseInt(inventoryRes.rows[0].low_stock),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

// GET /api/dashboard/sales-trend
router.get('/sales-trend', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT period, sales, profit FROM sales_analytics
       WHERE period_type = 'monthly'
       ORDER BY recorded_at ASC LIMIT 12`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch sales trend' });
  }
});

// GET /api/dashboard/category-distribution
router.get('/category-distribution', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.category AS name,
              ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 0) AS value
       FROM order_items oi
       JOIN products p ON p.id = oi.product_id
       GROUP BY p.category
       ORDER BY value DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch category distribution' });
  }
});

// GET /api/dashboard/recent-orders
router.get('/recent-orders', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT o.order_ref AS id,
              c.name AS customer,
              o.total AS amount,
              o.status,
              o.created_at
       FROM orders o
       LEFT JOIN customers c ON c.id = o.customer_id
       ORDER BY o.created_at DESC
       LIMIT 10`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch recent orders' });
  }
});

// GET /api/dashboard/top-products
router.get('/top-products', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.name,
              COALESCE(SUM(oi.quantity), 0) AS sales,
              COALESCE(SUM(oi.quantity * oi.unit_price), 0) AS revenue
       FROM products p
       LEFT JOIN order_items oi ON oi.product_id = p.id
       LEFT JOIN orders o ON o.id = oi.order_id AND o.status != 'Cancelled'
       GROUP BY p.id, p.name
       ORDER BY sales DESC
       LIMIT 5`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch top products' });
  }
});

module.exports = router;
