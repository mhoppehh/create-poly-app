# DevOps & Deployment

## Overview

Comprehensive deployment and operations setup that takes applications from development to production with proper containerization, environment management, monitoring, and automated deployment pipelines.

## Priority

**MEDIUM-HIGH** - Essential for production readiness and operational excellence

## Dependencies

- All existing features (for deployment)
- Optional dependencies based on chosen deployment strategy

## Feature Components

### 1. Docker Containerization

**Description**: Containerized deployment for consistent environments across development, staging, and production

#### Components:

- **Multi-stage Dockerfiles**: Optimized production builds
- **Docker Compose**: Local development environment
- **Container Registry**: Image storage and versioning
- **Health Checks**: Container health monitoring
- **Security Scanning**: Vulnerability scanning for container images

#### Configuration:

```typescript
interface DockerConfig {
  registry: 'docker-hub' | 'aws-ecr' | 'gcr' | 'github-packages'
  multiStage: boolean
  healthChecks: boolean
  security: {
    scanning: boolean
    nonRootUser: boolean
    secretsHandling: 'env' | 'docker-secrets' | 'external'
  }
}
```

### 2. Environment Configuration Management

**Description**: Robust environment variable and configuration management across environments

#### Components:

- **Environment Validation**: Runtime config validation
- **Secret Management**: Secure handling of sensitive data
- **Multi-Environment Support**: Dev/staging/production configs
- **Configuration Hot-Reloading**: Runtime config updates
- **Environment Detection**: Automatic environment detection

#### Configuration:

```typescript
interface EnvironmentConfig {
  environments: ('development' | 'staging' | 'production')[]
  validation: {
    schema: 'zod' | 'joi' | 'yup'
    strictMode: boolean
  }
  secrets: {
    provider: 'env' | 'vault' | 'aws-secrets' | 'k8s-secrets'
    encryption: boolean
  }
}
```

### 3. Deployment Platform Integration

**Description**: Ready-to-deploy configurations for popular hosting platforms

#### Supported Platforms:

- **Frontend Deployment**:
  - Vercel (recommended for Next.js/React)
  - Netlify (static sites and functions)
  - AWS S3 + CloudFront
  - Google Cloud Storage + CDN
- **Backend Deployment**:
  - Railway (recommended for APIs)
  - Render (full-stack applications)
  - AWS ECS/Fargate
  - Google Cloud Run
  - Heroku (legacy support)
- **Database Hosting**:
  - PlanetScale (MySQL)
  - Supabase (PostgreSQL)
  - Railway Database
  - AWS RDS/Aurora
  - Google Cloud SQL

#### Configuration:

```typescript
interface DeploymentConfig {
  frontend: {
    platform: 'vercel' | 'netlify' | 'aws-s3' | 'gcs'
    customDomain: boolean
    cdn: boolean
  }
  backend: {
    platform: 'railway' | 'render' | 'aws-ecs' | 'cloud-run'
    scaling: {
      enabled: boolean
      minInstances: number
      maxInstances: number
    }
  }
  database: {
    platform: 'planetscale' | 'supabase' | 'railway' | 'aws-rds'
    backups: boolean
    replication: boolean
  }
}
```

### 4. Database Migration & Management

**Description**: Production-safe database operations and migration management

#### Components:

- **Migration Scripts**: Versioned database migrations
- **Rollback Strategies**: Safe rollback procedures
- **Seed Data Management**: Environment-specific seed data
- **Backup Automation**: Automated database backups
- **Migration Validation**: Pre-deployment migration testing

#### Configuration:

```typescript
interface MigrationConfig {
  strategy: 'prisma' | 'knex' | 'typeorm' | 'sql-files'
  validation: {
    dryRun: boolean
    backupBeforeMigrate: boolean
  }
  rollback: {
    enabled: boolean
    maxRollbackSteps: number
  }
}
```

### 5. Monitoring & Observability

**Description**: Application monitoring, error tracking, and performance insights

#### Components:

- **Error Tracking**: Sentry integration for error monitoring
- **Performance Monitoring**: Application performance metrics
- **Uptime Monitoring**: Health check and uptime tracking
- **Log Aggregation**: Centralized logging solution
- **Analytics**: User behavior and usage analytics

#### Configuration:

