# Background Jobs

## Overview

Robust background job processing system with queue management, scheduling, retry logic, and monitoring for handling asynchronous tasks in production applications.

## Priority

**HIGH** - Essential for scalable applications requiring background processing

## Dependencies

- `apollo-server` (for job management GraphQL resolvers)
- `prisma` (for job persistence and tracking)

## Feature Description

Complete background job infrastructure supporting multiple job types, scheduling, parallel processing, failure handling, and real-time monitoring with Redis/database backend.

### Key Features

- **Queue Management**: Multiple named queues with priority support
- **Job Scheduling**: Delayed jobs, recurring jobs, cron-like scheduling
- **Retry Logic**: Exponential backoff, max attempts, dead letter queue
- **Parallel Processing**: Concurrent job processing with worker management
- **Job Monitoring**: Real-time status, progress tracking, job history
- **Error Handling**: Comprehensive error tracking and alerting
- **Performance Metrics**: Queue statistics, processing times, throughput

## Configuration

```typescript
interface BackgroundJobsConfig {
  backend: 'redis' | 'database'
  redis?: {
    host: string
    port: number
    password?: string
    db: number
    maxRetriesPerRequest: number
  }
  database?: {
    tableName: string
    pollingInterval: number
  }
  processing: {
    concurrency: number
    maxAttempts: number
    retryDelay: number
    retryDelayMultiplier: number
    maxRetryDelay: number
    removeOnComplete: number
    removeOnFail: number
  }
  queues: Array<{
    name: string
    priority: number
    concurrency: number
    rateLimit?: {
      max: number
      duration: number
    }
  }>
  monitoring: {
    enableDashboard: boolean
    dashboardPort: number
    enableMetrics: boolean
    alertWebhook?: string
  }
  scheduling: {
    timezone: string
    enableRecurring: boolean
  }
}
```

## Generated Files

### Backend Implementation

```
api/src/
├── jobs/
│   ├── index.ts                  # Jobs exports
│   ├── queue/
│   │   ├── jobQueue.ts           # Main job queue manager
│   │   ├── redisQueue.ts         # Redis-based queue
│   │   ├── databaseQueue.ts      # Database-based queue
│   │   └── queueManager.ts       # Queue management service
│   ├── workers/
│   │   ├── jobWorker.ts          # Job worker implementation
│   │   ├── emailWorker.ts        # Email processing worker
│   │   ├── fileWorker.ts         # File processing worker
│   │   ├── notificationWorker.ts # Notification worker
│   │   └── scheduleWorker.ts     # Scheduled job worker
│   ├── services/
│   │   ├── jobService.ts         # Job management service
│   │   ├── schedulerService.ts   # Job scheduling service
│   │   ├── retryService.ts       # Retry logic service
│   │   └── monitoringService.ts  # Job monitoring service
│   ├── processors/
│   │   ├── baseProcessor.ts      # Base job processor
│   │   ├── emailProcessor.ts     # Email job processor
│   │   ├── imageProcessor.ts     # Image processing jobs
│   │   └── dataProcessor.ts      # Data processing jobs
│   ├── resolvers/
│   │   ├── jobResolvers.ts       # GraphQL job resolvers
│   │   └── queueResolvers.ts     # Queue management resolvers
│   ├── middleware/
│   │   ├── jobMiddleware.ts      # Job processing middleware
│   │   └── rateLimitMiddleware.ts # Rate limiting middleware
│   ├── dashboard/
│   │   ├── server.ts             # Dashboard server
│   │   ├── routes.ts             # Dashboard routes
│   │   └── templates/            # Dashboard HTML templates
│   └── types.ts                  # Job type definitions
```

### Frontend Implementation

