# Multi-stage build for Vite + React frontend with PM2

# Stage 1: Build stage
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json yarn.lock ./

# Install dependencies (including devDependencies for build)
RUN yarn install --frozen-lockfile

# Copy source code and config files
COPY . .

# Build the application
RUN yarn build

# Stage 2: Production stage with PM2
FROM node:20-alpine AS production

# Install PM2 globally
RUN npm install -g pm2

# Set working directory
WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy package files
COPY package.json yarn.lock ./

# Install production dependencies, then add vite for preview
RUN yarn install --frozen-lockfile --production && \
    yarn add vite@^7.2.4 --production && \
    yarn cache clean

# Copy built files from builder stage
COPY --from=builder /app/dist ./dist

# Change ownership to nodejs user
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 5173

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5173', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application with PM2
CMD ["pm2-runtime", "start", "node_modules/.bin/vite", "--name", "poll-frontend", "--", "preview", "--host", "0.0.0.0", "--port", "5173"]
