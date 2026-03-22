// Central error handler — must be registered last in Express
function errorHandler(err, req, res, next) {
  console.error('Unhandled error:', err);
  // Set CORS headers for error responses
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
}

// 404 for unmatched routes
function notFound(req, res) {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
}

module.exports = { errorHandler, notFound };
