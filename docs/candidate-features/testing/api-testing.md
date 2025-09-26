# API Testing

## Overview

Comprehensive API testing framework for GraphQL and REST endpoints with integration testing, contract testing, and performance validation.

## Priority

**HIGH** - Critical for API reliability and contract validation

## Dependencies

- `apollo-server` (for GraphQL API testing)
- `prisma` (for database integration testing)
- `vite` (optional, for frontend API integration)

## Feature Description

Complete API testing infrastructure covering GraphQL resolvers, REST endpoints, database integration, authentication, and performance testing.

### Key Features

- **GraphQL Testing**: Resolver testing with Apollo Server testing utilities
- **REST API Testing**: Express endpoint testing with Supertest
- **Integration Testing**: Database and external service integration
- **Contract Testing**: API schema and response validation
- **Performance Testing**: Load testing and response time validation
- **Authentication Testing**: JWT and OAuth flow testing

## Configuration

```typescript
interface APITestingConfig {
  frameworks: {
    graphql: 'apollo-server-testing' | 'graphql-request'
    rest: 'supertest' | 'jest-fetch-mock'
    integration: 'jest' | 'vitest'
  }
  database: {
    strategy: 'test-db' | 'memory' | 'transactions'
    cleanup: 'after-each' | 'after-all'
    seeding: boolean
  }
  performance: {
    enabled: boolean
    thresholds: {
      responseTime: number
      throughput: number
    }
  }
  mocking: {
    externalAPIs: boolean
    database: boolean
    authentication: boolean
  }
}
```

## Generated Files

### Test Structure

```
api/src/__tests__/
├── integration/
│   ├── graphql/
│   │   ├── user.integration.test.ts     # User API integration
│   │   ├── auth.integration.test.ts     # Authentication integration
│   │   └── book.integration.test.ts     # Book API integration
│   ├── rest/
│   │   ├── health.integration.test.ts   # Health check endpoints
│   │   └── upload.integration.test.ts   # File upload endpoints
│   └── database/
│       ├── user.db.test.ts              # User database operations
│       └── migrations.test.ts           # Migration testing
├── contract/
│   ├── schema.contract.test.ts          # GraphQL schema validation
│   ├── responses.contract.test.ts       # Response format validation
│   └── openapi.contract.test.ts         # OpenAPI spec validation
├── performance/
│   ├── graphql.perf.test.ts            # GraphQL performance tests
│   └── rest.perf.test.ts               # REST performance tests
├── mocks/
│   ├── external-apis.ts                 # External API mocks
│   ├── database.ts                      # Database mocks
│   └── auth.ts                          # Authentication mocks
├── fixtures/
│   ├── users.json                       # Test user data
│   ├── books.json                       # Test book data
│   └── responses/                       # Expected API responses
└── helpers/
    ├── testServer.ts                    # Test server setup
    ├── dbHelpers.ts                     # Database test utilities
    └── authHelpers.ts                   # Authentication helpers
```

## Code Examples

### GraphQL Integration Test

