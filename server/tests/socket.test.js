const http = require('node:http');
const { Server } = require('socket.io');
const Client = require('socket.io-client');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const { getDatabase } = require('../src/db/database');
const { initSocket } = require('../src/sockets/kanbanSocket');
const { JWT_SECRET } = require('../src/middleware/auth');

describe('Real-Time WebSocket Synchronization', () => {
  let httpServer;
  let io;
  let port;
  let tokenAlice;
  let tokenBob;
  let clientSocketAlice;
  let clientSocketBob;

  beforeAll((done) => {
    getDatabase();

    // Create tokens for Alice and Bob
    tokenAlice = jwt.sign({ id: 1, email: 'alice@example.com' }, JWT_SECRET, { expiresIn: '1h' });
    tokenBob = jwt.sign({ id: 2, email: 'bob@example.com' }, JWT_SECRET, { expiresIn: '1h' });

    httpServer = http.createServer(app);
    io = new Server(httpServer, { cors: { origin: '*' } });
    initSocket(io);

    httpServer.listen(() => {
      port = httpServer.address().port;
      done();
    });
  });

  afterAll((done) => {
    if (clientSocketAlice && clientSocketAlice.connected) clientSocketAlice.disconnect();
    if (clientSocketBob && clientSocketBob.connected) clientSocketBob.disconnect();
    io.close();
    httpServer.close(done);
  });

  test('Socket connection requires valid JWT authentication', (done) => {
    const unauthClient = Client(`http://localhost:${port}`, {
      auth: { token: 'invalid-token' },
      transports: ['websocket']
    });

    unauthClient.on('connect_error', (err) => {
      expect(err.message).toMatch(/Authentication error/);
      unauthClient.close();
      done();
    });
  });

  test('Two clients join the same board room and receive presence updates', (done) => {
    const boardId = 1;

    clientSocketAlice = Client(`http://localhost:${port}`, {
      auth: { token: tokenAlice },
      transports: ['websocket']
    });

    clientSocketAlice.on('connect', () => {
      clientSocketAlice.emit('board:join', { boardId });

      clientSocketBob = Client(`http://localhost:${port}`, {
        auth: { token: tokenBob },
        transports: ['websocket']
      });

      clientSocketBob.on('connect', () => {
        clientSocketBob.emit('board:join', { boardId });
      });

      let receivedPresence = false;
      clientSocketBob.on('presence:update', (data) => {
        if (data.boardId === boardId && data.viewers.length > 0 && !receivedPresence) {
          receivedPresence = true;
          expect(data.boardId).toBe(boardId);
          done();
        }
      });
    });
  });

  test('Card movement is broadcast to all other sessions in the board room in real time', (done) => {
    const boardId = 1;
    const movePayload = {
      boardId,
      cardId: 101,
      sourceStatus: 'todo',
      targetStatus: 'in_progress',
      newPosition: 0
    };

    clientSocketBob.on('card:moved', (data) => {
      expect(data.cardId).toBe(101);
      expect(data.targetStatus).toBe('in_progress');
      done();
    });

    // Alice moves card
    clientSocketAlice.emit('card:move', movePayload);
  });
});