```typescript
interface MonitoringConfig {
  errorTracking: {
    provider: 'sentry' | 'bugsnag' | 'rollbar'
    enabled: boolean
  }
  performance: {
    enabled: boolean
    sampleRate: number
  }
  uptime: {
    provider: 'uptimerobot' | 'pingdom' | 'custom'
    intervals: number[]
  }
  analytics: {
    provider: 'google-analytics' | 'mixpanel' | 'amplitude'
    enabled: boolean
  }
}
```

### 6. Health Checks & Status Pages

**Description**: Application health monitoring and public status communication

#### Components:

- **API Health Endpoints**: Database and service health checks
- **Frontend Health Checks**: Client-side health validation
- **Status Page**: Public status communication
- **Alert System**: Automated incident notifications
- **Dependency Monitoring**: External service dependency tracking

## Generated Files

### Docker Configuration

```
├── Dockerfile                     # Multi-stage production Dockerfile
├── Dockerfile.dev                 # Development Dockerfile
├── docker-compose.yml             # Local development setup
├── docker-compose.prod.yml        # Production-like local setup
├── .dockerignore                  # Docker ignore patterns
└── docker/
    ├── api/
    │   └── Dockerfile              # API-specific Dockerfile
    ├── web/
    │   └── Dockerfile              # Frontend-specific Dockerfile
    └── nginx/
        ├── Dockerfile              # Nginx proxy Dockerfile
        └── nginx.conf              # Nginx configuration
```

### Environment Configuration

```
├── config/
│   ├── index.ts                   # Configuration loader
│   ├── schema.ts                  # Configuration validation schema
│   ├── environments/
│   │   ├── development.ts         # Development config
│   │   ├── staging.ts             # Staging config
│   │   ├── production.ts          # Production config
│   │   └── test.ts                # Test config
│   └── secrets/
│       ├── secretManager.ts       # Secret management
│       └── encryption.ts          # Secret encryption
├── .env.example                   # Environment template
├── .env.local                     # Local development vars
└── scripts/
    ├── validate-env.ts            # Environment validation
    └── setup-secrets.ts           # Secret setup script
```

### Deployment Scripts

```
├── deploy/
│   ├── vercel.json                # Vercel configuration
│   ├── netlify.toml               # Netlify configuration
│   ├── railway.toml               # Railway configuration
│   ├── render.yaml                # Render configuration
│   └── aws/
│       ├── cloudformation.yml     # AWS CloudFormation
│       ├── ecs-task-definition.json
│       └── deploy-script.sh
├── scripts/
│   ├── build.sh                   # Build script
│   ├── deploy.sh                  # Deployment script
│   ├── health-check.sh            # Health check script
│   └── backup.sh                  # Backup script
└── .github/
    └── workflows/
        ├── deploy-staging.yml     # Staging deployment
        ├── deploy-production.yml  # Production deployment
        └── health-check.yml       # Health monitoring
```

### Monitoring Setup

```
├── monitoring/
│   ├── sentry.ts                  # Sentry configuration
│   ├── health/
│   │   ├── apiHealth.ts           # API health checks
│   │   ├── dbHealth.ts            # Database health
│   │   └── serviceHealth.ts       # Service health
│   ├── metrics/
│   │   ├── performance.ts         # Performance tracking
│   │   └── analytics.ts           # Usage analytics
│   └── status/
│       ├── statusPage.ts          # Status page logic
│       └── alerts.ts              # Alert configuration
└── scripts/
    ├── setup-monitoring.sh        # Monitoring setup
    └── test-alerts.sh             # Alert testing
```

## Configuration Files

### Multi-stage Dockerfile Example

```dockerfile
# Dockerfile
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

### Docker Compose for Development

```yaml
# docker-compose.yml
version: '3.8'

services:
  api:
    build:
      context: ./api
      target: development
    ports:
      - '4000:4000'
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://postgres:password@db:5432/myapp_dev
    volumes:
      - ./api:/app
      - /app/node_modules
    depends_on:
      - db
      - redis

  web:
    build:
      context: ./web
      target: development
    ports:
      - '3000:3000'
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:4000/graphql
    volumes:
      - ./web:/app
      - /app/node_modules

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=myapp_dev
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'

volumes:
  postgres_data:
