# GraphQL DataLoader & Batching

## Overview

Intelligent data loading and N+1 query resolution using Facebook's DataLoader pattern with automatic batching, caching, and performance optimization.

## Priority

**HIGH** - Critical for GraphQL performance and database efficiency

## Dependencies

- `apollo-server` (base GraphQL server)
- `dataloader` npm package
- Database ORM/client (Prisma)

## Components

### DataLoader Implementation

- **Batch Loading**: Automatically batch multiple data requests into single queries
- **Request Caching**: Cache identical requests within single GraphQL operation
- **Key Management**: Handle complex key scenarios and relationships
- **Error Handling**: Graceful error handling with partial results
- **Performance Monitoring**: Track loader performance and hit rates

### Loader Factory

- **Dynamic Loader Creation**: Generate loaders for different entity types
- **Relationship Loaders**: Handle complex database relationships efficiently
- **Custom Key Functions**: Support custom key extraction and matching
- **Context Integration**: Integrate loaders with GraphQL context
- **Memory Management**: Automatic cleanup and memory optimization

### Batch Functions

- **Database Query Optimization**: Efficient batch queries with minimal database hits
- **Result Mapping**: Map batch results back to individual requests
- **Null Handling**: Handle missing/null results gracefully
- **Sort Preservation**: Maintain request order in batch results
- **Relationship Loading**: Load related data efficiently

### Cache Strategy

- **Request-Scoped Caching**: Cache within single GraphQL request
- **Cache Invalidation**: Smart cache invalidation strategies
- **Memory Limits**: Prevent memory leaks in long-running processes
- **Cache Warming**: Pre-populate frequently accessed data
- **Cache Analytics**: Monitor cache hit rates and effectiveness

### Performance Monitoring

- **Batch Analytics**: Track batch sizes and efficiency
- **Query Optimization**: Monitor and optimize database queries
- **Memory Usage**: Track loader memory consumption
- **Performance Metrics**: Measure resolver execution times
- **Debug Logging**: Detailed logging for performance tuning

## Configuration

```typescript
interface DataLoaderConfig {
  batchScheduleFn?: (callback: () => void) => void
  maxBatchSize?: number
  cacheKeyFn?: (key: any) => any
  cacheMap?: Map<any, any>
  cache?: boolean
}

interface LoaderOptions {
  prime?: boolean
  clearCache?: boolean
  maxAge?: number
  monitoring?: boolean
}
```

## Generated Files

```
api/src/
├── loaders/
│   ├── index.ts                    # Loader exports and factory
│   ├── createLoaders.ts            # Loader creation utility
│   ├── entities/
│   │   ├── bookLoader.ts          # Book entity loader
│   │   ├── userLoader.ts          # User entity loader
│   │   ├── categoryLoader.ts      # Category entity loader
│   │   └── commentLoader.ts       # Comment entity loader
│   ├── relations/
│   │   ├── bookAuthorLoader.ts    # Book-Author relationship
│   │   ├── bookCategoryLoader.ts  # Book-Category relationship
│   │   ├── userBooksLoader.ts     # User-Books relationship
│   │   └── bookCommentsLoader.ts  # Book-Comments relationship
│   ├── batch/
│   │   ├── batchFunctions.ts      # Reusable batch functions
│   │   └── keyExtractors.ts       # Key extraction utilities
│   └── monitoring/
│       ├── loaderMetrics.ts       # Performance monitoring
│       └── cacheAnalytics.ts      # Cache performance analysis
```

## Basic DataLoader Implementation

