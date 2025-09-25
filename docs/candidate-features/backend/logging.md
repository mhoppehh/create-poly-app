# Logging System

## Overview

Comprehensive logging infrastructure with structured logging, multiple outputs, log levels, request tracing, error tracking, and centralized log aggregation.

## Priority

**MEDIUM-HIGH** - Essential for debugging, monitoring, and maintaining production applications

## Dependencies

- `apollo-server` (for GraphQL request logging)
- `prisma` (for database query logging)

## Feature Description

Enterprise-grade logging system supporting structured logging, multiple transports, log correlation, performance metrics, error tracking, and integration with popular log aggregation services.

### Key Features

- **Structured Logging**: JSON-formatted logs with consistent schema
- **Multiple Transports**: Console, file, database, remote services
- **Log Levels**: Configurable verbosity (error, warn, info, debug, trace)
- **Request Tracing**: Correlation IDs for tracking requests across services
- **Error Tracking**: Automatic error capture with stack traces and context
- **Performance Monitoring**: Request duration, database query times, memory usage
- **Log Aggregation**: Integration with ELK, Fluentd, CloudWatch, Datadog

## Configuration

```typescript
interface LoggingConfig {
  level: 'error' | 'warn' | 'info' | 'debug' | 'trace'
  format: 'json' | 'text' | 'combined'
  transports: {
    console: {
      enabled: boolean
      colorize: boolean
      timestamp: boolean
    }
    file: {
      enabled: boolean
      filename: string
      maxSize: string
      maxFiles: number
      rotate: boolean
    }
    database: {
      enabled: boolean
      tableName: string
      maxEntries: number
      cleanupInterval: string
    }
    remote: {
      enabled: boolean
      service: 'elasticsearch' | 'datadog' | 'cloudwatch' | 'fluentd'
      endpoint: string
      apiKey?: string
      batchSize: number
      flushInterval: number
    }
  }
  correlation: {
    enabled: boolean
    headerName: string
    generateIds: boolean
  }
  sampling: {
    enabled: boolean
    rate: number // 0.0 to 1.0
    includeErrors: boolean
  }
  privacy: {
    maskSensitiveData: boolean
    sensitiveFields: string[]
    maskPattern: string
  }
  performance: {
    enabled: boolean
    slowQueryThreshold: number
    slowRequestThreshold: number
    memorySnapshots: boolean
  }
  retention: {
    days: number
    compressOldLogs: boolean
    archiveLocation?: string
  }
}
```

## Generated Files

### Backend Implementation

```
api/src/
├── logging/
│   ├── index.ts                  # Logging exports
│   ├── core/
│   │   ├── logger.ts             # Main logger implementation
│   │   ├── loggerFactory.ts      # Logger factory and configuration
│   │   └── logLevel.ts           # Log level management
│   ├── transports/
│   │   ├── consoleTransport.ts   # Console output transport
│   │   ├── fileTransport.ts      # File system transport
│   │   ├── databaseTransport.ts  # Database transport
│   │   ├── elasticsearchTransport.ts # Elasticsearch transport
│   │   ├── datadogTransport.ts   # Datadog transport
│   │   └── cloudwatchTransport.ts # AWS CloudWatch transport
│   ├── middleware/
│   │   ├── requestLogger.ts      # HTTP request logging
│   │   ├── correlationMiddleware.ts # Request correlation
│   │   ├── errorLogger.ts        # Error logging middleware
│   │   └── performanceLogger.ts  # Performance monitoring
│   ├── formatters/
│   │   ├── jsonFormatter.ts      # JSON log formatting
│   │   ├── textFormatter.ts      # Human-readable formatting
│   │   └── combinedFormatter.ts  # Combined log formatting
│   ├── services/
│   │   ├── logAggregator.ts      # Log aggregation service
│   │   ├── logRetention.ts       # Log cleanup and archiving
│   │   ├── errorTracker.ts       # Error tracking service
│   │   └── metricsCollector.ts   # Performance metrics
│   ├── utils/
│   │   ├── correlationId.ts      # Correlation ID utilities
│   │   ├── sanitizer.ts          # Data sanitization
│   │   ├── logParser.ts          # Log parsing utilities
│   │   └── compression.ts        # Log compression utilities
│   ├── resolvers/
│   │   ├── loggingResolvers.ts   # Log management GraphQL resolvers
│   │   └── metricsResolvers.ts   # Metrics GraphQL resolvers
│   ├── jobs/
│   │   ├── logRetentionJob.ts    # Log cleanup background job
│   │   ├── logAggregationJob.ts  # Log aggregation job
│   │   └── metricsJob.ts         # Metrics collection job
│   └── types.ts                  # Logging type definitions
```