```

### GitHub Actions Deployment Workflow

```yaml
# .github/workflows/deploy-production.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      - run: npm ci
      - run: npm run test
      - run: npm run build

  deploy-api:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Railway
        uses: railwayapp/railway-deploy@v1.0.2
        with:
          railway_token: ${{ secrets.RAILWAY_TOKEN }}
          service: api

  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'

  health-check:
    needs: [deploy-api, deploy-frontend]
    runs-on: ubuntu-latest
    steps:
      - name: Health Check
        run: |
          curl -f https://your-api.railway.app/health || exit 1
          curl -f https://your-app.vercel.app/api/health || exit 1
```

### Environment Configuration Schema

```typescript
// config/schema.ts
import { z } from 'zod'

export const configSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production', 'test']),
  PORT: z.string().transform(Number).pipe(z.number().min(1000).max(65535)),

  // Database
  DATABASE_URL: z.string().url(),

  // Authentication
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('1h'),

  // External Services
  SENTRY_DSN: z.string().url().optional(),
  REDIS_URL: z.string().url().optional(),

  // Email
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().transform(Number).pipe(z.number()).optional(),

  // File Upload
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_S3_BUCKET: z.string().optional(),
})

export type Config = z.infer<typeof configSchema>
```

### Health Check Implementation

```typescript
// api/src/health/index.ts
import { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { Redis } from 'ioredis'

interface HealthCheck {
  name: string
  status: 'healthy' | 'unhealthy'
  latency?: number
  error?: string
}

export async function healthCheck(req: Request, res: Response) {
  const checks: HealthCheck[] = []

  // Database check
  const dbStart = Date.now()
  try {
    await prisma.$queryRaw`SELECT 1`
    checks.push({
      name: 'database',
      status: 'healthy',
      latency: Date.now() - dbStart,
    })
  } catch (error) {
    checks.push({
      name: 'database',
      status: 'unhealthy',
      error: error.message,
    })
  }

  // Redis check (if enabled)
  if (process.env.REDIS_URL) {
    const redisStart = Date.now()
    try {
      await redis.ping()
      checks.push({
        name: 'redis',
        status: 'healthy',
        latency: Date.now() - redisStart,
      })
    } catch (error) {
      checks.push({
        name: 'redis',
        status: 'unhealthy',
        error: error.message,
      })
    }
  }

  const isHealthy = checks.every(check => check.status === 'healthy')

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    checks,
  })
}
```

## Environment Variables Required

```env
# Deployment
NODE_ENV=production
PORT=4000

# Database
DATABASE_URL=postgresql://user:pass@host:5432/db

# Authentication
JWT_SECRET=your-super-secure-jwt-secret-at-least-32-characters
JWT_EXPIRES_IN=24h

# Monitoring
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id

# External Services
REDIS_URL=redis://localhost:6379
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key

# File Storage
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_S3_BUCKET=your-s3-bucket
```

## Installation Scripts

1. **Generate Docker configuration files**
2. **Setup environment configuration and validation**
3. **Create deployment platform configurations**
4. **Setup health check endpoints**
5. **Configure monitoring and error tracking**
6. **Generate deployment scripts and workflows**
7. **Create database migration scripts**
8. **Setup backup and recovery procedures**

## Package Dependencies

```json
{
  "devDependencies": {
    "@sentry/node": "^7.91.0",
    "@sentry/tracing": "^7.91.0",
    "zod": "^3.22.4"
  },
  "scripts": {
    "build": "tsc && npm run build:web",
    "build:web": "cd web && npm run build",
    "docker:build": "docker build -t myapp .",
    "docker:run": "docker run -p 3000:3000 myapp",
    "docker:dev": "docker-compose up",
    "health-check": "node scripts/health-check.js",
    "deploy:staging": "scripts/deploy.sh staging",
    "deploy:production": "scripts/deploy.sh production"
  }
}
```

## Usage Examples

### Environment Configuration Usage

```typescript
// Load and validate configuration
import { configSchema } from './config/schema'

const config = configSchema.parse(process.env)

// Use configuration throughout the app
export { config }
```

### Health Check Usage

```typescript
// Add health check route
app.get('/health', healthCheck)
app.get('/health/ready', readinessCheck)
app.get('/health/live', livenessCheck)
```

### Docker Development Workflow

```bash
# Start development environment
npm run docker:dev

# Build production image
npm run docker:build

# Run production container
npm run docker:run
```

### Deployment Commands

```bash
# Deploy to staging
npm run deploy:staging

# Deploy to production
npm run deploy:production

# Check application health
npm run health-check
```
