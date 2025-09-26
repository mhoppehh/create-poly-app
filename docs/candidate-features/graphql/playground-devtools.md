# GraphQL Playground & Developer Tools

## Overview

Comprehensive GraphQL development environment with interactive playground, schema exploration, query testing, and developer productivity tools.

## Priority

**MEDIUM** - Significantly improves developer experience and API discoverability

## Dependencies

- `apollo-server` (base GraphQL server)
- `graphql-playground-middleware-express` (Playground UI)
- `apollo-studio` (Apollo Studio integration)

## Components

### GraphQL Playground

- **Interactive Query Interface**: Rich query editor with syntax highlighting and auto-completion
- **Schema Explorer**: Browse GraphQL schema, types, and documentation
- **Query History**: Save and manage frequently used queries
- **Variables Panel**: Test queries with dynamic variables and mock data
- **Headers Management**: Configure authentication and request headers

### Apollo Studio Integration

- **Schema Registry**: Centralized schema management and versioning
- **Performance Monitoring**: Query performance metrics and optimization insights
- **Schema Validation**: Validate schema changes and breaking changes
- **Team Collaboration**: Share queries, mutations, and schema documentation
- **Analytics Dashboard**: Usage analytics and performance insights

### Developer Tools

- **Query Complexity Analysis**: Analyze and limit query complexity
- **Performance Profiling**: Profile resolver execution and identify bottlenecks
- **Error Tracking**: Enhanced error reporting with stack traces
- **Debug Mode**: Detailed logging and debugging information
- **Schema Linting**: Validate schema best practices and conventions

### Documentation Generator

- **Auto-generated Docs**: Generate comprehensive API documentation from schema
- **Interactive Examples**: Executable code examples for all operations
- **Type Documentation**: Detailed type definitions and field descriptions
- **Usage Examples**: Real-world query and mutation examples
- **Integration Guides**: SDK usage and client integration examples

### Testing Tools

- **Query Testing**: Built-in query testing and validation
- **Mock Data**: Generate realistic mock data for development
- **Schema Testing**: Test schema changes and backward compatibility
- **Load Testing**: Performance testing tools for GraphQL operations
- **Regression Testing**: Automated testing for schema changes

## Configuration

```typescript
interface PlaygroundConfig {
  enabled: boolean
  endpoint: string
  subscriptionEndpoint?: string
  settings: {
    'editor.theme': 'dark' | 'light'
    'editor.cursorShape': 'line' | 'block'
    'editor.fontFamily': string
    'general.betaUpdates': boolean
    'queryPlan.hideQueryPlanResponse': boolean
    'schema.polling.enable': boolean
    'schema.disableComments': boolean
    'tracing.hideTracingResponse': boolean
  }
}

interface StudioConfig {
  apiKey?: string
  schemaTag?: string
  federatedServiceName?: string
  federatedServiceUrl?: string
}
```

## Generated Files

```
api/src/
├── playground/
│   ├── index.ts                    # Playground configuration
│   ├── config.ts                   # Environment-specific settings
│   ├── queries/
│   │   ├── examples.ts             # Example queries and mutations
│   │   ├── bookQueries.ts         # Book-related example queries
│   │   ├── userQueries.ts         # User-related example queries
│   │   └── complexQueries.ts      # Complex query examples
│   ├── tools/
│   │   ├── queryComplexity.ts     # Query complexity analysis
│   │   ├── performanceProfiler.ts # Performance profiling
│   │   ├── mockDataGenerator.ts   # Mock data generation
│   │   └── schemaValidator.ts     # Schema validation tools
│   └── documentation/
│       ├── generator.ts           # Auto-documentation generation
│       ├── templates/             # Documentation templates
│       └── examples/              # Code examples
```

## Playground Setup

