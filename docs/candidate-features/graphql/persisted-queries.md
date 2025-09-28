# GraphQL Persisted Queries & Query Optimization

## Overview

Automatic persisted queries (APQ) implementation with query whitelisting, caching, and performance optimization for GraphQL operations.

## Priority

**MEDIUM** - Significant performance and security benefits for production applications

## Dependencies

- `apollo-server` (base GraphQL server)
- `apollo-server-plugin-operation-registry` (Apollo Studio integration)
- Redis or in-memory cache for query storage

## Components

### Automatic Persisted Queries (APQ)

- **Query Hashing**: SHA-256 based query identification and caching
- **Query Storage**: Persistent storage of frequently used queries
- **Fallback Mechanism**: Graceful fallback when queries aren't cached
- **Cache Management**: TTL-based cache invalidation and cleanup
- **Network Optimization**: Reduced payload size for repeat queries

### Query Registry

- **Query Whitelisting**: Production-safe query validation and execution
- **Query Versioning**: Manage query versions and deprecation
- **Query Analytics**: Track query usage and performance metrics
- **Query Validation**: Validate queries against schema at build time
- **Query Deployment**: Controlled deployment of new queries

### Performance Optimization

- **Query Complexity Analysis**: Analyze and limit query complexity
- **Query Cost Analysis**: Implement query cost-based rate limiting
- **Query Deduplication**: Prevent duplicate query execution
- **Query Batching**: Batch multiple queries for efficiency
- **Query Caching**: Intelligent caching of query results

### Security Features

- **Query Sanitization**: Prevent malicious query execution
- **Rate Limiting**: Per-query and per-user rate limiting
- **Query Depth Limiting**: Prevent deeply nested queries
- **Query Timeout**: Set execution timeouts for long-running queries
- **Query Logging**: Comprehensive query audit logging

### Development Tools

- **Query Extraction**: Extract queries from application code
- **Query Generation**: Generate persisted query manifests
- **Query Testing**: Validate persisted queries against schema
- **Query Documentation**: Auto-generate query documentation
- **Query Migration**: Handle schema changes and query updates

## Configuration

```typescript
interface PersistedQueriesConfig {
  cache: 'redis' | 'memory' | 'disabled'
  redis?: {
    host: string
    port: number
    password?: string
  }
  ttl?: number
  extractQueries?: boolean
  queryWhitelist?: string[]
}

interface QueryRegistryConfig {
  enabled: boolean
  apolloKey?: string
  schemaTag?: string
  forbidUnregisteredOperations?: boolean
}
```

## Generated Files

```
api/src/
├── persisted-queries/
│   ├── index.ts                    # APQ configuration
│   ├── cache.ts                    # Query cache implementation
│   ├── registry.ts                 # Query registry management
│   ├── extractor.ts                # Query extraction utilities
│   ├── plugins/
│   │   ├── apqPlugin.ts           # APQ Apollo plugin
│   │   ├── whitelistPlugin.ts     # Query whitelist plugin
│   │   └── analyticsPlugin.ts     # Query analytics plugin
│   ├── security/
│   │   ├── complexityAnalysis.ts  # Query complexity analysis
│   │   ├── costAnalysis.ts        # Query cost analysis
│   │   └── rateLimiting.ts        # Query-based rate limiting
│   └── tools/
│       ├── queryExtractor.ts      # Extract queries from code
│       └── manifestGenerator.ts   # Generate query manifests
├── generated/
│   ├── persisted-queries.json     # Query manifest
│   └── query-whitelist.json       # Whitelisted queries
```

## APQ Implementation