```typescript
// loaders/entities/bookLoader.ts
import DataLoader from 'dataloader'
import { PrismaClient } from '@prisma/client'

export function createBookLoader(prisma: PrismaClient) {
  return new DataLoader<string, any>(
    async (bookIds: readonly string[]) => {
      // Batch fetch all books in single query
      const books = await prisma.book.findMany({
        where: {
          id: { in: [...bookIds] },
        },
        include: {
          author: true,
          category: true,
          _count: {
            select: { likes: true, comments: true },
          },
        },
      })

      // Create a map for O(1) lookups
      const bookMap = new Map(books.map(book => [book.id, book]))

      // Return results in same order as input keys
      return bookIds.map(id => bookMap.get(id) || null)
    },
    {
      // Optional configuration
      maxBatchSize: 100,
      cache: true,
      cacheKeyFn: key => key.toString(),
    },
  )
}

export function createBooksByAuthorLoader(prisma: PrismaClient) {
  return new DataLoader<string, any[]>(async (authorIds: readonly string[]) => {
    const books = await prisma.book.findMany({
      where: {
        authorId: { in: [...authorIds] },
      },
      include: {
        author: true,
        category: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    // Group books by authorId
    const booksByAuthor = new Map<string, any[]>()

    // Initialize empty arrays for all requested author IDs
    authorIds.forEach(id => booksByAuthor.set(id, []))

    // Group books by author
    books.forEach(book => {
      const authorBooks = booksByAuthor.get(book.authorId) || []
      authorBooks.push(book)
      booksByAuthor.set(book.authorId, authorBooks)
    })

    return authorIds.map(authorId => booksByAuthor.get(authorId) || [])
  })
}
```

## User Loader with Relationships

```typescript
// loaders/entities/userLoader.ts
import DataLoader from 'dataloader'
import { PrismaClient } from '@prisma/client'

export function createUserLoader(prisma: PrismaClient) {
  return new DataLoader<string, any>(async (userIds: readonly string[]) => {
    const users = await prisma.user.findMany({
      where: {
        id: { in: [...userIds] },
      },
      include: {
        profile: true,
        _count: {
          select: {
            books: true,
            likes: true,
            comments: true,
            followers: true,
            following: true,
          },
        },
      },
    })

    const userMap = new Map(users.map(user => [user.id, user]))
    return userIds.map(id => userMap.get(id) || null)
  })
}

export function createUserFollowersLoader(prisma: PrismaClient) {
  return new DataLoader<string, any[]>(async (userIds: readonly string[]) => {
    const follows = await prisma.follow.findMany({
      where: {
        followingId: { in: [...userIds] },
      },
      include: {
        follower: {
          include: {
            profile: true,
          },
        },
      },
    })

    const followersByUser = new Map<string, any[]>()
    userIds.forEach(id => followersByUser.set(id, []))

    follows.forEach(follow => {
      const followers = followersByUser.get(follow.followingId) || []
      followers.push(follow.follower)
      followersByUser.set(follow.followingId, followers)
    })

    return userIds.map(userId => followersByUser.get(userId) || [])
  })
}
```

## Complex Relationship Loaders

```typescript
// loaders/relations/bookCommentsLoader.ts
import DataLoader from 'dataloader'
import { PrismaClient } from '@prisma/client'

export function createBookCommentsLoader(prisma: PrismaClient) {
  return new DataLoader<string, any[]>(async (bookIds: readonly string[]) => {
    const comments = await prisma.comment.findMany({
      where: {
        bookId: { in: [...bookIds] },
      },
      include: {
        author: {
          include: {
            profile: true,
          },
        },
        _count: {
          select: { likes: true, replies: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const commentsByBook = new Map<string, any[]>()
    bookIds.forEach(id => commentsByBook.set(id, []))

    comments.forEach(comment => {
      const bookComments = commentsByBook.get(comment.bookId) || []
      bookComments.push(comment)
      commentsByBook.set(comment.bookId, bookComments)
    })

    return bookIds.map(bookId => commentsByBook.get(bookId) || [])
  })
}

export function createBookLikesLoader(prisma: PrismaClient) {
  return new DataLoader<string, number>(async (bookIds: readonly string[]) => {
    const likes = await prisma.like.groupBy({
      by: ['bookId'],
      where: {
        bookId: { in: [...bookIds] },
      },
      _count: {
        id: true,
      },
    })

    const likeCountMap = new Map(likes.map(like => [like.bookId, like._count.id]))

    return bookIds.map(bookId => likeCountMap.get(bookId) || 0)
  })
}

// Custom loader for user's liked books
export function createUserLikedBooksLoader(prisma: PrismaClient) {
  return new DataLoader<string, string[]>(async (userIds: readonly string[]) => {
    const likes = await prisma.like.findMany({
      where: {
        userId: { in: [...userIds] },
      },
      select: {
        userId: true,
        bookId: true,
      },
    })

    const likedBooksByUser = new Map<string, string[]>()
    userIds.forEach(id => likedBooksByUser.set(id, []))

    likes.forEach(like => {
      const userLikedBooks = likedBooksByUser.get(like.userId) || []
      userLikedBooks.push(like.bookId)
      likedBooksByUser.set(like.userId, userLikedBooks)
    })

    return userIds.map(userId => likedBooksByUser.get(userId) || [])
  })
}
```

