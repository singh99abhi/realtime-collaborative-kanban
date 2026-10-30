const express = require('express');
const cors = require('cors');
const path = require('node:path');
const fs = require('node:fs');
const swaggerUi = require('swagger-ui-express');
const swaggerDoc = require('./docs/swaggerDoc');

const { authenticateToken } = require('./middleware/auth');
const { requireBoardAccess } = require('./middleware/boardGuard');

const authController = require('./controllers/authController');
const boardController = require('./controllers/boardController');
const cardController = require('./controllers/cardController');

const app = express();

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// API Documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc));
app.get('/api/docs.json', (req, res) => res.json(swaggerDoc));

// Healthcheck
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Authentication Routes
app.post('/api/auth/register', authController.register);
app.post('/api/auth/login', authController.login);
app.get('/api/auth/me', authenticateToken, authController.getMe);
app.get('/api/auth/users', authenticateToken, authController.getUsers);

// Board Routes (Protected by authenticateToken)
app.get('/api/boards', authenticateToken, boardController.listBoards);
app.post('/api/boards', authenticateToken, boardController.createBoard);

// Individual Board Routes (Protected by requireBoardAccess)
app.get('/api/boards/:id', authenticateToken, requireBoardAccess, boardController.getBoard);
app.put('/api/boards/:id', authenticateToken, requireBoardAccess, boardController.updateBoard);
app.delete('/api/boards/:id', authenticateToken, requireBoardAccess, boardController.deleteBoard);
app.post('/api/boards/:id/members', authenticateToken, requireBoardAccess, boardController.addMember);

// Card Routes (Scoped under board and protected by requireBoardAccess)
app.post('/api/boards/:boardId/cards', authenticateToken, requireBoardAccess, cardController.createCard);
app.patch('/api/boards/:boardId/cards/:cardId', authenticateToken, requireBoardAccess, cardController.updateCard);
app.patch('/api/boards/:boardId/cards/:cardId/move', authenticateToken, requireBoardAccess, cardController.moveCard);
app.delete('/api/boards/:boardId/cards/:cardId', authenticateToken, requireBoardAccess, cardController.deleteCard);

// Serve static frontend build if it exists (for unified production deployment)
const clientDistPath = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// 404 handler for undefined API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: `Endpoint ${req.method} ${req.originalUrl} not found.` });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'An unexpected internal server error occurred.'
  });
});

module.exports = app;
