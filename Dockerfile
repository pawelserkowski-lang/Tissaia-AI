# Multi-stage build for Tissaia AI
# Stage 1: Build frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source files
COPY . .

# Build frontend
RUN npm run build

# Stage 2: Backend + serve frontend
FROM node:20-alpine AS production

WORKDIR /app

# Install serve for serving static files
RUN npm install -g serve tsx

# Copy package files
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy backend code
COPY backend ./backend
COPY services ./services
COPY types ./types
COPY config ./config
COPY utils ./utils

# Copy built frontend from previous stage
COPY --from=frontend-builder /app/dist ./dist

# Expose ports (frontend: 3000, backend: 3001)
EXPOSE 3000 3001

# Create startup script
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'serve -s dist -l 3000 &' >> /app/start.sh && \
    echo 'tsx backend/server.ts' >> /app/start.sh && \
    chmod +x /app/start.sh

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1))"

# Start both servers
CMD ["/app/start.sh"]