## Loader Factory and Context Integration

```typescript
// loaders/createLoaders.ts
import { PrismaClient } from '@prisma/client'
import { createBookLoader, createBooksByAuthorLoader } from './entities/bookLoader'
import { createUserLoader, createUserFollowersLoader, createUserLikedBooksLoader } from './entities/userLoader'
import { createCategoryLoader } from './entities/categoryLoader'
import { createBookCommentsLoader, createBookLikesLoader } from './relations/bookCommentsLoader'

export interface Loaders {
  // Entity loaders
  bookLoader: ReturnType<typeof createBookLoader>
  userLoader: ReturnType<typeof createUserLoader>
  categoryLoader: ReturnType<typeof createCategoryLoader>

  // Relationship loaders
  booksByAuthorLoader: ReturnType<typeof createBooksByAuthorLoader>
  userFollowersLoader: ReturnType<typeof createUserFollowersLoader>
  bookCommentsLoader: ReturnType<typeof createBookCommentsLoader>
  bookLikesLoader: ReturnType<typeof createBookLikesLoader>
  userLikedBooksLoader: ReturnType<typeof createUserLikedBooksLoader>
}

export function createLoaders(prisma: PrismaClient): Loaders {
  return {
    // Entity loaders
    bookLoader: createBookLoader(prisma),
    userLoader: createUserLoader(prisma),
    categoryLoader: createCategoryLoader(prisma),

    // Relationship loaders
    booksByAuthorLoader: createBooksByAuthorLoader(prisma),
    userFollowersLoader: createUserFollowersLoader(prisma),
    bookCommentsLoader: createBookCommentsLoader(prisma),
    bookLikesLoader: createBookLikesLoader(prisma),
    userLikedBooksLoader: createUserLikedBooksLoader(prisma),
  }
}

// Context integration
export interface Context {
  prisma: PrismaClient
  loaders: Loaders
  user?: any
  // ... other context properties
}

export function createContext({ req, prisma }: { req: any; prisma: PrismaClient }): Context {
  return {
    prisma,
    loaders: createLoaders(prisma),
    user: req.user, // from authentication middleware
  }
}
```

## Optimized Resolvers Using DataLoaders

```typescript
// resolvers/bookResolvers.ts
import { Context } from '../context'

export const bookResolvers = {
  Query: {
    async books(_, __, { prisma }: Context) {
      return prisma.book.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20,
      })
    },

    async book(_, { id }, { loaders }: Context) {
      return loaders.bookLoader.load(id)
    },
  },

  Book: {
    // Instead of N+1 queries, use DataLoader
    async author(book, _, { loaders }: Context) {
      return loaders.userLoader.load(book.authorId)
    },

    async category(book, _, { loaders }: Context) {
      return loaders.categoryLoader.load(book.categoryId)
    },

    async comments(book, _, { loaders }: Context) {
      return loaders.bookCommentsLoader.load(book.id)
    },

    async likesCount(book, _, { loaders }: Context) {
      return loaders.bookLikesLoader.load(book.id)
    },

    // Check if current user liked this book
    async isLikedByMe(book, _, { loaders, user }: Context) {
      if (!user) return false

      const likedBookIds = await loaders.userLikedBooksLoader.load(user.id)
      return likedBookIds.includes(book.id)
    },
  },

  User: {
    async books(user, _, { loaders }: Context) {
      return loaders.booksByAuthorLoader.load(user.id)
    },

    async followers(user, _, { loaders }: Context) {
      return loaders.userFollowersLoader.load(user.id)
    },

    async likedBooks(user, _, { loaders }: Context) {
      const likedBookIds = await loaders.userLikedBooksLoader.load(user.id)
      return Promise.all(likedBookIds.map(id => loaders.bookLoader.load(id)))
    },
  },
}
```