```
web/src/
├── jobs/
│   ├── index.ts                  # Jobs exports
│   ├── components/
│   │   ├── JobDashboard.tsx      # Job monitoring dashboard
│   │   ├── QueueStatus.tsx       # Queue status display
│   │   ├── JobDetails.tsx        # Individual job details
│   │   ├── JobHistory.tsx        # Job execution history
│   │   ├── QueueMetrics.tsx      # Queue performance metrics
│   │   └── JobScheduler.tsx      # Job scheduling interface
│   ├── hooks/
│   │   ├── useJobService.ts      # Job service hook
│   │   ├── useJobStatus.ts       # Job status monitoring hook
│   │   └── useQueueMetrics.ts    # Queue metrics hook
│   ├── services/
│   │   ├── jobApi.ts             # Job API service
│   │   └── queueApi.ts           # Queue API service
│   └── utils/
│       ├── jobUtils.ts           # Job utilities
│       └── queueUtils.ts         # Queue utilities
```

## Code Examples

### Job Queue Manager (Backend)

```typescript
// api/src/jobs/queue/jobQueue.ts
import Bull, { Job, Queue, JobOptions } from 'bull'
import Redis from 'ioredis'
import { JobProcessor } from '../processors/baseProcessor'
import { MonitoringService } from '../services/monitoringService'

export class JobQueue {
  private queues = new Map<string, Queue>()
  private processors = new Map<string, JobProcessor>()
  private redis: Redis
  private monitoring: MonitoringService

  constructor(private config: BackgroundJobsConfig) {
    this.redis = new Redis(config.redis)
    this.monitoring = new MonitoringService(config.monitoring)
    this.initializeQueues()
  }

  private initializeQueues() {
    this.config.queues.forEach(queueConfig => {
      const queue = new Bull(queueConfig.name, {
        redis: this.config.redis,
        defaultJobOptions: {
          attempts: this.config.processing.maxAttempts,
          backoff: {
            type: 'exponential',
            delay: this.config.processing.retryDelay,
          },
          removeOnComplete: this.config.processing.removeOnComplete,
          removeOnFail: this.config.processing.removeOnFail,
        },
      })

      // Set up rate limiting if configured
      if (queueConfig.rateLimit) {
        queue.process(
          queueConfig.concurrency,
          queueConfig.rateLimit.max,
          queueConfig.rateLimit.duration,
          this.createJobProcessor(queueConfig.name),
        )
      } else {
        queue.process(queueConfig.concurrency, this.createJobProcessor(queueConfig.name))
      }

      this.setupQueueEvents(queue, queueConfig.name)
      this.queues.set(queueConfig.name, queue)
    })
  }

  private createJobProcessor(queueName: string) {
    return async (job: Job) => {
      const processor = this.processors.get(job.data.type)
      if (!processor) {
        throw new Error(`No processor found for job type: ${job.data.type}`)
      }

      try {
        await this.monitoring.startJob(job)

        const result = await processor.process(job.data, {
          updateProgress: (progress: number) => job.progress(progress),
          log: (message: string) => job.log(message),
        })

        await this.monitoring.completeJob(job, result)
        return result
      } catch (error) {
        await this.monitoring.failJob(job, error)
        throw error
      }
    }
  }

  private setupQueueEvents(queue: Queue, queueName: string) {
    queue.on('completed', (job, result) => {
      console.log(`Job ${job.id} in queue ${queueName} completed`)
      this.monitoring.recordJobCompletion(queueName, job, result)
    })

    queue.on('failed', (job, error) => {
      console.error(`Job ${job.id} in queue ${queueName} failed:`, error)
      this.monitoring.recordJobFailure(queueName, job, error)
    })

    queue.on('progress', (job, progress) => {
      this.monitoring.recordJobProgress(queueName, job, progress)
    })

    queue.on('stalled', job => {
      console.warn(`Job ${job.id} in queue ${queueName} stalled`)
      this.monitoring.recordJobStall(queueName, job)
    })

    queue.on('waiting', jobId => {
      this.monitoring.recordJobWaiting(queueName, jobId)
    })
  }

  async addJob(queueName: string, type: string, data: any, options: JobOptions = {}): Promise<Job> {
    const queue = this.queues.get(queueName)
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`)
    }

    const jobData = {
      type,
      ...data,
      createdAt: new Date().toISOString(),
    }

    const job = await queue.add(jobData, {
      ...options,
      priority: options.priority || this.getQueuePriority(queueName),
    })

    await this.monitoring.recordJobCreation(queueName, job)
    return job
  }

  async scheduleJob(
    queueName: string,
    type: string,
    data: any,
    delay: number | Date,
    options: JobOptions = {},
  ): Promise<Job> {
    const delayMs = delay instanceof Date ? delay.getTime() - Date.now() : delay

    return this.addJob(queueName, type, data, {
      ...options,
      delay: Math.max(0, delayMs),
    })
  }

  async addRecurringJob(
    queueName: string,
    type: string,
    data: any,
    cron: string,
    options: JobOptions = {},
  ): Promise<Job> {
    return this.addJob(queueName, type, data, {
      ...options,
      repeat: { cron },
      jobId: `${type}-recurring-${Date.now()}`,
    })
  }

  async getJob(queueName: string, jobId: string): Promise<Job | null> {
    const queue = this.queues.get(queueName)
    if (!queue) return null

    return queue.getJob(jobId)
  }

  async getQueueStats(queueName: string): Promise<QueueStats> {
    const queue = this.queues.get(queueName)
    if (!queue) throw new Error(`Queue ${queueName} not found`)

    const waiting = await queue.getWaiting()
    const active = await queue.getActive()
    const completed = await queue.getCompleted()
    const failed = await queue.getFailed()
    const delayed = await queue.getDelayed()

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      delayed: delayed.length,
      total: waiting.length + active.length + completed.length + failed.length + delayed.length,
    }
  }

  async getAllQueueStats(): Promise<Record<string, QueueStats>> {
    const stats: Record<string, QueueStats> = {}

    for (const [queueName] of this.queues) {
      stats[queueName] = await this.getQueueStats(queueName)
    }

    return stats
  }

  async pauseQueue(queueName: string): Promise<void> {
    const queue = this.queues.get(queueName)
    if (!queue) throw new Error(`Queue ${queueName} not found`)

    await queue.pause()
  }

  async resumeQueue(queueName: string): Promise<void> {
    const queue = this.queues.get(queueName)
    if (!queue) throw new Error(`Queue ${queueName} not found`)

    await queue.resume()
  }

  async retryJob(queueName: string, jobId: string): Promise<Job> {
    const job = await this.getJob(queueName, jobId)
    if (!job) throw new Error(`Job ${jobId} not found`)

    await job.retry()
    return job
  }

  async removeJob(queueName: string, jobId: string): Promise<void> {
    const job = await this.getJob(queueName, jobId)
    if (!job) throw new Error(`Job ${jobId} not found`)

    await job.remove()
  }

  registerProcessor(type: string, processor: JobProcessor) {
    this.processors.set(type, processor)
  }

  private getQueuePriority(queueName: string): number {
    const queueConfig = this.config.queues.find(q => q.name === queueName)
    return queueConfig?.priority || 0
  }

  async shutdown(): Promise<void> {
    await Promise.all(Array.from(this.queues.values()).map(queue => queue.close()))
    this.redis.disconnect()
  }
}