```typescript
// playground/index.ts
import { ApolloServer } from '@apollo/server'
import { expressMiddleware } from '@apollo/server/express4'
import express from 'express'
import { createHandler } from 'graphql-http/lib/use/express'
import { buildSubgraphSchema } from '@apollo/subgraph'
import { typeDefs } from '../schema/typeDefs'
import { resolvers } from '../schema/resolvers'
import { createContext } from '../context'

export interface PlaygroundOptions {
  enabled?: boolean
  endpoint?: string
  subscriptionEndpoint?: string
  apolloStudioApiKey?: string
  introspection?: boolean
  playground?: boolean | PlaygroundConfig
}

export function setupPlayground(app: express.Application, options: PlaygroundOptions = {}) {
  const {
    enabled = process.env.NODE_ENV !== 'production',
    endpoint = '/graphql',
    subscriptionEndpoint = '/graphql',
    introspection = process.env.NODE_ENV !== 'production',
    playground = process.env.NODE_ENV !== 'production',
  } = options

  if (enabled && playground) {
    // Enhanced playground configuration
    const playgroundConfig = typeof playground === 'boolean' ? {} : playground

    app.get('/playground', (req, res) => {
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>GraphQL Playground</title>
          <link rel="stylesheet" href="//cdn.jsdelivr.net/npm/graphql-playground-react/build/static/css/index.css" />
          <link rel="shortcut icon" href="//cdn.jsdelivr.net/npm/graphql-playground-react/build/favicon.png" />
          <script src="//cdn.jsdelivr.net/npm/graphql-playground-react/build/static/js/middleware.js"></script>
        </head>
        <body>
          <div id="root">
            <style>
              body {
                background-color: rgb(23, 42, 58);
                font-family: Open Sans, sans-serif;
                height: 90vh;
              }
              #root {
                height: 100%;
                width: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
              }
              .loading {
                font-size: 32px;
                font-weight: 200;
                color: rgba(255, 255, 255, .6);
                margin-left: 20px;
              }
              img {
                width: 78px;
                height: 78px;
              }
              .title {
                font-weight: 400;
              }
            </style>
            <img src="//cdn.jsdelivr.net/npm/graphql-playground-react/build/logo.png" alt="" />
            <div class="loading"> Loading
              <span class="title">GraphQL Playground</span>
            </div>
          </div>
          <script>
            window.addEventListener('load', function (event) {
              GraphQLPlayground.init(document.getElementById('root'), {
                endpoint: '${endpoint}',
                subscriptionEndpoint: '${subscriptionEndpoint}',
                settings: ${JSON.stringify({
                  'editor.theme': 'dark',
                  'editor.cursorShape': 'line',
                  'editor.fontSize': 14,
                  'editor.fontFamily':
                    '"Source Code Pro", "Consolas", "Inconsolata", "Droid Sans Mono", "Monaco", monospace',
                  'general.betaUpdates': false,
                  'queryPlan.hideQueryPlanResponse': false,
                  'schema.polling.enable': true,
                  'schema.polling.endpointFilter': '*localhost*',
                  'schema.polling.interval': 2000,
                  'schema.disableComments': false,
                  'tracing.hideTracingResponse': false,
                  ...playgroundConfig.settings,
                })},
                tabs: [
                  {
                    endpoint: '${endpoint}',
                    query: \`# Welcome to GraphQL Playground!
# GraphQL is a query language for APIs and a runtime for fulfilling those queries with your existing data.
#
# Here are some example queries to get you started:

# Get all books with their authors
query GetBooks {
  books {
    id
    title
    description
    author {
      id
      name
      email
    }
    category {
      id
      name
    }
    likesCount
    createdAt
  }
}

# Get a specific book by ID
query GetBook($id: ID!) {
  book(id: $id) {
    id
    title
    description
    content
    author {
      id
      name
      profile {
        bio
        avatar
      }
    }
    comments {
      id
      content
      author {
        name
      }
      createdAt
    }
  }
}

# Create a new book
mutation CreateBook($input: CreateBookInput!) {
  createBook(input: $input) {
    id
    title
    description
    author {
      name
    }
    createdAt
  }
}
\`,
                    variables: JSON.stringify({
                      id: "1",
                      input: {
                        title: "My New Book",
                        description: "An exciting new book",
                        categoryId: "1"
                      }
                    }, null, 2)
                  }
                ]
              })
            })
          </script>
        </body>
        </html>
      `)
    })
  }

  return { enabled, introspection }
}
```

## Example Queries Collection

```typescript
// playground/queries/examples.ts
export const EXAMPLE_QUERIES = {
  // Basic queries
  getAllBooks: `
    query GetAllBooks {
      books {
        id
        title
        description
        author {
          id
          name
          profile {
            bio
            avatar
          }
        }
        category {
          id
          name
        }
        likesCount
        isLikedByMe
        createdAt
      }
    }
  `,

  getBookById: `
    query GetBook($id: ID!) {
      book(id: $id) {
        id
        title
        description
        content
        published
        author {
          id
          name
          email
          profile {
            bio
            avatar
            website
          }
          books {
            id
            title
            published
          }
        }
        category {
          id
          name
          description
          books {
            id
            title
          }
        }
        comments {
          id
          content
          author {
            id
            name
            profile {
              avatar
            }
          }
          likes {
            user {
              name
            }
          }
          createdAt
        }
        likesCount
        isLikedByMe
        createdAt
        updatedAt
      }
    }
  `,

  searchBooks: `
    query SearchBooks($query: String!, $filters: BookFiltersInput) {
      searchBooks(query: $query, filters: $filters) {
        books {
          id
          title
          description
          author {
            name
          }
          category {
            name
          }
          likesCount
        }
        totalCount
        hasNextPage
        hasPreviousPage
      }
    }
  `,

  // Mutations
  createBook: `
    mutation CreateBook($input: CreateBookInput!) {
      createBook(input: $input) {
        id
        title
        description
        content
        published
        author {
          id
          name
        }
        category {
          id
          name
        }
        createdAt
      }
    }
  `,

  updateBook: `
    mutation UpdateBook($id: ID!, $input: UpdateBookInput!) {
      updateBook(id: $id, input: $input) {
        id
        title
        description
        content
        published
        updatedAt
      }
    }
  `,

  likeBook: `
    mutation LikeBook($bookId: ID!) {
      likeBook(bookId: $bookId) {
        id
        user {
          id
          name
        }
        book {
          id
          title
          likesCount
        }
        createdAt
      }
    }
  `,

  addComment: `
    mutation AddComment($input: AddCommentInput!) {
      addComment(input: $input) {
        id
        content
        author {
          id
          name
          profile {
            avatar
          }
        }
        book {
          id
          title
        }
        createdAt
      }
    }
  `,

  // Subscriptions
  bookAdded: `
    subscription BookAdded($category: String) {
      bookAdded(category: $category) {
        id
        title
        description
        author {
          id
          name
        }
        category {
          id
          name
        }
        createdAt
      }
    }
  `,

  bookLiked: `
    subscription BookLiked($bookId: ID) {
      bookLiked(bookId: $bookId) {
        bookId
        userId
        user {
          name
          profile {
            avatar
          }
        }
        timestamp
      }
    }
  `,

  // Complex queries
  userDashboard: `
    query UserDashboard {
      me {
        id
        name
        email
        profile {
          bio
          avatar
          website
        }
        books {
          id
          title
          published
          likesCount
          commentsCount
        }
        likedBooks {
          id
          title
          author {
            name
          }
        }
        followers {
          id
          name
          profile {
            avatar
          }
        }
        following {
          id
          name
          profile {
            avatar
          }
        }
        stats {
          totalBooks
          totalLikes
          totalComments
          totalFollowers
          totalFollowing
        }
      }
    }
  `,

  bookAnalytics: `
    query BookAnalytics($bookId: ID!) {
      book(id: $bookId) {
        id
        title
        analytics {
          views
          likes
          comments
          shares
          viewsThisWeek
          viewsThisMonth
          topReferrers
          popularSections
          averageReadTime
          completionRate
        }
      }
    }
  `,
}

