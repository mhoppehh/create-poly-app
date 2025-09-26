# Caching System

## Overview

High-performance multi-layer caching system supporting Redis, in-memory cache, and database query optimization with cache invalidation and analytics.

## Priority

**HIGH** - Critical for application performance and scalability

## Dependencies

- `apollo-server` (for GraphQL caching directives)
- `prisma` (for database query optimization)

## Feature Description

Comprehensive caching infrastructure with multiple storage backends, intelligent cache invalidation, query optimization, and performance monitoring to dramatically improve application responsiveness.

### Key Features

- **Multi-Layer Caching**: Redis, in-memory, HTTP response caching
- **Smart Invalidation**: Tag-based, time-based, event-driven invalidation
- **Query Optimization**: Database query result caching, prepared statements
- **Cache Analytics**: Hit rates, performance metrics, cache efficiency
- **Distribution Support**: Distributed caching across multiple instances
- **Compression**: Automatic data compression for optimal storage
- **Cache Warming**: Proactive cache population strategies

## Configuration

```typescript
interface CacheConfig {
  layers: {
    memory: {
      enabled: boolean
      maxSize: string // e.g., '100MB'
      ttlDefault: number // seconds
      algorithm: 'lru' | 'lfu' | 'fifo'
    }
    redis: {
      enabled: boolean
      host: string
      port: number
      password?: string
      db: number
      ttlDefault: number
      compression: boolean
      serialization: 'json' | 'msgpack'
    }
    http: {
      enabled: boolean
      publicCacheMaxAge: number
      privateCacheMaxAge: number
      staleWhileRevalidate: number
    }
  }
  strategies: {
    cacheFirst: string[] // Cache keys that prefer cached data
    networkFirst: string[] // Cache keys that prefer fresh data
    staleWhileRevalidate: string[] // Background refresh patterns
  }
  invalidation: {
    tags: {
      enabled: boolean
      globalTags: string[]
    }
    events: {
      enabled: boolean
      patterns: Array<{
        event: string
        invalidatePattern: string
      }>
    }
    manual: {
      enabledPatterns: string[]
    }
  }
  monitoring: {
    enabled: boolean
    metricsInterval: number
    alertThresholds: {
      hitRateMin: number
      responseTimeMax: number
      errorRateMax: number
    }
  }
  warming: {
    enabled: boolean
    strategies: Array<{
      pattern: string
      schedule: string // cron expression
      priority: number
    }>
  }
}
```

## Generated Files

### Backend Implementation

```
api/src/
├── cache/
│   ├── index.ts                  # Cache exports
│   ├── providers/
│   │   ├── memoryCache.ts        # In-memory cache provider
│   │   ├── redisCache.ts         # Redis cache provider
│   │   └── multiLayerCache.ts    # Multi-layer cache manager
│   ├── services/
│   │   ├── cacheService.ts       # Main cache service
│   │   ├── invalidationService.ts # Cache invalidation service
│   │   ├── warmingService.ts     # Cache warming service
│   │   ├── compressionService.ts # Data compression service
│   │   └── analyticsService.ts   # Cache analytics service
│   ├── middleware/
│   │   ├── cacheMiddleware.ts    # Express cache middleware
│   │   ├── graphqlCacheMiddleware.ts # GraphQL cache directives
│   │   └── httpCacheMiddleware.ts # HTTP response caching
│   ├── decorators/
│   │   ├── cacheable.ts          # Method caching decorator
│   │   ├── cacheInvalidate.ts    # Invalidation decorator
│   │   └── cacheKey.ts           # Cache key generation
│   ├── resolvers/
│   │   ├── cacheResolvers.ts     # Cache management resolvers
│   │   └── analyticsResolvers.ts # Cache analytics resolvers
│   ├── jobs/
│   │   ├── cacheWarmingJob.ts    # Cache warming background job
│   │   ├── cacheCleanupJob.ts    # Cache cleanup job
│   │   └── analyticsJob.ts       # Analytics collection job
│   ├── utils/
│   │   ├── keyGenerator.ts       # Cache key generation utilities
│   │   ├── serialization.ts     # Data serialization utilities
│   │   └── compression.ts        # Data compression utilities
│   └── types.ts                  # Cache type definitions
```

### Frontend Implementation

