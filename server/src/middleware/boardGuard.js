const { getDatabase } = require('../db/database');

function requireBoardAccess(req, res, next) {
  const boardId = req.params.boardId || req.params.id;
  const userId = req.user.id;

  if (!boardId) {
    return res.status(400).json({ error: 'Board ID is required.' });
  }

  const db = getDatabase();
  const board = db.prepare('SELECT * FROM boards WHERE id = ?').get(boardId);

  if (!board) {
    return res.status(404).json({ error: 'Board not found.' });
  }

  // If user is owner, grant full access
  if (board.owner_id === userId) {
    req.board = board;
    req.boardRole = 'owner';
    return next();
  }

  // Check board membership
  const member = db.prepare('SELECT role FROM board_members WHERE board_id = ? AND user_id = ?')
    .get(boardId, userId);

  if (member) {
    req.board = board;
    req.boardRole = member.role;
    return next();
  }

  // If board is public (is_private === 0), authenticated users have member access
  if (board.is_private === 0) {
    req.board = board;
    req.boardRole = 'member';
    return next();
  }

  // Unauthorized access to another user's private board
  return res.status(403).json({
    error: 'Access denied. You do not have authorization to view or modify this private board.'
  });
}

module.exports = {
  requireBoardAccess
};