interface QueueStats {
  waiting: number
  active: number
  completed: number
  failed: number
  delayed: number
  total: number
}
```

### Base Job Processor

```typescript
// api/src/jobs/processors/baseProcessor.ts
export abstract class JobProcessor {
  abstract process(data: any, helpers: JobHelpers): Promise<any>

  protected validateData(data: any, schema: any): void {
    // Implement data validation
    if (!this.isValidData(data, schema)) {
      throw new Error('Invalid job data')
    }
  }

  protected async withRetry<T>(operation: () => Promise<T>, maxAttempts = 3, delay = 1000): Promise<T> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation()
      } catch (error) {
        if (attempt === maxAttempts) throw error

        await this.sleep(delay * Math.pow(2, attempt - 1))
      }
    }
    throw new Error('Max retry attempts reached')
  }

  protected sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  private isValidData(data: any, schema: any): boolean {
    // Simple validation - in production, use a proper validation library
    return true
  }
}

interface JobHelpers {
  updateProgress: (progress: number) => Promise<void>
  log: (message: string) => void
}
```

### Email Job Processor

```typescript
// api/src/jobs/processors/emailProcessor.ts
import { JobProcessor } from './baseProcessor'
import { EmailService } from '../../email/services/emailService'

export class EmailJobProcessor extends JobProcessor {
  private emailService: EmailService