### Frontend Implementation

```
web/src/
├── logging/
│   ├── index.ts                  # Logging exports
│   ├── components/
│   │   ├── LogViewer.tsx         # Log viewing interface
│   │   ├── LogSearch.tsx         # Log search and filtering
│   │   ├── ErrorDashboard.tsx    # Error tracking dashboard
│   │   ├── MetricsDashboard.tsx  # Performance metrics dashboard
│   │   └── LogExporter.tsx       # Log export functionality
│   ├── hooks/
│   │   ├── useLogger.ts          # Client-side logging hook
│   │   ├── useLogs.ts            # Log retrieval hook
│   │   ├── useMetrics.ts         # Metrics hook
│   │   └── useErrorTracking.ts   # Error tracking hook
│   ├── services/
│   │   ├── clientLogger.ts       # Client-side logger
│   │   ├── logApi.ts             # Log API service
│   │   └── errorReporter.ts      # Error reporting service
│   ├── utils/
│   │   ├── logLevels.ts          # Log level utilities
│   │   ├── logFormatters.ts      # Log formatting utilities
│   │   └── errorUtils.ts         # Error utilities
│   └── providers/
│       └── LoggingProvider.tsx   # Logging context provider
```

## Code Examples

### Main Logger Implementation (Backend)

```typescript
// api/src/logging/core/logger.ts
import { EventEmitter } from 'events'
import { LogTransport } from '../transports/base'
import { CorrelationId } from '../utils/correlationId'
import { DataSanitizer } from '../utils/sanitizer'

export class Logger extends EventEmitter {
  private transports: LogTransport[] = []
  private correlationId = new CorrelationId()
  private sanitizer = new DataSanitizer()

  constructor(private config: LoggingConfig) {
    super()
    this.setupTransports()
  }

  private setupTransports() {
    // Console transport
    if (this.config.transports.console.enabled) {
      const ConsoleTransport = require('../transports/consoleTransport').ConsoleTransport
      this.transports.push(new ConsoleTransport(this.config.transports.console))
    }

    // File transport
    if (this.config.transports.file.enabled) {
      const FileTransport = require('../transports/fileTransport').FileTransport
      this.transports.push(new FileTransport(this.config.transports.file))
    }

    // Database transport
    if (this.config.transports.database.enabled) {
      const DatabaseTransport = require('../transports/databaseTransport').DatabaseTransport
      this.transports.push(new DatabaseTransport(this.config.transports.database))
    }

    // Remote transport
    if (this.config.transports.remote.enabled) {
      const RemoteTransport = this.getRemoteTransport(this.config.transports.remote.service)
      this.transports.push(new RemoteTransport(this.config.transports.remote))
    }
  }

  private getRemoteTransport(service: string) {
    switch (service) {
      case 'elasticsearch':
        return require('../transports/elasticsearchTransport').ElasticsearchTransport
      case 'datadog':
        return require('../transports/datadogTransport').DatadogTransport
      case 'cloudwatch':
        return require('../transports/cloudwatchTransport').CloudWatchTransport
      default:
        throw new Error(`Unknown remote transport: ${service}`)
    }
  }

  trace(message: string, meta?: LogMeta): void {
    this.log('trace', message, meta)
  }

  debug(message: string, meta?: LogMeta): void {
    this.log('debug', message, meta)
  }

  info(message: string, meta?: LogMeta): void {
    this.log('info', message, meta)
  }

  warn(message: string, meta?: LogMeta): void {
    this.log('warn', message, meta)
  }

  error(message: string, error?: Error, meta?: LogMeta): void {
    const errorMeta = error ? this.formatError(error) : {}
    this.log('error', message, { ...meta, ...errorMeta })
  }

  private log(level: LogLevel, message: string, meta: LogMeta = {}): void {
    if (!this.shouldLog(level)) return

    const logEntry = this.createLogEntry(level, message, meta)

    // Apply sampling if enabled
    if (this.config.sampling.enabled) {
      if (!this.shouldSample(level)) return
    }

    // Send to all transports
    this.transports.forEach(transport => {
      try {
        transport.log(logEntry)
      } catch (error) {
        console.error('Transport logging error:', error)
      }
    })

    // Emit log event for additional processing
    this.emit('log', logEntry)
  }

  private createLogEntry(level: LogLevel, message: string, meta: LogMeta): LogEntry {
    const timestamp = new Date()
    const correlationId = this.correlationId.get() || this.correlationId.generate()

    // Sanitize sensitive data
    const sanitizedMeta = this.config.privacy.maskSensitiveData ? this.sanitizer.sanitize(meta) : meta

    const entry: LogEntry = {
      timestamp: timestamp.toISOString(),
      level,
      message,
      correlationId,
      meta: sanitizedMeta,
      hostname: require('os').hostname(),
      pid: process.pid,
      environment: process.env.NODE_ENV || 'development',
    }

    // Add performance metrics if enabled
    if (this.config.performance.enabled) {
      entry.performance = this.getPerformanceMetrics()
    }

    return entry
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3,
      trace: 4,
    }

    return levels[level] <= levels[this.config.level]
  }

  private shouldSample(level: LogLevel): boolean {
    if (level === 'error' && this.config.sampling.includeErrors) {
      return true
    }

    return Math.random() <= this.config.sampling.rate
  }

  private formatError(error: Error): ErrorMeta {
    return {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: (error as any).code,
        statusCode: (error as any).statusCode,
      },
    }
  }

  private getPerformanceMetrics(): PerformanceMetrics {
    const memUsage = process.memoryUsage()
    const cpuUsage = process.cpuUsage()

    return {
      memory: {
        rss: memUsage.rss,
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
        external: memUsage.external,
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system,
      },
      uptime: process.uptime(),
      loadAverage: require('os').loadavg(),
    }
  }

  // Request-specific logging methods
  logRequest(req: any, res: any, duration: number): void {
    const logData = {
      method: req.method,
      url: req.originalUrl || req.url,
      statusCode: res.statusCode,
      duration,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress,
      userId: req.user?.id,
      responseSize: res.get('Content-Length'),
    }

    if (res.statusCode >= 400) {
      this.warn('HTTP request failed', logData)
    } else if (duration > this.config.performance.slowRequestThreshold) {
      this.warn('Slow HTTP request', logData)
    } else {
      this.info('HTTP request', logData)
    }
  }

  logDatabaseQuery(query: string, params: any[], duration: number): void {
    const logData = {
      query: this.sanitizeQuery(query),
      params: this.sanitizer.sanitize(params),
      duration,
      correlationId: this.correlationId.get(),
    }

    if (duration > this.config.performance.slowQueryThreshold) {
      this.warn('Slow database query', logData)
    } else {
      this.debug('Database query', logData)
    }
  }

  logGraphQLOperation(operation: any, duration: number, errors?: any[]): void {
    const logData = {
      operationName: operation.operationName,
      operationType: operation.operation?.operation,
      query: operation.query,
      variables: this.sanitizer.sanitize(operation.variables),
      duration,
      errors: errors?.map(err => ({
        message: err.message,
        path: err.path,
        extensions: err.extensions,
      })),
    }

    if (errors && errors.length > 0) {
      this.error('GraphQL operation failed', undefined, logData)
    } else if (duration > this.config.performance.slowRequestThreshold) {
      this.warn('Slow GraphQL operation', logData)
    } else {
      this.info('GraphQL operation', logData)
    }
  }

  private sanitizeQuery(query: string): string {
    // Remove or mask sensitive data in SQL queries
    return query.replace(/password\s*=\s*'[^']*'/gi, "password='***'").replace(/token\s*=\s*'[^']*'/gi, "token='***'")
  }

  // Child logger with additional context
  child(context: Record<string, any>): Logger {
    const childLogger = Object.create(this)
    const originalCreateLogEntry = this.createLogEntry.bind(this)

    childLogger.createLogEntry = (level: LogLevel, message: string, meta: LogMeta) => {
      return originalCreateLogEntry(level, message, { ...context, ...meta })
    }

    return childLogger
  }

  async shutdown(): Promise<void> {
    // Close all transports gracefully
    await Promise.all(this.transports.map(transport => (transport.close ? transport.close() : Promise.resolve())))
  }
}

interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  correlationId: string
  meta: LogMeta
  hostname: string
  pid: number
  environment: string
  performance?: PerformanceMetrics
}

interface LogMeta {
  [key: string]: any
}

interface ErrorMeta {
  error: {
    name: string
    message: string
    stack?: string
    code?: string | number
    statusCode?: number
  }
}

interface PerformanceMetrics {
  memory: {
    rss: number
    heapUsed: number
    heapTotal: number
    external: number
  }
  cpu: {
    user: number
    system: number
  }
  uptime: number
  loadAverage: number[]
}

type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'trace'
```

