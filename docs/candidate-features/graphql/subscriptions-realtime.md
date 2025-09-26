# GraphQL Subscriptions & Real-time Updates

## Overview

WebSocket-based real-time data updates using GraphQL subscriptions with Redis-based pub/sub messaging for scalable real-time features.

## Priority

**MEDIUM-HIGH** - Significantly enhances user experience with real-time updates

## Dependencies

- `apollo-server` (base GraphQL server)
- Redis server for pub/sub messaging
- WebSocket transport layer

## Components

### Subscription Server

- **WebSocket Server**: Dedicated WebSocket server for real-time connections
- **Connection Management**: Handle WebSocket connection lifecycle
- **Authentication**: Secure subscription connections with JWT tokens
- **Rate Limiting**: Prevent subscription abuse and resource exhaustion
- **Connection Monitoring**: Track active subscriptions and connection health

### PubSub System

- **Redis PubSub**: Distributed publish/subscribe messaging
- **Event Broadcasting**: Broadcast events to multiple subscribers
- **Message Filtering**: Filter messages based on subscription arguments
- **Event Persistence**: Optional event persistence for reliability
- **Scalable Architecture**: Support for multiple server instances

### Subscription Resolvers

- **Real-time Data Resolvers**: GraphQL resolvers for live data streams
- **Subscription Filtering**: Filter subscription data based on user permissions
- **Data Transformation**: Transform published data for client consumption
- **Error Handling**: Graceful error handling in subscription streams
- **Subscription Lifecycle**: Manage subscription start, update, and cleanup

### Client Subscriptions

- **Frontend Integration**: React hooks for subscription management
- **Connection Recovery**: Automatic reconnection on network issues
- **Subscription Caching**: Integrate subscriptions with Apollo cache
- **Optimistic Updates**: Immediate UI updates with server confirmation
- **Subscription Multiplexing**: Efficient multiple subscription management

### Connection Management

- **WebSocket Lifecycle**: Connect, authenticate, subscribe, unsubscribe flow
- **Heartbeat/Ping-Pong**: Keep connections alive with periodic pings
- **Resource Cleanup**: Clean up resources when connections close
- **Memory Management**: Prevent memory leaks in long-running subscriptions
- **Graceful Shutdown**: Proper cleanup during server shutdown

## Configuration

```typescript
interface SubscriptionConfig {
  transport: 'ws' | 'sse' | 'graphql-ws'
  pubsub: {
    redis: {
      host: string
      port: number
      password?: string
    }
  }
  connectionTimeout: number
  maxConnections: number
}
```

## Generated Files

```
api/src/
├── subscriptions/
│   ├── index.ts                   # Subscription exports
│   ├── server.ts                  # WebSocket server setup
│   ├── pubsub.ts                  # PubSub configuration
│   ├── resolvers/
│   │   ├── bookSubscriptions.ts   # Book-related subscriptions
│   │   ├── userSubscriptions.ts   # User-related subscriptions
│   │   └── notificationSubscriptions.ts
│   ├── filters/
│   │   └── subscriptionFilters.ts # Subscription filtering logic
│   └── middleware/
│       ├── auth.ts                # Subscription authentication
│       └── rateLimiting.ts        # Rate limiting for subscriptions
```

## WebSocket Server Setup

```typescript
// subscriptions/server.ts
import { createServer } from 'http'
import { ApolloServer } from '@apollo/server'
import { expressMiddleware } from '@apollo/server/express4'
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer'
import { makeExecutableSchema } from '@graphql-tools/schema'
import { WebSocketServer } from 'ws'
import { useServer } from 'graphql-ws/lib/use/ws'
import express from 'express'
import cors from 'cors'
import { typeDefs } from '../schema/typeDefs'
import { resolvers } from '../schema/resolvers'
import { createContext } from '../context'
import { createPubSub } from './pubsub'

export async function createSubscriptionServer() {
  const app = express()
  const httpServer = createServer(app)

  const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
  })

  // Create WebSocket server
  const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/graphql',
  })

  // Setup GraphQL subscription server
  const serverCleanup = useServer(
    {
      schema,
      context: async (ctx, msg, args) => {
        const context = await createContext({
          req: ctx.extra.request,
          connectionParams: ctx.connectionParams,
        })

        // Add pubsub to context
        context.pubsub = createPubSub()

        return context
      },
      onConnect: async ctx => {
        console.log('Client connected:', ctx.connectionParams)

        // Authenticate WebSocket connection
        const token = ctx.connectionParams?.authorization
        if (!token) {
          throw new Error('Authentication required')
        }

        // Verify token and add user to context
        // Implementation depends on your auth system
      },
      onDisconnect: ctx => {
        console.log('Client disconnected')
      },
      onSubscribe: (ctx, msg) => {
        console.log('New subscription:', msg.payload.operationName)
      },
      onNext: (ctx, msg, args, result) => {
        // Optional: Log or modify subscription results
      },
      onError: (ctx, msg, errors) => {
        console.error('Subscription error:', errors)
      },
    },
    wsServer,
  )

  const apolloServer = new ApolloServer({
    schema,
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      {
        async serverWillStart() {
          return {
            async drainServer() {
              await serverCleanup.dispose()
            },
          }
        },
      },
    ],
  })

  await apolloServer.start()

  app.use(
    '/graphql',
    cors<cors.CorsRequest>(),
    express.json(),
    expressMiddleware(apolloServer, {
      context: createContext,
    }),
  )

  return { httpServer, apolloServer }
}
```

