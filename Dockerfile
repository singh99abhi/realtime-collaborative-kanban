# Stage 1: Build Frontend
FROM node:24-alpine AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# Stage 2: Runtime Production Server
FROM node:24-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

# Install server dependencies
COPY server/package*.json ./server/
RUN cd server && npm ci --omit=dev

# Copy server code
COPY server/ ./server/

# Copy built frontend assets to server's client dist location
COPY --from=client-builder /app/client/dist ./client/dist

# Initialize and seed database
RUN cd server && node src/db/seed.js

EXPOSE 4000

CMD ["node", "server/src/server.js"]