## Advanced DataLoader Patterns

```typescript
// loaders/batch/advancedPatterns.ts
import DataLoader from 'dataloader'
import { PrismaClient } from '@prisma/client'

// Composite key loader for complex relationships
export interface BookCategoryKey {
  bookId: string
  categoryId: string
}

export function createBookCategoryLoader(prisma: PrismaClient) {
  return new DataLoader<BookCategoryKey, any>(
    async (keys: readonly BookCategoryKey[]) => {
      const bookIds = keys.map(k => k.bookId)
      const categoryIds = keys.map(k => k.categoryId)

      const bookCategories = await prisma.bookCategory.findMany({
        where: {
          AND: [{ bookId: { in: bookIds } }, { categoryId: { in: categoryIds } }],
        },
        include: {
          book: true,
          category: true,
        },
      })

      const resultMap = new Map<string, any>()
      bookCategories.forEach(bc => {
        const key = `${bc.bookId}:${bc.categoryId}`
        resultMap.set(key, bc)
      })

      return keys.map(key => {
        const mapKey = `${key.bookId}:${key.categoryId}`
        return resultMap.get(mapKey) || null
      })
    },
    {
      cacheKeyFn: key => `${key.bookId}:${key.categoryId}`,
    },
  )
}

// Conditional loading with filters
export function createFilteredBooksLoader(prisma: PrismaClient) {
  return new DataLoader<{ authorId: string; published: boolean }, any[]>(
    async (keys: readonly { authorId: string; published: boolean }[]) => {
      // Group keys by condition
      const keyGroups = new Map<string, { authorId: string; published: boolean }[]>()

      keys.forEach(key => {
        const groupKey = JSON.stringify({ published: key.published })
        const group = keyGroups.get(groupKey) || []
        group.push(key)
        keyGroups.set(groupKey, group)
      })

      const allResults = new Map<string, any[]>()

      // Execute queries for each group
      for (const [groupKey, groupKeys] of keyGroups.entries()) {
        const condition = JSON.parse(groupKey)
        const authorIds = groupKeys.map(k => k.authorId)

        const books = await prisma.book.findMany({
          where: {
            authorId: { in: authorIds },
            published: condition.published,
          },
          include: {
            author: true,
            category: true,
          },
        })

        // Group results by authorId
        const booksByAuthor = new Map<string, any[]>()
        authorIds.forEach(id => booksByAuthor.set(id, []))

        books.forEach(book => {
          const authorBooks = booksByAuthor.get(book.authorId) || []
          authorBooks.push(book)
          booksByAuthor.set(book.authorId, authorBooks)
        })

        // Store results
        groupKeys.forEach(key => {
          const resultKey = JSON.stringify(key)
          allResults.set(resultKey, booksByAuthor.get(key.authorId) || [])
        })
      }

      return keys.map(key => {
        const resultKey = JSON.stringify(key)
        return allResults.get(resultKey) || []
      })
    },
    {
      cacheKeyFn: key => JSON.stringify(key),
    },
  )
}
```

## Performance Monitoring and Analytics