```typescript
// api/src/__tests__/integration/graphql/user.integration.test.ts
import { createTestClient } from 'apollo-server-testing'
import { gql } from 'apollo-server-express'
import { createTestServer } from '../../helpers/testServer'
import { seedTestData, cleanupTestData } from '../../helpers/dbHelpers'
import { createAuthContext } from '../../helpers/authHelpers'

describe('User GraphQL Integration', () => {
  let server: any
  let query: any
  let mutate: any

  beforeAll(async () => {
    server = await createTestServer()
    const client = createTestClient(server)
    query = client.query
    mutate = client.mutate
  })

  beforeEach(async () => {
    await seedTestData()
  })

  afterEach(async () => {
    await cleanupTestData()
  })

  afterAll(async () => {
    await server.stop()
  })

  describe('Query: users', () => {
    const GET_USERS = gql`
      query GetUsers($filter: UserFilter, $pagination: PaginationInput) {
        users(filter: $filter, pagination: $pagination) {
          data {
            id
            email
            name
            createdAt
            profile {
              bio
              avatar
            }
          }
          pagination {
            total
            page
            limit
            hasNext
            hasPrevious
          }
        }
      }
    `

    it('returns paginated users with correct structure', async () => {
      const response = await query({
        query: GET_USERS,
        variables: {
          pagination: { page: 1, limit: 10 },
        },
      })

      expect(response.errors).toBeUndefined()
      expect(response.data.users).toBeDefined()
      expect(response.data.users.data).toBeInstanceOf(Array)
      expect(response.data.users.pagination).toMatchObject({
        total: expect.any(Number),
        page: 1,
        limit: 10,
        hasNext: expect.any(Boolean),
        hasPrevious: false,
      })

      // Validate user structure
      const user = response.data.users.data[0]
      expect(user).toMatchObject({
        id: expect.any(String),
        email: expect.stringMatching(/^[^\s@]+@[^\s@]+\.[^\s@]+$/),
        name: expect.any(String),
        createdAt: expect.any(String),
        profile: expect.objectContaining({
          bio: expect.any(String),
          avatar: expect.any(String),
        }),
      })
    })

    it('filters users by search term', async () => {
      const response = await query({
        query: GET_USERS,
        variables: {
          filter: { search: 'john' },
          pagination: { page: 1, limit: 10 },
        },
      })

      expect(response.errors).toBeUndefined()

      // All returned users should match the search term
      const users = response.data.users.data
      users.forEach((user: any) => {
        const searchableText = `${user.name} ${user.email}`.toLowerCase()
        expect(searchableText).toContain('john')
      })
    })

    it('requires authentication for sensitive user data', async () => {
      const SENSITIVE_USERS = gql`
        query GetUsersWithSensitiveData {
          users {
            data {
              id
              email
              lastLoginAt
              ipAddress
            }
          }
        }
      `

      // Without authentication
      const response = await query({ query: SENSITIVE_USERS })
      expect(response.errors).toBeDefined()
      expect(response.errors[0].message).toContain('Authentication required')
    })
  })

  describe('Mutation: createUser', () => {
    const CREATE_USER = gql`
      mutation CreateUser($input: CreateUserInput!) {
        createUser(input: $input) {
          id
          email
          name
          createdAt
        }
      }
    `

    it('creates user with valid input', async () => {
      const userInput = {
        email: 'newuser@test.com',
        name: 'New User',
        password: 'SecurePass123!',
        profile: {
          bio: 'Test user bio',
        },
      }

      const response = await mutate({
        mutation: CREATE_USER,
        variables: { input: userInput },
      })

      expect(response.errors).toBeUndefined()
      expect(response.data.createUser).toMatchObject({
        id: expect.any(String),
        email: userInput.email,
        name: userInput.name,
        createdAt: expect.any(String),
      })

      // Verify user was actually created in database
      const createdUser = await prisma.user.findUnique({
        where: { email: userInput.email },
        include: { profile: true },
      })
      expect(createdUser).toBeTruthy()
      expect(createdUser.profile.bio).toBe(userInput.profile.bio)
    })

    it('validates email uniqueness', async () => {
      const userInput = {
        email: 'existing@test.com', // This email already exists in seed data
        name: 'Duplicate User',
        password: 'SecurePass123!',
      }

      const response = await mutate({
        mutation: CREATE_USER,
        variables: { input: userInput },
      })

      expect(response.errors).toBeDefined()
      expect(response.errors[0].message).toContain('Email already exists')
    })

    it('validates password strength', async () => {
      const userInput = {
        email: 'weakpass@test.com',
        name: 'Weak Password User',
        password: '123', // Weak password
      }

      const response = await mutate({
        mutation: CREATE_USER,
        variables: { input: userInput },
      })

      expect(response.errors).toBeDefined()
      expect(response.errors[0].message).toContain('Password must be at least')
    })
  })

  describe('Authentication Integration', () => {
    it('authenticates user and returns valid JWT', async () => {
      const LOGIN_MUTATION = gql`
        mutation Login($email: String!, $password: String!) {
          login(email: $email, password: $password) {
            user {
              id
              email
              name
            }
            token
            refreshToken
          }
        }
      `

      const response = await mutate({
        mutation: LOGIN_MUTATION,
        variables: {
          email: 'testuser@example.com',
          password: 'testpassword123',
        },
      })

      expect(response.errors).toBeUndefined()
      expect(response.data.login).toMatchObject({
        user: {
          id: expect.any(String),
          email: 'testuser@example.com',
          name: expect.any(String),
        },
        token: expect.any(String),
        refreshToken: expect.any(String),
      })

      // Validate JWT token structure
      const token = response.data.login.token
      const tokenParts = token.split('.')
      expect(tokenParts).toHaveLength(3) // Header, payload, signature
    })

    it('uses JWT token for authenticated requests', async () => {
      const authContext = await createAuthContext('testuser@example.com')

      const PROTECTED_QUERY = gql`
        query GetCurrentUser {
          currentUser {
            id
            email
            name
          }
        }
      `

      const response = await query({
        query: PROTECTED_QUERY,
        context: authContext,
      })

      expect(response.errors).toBeUndefined()
      expect(response.data.currentUser).toMatchObject({
        id: expect.any(String),
        email: 'testuser@example.com',
        name: expect.any(String),
      })
    })
  })
})
```