```typescript
// persisted-queries/index.ts
import { ApolloServer } from '@apollo/server'
import { ApolloServerPluginCacheControl } from '@apollo/server/plugin/cacheControl'
import responseCachePlugin from '@apollo/server-plugin-response-cache'
import { createAPQPlugin } from './plugins/apqPlugin'
import { createQueryWhitelistPlugin } from './plugins/whitelistPlugin'
import { createQueryAnalyticsPlugin } from './plugins/analyticsPlugin'
import { createPersistedQueryCache } from './cache'

export interface APQConfig {
  cache: 'redis' | 'memory'
  redis?: {
    host: string
    port: number
    password?: string
    db?: number
  }
  ttl?: number
  maxQuerySize?: number
  enableWhitelist?: boolean
  whitelistPath?: string
}

export async function setupAPQ(config: APQConfig) {
  const queryCache = await createPersistedQueryCache(config)

  const plugins = [
    // Automatic Persisted Queries plugin
    createAPQPlugin(queryCache, {
      ttl: config.ttl || 3600, // 1 hour default
      maxQuerySize: config.maxQuerySize || 50000, // 50KB max
    }),

    // Query analytics
    createQueryAnalyticsPlugin(),

    // Response caching
    responseCachePlugin(),

    // Cache control
    ApolloServerPluginCacheControl({ defaultMaxAge: 300 }), // 5 minutes default
  ]

  // Add whitelist plugin if enabled
  if (config.enableWhitelist) {
    plugins.push(
      createQueryWhitelistPlugin({
        whitelistPath: config.whitelistPath || './generated/query-whitelist.json',
      }),
    )
  }

  return plugins
}
```

## Query Cache Implementation

```typescript
// persisted-queries/cache.ts
import Redis from 'ioredis'
import crypto from 'crypto'

export interface QueryCache {
  get(key: string): Promise<string | null>
  set(key: string, query: string, ttl?: number): Promise<void>
  delete(key: string): Promise<void>
  clear(): Promise<void>
  getStats(): Promise<{ hits: number; misses: number; size: number }>
}

export class RedisQueryCache implements QueryCache {
  private redis: Redis
  private stats = { hits: 0, misses: 0 }
  private prefix = 'apq:'

  constructor(options: { host: string; port: number; password?: string; db?: number }) {
    this.redis = new Redis(options)
  }

  async get(key: string): Promise<string | null> {
    const query = await this.redis.get(this.prefix + key)
    if (query) {
      this.stats.hits++
    } else {
      this.stats.misses++
    }
    return query
  }

  async set(key: string, query: string, ttl = 3600): Promise<void> {
    await this.redis.setex(this.prefix + key, ttl, query)
  }

  async delete(key: string): Promise<void> {
    await this.redis.del(this.prefix + key)
  }

  async clear(): Promise<void> {
    const keys = await this.redis.keys(this.prefix + '*')
    if (keys.length > 0) {
      await this.redis.del(...keys)
    }
  }

  async getStats() {
    const size = await this.redis.dbsize()
    return { ...this.stats, size }
  }
}

export class MemoryQueryCache implements QueryCache {
  private cache = new Map<string, { query: string; timestamp: number; ttl: number }>()
  private stats = { hits: 0, misses: 0 }
  private cleanupInterval: NodeJS.Timer

  constructor() {
    // Cleanup expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 60000)
  }

  async get(key: string): Promise<string | null> {
    const entry = this.cache.get(key)

    if (!entry) {
      this.stats.misses++
      return null
    }

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl * 1000) {
      this.cache.delete(key)
      this.stats.misses++
      return null
    }

    this.stats.hits++
    return entry.query
  }

  async set(key: string, query: string, ttl = 3600): Promise<void> {
    this.cache.set(key, {
      query,
      timestamp: Date.now(),
      ttl,
    })
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key)
  }

  async clear(): Promise<void> {
    this.cache.clear()
  }

  async getStats() {
    return { ...this.stats, size: this.cache.size }
  }

  private cleanup() {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl * 1000) {
        this.cache.delete(key)
      }
    }
  }

  destroy() {
    clearInterval(this.cleanupInterval)
  }
}

export async function createPersistedQueryCache(config: {
  cache: 'redis' | 'memory'
  redis?: any
}): Promise<QueryCache> {
  if (config.cache === 'redis' && config.redis) {
    return new RedisQueryCache(config.redis)
  } else {
    return new MemoryQueryCache()
  }
}

export function generateQueryHash(query: string): string {
  return crypto.createHash('sha256').update(query).digest('hex')
}
```

## APQ Apollo Plugin

