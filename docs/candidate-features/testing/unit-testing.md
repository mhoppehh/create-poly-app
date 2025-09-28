# Unit Testing

## Overview

Comprehensive unit testing setup with Jest, React Testing Library, and Supertest for testing individual components, functions, and API resolvers in isolation.

## Priority

**HIGH** - Foundation of testing pyramid

## Dependencies

- `vite` (for frontend unit testing)
- `apollo-server` (for GraphQL resolver testing)
- `prisma` (optional, for database model testing)

## Feature Description

Complete unit testing infrastructure with modern testing frameworks, comprehensive mocking capabilities, and detailed coverage reporting.

### Key Features

- **Frontend Testing**: React Testing Library with Jest/Vitest
- **Backend Testing**: Jest with Supertest for GraphQL testing
- **Mocking**: Advanced mocking for external dependencies
- **Coverage Reporting**: Istanbul/nyc integration
- **Test Utilities**: Custom testing helpers and factories

## Configuration

```typescript
interface UnitTestingConfig {
  frontend: {
    framework: 'jest' | 'vitest'
    testingLibrary: 'react-testing-library'
    setupFiles: string[]
    testEnvironment: 'jsdom' | 'happy-dom'
    coverage: {
      enabled: boolean
      threshold: number
      exclude: string[]
    }
  }
  backend: {
    framework: 'jest'
    testEnvironment: 'node'
    setupFiles: string[]
    mocking: {
      database: boolean
      external: boolean
      graphql: boolean
    }
  }
  global: {
    watchMode: boolean
    verbose: boolean
    collectCoverage: boolean
    coverageReporters: string[]
  }
}
```

## Generated Files

### Test Configuration

```
├── jest.config.js                 # Main Jest configuration
├── jest.setup.js                  # Global test setup
├── vitest.config.ts               # Vitest config (if selected)
├── __tests__/
│   ├── setup/
│   │   ├── setupTests.ts          # Test environment setup
│   │   ├── mockServer.ts          # MSW mock server
│   │   └── testUtils.tsx          # Custom testing utilities
│   └── __mocks__/
│       ├── __mocks__/             # Manual mocks
│       ├── fileMock.js            # File/asset mocks
│       └── prisma.ts              # Prisma mock
```

### Frontend Tests

```
web/src/
├── components/
│   └── __tests__/
│       ├── Button.test.tsx        # Component tests
│       ├── Header.test.tsx
│       └── LoginForm.test.tsx
├── hooks/
│   └── __tests__/
│       ├── useAuth.test.ts        # Hook tests
│       └── useLocalStorage.test.ts
├── utils/
│   └── __tests__/
│       ├── validation.test.ts     # Utility function tests
│       └── formatters.test.ts
└── __tests__/
    ├── App.test.tsx               # Main app tests
    └── testUtils.tsx              # Testing utilities
```

### Backend Tests

```
api/src/
├── __tests__/
│   ├── resolvers/
│   │   ├── userResolvers.test.ts  # GraphQL resolver tests
│   │   └── bookResolvers.test.ts
│   ├── services/
│   │   ├── authService.test.ts    # Service layer tests
│   │   └── emailService.test.ts
│   ├── utils/
│   │   ├── validation.test.ts     # Utility tests
│   │   └── encryption.test.ts
│   └── integration/
│       └── graphql.test.ts        # GraphQL integration tests
```

## Code Examples

### React Component Test

