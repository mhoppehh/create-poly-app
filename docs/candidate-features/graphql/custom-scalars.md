# GraphQL Custom Scalars & Type System Extensions

## Overview

Enhanced GraphQL type system with custom scalar types for dates, JSON, uploads, validation, and specialized data formats.

## Priority

**MEDIUM** - Enhances type safety and developer experience with domain-specific types

## Dependencies

- `apollo-server` (base GraphQL server)
- `graphql-scalars` (common scalar implementations)
- `graphql-upload` (file upload support)

## Components

### Custom Scalar Types

- **DateTime Scalars**: ISO 8601 date/time handling with timezone support
- **Validation Scalars**: Email, URL, phone number validation
- **Numeric Scalars**: Currency, percentage, positive integers
- **Text Scalars**: HTML, Markdown, limited strings
- **Binary Scalars**: Base64, hexadecimal, UUID handling
- **JSON Scalars**: Type-safe JSON object and array handling

### File Upload Scalars

- **Upload Scalar**: GraphQL file upload specification
- **Image Upload**: Image-specific validation and processing
- **Document Upload**: Document type validation and storage
- **Multi-file Upload**: Batch file upload handling
- **Upload Validation**: File size, type, and content validation

### Validation Framework

- **Input Validation**: Custom validation rules for scalar inputs
- **Format Validation**: Regex-based format validation
- **Range Validation**: Numeric range and length validation
- **Custom Validators**: Domain-specific validation logic
- **Error Handling**: Detailed validation error messages

### Type Safety

- **TypeScript Integration**: Full TypeScript support for custom scalars
- **Runtime Validation**: Runtime type checking and coercion
- **Schema Validation**: Validate scalar usage in schema
- **Client Integration**: Client-side type generation and validation
- **Documentation**: Auto-generated scalar documentation

### Performance Optimization

- **Scalar Caching**: Cache frequently used scalar transformations
- **Lazy Evaluation**: Defer expensive scalar operations
- **Batch Processing**: Process multiple scalar values efficiently
- **Memory Management**: Optimize memory usage for large datasets
- **Error Recovery**: Graceful handling of scalar conversion errors

## Configuration

```typescript
interface ScalarConfig {
  dateTime: {
    format: 'iso' | 'timestamp' | 'custom'
    timezone: 'utc' | 'local' | 'preserve'
    precision: 'seconds' | 'milliseconds' | 'microseconds'
  }
  upload: {
    maxFileSize: number
    allowedTypes: string[]
    uploadDir: string
    processImages: boolean
  }
  validation: {
    strict: boolean
    customValidators: Record<string, (value: any) => boolean>
  }
}
```

## Generated Files

```
api/src/
├── scalars/
│   ├── index.ts                    # Scalar exports
│   ├── dateTime/
│   │   ├── DateTime.ts            # DateTime scalar
│   │   ├── Date.ts                # Date-only scalar
│   │   ├── Time.ts                # Time-only scalar
│   │   └── Timestamp.ts           # Unix timestamp scalar
│   ├── validation/
│   │   ├── Email.ts               # Email validation scalar
│   │   ├── URL.ts                 # URL validation scalar
│   │   ├── Phone.ts               # Phone number scalar
│   │   └── PostalCode.ts          # Postal code scalar
│   ├── numeric/
│   │   ├── Currency.ts            # Currency scalar
│   │   ├── Percentage.ts          # Percentage scalar
│   │   ├── PositiveInt.ts         # Positive integer scalar
│   │   └── BigInt.ts              # Big integer scalar
│   ├── text/
│   │   ├── HTML.ts                # HTML content scalar
│   │   ├── Markdown.ts            # Markdown scalar
│   │   ├── LimitedString.ts       # Length-limited string
│   │   └── SafeString.ts          # XSS-safe string
│   ├── binary/
│   │   ├── Base64.ts              # Base64 encoded data
│   │   ├── Hex.ts                 # Hexadecimal data
│   │   ├── UUID.ts                # UUID validation
│   │   └── Binary.ts              # Binary data
│   ├── json/
│   │   ├── JSON.ts                # Generic JSON scalar
│   │   ├── JSONObject.ts          # JSON object scalar
│   │   └── JSONArray.ts           # JSON array scalar
│   ├── upload/
│   │   ├── Upload.ts              # File upload scalar
│   │   ├── ImageUpload.ts         # Image upload scalar
│   │   └── DocumentUpload.ts      # Document upload scalar
│   └── utils/
│       ├── validation.ts          # Validation utilities
│       ├── serialization.ts       # Serialization helpers
│       └── errors.ts              # Custom scalar errors
```