```typescript
// persisted-queries/plugins/apqPlugin.ts
import { ApolloServerPlugin } from '@apollo/server'
import { QueryCache, generateQueryHash } from '../cache'

export interface APQOptions {
  ttl?: number
  maxQuerySize?: number
  enableMetrics?: boolean
}

export function createAPQPlugin(cache: QueryCache, options: APQOptions = {}): ApolloServerPlugin {
  const { ttl = 3600, maxQuerySize = 50000, enableMetrics = true } = options

  return {
    requestDidStart() {
      return {
        async didResolveOperation(requestContext) {
          const { request } = requestContext

          // Handle APQ request
          if (request.extensions?.persistedQuery) {
            const { sha256Hash } = request.extensions.persistedQuery

            if (!request.query && sha256Hash) {
              // Client sent only hash - retrieve from cache
              const cachedQuery = await cache.get(sha256Hash)

              if (!cachedQuery) {
                throw new Error('PersistedQueryNotFound')
              }

              request.query = cachedQuery

              if (enableMetrics) {
                console.log('APQ Cache Hit:', sha256Hash)
              }
            } else if (request.query && sha256Hash) {
              // Verify hash matches query
              const computedHash = generateQueryHash(request.query)

              if (computedHash !== sha256Hash) {
                throw new Error('PersistedQueryHashMismatch')
              }

              // Store query in cache
              if (request.query.length <= maxQuerySize) {
                await cache.set(sha256Hash, request.query, ttl)

                if (enableMetrics) {
                  console.log('APQ Query Stored:', sha256Hash)
                }
              }
            }
          } else if (request.query) {
            // Auto-generate hash for regular queries
            const hash = generateQueryHash(request.query)

            if (request.query.length <= maxQuerySize) {
              await cache.set(hash, request.query, ttl)
            }

            // Add hash to response for client caching
            if (!request.extensions) {
              request.extensions = {}
            }
            request.extensions.persistedQuery = { sha256Hash: hash }
          }
        },

        async willSendResponse(requestContext) {
          // Add APQ metadata to response
          if (requestContext.request.extensions?.persistedQuery) {
            if (!requestContext.response.extensions) {
              requestContext.response.extensions = {}
            }

            requestContext.response.extensions.persistedQuery = {
              hit: !requestContext.request.query,
              hash: requestContext.request.extensions.persistedQuery.sha256Hash,
            }
          }
        },
      }
    },
  }
}
```

## Query Whitelist Plugin

```typescript
// persisted-queries/plugins/whitelistPlugin.ts
import { ApolloServerPlugin } from '@apollo/server'
import { readFileSync, existsSync } from 'fs'
import { generateQueryHash } from '../cache'

export interface WhitelistOptions {
  whitelistPath: string
  enableInDevelopment?: boolean
  customError?: string
}

interface QueryWhitelist {
  queries: Record<
    string,
    {
      query: string
      operationName?: string
      version: string
      deprecated?: boolean
    }
  >
  version: string
  lastUpdated: string
}

export function createQueryWhitelistPlugin(options: WhitelistOptions): ApolloServerPlugin {
  const { whitelistPath, enableInDevelopment = false, customError = 'Query not in whitelist' } = options

  let whitelist: QueryWhitelist | null = null

  // Load whitelist
  if (existsSync(whitelistPath)) {
    try {
      whitelist = JSON.parse(readFileSync(whitelistPath, 'utf8'))
      console.log(`Loaded query whitelist with ${Object.keys(whitelist.queries).length} queries`)
    } catch (error) {
      console.error('Failed to load query whitelist:', error)
    }
  }

  return {
    requestDidStart() {
      return {
        async didResolveOperation(requestContext) {
          // Skip whitelist check in development unless explicitly enabled
          if (process.env.NODE_ENV === 'development' && !enableInDevelopment) {
            return
          }

          const { request } = requestContext

          if (!whitelist || !request.query) {
            return
          }

          const queryHash = generateQueryHash(request.query)
          const whitelistEntry = whitelist.queries[queryHash]

          if (!whitelistEntry) {
            throw new Error(customError)
          }

          // Check if query is deprecated
          if (whitelistEntry.deprecated) {
            console.warn(`Deprecated query used: ${whitelistEntry.operationName || 'unnamed'}`)

            // Add deprecation warning to response
            if (!requestContext.response.extensions) {
              requestContext.response.extensions = {}
            }
            requestContext.response.extensions.deprecationWarning = `Query ${whitelistEntry.operationName || 'unnamed'} is deprecated`
          }

          // Add whitelist metadata
          if (!requestContext.response.extensions) {
            requestContext.response.extensions = {}
          }
          requestContext.response.extensions.whitelist = {
            version: whitelistEntry.version,
            operationName: whitelistEntry.operationName,
          }
        },
      }
    },
  }
}
```

