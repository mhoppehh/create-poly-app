# Health Checks & Status Pages

## Overview

Application health monitoring and public status communication with automated health checks, status pages, and incident management.

## Priority

**MEDIUM-HIGH** - Important for operational transparency and monitoring

## Dependencies

- Basic application deployment
- Monitoring & observability (recommended)

## Components

### API Health Endpoints

- **Application Health**: Overall application status and readiness
- **Database Health**: Connection and query performance validation
- **Service Dependencies**: External service availability checks
- **Resource Monitoring**: System resource usage and limits
- **Custom Health Checks**: Business-logic specific health validations

### Frontend Health Checks

- **Client-side Validation**: Browser compatibility and feature detection
- **API Connectivity**: Frontend to backend connection testing
- **Asset Loading**: Critical resource availability verification
- **Performance Metrics**: Core Web Vitals and loading performance
- **Error Boundary Status**: React error boundary health

### Status Page

- **Public Status Communication**: Real-time system status display
- **Historical Uptime**: Service availability history and trends
- **Incident Communication**: Automated incident notifications
- **Maintenance Scheduling**: Planned maintenance announcements
- **Service Level Indicators**: SLA compliance and performance metrics

### Alert System

- **Automated Incident Detection**: Threshold-based alerting
- **Escalation Procedures**: Multi-level alert escalation
- **Notification Channels**: Email, Slack, SMS, webhook alerts
- **Alert Fatigue Prevention**: Intelligent alert grouping and suppression
- **Recovery Notifications**: Automatic all-clear notifications

### Dependency Monitoring

- **Third-party Service Status**: External API and service monitoring
- **Database Performance**: Connection pool and query performance
- **CDN and Asset Delivery**: Static asset availability monitoring
- **Payment Gateway**: Critical payment service monitoring
- **Authentication Services**: OAuth and identity provider monitoring

## Configuration

```typescript
interface HealthCheckConfig {
  endpoints: {
    enabled: boolean
    path: string
    authentication: boolean
  }
  checks: {
    database: boolean
    redis: boolean
    externalServices: string[]
    customChecks: string[]
  }
  alerts: {
    channels: ('email' | 'slack' | 'webhook' | 'sms')[]
    thresholds: {
      responseTime: number
      errorRate: number
      uptime: number
    }
  }
  statusPage: {
    enabled: boolean
    domain: string
    incidents: boolean
    maintenance: boolean
  }
}
```

## Generated Files

```
├── health/
│   ├── index.ts                   # Health check orchestrator
│   ├── checks/
│   │   ├── api.ts                 # API health checks
│   │   ├── database.ts            # Database health validation
│   │   ├── redis.ts               # Redis connectivity check
│   │   ├── external.ts            # External service checks
│   │   └── custom.ts              # Custom business logic checks
│   ├── endpoints/
│   │   ├── health.ts              # Main health endpoint
│   │   ├── ready.ts               # Readiness probe
│   │   ├── live.ts                # Liveness probe
│   │   └── metrics.ts             # Health metrics endpoint
│   └── middleware/
│       ├── auth.ts                # Health endpoint authentication
│       └── cache.ts               # Health check caching
├── status/
│   ├── components/
│   │   ├── StatusPage.tsx         # Main status page
│   │   ├── ServiceStatus.tsx      # Individual service status
│   │   ├── IncidentHistory.tsx    # Incident timeline
│   │   └── UptimeChart.tsx        # Uptime visualization
│   ├── api/
│   │   ├── status.ts              # Status API endpoints
│   │   ├── incidents.ts           # Incident management
│   │   └── metrics.ts             # Status metrics
│   └── data/
│       ├── statusStore.ts         # Status data management
│       └── incidentStore.ts       # Incident data management
├── alerts/
│   ├── manager.ts                 # Alert management
│   ├── channels/
│   │   ├── email.ts               # Email notifications
│   │   ├── slack.ts               # Slack integration
│   │   ├── webhook.ts             # Webhook notifications
│   │   └── sms.ts                 # SMS alerts
│   └── rules/
│       ├── thresholds.ts          # Alert threshold rules
│       └── escalation.ts          # Escalation procedures
└── scripts/
    ├── health-monitor.ts          # Continuous health monitoring
    └── status-updater.ts          # Status page updater
```

## Health Check Implementation

