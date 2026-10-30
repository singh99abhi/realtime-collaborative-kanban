require('dotenv').config();
const http = require('node:http');
const { Server } = require('socket.io');
const app = require('./app');
const { getDatabase } = require('./db/database');
const { initSocket } = require('./sockets/kanbanSocket');

const PORT = process.env.PORT || 4000;

// Ensure database is initialized
getDatabase();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE']
  }
});

initSocket(io);

server.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`  Kanban Backend Server running on port ${PORT}`);
  console.log(`  Healthcheck: http://localhost:${PORT}/api/health`);
  console.log(`  Swagger Docs: http://localhost:${PORT}/api/docs`);
  console.log(`===============================================`);
});

// Export server and io for testing
module.exports = { server, io };