  constructor() {
    super()
    this.emailService = new EmailService()
  }

  async process(data: EmailJobData, helpers: JobHelpers): Promise<EmailJobResult> {
    this.validateData(data, {
      type: 'string',
      to: 'string|array',
      subject: 'string',
    })

    helpers.log('Starting email job processing')
    helpers.updateProgress(10)

    try {
      let result: any

      switch (data.type) {
        case 'single':
          result = await this.processSingleEmail(data, helpers)
          break
        case 'bulk':
          result = await this.processBulkEmail(data, helpers)
          break
        case 'template':
          result = await this.processTemplateEmail(data, helpers)
          break
        default:
          throw new Error(`Unknown email job type: ${data.type}`)
      }

      helpers.updateProgress(100)
      helpers.log('Email job completed successfully')

      return {
        success: true,
        messageId: result.id,
        sentAt: new Date().toISOString(),
      }
    } catch (error) {
      helpers.log(`Email job failed: ${error.message}`)
      throw error
    }
  }

  private async processSingleEmail(data: EmailJobData, helpers: JobHelpers) {
    helpers.updateProgress(30)

    const result = await this.emailService.sendEmail({
      to: data.to as string,
      subject: data.subject!,
      html: data.html,
      text: data.text,
      attachments: data.attachments,
    })

    helpers.updateProgress(80)
    return result
  }

  private async processBulkEmail(data: EmailJobData, helpers: JobHelpers) {
    const recipients = data.recipients!
    const totalRecipients = recipients.length
    let processedCount = 0

    const results = []

    for (const recipient of recipients) {
      try {
        const result = await this.emailService.sendEmail({
          to: recipient.email,
          subject: data.subject!,
          html: data.html,
          text: data.text,
        })

        results.push({ email: recipient.email, success: true, messageId: result.id })
      } catch (error) {
        results.push({ email: recipient.email, success: false, error: error.message })
      }

      processedCount++
      const progress = Math.floor((processedCount / totalRecipients) * 80) + 10
      helpers.updateProgress(progress)

      helpers.log(`Processed ${processedCount}/${totalRecipients} emails`)

      // Small delay to avoid overwhelming the email provider
      await this.sleep(100)
    }

    return {
      totalSent: results.filter(r => r.success).length,
      totalFailed: results.filter(r => !r.success).length,
      results,
    }
  }

  private async processTemplateEmail(data: EmailJobData, helpers: JobHelpers) {
    helpers.updateProgress(30)

    const result = await this.emailService.sendTemplate({
      to: data.to as string,
      template: data.template!,
      variables: data.variables || {},
    })

    helpers.updateProgress(80)
    return result
  }
}

interface EmailJobData {
  type: 'single' | 'bulk' | 'template'
  to?: string
  recipients?: Array<{ email: string; variables?: any }>
  subject?: string
  html?: string
  text?: string
  template?: string
  variables?: Record<string, any>
  attachments?: Array<{
    filename: string
    content: Buffer
    contentType?: string
  }>
}

interface EmailJobResult {
  success: boolean
  messageId?: string
  sentAt: string
  error?: string
}
```

### Job Service

```typescript
// api/src/jobs/services/jobService.ts
import { JobQueue } from '../queue/jobQueue'
import { EmailJobProcessor } from '../processors/emailProcessor'

export class JobService {
  private jobQueue: JobQueue

  constructor(config: BackgroundJobsConfig) {
    this.jobQueue = new JobQueue(config)
    this.registerProcessors()
  }

  private registerProcessors() {
    this.jobQueue.registerProcessor('email', new EmailJobProcessor())
    // Register other processors...
  }

  async scheduleEmail(emailData: any, delay?: number | Date): Promise<string> {
    const job = await this.jobQueue.addJob('email', 'email', emailData, {
      delay: delay ? (delay instanceof Date ? delay.getTime() - Date.now() : delay) : undefined,
    })

    return job.id as string
  }

  async scheduleBulkEmail(bulkEmailData: any): Promise<string> {
    const job = await this.jobQueue.addJob('email', 'email', {
      type: 'bulk',
      ...bulkEmailData,
    })

    return job.id as string
  }