### Request Logging Middleware

```typescript
// api/src/logging/middleware/requestLogger.ts
import { Request, Response, NextFunction } from 'express'
import { Logger } from '../core/logger'
import { CorrelationId } from '../utils/correlationId'

export class RequestLogger {
  private correlationId = new CorrelationId()

  constructor(
    private logger: Logger,
    private config: LoggingConfig,
  ) {}

  middleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const startTime = Date.now()

      // Set or extract correlation ID
      const correlationId = this.getOrSetCorrelationId(req)
      this.correlationId.set(correlationId)

      // Create request-specific logger
      const requestLogger = this.logger.child({
        correlationId,
        requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      })

      // Attach logger to request for use in other middleware/routes
      ;(req as any).logger = requestLogger

      // Log incoming request
      requestLogger.info('Incoming request', {
        method: req.method,
        url: req.originalUrl || req.url,
        userAgent: req.get('User-Agent'),
        ip: req.ip || req.connection.remoteAddress,
        headers: this.sanitizeHeaders(req.headers),
        query: req.query,
        body: req.method !== 'GET' ? this.sanitizeBody(req.body) : undefined,
      })

      // Override res.end to log response
      const originalEnd = res.end
      res.end = function (chunk: any, encoding?: any) {
        const duration = Date.now() - startTime

        // Log response
        requestLogger.logRequest(req, res, duration)

        // Log response body for errors (if enabled)
        if (res.statusCode >= 400 && chunk && typeof chunk === 'string') {
          try {
            const responseBody = JSON.parse(chunk)
            requestLogger.warn('Error response body', {
              statusCode: res.statusCode,
              responseBody: responseBody,
            })
          } catch (e) {
            // Not JSON, log as text
            requestLogger.warn('Error response body', {
              statusCode: res.statusCode,
              responseBody: chunk.toString().substring(0, 1000), // Limit size
            })
          }
        }

        // Call original end
        originalEnd.call(this, chunk, encoding)

        // Clear correlation ID after request
        this.correlationId.clear()
      }.bind(this)

      next()
    }
  }

  private getOrSetCorrelationId(req: Request): string {
    const headerName = this.config.correlation.headerName
    let correlationId = req.get(headerName)

    if (!correlationId && this.config.correlation.generateIds) {
      correlationId = this.correlationId.generate()
    }

    return correlationId || 'unknown'
  }

  private sanitizeHeaders(headers: any): any {
    const sanitized = { ...headers }
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key', 'x-auth-token']

    sensitiveHeaders.forEach(header => {
      if (sanitized[header]) {
        sanitized[header] = '***'
      }
    })

    return sanitized
  }

  private sanitizeBody(body: any): any {
    if (!body || typeof body !== 'object') return body

    const sanitized = { ...body }
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'auth']

    const sanitizeObject = (obj: any): any => {
      if (Array.isArray(obj)) {
        return obj.map(item => sensitizeObject(item))
      }

      if (obj && typeof obj === 'object') {
        const result: any = {}
        Object.keys(obj).forEach(key => {
          if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
            result[key] = '***'
          } else {
            result[key] = sanitizeObject(obj[key])
          }
        })
        return result
      }

      return obj
    }

    return sanitizeObject(sanitized)
  }
}
```