```typescript
// loaders/monitoring/loaderMetrics.ts
export class DataLoaderMetrics {
  private metrics = new Map<
    string,
    {
      totalRequests: number
      batchedRequests: number
      cacheHits: number
      averageBatchSize: number
      totalBatches: number
      errors: number
    }
  >()

  recordBatch(loaderName: string, batchSize: number) {
    const metric = this.getOrCreateMetric(loaderName)
    metric.totalBatches++
    metric.batchedRequests += batchSize
    metric.averageBatchSize = metric.batchedRequests / metric.totalBatches
  }

  recordRequest(loaderName: string) {
    const metric = this.getOrCreateMetric(loaderName)
    metric.totalRequests++
  }

  recordCacheHit(loaderName: string) {
    const metric = this.getOrCreateMetric(loaderName)
    metric.cacheHits++
  }

  recordError(loaderName: string) {
    const metric = this.getOrCreateMetric(loaderName)
    metric.errors++
  }

  private getOrCreateMetric(loaderName: string) {
    if (!this.metrics.has(loaderName)) {
      this.metrics.set(loaderName, {
        totalRequests: 0,
        batchedRequests: 0,
        cacheHits: 0,
        averageBatchSize: 0,
        totalBatches: 0,
        errors: 0,
      })
    }
    return this.metrics.get(loaderName)!
  }

  getMetrics() {
    const results = new Map<string, any>()

    for (const [loaderName, metric] of this.metrics.entries()) {
      results.set(loaderName, {
        ...metric,
        cacheHitRate:
          metric.totalRequests > 0 ? ((metric.cacheHits / metric.totalRequests) * 100).toFixed(2) + '%' : '0%',
        batchingEfficiency:
          metric.totalRequests > 0 ? ((metric.batchedRequests / metric.totalRequests) * 100).toFixed(2) + '%' : '0%',
        errorRate: metric.totalRequests > 0 ? ((metric.errors / metric.totalRequests) * 100).toFixed(2) + '%' : '0%',
      })
    }

    return results
  }

  reset() {
    this.metrics.clear()
  }
}

export const dataLoaderMetrics = new DataLoaderMetrics()

// Enhanced DataLoader with monitoring
export function createMonitoredLoader<K, V>(
  batchLoadFn: DataLoader.BatchLoadFn<K, V>,
  options?: DataLoader.Options<K, V>,
  loaderName = 'unknown',
) {
  return new DataLoader<K, V>(
    async keys => {
      dataLoaderMetrics.recordBatch(loaderName, keys.length)

      try {
        const results = await batchLoadFn(keys)
        return results
      } catch (error) {
        dataLoaderMetrics.recordError(loaderName)
        throw error
      }
    },
    {
      ...options,
      cacheMap: options?.cacheMap || new Map(),
    },
  )
}
```

## Memory Management and Cleanup

```typescript
// loaders/monitoring/memoryManagement.ts
export class LoaderMemoryManager {
  private cleanupIntervals = new Map<string, NodeJS.Timeout>()

  setupAutoCleanup(loaders: Record<string, DataLoader<any, any>>, intervalMs = 300000) {
    // 5 minutes
    for (const [name, loader] of Object.entries(loaders)) {
      const interval = setInterval(() => {
        loader.clearAll()
        console.log(`Cleared cache for loader: ${name}`)
      }, intervalMs)

      this.cleanupIntervals.set(name, interval)
    }
  }

  clearAllCaches(loaders: Record<string, DataLoader<any, any>>) {
    for (const loader of Object.values(loaders)) {
      loader.clearAll()
    }
  }

  getMemoryUsage(loaders: Record<string, DataLoader<any, any>>) {
    const usage = new Map<string, number>()

    for (const [name, loader] of Object.entries(loaders)) {
      // Estimate memory usage (rough calculation)
      const cacheSize = (loader as any)._cacheMap?.size || 0
      usage.set(name, cacheSize)
    }

    return usage
  }

  shutdown() {
    for (const interval of this.cleanupIntervals.values()) {
      clearInterval(interval)
    }
    this.cleanupIntervals.clear()
  }
}

export const loaderMemoryManager = new LoaderMemoryManager()
```