  async scheduleRecurringEmail(emailData: any, cronExpression: string): Promise<string> {
    const job = await this.jobQueue.addRecurringJob('email', 'email', emailData, cronExpression)
    return job.id as string
  }

  async scheduleImageProcessing(imageData: any): Promise<string> {
    const job = await this.jobQueue.addJob('images', 'image-processing', imageData)
    return job.id as string
  }

  async scheduleDataExport(exportData: any): Promise<string> {
    const job = await this.jobQueue.addJob('data', 'export', exportData)
    return job.id as string
  }

  async getJobStatus(jobId: string): Promise<JobStatus> {
    // Check all queues for the job
    for (const queueName of ['email', 'images', 'data']) {
      const job = await this.jobQueue.getJob(queueName, jobId)
      if (job) {
        return {
          id: job.id as string,
          type: job.data.type,
          status: await job.getState(),
          progress: job.progress(),
          data: job.data,
          createdAt: new Date(job.timestamp),
          processedAt: job.processedOn ? new Date(job.processedOn) : undefined,
          finishedAt: job.finishedOn ? new Date(job.finishedOn) : undefined,
          attempts: job.attemptsMade,
          failedReason: job.failedReason,
        }
      }
    }

    throw new Error(`Job ${jobId} not found`)
  }

  async retryJob(jobId: string): Promise<void> {
    // Find and retry job in any queue
    for (const queueName of ['email', 'images', 'data']) {
      try {
        await this.jobQueue.retryJob(queueName, jobId)
        return
      } catch {
        // Continue searching in other queues
      }
    }

    throw new Error(`Job ${jobId} not found`)
  }

  async cancelJob(jobId: string): Promise<void> {
    for (const queueName of ['email', 'images', 'data']) {
      try {
        await this.jobQueue.removeJob(queueName, jobId)
        return
      } catch {
        // Continue searching in other queues
      }
    }

    throw new Error(`Job ${jobId} not found`)
  }

  async getQueueStats(): Promise<Record<string, any>> {
    return this.jobQueue.getAllQueueStats()
  }

  async pauseQueue(queueName: string): Promise<void> {
    await this.jobQueue.pauseQueue(queueName)
  }

  async resumeQueue(queueName: string): Promise<void> {
    await this.jobQueue.resumeQueue(queueName)
  }

  async shutdown(): Promise<void> {
    await this.jobQueue.shutdown()
  }
}

interface JobStatus {
  id: string
  type: string
  status: string
  progress: number
  data: any
  createdAt: Date
  processedAt?: Date
  finishedAt?: Date
  attempts: number
  failedReason?: string
}
```

### React Job Dashboard Component

```typescript
// web/src/jobs/components/JobDashboard.tsx
import React, { useState, useEffect } from 'react'
import { useJobService } from '../hooks/useJobService'
import { QueueStatus } from './QueueStatus'
import { JobDetails } from './JobDetails'
import { QueueMetrics } from './QueueMetrics'

