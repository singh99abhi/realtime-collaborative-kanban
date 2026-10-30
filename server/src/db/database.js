const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const fs = require('node:fs');

let instance = null;

function getDatabase(dbPath = process.env.DB_PATH || 'kanban.db') {
  if (instance) return instance;

  const resolvedPath = dbPath === ':memory:' 
    ? ':memory:' 
    : path.resolve(__dirname, '..', '..', dbPath);

  const dbDir = path.dirname(resolvedPath);
  if (resolvedPath !== ':memory:' && !fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const db = new DatabaseSync(resolvedPath);
  
  // Enable foreign key constraints and WAL journal mode for performance
  db.exec('PRAGMA foreign_keys = ON;');
  if (resolvedPath !== ':memory:') {
    db.exec('PRAGMA journal_mode = WAL;');
  }

  initSchema(db);
  instance = db;
  return instance;
}

function initSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      avatar_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS boards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      owner_id INTEGER NOT NULL,
      is_private INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS board_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      board_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      role TEXT DEFAULT 'member', -- 'owner', 'member', 'viewer'
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(board_id, user_id),
      FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      board_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'todo', -- 'todo', 'in_progress', 'done'
      position INTEGER NOT NULL DEFAULT 0,
      priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
      assignee_id INTEGER,
      due_date TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE,
      FOREIGN KEY (assignee_id) REFERENCES users(id) ON DELETE SET NULL
    );

    -- Performance Indexes for lightning-fast board and card retrieval
    CREATE INDEX IF NOT EXISTS idx_boards_owner ON boards(owner_id);
    CREATE INDEX IF NOT EXISTS idx_board_members_user ON board_members(user_id);
    CREATE INDEX IF NOT EXISTS idx_board_members_board ON board_members(board_id);
    CREATE INDEX IF NOT EXISTS idx_cards_board_status ON cards(board_id, status);
    CREATE INDEX IF NOT EXISTS idx_cards_board_position ON cards(board_id, status, position);
    CREATE INDEX IF NOT EXISTS idx_cards_assignee ON cards(assignee_id);
  `);
}

function resetDatabaseForTesting() {
  if (instance) {
    try {
      instance.close();
    } catch (_) {}
    instance = null;
  }
}

module.exports = {
  getDatabase,
  resetDatabaseForTesting
};