export const EXAMPLE_VARIABLES = {
  bookId: { id: 'cljk1234567890' },
  createBook: {
    input: {
      title: 'My Awesome Book',
      description: 'This is a really great book about GraphQL',
      content: '# Chapter 1\n\nThis is the beginning of something great...',
      categoryId: 'cljk0987654321',
      published: false,
    },
  },
  updateBook: {
    id: 'cljk1234567890',
    input: {
      title: 'My Updated Book',
      description: 'Updated description',
      published: true,
    },
  },
  searchBooks: {
    query: 'GraphQL',
    filters: {
      categoryId: 'cljk0987654321',
      published: true,
      authorId: null,
    },
  },
  likeBook: { bookId: 'cljk1234567890' },
  addComment: {
    input: {
      bookId: 'cljk1234567890',
      content: 'Great book! Really enjoyed reading it.',
      parentId: null,
    },
  },
}
```

## Query Complexity Analysis

```typescript
// playground/tools/queryComplexity.ts
import { separateOperations, parse, visit } from 'graphql'
import { GraphQLSchema } from 'graphql'

export interface ComplexityAnalysis {
  totalComplexity: number
  maxDepth: number
  fieldCount: number
  aliasCount: number
  recommendations: string[]
  warnings: string[]
}

export class QueryComplexityAnalyzer {
  constructor(private schema: GraphQLSchema) {}