## PubSub Configuration

```typescript
// subscriptions/pubsub.ts
import { RedisPubSub } from 'graphql-redis-subscriptions'
import Redis from 'ioredis'

const REDIS_CONFIG = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  maxRetriesPerRequest: null,
}

export function createPubSub() {
  const publisher = new Redis(REDIS_CONFIG)
  const subscriber = new Redis(REDIS_CONFIG)

  return new RedisPubSub({
    publisher,
    subscriber,
  })
}

// Event constants
export const SUBSCRIPTION_EVENTS = {
  BOOK_ADDED: 'BOOK_ADDED',
  BOOK_UPDATED: 'BOOK_UPDATED',
  BOOK_DELETED: 'BOOK_DELETED',
  BOOK_LIKED: 'BOOK_LIKED',
  USER_ONLINE: 'USER_ONLINE',
  USER_OFFLINE: 'USER_OFFLINE',
  NOTIFICATION_CREATED: 'NOTIFICATION_CREATED',
  COMMENT_ADDED: 'COMMENT_ADDED',
  LIVE_TYPING: 'LIVE_TYPING',
} as const

export type SubscriptionEvent = keyof typeof SUBSCRIPTION_EVENTS
```

## Subscription Resolvers

```typescript
// subscriptions/resolvers/bookSubscriptions.ts
import { withFilter } from 'graphql-subscriptions'
import { SUBSCRIPTION_EVENTS } from '../pubsub'
import type { Context } from '../../context'

export const bookSubscriptions = {
  bookAdded: {
    subscribe: withFilter(
      (_, __, { pubsub }: Context) => pubsub.asyncIterator(SUBSCRIPTION_EVENTS.BOOK_ADDED),
      (payload, variables) => {
        // Filter based on subscription arguments
        if (variables.category) {
          return payload.bookAdded.category === variables.category
        }
        return true
      },
    ),
  },

  bookUpdated: {
    subscribe: withFilter(
      (_, __, { pubsub }: Context) => pubsub.asyncIterator(SUBSCRIPTION_EVENTS.BOOK_UPDATED),
      (payload, variables) => {
        return variables.bookId ? payload.bookUpdated.id === variables.bookId : true
      },
    ),
  },

  bookLiked: {
    subscribe: withFilter(
      (_, __, { pubsub }: Context) => pubsub.asyncIterator(SUBSCRIPTION_EVENTS.BOOK_LIKED),
      (payload, variables, context) => {
        // Only send to authenticated users
        if (!context.user) return false

        // Filter by book if specified
        if (variables.bookId && payload.bookLiked.bookId !== variables.bookId) {
          return false
        }

        return true
      },
    ),
  },

  liveComments: {
    subscribe: withFilter(
      (_, __, { pubsub }: Context) => pubsub.asyncIterator(SUBSCRIPTION_EVENTS.COMMENT_ADDED),
      (payload, variables) => {
        return payload.commentAdded.bookId === variables.bookId
      },
    ),
    resolve: payload => payload.commentAdded,
  },
}

// Mutation resolvers that trigger subscriptions
export const bookMutations = {
  async createBook(_, { input }, { prisma, pubsub, user }: Context) {
    if (!user) throw new Error('Authentication required')

    const book = await prisma.book.create({
      data: {
        ...input,
        authorId: user.id,
      },
      include: {
        author: true,
        category: true,
        _count: {
          select: { likes: true, comments: true },
        },
      },
    })

    // Publish subscription event
    await pubsub.publish(SUBSCRIPTION_EVENTS.BOOK_ADDED, { bookAdded: book })

    return book
  },

  async updateBook(_, { id, input }, { prisma, pubsub, user }: Context) {
    if (!user) throw new Error('Authentication required')

    const book = await prisma.book.update({
      where: { id },
      data: input,
      include: {
        author: true,
        category: true,
        _count: {
          select: { likes: true, comments: true },
        },
      },
    })

    await pubsub.publish(SUBSCRIPTION_EVENTS.BOOK_UPDATED, { bookUpdated: book })

    return book
  },

  async likeBook(_, { bookId }, { prisma, pubsub, user }: Context) {
    if (!user) throw new Error('Authentication required')

    const like = await prisma.like.create({
      data: {
        bookId,
        userId: user.id,
      },
      include: {
        book: true,
        user: true,
      },
    })

    await pubsub.publish(SUBSCRIPTION_EVENTS.BOOK_LIKED, {
      bookLiked: {
        bookId,
        userId: user.id,
        user: like.user,
        book: like.book,
      },
    })

    return like
  },
}
```

