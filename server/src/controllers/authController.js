const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDatabase } = require('../db/database');
const { JWT_SECRET } = require('../middleware/auth');

function register(req, res) {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Please provide a valid email address.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
  }

  const db = getDatabase();

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.trim().toLowerCase());
  if (existing) {
    return res.status(409).json({ error: 'An account with this email address already exists.' });
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name.trim())}`;

  const result = db.prepare(`
    INSERT INTO users (name, email, password_hash, avatar_url)
    VALUES (?, ?, ?, ?)
  `).run(name.trim(), email.trim().toLowerCase(), passwordHash, avatarUrl);

  const userId = Number(result.lastInsertRowid);
  const token = jwt.sign({ id: userId, email: email.trim().toLowerCase() }, JWT_SECRET, { expiresIn: '7d' });

  // Create a default welcome board for the new user
  const boardResult = db.prepare(`
    INSERT INTO boards (title, description, owner_id, is_private)
    VALUES (?, ?, ?, ?)
  `).run(`${name.trim()}'s Board`, 'Personal Kanban board', userId, 0);

  const boardId = Number(boardResult.lastInsertRowid);
  db.prepare(`
    INSERT INTO board_members (board_id, user_id, role)
    VALUES (?, ?, 'owner')
  `).run(boardId, userId);

  // Add starter cards
  const insertCard = db.prepare(`
    INSERT INTO cards (board_id, title, description, status, position, priority, assignee_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  insertCard.run(boardId, 'Welcome to your Kanban Board!', 'Click cards to view details, edit, or drag them between columns.', 'todo', 0, 'medium', userId);
  insertCard.run(boardId, 'Real-time Collaboration', 'Open this board in another browser window to see live updates.', 'in_progress', 0, 'high', userId);
  insertCard.run(boardId, 'Account created successfully', 'Your new workspace is ready to go.', 'done', 0, 'low', userId);

  return res.status(201).json({
    message: 'User registered successfully.',
    token,
    user: {
      id: userId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      avatar_url: avatarUrl
    }
  });
}

function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const db = getDatabase();
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.trim().toLowerCase());

  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const isMatch = bcrypt.compareSync(password, user.password_hash);
  if (!isMatch) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

  return res.json({
    message: 'Login successful.',
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar_url: user.avatar_url
    }
  });
}

function getMe(req, res) {
  return res.json({ user: req.user });
}

function getUsers(req, res) {
  const db = getDatabase();
  const users = db.prepare('SELECT id, name, email, avatar_url FROM users ORDER BY name ASC').all();
  return res.json({ users });
}

module.exports = {
  register,
  login,
  getMe,
  getUsers
};