## DateTime Scalars

```typescript
// scalars/dateTime/DateTime.ts
import { GraphQLScalarType, GraphQLError } from 'graphql'
import { Kind } from 'graphql/language'

export const GraphQLDateTime = new GraphQLScalarType({
  name: 'DateTime',
  description: 'A date-time string at UTC, such as 2007-12-03T10:15:30Z',

  serialize(value: unknown): string {
    if (value instanceof Date) {
      if (isNaN(value.getTime())) {
        throw new GraphQLError(`Invalid DateTime: ${value}`)
      }
      return value.toISOString()
    }

    if (typeof value === 'string') {
      const date = new Date(value)
      if (isNaN(date.getTime())) {
        throw new GraphQLError(`Invalid DateTime string: ${value}`)
      }
      return date.toISOString()
    }

    if (typeof value === 'number') {
      const date = new Date(value)
      if (isNaN(date.getTime())) {
        throw new GraphQLError(`Invalid DateTime timestamp: ${value}`)
      }
      return date.toISOString()
    }

    throw new GraphQLError(`Cannot serialize DateTime: ${value}`)
  },

  parseValue(value: unknown): Date {
    if (value instanceof Date) {
      if (isNaN(value.getTime())) {
        throw new GraphQLError(`Invalid DateTime: ${value}`)
      }
      return value
    }

    if (typeof value === 'string') {
      const date = new Date(value)
      if (isNaN(date.getTime())) {
        throw new GraphQLError(`Invalid DateTime string: ${value}`)
      }
      return date
    }

    if (typeof value === 'number') {
      const date = new Date(value)
      if (isNaN(date.getTime())) {
        throw new GraphQLError(`Invalid DateTime timestamp: ${value}`)
      }
      return date
    }

    throw new GraphQLError(`Cannot parse DateTime: ${value}`)
  },

  parseLiteral(ast): Date {
    if (ast.kind === Kind.STRING) {
      const date = new Date(ast.value)
      if (isNaN(date.getTime())) {
        throw new GraphQLError(`Invalid DateTime literal: ${ast.value}`)
      }
      return date
    }

    if (ast.kind === Kind.INT) {
      const timestamp = parseInt(ast.value, 10)
      const date = new Date(timestamp)
      if (isNaN(date.getTime())) {
        throw new GraphQLError(`Invalid DateTime timestamp: ${ast.value}`)
      }
      return date
    }

    throw new GraphQLError(`Can only parse strings and integers to DateTime but got a: ${ast.kind}`)
  },
})

// Date-only scalar (YYYY-MM-DD)
export const GraphQLDate = new GraphQLScalarType({
  name: 'Date',
  description: 'A date string, such as 2007-12-03',

  serialize(value: unknown): string {
    const date = value instanceof Date ? value : new Date(value as string)
    if (isNaN(date.getTime())) {
      throw new GraphQLError(`Invalid Date: ${value}`)
    }
    return date.toISOString().split('T')[0]
  },

  parseValue(value: unknown): Date {
    if (typeof value !== 'string') {
      throw new GraphQLError(`Date must be a string: ${value}`)
    }

    // Validate YYYY-MM-DD format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(value)) {
      throw new GraphQLError(`Invalid Date format. Expected YYYY-MM-DD: ${value}`)
    }

    const date = new Date(value + 'T00:00:00.000Z')
    if (isNaN(date.getTime())) {
      throw new GraphQLError(`Invalid Date: ${value}`)
    }

    return date
  },

  parseLiteral(ast): Date {
    if (ast.kind !== Kind.STRING) {
      throw new GraphQLError(`Can only parse strings to Date but got a: ${ast.kind}`)
    }

    return this.parseValue(ast.value)
  },
})

// Time-only scalar (HH:MM:SS)
export const GraphQLTime = new GraphQLScalarType({
  name: 'Time',
  description: 'A time string, such as 14:30:00',

  serialize(value: unknown): string {
    if (value instanceof Date) {
      return value.toISOString().split('T')[1].split('.')[0]
    }

    if (typeof value === 'string') {
      // Validate and return time string
      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/
      if (!timeRegex.test(value)) {
        throw new GraphQLError(`Invalid Time format. Expected HH:MM:SS: ${value}`)
      }
      return value
    }

    throw new GraphQLError(`Cannot serialize Time: ${value}`)
  },

  parseValue(value: unknown): string {
    if (typeof value !== 'string') {
      throw new GraphQLError(`Time must be a string: ${value}`)
    }

    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/
    if (!timeRegex.test(value)) {
      throw new GraphQLError(`Invalid Time format. Expected HH:MM:SS: ${value}`)
    }

    return value
  },

  parseLiteral(ast): string {
    if (ast.kind !== Kind.STRING) {
      throw new GraphQLError(`Can only parse strings to Time but got a: ${ast.kind}`)
    }

    return this.parseValue(ast.value)
  },
})
```

