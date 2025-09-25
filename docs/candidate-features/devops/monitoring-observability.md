# Monitoring & Observability

## Overview

Application monitoring, error tracking, and performance insights to ensure application health and optimal user experience in production.

## Priority

**HIGH** - Essential for production operations

## Dependencies

- Application deployment
- External monitoring services (optional)

## Components

### Error Tracking

- **Sentry Integration**: Comprehensive error monitoring and alerting
- **Error Aggregation**: Group similar errors and track frequency
- **Stack Trace Analysis**: Detailed error context and debugging info
- **Performance Error Tracking**: Slow queries and performance issues
- **User Impact Assessment**: Error impact on user experience

### Performance Monitoring

- **Application Performance Metrics**: Response times, throughput
- **Database Performance**: Query performance and connection health
- **Frontend Performance**: Core Web Vitals and user experience metrics
- **API Endpoint Monitoring**: Individual endpoint performance tracking
- **Resource Usage**: CPU, memory, and disk utilization

### Uptime Monitoring

- **Health Check Endpoints**: Application and service availability
- **External Uptime Monitoring**: Third-party uptime verification
- **Multi-region Monitoring**: Global availability testing
- **SSL Certificate Monitoring**: Certificate expiration tracking
- **DNS Monitoring**: Domain resolution health

### Log Aggregation

- **Centralized Logging**: Structured log collection and storage
- **Log Parsing**: Automatic log parsing and categorization
- **Log Search**: Full-text search across application logs
- **Log Retention**: Configurable log retention policies
- **Real-time Log Streaming**: Live log monitoring

### Analytics Integration

- **User Behavior Analytics**: User interaction tracking
- **Business Metrics**: KPI tracking and reporting
- **Custom Event Tracking**: Application-specific analytics
- **Funnel Analysis**: User journey and conversion tracking
- **A/B Testing**: Feature flag and experiment tracking

## Configuration

```typescript
interface MonitoringConfig {
  errorTracking: {
    provider: 'sentry' | 'bugsnag' | 'rollbar'
    enabled: boolean
    environment: string
    sampleRate: number
  }
  performance: {
    apm: 'sentry' | 'datadog' | 'newrelic'
    metricsInterval: number
    alertThresholds: {
      responseTime: number
      errorRate: number
      cpuUsage: number
    }
  }
  uptime: {
    provider: 'pingdom' | 'uptimerobot' | 'statuspage'
    checkInterval: number
    regions: string[]
  }
  logging: {
    level: 'error' | 'warn' | 'info' | 'debug'
    structured: boolean
    retention: number
    aggregation: 'elasticsearch' | 'cloudwatch' | 'datadog'
  }
}
```

## Generated Files

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
│   ├── logging/
│   │   ├── logger.ts              # Structured logging
│   │   ├── loggerMiddleware.ts    # Express logging middleware
│   │   └── logParser.ts           # Log parsing utilities
│   └── alerts/
│       ├── alertManager.ts        # Alert configuration
│       └── notifications.ts       # Alert notifications
├── scripts/
│   ├── setup-monitoring.sh        # Monitoring setup
│   └── test-alerts.sh             # Alert testing
└── dashboards/
    ├── grafana/                   # Grafana dashboards
    └── datadog/                   # Datadog dashboards
```

## Sentry Configuration

```typescript
// monitoring/sentry.ts
import * as Sentry from '@sentry/node'
import * as Tracing from '@sentry/tracing'
import { Express } from 'express'

export function initializeSentry(app: Express) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.Express({ app }),
      new Tracing.Integrations.Postgres(),
      new Tracing.Integrations.GraphQL(),
    ],
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    profilesSampleRate: 1.0,
    beforeSend(event) {
      // Filter out sensitive information
      if (event.request) {
        delete event.request.cookies
        if (event.request.headers) {
          delete event.request.headers.authorization
        }
      }
      return event
    },
  })

  // Request handler must be the first middleware
  app.use(Sentry.Handlers.requestHandler())
  app.use(Sentry.Handlers.tracingHandler())

  return {
    errorHandler: Sentry.Handlers.errorHandler(),
    captureException: Sentry.captureException,
    captureMessage: Sentry.captureMessage,
    addBreadcrumb: Sentry.addBreadcrumb,
  }
}

