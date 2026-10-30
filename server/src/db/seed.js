const bcrypt = require('bcryptjs');
const { getDatabase } = require('./database');

async function seedData(db) {
  const database = db || getDatabase();

  console.log('Seeding database...');

  // Hash password
  const passwordHash = await bcrypt.hash('Password123!', 10);

  // Clear existing data
  database.exec(`
    DELETE FROM cards;
    DELETE FROM board_members;
    DELETE FROM boards;
    DELETE FROM users;
  `);

  // Insert Users
  const insertUser = database.prepare(`
    INSERT INTO users (name, email, password_hash, avatar_url)
    VALUES (?, ?, ?, ?)
  `);

  const alice = insertUser.run('Alice Engineer', 'alice@example.com', passwordHash, 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice');
  const bob = insertUser.run('Bob Product', 'bob@example.com', passwordHash, 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob');
  const charlie = insertUser.run('Charlie Designer', 'charlie@example.com', passwordHash, 'https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie');

  const aliceId = Number(alice.lastInsertRowid);
  const bobId = Number(bob.lastInsertRowid);
  const charlieId = Number(charlie.lastInsertRowid);

  // Insert Boards
  const insertBoard = database.prepare(`
    INSERT INTO boards (title, description, owner_id, is_private)
    VALUES (?, ?, ?, ?)
  `);

  // Shared Board
  const sprintBoard = insertBoard.run('Q4 Sprint Board', 'Cross-functional engineering sprint board', aliceId, 0);
  const sprintBoardId = Number(sprintBoard.lastInsertRowid);

  // Alice's Private Board
  const alicePrivate = insertBoard.run("Alice's Secret Project", 'Confidential technical research notes', aliceId, 1);
  const alicePrivateId = Number(alicePrivate.lastInsertRowid);

  // Bob's Private Board
  const bobPrivate = insertBoard.run("Bob's Private Roadmap", 'Product strategy planning', bobId, 1);
  const bobPrivateId = Number(bobPrivate.lastInsertRowid);

  // Add Board Members to Shared Board
  const insertMember = database.prepare(`
    INSERT INTO board_members (board_id, user_id, role)
    VALUES (?, ?, ?)
  `);
  insertMember.run(sprintBoardId, aliceId, 'owner');
  insertMember.run(sprintBoardId, bobId, 'member');
  insertMember.run(sprintBoardId, charlieId, 'member');

  // Insert Members for private boards (owner only)
  insertMember.run(alicePrivateId, aliceId, 'owner');
  insertMember.run(bobPrivateId, bobId, 'owner');

  // Insert Cards for Shared Board
  const insertCard = database.prepare(`
    INSERT INTO cards (board_id, title, description, status, position, priority, assignee_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  // To Do
  insertCard.run(sprintBoardId, 'Design System Token Audit', 'Review color tokens and spacing variables across components', 'todo', 0, 'medium', charlieId);
  insertCard.run(sprintBoardId, 'Implement OAuth 2.0 Provider', 'Add Google / GitHub single sign-on integration', 'todo', 1, 'high', null);
  insertCard.run(sprintBoardId, 'Write End-to-End Cypress Tests', 'Cover registration, drag-drop card, and real-time updates', 'todo', 2, 'low', null);

  // In Progress
  insertCard.run(sprintBoardId, 'Real-time WebSocket Sync', 'Connect Socket.IO rooms to synchronize card moves across tabs', 'in_progress', 0, 'urgent', aliceId);
  insertCard.run(sprintBoardId, 'Database Indexing Optimization', 'Benchmark board queries and verify indexed retrieval', 'in_progress', 1, 'high', aliceId);

  // Done
  insertCard.run(sprintBoardId, 'JWT Authentication Setup', 'Sign and verify JSON Web Tokens with bcrypt password hashing', 'done', 0, 'urgent', aliceId);
  insertCard.run(sprintBoardId, 'Project Architecture RFC', 'Document schema design, REST endpoints, and WebSocket contracts', 'done', 1, 'medium', bobId);

  // Cards for Alice's Private Board
  insertCard.run(alicePrivateId, 'Review Compensation Bands', 'Private leadership review', 'todo', 0, 'urgent', aliceId);

  console.log('Database successfully seeded!');
  console.log('Users:');
  console.log('  - alice@example.com (Password123!)');
  console.log('  - bob@example.com   (Password123!)');
  console.log('  - charlie@example.com (Password123!)');
}

if (require.main === module) {
  seedData()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seed failed:', err);
      process.exit(1);
    });
}

module.exports = { seedData };