  analyzeQuery(query: string): ComplexityAnalysis {
    const document = parse(query)
    const operations = separateOperations(document)

    let totalComplexity = 0
    let maxDepth = 0
    let fieldCount = 0
    let aliasCount = 0
    const recommendations: string[] = []
    const warnings: string[] = []

    for (const [operationName, operation] of Object.entries(operations)) {
      const analysis = this.analyzeOperation(operation)

      totalComplexity += analysis.complexity
      maxDepth = Math.max(maxDepth, analysis.depth)
      fieldCount += analysis.fields
      aliasCount += analysis.aliases

      // Add operation-specific recommendations
      if (analysis.complexity > 100) {
        warnings.push(`Operation ${operationName} has high complexity (${analysis.complexity})`)
        recommendations.push(`Consider breaking down ${operationName} into smaller queries`)
      }

      if (analysis.depth > 10) {
        warnings.push(`Operation ${operationName} has deep nesting (${analysis.depth} levels)`)
        recommendations.push(`Consider flattening the query structure for ${operationName}`)
      }

      if (analysis.fields > 50) {
        warnings.push(`Operation ${operationName} requests many fields (${analysis.fields})`)
        recommendations.push(`Consider selecting only necessary fields in ${operationName}`)
      }
    }

    return {
      totalComplexity,
      maxDepth,
      fieldCount,
      aliasCount,
      recommendations,
      warnings,
    }
  }

  private analyzeOperation(operation: any) {
    let complexity = 0
    let maxDepth = 0
    let fields = 0
    let aliases = 0

    const analyze = (node: any, depth = 0) => {
      maxDepth = Math.max(maxDepth, depth)

      visit(node, {
        Field: {
          enter: fieldNode => {
            fields++
            complexity += this.calculateFieldComplexity(fieldNode, depth)

            if (fieldNode.alias) {
              aliases++
            }
          },
        },
        SelectionSet: {
          enter: selectionSet => {
            return analyze(selectionSet, depth + 1)
          },
        },
      })
    }

    analyze(operation)

    return { complexity, depth: maxDepth, fields, aliases }
  }

  private calculateFieldComplexity(fieldNode: any, depth: number): number {
    const baseComplexity = 1
    const depthMultiplier = Math.pow(1.5, depth)

    // Increase complexity for certain field types
    const fieldName = fieldNode.name.value
    let fieldMultiplier = 1

    // List fields are more complex
    if (fieldName.endsWith('s') || fieldName.includes('list')) {
      fieldMultiplier = 2
    }

    // Connection/pagination fields
    if (fieldName.includes('Connection') || fieldName.includes('edges')) {
      fieldMultiplier = 1.5
    }

    // Nested relationship fields
    if (fieldNode.selectionSet && fieldNode.selectionSet.selections.length > 5) {
      fieldMultiplier *= 1.5
    }

    return Math.ceil(baseComplexity * depthMultiplier * fieldMultiplier)
  }

  generateOptimizationSuggestions(analysis: ComplexityAnalysis): string[] {
    const suggestions: string[] = []

    if (analysis.totalComplexity > 200) {
      suggestions.push('Consider implementing query complexity limits')
      suggestions.push('Use DataLoader to batch database queries')
      suggestions.push('Consider pagination for list fields')
    }

    if (analysis.maxDepth > 8) {
      suggestions.push('Implement maximum query depth limits')
      suggestions.push('Consider flattening deeply nested structures')
    }

    if (analysis.fieldCount > 100) {
      suggestions.push('Implement field selection limits')
      suggestions.push('Consider using fragments to reuse field selections')
      suggestions.push('Implement field-level caching')
    }

    if (analysis.aliasCount > 20) {
      suggestions.push('Monitor alias usage for potential abuse')
      suggestions.push('Consider limits on alias count per query')
    }

    return suggestions
  }
}
```

## Performance Profiler

```typescript
// playground/tools/performanceProfiler.ts
export interface ResolverProfile {
  fieldName: string
  typeName: string
  executionTime: number
  calls: number
  averageTime: number
  slowCalls: number
  errors: number
}