```typescript
// web/src/components/__tests__/LoginForm.test.tsx
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MockedProvider } from '@apollo/client/testing'
import { LoginForm } from '../LoginForm'
import { LOGIN_MUTATION } from '../graphql/mutations'

const mocks = [
  {
    request: {
      query: LOGIN_MUTATION,
      variables: {
        email: 'user@example.com',
        password: 'password123',
      },
    },
    result: {
      data: {
        login: {
          user: { id: '1', email: 'user@example.com', name: 'Test User' },
          token: 'fake-jwt-token',
        },
      },
    },
  },
]

const renderLoginForm = (props = {}) => {
  return render(
    <MockedProvider mocks={mocks} addTypename={false}>
      <LoginForm {...props} />
    </MockedProvider>
  )
}

describe('LoginForm', () => {
  it('renders login form fields', () => {
    renderLoginForm()

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('validates required fields', async () => {
    const user = userEvent.setup()
    renderLoginForm()

    const submitButton = screen.getByRole('button', { name: /sign in/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument()
      expect(screen.getByText(/password is required/i)).toBeInTheDocument()
    })
  })

  it('submits form with valid credentials', async () => {
    const user = userEvent.setup()
    const onSuccess = jest.fn()
    renderLoginForm({ onSuccess })

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    await user.type(emailInput, 'user@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith({
        user: { id: '1', email: 'user@example.com', name: 'Test User' },
        token: 'fake-jwt-token',
      })
    })
  })

  it('displays error message on login failure', async () => {
    const errorMocks = [
      {
        request: {
          query: LOGIN_MUTATION,
          variables: {
            email: 'user@example.com',
            password: 'wrongpassword',
          },
        },
        error: new Error('Invalid credentials'),
      },
    ]

    const user = userEvent.setup()
    render(
      <MockedProvider mocks={errorMocks} addTypename={false}>
        <LoginForm />
      </MockedProvider>
    )

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    await user.type(emailInput, 'user@example.com')
    await user.type(passwordInput, 'wrongpassword')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument()
    })
  })
})
```

### Custom Hook Test

```typescript
// web/src/hooks/__tests__/useAuth.test.ts
import { renderHook, act } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing'
import { useAuth } from '../useAuth'
import { CURRENT_USER_QUERY } from '../graphql/queries'

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MockedProvider mocks={mocks} addTypename={false}>
    {children}
  </MockedProvider>
)

const mocks = [
  {
    request: {
      query: CURRENT_USER_QUERY,
    },
    result: {
      data: {
        currentUser: {
          id: '1',
          email: 'user@example.com',
          name: 'Test User',
        },
      },
    },
  },
]

describe('useAuth', () => {
  it('initializes with loading state', () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    expect(result.current.isLoading).toBe(true)
    expect(result.current.user).toBe(null)
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('loads user data on mount', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useAuth(), { wrapper })

    await waitForNextUpdate()

    expect(result.current.isLoading).toBe(false)
    expect(result.current.user).toEqual({
      id: '1',
      email: 'user@example.com',
      name: 'Test User',
    })
    expect(result.current.isAuthenticated).toBe(true)
  })

  it('handles logout correctly', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useAuth(), { wrapper })

    await waitForNextUpdate()

    act(() => {
      result.current.logout()
    })

    expect(result.current.user).toBe(null)
    expect(result.current.isAuthenticated).toBe(false)
  })
})
```

### GraphQL Resolver Test