```
web/src/
├── cache/
│   ├── index.ts                  # Cache exports
│   ├── components/
│   │   ├── CacheDashboard.tsx    # Cache monitoring dashboard
│   │   ├── CacheMetrics.tsx      # Cache performance metrics
│   │   ├── CacheInvalidation.tsx # Manual cache invalidation
│   │   └── CacheConfiguration.tsx # Cache settings management
│   ├── hooks/
│   │   ├── useCache.ts           # Cache management hook
│   │   ├── useCacheMetrics.ts    # Cache analytics hook
│   │   └── useCachedQuery.ts     # Cached GraphQL queries hook
│   ├── services/
│   │   ├── cacheApi.ts           # Cache API service
│   │   └── cacheClient.ts        # Client-side cache service
│   ├── providers/
│   │   └── CacheProvider.tsx     # Cache context provider
│   └── utils/
│       ├── cacheKeys.ts          # Cache key constants
│       └── cacheUtils.ts         # Cache utilities
```

## Code Examples

### Multi-Layer Cache Service (Backend)

```typescript
// api/src/cache/services/cacheService.ts
import { MemoryCache } from '../providers/memoryCache'
import { RedisCache } from '../providers/redisCache'
import { InvalidationService } from './invalidationService'
import { AnalyticsService } from './analyticsService'
import { CompressionService } from './compressionService'

export class CacheService {
  private memoryCache?: MemoryCache
  private redisCache?: RedisCache
  private invalidationService: InvalidationService
  private analyticsService: AnalyticsService
  private compressionService: CompressionService

  constructor(private config: CacheConfig) {
    this.invalidationService = new InvalidationService(config.invalidation)
    this.analyticsService = new AnalyticsService(config.monitoring)
    this.compressionService = new CompressionService()

    this.initializeProviders()
  }

  private initializeProviders() {
    if (this.config.layers.memory.enabled) {
      this.memoryCache = new MemoryCache(this.config.layers.memory)
    }

    if (this.config.layers.redis.enabled) {
      this.redisCache = new RedisCache(this.config.layers.redis)
    }
  }

  async get<T>(key: string, options: CacheGetOptions = {}): Promise<T | null> {
    const startTime = Date.now()
    const strategy = this.getStrategy(key)

    try {
      let value: T | null = null
      let source = 'miss'

      // Try memory cache first if enabled
      if (this.memoryCache && strategy !== 'network-first') {
        value = await this.memoryCache.get<T>(key)
        if (value !== null) {
          source = 'memory'
        }
      }

      // Try Redis if memory cache missed
      if (value === null && this.redisCache) {
        const redisValue = await this.redisCache.get(key)
        if (redisValue !== null) {
          const decompressed = await this.compressionService.decompress(redisValue)
          value = JSON.parse(decompressed) as T
          source = 'redis'

          // Populate memory cache for faster subsequent access
          if (this.memoryCache) {
            await this.memoryCache.set(key, value, options.ttl)
          }
        }
      }

      // Record analytics
      await this.analyticsService.recordGet(key, source, Date.now() - startTime)

      return value
    } catch (error) {
      await this.analyticsService.recordError(key, 'get', error.message)
      throw error
    }
  }

  async set<T>(key: string, value: T, options: CacheSetOptions = {}): Promise<void> {
    const startTime = Date.now()

    try {
      const serialized = JSON.stringify(value)
      const compressed = await this.compressionService.compress(serialized)

      // Set in memory cache
      if (this.memoryCache) {
        await this.memoryCache.set(key, value, options.ttl)
      }

      // Set in Redis cache
      if (this.redisCache) {
        await this.redisCache.set(key, compressed, options.ttl)
      }

      // Register tags for invalidation
      if (options.tags) {
        await this.invalidationService.registerTags(key, options.tags)
      }

      await this.analyticsService.recordSet(key, Date.now() - startTime)
    } catch (error) {
      await this.analyticsService.recordError(key, 'set', error.message)
      throw error
    }
  }

  async getOrSet<T>(key: string, factory: () => Promise<T>, options: CacheSetOptions = {}): Promise<T> {
    const cached = await this.get<T>(key, options)

    if (cached !== null) {
      return cached
    }

    // Handle stale-while-revalidate strategy
    if (this.isStaleWhileRevalidate(key)) {
      const staleValue = await this.getStale<T>(key)
      if (staleValue !== null) {
        // Background refresh
        this.refreshInBackground(key, factory, options)
        return staleValue
      }
    }

    const value = await factory()
    await this.set(key, value, options)

    return value
  }

  async invalidate(pattern: string): Promise<number> {
    const startTime = Date.now()

    try {
      let invalidatedCount = 0

      // Invalidate from memory cache
      if (this.memoryCache) {
        invalidatedCount += await this.memoryCache.invalidatePattern(pattern)
      }

      // Invalidate from Redis
      if (this.redisCache) {
        invalidatedCount += await this.redisCache.invalidatePattern(pattern)
      }

      await this.analyticsService.recordInvalidation(pattern, invalidatedCount, Date.now() - startTime)

      return invalidatedCount
    } catch (error) {
      await this.analyticsService.recordError(pattern, 'invalidate', error.message)
      throw error
    }
  }

  async invalidateByTags(tags: string[]): Promise<number> {
    return this.invalidationService.invalidateByTags(tags, {
      memoryCache: this.memoryCache,
      redisCache: this.redisCache,
    })
  }

  async clear(): Promise<void> {
    if (this.memoryCache) {
      await this.memoryCache.clear()
    }

    if (this.redisCache) {
      await this.redisCache.clear()
    }

    await this.analyticsService.recordClear()
  }

  async getStats(): Promise<CacheStats> {
    const memoryStats = this.memoryCache ? await this.memoryCache.getStats() : null
    const redisStats = this.redisCache ? await this.redisCache.getStats() : null
    const analyticsStats = await this.analyticsService.getStats()

    return {
      memory: memoryStats,
      redis: redisStats,
      analytics: analyticsStats,
      uptime: Date.now() - this.startTime,
    }
  }

  async warmCache(patterns: string[]): Promise<void> {
    // Cache warming implementation
    for (const pattern of patterns) {
      await this.warmCachePattern(pattern)
    }
  }

  private getStrategy(key: string): CacheStrategy {
    if (this.config.strategies.networkFirst.some(pattern => key.includes(pattern))) {
      return 'network-first'
    }

    if (this.config.strategies.staleWhileRevalidate.some(pattern => key.includes(pattern))) {
      return 'stale-while-revalidate'
    }

    return 'cache-first'
  }

  private isStaleWhileRevalidate(key: string): boolean {
    return this.config.strategies.staleWhileRevalidate.some(pattern => key.includes(pattern))
  }

  private async getStale<T>(key: string): Promise<T | null> {
    const staleKey = `${key}:stale`
    return this.get<T>(staleKey)
  }

  private async refreshInBackground<T>(
    key: string,
    factory: () => Promise<T>,
    options: CacheSetOptions,
  ): Promise<void> {
    // Don't await - let this run in background
    setImmediate(async () => {
      try {
        const newValue = await factory()
        await this.set(key, newValue, options)

        // Keep stale version for a bit
        const staleKey = `${key}:stale`
        await this.set(staleKey, newValue, { ttl: 300 }) // 5 minutes
      } catch (error) {
        console.error('Background refresh failed:', error)
      }
    })
  }

  private async warmCachePattern(pattern: string): Promise<void> {
    // Implementation for cache warming based on patterns
    // This would typically involve pre-loading commonly accessed data
  }

  private startTime = Date.now()
}

interface CacheGetOptions {
  ttl?: number
}

interface CacheSetOptions {
  ttl?: number
  tags?: string[]
}

interface CacheStats {
  memory: any
  redis: any
  analytics: any
  uptime: number
}

type CacheStrategy = 'cache-first' | 'network-first' | 'stale-while-revalidate'
```