## GraphQL Schema Extensions

```graphql
# Enhanced schema with subscriptions
extend type Subscription {
  # Book subscriptions
  bookAdded(category: String): Book!
  bookUpdated(bookId: ID): Book!
  bookLiked(bookId: ID): BookLikeEvent!

  # User activity subscriptions
  userOnline: User!
  userOffline: User!

  # Notification subscriptions
  notificationReceived: Notification!

  # Real-time features
  liveComments(bookId: ID!): Comment!
  liveTyping(bookId: ID!): TypingEvent!
}

type BookLikeEvent {
  bookId: ID!
  userId: ID!
  user: User!
  book: Book!
  timestamp: DateTime!
}

type TypingEvent {
  userId: ID!
  user: User!
  bookId: ID!
  isTyping: Boolean!
}

type Notification {
  id: ID!
  type: NotificationType!
  title: String!
  message: String!
  data: JSON
  read: Boolean!
  userId: ID!
  createdAt: DateTime!
}

enum NotificationType {
  BOOK_LIKED
  BOOK_COMMENTED
  USER_FOLLOWED
  SYSTEM_UPDATE
}

# Custom scalars for real-time features
scalar DateTime
scalar JSON
```

## React Hook for Subscriptions

```typescript
// hooks/useSubscription.ts
import { useSubscription } from '@apollo/client'
import { gql } from '@apollo/client'
import { useEffect } from 'react'

const BOOK_ADDED_SUBSCRIPTION = gql`
  subscription BookAdded($category: String) {
    bookAdded(category: $category) {
      id
      title
      description
      category {
        id
        name
      }
      author {
        id
        name
        avatar
      }
      createdAt
    }
  }
`

const BOOK_LIKED_SUBSCRIPTION = gql`
  subscription BookLiked($bookId: ID) {
    bookLiked(bookId: $bookId) {
      bookId
      userId
      user {
        id
        name
        avatar
      }
      timestamp
    }
  }
`

const LIVE_COMMENTS_SUBSCRIPTION = gql`
  subscription LiveComments($bookId: ID!) {
    liveComments(bookId: $bookId) {
      id
      content
      author {
        id
        name
        avatar
      }
      createdAt
    }
  }
`

export function useBookSubscriptions(category?: string) {
  const { data: newBook } = useSubscription(BOOK_ADDED_SUBSCRIPTION, {
    variables: { category },
    onSubscriptionData: ({ subscriptionData }) => {
      if (subscriptionData.data?.bookAdded) {
        console.log('New book added:', subscriptionData.data.bookAdded)
        // Handle new book (show notification, update UI, etc.)
      }
    },
  })

  return { newBook: newBook?.bookAdded }
}

export function useBookLikes(bookId?: string) {
  const { data: bookLiked } = useSubscription(BOOK_LIKED_SUBSCRIPTION, {
    variables: { bookId },
    skip: !bookId,
  })

  return { bookLiked: bookLiked?.bookLiked }
}

export function useLiveComments(bookId: string) {
  const { data: newComment, loading } = useSubscription(LIVE_COMMENTS_SUBSCRIPTION, {
    variables: { bookId },
  })

  return {
    newComment: newComment?.liveComments,
    loading,
  }
}
```

