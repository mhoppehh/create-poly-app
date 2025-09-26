# GraphQL Federation & Schema Composition

## Overview

Distributed GraphQL architecture using Apollo Federation for microservices composition, schema stitching, and unified API gateway management.

## Priority

**MEDIUM** - Valuable for microservices architecture and large-scale applications

## Dependencies

- `@apollo/gateway` (Apollo Federation Gateway)
- `@apollo/subgraph` (Subgraph implementation)
- `apollo-server` (base GraphQL server)

## Components

### Federation Gateway

- **Schema Composition**: Automatic composition of distributed schemas
- **Query Planning**: Intelligent query execution across multiple services
- **Service Discovery**: Dynamic service registration and health checking
- **Load Balancing**: Distribute requests across service instances
- **Error Handling**: Graceful handling of service failures and partial responses

### Subgraph Services

- **Service Definition**: Define GraphQL subgraphs with entity extensions
- **Entity Resolution**: Resolve entities across service boundaries
- **Reference Resolvers**: Handle entity references from other services
- **Schema Extension**: Extend types from other services with additional fields
- **Service Boundaries**: Maintain clear service ownership and responsibilities

### Schema Registry

- **Schema Versioning**: Manage schema versions and evolution
- **Schema Validation**: Validate schema changes for breaking changes
- **Service Health**: Monitor subgraph service health and availability
- **Composition History**: Track schema composition changes over time
- **Deploy Coordination**: Coordinate schema deployments across services

### Query Planning

- **Execution Strategy**: Optimize query execution across services
- **Batching**: Batch requests to the same service efficiently
- **Caching**: Cache entity resolutions and query plans
- **Parallel Execution**: Execute independent service calls in parallel
- **Query Complexity**: Analyze and limit federated query complexity

### Entity Management

- **Entity Keys**: Define primary keys for federated entities
- **Entity Extensions**: Add fields to entities from other services
- **Reference Resolution**: Resolve entity references efficiently
- **Entity Caching**: Cache frequently accessed entities
- **Relationship Mapping**: Map relationships across service boundaries

## Configuration

```typescript
interface FederationConfig {
  gateway: {
    serviceList: Array<{
      name: string
      url: string
    }>
    introspectionHeaders?: Record<string, string>
    buildService?: (definition: ServiceDefinition) => GraphQLDataSource
  }
  subgraph: {
    serviceName: string
    entities: string[]
    port: number
  }
}

interface EntityConfig {
  key: string | string[]
  resolveReference?: boolean
  extend?: boolean
}
```

## Generated Files

```
api/
├── gateway/
│   ├── index.ts                    # Gateway server setup
│   ├── services.ts                 # Service configuration
│   ├── plugins/                    # Gateway plugins
│   │   ├── authPlugin.ts          # Authentication plugin
│   │   ├── tracingPlugin.ts       # Performance tracing
│   │   └── cachingPlugin.ts       # Query caching
│   └── config/
│       └── federationConfig.ts    # Federation configuration
├── subgraphs/
│   ├── books/                      # Books subgraph
│   │   ├── index.ts               # Books service
│   │   ├── schema.graphql         # Books schema
│   │   ├── resolvers/
│   │   │   ├── bookResolvers.ts   # Book resolvers
│   │   │   └── entityResolvers.ts # Entity resolvers
│   │   └── entities/
│   │       └── Book.ts            # Book entity definition
│   ├── users/                      # Users subgraph
│   │   ├── index.ts               # Users service
│   │   ├── schema.graphql         # Users schema
│   │   ├── resolvers/
│   │   │   ├── userResolvers.ts   # User resolvers
│   │   │   └── entityResolvers.ts # Entity resolvers
│   │   └── entities/
│   │       └── User.ts            # User entity definition
│   └── shared/
│       ├── types.ts               # Shared type definitions
│       └── utils.ts               # Shared utilities
```

## Gateway Setup