### File Transport Implementation

```typescript
// api/src/logging/transports/fileTransport.ts
import fs from 'fs/promises'
import path from 'path'
import { createWriteStream, WriteStream } from 'fs'
import { LogTransport } from './base'

export class FileTransport implements LogTransport {
  private writeStream?: WriteStream
  private currentFile?: string
  private fileSize = 0

  constructor(private config: FileTransportConfig) {
    this.initialize()
  }

  private async initialize() {
    await this.ensureDirectory()
    await this.createNewFile()
  }

  private async ensureDirectory() {
    const dir = path.dirname(this.config.filename)
    try {
      await fs.mkdir(dir, { recursive: true })
    } catch (error) {
      console.error('Failed to create log directory:', error)
    }
  }

  private async createNewFile() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const ext = path.extname(this.config.filename)
    const base = path.basename(this.config.filename, ext)
    const dir = path.dirname(this.config.filename)

    this.currentFile = path.join(dir, `${base}-${timestamp}${ext}`)

    if (this.writeStream) {
      this.writeStream.end()
    }

    this.writeStream = createWriteStream(this.currentFile, { flags: 'a' })
    this.fileSize = 0
  }

  async log(entry: LogEntry): Promise<void> {
    if (!this.writeStream) return

    const logLine = JSON.stringify(entry) + '\n'
    const logSize = Buffer.byteLength(logLine, 'utf8')

    // Check if we need to rotate the file
    if (this.config.rotate && this.shouldRotate(logSize)) {
      await this.rotateFile()
    }

    return new Promise((resolve, reject) => {
      this.writeStream!.write(logLine, 'utf8', error => {
        if (error) {
          console.error('File logging error:', error)
          reject(error)
        } else {
          this.fileSize += logSize
          resolve()
        }
      })
    })
  }

  private shouldRotate(additionalSize: number): boolean {
    const maxSizeBytes = this.parseSize(this.config.maxSize)
    return this.fileSize + additionalSize > maxSizeBytes
  }

  private async rotateFile(): Promise<void> {
    await this.createNewFile()
    await this.cleanupOldFiles()
  }

  private async cleanupOldFiles(): Promise<void> {
    if (this.config.maxFiles <= 0) return

    try {
      const dir = path.dirname(this.config.filename)
      const files = await fs.readdir(dir)
      const base = path.basename(this.config.filename, path.extname(this.config.filename))

      const logFiles = files
        .filter(file => file.startsWith(base) && file.includes('-'))
        .map(file => ({
          name: file,
          path: path.join(dir, file),
          stat: null as any,
        }))

      // Get file stats
      for (const file of logFiles) {
        try {
          file.stat = await fs.stat(file.path)
        } catch (error) {
          // File might have been deleted, skip it
        }
      }

      // Sort by creation time (newest first)
      const sortedFiles = logFiles
        .filter(file => file.stat)
        .sort((a, b) => b.stat.birthtime.getTime() - a.stat.birthtime.getTime())

      // Delete old files
      const filesToDelete = sortedFiles.slice(this.config.maxFiles)
      for (const file of filesToDelete) {
        try {
          await fs.unlink(file.path)
        } catch (error) {
          console.error('Failed to delete old log file:', error)
        }
      }
    } catch (error) {
      console.error('Failed to cleanup old log files:', error)
    }
  }

  private parseSize(sizeStr: string): number {
    const units: Record<string, number> = {
      B: 1,
      KB: 1024,
      MB: 1024 * 1024,
      GB: 1024 * 1024 * 1024,
    }

    const match = sizeStr.match(/^(\d+)\s*([A-Z]{1,2})$/i)
    if (!match) {
      throw new Error(`Invalid size format: ${sizeStr}`)
    }

    const [, size, unit] = match
    const multiplier = units[unit.toUpperCase()]

    if (!multiplier) {
      throw new Error(`Unknown size unit: ${unit}`)
    }

    return parseInt(size, 10) * multiplier
  }

  async close(): Promise<void> {
    return new Promise(resolve => {
      if (this.writeStream) {
        this.writeStream.end(() => {
          resolve()
        })
      } else {
        resolve()
      }
    })
  }
}

interface FileTransportConfig {
  filename: string
  maxSize: string
  maxFiles: number
  rotate: boolean
}

interface LogEntry {
  timestamp: string
  level: string
  message: string
  correlationId: string
  meta: any
  hostname: string
  pid: number
  environment: string
}
```

