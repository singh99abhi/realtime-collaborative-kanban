# Free Deployment Guide: Real-Time Collaborative Kanban Board

This guide provides step-by-step instructions to deploy this application **completely free of charge** using **Render**, **Vercel**, or **Railway / Koyeb**, fulfilling all deployment deliverables and free tier documentation requirements from the assessment brief.

---

## 🎯 Recommended Method: Unified Free Deployment on Render (1-Click)

Because the Express server serves both the **React frontend SPA** (`client/dist`), the **REST API** (`/api/*`), the **Swagger UI** (`/api/docs`), and the **Socket.IO WebSockets** (`/socket.io`), you can deploy the entire full-stack project as a **single free Web Service on Render**.

### Steps to Deploy on Render for Free:

1. **Push your code to GitHub**:
   - Create a new public or private repository on [GitHub](https://github.com).
   - Push this workspace to your repository.

2. **Log into Render**:
   - Sign up for a free account at [render.com](https://render.com).

3. **Deploy using the included `render.yaml` Blueprint (Easiest)**:
   - In Render Dashboard, click **New +** &rarr; **Blueprint**.
   - Connect your GitHub repository.
   - Render will detect `render.yaml` and configure everything automatically:
     - **Build Command**: `npm install && npm --prefix server install && npm --prefix client install && npm --prefix client run build && npm --prefix server run seed`
     - **Start Command**: `node server/src/server.js`
     - **Environment Variables**:
       - `NODE_ENV`: `production`
       - `PORT`: `10000`
       - `JWT_SECRET`: *(auto-generated)*
       - `DB_PATH`: `kanban.db`
   - Click **Apply**.
   - In ~2-3 minutes, your live URL will be active at:  
     `https://<your-service-name>.onrender.com`

4. **Or Deploy Manually on Render Dashboard**:
   - Click **New +** &rarr; **Web Service**.
   - Connect your GitHub repo.
   - Configure:
     - **Environment**: `Node`
     - **Region**: Oregon (US West) or Frankfurt (EU)
     - **Branch**: `main`
     - **Build Command**: `npm install && npm --prefix server install && npm --prefix client install && npm --prefix client run build && npm --prefix server run seed`
     - **Start Command**: `node server/src/server.js`
     - **Instance Type**: `Free`
   - Under **Environment Variables**, add:
     - `NODE_ENV` = `production`
     - `JWT_SECRET` = `render-free-tier-super-secret-jwt-key-2026`
     - `PORT` = `10000`
   - Click **Create Web Service**.

---

## ⚡ Alternative Method: Vercel (Frontend) + Render (Backend)

If you prefer separating the frontend and backend onto two services:

### 1. Deploy Backend on Render:
- Create a **Web Service** on Render pointing to the `server/` directory.
- **Root Directory**: `server`
- **Build Command**: `npm install && npm run seed`
- **Start Command**: `node src/server.js`
- Note your live backend URL: `https://my-kanban-backend.onrender.com`.

### 2. Deploy Frontend on Vercel:
- Log into [Vercel](https://vercel.com) and click **Add New...** &rarr; **Project**.
- Select your GitHub repo.
- Configure:
  - **Root Directory**: `client`
  - **Framework Preset**: `Vite`
- Under **Environment Variables**, add:
  - `VITE_API_URL`: `https://my-kanban-backend.onrender.com`
- Click **Deploy**.

---

## 🐳 Alternative Method: Deploy via Docker (Railway / Fly.io / Koyeb)

The included multi-stage `Dockerfile` compiles the client and bundles the server into a lightweight Node.js 24 Alpine container:

```bash
# Build and run locally with Docker
docker-compose up --build
```

You can deploy this Docker container directly on **Koyeb** (free Eco tier) or **Railway** by connecting your GitHub repository and selecting the Dockerfile build mode.

---

## ⚠️ Documentation of Free Hosting Tier & WebSocket Limitations

As required by the assignment brief (*"Document any limitations of the free hosting tier or WebSocket configuration"*):

1. **Free Tier Inactivity Sleep (Cold Starts)**:
   - On the Render free tier, web services spin down to 0 instances after **15 minutes of inactivity**.
   - When a new request arrives, the service wakes up automatically, which takes approximately **45–60 seconds** on the initial cold start. Once awake, performance is immediate.
   - *Mitigation*: The app includes a loading skeleton and a reconnecting badge so users are informed while the instance resumes.

2. **Ephemeral Disk Storage**:
   - The free instance filesystem is ephemeral. While the SQLite database persists across reloads and process restarts within the instance lifecycle, redeploying or waking from a full teardown may reset the database to the initial seed state.
   - *Mitigation*: For persistent enterprise storage, a persistent disk can be mounted or PostgreSQL can be configured.

3. **WebSocket Proxy & Fallback Handling**:
   - Some free reverse proxies or corporate firewalls may delay or drop initial WebSocket upgrades.
   - *Mitigation*: Our Socket.IO configuration explicitly includes HTTP long-polling fallback (`transports: ['websocket', 'polling']`). If a pure WebSocket connection cannot be immediately established, the client falls back to polling seamlessly without breaking real-time functionality.