export interface QueryProfile {
  operationName?: string
  totalTime: number
  resolverProfiles: ResolverProfile[]
  cacheHits: number
  cacheMisses: number
  databaseQueries: number
}

export class GraphQLPerformanceProfiler {
  private profiles = new Map<string, ResolverProfile>()
  private queryProfiles: QueryProfile[] = []

  startProfiling() {
    // Reset profiles
    this.profiles.clear()
    this.queryProfiles = []
  }

  recordResolver(typeName: string, fieldName: string, executionTime: number, error?: Error) {
    const key = `${typeName}.${fieldName}`
    const profile = this.profiles.get(key) || {
      fieldName,
      typeName,
      executionTime: 0,
      calls: 0,
      averageTime: 0,
      slowCalls: 0,
      errors: 0,
    }

    profile.calls++
    profile.executionTime += executionTime
    profile.averageTime = profile.executionTime / profile.calls

    if (executionTime > 100) {
      // Consider > 100ms as slow
      profile.slowCalls++
    }

    if (error) {
      profile.errors++
    }

    this.profiles.set(key, profile)
  }

  recordQuery(profile: QueryProfile) {
    this.queryProfiles.push(profile)
  }

  getProfilingReport() {
    const resolvers = Array.from(this.profiles.values()).sort((a, b) => b.averageTime - a.averageTime)

    const totalQueries = this.queryProfiles.length
    const averageQueryTime =
      totalQueries > 0 ? this.queryProfiles.reduce((sum, q) => sum + q.totalTime, 0) / totalQueries : 0

    return {
      summary: {
        totalQueries,
        averageQueryTime,
        totalResolvers: resolvers.length,
        slowResolvers: resolvers.filter(r => r.averageTime > 100).length,
        errorResolvers: resolvers.filter(r => r.errors > 0).length,
      },
      topSlowResolvers: resolvers.slice(0, 10),
      topErrorResolvers: resolvers
        .filter(r => r.errors > 0)
        .sort((a, b) => b.errors - a.errors)
        .slice(0, 10),
      queryProfiles: this.queryProfiles.slice(-50), // Last 50 queries
      recommendations: this.generateRecommendations(resolvers),
    }
  }

  private generateRecommendations(resolvers: ResolverProfile[]): string[] {
    const recommendations: string[] = []

    const slowResolvers = resolvers.filter(r => r.averageTime > 100)
    if (slowResolvers.length > 0) {
      recommendations.push(`Optimize ${slowResolvers.length} slow resolvers (>100ms average)`)
      slowResolvers.slice(0, 3).forEach(resolver => {
        recommendations.push(
          `- ${resolver.typeName}.${resolver.fieldName}: ${resolver.averageTime.toFixed(2)}ms average`,
        )
      })
    }

    const errorResolvers = resolvers.filter(r => r.errors > 0)
    if (errorResolvers.length > 0) {
      recommendations.push(`Fix ${errorResolvers.length} resolvers with errors`)
      errorResolvers.slice(0, 3).forEach(resolver => {
        recommendations.push(`- ${resolver.typeName}.${resolver.fieldName}: ${resolver.errors} errors`)
      })
    }

    const highCallResolvers = resolvers.filter(r => r.calls > 100)
    if (highCallResolvers.length > 0) {
      recommendations.push('Consider implementing DataLoader for high-frequency resolvers')
      highCallResolvers.slice(0, 3).forEach(resolver => {
        recommendations.push(`- ${resolver.typeName}.${resolver.fieldName}: ${resolver.calls} calls`)
      })
    }

    return recommendations
  }

  exportReport(format: 'json' | 'csv' = 'json'): string {
    const report = this.getProfilingReport()

    if (format === 'csv') {
      const headers = ['TypeName', 'FieldName', 'Calls', 'AverageTime', 'TotalTime', 'SlowCalls', 'Errors']
      const rows = Array.from(this.profiles.values()).map(profile => [
        profile.typeName,
        profile.fieldName,
        profile.calls,
        profile.averageTime.toFixed(2),
        profile.executionTime.toFixed(2),
        profile.slowCalls,
        profile.errors,
      ])

      return [headers, ...rows].map(row => row.join(',')).join('\n')
    }

    return JSON.stringify(report, null, 2)
  }
}