### React Log Viewer Component

```typescript
// web/src/logging/components/LogViewer.tsx
import React, { useState, useEffect, useMemo } from 'react'
import { useLogs } from '../hooks/useLogs'
import { LogSearch } from './LogSearch'

interface LogViewerProps {
  defaultFilters?: LogFilters
  realTime?: boolean
  maxLogs?: number
}

export const LogViewer: React.FC<LogViewerProps> = ({
  defaultFilters = {},
  realTime = false,
  maxLogs = 1000,
}) => {
  const [filters, setFilters] = useState<LogFilters>(defaultFilters)
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null)
  const [autoScroll, setAutoScroll] = useState(true)

  const { logs, loading, error, refresh, subscribe } = useLogs({
    filters,
    realTime,
    maxLogs,
  })

  useEffect(() => {
    if (realTime) {
      const unsubscribe = subscribe()
      return unsubscribe
    }
  }, [realTime, subscribe])

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      if (filters.level && !passesLevelFilter(log.level, filters.level)) {
        return false
      }

      if (filters.search && !log.message.toLowerCase().includes(filters.search.toLowerCase())) {
        return false
      }

      if (filters.correlationId && log.correlationId !== filters.correlationId) {
        return false
      }

      if (filters.dateFrom && new Date(log.timestamp) < new Date(filters.dateFrom)) {
        return false
      }

      if (filters.dateTo && new Date(log.timestamp) > new Date(filters.dateTo)) {
        return false
      }

      return true
    })
  }, [logs, filters])

  const passesLevelFilter = (logLevel: string, filterLevel: string): boolean => {
    const levels = ['error', 'warn', 'info', 'debug', 'trace']
    const logIndex = levels.indexOf(logLevel)
    const filterIndex = levels.indexOf(filterLevel)
    return logIndex <= filterIndex
  }

  const getLevelColor = (level: string): string => {
    switch (level) {
      case 'error': return 'text-red-600'
      case 'warn': return 'text-yellow-600'
      case 'info': return 'text-blue-600'
      case 'debug': return 'text-gray-600'
      case 'trace': return 'text-gray-400'
      default: return 'text-gray-800'
    }
  }

  const formatTimestamp = (timestamp: string): string => {
    return new Date(timestamp).toLocaleString()
  }

  if (loading) {
    return <div className="loading">Loading logs...</div>
  }

  if (error) {
    return <div className="error">Error loading logs: {error.message}</div>
  }

  return (
    <div className="log-viewer">
      <div className="log-viewer-header">
        <h2>Log Viewer</h2>
        <div className="log-viewer-controls">
          <LogSearch filters={filters} onFiltersChange={setFilters} />

          <div className="controls-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
              />
              Auto-scroll
            </label>

            <button onClick={refresh} className="refresh-button">
              Refresh
            </button>

            <span className="log-count">
              {filteredLogs.length} logs
            </span>
          </div>
        </div>
      </div>

      <div className="log-viewer-content">
        <div className="log-list">
          {filteredLogs.length === 0 ? (
            <div className="no-logs">No logs match the current filters</div>
          ) : (
            <div className="log-entries">
              {filteredLogs.map((log, index) => (
                <div
                  key={`${log.timestamp}-${index}`}
                  className={`log-entry ${log.level} ${
                    selectedLog === log ? 'selected' : ''
                  }`}
                  onClick={() => setSelectedLog(log)}
                >
                  <div className="log-entry-header">
                    <span className="log-timestamp">
                      {formatTimestamp(log.timestamp)}
                    </span>
                    <span className={`log-level ${getLevelColor(log.level)}`}>
                      {log.level.toUpperCase()}
                    </span>
                    {log.correlationId && (
                      <span className="correlation-id">
                        {log.correlationId.substring(0, 8)}
                      </span>
                    )}
                  </div>

                  <div className="log-message">
                    {log.message}
                  </div>

                  {log.meta && Object.keys(log.meta).length > 0 && (
                    <div className="log-meta-preview">
                      {Object.keys(log.meta).slice(0, 3).map(key => (
                        <span key={key} className="meta-item">
                          {key}: {JSON.stringify(log.meta[key]).substring(0, 50)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedLog && (
          <div className="log-details">
            <div className="log-details-header">
              <h3>Log Details</h3>
              <button onClick={() => setSelectedLog(null)}>×</button>
            </div>

            <div className="log-details-content">
              <div className="detail-section">
                <h4>Basic Information</h4>
                <table>
                  <tbody>
                    <tr>
                      <td>Timestamp:</td>
                      <td>{formatTimestamp(selectedLog.timestamp)}</td>
                    </tr>
                    <tr>
                      <td>Level:</td>
                      <td className={getLevelColor(selectedLog.level)}>
                        {selectedLog.level.toUpperCase()}
                      </td>
                    </tr>
                    <tr>
                      <td>Message:</td>
                      <td>{selectedLog.message}</td>
                    </tr>
                    {selectedLog.correlationId && (
                      <tr>
                        <td>Correlation ID:</td>
                        <td>{selectedLog.correlationId}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {selectedLog.meta && Object.keys(selectedLog.meta).length > 0 && (
                <div className="detail-section">
                  <h4>Metadata</h4>
                  <pre className="metadata-json">
                    {JSON.stringify(selectedLog.meta, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.performance && (
                <div className="detail-section">
                  <h4>Performance Metrics</h4>
                  <pre className="performance-json">
                    {JSON.stringify(selectedLog.performance, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

interface LogFilters {
  level?: string
  search?: string
  correlationId?: string
  dateFrom?: string
  dateTo?: string
}

interface LogEntry {
  timestamp: string
  level: string
  message: string
  correlationId?: string
  meta?: any
  performance?: any
}
```