### Redis Cache Provider

```typescript
// api/src/cache/providers/redisCache.ts
import Redis from 'ioredis'

export class RedisCache {
  private client: Redis
  private subscriber: Redis
  private isConnected = false

  constructor(private config: RedisCacheConfig) {
    this.client = new Redis({
      host: config.host,
      port: config.port,
      password: config.password,
      db: config.db,
      retryDelayOnFailover: 1000,
      maxRetriesPerRequest: 3,
    })

    this.subscriber = new Redis({
      host: config.host,
      port: config.port,
      password: config.password,
      db: config.db,
    })

    this.setupEventHandlers()
  }

  private setupEventHandlers() {
    this.client.on('connect', () => {
      this.isConnected = true
      console.log('Redis cache connected')
    })

    this.client.on('error', error => {
      console.error('Redis cache error:', error)
    })

    this.client.on('close', () => {
      this.isConnected = false
      console.log('Redis cache disconnected')
    })
  }

  async get(key: string): Promise<string | null> {
    if (!this.isConnected) return null

    try {
      return await this.client.get(key)
    } catch (error) {
      console.error('Redis get error:', error)
      return null
    }
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (!this.isConnected) return

    try {
      const actualTtl = ttl || this.config.ttlDefault

      if (actualTtl > 0) {
        await this.client.setex(key, actualTtl, value)
      } else {
        await this.client.set(key, value)
      }
    } catch (error) {
      console.error('Redis set error:', error)
      throw error
    }
  }

  async delete(key: string): Promise<number> {
    if (!this.isConnected) return 0

    try {
      return await this.client.del(key)
    } catch (error) {
      console.error('Redis delete error:', error)
      return 0
    }
  }

  async invalidatePattern(pattern: string): Promise<number> {
    if (!this.isConnected) return 0

    try {
      const keys = await this.client.keys(pattern)
      if (keys.length === 0) return 0

      return await this.client.del(...keys)
    } catch (error) {
      console.error('Redis pattern invalidation error:', error)
      return 0
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.isConnected) return false

    try {
      const result = await this.client.exists(key)
      return result === 1
    } catch (error) {
      console.error('Redis exists error:', error)
      return false
    }
  }

  async clear(): Promise<void> {
    if (!this.isConnected) return

    try {
      await this.client.flushdb()
    } catch (error) {
      console.error('Redis clear error:', error)
      throw error
    }
  }

  async getStats(): Promise<RedisCacheStats> {
    if (!this.isConnected) {
      return {
        connected: false,
        keyCount: 0,
        memoryUsage: 0,
        hitRate: 0,
      }
    }

    try {
      const info = await this.client.info('memory')
      const dbsize = await this.client.dbsize()
      const stats = await this.client.info('stats')

      // Parse memory info
      const memoryUsage = this.parseInfoValue(info, 'used_memory')

      // Parse stats info
      const keyspaceHits = this.parseInfoValue(stats, 'keyspace_hits')
      const keyspaceMisses = this.parseInfoValue(stats, 'keyspace_misses')
      const hitRate = keyspaceHits + keyspaceMisses > 0 ? (keyspaceHits / (keyspaceHits + keyspaceMisses)) * 100 : 0

      return {
        connected: true,
        keyCount: dbsize,
        memoryUsage,
        hitRate,
        keyspaceHits,
        keyspaceMisses,
      }
    } catch (error) {
      console.error('Redis stats error:', error)
      return {
        connected: false,
        keyCount: 0,
        memoryUsage: 0,
        hitRate: 0,
      }
    }
  }

  async mget(keys: string[]): Promise<(string | null)[]> {
    if (!this.isConnected || keys.length === 0) return []

    try {
      return await this.client.mget(...keys)
    } catch (error) {
      console.error('Redis mget error:', error)
      return keys.map(() => null)
    }
  }

  async mset(pairs: Array<[string, string]>, ttl?: number): Promise<void> {
    if (!this.isConnected || pairs.length === 0) return

    try {
      const pipeline = this.client.pipeline()

      pairs.forEach(([key, value]) => {
        if (ttl && ttl > 0) {
          pipeline.setex(key, ttl, value)
        } else {
          pipeline.set(key, value)
        }
      })

      await pipeline.exec()
    } catch (error) {
      console.error('Redis mset error:', error)
      throw error
    }
  }

  async subscribe(pattern: string, callback: (key: string) => void): Promise<void> {
    try {
      await this.subscriber.psubscribe(pattern)

      this.subscriber.on('pmessage', (pattern, channel, message) => {
        callback(channel)
      })
    } catch (error) {
      console.error('Redis subscription error:', error)
    }
  }

  async publish(channel: string, message: string): Promise<void> {
    if (!this.isConnected) return

    try {
      await this.client.publish(channel, message)
    } catch (error) {
      console.error('Redis publish error:', error)
    }
  }

  private parseInfoValue(info: string, key: string): number {
    const match = info.match(new RegExp(`${key}:(\\d+)`))
    return match ? parseInt(match[1], 10) : 0
  }

  async disconnect(): Promise<void> {
    await this.client.quit()
    await this.subscriber.quit()
  }
}

interface RedisCacheConfig {
  host: string
  port: number
  password?: string
  db: number
  ttlDefault: number
  compression: boolean
  serialization: 'json' | 'msgpack'
}

interface RedisCacheStats {
  connected: boolean
  keyCount: number
  memoryUsage: number
  hitRate: number
  keyspaceHits?: number
  keyspaceMisses?: number
}
```