export const performanceProfiler = new GraphQLPerformanceProfiler()
```

## Mock Data Generator

```typescript
// playground/tools/mockDataGenerator.ts
import {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLList,
  GraphQLNonNull,
  isObjectType,
  isListType,
  isNonNullType,
  isScalarType,
} from 'graphql'
import { faker } from '@faker-js/faker'

export interface MockDataOptions {
  locale?: string
  seed?: number
  listSize?: { min: number; max: number }
  customMocks?: Record<string, () => any>
}

export class MockDataGenerator {
  private options: MockDataOptions

  constructor(options: MockDataOptions = {}) {
    this.options = {
      locale: 'en',
      seed: 12345,
      listSize: { min: 3, max: 8 },
      ...options,
    }

    if (this.options.seed) {
      faker.seed(this.options.seed)
    }
  }

  generateMockData(schema: GraphQLSchema, typeName: string, depth = 0): any {
    if (depth > 5) return null // Prevent infinite recursion

    const type = schema.getType(typeName)
    if (!type) return null

    if (isObjectType(type)) {
      return this.generateObjectMock(schema, type, depth)
    }

    if (isScalarType(type)) {
      return this.generateScalarMock(type.name)
    }

    return null
  }

  private generateObjectMock(schema: GraphQLSchema, type: GraphQLObjectType, depth: number): any {
    const mock: any = {}
    const fields = type.getFields()

    for (const [fieldName, field] of Object.entries(fields)) {
      // Skip if custom mock provided
      if (this.options.customMocks?.[`${type.name}.${fieldName}`]) {
        mock[fieldName] = this.options.customMocks[`${type.name}.${fieldName}`]()
        continue
      }

      let fieldType = field.type

      // Handle NonNull wrapper
      if (isNonNullType(fieldType)) {
        fieldType = fieldType.ofType
      }

      // Handle List wrapper
      if (isListType(fieldType)) {
        const itemType = isNonNullType(fieldType.ofType) ? fieldType.ofType.ofType : fieldType.ofType
        const listSize = faker.number.int(this.options.listSize!)

        if (isScalarType(itemType)) {
          mock[fieldName] = Array.from({ length: listSize }, () => this.generateScalarMock(itemType.name))
        } else if (isObjectType(itemType)) {
          mock[fieldName] = Array.from({ length: listSize }, () => this.generateObjectMock(schema, itemType, depth + 1))
        }
        continue
      }

      // Handle Object types
      if (isObjectType(fieldType)) {
        mock[fieldName] = this.generateObjectMock(schema, fieldType, depth + 1)
        continue
      }

      // Handle Scalar types
      if (isScalarType(fieldType)) {
        mock[fieldName] = this.generateScalarMock(fieldType.name, fieldName)
        continue
      }
    }

    return mock
  }

  private generateScalarMock(typeName: string, fieldName?: string): any {
    // Custom field-specific mocks
    if (fieldName) {
      const fieldLower = fieldName.toLowerCase()

      if (fieldLower.includes('email')) return faker.internet.email()
      if (fieldLower.includes('phone')) return faker.phone.number()
      if (fieldLower.includes('url') || fieldLower.includes('website')) return faker.internet.url()
      if (fieldLower.includes('avatar') || fieldLower.includes('image')) return faker.image.avatar()
      if (fieldLower.includes('name') && !fieldLower.includes('username')) return faker.person.fullName()
      if (fieldLower.includes('username')) return faker.internet.userName()
      if (fieldLower.includes('title')) return faker.lorem.sentence(4)
      if (fieldLower.includes('description') || fieldLower.includes('bio')) return faker.lorem.paragraph()
      if (fieldLower.includes('content')) return faker.lorem.paragraphs(3)
      if (fieldLower.includes('address')) return faker.location.streetAddress()
      if (fieldLower.includes('city')) return faker.location.city()
      if (fieldLower.includes('country')) return faker.location.country()
      if (fieldLower.includes('company')) return faker.company.name()
      if (fieldLower.includes('price') || fieldLower.includes('amount'))
        return faker.number.float({ min: 10, max: 1000, precision: 0.01 })
      if (fieldLower.includes('age')) return faker.number.int({ min: 18, max: 80 })
      if (fieldLower.includes('count') || fieldLower.includes('total')) return faker.number.int({ min: 0, max: 100 })
      if (fieldLower.includes('rating')) return faker.number.float({ min: 1, max: 5, precision: 0.1 })
      if (fieldLower.includes('date') || fieldLower.includes('time')) return faker.date.recent().toISOString()
    }

    // Type-based mocks
    switch (typeName) {
      case 'ID':
        return faker.string.uuid()

      case 'String':
        return faker.lorem.words(3)

      case 'Int':
        return faker.number.int({ min: 1, max: 1000 })

      case 'Float':
        return faker.number.float({ min: 1, max: 1000, precision: 0.01 })

      case 'Boolean':
        return faker.datatype.boolean()

      case 'DateTime':
        return faker.date.recent().toISOString()

      case 'Date':
        return faker.date.recent().toISOString().split('T')[0]

      case 'Time':
        return faker.date.recent().toTimeString().split(' ')[0]

      case 'JSON':
        return {
          key1: faker.lorem.word(),
          key2: faker.number.int(),
          key3: faker.datatype.boolean(),
        }

      case 'Upload':
        return null // File uploads can't be mocked meaningfully

      default:
        return faker.lorem.word()
    }
  }