### Log GraphQL Resolvers

```typescript
// api/src/logging/resolvers/loggingResolvers.ts
import { LoggingService } from '../services/loggingService'
import { requireAuth } from '../../auth/middleware'

const loggingService = new LoggingService()

export const loggingResolvers = {
  Query: {
    logs: requireAuth(
      async (parent: any, { filters, pagination }: { filters: LogFilters; pagination: Pagination }, context: any) => {
        return loggingService.getLogs(filters, pagination)
      },
    ),

    logMetrics: requireAuth(async (parent: any, { timeRange }: { timeRange: string }, context: any) => {
      return loggingService.getLogMetrics(timeRange)
    }),

    errorSummary: requireAuth(async (parent: any, { timeRange }: { timeRange: string }, context: any) => {
      return loggingService.getErrorSummary(timeRange)
    }),
  },

  Mutation: {
    exportLogs: requireAuth(
      async (parent: any, { filters, format }: { filters: LogFilters; format: string }, context: any) => {
        const exportUrl = await loggingService.exportLogs(filters, format)

        return {
          url: exportUrl,
          format,
          message: 'Log export initiated',
        }
      },
    ),

    purgeLogs: requireAuth(async (parent: any, { olderThan }: { olderThan: string }, context: any) => {
      const deletedCount = await loggingService.purgeLogs(olderThan)

      return {
        deletedCount,
        message: `Purged ${deletedCount} log entries`,
      }
    }),
  },

  Subscription: {
    logsUpdated: {
      subscribe: () => loggingService.subscribeToLogs(),
      resolve: (payload: any) => payload,
    },
  },
}

interface LogFilters {
  level?: string
  search?: string
  correlationId?: string
  dateFrom?: string
  dateTo?: string
}

interface Pagination {
  offset?: number
  limit?: number
}
```

