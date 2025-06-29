# Queue Service Dockerfile
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY packages/queue-service/package*.json ./packages/queue-service/

# Install dependencies (including dev deps for build)
RUN npm ci

# Copy source code
COPY packages/shared/ ./packages/shared/
COPY packages/queue-service/ ./packages/queue-service/

# Build the applications
RUN npm run build -w @planemail/shared
RUN npm run build -w @planemail/queue-service

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Set user for security
USER node

# Start the queue service
CMD ["npm", "start", "-w", "@planemail/queue-service"]