```typescript
// gateway/index.ts
import { ApolloServer } from '@apollo/server'
import { startStandaloneServer } from '@apollo/server/standalone'
import { ApolloGateway, IntrospectAndCompose, RemoteGraphQLDataSource } from '@apollo/gateway'
import { readFileSync } from 'fs'

class AuthenticatedDataSource extends RemoteGraphQLDataSource {
  willSendRequest({ request, context }) {
    // Forward authentication headers to subgraphs
    if (context.authorization) {
      request.http.headers.set('authorization', context.authorization)
    }

    if (context.userId) {
      request.http.headers.set('x-user-id', context.userId)
    }
  }

  didReceiveResponse({ response, context }) {
    // Log response for monitoring
    console.log(`Response from ${this.url}:`, {
      status: response.http.status,
      size: response.http.body.length,
    })

    return response
  }

  didEncounterError(error, context) {
    // Enhanced error handling
    console.error(`Error from ${this.url}:`, error.message)

    // Determine if error should be retried
    if (error.extensions?.code === 'NETWORK_ERROR') {
      // Implement retry logic
    }

    return error
  }
}

const gateway = new ApolloGateway({
  supergraphSdl: new IntrospectAndCompose({
    subgraphs: [
      { name: 'books', url: process.env.BOOKS_SERVICE_URL || 'http://localhost:4001/graphql' },
      { name: 'users', url: process.env.USERS_SERVICE_URL || 'http://localhost:4002/graphql' },
      { name: 'reviews', url: process.env.REVIEWS_SERVICE_URL || 'http://localhost:4003/graphql' },
    ],
    introspectionHeaders: {
      'apollo-federation-include-tags': 'internal',
    },
  }),
  buildService({ name, url }) {
    return new AuthenticatedDataSource({ url })
  },
})

const server = new ApolloServer({
  gateway,
  plugins: [
    // Custom plugins for federation
    {
      requestDidStart() {
        return {
          willSendSubgraphRequest(requestContext) {
            // Log subgraph requests
            console.log(`Sending request to ${requestContext.subgraph}:`, {
              operation: requestContext.request.operationName,
              query: requestContext.request.query?.slice(0, 100) + '...',
            })
          },
        }
      },
    },
  ],
})

async function startGateway() {
  try {
    const { url } = await startStandaloneServer(server, {
      listen: { port: parseInt(process.env.PORT || '4000') },
      context: async ({ req }) => {
        // Extract authentication from request
        const authorization = req.headers.authorization
        const userId = req.headers['x-user-id']

        return {
          authorization,
          userId,
          // Add other context data
        }
      },
    })

    console.log(`🚀 Federation Gateway ready at ${url}`)
  } catch (error) {
    console.error('Failed to start gateway:', error)
    process.exit(1)
  }
}

startGateway()
```

## Books Subgraph

```typescript
// subgraphs/books/index.ts
import { ApolloServer } from '@apollo/server'
import { startStandaloneServer } from '@apollo/server/standalone'
import { buildSubgraphSchema } from '@apollo/subgraph'
import { readFileSync } from 'fs'
import { resolvers } from './resolvers'
import { createContext } from './context'

const typeDefs = readFileSync('./schema.graphql', 'utf8')

const server = new ApolloServer({
  schema: buildSubgraphSchema({ typeDefs, resolvers }),
})

async function startBooksService() {
  const { url } = await startStandaloneServer(server, {
    listen: { port: 4001 },
    context: createContext,
  })

  console.log(`📚 Books service ready at ${url}`)
}

startBooksService()
```

