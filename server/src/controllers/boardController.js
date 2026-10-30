const { getDatabase } = require('../db/database');

function listBoards(req, res) {
  const userId = req.user.id;
  const db = getDatabase();

  const query = `
    SELECT DISTINCT 
      b.id, 
      b.title, 
      b.description, 
      b.owner_id, 
      b.is_private, 
      b.created_at, 
      b.updated_at,
      u.name AS owner_name,
      u.email AS owner_email,
      (SELECT COUNT(*) FROM cards c WHERE c.board_id = b.id) AS total_cards,
      (SELECT COUNT(*) FROM cards c WHERE c.board_id = b.id AND c.status = 'todo') AS todo_count,
      (SELECT COUNT(*) FROM cards c WHERE c.board_id = b.id AND c.status = 'in_progress') AS in_progress_count,
      (SELECT COUNT(*) FROM cards c WHERE c.board_id = b.id AND c.status = 'done') AS done_count
    FROM boards b
    JOIN users u ON b.owner_id = u.id
    LEFT JOIN board_members bm ON b.id = bm.board_id
    WHERE b.owner_id = ? OR bm.user_id = ? OR b.is_private = 0
    ORDER BY b.updated_at DESC
  `;

  const boards = db.prepare(query).all(userId, userId);
  return res.json({ boards });
}

function createBoard(req, res) {
  const { title, description, is_private = 1 } = req.body;
  const userId = req.user.id;

  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Board title is required.' });
  }

  const db = getDatabase();
  const insert = db.prepare(`
    INSERT INTO boards (title, description, owner_id, is_private)
    VALUES (?, ?, ?, ?)
  `);

  const result = insert.run(
    title.trim(), 
    (description || '').trim(), 
    userId, 
    is_private ? 1 : 0
  );

  const boardId = Number(result.lastInsertRowid);

  // Add creator as owner member
  db.prepare(`
    INSERT INTO board_members (board_id, user_id, role)
    VALUES (?, ?, 'owner')
  `).run(boardId, userId);

  const newBoard = db.prepare(`
    SELECT b.*, u.name AS owner_name, u.email AS owner_email
    FROM boards b
    JOIN users u ON b.owner_id = u.id
    WHERE b.id = ?
  `).get(boardId);

  return res.status(201).json({ board: newBoard });
}

function getBoard(req, res) {
  const board = req.board;
  const db = getDatabase();

  // Retrieve cards with assignee information
  const cards = db.prepare(`
    SELECT 
      c.*,
      u.name AS assignee_name,
      u.email AS assignee_email,
      u.avatar_url AS assignee_avatar
    FROM cards c
    LEFT JOIN users u ON c.assignee_id = u.id
    WHERE c.board_id = ?
    ORDER BY c.position ASC, c.id ASC
  `).all(board.id);

  // Retrieve members
  const members = db.prepare(`
    SELECT bm.role, u.id, u.name, u.email, u.avatar_url
    FROM board_members bm
    JOIN users u ON bm.user_id = u.id
    WHERE bm.board_id = ?
  `).all(board.id);

  return res.json({
    board: {
      ...board,
      role: req.boardRole
    },
    members,
    cards
  });
}

function updateBoard(req, res) {
  const boardId = req.board.id;
  const userId = req.user.id;

  if (req.board.owner_id !== userId) {
    return res.status(403).json({ error: 'Only the board owner can modify board settings.' });
  }

  const { title, description, is_private } = req.body;
  const db = getDatabase();

  const newTitle = title !== undefined ? title.trim() : req.board.title;
  const newDesc = description !== undefined ? description.trim() : req.board.description;
  const newPrivacy = is_private !== undefined ? (is_private ? 1 : 0) : req.board.is_private;

  if (!newTitle) {
    return res.status(400).json({ error: 'Board title cannot be empty.' });
  }

  db.prepare(`
    UPDATE boards 
    SET title = ?, description = ?, is_private = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(newTitle, newDesc, newPrivacy, boardId);

  const updated = db.prepare('SELECT * FROM boards WHERE id = ?').get(boardId);
  return res.json({ board: updated });
}

function deleteBoard(req, res) {
  const boardId = req.board.id;
  const userId = req.user.id;

  if (req.board.owner_id !== userId) {
    return res.status(403).json({ error: 'Only the board owner can delete this board.' });
  }

  const db = getDatabase();
  db.prepare('DELETE FROM boards WHERE id = ?').run(boardId);

  return res.json({ message: 'Board deleted successfully.', boardId });
}

function addMember(req, res) {
  const boardId = req.board.id;
  const { email, role = 'member' } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'User email is required.' });
  }

  const db = getDatabase();
  const user = db.prepare('SELECT id, name, email, avatar_url FROM users WHERE email = ?')
    .get(email.trim().toLowerCase());

  if (!user) {
    return res.status(404).json({ error: 'No user found with that email address.' });
  }

  try {
    db.prepare(`
      INSERT INTO board_members (board_id, user_id, role)
      VALUES (?, ?, ?)
    `).run(boardId, user.id, role);

    return res.status(201).json({
      message: 'Member added to board successfully.',
      member: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar_url: user.avatar_url,
        role
      }
    });
  } catch (err) {
    if (err.message && err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'User is already a member of this board.' });
    }
    throw err;
  }
}

module.exports = {
  listBoards,
  createBoard,
  getBoard,
  updateBoard,
  deleteBoard,
  addMember
};
