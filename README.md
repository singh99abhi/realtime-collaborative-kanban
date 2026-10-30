# Real-Time Collaborative Kanban Board (Task 1)

> **Assessment Task 1: Real-Time Collaborative Kanban Board**  
> Role focus: **Full-Stack Developer**  
> Complete full-stack application featuring real-time WebSocket synchronization, JWT authentication, role-based board authorization, persistent SQLite storage, responsive drag-and-drop UI, interactive Swagger API documentation, and automated test coverage.

### 🌐 Live Public Demo Links:
- **Live Application**: [https://obligations-newspapers-going-committed.trycloudflare.com](https://obligations-newspapers-going-committed.trycloudflare.com)
- **Live Swagger API Docs**: [https://obligations-newspapers-going-committed.trycloudflare.com/api/docs](https://obligations-newspapers-going-committed.trycloudflare.com/api/docs)
- **Live Healthcheck Endpoint**: [https://obligations-newspapers-going-committed.trycloudflare.com/api/health](https://obligations-newspapers-going-committed.trycloudflare.com/api/health)

---

## 🌟 Key Features

- **Real-Time Multi-Session Collaboration**:
  - Bi-directional WebSockets using **Socket.IO** rooms (`board:<id>`).
  - Active user presence badges showing live teammates currently viewing the board.
  - Changes made in one browser session instantly propagate to other sessions without manual refresh.
- **Drag-and-Drop + Quick-Action Controls**:
  - Cards can be dragged between **To Do**, **In Progress**, and **Done** columns with smooth hover and drop feedback.
  - Accessible stepper buttons (`<-`, `->`) for one-click moving between columns.
  - Atomic position reordering with transaction safety.
- **Strict Authorization & Access Control**:
  - User registration and login with **JWT** tokens and **bcrypt** password hashing.
  - Private boards cannot be read or modified by unauthorized users (server-enforced HTTP 403 Forbidden).
  - Shared boards allow team collaboration with member tracking.
- **Zero-Dependency Reliable Persistence**:
  - Relational SQLite schema backed by Node 24's native `node:sqlite` (`DatabaseSync`).
  - Enforced foreign keys (`PRAGMA foreign_keys = ON`) with cascade deletes.
  - Multi-column indexes on `(board_id, status)`, `(board_id, status, position)`, and `(owner_id)`.
- **UI States & Polish**:
  - Live connection status indicator (🟢 **Live Sync**, 🟡 **Connecting...**, 🔴 **Offline**).
  - Loading skeletons, empty column states, and auto-dismissing toast notifications.
  - Search and priority filters (Urgent, High, Medium, Low).
- **Interactive API Documentation**:
  - Swagger / OpenAPI 3.0 specification available at `/api/docs`.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, Tailwind CSS, Lucide React, Socket.IO Client |
| **Backend** | Node.js (v24), Express.js, Socket.IO, `jsonwebtoken`, `bcryptjs`, CORS |
| **Database** | SQLite (native `node:sqlite` engine with WAL journal mode and foreign keys) |
| **API Docs** | Swagger UI (`swagger-ui-express`, OpenAPI 3.0) |
| **Testing** | Jest, Supertest, Socket.IO Client test harnesses |

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js** (v20+ or v24 recommended)
- **npm** (v10+)

### 2. Installation
From the project root:

```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### 3. Seed Sample Data
Initialize the SQLite database with test users, boards, and pre-populated cards:

```bash
cd server
npm run seed
```

This sets up 3 demo accounts:
| Name | Email | Password | Role / Access |
| :--- | :--- | :--- | :--- |
| **Alice Engineer** | `alice@example.com` | `Password123!` | Owner of *Q4 Sprint Board* & Private Research Board |
| **Bob Product** | `bob@example.com` | `Password123!` | Member of *Q4 Sprint Board* & Owner of Private Roadmap |
| **Charlie Designer**| `charlie@example.com` | `Password123!` | Member of *Q4 Sprint Board* |

### 4. Running the Application

Open two terminal tabs:

**Terminal 1 (Backend Server):**
```bash
cd server
npm start
# Server starts on http://localhost:4000
# Swagger UI available at http://localhost:4000/api/docs
```

**Terminal 2 (Frontend Client):**
```bash
cd client
npm run dev
# Frontend runs on http://localhost:5173
```

Navigate to **`http://localhost:5173`** in your browser.

---

## 🧪 Testing

### Automated Test Suite
The backend contains automated tests verifying authentication, authorization guards, card CRUD with atomic reordering, and multi-client WebSocket synchronization.

```bash
cd server
npm test
```

**Test Coverage Highlights:**
- `auth.test.js`: Sign-up validation, duplicate email 409 rejection, login credential validation, JWT verification.
- `board.test.js`: Board creation, **CRITICAL 403 Forbidden check** ensuring unauthorized users cannot read or modify another user's private board, card creation, card movement, and deletion.
- `socket.test.js`: JWT socket authentication rejection, presence tracking on room join, and live multi-client `card:moved` event broadcasting.

---

## 👥 How to Test Live Multi-Session Real-Time Collaboration

1. Open **`http://localhost:5173`** in your primary browser.
2. Click **"Alice Engineer"** under **Quick Demo Accounts** (or log in as `alice@example.com` / `Password123!`).
3. Open a **new Incognito / Private window** (or a second browser) and navigate to `http://localhost:5173`.
4. Click **"Bob Product"** under **Quick Demo Accounts**.
5. Both sessions will display the **"Q4 Sprint Board"**:
   - Notice the **Active Viewers** badge in the navbar updates to show both Alice and Bob are online.
   - Drag any card from **To Do** to **In Progress** in Window 1.
   - **Watch Window 2**: The card instantly transitions across columns in real-time without refreshing!
   - Create or edit a card in Window 2: it immediately appears in Window 1 with a toast notification.
6. Test **Private Board Isolation**:
   - In Alice's window, switch to **"Alice's Secret Project (Private)"**.
   - Notice Bob cannot see this board in his board selector.
   - If Bob attempts to send a direct API call (`GET /api/boards/2`), the server rejects with **HTTP 403 Forbidden**.

---

## 📖 API Documentation (Swagger / OpenAPI)

When the server is running, visit:
👉 **`http://localhost:4000/api/docs`**

### Summary of REST Endpoints

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register new user account | No |
| `POST` | `/api/auth/login` | Authenticate and obtain JWT | No |
| `GET` | `/api/auth/me` | Fetch current user profile | Bearer Token |
| `GET` | `/api/auth/users` | List users for task assignment | Bearer Token |
| `GET` | `/api/boards` | List accessible boards for current user | Bearer Token |
| `POST` | `/api/boards` | Create a new board (private/shared) | Bearer Token |
| `GET` | `/api/boards/:id` | Fetch board, members, and cards | Bearer Token (Owner/Member) |
| `PUT` | `/api/boards/:id` | Update board title / settings | Bearer Token (Owner Only) |
| `DELETE`| `/api/boards/:id` | Delete board | Bearer Token (Owner Only) |
| `POST` | `/api/boards/:boardId/cards` | Add new task card | Bearer Token (Owner/Member) |
| `PATCH` | `/api/boards/:boardId/cards/:cardId` | Edit task card details | Bearer Token (Owner/Member) |
| `PATCH` | `/api/boards/:boardId/cards/:cardId/move` | Move card & reindex positions | Bearer Token (Owner/Member) |
| `DELETE`| `/api/boards/:boardId/cards/:cardId` | Delete task card | Bearer Token (Owner/Member) |

### WebSocket Event Contract

| Event | Direction | Payload | Description |
| :--- | :--- | :--- | :--- |
| `board:join` | Client &rarr; Server | `{ boardId }` | Subscribes socket to board room |
| `board:leave` | Client &rarr; Server | `{ boardId }` | Unsubscribes socket from board room |
| `presence:update` | Server &rarr; Client | `{ boardId, viewers: [...] }` | Broadcasts current active online viewers |
| `card:created` | Server &rarr; Client | `{ boardId, card }` | Real-time broadcast of new card |
| `card:moved` | Server &rarr; Client | `{ boardId, cardId, targetStatus, newPosition, card }` | Real-time broadcast of card transition |
| `card:updated` | Server &rarr; Client | `{ boardId, card }` | Real-time broadcast of card edit |
| `card:deleted` | Server &rarr; Client | `{ boardId, cardId, status }` | Real-time broadcast of card deletion |

---

## 🗄️ Database Architecture & Indexes

```sql
-- Schema Highlights
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  avatar_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE boards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  owner_id INTEGER NOT NULL,
  is_private INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE cards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  board_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'todo', -- 'todo', 'in_progress', 'done'
  position INTEGER NOT NULL DEFAULT 0,
  priority TEXT DEFAULT 'medium',     -- 'low', 'medium', 'high', 'urgent'
  assignee_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE,
  FOREIGN KEY (assignee_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Performance Indexes
CREATE INDEX idx_boards_owner ON boards(owner_id);
CREATE INDEX idx_cards_board_status ON cards(board_id, status);
CREATE INDEX idx_cards_board_position ON cards(board_id, status, position);
```

---

## 🛡️ Security Best Practices Enforced
1. **Never Storing Plaintext Passwords**: All passwords salted and hashed via `bcryptjs`.
2. **Server-Side Authorization Enforcement**: Client-side filtering is backed up by strict server middleware guards (`requireBoardAccess`) returning HTTP 403 if an uninvited user tries to query another's private board.
3. **Socket Handshake Verification**: WebSockets reject unauthorized handshake attempts if a valid JWT is not provided.
4. **Environment Isolation**: Sensitive configuration (JWT secrets, port numbers) managed via `.env` files and omitted from version control.

---

## 🌐 Free Deployment (1-Click on Render or Vercel)

Complete step-by-step instructions and free tier configuration details are provided in [DEPLOYMENT.md](DEPLOYMENT.md).

### Option 1: 1-Click Free Deployment on Render (Unified Full-Stack — Recommended)
With the included [render.yaml](render.yaml) Blueprint, you can deploy the complete full-stack app (React SPA + Express API + WebSockets + Swagger docs) as a **single 100% free service**:
1. Push this project to a GitHub repository.
2. In [Render Dashboard](https://dashboard.render.com), click **New +** &rarr; **Blueprint** and select your repo.
3. Click **Apply**. Render will automatically build the client, initialize the database with demo accounts, and serve your application at `https://<service-name>.onrender.com`.

### Option 2: Vercel (Frontend) + Render (Backend)
- Deploy `server/` to Render (free Web Service).
- Deploy `client/` to Vercel (using the included `client/vercel.json`), setting `VITE_API_URL` to your Render backend URL.

### Free Tier Limitations & WebSocket Behavior
- **Cold Starts**: On Render's free tier, inactive instances spin down after 15 minutes. The initial request takes ~45s to wake up.
- **WebSocket Resilience**: The app automatically uses dual transport (`['websocket', 'polling']`) to guarantee real-time updates even through restrictive free tier cloud proxies.