```graphql
# subgraphs/books/schema.graphql
extend schema
  @link(
    url: "https://specs.apollo.dev/federation/v2.3"
    import: ["@key", "@shareable", "@external", "@requires", "@provides"]
  )

type Book @key(fields: "id") {
  id: ID!
  title: String!
  description: String
  content: String
  published: Boolean!
  isbn: String
  publishedDate: DateTime

  # Reference to User entity from users service
  author: User! @external
  authorId: ID!

  # Fields that can be resolved by this service
  category: Category!
  categoryId: ID!

  # Computed fields
  wordCount: Int
  estimatedReadTime: Int

  # Timestamps
  createdAt: DateTime!
  updatedAt: DateTime!
}

type Category @key(fields: "id") {
  id: ID!
  name: String!
  description: String
  books: [Book!]!
}

# Extend User entity from users service
extend type User @key(fields: "id") {
  id: ID! @external

  # Add books field to User
  books: [Book!]!
  publishedBooks: [Book!]!
  draftBooks: [Book!]!
  bookCount: Int!
}

type Query {
  books(limit: Int = 20, offset: Int = 0): [Book!]!
  book(id: ID!): Book
  booksByCategory(categoryId: ID!): [Book!]!
  categories: [Category!]!
  category(id: ID!): Category
  searchBooks(query: String!, filters: BookFiltersInput): BooksConnection!
}

type Mutation {
  createBook(input: CreateBookInput!): Book!
  updateBook(id: ID!, input: UpdateBookInput!): Book!
  deleteBook(id: ID!): Boolean!
  publishBook(id: ID!): Book!
  unpublishBook(id: ID!): Book!
}

input BookFiltersInput {
  categoryId: ID
  published: Boolean
  minWordCount: Int
  maxWordCount: Int
}

input CreateBookInput {
  title: String!
  description: String
  content: String
  categoryId: ID!
  published: Boolean = false
  isbn: String
  publishedDate: DateTime
}

input UpdateBookInput {
  title: String
  description: String
  content: String
  categoryId: ID
  published: Boolean
  isbn: String
  publishedDate: DateTime
}

type BooksConnection {
  books: [Book!]!
  totalCount: Int!
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
}

scalar DateTime
```

## Books Subgraph Resolvers

```typescript
// subgraphs/books/resolvers/bookResolvers.ts
import { Context } from '../context'

export const bookResolvers = {
  Query: {
    async books(_, { limit = 20, offset = 0 }, { prisma }: Context) {
      return prisma.book.findMany({
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
        include: {
          category: true,
        },
      })
    },

    async book(_, { id }, { prisma }: Context) {
      return prisma.book.findUnique({
        where: { id },
        include: {
          category: true,
        },
      })
    },

    async booksByCategory(_, { categoryId }, { prisma }: Context) {
      return prisma.book.findMany({
        where: { categoryId },
        orderBy: { createdAt: 'desc' },
        include: {
          category: true,
        },
      })
    },

    async categories(_, __, { prisma }: Context) {
      return prisma.category.findMany({
        orderBy: { name: 'asc' },
      })
    },

    async category(_, { id }, { prisma }: Context) {
      return prisma.category.findUnique({
        where: { id },
      })
    },

    async searchBooks(_, { query, filters }, { prisma }: Context) {
      const where: any = {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { content: { contains: query, mode: 'insensitive' } },
        ],
      }

      if (filters) {
        if (filters.categoryId) {
          where.categoryId = filters.categoryId
        }
        if (filters.published !== undefined) {
          where.published = filters.published
        }
        if (filters.minWordCount || filters.maxWordCount) {
          where.wordCount = {}
          if (filters.minWordCount) where.wordCount.gte = filters.minWordCount
          if (filters.maxWordCount) where.wordCount.lte = filters.maxWordCount
        }
      }

      const [books, totalCount] = await Promise.all([
        prisma.book.findMany({
          where,
          take: 20,
          include: { category: true },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.book.count({ where }),
      ])

      return {
        books,
        totalCount,
        hasNextPage: books.length === 20,
        hasPreviousPage: false,
      }
    },
  },

  Mutation: {
    async createBook(_, { input }, { prisma, userId }: Context) {
      if (!userId) throw new Error('Authentication required')

      const book = await prisma.book.create({
        data: {
          ...input,
          authorId: userId,
          wordCount: input.content ? input.content.split(/\s+/).length : 0,
        },
        include: {
          category: true,
        },
      })

      return book
    },

    async updateBook(_, { id, input }, { prisma, userId }: Context) {
      if (!userId) throw new Error('Authentication required')

      // Verify ownership
      const existingBook = await prisma.book.findUnique({
        where: { id },
        select: { authorId: true },
      })

      if (!existingBook || existingBook.authorId !== userId) {
        throw new Error('Book not found or access denied')
      }

      const updateData: any = { ...input }
      if (input.content) {
        updateData.wordCount = input.content.split(/\s+/).length
      }

      return prisma.book.update({
        where: { id },
        data: updateData,
        include: {
          category: true,
        },
      })
    },

    async publishBook(_, { id }, { prisma, userId }: Context) {
      return this.updateBook(_, { id, input: { published: true } }, { prisma, userId })
    },
  },

  Book: {
    // Reference resolver for author (resolved by users service)
    __resolveReference(book) {
      return book
    },

    author(book) {
      // Return a reference that will be resolved by the users service
      return { __typename: 'User', id: book.authorId }
    },

    estimatedReadTime(book) {
      // Assume 200 words per minute reading speed
      return Math.ceil((book.wordCount || 0) / 200)
    },
  },

  Category: {
    __resolveReference(category) {
      return category
    },

    async books(category, _, { prisma }: Context) {
      return prisma.book.findMany({
        where: { categoryId: category.id },
        orderBy: { createdAt: 'desc' },
        include: {
          category: true,
        },
      })
    },
  },

  // Extend User entity with books fields
  User: {
    __resolveReference(user) {
      return user
    },

    async books(user, _, { prisma }: Context) {
      return prisma.book.findMany({
        where: { authorId: user.id },
        orderBy: { createdAt: 'desc' },
        include: {
          category: true,
        },
      })
    },

    async publishedBooks(user, _, { prisma }: Context) {
      return prisma.book.findMany({
        where: {
          authorId: user.id,
          published: true,
        },
        orderBy: { publishedDate: 'desc' },
        include: {
          category: true,
        },
      })
    },

    async draftBooks(user, _, { prisma }: Context) {
      return prisma.book.findMany({
        where: {
          authorId: user.id,
          published: false,
        },
        orderBy: { updatedAt: 'desc' },
        include: {
          category: true,
        },
      })
    },

    async bookCount(user, _, { prisma }: Context) {
      return prisma.book.count({
        where: { authorId: user.id },
      })
    },
  },
}
```