### Cache Middleware

```typescript
// api/src/cache/middleware/cacheMiddleware.ts
import { Request, Response, NextFunction } from 'express'
import { CacheService } from '../services/cacheService'

export class CacheMiddleware {
  constructor(private cacheService: CacheService) {}

  cache(options: CacheMiddlewareOptions = {}) {
    return async (req: Request, res: Response, next: NextFunction) => {
      const {
        ttl = 300,
        keyGenerator = this.defaultKeyGenerator,
        condition = () => true,
        tags = [],
        vary = [],
      } = options

      // Skip caching if condition not met
      if (!condition(req)) {
        return next()
      }

      // Only cache GET requests
      if (req.method !== 'GET') {
        return next()
      }

      const cacheKey = keyGenerator(req)

      try {
        // Try to get from cache
        const cachedResponse = await this.cacheService.get<CachedResponse>(cacheKey)

        if (cachedResponse) {
          // Set cache headers
          res.set('X-Cache', 'HIT')
          res.set('Cache-Control', `max-age=${ttl}`)

          // Set vary headers
          if (vary.length > 0) {
            res.vary(vary)
          }

          return res.status(cachedResponse.status).set(cachedResponse.headers).send(cachedResponse.body)
        }

        // Cache miss - intercept response
        res.set('X-Cache', 'MISS')

        const originalSend = res.send
        const originalJson = res.json
        const originalStatus = res.status

        let statusCode = 200
        let responseBody: any
        let responseHeaders: Record<string, string> = {}

        // Override status method
        res.status = function (code: number) {
          statusCode = code
          return originalStatus.call(this, code)
        }

        // Override send method
        res.send = function (body: any) {
          responseBody = body
          responseHeaders = { ...res.getHeaders() } as Record<string, string>

          // Cache successful responses
          if (statusCode >= 200 && statusCode < 300) {
            setImmediate(async () => {
              try {
                await cacheService.set(
                  cacheKey,
                  {
                    status: statusCode,
                    headers: responseHeaders,
                    body: responseBody,
                  },
                  { ttl, tags },
                )
              } catch (error) {
                console.error('Cache set error:', error)
              }
            })
          }

          return originalSend.call(this, body)
        }

        // Override json method
        res.json = function (obj: any) {
          responseBody = obj
          responseHeaders = { ...res.getHeaders() } as Record<string, string>

          if (statusCode >= 200 && statusCode < 300) {
            setImmediate(async () => {
              try {
                await cacheService.set(
                  cacheKey,
                  {
                    status: statusCode,
                    headers: responseHeaders,
                    body: obj,
                  },
                  { ttl, tags },
                )
              } catch (error) {
                console.error('Cache set error:', error)
              }
            })
          }

          return originalJson.call(this, obj)
        }

        next()
      } catch (error) {
        console.error('Cache middleware error:', error)
        next()
      }
    }
  }

  private defaultKeyGenerator(req: Request): string {
    const baseUrl = req.originalUrl || req.url
    const query = req.query ? JSON.stringify(req.query) : ''
    const user = (req as any).user?.id || 'anonymous'

    return `http:${req.method}:${baseUrl}:${query}:${user}`
  }

  invalidate(pattern: string) {
    return async (req: Request, res: Response, next: NextFunction) => {
      const originalSend = res.send

      res.send = function (body: any) {
        // Invalidate cache after successful response
        if (res.statusCode >= 200 && res.statusCode < 300) {
          setImmediate(async () => {
            try {
              await cacheService.invalidate(pattern)
            } catch (error) {
              console.error('Cache invalidation error:', error)
            }
          })
        }

        return originalSend.call(this, body)
      }

      next()
    }
  }
}

interface CacheMiddlewareOptions {
  ttl?: number
  keyGenerator?: (req: Request) => string
  condition?: (req: Request) => boolean
  tags?: string[]
  vary?: string[]
}

interface CachedResponse {
  status: number
  headers: Record<string, string>
  body: any
}
```

