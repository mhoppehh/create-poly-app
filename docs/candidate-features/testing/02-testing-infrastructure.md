# Testing Infrastructure

## Overview

Comprehensive testing setup for both frontend and backend, including unit tests, integration tests, end-to-end tests, and continuous integration pipeline configuration.

## Priority

**HIGH** - Critical for production applications and code quality

## Dependencies

- `vite` (for frontend testing)
- `apollo-server` (for API testing)
- `prisma` (for database testing, if enabled)

## Feature Components

### 1. Unit Testing

- **Frontend**: Jest + React Testing Library + Vite integration
- **Backend**: Jest + Supertest for GraphQL testing
- **Coverage**: Istanbul/nyc for code coverage reporting
- **Mocking**: Advanced mocking utilities for external services

### 2. Integration Testing

- **API Integration**: Full GraphQL endpoint testing
- **Database Integration**: Test database setup and teardown
- **Service Integration**: Testing external service integrations
- **Component Integration**: Testing React component interactions

### 3. End-to-End Testing

- **Playwright**: Modern E2E testing framework (preferred)
- **Cypress**: Alternative E2E testing option
- **Visual Testing**: Screenshot comparison testing
- **Cross-browser Testing**: Chrome, Firefox, Safari support

### 4. Test Database Management

- **Isolated Test DB**: Separate database for testing
- **Data Seeding**: Test fixtures and factory functions
- **Cleanup**: Automatic test data cleanup
- **Transactions**: Test isolation using database transactions

### 5. CI/CD Pipeline

- **GitHub Actions**: Automated testing workflow
- **Pull Request**: Automated testing on PRs
- **Coverage Reporting**: Integration with Codecov/Coveralls
- **Performance Testing**: Basic performance regression testing

## Configuration Options

```typescript
interface TestingConfig {
  framework: 'jest' | 'vitest'
  e2eFramework: 'playwright' | 'cypress'
  coverage: {
    threshold: number // e.g., 80
    reports: ('text' | 'html' | 'lcov' | 'json')[]
  }
  database: {
    strategy: 'isolated' | 'transactions' | 'memory'
    seedData: boolean
  }
  ci: {
    provider: 'github-actions' | 'gitlab-ci' | 'jenkins'
    runOn: ('push' | 'pull-request' | 'schedule')[]
  }
}
```

## Generated Files

### Root Level

```
├── .github/
│   └── workflows/
│       ├── test.yml                # Main testing workflow
│       ├── e2e.yml                 # E2E testing workflow
│       └── coverage.yml            # Coverage reporting
├── jest.config.js                  # Jest configuration
├── playwright.config.ts            # Playwright configuration
└── vitest.config.ts               # Vitest configuration (alternative)
```

### Backend Testing (API)

```
api/
├── tests/
│   ├── setup/
│   │   ├── globalSetup.ts          # Global test setup
│   │   ├── testDb.ts               # Test database utilities
│   │   └── mockData.ts             # Test data factories
│   ├── unit/
│   │   ├── auth/
│   │   │   ├── jwt.test.ts         # JWT utilities tests
│   │   │   └── middleware.test.ts  # Auth middleware tests
│   │   ├── services/
│   │   └── utils/
│   ├── integration/
│   │   ├── auth.integration.test.ts
│   │   ├── books.integration.test.ts
│   │   └── user.integration.test.ts
│   └── helpers/
│       ├── apolloTestServer.ts     # Apollo Server test setup
│       ├── graphqlRequest.ts       # GraphQL test utilities
│       └── testUtils.ts            # Common test utilities
├── jest.config.js
└── package.json                    # Updated with test scripts
```

### Frontend Testing (Web)

```
web/
├── tests/
│   ├── setup/
│   │   ├── setupTests.ts           # Test environment setup
│   │   └── mocks/
│   │       ├── graphql.ts          # GraphQL mocks
│   │       └── localStorage.ts     # LocalStorage mocks
│   ├── unit/
│   │   ├── components/
│   │   │   ├── LoginForm.test.tsx
│   │   │   └── BookList.test.tsx
│   │   ├── hooks/
│   │   │   ├── useAuth.test.ts
│   │   │   └── useBooks.test.ts
│   │   └── utils/
│   ├── integration/
│   │   ├── auth-flow.test.tsx
│   │   └── book-management.test.tsx
│   └── helpers/
│       ├── renderWithProviders.tsx # Test render utilities
│       ├── mockGraphQL.ts          # GraphQL mocking
│       └── testUtils.ts            # Common utilities
├── vitest.config.ts
└── package.json                    # Updated with test scripts
```

### E2E Testing

```
e2e/
├── tests/
│   ├── auth/
│   │   ├── login.spec.ts
│   │   ├── register.spec.ts
│   │   └── password-reset.spec.ts
│   ├── books/
│   │   ├── create-book.spec.ts
│   │   ├── edit-book.spec.ts
│   │   └── delete-book.spec.ts
│   └── admin/
│       └── user-management.spec.ts
├── fixtures/
│   ├── users.json                  # Test user data
│   └── books.json                  # Test book data
├── utils/
│   ├── auth.ts                     # E2E auth utilities
│   ├── database.ts                 # Database test utilities
│   └── api.ts                      # API test utilities
├── playwright.config.ts
└── package.json
```