## Query Analytics Plugin

```typescript
// persisted-queries/plugins/analyticsPlugin.ts
import { ApolloServerPlugin } from '@apollo/server'
import { generateQueryHash } from '../cache'

export interface QueryMetrics {
  hash: string
  operationName?: string
  executionTime: number
  complexity: number
  errors: number
  cacheHit: boolean
  timestamp: number
}

export class QueryAnalytics {
  private metrics: QueryMetrics[] = []
  private maxMetrics = 10000

  recordQuery(metric: QueryMetrics) {
    this.metrics.push(metric)

    // Keep only recent metrics to prevent memory leaks
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics / 2)
    }
  }

  getMetrics(limit = 100) {
    return this.metrics.slice(-limit).reverse()
  }

  getTopQueries(limit = 10) {
    const queryStats = new Map<
      string,
      {
        count: number
        totalTime: number
        avgTime: number
        errors: number
        operationName?: string
      }
    >()

    this.metrics.forEach(metric => {
      const existing = queryStats.get(metric.hash) || {
        count: 0,
        totalTime: 0,
        avgTime: 0,
        errors: 0,
        operationName: metric.operationName,
      }

      existing.count++
      existing.totalTime += metric.executionTime
      existing.avgTime = existing.totalTime / existing.count
      existing.errors += metric.errors

      queryStats.set(metric.hash, existing)
    })

    return Array.from(queryStats.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, limit)
      .map(([hash, stats]) => ({ hash, ...stats }))
  }

  getSlowestQueries(limit = 10) {
    return this.metrics.sort((a, b) => b.executionTime - a.executionTime).slice(0, limit)
  }

  getErrorQueries(limit = 10) {
    return this.metrics
      .filter(m => m.errors > 0)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit)
  }
}

export const queryAnalytics = new QueryAnalytics()

export function createQueryAnalyticsPlugin(): ApolloServerPlugin {
  return {
    requestDidStart() {
      const startTime = Date.now()
      let queryHash: string | undefined
      let operationName: string | undefined
      let complexity = 0

      return {
        async didResolveOperation(requestContext) {
          operationName = requestContext.request.operationName || undefined

          if (requestContext.request.query) {
            queryHash = generateQueryHash(requestContext.request.query)
          }

          // TODO: Calculate query complexity
          complexity = 1
        },

        async willSendResponse(requestContext) {
          const executionTime = Date.now() - startTime
          const errors = requestContext.errors?.length || 0
          const cacheHit = !!requestContext.request.extensions?.persistedQuery && !requestContext.request.query

          if (queryHash) {
            queryAnalytics.recordQuery({
              hash: queryHash,
              operationName,
              executionTime,
              complexity,
              errors,
              cacheHit,
              timestamp: Date.now(),
            })
          }
        },
      }
    },
  }
}
```

## Query Extractor Tool