### REST API Integration Test

```typescript
// api/src/__tests__/integration/rest/upload.integration.test.ts
import request from 'supertest'
import path from 'path'
import fs from 'fs'
import { app } from '../../../server'
import { createAuthToken } from '../../helpers/authHelpers'

describe('File Upload Integration', () => {
  let authToken: string

  beforeAll(async () => {
    authToken = await createAuthToken({ userId: 'test-user-id' })
  })

  afterEach(async () => {
    // Cleanup uploaded test files
    const uploadsDir = path.join(__dirname, '../../../uploads/test')
    if (fs.existsSync(uploadsDir)) {
      fs.rmSync(uploadsDir, { recursive: true })
    }
  })

  describe('POST /api/upload/avatar', () => {
    it('uploads avatar image successfully', async () => {
      const testImagePath = path.join(__dirname, '../../fixtures/test-avatar.jpg')

      const response = await request(app)
        .post('/api/upload/avatar')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('avatar', testImagePath)
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        data: {
          filename: expect.any(String),
          originalName: 'test-avatar.jpg',
          size: expect.any(Number),
          mimetype: 'image/jpeg',
          url: expect.stringMatching(/^\/uploads\/avatars\//),
        },
      })

      // Verify file was actually saved
      const uploadedFilePath = path.join(__dirname, '../../../public', response.body.data.url)
      expect(fs.existsSync(uploadedFilePath)).toBe(true)
    })

    it('rejects invalid file types', async () => {
      const testFilePath = path.join(__dirname, '../../fixtures/test-document.pdf')

      await request(app)
        .post('/api/upload/avatar')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('avatar', testFilePath)
        .expect(400)
        .expect(res => {
          expect(res.body.error).toContain('Invalid file type')
        })
    })

    it('rejects files exceeding size limit', async () => {
      const testImagePath = path.join(__dirname, '../../fixtures/large-image.jpg') // 10MB file

      await request(app)
        .post('/api/upload/avatar')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('avatar', testImagePath)
        .expect(413)
        .expect(res => {
          expect(res.body.error).toContain('File too large')
        })
    })

    it('requires authentication', async () => {
      const testImagePath = path.join(__dirname, '../../fixtures/test-avatar.jpg')

      await request(app)
        .post('/api/upload/avatar')
        .attach('avatar', testImagePath)
        .expect(401)
        .expect(res => {
          expect(res.body.error).toContain('Authentication required')
        })
    })
  })

  describe('POST /api/upload/documents', () => {
    it('uploads multiple documents', async () => {
      const doc1Path = path.join(__dirname, '../../fixtures/document1.pdf')
      const doc2Path = path.join(__dirname, '../../fixtures/document2.docx')

      const response = await request(app)
        .post('/api/upload/documents')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('documents', doc1Path)
        .attach('documents', doc2Path)
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        data: {
          uploadedFiles: expect.arrayContaining([
            expect.objectContaining({
              filename: expect.any(String),
              originalName: expect.any(String),
              size: expect.any(Number),
              mimetype: expect.any(String),
            }),
          ]),
        },
      })

      expect(response.body.data.uploadedFiles).toHaveLength(2)
    })
  })
})
```

