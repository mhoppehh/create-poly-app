# Multi-stage Dockerfile for testing create-poly-app

# Base image with Node.js and system dependencies
FROM node:18-alpine AS base

# Install system dependencies required for building native modules
RUN apk add --no-cache \
    git \
    python3 \
    make \
    g++ \
    curl \
    bash

# Install pnpm globally
RUN npm install -g pnpm@latest

# Set working directory
WORKDIR /app

# Stage for building the create-poly-app tool
FROM base AS tool-builder

# Copy package files
COPY package.json pnpm-lock.yaml ./
COPY src/ ./src/
COPY tsconfig.json rollup.config.js ./

# Install dependencies and build
RUN pnpm install --frozen-lockfile
RUN pnpm build

# Stage for integration testing
FROM base AS integration-tester

# Copy built tool from previous stage
COPY --from=tool-builder /app/dist ./create-poly-app/dist
COPY --from=tool-builder /app/package.json ./create-poly-app/
COPY --from=tool-builder /app/node_modules ./create-poly-app/node_modules

# Make the CLI available globally
RUN ln -sf /app/create-poly-app/dist/main.cjs /usr/local/bin/create-poly-app

# Create test workspace directory
WORKDIR /test-workspace

# Copy test scripts
COPY tests/integration/docker/ ./test-scripts/

# Set executable permissions
RUN chmod +x ./test-scripts/*.sh

# Default command
CMD ["./test-scripts/run-all-tests.sh"]

# Stage for smoke testing
FROM integration-tester AS smoke-tester

# Environment variables for testing
ENV NODE_ENV=test
ENV CI=true

# Copy smoke test configurations
COPY tests/integration/smoke-tests/ ./smoke-tests/

CMD ["./test-scripts/run-smoke-tests.sh"]