## React Component with Subscriptions

```typescript
// components/BookList.tsx
import React, { useEffect } from 'react'
import { useQuery } from '@apollo/client'
import { useBookSubscriptions } from '../hooks/useSubscription'
import { BOOKS_QUERY } from '../graphql/queries'

export const BookList: React.FC = () => {
  const { data, loading, error, updateQuery } = useQuery(BOOKS_QUERY)
  const { newBook } = useBookSubscriptions()

  // Update the books list when a new book is added via subscription
  useEffect(() => {
    if (newBook) {
      updateQuery((prev) => ({
        ...prev,
        books: [newBook, ...prev.books],
      }))

      // Show notification
      showNotification(`New book added: ${newBook.title}`)
    }
  }, [newBook, updateQuery])

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <div className="book-list">
      {data?.books?.map((book) => (
        <BookCard key={book.id} book={book} />
      ))}
    </div>
  )
}
```

## Subscription Rate Limiting

```typescript
// subscriptions/middleware/rateLimiting.ts
import { shield, rule, and, or } from 'graphql-shield'

const subscriptionRateLimits = new Map<string, { count: number; resetTime: number }>()

const isNotRateLimited = rule({ cache: 'contextual' })(async (parent, args, context, info) => {
  const userId = context.user?.id
  if (!userId) return false

  const key = `${userId}:${info.fieldName}`
  const now = Date.now()
  const limit = subscriptionRateLimits.get(key)

  if (!limit || now > limit.resetTime) {
    subscriptionRateLimits.set(key, { count: 1, resetTime: now + 60000 }) // 1 minute window
    return true
  }

  if (limit.count >= 10) {
    // Max 10 subscriptions per minute per user
    return new Error('Rate limit exceeded')
  }

  limit.count++
  return true
})

export const subscriptionPermissions = shield({
  Subscription: {
    bookAdded: and(isNotRateLimited),
    bookLiked: and(isNotRateLimited),
    liveComments: and(isNotRateLimited),
    notificationReceived: and(isNotRateLimited),
  },
})
```

## Connection Health Monitoring

```typescript
// subscriptions/middleware/monitoring.ts
export class SubscriptionMonitor {
  private activeConnections = new Map<
    string,
    {
      userId?: string
      connectedAt: Date
      lastActivity: Date
      subscriptionCount: number
    }
  >()

  onConnect(connectionId: string, userId?: string) {
    this.activeConnections.set(connectionId, {
      userId,
      connectedAt: new Date(),
      lastActivity: new Date(),
      subscriptionCount: 0,
    })

    console.log(`WebSocket connected: ${connectionId}, Active connections: ${this.activeConnections.size}`)
  }

  onDisconnect(connectionId: string) {
    this.activeConnections.delete(connectionId)
    console.log(`WebSocket disconnected: ${connectionId}, Active connections: ${this.activeConnections.size}`)
  }

  onSubscribe(connectionId: string) {
    const connection = this.activeConnections.get(connectionId)
    if (connection) {
      connection.subscriptionCount++
      connection.lastActivity = new Date()
    }
  }

  onUnsubscribe(connectionId: string) {
    const connection = this.activeConnections.get(connectionId)
    if (connection) {
      connection.subscriptionCount = Math.max(0, connection.subscriptionCount - 1)
      connection.lastActivity = new Date()
    }
  }

  getMetrics() {
    return {
      totalConnections: this.activeConnections.size,
      totalSubscriptions: Array.from(this.activeConnections.values()).reduce(
        (total, conn) => total + conn.subscriptionCount,
        0,
      ),
      connectionsByUser: Array.from(this.activeConnections.values())
        .filter(conn => conn.userId)
        .reduce(
          (acc, conn) => {
            acc[conn.userId!] = (acc[conn.userId!] || 0) + 1
            return acc
          },
          {} as Record<string, number>,
        ),
    }
  }

  // Clean up stale connections
  cleanupStaleConnections(maxIdleTime = 300000) {
    // 5 minutes
    const now = new Date()
    for (const [connectionId, connection] of this.activeConnections.entries()) {
      if (now.getTime() - connection.lastActivity.getTime() > maxIdleTime) {
        this.activeConnections.delete(connectionId)
        console.log(`Cleaned up stale connection: ${connectionId}`)
      }
    }
  }
}

export const subscriptionMonitor = new SubscriptionMonitor()
```