## Validation Scalars

```typescript
// scalars/validation/Email.ts
import { GraphQLScalarType, GraphQLError } from 'graphql'
import { Kind } from 'graphql/language'

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

export const GraphQLEmail = new GraphQLScalarType({
  name: 'Email',
  description: 'A valid email address',

  serialize(value: unknown): string {
    if (typeof value !== 'string') {
      throw new GraphQLError(`Email must be a string: ${value}`)
    }

    if (!EMAIL_REGEX.test(value)) {
      throw new GraphQLError(`Invalid email format: ${value}`)
    }

    return value.toLowerCase()
  },

  parseValue(value: unknown): string {
    if (typeof value !== 'string') {
      throw new GraphQLError(`Email must be a string: ${value}`)
    }

    if (!EMAIL_REGEX.test(value)) {
      throw new GraphQLError(`Invalid email format: ${value}`)
    }

    return value.toLowerCase()
  },

  parseLiteral(ast): string {
    if (ast.kind !== Kind.STRING) {
      throw new GraphQLError(`Can only parse strings to Email but got a: ${ast.kind}`)
    }

    return this.parseValue(ast.value)
  },
})

// URL validation scalar
export const GraphQLURL = new GraphQLScalarType({
  name: 'URL',
  description: 'A valid URL',

  serialize(value: unknown): string {
    if (typeof value !== 'string') {
      throw new GraphQLError(`URL must be a string: ${value}`)
    }

    try {
      new URL(value)
      return value
    } catch {
      throw new GraphQLError(`Invalid URL format: ${value}`)
    }
  },

  parseValue(value: unknown): string {
    if (typeof value !== 'string') {
      throw new GraphQLError(`URL must be a string: ${value}`)
    }

    try {
      new URL(value)
      return value
    } catch {
      throw new GraphQLError(`Invalid URL format: ${value}`)
    }
  },

  parseLiteral(ast): string {
    if (ast.kind !== Kind.STRING) {
      throw new GraphQLError(`Can only parse strings to URL but got a: ${ast.kind}`)
    }

    return this.parseValue(ast.value)
  },
})

// Phone number scalar
const PHONE_REGEX = /^\+?[\d\s\-\(\)]+$/

export const GraphQLPhone = new GraphQLScalarType({
  name: 'Phone',
  description: 'A valid phone number',

  serialize(value: unknown): string {
    if (typeof value !== 'string') {
      throw new GraphQLError(`Phone must be a string: ${value}`)
    }

    if (!PHONE_REGEX.test(value)) {
      throw new GraphQLError(`Invalid phone number format: ${value}`)
    }

    // Normalize phone number (remove spaces, dashes, etc.)
    return value.replace(/[\s\-\(\)]/g, '')
  },

  parseValue(value: unknown): string {
    return this.serialize(value)
  },

  parseLiteral(ast): string {
    if (ast.kind !== Kind.STRING) {
      throw new GraphQLError(`Can only parse strings to Phone but got a: ${ast.kind}`)
    }

    return this.parseValue(ast.value)
  },
})
```

## JSON Scalars