### React Cache Dashboard

```typescript
// web/src/cache/components/CacheDashboard.tsx
import React, { useState, useEffect } from 'react'
import { useCacheMetrics } from '../hooks/useCacheMetrics'
import { CacheMetrics } from './CacheMetrics'
import { CacheInvalidation } from './CacheInvalidation'

export const CacheDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'metrics' | 'invalidation' | 'configuration'>('metrics')
  const [refreshInterval, setRefreshInterval] = useState(5000)
  const { metrics, loading, error, refresh } = useCacheMetrics()

  useEffect(() => {
    const interval = setInterval(() => {
      refresh()
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [refreshInterval, refresh])

  if (loading) {
    return <div className="loading">Loading cache dashboard...</div>
  }

  if (error) {
    return <div className="error">Error loading cache data: {error.message}</div>
  }

  return (
    <div className="cache-dashboard">
      <div className="dashboard-header">
        <h1>Cache Dashboard</h1>
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
          <button onClick={refresh}>Refresh Now</button>
        </div>
      </div>

      <div className="dashboard-tabs">
        <button
          className={`tab ${activeTab === 'metrics' ? 'active' : ''}`}
          onClick={() => setActiveTab('metrics')}
        >
          Metrics
        </button>
        <button
          className={`tab ${activeTab === 'invalidation' ? 'active' : ''}`}
          onClick={() => setActiveTab('invalidation')}
        >
          Cache Control
        </button>
        <button
          className={`tab ${activeTab === 'configuration' ? 'active' : ''}`}
          onClick={() => setActiveTab('configuration')}
        >
          Configuration
        </button>
      </div>

      <div className="dashboard-content">
        {activeTab === 'metrics' && (
          <div className="metrics-tab">
            <div className="cache-overview">
              <div className="overview-cards">
                <div className="metric-card">
                  <h3>Hit Rate</h3>
                  <div className="metric-value">
                    {(metrics.analytics.hitRate * 100).toFixed(1)}%
                  </div>
                  <div className={`metric-trend ${metrics.analytics.hitRateTrend > 0 ? 'up' : 'down'}`}>
                    {metrics.analytics.hitRateTrend > 0 ? '↗' : '↘'}
                    {Math.abs(metrics.analytics.hitRateTrend).toFixed(1)}%
                  </div>
                </div>

                <div className="metric-card">
                  <h3>Memory Usage</h3>
                  <div className="metric-value">
                    {(metrics.memory.used / 1024 / 1024).toFixed(0)}MB
                  </div>
                  <div className="metric-secondary">
                    of {(metrics.memory.total / 1024 / 1024).toFixed(0)}MB
                  </div>
                </div>

                <div className="metric-card">
                  <h3>Redis Keys</h3>
                  <div className="metric-value">
                    {metrics.redis.keyCount.toLocaleString()}
                  </div>
                  <div className="metric-secondary">
                    {(metrics.redis.memoryUsage / 1024 / 1024).toFixed(1)}MB used
                  </div>
                </div>

                <div className="metric-card">
                  <h3>Avg Response Time</h3>
                  <div className="metric-value">
                    {metrics.analytics.avgResponseTime.toFixed(0)}ms
                  </div>
                  <div className={`metric-trend ${metrics.analytics.responseTrend < 0 ? 'up' : 'down'}`}>
                    {metrics.analytics.responseTrend < 0 ? '↗' : '↘'}
                    {Math.abs(metrics.analytics.responseTrend).toFixed(0)}ms
                  </div>
                </div>
              </div>
            </div>

            <CacheMetrics metrics={metrics} />
          </div>
        )}

        {activeTab === 'invalidation' && (
          <CacheInvalidation onInvalidate={refresh} />
        )}

        {activeTab === 'configuration' && (
          <div className="configuration-tab">
            <h2>Cache Configuration</h2>
            {/* Cache configuration interface */}
          </div>
        )}
      </div>
    </div>
  )
}
```