export function captureUserFeedback(userId: string, email: string, feedback: string) {
  Sentry.captureUserFeedback({
    event_id: Sentry.lastEventId(),
    name: userId,
    email,
    comments: feedback,
  })
}
```

## Health Check Implementation

```typescript
// monitoring/health/index.ts
import { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { Redis } from 'ioredis'

interface HealthCheck {
  name: string
  status: 'healthy' | 'unhealthy' | 'degraded'
  responseTime: number
  error?: string
}

export async function healthCheck(req: Request, res: Response) {
  const checks: HealthCheck[] = []
  const startTime = Date.now()

  try {
    // Database health check
    const dbCheck = await checkDatabase()
    checks.push(dbCheck)

    // Redis health check
    const redisCheck = await checkRedis()
    checks.push(redisCheck)

    // External services health check
    const externalChecks = await checkExternalServices()
    checks.push(...externalChecks)

    const overallStatus = checks.every(check => check.status === 'healthy')
      ? 'healthy'
      : checks.some(check => check.status === 'unhealthy')
        ? 'unhealthy'
        : 'degraded'

    const response = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      responseTime: Date.now() - startTime,
      checks,
      version: process.env.APP_VERSION || 'unknown',
    }

    const statusCode = overallStatus === 'healthy' ? 200 : 503
    res.status(statusCode).json(response)
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
    })
  }
}

async function checkDatabase(): Promise<HealthCheck> {
  const startTime = Date.now()
  try {
    const prisma = new PrismaClient()
    await prisma.$queryRaw`SELECT 1`
    await prisma.$disconnect()

    return {
      name: 'database',
      status: 'healthy',
      responseTime: Date.now() - startTime,
    }
  } catch (error) {
    return {
      name: 'database',
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      error: error.message,
    }
  }
}

async function checkRedis(): Promise<HealthCheck> {
  const startTime = Date.now()
  try {
    const redis = new Redis(process.env.REDIS_URL)
    await redis.ping()
    redis.disconnect()

    return {
      name: 'redis',
      status: 'healthy',
      responseTime: Date.now() - startTime,
    }
  } catch (error) {
    return {
      name: 'redis',
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      error: error.message,
    }
  }
}

async function checkExternalServices(): Promise<HealthCheck[]> {
  const services = [
    { name: 'payment-gateway', url: process.env.STRIPE_API_URL },
    { name: 'email-service', url: process.env.SENDGRID_API_URL },
  ].filter(service => service.url)

  return Promise.all(
    services.map(async service => {
      const startTime = Date.now()
      try {
        const response = await fetch(`${service.url}/health`, {
          method: 'HEAD',
          timeout: 5000,
        })

        return {
          name: service.name,
          status: response.ok ? 'healthy' : 'degraded',
          responseTime: Date.now() - startTime,
        }
      } catch (error) {
        return {
          name: service.name,
          status: 'unhealthy',
          responseTime: Date.now() - startTime,
          error: error.message,
        }
      }
    }),
  )
}
```

## Performance Monitoring

```typescript
// monitoring/metrics/performance.ts
import { Request, Response, NextFunction } from 'express'
import * as Sentry from '@sentry/node'

interface PerformanceMetric {
  endpoint: string
  method: string
  responseTime: number
  statusCode: number
  timestamp: Date
  userAgent?: string
  userId?: string
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private readonly maxMetrics = 10000

  middleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const startTime = Date.now()

      // Override res.end to capture response time
      const originalEnd = res.end
      res.end = function (...args: any[]) {
        const responseTime = Date.now() - startTime

        const metric: PerformanceMetric = {
          endpoint: req.path,
          method: req.method,
          responseTime,
          statusCode: res.statusCode,
          timestamp: new Date(),
          userAgent: req.headers['user-agent'],
          userId: (req as any).user?.id,
        }

        // Add to metrics collection
        performanceMonitor.addMetric(metric)

        // Send to Sentry for performance tracking
        Sentry.addBreadcrumb({
          category: 'http',
          data: {
            url: req.url,
            method: req.method,
            status_code: res.statusCode,
            response_time: responseTime,
          },
          level: 'info',
        })

        // Alert on slow responses
        if (responseTime > 5000) {
          Sentry.captureMessage(`Slow response: ${req.method} ${req.path}`, 'warning')
        }

        return originalEnd.apply(this, args)
      }