```typescript
// scalars/json/JSON.ts
import { GraphQLScalarType, GraphQLError } from 'graphql'
import { Kind } from 'graphql/language'

function parseJSONLiteral(ast: any): any {
  switch (ast.kind) {
    case Kind.STRING:
    case Kind.BOOLEAN:
      return ast.value
    case Kind.INT:
    case Kind.FLOAT:
      return parseFloat(ast.value)
    case Kind.OBJECT:
      return ast.fields.reduce((value: any, field: any) => {
        value[field.name.value] = parseJSONLiteral(field.value)
        return value
      }, {})
    case Kind.LIST:
      return ast.values.map(parseJSONLiteral)
    case Kind.NULL:
      return null
    default:
      throw new GraphQLError(`Unexpected kind in JSON literal: ${ast.kind}`)
  }
}

export const GraphQLJSON = new GraphQLScalarType({
  name: 'JSON',
  description: 'The `JSON` scalar type represents JSON values as specified by ECMA-404',

  serialize(value: unknown): any {
    // JSON can be any serializable value
    try {
      return JSON.parse(JSON.stringify(value))
    } catch {
      throw new GraphQLError(`Cannot serialize value as JSON: ${value}`)
    }
  },

  parseValue(value: unknown): any {
    // Incoming values are already parsed JSON
    return value
  },

  parseLiteral: parseJSONLiteral,
})

// JSON Object scalar (ensures value is an object)
export const GraphQLJSONObject = new GraphQLScalarType({
  name: 'JSONObject',
  description: 'The `JSONObject` scalar type represents JSON objects',

  serialize(value: unknown): Record<string, any> {
    if (value === null || value === undefined) {
      throw new GraphQLError('JSONObject cannot be null or undefined')
    }

    if (typeof value !== 'object' || Array.isArray(value)) {
      throw new GraphQLError(`JSONObject must be an object, got: ${typeof value}`)
    }

    try {
      return JSON.parse(JSON.stringify(value))
    } catch {
      throw new GraphQLError(`Cannot serialize value as JSONObject: ${value}`)
    }
  },

  parseValue(value: unknown): Record<string, any> {
    if (value === null || value === undefined) {
      throw new GraphQLError('JSONObject cannot be null or undefined')
    }

    if (typeof value !== 'object' || Array.isArray(value)) {
      throw new GraphQLError(`JSONObject must be an object, got: ${typeof value}`)
    }

    return value as Record<string, any>
  },

  parseLiteral(ast): Record<string, any> {
    if (ast.kind !== Kind.OBJECT) {
      throw new GraphQLError(`Can only parse objects to JSONObject but got a: ${ast.kind}`)
    }

    return parseJSONLiteral(ast) as Record<string, any>
  },
})
```

## Upload Scalars

```typescript
// scalars/upload/Upload.ts
import { GraphQLScalarType, GraphQLError } from 'graphql'

export interface FileUpload {
  filename: string
  mimetype: string
  encoding: string
  createReadStream(): NodeJS.ReadableStream
}

export const GraphQLUpload = new GraphQLScalarType({
  name: 'Upload',
  description: 'The `Upload` scalar type represents a file upload',

  serialize() {
    throw new GraphQLError('Upload scalar can only be used as input type')
  },

  parseValue(value: unknown): Promise<FileUpload> {
    if (value && typeof value === 'object' && 'then' in value) {
      return value as Promise<FileUpload>
    }

    throw new GraphQLError('Upload value must be a promise of FileUpload')
  },

  parseLiteral() {
    throw new GraphQLError('Upload scalar can only be used as input type')
  },
})

// Image Upload with validation
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10MB

export const GraphQLImageUpload = new GraphQLScalarType({
  name: 'ImageUpload',
  description: 'File upload for images with validation',

  serialize() {
    throw new GraphQLError('ImageUpload scalar can only be used as input type')
  },

  parseValue(value: unknown): Promise<FileUpload> {
    if (value && typeof value === 'object' && 'then' in value) {
      return (value as Promise<FileUpload>).then(upload => {
        // Validate image type
        if (!IMAGE_TYPES.includes(upload.mimetype)) {
          throw new GraphQLError(`Invalid image type: ${upload.mimetype}. Allowed: ${IMAGE_TYPES.join(', ')}`)
        }

        // Note: File size validation would need to be done during stream processing
        return upload
      })
    }

    throw new GraphQLError('ImageUpload value must be a promise of FileUpload')
  },

  parseLiteral() {
    throw new GraphQLError('ImageUpload scalar can only be used as input type')
  },
})
```

## Custom Validation Framework