```typescript
// health/index.ts
import { Request, Response } from 'express'
import { checkDatabase } from './checks/database'
import { checkRedis } from './checks/redis'
import { checkExternalServices } from './checks/external'
import { checkCustomHealthChecks } from './checks/custom'

export interface HealthCheckResult {
  name: string
  status: 'healthy' | 'unhealthy' | 'degraded'
  responseTime: number
  timestamp: string
  details?: any
  error?: string
}

export interface OverallHealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded'
  timestamp: string
  uptime: number
  version: string
  checks: HealthCheckResult[]
  responseTime: number
}

export async function performHealthCheck(detailed = false): Promise<OverallHealthStatus> {
  const startTime = Date.now()
  const checks: HealthCheckResult[] = []

  try {
    // Core infrastructure checks
    const dbCheck = await checkDatabase()
    checks.push(dbCheck)

    const redisCheck = await checkRedis()
    checks.push(redisCheck)

    // External service checks (if detailed)
    if (detailed) {
      const externalChecks = await checkExternalServices()
      checks.push(...externalChecks)

      const customChecks = await checkCustomHealthChecks()
      checks.push(...customChecks)
    }

    // Determine overall status
    const hasUnhealthy = checks.some(check => check.status === 'unhealthy')
    const hasDegraded = checks.some(check => check.status === 'degraded')

    const overallStatus = hasUnhealthy ? 'unhealthy' : hasDegraded ? 'degraded' : 'healthy'

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.APP_VERSION || 'unknown',
      checks,
      responseTime: Date.now() - startTime,
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.APP_VERSION || 'unknown',
      checks: [
        {
          name: 'system',
          status: 'unhealthy',
          responseTime: Date.now() - startTime,
          timestamp: new Date().toISOString(),
          error: error.message,
        },
      ],
      responseTime: Date.now() - startTime,
    }
  }
}

// Express middleware for health endpoints
export function createHealthEndpoints() {
  return {
    // Basic health check
    health: async (req: Request, res: Response) => {
      const health = await performHealthCheck(false)
      const statusCode = health.status === 'healthy' ? 200 : 503
      res.status(statusCode).json(health)
    },

    // Detailed health check
    healthDetailed: async (req: Request, res: Response) => {
      const health = await performHealthCheck(true)
      const statusCode = health.status === 'healthy' ? 200 : 503
      res.status(statusCode).json(health)
    },

    // Kubernetes readiness probe
    ready: async (req: Request, res: Response) => {
      const health = await performHealthCheck(false)
      if (health.status === 'healthy') {
        res.status(200).json({ status: 'ready' })
      } else {
        res.status(503).json({ status: 'not ready', checks: health.checks })
      }
    },

    // Kubernetes liveness probe
    live: async (req: Request, res: Response) => {
      // Simple liveness check - just verify the process is running
      res.status(200).json({
        status: 'alive',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      })
    },
  }
}
```

## Database Health Check

```typescript
// health/checks/database.ts
import { PrismaClient } from '@prisma/client'
import { HealthCheckResult } from '../index'

const prisma = new PrismaClient()

export async function checkDatabase(): Promise<HealthCheckResult> {
  const startTime = Date.now()
  const checkName = 'database'

  try {
    // Test basic connectivity
    await prisma.$connect()

    // Test query performance
    const queryStart = Date.now()
    await prisma.$queryRaw`SELECT 1 as health_check`
    const queryTime = Date.now() - queryStart

    // Check connection pool status
    const connectionInfo = await prisma.$queryRaw`
      SELECT 
        count(*) as total_connections,
        count(*) FILTER (WHERE state = 'active') as active_connections,
        count(*) FILTER (WHERE state = 'idle') as idle_connections
      FROM pg_stat_activity 
      WHERE datname = current_database()
    `

    await prisma.$disconnect()

    const responseTime = Date.now() - startTime
    const status = queryTime > 1000 ? 'degraded' : 'healthy'

    return {
      name: checkName,
      status,
      responseTime,
      timestamp: new Date().toISOString(),
      details: {
        queryTime,
        connectionInfo,
      },
    }
  } catch (error) {
    await prisma.$disconnect()

    return {
      name: checkName,
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      timestamp: new Date().toISOString(),
      error: error.message,
    }
  }
}
```

## Status Page Component

