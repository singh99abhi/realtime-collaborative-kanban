const swaggerDoc = {
  openapi: '3.0.0',
  info: {
    title: 'Real-Time Collaborative Kanban Board API',
    version: '1.0.0',
    description: 'REST API and WebSocket specification for the Real-Time Collaborative Kanban Board assessment. Features JWT auth, role-based board authorization, drag-and-drop card movements, and Socket.IO multi-session synchronization.'
  },
  servers: [
    {
      url: 'http://localhost:4000',
      description: 'Local development server'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          name: { type: 'string', example: 'Alice Engineer' },
          email: { type: 'string', example: 'alice@example.com' },
          avatar_url: { type: 'string', example: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice' }
        }
      },
      Board: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          title: { type: 'string', example: 'Q4 Sprint Board' },
          description: { type: 'string', example: 'Cross-functional engineering sprint' },
          owner_id: { type: 'integer', example: 1 },
          is_private: { type: 'integer', example: 0 },
          created_at: { type: 'string', example: '2026-10-30T10:00:00.000Z' }
        }
      },
      Card: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          board_id: { type: 'integer', example: 1 },
          title: { type: 'string', example: 'Real-time WebSocket Sync' },
          description: { type: 'string', example: 'Connect Socket.IO rooms' },
          status: { type: 'string', enum: ['todo', 'in_progress', 'done'], example: 'in_progress' },
          position: { type: 'integer', example: 0 },
          priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'], example: 'urgent' },
          assignee_id: { type: 'integer', nullable: true, example: 1 },
          created_at: { type: 'string' }
        }
      }
    }
  },
  security: [
    {
      bearerAuth: []
    }
  ],
  paths: {
    '/api/auth/register': {
      post: {
        summary: 'Register a new user account',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'password'],
                properties: {
                  name: { type: 'string', example: 'Test User' },
                  email: { type: 'string', example: 'test@example.com' },
                  password: { type: 'string', example: 'Password123!' }
                }
              }
            }
          }
        },
        responses: {
          201: { description: 'User created successfully with token' },
          400: { description: 'Validation error' },
          409: { description: 'Email already registered' }
        }
      }
    },
    '/api/auth/login': {
      post: {
        summary: 'Sign in with email and password',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', example: 'alice@example.com' },
                  password: { type: 'string', example: 'Password123!' }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Authentication successful, returns JWT' },
          401: { description: 'Invalid credentials' }
        }
      }
    },
    '/api/auth/me': {
      get: {
        summary: 'Get current user profile',
        responses: {
          200: { description: 'Returns authenticated user object' },
          401: { description: 'Unauthorized' }
        }
      }
    },
    '/api/auth/users': {
      get: {
        summary: 'List all users for assignment',
        responses: {
          200: { description: 'Returns list of users' }
        }
      }
    },
    '/api/boards': {
      get: {
        summary: 'List all boards accessible to user',
        responses: {
          200: { description: 'List of boards with card counts' }
        }
      },
      post: {
        summary: 'Create a new board',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title'],
                properties: {
                  title: { type: 'string', example: 'Marketing Campaign' },
                  description: { type: 'string', example: 'Launch checklist' },
                  is_private: { type: 'integer', example: 1 }
                }
              }
            }
          }
        },
        responses: {
          201: { description: 'Board created' }
        }
      }
    },
    '/api/boards/{id}': {
      get: {
        summary: 'Get board details and cards (Protected by authorization guard)',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
        ],
        responses: {
          200: { description: 'Board details and ordered card lists' },
          403: { description: 'Access denied: private board of another user' },
          404: { description: 'Board not found' }
        }
      },
      delete: {
        summary: 'Delete board (Owner only)',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
        ],
        responses: {
          200: { description: 'Board deleted' },
          403: { description: 'Forbidden' }
        }
      }
    },
    '/api/boards/{boardId}/cards': {
      post: {
        summary: 'Create a new card on board',
        parameters: [
          { name: 'boardId', in: 'path', required: true, schema: { type: 'integer' } }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title'],
                properties: {
                  title: { type: 'string', example: 'Design Landing Page' },
                  description: { type: 'string' },
                  status: { type: 'string', enum: ['todo', 'in_progress', 'done'] },
                  priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
                  assignee_id: { type: 'integer', nullable: true }
                }
              }
            }
          }
        },
        responses: {
          201: { description: 'Card created and broadcast to WebSocket room' }
        }
      }
    },
    '/api/boards/{boardId}/cards/{cardId}/move': {
      patch: {
        summary: 'Move card to new column/position atomically',
        parameters: [
          { name: 'boardId', in: 'path', required: true, schema: { type: 'integer' } },
          { name: 'cardId', in: 'path', required: true, schema: { type: 'integer' } }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['status', 'position'],
                properties: {
                  status: { type: 'string', enum: ['todo', 'in_progress', 'done'] },
                  position: { type: 'integer', example: 1 }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Card moved and broadcast to room' }
        }
      }
    }
  }
};

module.exports = swaggerDoc;