```typescript
// scalars/utils/validation.ts
import { GraphQLScalarType, GraphQLError } from 'graphql'
import { Kind } from 'graphql/language'

export interface ValidationRule<T = any> {
  validate: (value: T) => boolean | string
  message?: string
}

export interface CreateScalarOptions<T = any> {
  name: string
  description: string
  rules: ValidationRule<T>[]
  serialize?: (value: unknown) => T
  parseValue?: (value: unknown) => T
  parseLiteral?: (ast: any) => T
}

export function createValidatedScalar<T = string>(options: CreateScalarOptions<T>): GraphQLScalarType {
  const { name, description, rules, serialize, parseValue, parseLiteral } = options

  function validateValue(value: T): T {
    for (const rule of rules) {
      const result = rule.validate(value)
      if (result !== true) {
        const message = typeof result === 'string' ? result : rule.message || `Invalid ${name}`
        throw new GraphQLError(message)
      }
    }
    return value
  }

  return new GraphQLScalarType({
    name,
    description,

    serialize: serialize ? value => serialize(validateValue(value as T)) : validateValue,

    parseValue: parseValue ? value => validateValue(parseValue(value)) : (validateValue as any),

    parseLiteral: parseLiteral
      ? ast => validateValue(parseLiteral(ast))
      : ast => {
          if (ast.kind !== Kind.STRING) {
            throw new GraphQLError(`Can only parse strings to ${name} but got a: ${ast.kind}`)
          }
          return validateValue(ast.value as T)
        },
  })
}

// Example: Username scalar with validation
export const GraphQLUsername = createValidatedScalar({
  name: 'Username',
  description: 'A valid username (3-30 characters, alphanumeric and underscores)',
  rules: [
    {
      validate: (value: string) => typeof value === 'string',
      message: 'Username must be a string',
    },
    {
      validate: (value: string) => value.length >= 3 && value.length <= 30,
      message: 'Username must be 3-30 characters long',
    },
    {
      validate: (value: string) => /^[a-zA-Z0-9_]+$/.test(value),
      message: 'Username can only contain letters, numbers, and underscores',
    },
    {
      validate: (value: string) => !/^_|_$/.test(value),
      message: 'Username cannot start or end with underscore',
    },
  ],
})

// Example: Password scalar with strength validation
export const GraphQLPassword = createValidatedScalar({
  name: 'Password',
  description: 'A password with strength requirements',
  rules: [
    {
      validate: (value: string) => typeof value === 'string',
      message: 'Password must be a string',
    },
    {
      validate: (value: string) => value.length >= 8,
      message: 'Password must be at least 8 characters long',
    },
    {
      validate: (value: string) => /[A-Z]/.test(value),
      message: 'Password must contain at least one uppercase letter',
    },
    {
      validate: (value: string) => /[a-z]/.test(value),
      message: 'Password must contain at least one lowercase letter',
    },
    {
      validate: (value: string) => /\d/.test(value),
      message: 'Password must contain at least one number',
    },
    {
      validate: (value: string) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>?]/.test(value),
      message: 'Password must contain at least one special character',
    },
  ],
})
```

## Schema Integration

```typescript
// scalars/index.ts
import { GraphQLDateTime, GraphQLDate, GraphQLTime } from './dateTime/DateTime'
import { GraphQLEmail, GraphQLURL, GraphQLPhone } from './validation/Email'
import { GraphQLJSON, GraphQLJSONObject } from './json/JSON'
import { GraphQLUpload, GraphQLImageUpload } from './upload/Upload'
import { GraphQLUsername, GraphQLPassword } from './utils/validation'

export const customScalars = {
  // Date/Time scalars
  DateTime: GraphQLDateTime,
  Date: GraphQLDate,
  Time: GraphQLTime,

  // Validation scalars
  Email: GraphQLEmail,
  URL: GraphQLURL,
  Phone: GraphQLPhone,
  Username: GraphQLUsername,
  Password: GraphQLPassword,

  // JSON scalars
  JSON: GraphQLJSON,
  JSONObject: GraphQLJSONObject,

  // Upload scalars
  Upload: GraphQLUpload,
  ImageUpload: GraphQLImageUpload,
}

export const scalarResolvers = {
  DateTime: GraphQLDateTime,
  Date: GraphQLDate,
  Time: GraphQLTime,
  Email: GraphQLEmail,
  URL: GraphQLURL,
  Phone: GraphQLPhone,
  Username: GraphQLUsername,
  Password: GraphQLPassword,
  JSON: GraphQLJSON,
  JSONObject: GraphQLJSONObject,
  Upload: GraphQLUpload,
  ImageUpload: GraphQLImageUpload,
}

export * from './dateTime/DateTime'
export * from './validation/Email'
export * from './json/JSON'
export * from './upload/Upload'
export * from './utils/validation'
```