### Contract Testing

```typescript
// api/src/__tests__/contract/schema.contract.test.ts
import { buildSchema } from 'graphql'
import { printSchema } from 'graphql/utilities'
import { schema } from '../../schema'
import fs from 'fs'
import path from 'path'

describe('GraphQL Schema Contract', () => {
  const expectedSchemaPath = path.join(__dirname, '../fixtures/expected-schema.graphql')

  it('matches expected schema structure', () => {
    const currentSchema = printSchema(schema)

    // Save current schema for comparison
    fs.writeFileSync(path.join(__dirname, '../generated/current-schema.graphql'), currentSchema)

    if (fs.existsSync(expectedSchemaPath)) {
      const expectedSchema = fs.readFileSync(expectedSchemaPath, 'utf8')
      expect(currentSchema).toBe(expectedSchema)
    } else {
      // First run - save current schema as expected
      fs.writeFileSync(expectedSchemaPath, currentSchema)
      console.warn('Expected schema not found. Saved current schema as baseline.')
    }
  })

  it('validates all required types exist', () => {
    const typeMap = schema.getTypeMap()

    const requiredTypes = [
      'User',
      'Book',
      'Query',
      'Mutation',
      'CreateUserInput',
      'UpdateUserInput',
      'PaginationInput',
      'UserFilter',
    ]

    requiredTypes.forEach(typeName => {
      expect(typeMap[typeName]).toBeDefined()
      expect(typeMap[typeName].name).toBe(typeName)
    })
  })

  it('validates query fields have correct return types', () => {
    const queryType = schema.getQueryType()
    const fields = queryType?.getFields()

    expect(fields?.users?.type.toString()).toMatch(/UserConnection/)
    expect(fields?.user?.type.toString()).toMatch(/User/)
    expect(fields?.books?.type.toString()).toMatch(/BookConnection/)
    expect(fields?.currentUser?.type.toString()).toMatch(/User/)
  })

  it('validates mutation fields exist and have correct signatures', () => {
    const mutationType = schema.getMutationType()
    const fields = mutationType?.getFields()

    expect(fields?.createUser).toBeDefined()
    expect(fields?.updateUser).toBeDefined()
    expect(fields?.deleteUser).toBeDefined()
    expect(fields?.login).toBeDefined()
    expect(fields?.logout).toBeDefined()

    // Validate input types
    expect(fields?.createUser?.args[0].type.toString()).toContain('CreateUserInput!')
    expect(fields?.updateUser?.args[0].type.toString()).toContain('String!')
    expect(fields?.updateUser?.args[1].type.toString()).toContain('UpdateUserInput!')
  })
})
```

### Performance Testing

