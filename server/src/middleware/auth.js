const jwt = require('jsonwebtoken');
const { getDatabase } = require('../db/database');

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-kanban-jwt-token-key-2026';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') 
    ? authHeader.substring(7) 
    : null;

  if (!token) {
    return res.status(401).json({ error: 'Authentication required. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const db = getDatabase();
    const user = db.prepare('SELECT id, name, email, avatar_url FROM users WHERE id = ?').get(decoded.id);

    if (!user) {
      return res.status(401).json({ error: 'User no longer exists.' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired authentication token.' });
  }
}

module.exports = {
  authenticateToken,
  JWT_SECRET
};