### Cache GraphQL Resolvers

```typescript
// api/src/cache/resolvers/cacheResolvers.ts
import { CacheService } from '../services/cacheService'
import { requireAuth } from '../../auth/middleware'

const cacheService = new CacheService()

export const cacheResolvers = {
  Mutation: {
    invalidateCache: requireAuth(async (parent: any, { pattern }: { pattern: string }, context: any) => {
      const invalidatedCount = await cacheService.invalidate(pattern)

      return {
        success: true,
        invalidatedCount,
        message: `Invalidated ${invalidatedCount} cache entries`,
      }
    }),

    invalidateCacheByTags: requireAuth(async (parent: any, { tags }: { tags: string[] }, context: any) => {
      const invalidatedCount = await cacheService.invalidateByTags(tags)

      return {
        success: true,
        invalidatedCount,
        message: `Invalidated ${invalidatedCount} cache entries by tags`,
      }
    }),

    clearCache: requireAuth(async (parent: any, args: any, context: any) => {
      await cacheService.clear()

      return {
        success: true,
        message: 'Cache cleared successfully',
      }
    }),

    warmCache: requireAuth(async (parent: any, { patterns }: { patterns: string[] }, context: any) => {
      await cacheService.warmCache(patterns)

      return {
        success: true,
        message: 'Cache warming initiated',
      }
    }),
  },

  Query: {
    cacheStats: requireAuth(async (parent: any, args: any, context: any) => {
      return cacheService.getStats()
    }),

    cacheMetrics: requireAuth(async (parent: any, { timeRange }: { timeRange: string }, context: any) => {
      // Implementation for detailed cache metrics over time
      return {
        hitRate: 0.85,
        avgResponseTime: 45,
        totalRequests: 10000,
        cacheHits: 8500,
        cacheMisses: 1500,
        timeline: [],
      }
    }),
  },
}
```