## Schema Definition Usage

```graphql
# Enhanced schema with custom scalars
scalar DateTime
scalar Date
scalar Time
scalar Email
scalar URL
scalar Phone
scalar Username
scalar Password
scalar JSON
scalar JSONObject
scalar Upload
scalar ImageUpload

type User {
  id: ID!
  username: Username!
  email: Email!
  phone: Phone
  website: URL
  avatar: URL

  # Date/time fields
  createdAt: DateTime!
  updatedAt: DateTime!
  lastLoginAt: DateTime
  birthDate: Date

  # JSON fields
  preferences: JSONObject
  metadata: JSON

  profile: UserProfile
}

type UserProfile {
  bio: String
  location: String
  socialLinks: JSONObject
  settings: UserSettings
}

type UserSettings {
  theme: String!
  timezone: String!
  notifications: JSONObject!
}

type Book {
  id: ID!
  title: String!
  description: String
  content: String
  coverImage: URL

  # Date fields
  publishedDate: Date
  createdAt: DateTime!
  updatedAt: DateTime!

  # JSON metadata
  metadata: JSONObject
  tags: [String!]!

  author: User!
  category: Category!
}

# Mutations using custom scalars
type Mutation {
  # User mutations
  createUser(input: CreateUserInput!): User!
  updateProfile(input: UpdateProfileInput!): User!
  changePassword(currentPassword: Password!, newPassword: Password!): Boolean!

  # Book mutations
  createBook(input: CreateBookInput!): Book!
  uploadBookCover(bookId: ID!, cover: ImageUpload!): Book!
  uploadBookDocument(bookId: ID!, document: Upload!): Book!

  # Generic file uploads
  uploadAvatar(avatar: ImageUpload!): User!
  uploadFiles(files: [Upload!]!): [String!]!
}

input CreateUserInput {
  username: Username!
  email: Email!
  password: Password!
  phone: Phone
  website: URL
  birthDate: Date
  preferences: JSONObject
}

input UpdateProfileInput {
  phone: Phone
  website: URL
  bio: String
  location: String
  socialLinks: JSONObject
}

input CreateBookInput {
  title: String!
  description: String
  content: String
  publishedDate: Date
  metadata: JSONObject
  tags: [String!]
}

# Queries with scalar filtering
type Query {
  users(createdAfter: DateTime, createdBefore: DateTime, hasPhone: Boolean, hasWebsite: Boolean): [User!]!

  books(publishedAfter: Date, publishedBefore: Date, hasMetadata: Boolean): [Book!]!

  searchUsers(query: String!, filters: UserFiltersInput): [User!]!
}

input UserFiltersInput {
  createdAfter: DateTime
  createdBefore: DateTime
  hasPhone: Boolean
  hasWebsite: Boolean
  preferences: JSONObject
}
```

## TypeScript Integration

```typescript
// types/scalars.ts
export type DateTime = Date
export type DateOnly = string // YYYY-MM-DD format
export type TimeOnly = string // HH:MM:SS format
export type Email = string
export type URL = string
export type Phone = string
export type Username = string
export type Password = string
export type JSONValue = any
export type JSONObject = Record<string, any>

export interface FileUpload {
  filename: string
  mimetype: string
  encoding: string
  createReadStream(): NodeJS.ReadableStream
}

// Generated types for schema
export interface User {
  id: string
  username: Username
  email: Email
  phone?: Phone
  website?: URL
  avatar?: URL
  createdAt: DateTime
  updatedAt: DateTime
  lastLoginAt?: DateTime
  birthDate?: DateOnly
  preferences?: JSONObject
  metadata?: JSONValue
}

export interface CreateUserInput {
  username: Username
  email: Email
  password: Password
  phone?: Phone
  website?: URL
  birthDate?: DateOnly
  preferences?: JSONObject
}
```
