# Queue Service Dockerfile
FROM node:18-alpine

# Install curl for health checks
RUN apk add --no-cache curl

# Set working directory
WORKDIR /app

# Copy package files from root context
COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY packages/queue-service/package*.json ./packages/queue-service/

# Install dependencies (including dev deps for build)
RUN npm ci

# Copy source code from root context
COPY packages/shared/ ./packages/shared/
COPY packages/queue-service/ ./packages/queue-service/

# Build the applications
RUN npm run build -w @planemail/shared
RUN npm run build -w @planemail/queue-service

# Change ownership of the app directory to node user
RUN chown -R node:node /app

# Expose port (queue service runs on 3002)
EXPOSE 3002

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3002/health || exit 1

# Set user for security
USER node

# Start the queue service
CMD ["npm", "start", "-w", "@planemail/queue-service"]