      next()
    }
  }

  addMetric(metric: PerformanceMetric) {
    this.metrics.push(metric)

    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics)
    }
  }

  getAverageResponseTime(endpoint?: string, timeWindow = 3600000): number {
    const cutoff = new Date(Date.now() - timeWindow)
    const filteredMetrics = this.metrics.filter(metric => {
      const matchesEndpoint = !endpoint || metric.endpoint === endpoint
      const withinTimeWindow = metric.timestamp >= cutoff
      return matchesEndpoint && withinTimeWindow
    })

    if (filteredMetrics.length === 0) return 0

    const totalTime = filteredMetrics.reduce((sum, metric) => sum + metric.responseTime, 0)
    return totalTime / filteredMetrics.length
  }

  getErrorRate(endpoint?: string, timeWindow = 3600000): number {
    const cutoff = new Date(Date.now() - timeWindow)
    const filteredMetrics = this.metrics.filter(metric => {
      const matchesEndpoint = !endpoint || metric.endpoint === endpoint
      const withinTimeWindow = metric.timestamp >= cutoff
      return matchesEndpoint && withinTimeWindow
    })

    if (filteredMetrics.length === 0) return 0

    const errorCount = filteredMetrics.filter(metric => metric.statusCode >= 400).length
    return (errorCount / filteredMetrics.length) * 100
  }

  getSlowestEndpoints(limit = 10, timeWindow = 3600000): Array<{ endpoint: string; avgResponseTime: number }> {
    const cutoff = new Date(Date.now() - timeWindow)
    const recentMetrics = this.metrics.filter(metric => metric.timestamp >= cutoff)

    const endpointStats = new Map<string, { total: number; count: number }>()

    recentMetrics.forEach(metric => {
      const key = `${metric.method} ${metric.endpoint}`
      const stats = endpointStats.get(key) || { total: 0, count: 0 }
      stats.total += metric.responseTime
      stats.count += 1
      endpointStats.set(key, stats)
    })

    return Array.from(endpointStats.entries())
      .map(([endpoint, stats]) => ({
        endpoint,
        avgResponseTime: stats.total / stats.count,
      }))
      .sort((a, b) => b.avgResponseTime - a.avgResponseTime)
      .slice(0, limit)
  }

  generateReport(): object {
    const oneHour = 3600000
    const twentyFourHours = 86400000

    return {
      timestamp: new Date().toISOString(),
      metrics: {
        totalRequests: this.metrics.length,
        averageResponseTime: {
          lastHour: this.getAverageResponseTime(undefined, oneHour),
          last24Hours: this.getAverageResponseTime(undefined, twentyFourHours),
        },
        errorRate: {
          lastHour: this.getErrorRate(undefined, oneHour),
          last24Hours: this.getErrorRate(undefined, twentyFourHours),
        },
        slowestEndpoints: this.getSlowestEndpoints(5, twentyFourHours),
      },
    }
  }
}

export const performanceMonitor = new PerformanceMonitor()
```

## Structured Logging

```typescript
// monitoring/logging/logger.ts
import winston from 'winston'
import { ElasticsearchTransport } from 'winston-elasticsearch'

const logLevel = process.env.LOG_LEVEL || 'info'
const nodeEnv = process.env.NODE_ENV || 'development'

const logger = winston.createLogger({
  level: logLevel,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      return JSON.stringify({
        '@timestamp': timestamp,
        level,
        message,
        service: 'api',
        environment: nodeEnv,
        version: process.env.APP_VERSION,
        ...meta,
      })
    }),
  ),
  defaultMeta: {
    service: 'api',
    environment: nodeEnv,
  },
  transports: [
    new winston.transports.Console({
      format:
        nodeEnv === 'development'
          ? winston.format.combine(winston.format.colorize(), winston.format.simple())
          : winston.format.json(),
    }),
  ],
})

// Add Elasticsearch transport for production
if (nodeEnv === 'production' && process.env.ELASTICSEARCH_URL) {
  logger.add(
    new ElasticsearchTransport({
      level: 'info',
      clientOpts: { node: process.env.ELASTICSEARCH_URL },
      index: 'application-logs',
    }),
  )
}

export default logger
```