## Database Schema

```prisma
// Add to schema.prisma
model CacheEntry {
  id            String    @id @default(cuid())
  key           String    @unique
  value         Bytes     // Compressed data
  tags          String[]  // For tag-based invalidation
  expiresAt     DateTime?
  accessCount   Int       @default(0)
  lastAccessed  DateTime  @default(now())
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@index([expiresAt])
  @@index([tags])
  @@map("cache_entries")
}

model CacheMetric {
  id            String   @id @default(cuid())
  timestamp     DateTime @default(now())
  cacheKey      String?
  operation     String   // 'get', 'set', 'invalidate'
  hit           Boolean?
  responseTime  Float    // milliseconds
  source        String?  // 'memory', 'redis', 'miss'
  tags          String[]
  error         String?  @db.Text

  @@index([timestamp])
  @@index([cacheKey])
  @@map("cache_metrics")
}

model CacheConfiguration {
  id                    String   @id @default(cuid())
  name                  String   @unique
  pattern               String
  ttl                   Int      // seconds
  strategy              String   // 'cache-first', 'network-first', etc.
  tags                  String[]
  warmingEnabled        Boolean  @default(false)
  warmingSchedule       String?  // cron expression
  compressionEnabled    Boolean  @default(true)
  isActive              Boolean  @default(true)
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt

  @@map("cache_configurations")
}
```

## Installation Steps

1. **Install Caching Dependencies**

   ```bash
   # Backend
   pnpm add ioredis node-cache lru-cache compression msgpack
   pnpm add -D @types/compression

   # Frontend
   pnpm add recharts react-json-view
   ```

2. **Configure Environment Variables**

   ```env
   # Redis Configuration
   REDIS_HOST=localhost
   REDIS_PORT=6379
   REDIS_PASSWORD=your-redis-password
   REDIS_DB=1

   # Cache Configuration
   CACHE_MEMORY_ENABLED=true
   CACHE_REDIS_ENABLED=true
   CACHE_DEFAULT_TTL=300
   CACHE_MAX_MEMORY=100MB

   # Monitoring
   CACHE_MONITORING_ENABLED=true
   CACHE_METRICS_INTERVAL=60
   ```

3. **Database Migration**

   ```bash
   pnpm prisma migrate dev --name add-caching-system
   ```

4. **Start Redis Server**
   ```bash
   # Using Docker
   docker run -d --name redis-cache -p 6379:6379 redis:7-alpine
   ```

This caching system provides enterprise-grade performance optimization with multi-layer caching, intelligent invalidation, and comprehensive monitoring capabilities.