## Users Subgraph

```graphql
# subgraphs/users/schema.graphql
extend schema @link(url: "https://specs.apollo.dev/federation/v2.3", import: ["@key", "@shareable", "@external"])

type User @key(fields: "id") {
  id: ID!
  name: String!
  email: String!
  username: String

  # User profile information
  profile: UserProfile

  # Social features
  followers: [User!]!
  following: [User!]!
  followerCount: Int!
  followingCount: Int!

  # User preferences
  preferences: UserPreferences

  # Timestamps
  createdAt: DateTime!
  updatedAt: DateTime!
  lastActiveAt: DateTime
}

type UserProfile {
  bio: String
  avatar: String
  website: String
  location: String
  dateOfBirth: Date
}

type UserPreferences {
  theme: Theme!
  emailNotifications: Boolean!
  pushNotifications: Boolean!
  language: String!
  timezone: String!
}

enum Theme {
  LIGHT
  DARK
  AUTO
}

type Query {
  me: User
  user(id: ID!): User
  userByUsername(username: String!): User
  users(limit: Int = 20, offset: Int = 0): [User!]!
  searchUsers(query: String!): [User!]!
}

type Mutation {
  updateProfile(input: UpdateProfileInput!): User!
  updatePreferences(input: UpdatePreferencesInput!): User!
  followUser(userId: ID!): User!
  unfollowUser(userId: ID!): User!
}

input UpdateProfileInput {
  name: String
  username: String
  bio: String
  avatar: String
  website: String
  location: String
  dateOfBirth: Date
}

input UpdatePreferencesInput {
  theme: Theme
  emailNotifications: Boolean
  pushNotifications: Boolean
  language: String
  timezone: String
}

scalar DateTime
scalar Date
```

## Federation Entity Resolution

```typescript
// subgraphs/users/resolvers/entityResolvers.ts
import { Context } from '../context'

export const entityResolvers = {
  User: {
    __resolveReference: async (user: any, { prisma }: Context) => {
      // This resolver is called when other services reference a User entity
      return prisma.user.findUnique({
        where: { id: user.id },
        include: {
          profile: true,
          preferences: true,
          _count: {
            select: {
              followers: true,
              following: true,
            },
          },
        },
      })
    },

    followerCount(user) {
      return user._count?.followers || 0
    },

    followingCount(user) {
      return user._count?.following || 0
    },

    async followers(user, _, { prisma }: Context) {
      const follows = await prisma.follow.findMany({
        where: { followingId: user.id },
        include: {
          follower: {
            include: {
              profile: true,
            },
          },
        },
      })

      return follows.map(follow => follow.follower)
    },

    async following(user, _, { prisma }: Context) {
      const follows = await prisma.follow.findMany({
        where: { followerId: user.id },
        include: {
          following: {
            include: {
              profile: true,
            },
          },
        },
      })

      return follows.map(follow => follow.following)
    },
  },
}
```