  generateBookMockData(): any {
    return {
      id: faker.string.uuid(),
      title: faker.lorem.sentence(4),
      description: faker.lorem.paragraph(2),
      content: faker.lorem.paragraphs(10),
      published: faker.datatype.boolean(),
      author: {
        id: faker.string.uuid(),
        name: faker.person.fullName(),
        email: faker.internet.email(),
        profile: {
          bio: faker.lorem.paragraph(),
          avatar: faker.image.avatar(),
          website: faker.internet.url(),
        },
      },
      category: {
        id: faker.string.uuid(),
        name: faker.lorem.word(),
        description: faker.lorem.sentence(),
      },
      comments: Array.from({ length: faker.number.int({ min: 0, max: 10 }) }, () => ({
        id: faker.string.uuid(),
        content: faker.lorem.paragraph(),
        author: {
          id: faker.string.uuid(),
          name: faker.person.fullName(),
          profile: {
            avatar: faker.image.avatar(),
          },
        },
        createdAt: faker.date.recent().toISOString(),
      })),
      likesCount: faker.number.int({ min: 0, max: 500 }),
      isLikedByMe: faker.datatype.boolean(),
      createdAt: faker.date.recent().toISOString(),
      updatedAt: faker.date.recent().toISOString(),
    }
  }

  generateUserMockData(): any {
    return {
      id: faker.string.uuid(),
      name: faker.person.fullName(),
      email: faker.internet.email(),
      username: faker.internet.userName(),
      profile: {
        bio: faker.lorem.paragraph(),
        avatar: faker.image.avatar(),
        website: faker.internet.url(),
        location: faker.location.city(),
      },
      books: Array.from({ length: faker.number.int({ min: 0, max: 5 }) }, () => ({
        id: faker.string.uuid(),
        title: faker.lorem.sentence(4),
        published: faker.datatype.boolean(),
        likesCount: faker.number.int({ min: 0, max: 100 }),
      })),
      followers: Array.from({ length: faker.number.int({ min: 0, max: 20 }) }, () => ({
        id: faker.string.uuid(),
        name: faker.person.fullName(),
        profile: {
          avatar: faker.image.avatar(),
        },
      })),
      stats: {
        totalBooks: faker.number.int({ min: 0, max: 50 }),
        totalLikes: faker.number.int({ min: 0, max: 1000 }),
        totalComments: faker.number.int({ min: 0, max: 500 }),
        totalFollowers: faker.number.int({ min: 0, max: 1000 }),
        totalFollowing: faker.number.int({ min: 0, max: 500 }),
      },
      createdAt: faker.date.past().toISOString(),
      updatedAt: faker.date.recent().toISOString(),
    }
  }
}

export const mockDataGenerator = new MockDataGenerator({
  seed: 42,
  customMocks: {
    'User.avatar': () => `https://avatars.dicebear.com/api/avataaars/${faker.string.uuid()}.svg`,
    'Book.coverImage': () => `https://picsum.photos/400/600?random=${faker.number.int({ min: 1, max: 1000 })}`,
  },
})
```
