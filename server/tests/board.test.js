const request = require('supertest');
const app = require('../src/app');
const { getDatabase } = require('../src/db/database');

describe('Board & Card Operations with Access Control', () => {
  let user1Token;
  let user1Id;
  let user2Token;
  let user2Id;
  let privateBoardId;
  let sharedBoardId;

  beforeAll(async () => {
    getDatabase();

    // Register User 1
    const u1Res = await request(app).post('/api/auth/register').send({
      name: 'User One',
      email: `u1_${Date.now()}@example.com`,
      password: 'Password123!'
    });
    user1Token = u1Res.body.token;
    user1Id = u1Res.body.user.id;

    // Register User 2
    const u2Res = await request(app).post('/api/auth/register').send({
      name: 'User Two',
      email: `u2_${Date.now()}@example.com`,
      password: 'Password123!'
    });
    user2Token = u2Res.body.token;
    user2Id = u2Res.body.user.id;

    // User 1 creates a private board
    const b1Res = await request(app)
      .post('/api/boards')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        title: "User 1 Private Board",
        description: "Confidential data",
        is_private: 1
      });
    privateBoardId = b1Res.body.board.id;

    // User 1 creates a public/shared board
    const b2Res = await request(app)
      .post('/api/boards')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        title: "Team Collaborative Board",
        description: "Open to team",
        is_private: 0
      });
    sharedBoardId = b2Res.body.board.id;
  });

  describe('Access Control', () => {
    test('User 1 (owner) can access their private board', async () => {
      const res = await request(app)
        .get(`/api/boards/${privateBoardId}`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.board.title).toBe("User 1 Private Board");
    });

    test("CRITICAL: Unauthorized User 2 cannot access User 1's private board (403 Forbidden)", async () => {
      const res = await request(app)
        .get(`/api/boards/${privateBoardId}`)
        .set('Authorization', `Bearer ${user2Token}`);

      expect(res.status).toBe(403);
      expect(res.body).toHaveProperty('error');
    });

    test('User 2 can access User 1 public/shared board', async () => {
      const res = await request(app)
        .get(`/api/boards/${sharedBoardId}`)
        .set('Authorization', `Bearer ${user2Token}`);

      expect(res.status).toBe(200);
      expect(res.body.board.title).toBe("Team Collaborative Board");
    });
  });

  describe('Card Operations and Reordering', () => {
    let card1Id;
    let card2Id;

    test('User 1 can create cards in To Do', async () => {
      const res1 = await request(app)
        .post(`/api/boards/${sharedBoardId}/cards`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          title: 'First Task',
          description: 'Description 1',
          status: 'todo',
          priority: 'high'
        });

      expect(res1.status).toBe(201);
      expect(res1.body.card.title).toBe('First Task');
      expect(res1.body.card.position).toBe(0);
      card1Id = res1.body.card.id;

      const res2 = await request(app)
        .post(`/api/boards/${sharedBoardId}/cards`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          title: 'Second Task',
          description: 'Description 2',
          status: 'todo',
          priority: 'medium'
        });

      expect(res2.status).toBe(201);
      expect(res2.body.card.position).toBe(1);
      card2Id = res2.body.card.id;
    });

    test('User 1 can move a card from To Do to In Progress', async () => {
      const moveRes = await request(app)
        .patch(`/api/boards/${sharedBoardId}/cards/${card1Id}/move`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          status: 'in_progress',
          position: 0
        });

      expect(moveRes.status).toBe(200);
      expect(moveRes.body.card.status).toBe('in_progress');
      expect(moveRes.body.card.position).toBe(0);

      // Verify board state
      const boardRes = await request(app)
        .get(`/api/boards/${sharedBoardId}`)
        .set('Authorization', `Bearer ${user1Token}`);

      const inProgressCards = boardRes.body.cards.filter(c => c.status === 'in_progress');
      expect(inProgressCards.some(c => c.id === card1Id)).toBe(true);
    });

    test('User 1 can update card details', async () => {
      const updateRes = await request(app)
        .patch(`/api/boards/${sharedBoardId}/cards/${card1Id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          title: 'Updated First Task Title',
          priority: 'urgent'
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.card.title).toBe('Updated First Task Title');
      expect(updateRes.body.card.priority).toBe('urgent');
    });

    test('User 1 can delete a card', async () => {
      const delRes = await request(app)
        .delete(`/api/boards/${sharedBoardId}/cards/${card2Id}`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(delRes.status).toBe(200);

      const boardRes = await request(app)
        .get(`/api/boards/${sharedBoardId}`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(boardRes.body.cards.some(c => c.id === card2Id)).toBe(false);
    });
  });
});
