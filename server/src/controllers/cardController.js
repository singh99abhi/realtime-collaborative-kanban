const { getDatabase } = require('../db/database');
const { broadcastToBoard } = require('../sockets/kanbanSocket');

function populateCard(db, cardId) {
  return db.prepare(`
    SELECT 
      c.*,
      u.name AS assignee_name,
      u.email AS assignee_email,
      u.avatar_url AS assignee_avatar
    FROM cards c
    LEFT JOIN users u ON c.assignee_id = u.id
    WHERE c.id = ?
  `).get(cardId);
}

function createCard(req, res) {
  const boardId = req.board.id;
  const { title, description = '', status = 'todo', priority = 'medium', assignee_id = null, due_date = null } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Card title is required.' });
  }

  const validStatuses = ['todo', 'in_progress', 'done'];
  const finalStatus = validStatuses.includes(status) ? status : 'todo';

  const db = getDatabase();

  // Find max position in column
  const maxPosRow = db.prepare(`
    SELECT MAX(position) as max_pos FROM cards WHERE board_id = ? AND status = ?
  `).get(boardId, finalStatus);

  const nextPos = (maxPosRow && maxPosRow.max_pos !== null) ? maxPosRow.max_pos + 1 : 0;

  const result = db.prepare(`
    INSERT INTO cards (board_id, title, description, status, position, priority, assignee_id, due_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    boardId,
    title.trim(),
    description.trim(),
    finalStatus,
    nextPos,
    priority,
    assignee_id ? Number(assignee_id) : null,
    due_date
  );

  const cardId = Number(result.lastInsertRowid);
  const card = populateCard(db, cardId);

  // Update board updated_at timestamp
  db.prepare('UPDATE boards SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(boardId);

  // Broadcast real-time event to board room
  broadcastToBoard(boardId, 'card:created', { boardId, card });

  return res.status(201).json({ card });
}

function updateCard(req, res) {
  const boardId = req.board.id;
  const cardId = Number(req.params.cardId);
  const { title, description, status, priority, assignee_id, due_date } = req.body;

  const db = getDatabase();
  const existing = db.prepare('SELECT * FROM cards WHERE id = ? AND board_id = ?').get(cardId, boardId);

  if (!existing) {
    return res.status(404).json({ error: 'Card not found on this board.' });
  }

  const newTitle = title !== undefined ? title.trim() : existing.title;
  const newDesc = description !== undefined ? description.trim() : existing.description;
  const newStatus = status !== undefined ? status : existing.status;
  const newPriority = priority !== undefined ? priority : existing.priority;
  const newAssignee = assignee_id !== undefined ? (assignee_id ? Number(assignee_id) : null) : existing.assignee_id;
  const newDueDate = due_date !== undefined ? due_date : existing.due_date;

  if (!newTitle) {
    return res.status(400).json({ error: 'Card title cannot be empty.' });
  }

  db.prepare(`
    UPDATE cards
    SET title = ?, description = ?, status = ?, priority = ?, assignee_id = ?, due_date = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND board_id = ?
  `).run(newTitle, newDesc, newStatus, newPriority, newAssignee, newDueDate, cardId, boardId);

  db.prepare('UPDATE boards SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(boardId);

  const card = populateCard(db, cardId);

  // Broadcast real-time update
  broadcastToBoard(boardId, 'card:updated', { boardId, card });

  return res.json({ card });
}

function moveCard(req, res) {
  const boardId = req.board.id;
  const cardId = Number(req.params.cardId);
  const { status, position } = req.body;

  if (!status || position === undefined) {
    return res.status(400).json({ error: 'Target status and position are required.' });
  }

  const db = getDatabase();
  const card = db.prepare('SELECT * FROM cards WHERE id = ? AND board_id = ?').get(cardId, boardId);

  if (!card) {
    return res.status(404).json({ error: 'Card not found.' });
  }

  const oldStatus = card.status;
  const oldPosition = card.position;
  const targetPos = Math.max(0, Number(position));

  // Perform atomic re-indexing of positions
  db.exec('BEGIN IMMEDIATE;');
  try {
    if (oldStatus === status) {
      // Reordering within same column
      if (oldPosition < targetPos) {
        db.prepare(`
          UPDATE cards 
          SET position = position - 1 
          WHERE board_id = ? AND status = ? AND position > ? AND position <= ?
        `).run(boardId, status, oldPosition, targetPos);
      } else if (oldPosition > targetPos) {
        db.prepare(`
          UPDATE cards 
          SET position = position + 1 
          WHERE board_id = ? AND status = ? AND position >= ? AND position < ?
        `).run(boardId, status, targetPos, oldPosition);
      }
    } else {
      // Moving to a different column
      // Shift down cards in target column at or after targetPos
      db.prepare(`
        UPDATE cards 
        SET position = position + 1 
        WHERE board_id = ? AND status = ? AND position >= ?
      `).run(boardId, status, targetPos);

      // Shift up remaining cards in old column
      db.prepare(`
        UPDATE cards 
        SET position = position - 1 
        WHERE board_id = ? AND status = ? AND position > ?
      `).run(boardId, oldStatus, oldPosition);
    }

    // Set new status and position on the moved card
    db.prepare(`
      UPDATE cards 
      SET status = ?, position = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(status, targetPos, cardId);

    db.prepare('UPDATE boards SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(boardId);

    db.exec('COMMIT;');
  } catch (err) {
    db.exec('ROLLBACK;');
    throw err;
  }

  const updatedCard = populateCard(db, cardId);

  // Broadcast real-time move event to other sessions
  broadcastToBoard(boardId, 'card:moved', {
    boardId,
    cardId,
    sourceStatus: oldStatus,
    targetStatus: status,
    newPosition: targetPos,
    card: updatedCard
  });

  return res.json({ message: 'Card moved successfully.', card: updatedCard });
}

function deleteCard(req, res) {
  const boardId = req.board.id;
  const cardId = Number(req.params.cardId);

  const db = getDatabase();
  const card = db.prepare('SELECT * FROM cards WHERE id = ? AND board_id = ?').get(cardId, boardId);

  if (!card) {
    return res.status(404).json({ error: 'Card not found.' });
  }

  db.exec('BEGIN IMMEDIATE;');
  try {
    db.prepare('DELETE FROM cards WHERE id = ? AND board_id = ?').run(cardId, boardId);

    // Reindex remaining cards in same column
    db.prepare(`
      UPDATE cards 
      SET position = position - 1 
      WHERE board_id = ? AND status = ? AND position > ?
    `).run(boardId, card.status, card.position);

    db.prepare('UPDATE boards SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(boardId);
    db.exec('COMMIT;');
  } catch (err) {
    db.exec('ROLLBACK;');
    throw err;
  }

  // Broadcast delete
  broadcastToBoard(boardId, 'card:deleted', { boardId, cardId, status: card.status });

  return res.json({ message: 'Card deleted successfully.', cardId });
}

module.exports = {
  createCard,
  updateCard,
  moveCard,
  deleteCard
};
