# Deployment Platform Integration

## Overview

Ready-to-deploy configurations for popular hosting platforms with optimized setups for frontend, backend, and database hosting.

## Priority

**HIGH** - Essential for production deployment

## Dependencies

- Docker containerization (recommended)
- Environment configuration management

## Components

### Frontend Deployment Platforms

- **Vercel**: Optimized for Next.js/React applications
- **Netlify**: Static site hosting with serverless functions
- **AWS S3 + CloudFront**: Scalable static hosting with CDN
- **Google Cloud Storage + CDN**: Google's static hosting solution

### Backend Deployment Platforms

- **Railway**: Recommended for GraphQL APIs and databases
- **Render**: Simple container and database hosting
- **AWS ECS/Fargate**: Container orchestration on AWS
- **Google Cloud Run**: Serverless container platform
- **Heroku**: Traditional PaaS (legacy support)

### Database Hosting Options

- **PlanetScale**: Serverless MySQL with branching
- **Neon**: Serverless PostgreSQL
- **Supabase**: PostgreSQL with real-time capabilities
- **AWS RDS**: Managed relational databases
- **Google Cloud SQL**: Managed database service

## Configuration

```typescript
interface DeploymentConfig {
  frontend: {
    platform: 'vercel' | 'netlify' | 'aws-s3' | 'gcs'
    customDomain: boolean
    cdn: boolean
    analytics: boolean
  }
  backend: {
    platform: 'railway' | 'render' | 'aws-ecs' | 'gcp-run' | 'heroku'
    containerized: boolean
    scaling: 'manual' | 'auto'
    regions: string[]
  }
  database: {
    provider: 'planetscale' | 'neon' | 'supabase' | 'aws-rds' | 'gcp-sql'
    backup: boolean
    replication: boolean
  }
}
```

## Generated Files

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
│   └── health-check.sh            # Health check script
└── .github/
    └── workflows/
        ├── deploy-frontend.yml    # Frontend deployment
        ├── deploy-backend.yml     # Backend deployment
        └── deploy-production.yml  # Full production deployment
```

## Platform-Specific Configurations

### Vercel Configuration

```json
{
  "version": 2,
  "builds": [
    {
      "src": "web/package.json",
      "use": "@vercel/next"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "https://your-api.railway.app/api/$1"
    }
  ],
  "env": {
    "NEXT_PUBLIC_API_URL": "@api_url",
    "NEXT_PUBLIC_APP_ENV": "production"
  },
  "functions": {
    "web/**/*.ts": {
      "includeFiles": "web/**"
    }
  }
}
```

### Railway Configuration

```toml
[build]
builder = "nixpacks"
buildCommand = "npm run build"

[deploy]
startCommand = "npm start"
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 10

[[services]]
name = "api"
source = "api"

[services.variables]
NODE_ENV = "production"
PORT = { default = 4000 }

[[services]]
name = "postgres"
source = "postgres:15"

[services.variables]
POSTGRES_DB = "myapp"
POSTGRES_USER = "user"
```

### GitHub Actions Deployment

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Build application
        run: npm run build

  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          working-directory: ./web
          vercel-args: '--prod'

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3

      - name: Deploy to Railway
        uses: railway-app/railway-action@v1
        with:
          api-token: ${{ secrets.RAILWAY_TOKEN }}
          service: api
```

## Deployment Scripts

### Build Script

```bash
#!/bin/bash
# scripts/build.sh

set -e

echo "🏗️ Building application for production..."

# Build frontend
echo "📦 Building frontend..."
cd web
npm run build
cd ..

# Build backend
echo "🔧 Building backend..."
cd api
npm run build
cd ..

# Build shared packages
echo "📚 Building shared packages..."
if [ -d "shared" ]; then
  cd shared
  npm run build
  cd ..
fi

echo "✅ Build completed successfully!"
```

### Deployment Script

```bash
#!/bin/bash
# scripts/deploy.sh

set -e

ENVIRONMENT=${1:-production}

echo "🚀 Deploying to $ENVIRONMENT..."

# Run pre-deployment checks
echo "🔍 Running pre-deployment checks..."
npm run test
npm run type-check
npm run lint

# Build application
echo "🏗️ Building application..."
npm run build

# Deploy based on environment
case $ENVIRONMENT in
  "production")
    echo "📤 Deploying to production..."
    # Deploy frontend to Vercel
    cd web && npx vercel --prod && cd ..
    # Deploy backend to Railway
    cd api && railway up && cd ..
    ;;
  "staging")
    echo "📤 Deploying to staging..."
    cd web && npx vercel && cd ..
    cd api && railway up --service staging && cd ..
    ;;
  *)
    echo "❌ Unknown environment: $ENVIRONMENT"
    exit 1
    ;;
esac

echo "✅ Deployment completed successfully!"
```

## Environment-Specific Configurations

### Production Environment

```typescript
// config/environments/production.ts
export default {
  NODE_ENV: 'production',
  LOG_LEVEL: 'info',
  DEBUG: false,

  // Performance optimizations
  ENABLE_COMPRESSION: true,
  CACHE_TTL: 3600,

  // Security settings
  SECURE_COOKIES: true,
  FORCE_HTTPS: true,

  // Monitoring
  SENTRY_ENABLED: true,
  ANALYTICS_ENABLED: true,
}
```

### Staging Environment

```typescript
// config/environments/staging.ts
export default {
  NODE_ENV: 'staging',
  LOG_LEVEL: 'debug',
  DEBUG: true,

  // Testing features
  ENABLE_TEST_DATA: true,
  MOCK_EXTERNAL_APIS: false,

  // Monitoring
  SENTRY_ENABLED: true,
  ANALYTICS_ENABLED: false,
}
```