export const JobDashboard: React.FC = () => {
  const [selectedQueue, setSelectedQueue] = useState<string>('email')
  const [selectedJob, setSelectedJob] = useState<string | null>(null)
  const [refreshInterval, setRefreshInterval] = useState<number>(5000)
  const { queueStats, jobs, loading, error, refreshData } = useJobService()

  useEffect(() => {
    const interval = setInterval(() => {
      refreshData()
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [refreshInterval, refreshData])

  const handleScheduleJob = async (jobData: any) => {
    // Implementation for scheduling new jobs
  }

  const handleRetryJob = async (jobId: string) => {
    // Implementation for retrying failed jobs
  }

  const handleCancelJob = async (jobId: string) => {
    // Implementation for canceling jobs
  }

  if (loading) {
    return <div className="loading">Loading job dashboard...</div>
  }

  if (error) {
    return <div className="error">Error loading jobs: {error.message}</div>
  }

  return (
    <div className="job-dashboard">
      <div className="dashboard-header">
        <h1>Job Dashboard</h1>
        <div className="dashboard-controls">
          <select
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(Number(e.target.value))}
          >
            <option value={1000}>1s refresh</option>
            <option value={5000}>5s refresh</option>
            <option value={10000}>10s refresh</option>
            <option value={30000}>30s refresh</option>
          </select>
          <button onClick={refreshData}>Refresh Now</button>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="sidebar">
          <div className="queue-list">
            <h2>Queues</h2>
            {Object.keys(queueStats).map(queueName => (
              <div
                key={queueName}
                className={`queue-item ${selectedQueue === queueName ? 'active' : ''}`}
                onClick={() => setSelectedQueue(queueName)}
              >
                <h3>{queueName}</h3>
                <div className="queue-summary">
                  <span className="waiting">Waiting: {queueStats[queueName].waiting}</span>
                  <span className="active">Active: {queueStats[queueName].active}</span>
                  <span className="failed">Failed: {queueStats[queueName].failed}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="quick-actions">
            <h2>Quick Actions</h2>
            <button onClick={() => handleScheduleJob({ type: 'email' })}>
              Schedule Email
            </button>
            <button onClick={() => handleScheduleJob({ type: 'image-processing' })}>
              Process Images
            </button>
            <button onClick={() => handleScheduleJob({ type: 'data-export' })}>
              Export Data
            </button>
          </div>
        </div>

        <div className="main-content">
          <div className="queue-details">
            <QueueStatus
              queueName={selectedQueue}
              stats={queueStats[selectedQueue]}
              onJobSelect={setSelectedJob}
            />

            <QueueMetrics queueName={selectedQueue} />
          </div>

          {selectedJob && (
            <JobDetails
              jobId={selectedJob}
              onRetry={handleRetryJob}
              onCancel={handleCancelJob}
              onClose={() => setSelectedJob(null)}
            />
          )}
        </div>
      </div>
    </div>
  )
}
```

### Job GraphQL Resolvers

```typescript
// api/src/jobs/resolvers/jobResolvers.ts
import { JobService } from '../services/jobService'
import { requireAuth } from '../../auth/middleware'

const jobService = new JobService()

export const jobResolvers = {
  Mutation: {
    scheduleEmailJob: requireAuth(async (parent: any, { input }: { input: ScheduleEmailJobInput }, context: any) => {
      const jobId = await jobService.scheduleEmail(input.emailData, input.delay)

      return {
        id: jobId,
        status: 'scheduled',
        message: 'Email job scheduled successfully',
      }
    }),

    scheduleBulkEmailJob: requireAuth(
      async (parent: any, { input }: { input: ScheduleBulkEmailJobInput }, context: any) => {
        const jobId = await jobService.scheduleBulkEmail(input.bulkEmailData)

        return {
          id: jobId,
          status: 'scheduled',
          message: 'Bulk email job scheduled successfully',
        }
      },
    ),

    retryJob: requireAuth(async (parent: any, { jobId }: { jobId: string }, context: any) => {
      await jobService.retryJob(jobId)

      return {
        id: jobId,
        status: 'retrying',
        message: 'Job retry initiated',
      }
    }),

    cancelJob: requireAuth(async (parent: any, { jobId }: { jobId: string }, context: any) => {
      await jobService.cancelJob(jobId)

      return {
        id: jobId,
        status: 'cancelled',
        message: 'Job cancelled successfully',
      }
    }),

    pauseQueue: requireAuth(async (parent: any, { queueName }: { queueName: string }, context: any) => {
      await jobService.pauseQueue(queueName)

      return {
        queueName,
        status: 'paused',
        message: 'Queue paused successfully',
      }
    }),

    resumeQueue: requireAuth(async (parent: any, { queueName }: { queueName: string }, context: any) => {
      await jobService.resumeQueue(queueName)

      return {
        queueName,
        status: 'active',
        message: 'Queue resumed successfully',
      }
    }),
  },

  Query: {
    jobStatus: requireAuth(async (parent: any, { jobId }: { jobId: string }, context: any) => {
      return jobService.getJobStatus(jobId)
    }),

    queueStats: requireAuth(async (parent: any, args: any, context: any) => {
      return jobService.getQueueStats()
    }),

    jobHistory: requireAuth(async (parent: any, { filters }: { filters: JobHistoryFilters }, context: any) => {
      // Implementation for job history with filtering
      return []
    }),
  },
}

interface ScheduleEmailJobInput {
  emailData: {
    to: string
    subject: string
    html?: string
    template?: string
    variables?: Record<string, any>
  }
  delay?: number
}

interface ScheduleBulkEmailJobInput {
  bulkEmailData: {
    recipients: Array<{
      email: string
      variables?: Record<string, any>
    }>
    subject?: string
    template?: string
    variables?: Record<string, any>
  }
}

interface JobHistoryFilters {
  queueName?: string
  status?: string
  dateFrom?: string
  dateTo?: string
  limit?: number
}
```

## Database Schema

```prisma
// Add to schema.prisma
model Job {
  id            String      @id @default(cuid())
  queueName     String
  type          String
  data          Json
  status        JobStatus   @default(PENDING)
  priority      Int         @default(0)
  attempts      Int         @default(0)
  maxAttempts   Int         @default(3)
  progress      Float       @default(0)
  result        Json?
  error         String?     @db.Text
  stackTrace    String?     @db.Text
  delay         Int?        // Delay in milliseconds
  scheduledAt   DateTime?
  startedAt     DateTime?
  completedAt   DateTime?
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  logs          JobLog[]

  @@index([queueName, status])
  @@index([scheduledAt])
  @@map("jobs")
}

model JobLog {
  id        String   @id @default(cuid())
  jobId     String
  level     LogLevel @default(INFO)
  message   String   @db.Text
  metadata  Json?
  createdAt DateTime @default(now())

  job       Job      @relation(fields: [jobId], references: [id], onDelete: Cascade)

  @@index([jobId, createdAt])
  @@map("job_logs")
}

model RecurringJob {
  id           String   @id @default(cuid())
  name         String   @unique
  queueName    String
  type         String
  data         Json
  cronPattern  String
  timezone     String   @default("UTC")
  isActive     Boolean  @default(true)
  lastRun      DateTime?
  nextRun      DateTime?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@index([isActive, nextRun])
  @@map("recurring_jobs")
}

model QueueStats {
  id              String   @id @default(cuid())
  queueName       String   @unique
  totalJobs       Int      @default(0)
  completedJobs   Int      @default(0)
  failedJobs      Int      @default(0)
  activeJobs      Int      @default(0)
  waitingJobs     Int      @default(0)
  delayedJobs     Int      @default(0)
  avgProcessingTime Float  @default(0)
  lastProcessedAt DateTime?
  updatedAt       DateTime @updatedAt

  @@map("queue_stats")
}

enum JobStatus {
  PENDING
  WAITING
  ACTIVE
  COMPLETED
  FAILED
  CANCELLED
  DELAYED
  STALLED
}

enum LogLevel {
  DEBUG
  INFO
  WARN
  ERROR
}
```

## Installation Steps

1. **Install Background Jobs Dependencies**

   ```bash
   # Backend
   pnpm add bull ioredis node-cron
   pnpm add -D @types/bull

   # Frontend
   pnpm add recharts date-fns
   ```

2. **Configure Environment Variables**

   ```env
   # Redis Configuration
   REDIS_HOST=localhost
   REDIS_PORT=6379
   REDIS_PASSWORD=your-redis-password
   REDIS_DB=0

   # Job Configuration
   JOB_CONCURRENCY=5
   JOB_MAX_ATTEMPTS=3
   JOB_RETRY_DELAY=5000
   JOB_REMOVE_ON_COMPLETE=50
   JOB_REMOVE_ON_FAIL=50

   # Monitoring
   JOB_DASHBOARD_ENABLED=true
   JOB_DASHBOARD_PORT=3001
   JOB_ALERT_WEBHOOK=https://your-webhook-url.com
   ```

3. **Database Migration**

   ```bash
   pnpm prisma migrate dev --name add-background-jobs
   ```

4. **Start Redis Server**

   ```bash
   # Using Docker
   docker run -d --name redis -p 6379:6379 redis:7-alpine

   # Or install locally
   sudo apt-get install redis-server  # Ubuntu/Debian
   brew install redis                 # macOS
   ```

This background jobs system provides enterprise-grade asynchronous processing with comprehensive monitoring, retry logic, and scalable queue management.