## Federation Query Examples

```typescript
// Example federated queries
const federatedQueries = {
  // Query that spans multiple services
  bookWithAuthorDetails: `
    query BookWithAuthor($id: ID!) {
      book(id: $id) {
        id
        title
        description
        category {
          name
        }
        # This field is resolved by the users service
        author {
          id
          name
          email
          profile {
            bio
            avatar
          }
          # This field is resolved by the books service
          bookCount
          publishedBooks {
            id
            title
            publishedDate
          }
        }
      }
    }
  `,

  // User with their books and social data
  userDashboard: `
    query UserDashboard($userId: ID!) {
      user(id: $userId) {
        id
        name
        email
        profile {
          bio
          avatar
        }
        followerCount
        followingCount
        
        # This field is resolved by the books service
        books {
          id
          title
          published
          category {
            name
          }
          estimatedReadTime
        }
        
        bookCount
      }
    }
  `,

  // Complex query with multiple entity extensions
  exploreBooks: `
    query ExploreBooks {
      books(limit: 10) {
        id
        title
        description
        estimatedReadTime
        
        # Author data from users service
        author {
          name
          profile {
            avatar
          }
          followerCount
          
          # Other books by this author (circular reference)
          publishedBooks {
            id
            title
            category {
              name
            }
          }
        }
        
        category {
          name
          # Other books in this category
          books {
            id
            title
            author {
              name
            }
          }
        }
      }
    }
  `,
}
```

## Federation Performance Optimization

```typescript
// gateway/plugins/cachingPlugin.ts
import { ApolloServerPlugin } from '@apollo/server'

export function createFederationCachingPlugin(): ApolloServerPlugin {
  const entityCache = new Map<string, { data: any; timestamp: number }>()
  const CACHE_TTL = 60000 // 1 minute

  return {
    requestDidStart() {
      return {
        willSendSubgraphRequest(requestContext) {
          const { request, subgraph } = requestContext

          // Check if this is an entity resolution request
          if (request.query?.includes('__resolveReference')) {
            const cacheKey = `${subgraph}:${JSON.stringify(request.variables)}`
            const cached = entityCache.get(cacheKey)

            if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
              // Return cached result
              requestContext.response = {
                data: cached.data,
                http: { status: 200 },
              }
              return
            }
          }
        },

        didReceiveSubgraphResponse(requestContext) {
          const { request, response, subgraph } = requestContext

          if (request.query?.includes('__resolveReference') && response.data) {
            const cacheKey = `${subgraph}:${JSON.stringify(request.variables)}`
            entityCache.set(cacheKey, {
              data: response.data,
              timestamp: Date.now(),
            })
          }

          return response
        },
      }
    },
  }
}
```

## Federation Monitoring

```typescript
// gateway/plugins/tracingPlugin.ts
export function createFederationTracingPlugin(): ApolloServerPlugin {
  return {
    requestDidStart() {
      const startTime = Date.now()
      const subgraphRequests: Array<{
        subgraph: string
        query: string
        duration: number
        success: boolean
      }> = []

      return {
        willSendSubgraphRequest(requestContext) {
          requestContext.subgraphStartTime = Date.now()
        },

        didReceiveSubgraphResponse(requestContext) {
          const duration = Date.now() - (requestContext.subgraphStartTime || Date.now())

          subgraphRequests.push({
            subgraph: requestContext.subgraph,
            query: requestContext.request.query?.slice(0, 100) || '',
            duration,
            success: !requestContext.response.errors?.length,
          })

          return requestContext.response
        },

        willSendResponse(requestContext) {
          const totalDuration = Date.now() - startTime

          // Log federation metrics
          console.log('Federation Request Completed:', {
            operation: requestContext.request.operationName,
            totalDuration,
            subgraphCount: subgraphRequests.length,
            subgraphRequests: subgraphRequests.map(req => ({
              subgraph: req.subgraph,
              duration: req.duration,
              success: req.success,
            })),
            slowSubgraphs: subgraphRequests.filter(req => req.duration > 100),
            failedSubgraphs: subgraphRequests.filter(req => !req.success),
          })
        },
      }
    },
  }
}
```