```typescript
// api/src/__tests__/resolvers/userResolvers.test.ts
import { createTestClient } from 'apollo-server-testing'
import { gql } from 'apollo-server-express'
import { server } from '../../server'
import { prisma } from '../../lib/prisma'
import { createUser } from '../factories/userFactory'

describe('User Resolvers', () => {
  const { query, mutate } = createTestClient(server)

  beforeEach(async () => {
    // Clean up test data
    await prisma.user.deleteMany()
  })

  describe('Query: users', () => {
    it('returns all users', async () => {
      // Setup test data
      const user1 = await createUser({ email: 'user1@example.com' })
      const user2 = await createUser({ email: 'user2@example.com' })

      const GET_USERS = gql`
        query GetUsers {
          users {
            id
            email
            name
          }
        }
      `

      const response = await query({ query: GET_USERS })

      expect(response.errors).toBeUndefined()
      expect(response.data.users).toHaveLength(2)
      expect(response.data.users).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ email: 'user1@example.com' }),
          expect.objectContaining({ email: 'user2@example.com' }),
        ]),
      )
    })

    it('returns empty array when no users exist', async () => {
      const GET_USERS = gql`
        query GetUsers {
          users {
            id
            email
          }
        }
      `

      const response = await query({ query: GET_USERS })

      expect(response.errors).toBeUndefined()
      expect(response.data.users).toEqual([])
    })
  })

  describe('Mutation: createUser', () => {
    it('creates a new user', async () => {
      const CREATE_USER = gql`
        mutation CreateUser($input: CreateUserInput!) {
          createUser(input: $input) {
            id
            email
            name
          }
        }
      `

      const variables = {
        input: {
          email: 'newuser@example.com',
          name: 'New User',
          password: 'password123',
        },
      }

      const response = await mutate({ mutation: CREATE_USER, variables })

      expect(response.errors).toBeUndefined()
      expect(response.data.createUser).toEqual({
        id: expect.any(String),
        email: 'newuser@example.com',
        name: 'New User',
      })

      // Verify user was created in database
      const user = await prisma.user.findUnique({
        where: { email: 'newuser@example.com' },
      })
      expect(user).toBeTruthy()
    })

    it('validates required fields', async () => {
      const CREATE_USER = gql`
        mutation CreateUser($input: CreateUserInput!) {
          createUser(input: $input) {
            id
            email
          }
        }
      `

      const variables = {
        input: {
          email: '', // Invalid email
          name: 'Test User',
        },
      }

      const response = await mutate({ mutation: CREATE_USER, variables })

      expect(response.errors).toBeDefined()
      expect(response.errors[0].message).toContain('email')
    })
  })
})
```

### Test Utilities

```typescript
// __tests__/setup/testUtils.tsx
import React from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { MockedProvider, MockedResponse } from '@apollo/client/testing'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '../../src/auth/AuthContext'

interface CustomRenderOptions extends RenderOptions {
  mocks?: MockedResponse[]
  initialRoute?: string
  authUser?: any
}

const AllTheProviders: React.FC<{
  children: React.ReactNode
  mocks?: MockedResponse[]
  authUser?: any
}> = ({ children, mocks = [], authUser }) => {
  return (
    <MockedProvider mocks={mocks} addTypename={false}>
      <BrowserRouter>
        <AuthProvider initialUser={authUser}>
          {children}
        </AuthProvider>
      </BrowserRouter>
    </MockedProvider>
  )
}

export const customRender = (
  ui: React.ReactElement,
  options: CustomRenderOptions = {}
) => {
  const { mocks, initialRoute, authUser, ...renderOptions } = options

  if (initialRoute) {
    window.history.pushState({}, 'Test page', initialRoute)
  }

  return render(ui, {
    wrapper: (props) => (
      <AllTheProviders {...props} mocks={mocks} authUser={authUser} />
    ),
    ...renderOptions,
  })
}

// Re-export everything
export * from '@testing-library/react'

// Override render method
export { customRender as render }
```

### Jest Configuration

```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|svg)$': '<rootDir>/__tests__/__mocks__/fileMock.js',
  },
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts', '!src/main.tsx', '!src/vite-env.d.ts'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  testMatch: ['<rootDir>/src/**/__tests__/**/*.{ts,tsx}', '<rootDir>/src/**/*.{test,spec}.{ts,tsx}'],
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.json',
      },
    ],
  },
}
```

## Installation Steps

1. **Install Testing Dependencies**

   ```bash
   # Frontend dependencies
   pnpm add -D jest @testing-library/react @testing-library/jest-dom @testing-library/user-event
   pnpm add -D jest-environment-jsdom ts-jest @types/jest

   # Backend dependencies
   pnpm add -D supertest @types/supertest
   pnpm add -D apollo-server-testing
   ```

2. **Configure Test Scripts**

   ```json
   {
     "scripts": {
       "test": "jest",
       "test:watch": "jest --watch",
       "test:coverage": "jest --coverage",
       "test:ci": "jest --ci --coverage --watchAll=false"
     }
   }
   ```

3. **Setup Test Database**
   ```bash
   # Create test environment file
   echo "DATABASE_URL=postgresql://user:password@localhost:5432/myapp_test" > .env.test
   ```

This unit testing setup provides comprehensive coverage for React components, custom hooks, GraphQL resolvers, and utility functions with modern testing practices.