## Package.json Script Updates

### API Scripts

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:unit": "jest tests/unit",
    "test:integration": "jest tests/integration",
    "test:ci": "jest --ci --coverage --passWithNoTests"
  }
}
```

### Web Scripts

```json
{
  "scripts": {
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:coverage": "vitest --coverage",
    "test:unit": "vitest tests/unit",
    "test:integration": "vitest tests/integration",
    "test:ci": "vitest --run --coverage"
  }
}
```

### Root Scripts

```json
{
  "scripts": {
    "test": "pnpm -r test",
    "test:unit": "pnpm -r test:unit",
    "test:integration": "pnpm -r test:integration",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:all": "pnpm test && pnpm test:e2e"
  }
}
```

## Configuration Files

### Jest Configuration (API)

```javascript
// api/jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  coverageDirectory: 'coverage',
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts', '!src/**/*.test.ts'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup/globalSetup.ts'],
}
```

### Vitest Configuration (Web)

```typescript
// web/vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup/setupTests.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
})
```

### Playwright Configuration

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e/tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: [
    {
      command: 'pnpm --filter=web dev',
      url: 'http://localhost:3000',
    },
    {
      command: 'pnpm --filter=api dev',
      url: 'http://localhost:4000/graphql',
    },
  ],
})
```

## GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  unit-tests:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Run unit tests
        run: pnpm test:unit
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db

      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
        with:
          directory: ./coverage

  e2e-tests:
    runs-on: ubuntu-latest
    needs: unit-tests

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Install Playwright Browsers
        run: npx playwright install --with-deps

      - name: Start services
        run: |
          pnpm --filter=api dev &
          pnpm --filter=web dev &
          sleep 30

      - name: Run E2E tests
        run: pnpm test:e2e

      - name: Upload Playwright report
        uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

## Example Test Files

### Unit Test Example (React Component)

```typescript
// web/tests/unit/components/LoginForm.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithProviders } from '../../helpers/renderWithProviders'
import { LoginForm } from '../../../src/components/LoginForm'

describe('LoginForm', () => {
  const mockOnSubmit = jest.fn()

  beforeEach(() => {
    mockOnSubmit.mockClear()
  })

  test('renders login form correctly', () => {
    renderWithProviders(<LoginForm onSubmit={mockOnSubmit} />)

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  test('validates required fields', async () => {
    renderWithProviders(<LoginForm onSubmit={mockOnSubmit} />)

    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument()
      expect(screen.getByText(/password is required/i)).toBeInTheDocument()
    })

    expect(mockOnSubmit).not.toHaveBeenCalled()
  })
})
```

### Integration Test Example (GraphQL)

```typescript
// api/tests/integration/auth.integration.test.ts
import { createTestClient } from '../helpers/apolloTestServer'
import { gql } from 'apollo-server-core'

describe('Auth Integration', () => {
  let testClient: any

  beforeAll(async () => {
    testClient = await createTestClient()
  })

  describe('login mutation', () => {
    test('should login with valid credentials', async () => {
      const LOGIN_MUTATION = gql`
        mutation Login($email: String!, $password: String!) {
          login(email: $email, password: $password) {
            user {
              id
              email
            }
            accessToken
          }
        }
      `

      const response = await testClient.mutate({
        mutation: LOGIN_MUTATION,
        variables: {
          email: 'test@example.com',
          password: 'password123',
        },
      })

      expect(response.data.login.user.email).toBe('test@example.com')
      expect(response.data.login.accessToken).toBeTruthy()
    })
  })
})
```

### E2E Test Example (Playwright)

```typescript
// e2e/tests/auth/login.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Login Flow', () => {
  test('should login successfully', async ({ page }) => {
    await page.goto('/login')

    await page.fill('[data-testid="email"]', 'test@example.com')
    await page.fill('[data-testid="password"]', 'password123')
    await page.click('[data-testid="login-button"]')

    await expect(page).toHaveURL('/dashboard')
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible()
  })

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login')

    await page.fill('[data-testid="email"]', 'test@example.com')
    await page.fill('[data-testid="password"]', 'wrongpassword')
    await page.click('[data-testid="login-button"]')

    await expect(page.locator('[data-testid="error-message"]')).toContainText('Invalid credentials')
  })
})
```

## Installation Scripts

1. **Install testing frameworks and dependencies**
2. **Setup test configuration files**
3. **Create test directory structure**
4. **Generate example test files**
5. **Setup test database configuration**
6. **Configure CI/CD pipeline**
7. **Update package.json scripts**

## Dependencies Added

### Frontend

- `vitest` or `jest`
- `@testing-library/react`
- `@testing-library/jest-dom`
- `@testing-library/user-event`
- `jsdom`
- `@vitest/coverage-v8`

### Backend

- `jest`
- `ts-jest`
- `supertest`
- `@types/jest`
- `@types/supertest`

### E2E

- `@playwright/test`
- `playwright`

### CI/CD

- GitHub Actions workflow files
- Codecov integration