```typescript
// api/src/__tests__/performance/graphql.perf.test.ts
import { createTestClient } from 'apollo-server-testing'
import { gql } from 'apollo-server-express'
import { createTestServer } from '../../helpers/testServer'
import { performance } from 'perf_hooks'

describe('GraphQL Performance Tests', () => {
  let server: any
  let query: any

  beforeAll(async () => {
    server = await createTestServer()
    const client = createTestClient(server)
    query = client.query
  })

  afterAll(async () => {
    await server.stop()
  })

  it('users query responds within acceptable time', async () => {
    const GET_USERS = gql`
      query GetUsers {
        users {
          data {
            id
            email
            name
            profile {
              bio
              avatar
            }
          }
        }
      }
    `

    const start = performance.now()
    const response = await query({ query: GET_USERS })
    const end = performance.now()

    const responseTime = end - start

    expect(response.errors).toBeUndefined()
    expect(responseTime).toBeLessThan(1000) // Should respond within 1 second
  })

  it('handles N+1 queries efficiently with DataLoader', async () => {
    const GET_USERS_WITH_BOOKS = gql`
      query GetUsersWithBooks {
        users {
          data {
            id
            name
            books {
              id
              title
              author
            }
          }
        }
      }
    `

    const start = performance.now()
    const response = await query({ query: GET_USERS_WITH_BOOKS })
    const end = performance.now()

    const responseTime = end - start

    expect(response.errors).toBeUndefined()
    expect(responseTime).toBeLessThan(2000) // Should handle nested queries efficiently

    // Log query performance for analysis
    console.log(`Users with books query took ${responseTime.toFixed(2)}ms`)
  })

  it('handles concurrent requests without degradation', async () => {
    const SIMPLE_QUERY = gql`
      query GetUserCount {
        userStats {
          totalUsers
        }
      }
    `

    const concurrentRequests = 10
    const requests = Array(concurrentRequests)
      .fill(null)
      .map(() => {
        const start = performance.now()
        return query({ query: SIMPLE_QUERY }).then(response => {
          const end = performance.now()
          return { response, time: end - start }
        })
      })

    const results = await Promise.all(requests)

    // All requests should succeed
    results.forEach(({ response }) => {
      expect(response.errors).toBeUndefined()
    })

    // Calculate average response time
    const avgResponseTime = results.reduce((sum, { time }) => sum + time, 0) / results.length
    expect(avgResponseTime).toBeLessThan(500) // Average should be under 500ms
  })
})
```

### Test Helper Utilities

```typescript
// api/src/__tests__/helpers/testServer.ts
import { ApolloServer } from 'apollo-server-express'
import { createSchema } from '../../schema'
import { createTestContext } from './dbHelpers'

export async function createTestServer() {
  const schema = await createSchema()

  const server = new ApolloServer({
    schema,
    context: ({ req }) => createTestContext(req),
    formatError: error => {
      // Log errors in test environment
      console.error('GraphQL Error:', error)
      return error
    },
  })

  await server.start()
  return server
}

// api/src/__tests__/helpers/authHelpers.ts
import jwt from 'jsonwebtoken'
import { prisma } from '../../lib/prisma'

export async function createAuthToken(payload: any) {
  return jwt.sign(payload, process.env.JWT_SECRET || 'test-secret', {
    expiresIn: '1h',
  })
}

export async function createAuthContext(email: string) {
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) throw new Error('Test user not found')

  const token = await createAuthToken({ userId: user.id })
  return {
    user,
    token,
    req: {
      headers: {
        authorization: `Bearer ${token}`,
      },
    },
  }
}
```

## Installation Steps

1. **Install API Testing Dependencies**

   ```bash
   # Core testing libraries
   pnpm add -D supertest @types/supertest
   pnpm add -D apollo-server-testing
   pnpm add -D @graphql-tools/mock @graphql-tools/schema

   # Performance testing
   pnpm add -D clinic autocannon
   ```

2. **Setup Test Scripts**

   ```json
   {
     "scripts": {
       "test:api": "jest --testPathPattern=integration",
       "test:contract": "jest --testPathPattern=contract",
       "test:perf": "jest --testPathPattern=performance",
       "test:load": "autocannon http://localhost:4000/graphql"
     }
   }
   ```

3. **Configure Test Database**
   ```env
   # .env.test
   DATABASE_URL=postgresql://user:password@localhost:5432/myapp_test
   JWT_SECRET=test-jwt-secret
   UPLOAD_DIR=./uploads/test
   ```

This API testing framework provides comprehensive coverage for GraphQL and REST APIs with integration, contract, and performance validation.
