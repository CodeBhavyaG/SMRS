const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { body, validationResult } = require('express-validator');

// GET /api/chat/:sessionId  - get chat history
router.get('/:sessionId', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, role, content, created_at
       FROM chat_messages
       WHERE session_id = $1
       ORDER BY created_at ASC`,
      [req.params.sessionId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch chat history' });
  }
});

// POST /api/chat/:sessionId  - send message & get bot reply
router.post(
  '/:sessionId',
  [body('message').notEmpty().trim()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { sessionId } = req.params;
    const { message } = req.body;
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Save user message
      await client.query(
        `INSERT INTO chat_messages (session_id, role, content) VALUES ($1, 'user', $2)`,
        [sessionId, message]
      );

      // Generate bot response from DB
      const botReply = await generateBotResponse(message, client);

      // Save bot message
      const botMsg = await client.query(
        `INSERT INTO chat_messages (session_id, role, content) VALUES ($1, 'bot', $2) RETURNING id, content, created_at`,
        [sessionId, botReply]
      );

      await client.query('COMMIT');
      res.json({ reply: botMsg.rows[0] });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(err);
      res.status(500).json({ error: 'Failed to process message' });
    } finally {
      client.release();
    }
  }
);

// DELETE /api/chat/:sessionId  - clear chat history
router.delete('/:sessionId', async (req, res) => {
  try {
    await pool.query(`DELETE FROM chat_messages WHERE session_id = $1`, [req.params.sessionId]);
    res.json({ message: 'Chat history cleared' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to clear chat history' });
  }
});

// ─── Bot logic — queries the DB to build real answers ────────
async function generateBotResponse(input, client) {
  const lower = input.toLowerCase();

  // Stock / inventory query
  if (lower.includes('stock') || lower.includes('inventory') || lower.includes('earbuds')) {
    const result = await client.query(
      `SELECT p.name, p.sku, i.stock, i.reorder_point, i.demand_level,
              CASE WHEN i.stock <= 10 THEN 'Critical'
                   WHEN i.stock < i.reorder_point THEN 'Low Stock'
                   ELSE 'In Stock' END AS status,
              df.predicted_qty
       FROM inventory i
       JOIN products p ON p.id = i.product_id
       LEFT JOIN demand_forecast df ON df.product_id = p.id
       ORDER BY i.stock ASC LIMIT 5`
    );
    const items = result.rows.map(r =>
      `• ${r.name} (${r.sku}): ${r.stock} units — ${r.status}${r.predicted_qty ? `, predicted demand: ${r.predicted_qty}` : ''}`
    ).join('\n');
    return `📦 **Current Inventory Status:**\n${items}\n\n💡 Items below reorder point need immediate attention.`;
  }

  // Price query
  if (lower.includes('price') || lower.includes('pricing') || lower.includes('cost')) {
    const result = await client.query(
      `SELECT p.name, p.base_price, pr.current_price, pr.change_pct, pr.reason, pr.status
       FROM pricing_rules pr
       JOIN products p ON p.id = pr.product_id
       WHERE pr.status = 'Active'
       ORDER BY ABS(pr.change_pct) DESC LIMIT 5`
    );
    const items = result.rows.map(r =>
      `• ${r.name}: ₹${r.current_price} (${r.change_pct > 0 ? '+' : ''}${r.change_pct}%) — ${r.reason}`
    ).join('\n');
    return `💰 **Active Pricing Rules:**\n${items}`;
  }

  // Top products / sales
  if (lower.includes('top') || lower.includes('best') || lower.includes('selling')) {
    const result = await client.query(
      `SELECT p.name, COALESCE(SUM(oi.quantity), 0) AS units,
              COALESCE(SUM(oi.quantity * oi.unit_price), 0) AS revenue
       FROM products p
       LEFT JOIN order_items oi ON oi.product_id = p.id
       LEFT JOIN orders o ON o.id = oi.order_id AND o.status != 'Cancelled'
       GROUP BY p.id, p.name
       ORDER BY units DESC LIMIT 5`
    );
    const items = result.rows.map((r, i) =>
      `${i + 1}. ${r.name} — ${r.units} units (₹${parseInt(r.revenue).toLocaleString('en-IN')})`
    ).join('\n');
    return `🏆 **Top Selling Products:**\n${items}`;
  }

  // Recommendations
  if (lower.includes('recommend') || lower.includes('suggest') || lower.includes('fitness')) {
    const result = await client.query(
      `SELECT p.name, r.confidence_pct, r.reason
       FROM recommendations r
       JOIN products p ON p.id = r.product_id
       ORDER BY r.confidence_pct DESC LIMIT 5`
    );
    const items = result.rows.map(r =>
      `• ${r.name} — ${r.confidence_pct}% confidence (${r.reason})`
    ).join('\n');
    return `🎯 **Top Recommendations:**\n${items}`;
  }

  // Customer / loyalty
  if (lower.includes('customer') || lower.includes('loyal') || lower.includes('member')) {
    const result = await client.query(
      `SELECT COUNT(*) AS total,
              COUNT(*) FILTER (WHERE loyalty_tier = 'Platinum') AS platinum,
              COUNT(*) FILTER (WHERE loyalty_tier = 'Gold') AS gold,
              ROUND(AVG(total_spend), 0) AS avg_spend
       FROM customers`
    );
    const r = result.rows[0];
    return `👥 **Customer Overview:**\n• Total members: ${r.total}\n• Platinum: ${r.platinum} | Gold: ${r.gold}\n• Avg. lifetime spend: ₹${parseInt(r.avg_spend).toLocaleString('en-IN')}`;
  }

  // Orders
  if (lower.includes('order')) {
    const result = await client.query(
      `SELECT status, COUNT(*) AS count
       FROM orders GROUP BY status ORDER BY count DESC`
    );
    const items = result.rows.map(r => `• ${r.status}: ${r.count}`).join('\n');
    return `🛒 **Order Status Breakdown:**\n${items}`;
  }

  // Default help message
  return `I can help you with:\n• 📦 Stock levels & inventory alerts\n• 💰 Pricing information & optimization\n• 📊 Sales analytics & top products\n• 🎯 Product recommendations\n• 👥 Customer & loyalty insights\n• 🛒 Order status\n\nTry asking something like: "What's the stock for earbuds?" or "Show top selling products".`;
}

module.exports = router;