## Database Schema

```prisma
// Add to schema.prisma
model LogEntry {
  id            String   @id @default(cuid())
  timestamp     DateTime
  level         String   // error, warn, info, debug, trace
  message       String   @db.Text
  correlationId String?
  meta          Json?
  hostname      String?
  pid           Int?
  environment   String?
  performance   Json?    // Performance metrics
  createdAt     DateTime @default(now())

  @@index([timestamp])
  @@index([level])
  @@index([correlationId])
  @@map("log_entries")
}

model ErrorSummary {
  id            String   @id @default(cuid())
  errorHash     String   @unique // Hash of error message + stack trace
  message       String   @db.Text
  stack         String?  @db.Text
  count         Int      @default(1)
  firstSeen     DateTime @default(now())
  lastSeen      DateTime @default(now())
  environment   String?

  @@index([lastSeen])
  @@index([count])
  @@map("error_summaries")
}

model LogMetric {
  id          String   @id @default(cuid())
  timestamp   DateTime @default(now())
  level       String
  count       Int
  avgDuration Float?   // Average request/operation duration
  p95Duration Float?   // 95th percentile duration
  errorRate   Float?   // Error rate percentage

  @@unique([timestamp, level])
  @@index([timestamp])
  @@map("log_metrics")
}

model LogRetention {
  id            String   @id @default(cuid())
  retentionDays Int
  level         String?  // Specific level or null for all
  environment   String?  // Specific environment or null for all
  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())

  @@map("log_retention_policies")
}
```