```typescript
// status/components/StatusPage.tsx
import React, { useEffect, useState } from 'react'
import { ServiceStatus } from './ServiceStatus'
import { IncidentHistory } from './IncidentHistory'
import { UptimeChart } from './UptimeChart'

interface Service {
  name: string
  status: 'operational' | 'degraded' | 'outage'
  uptime: number
  responseTime: number
}

interface Incident {
  id: string
  title: string
  status: 'investigating' | 'identified' | 'monitoring' | 'resolved'
  severity: 'minor' | 'major' | 'critical'
  createdAt: string
  updatedAt: string
  updates: Array<{
    timestamp: string
    status: string
    message: string
  }>
}

export function StatusPage() {
  const [services, setServices] = useState<Service[]>([])
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStatusData() {
      try {
        const [servicesRes, incidentsRes] = await Promise.all([
          fetch('/api/status/services'),
          fetch('/api/status/incidents')
        ])

        const servicesData = await servicesRes.json()
        const incidentsData = await incidentsRes.json()

        setServices(servicesData)
        setIncidents(incidentsData)
      } catch (error) {
        console.error('Failed to fetch status data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStatusData()

    // Update every 30 seconds
    const interval = setInterval(fetchStatusData, 30000)
    return () => clearInterval(interval)
  }, [])

  const overallStatus = services.length > 0
    ? services.every(s => s.status === 'operational')
      ? 'operational'
      : services.some(s => s.status === 'outage')
        ? 'outage'
        : 'degraded'
    : 'unknown'

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            System Status
          </h1>
          <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
            overallStatus === 'operational'
              ? 'bg-green-100 text-green-800'
              : overallStatus === 'degraded'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-red-100 text-red-800'
          }`}>
            <div className={`w-2 h-2 rounded-full mr-2 ${
              overallStatus === 'operational' ? 'bg-green-400' :
              overallStatus === 'degraded' ? 'bg-yellow-400' : 'bg-red-400'
            }`}></div>
            {overallStatus === 'operational' ? 'All Systems Operational' :
             overallStatus === 'degraded' ? 'Some Systems Degraded' :
             'System Outage'}
          </div>
        </div>

        {/* Active Incidents */}
        {incidents.filter(i => i.status !== 'resolved').length > 0 && (
          <div className="mb-8 bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Active Incidents
              </h2>
            </div>
            <div className="divide-y divide-gray-200">
              {incidents
                .filter(incident => incident.status !== 'resolved')
                .map(incident => (
                  <div key={incident.id} className="px-6 py-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          {incident.title}
                        </h3>
                        <div className="flex items-center mt-1">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            incident.severity === 'critical' ? 'bg-red-100 text-red-800' :
                            incident.severity === 'major' ? 'bg-orange-100 text-orange-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {incident.severity}
                          </span>
                          <span className="ml-2 text-sm text-gray-500">
                            {incident.status}
                          </span>
                        </div>
                      </div>
                      <time className="text-sm text-gray-500">
                        {new Date(incident.updatedAt).toLocaleString()}
                      </time>
                    </div>
                    {incident.updates.length > 0 && (
                      <div className="mt-3 text-sm text-gray-600">
                        {incident.updates[0].message}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Services Status */}
        <div className="grid gap-4 mb-8">
          {services.map(service => (
            <ServiceStatus key={service.name} service={service} />
          ))}
        </div>

        {/* Uptime Chart */}
        <UptimeChart services={services} />

        {/* Incident History */}
        <IncidentHistory incidents={incidents} />
      </div>
    </div>
  )
}
```

## Alert Manager

```typescript
// alerts/manager.ts
import { HealthCheckResult } from '../health'
import { EmailNotifier } from './channels/email'
import { SlackNotifier } from './channels/slack'

interface AlertRule {
  name: string
  condition: (result: HealthCheckResult) => boolean
  severity: 'low' | 'medium' | 'high' | 'critical'
  channels: string[]
  cooldown: number // seconds
}

export class AlertManager {
  private rules: AlertRule[] = []
  private lastAlerts = new Map<string, number>()
  private notifiers = new Map<string, any>()

  constructor() {
    this.setupNotifiers()
    this.setupDefaultRules()
  }

  private setupNotifiers() {
    this.notifiers.set('email', new EmailNotifier())
    this.notifiers.set('slack', new SlackNotifier())
  }

  private setupDefaultRules() {
    this.rules = [
      {
        name: 'Service Unhealthy',
        condition: result => result.status === 'unhealthy',
        severity: 'critical',
        channels: ['email', 'slack'],
        cooldown: 300, // 5 minutes
      },
      {
        name: 'Service Degraded',
        condition: result => result.status === 'degraded',
        severity: 'medium',
        channels: ['slack'],
        cooldown: 600, // 10 minutes
      },
      {
        name: 'Slow Response',
        condition: result => result.responseTime > 5000,
        severity: 'medium',
        channels: ['slack'],
        cooldown: 900, // 15 minutes
      },
    ]
  }

  async processHealthCheck(results: HealthCheckResult[]) {
    for (const result of results) {
      await this.evaluateRules(result)
    }
  }

  private async evaluateRules(result: HealthCheckResult) {
    for (const rule of this.rules) {
      if (rule.condition(result)) {
        await this.triggerAlert(rule, result)
      }
    }
  }

  private async triggerAlert(rule: AlertRule, result: HealthCheckResult) {
    const alertKey = `${rule.name}-${result.name}`
    const now = Date.now()
    const lastAlert = this.lastAlerts.get(alertKey) || 0

    // Check cooldown period
    if (now - lastAlert < rule.cooldown * 1000) {
      return // Still in cooldown
    }

    this.lastAlerts.set(alertKey, now)

    const alert = {
      rule: rule.name,
      service: result.name,
      severity: rule.severity,
      status: result.status,
      responseTime: result.responseTime,
      error: result.error,
      timestamp: result.timestamp,
    }

    // Send notifications
    for (const channel of rule.channels) {
      const notifier = this.notifiers.get(channel)
      if (notifier) {
        try {
          await notifier.sendAlert(alert)
        } catch (error) {
          console.error(`Failed to send alert to ${channel}:`, error)
        }
      }
    }
  }

  addRule(rule: AlertRule) {
    this.rules.push(rule)
  }

  removeRule(name: string) {
    this.rules = this.rules.filter(rule => rule.name !== name)
  }
}
```
