# Docker Containerization

## Overview

Containerized deployment for consistent environments across development, staging, and production with Docker and Docker Compose.

## Priority

**HIGH** - Essential for consistent deployment environments

## Dependencies

- Project source code
- Node.js application

## Components

### Multi-stage Dockerfiles

- Optimized production builds with separate stages
- Build, development, and production stages
- Non-root user security configuration
- Health checks integration

### Docker Compose

- Local development environment setup
- Service orchestration (app, database, redis, etc.)
- Volume management for persistent data
- Network configuration for service communication

### Container Registry

- Image storage and versioning
- Support for Docker Hub, AWS ECR, GCR, GitHub Packages
- Automated image builds and tags
- Security scanning integration

### Health Checks

- Container health monitoring
- Application readiness checks
- Database connectivity validation
- Custom health check endpoints

### Security Scanning

- Vulnerability scanning for container images
- Base image security assessment
- Dependency vulnerability detection
- Automated security reporting

## Configuration

```typescript
interface DockerConfig {
  registry: 'docker-hub' | 'aws-ecr' | 'gcr' | 'github-packages'
  multiStage: boolean
  healthChecks: boolean
  securityScanning: boolean
  compose: {
    services: string[]
    volumes: boolean
    networks: boolean
  }
}
```

## Generated Files

```
├── Dockerfile                     # Multi-stage production Dockerfile
├── Dockerfile.dev                 # Development Dockerfile
├── docker-compose.yml             # Local development setup
├── docker-compose.prod.yml        # Production-like local setup
├── .dockerignore                  # Docker ignore patterns
└── docker/
    ├── api/
    │   └── healthcheck.js         # API health check script
    └── web/
        └── nginx.conf             # Nginx configuration
```

## Example Multi-stage Dockerfile

```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Development stage
FROM node:18-alpine AS development
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]

# Production stage
FROM node:18-alpine AS production
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Copy built application
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --chown=nextjs:nodejs . .

USER nextjs

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

CMD ["npm", "start"]
```

## Docker Compose Example

```yaml
version: '3.8'

services:
  api:
    build:
      context: .
      dockerfile: Dockerfile.dev
      target: development
    ports:
      - '4000:4000'
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://user:password@postgres:5432/myapp
    depends_on:
      - postgres
      - redis
    volumes:
      - .:/app
      - /app/node_modules

  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: myapp
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:alpine
    ports:
      - '6379:6379'

volumes:
  postgres_data:
```