```typescript
// persisted-queries/tools/queryExtractor.ts
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs'
import { join, extname } from 'path'
import { parse, print, OperationDefinitionNode } from 'graphql'
import { generateQueryHash } from '../cache'

export interface ExtractedQuery {
  hash: string
  query: string
  operationName?: string
  operationType: 'query' | 'mutation' | 'subscription'
  filePath: string
  lineNumber: number
}

export class QueryExtractor {
  private queries: ExtractedQuery[] = []
  private patterns = [/gql`([^`]+)`/g, /graphql\(`([^`]+)`\)/g, /`\s*(query|mutation|subscription)\s+[^`]*`/g]

  extractFromDirectory(directory: string, extensions = ['.ts', '.tsx', '.js', '.jsx']) {
    this.processDirectory(directory, extensions)
    return this.queries
  }

  private processDirectory(directory: string, extensions: string[]) {
    const items = readdirSync(directory)

    for (const item of items) {
      const fullPath = join(directory, item)
      const stat = statSync(fullPath)

      if (stat.isDirectory()) {
        // Skip node_modules and other irrelevant directories
        if (!['node_modules', '.git', 'dist', 'build'].includes(item)) {
          this.processDirectory(fullPath, extensions)
        }
      } else if (stat.isFile() && extensions.includes(extname(fullPath))) {
        this.extractFromFile(fullPath)
      }
    }
  }

  private extractFromFile(filePath: string) {
    const content = readFileSync(filePath, 'utf8')
    const lines = content.split('\n')

    for (const pattern of this.patterns) {
      let match
      while ((match = pattern.exec(content)) !== null) {
        const queryString = match[1] || match[0]

        try {
          const document = parse(queryString)

          for (const definition of document.definitions) {
            if (definition.kind === 'OperationDefinition') {
              const operation = definition as OperationDefinitionNode
              const query = print(definition)
              const hash = generateQueryHash(query)

              // Find line number
              const queryIndex = content.indexOf(match[0])
              const lineNumber = content.substring(0, queryIndex).split('\n').length

              this.queries.push({
                hash,
                query,
                operationName: operation.name?.value,
                operationType: operation.operation,
                filePath,
                lineNumber,
              })
            }
          }
        } catch (error) {
          console.warn(`Failed to parse GraphQL in ${filePath}:`, error.message)
        }
      }
    }
  }

  generateManifest() {
    const queryMap: Record<
      string,
      {
        query: string
        operationName?: string
        operationType: string
        version: string
      }
    > = {}

    this.queries.forEach(q => {
      queryMap[q.hash] = {
        query: q.query,
        operationName: q.operationName,
        operationType: q.operationType,
        version: '1.0.0',
      }
    })

    return {
      queries: queryMap,
      version: '1.0.0',
      lastUpdated: new Date().toISOString(),
      totalQueries: Object.keys(queryMap).length,
    }
  }

  saveManifest(outputPath: string) {
    const manifest = this.generateManifest()
    writeFileSync(outputPath, JSON.stringify(manifest, null, 2))
    console.log(`Generated query manifest with ${manifest.totalQueries} queries`)
    return manifest
  }

  generateWhitelist(outputPath: string) {
    const manifest = this.generateManifest()
    writeFileSync(outputPath, JSON.stringify(manifest, null, 2))
    console.log(`Generated query whitelist with ${manifest.totalQueries} queries`)
    return manifest
  }
}

// CLI usage
export function extractQueries(sourceDir: string, outputDir: string) {
  const extractor = new QueryExtractor()
  const queries = extractor.extractFromDirectory(sourceDir)

  console.log(`Extracted ${queries.length} queries from ${sourceDir}`)

  // Generate manifest
  extractor.saveManifest(join(outputDir, 'persisted-queries.json'))

  // Generate whitelist
  extractor.generateWhitelist(join(outputDir, 'query-whitelist.json'))

  return queries
}
```

## Client-Side APQ Integration

```typescript
// Client-side APQ setup for Apollo Client
import { InMemoryCache, ApolloClient, createHttpLink } from '@apollo/client'
import { createPersistedQueryLink } from '@apollo/client/link/persisted-queries'
import { sha256 } from 'crypto-hash'

const httpLink = createHttpLink({
  uri: '/graphql',
})

const persistedQueriesLink = createPersistedQueryLink({
  sha256,
  useGETForHashedQueries: true, // Use GET for cached queries
})

export const apolloClient = new ApolloClient({
  link: persistedQueriesLink.concat(httpLink),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      errorPolicy: 'all',
    },
    query: {
      errorPolicy: 'all',
    },
  },
})
```

## Build-time Query Processing

```typescript
// Build script for processing queries
import { extractQueries } from './tools/queryExtractor'
import { validateQueries } from './tools/queryValidator'

export async function processQueries(config: {
  sourceDir: string
  outputDir: string
  schemaPath: string
  validateSchema?: boolean
}) {
  const { sourceDir, outputDir, schemaPath, validateSchema = true } = config

  // Extract queries from source code
  console.log('Extracting queries from source code...')
  const queries = extractQueries(sourceDir, outputDir)

  if (validateSchema) {
    // Validate queries against schema
    console.log('Validating queries against schema...')
    const validationResults = await validateQueries(queries, schemaPath)

    if (validationResults.errors.length > 0) {
      console.error('Query validation failed:')
      validationResults.errors.forEach(error => {
        console.error(`  ${error.file}:${error.line} - ${error.message}`)
      })
      process.exit(1)
    }

    console.log(`✓ All ${queries.length} queries are valid`)
  }

  console.log('✓ Query processing completed')
}
```