## Installation Steps

1. **Install Logging Dependencies**

   ```bash
   # Backend
   pnpm add winston winston-daily-rotate-file @elastic/elasticsearch aws-sdk
   pnpm add -D @types/winston

   # Frontend
   pnpm add date-fns react-json-view
   ```

2. **Configure Environment Variables**

   ```env
   # Logging Configuration
   LOG_LEVEL=info
   LOG_FORMAT=json
   LOG_CONSOLE_ENABLED=true
   LOG_FILE_ENABLED=true
   LOG_FILE_PATH=./logs/app.log
   LOG_FILE_MAX_SIZE=10MB
   LOG_FILE_MAX_FILES=5

   # Remote Logging (choose one)
   ELASTICSEARCH_URL=http://localhost:9200
   ELASTICSEARCH_INDEX=app-logs

   # Datadog
   DATADOG_API_KEY=your-datadog-api-key
   DATADOG_SERVICE=your-app-name

   # AWS CloudWatch
   AWS_REGION=us-east-1
   CLOUDWATCH_LOG_GROUP=/aws/lambda/your-function

   # Correlation
   CORRELATION_HEADER=x-correlation-id
   GENERATE_CORRELATION_IDS=true
   ```

3. **Database Migration**

   ```bash
   pnpm prisma migrate dev --name add-logging-system
   ```

4. **Setup Log Aggregation (Optional)**

   ```bash
   # Elasticsearch with Docker
   docker run -d --name elasticsearch -p 9200:9200 -e "discovery.type=single-node" elasticsearch:8.5.0

   # Or use cloud services like AWS CloudWatch, Datadog, etc.
   ```

This logging system provides enterprise-grade observability with structured logging, multiple outputs, performance monitoring, and comprehensive error tracking capabilities.
