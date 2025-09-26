# End-to-End Testing

## Overview

Comprehensive end-to-end testing framework using Playwright or Cypress for full user journey testing across multiple browsers and devices.

## Priority

**HIGH** - Critical for ensuring complete user workflows function correctly

## Dependencies

- `vite` (for frontend application)
- `apollo-server` (for API endpoints)
- `prisma` (for database setup in tests)

## Feature Description

Modern E2E testing setup with cross-browser support, visual testing, mobile simulation, and CI/CD integration for comprehensive application testing.

### Key Features

- **Cross-Browser Testing**: Chrome, Firefox, Safari, Edge
- **Mobile Device Testing**: Responsive design validation
- **Visual Regression Testing**: Screenshot comparison
- **API Testing Integration**: Network request mocking and validation
- **Parallel Test Execution**: Fast test suite execution
- **Test Reporting**: Detailed HTML reports with screenshots/videos

## Configuration

```typescript
interface E2ETestingConfig {
  framework: 'playwright' | 'cypress'
  browsers: ('chromium' | 'firefox' | 'webkit' | 'chrome' | 'edge')[]
  devices: {
    desktop: boolean
    tablet: boolean
    mobile: boolean
    customDevices: string[]
  }
  features: {
    visualTesting: boolean
    networkMocking: boolean
    parallelExecution: boolean
    videoRecording: boolean
    screenshotOnFailure: boolean
  }
  baseUrl: string
  timeout: number
  retries: number
}
```

## Generated Files

### Playwright Setup

```
e2e/
├── playwright.config.ts          # Playwright configuration
├── tests/
│   ├── auth/
│   │   ├── login.spec.ts         # Login flow tests
│   │   ├── signup.spec.ts        # Registration tests
│   │   └── logout.spec.ts        # Logout flow tests
│   ├── user/
│   │   ├── profile.spec.ts       # User profile tests
│   │   ├── settings.spec.ts      # User settings tests
│   │   └── dashboard.spec.ts     # Dashboard functionality
│   ├── api/
│   │   ├── graphql.spec.ts       # GraphQL endpoint tests
│   │   └── rest.spec.ts          # REST API tests
│   └── visual/
│       ├── homepage.spec.ts      # Visual regression tests
│       └── components.spec.ts    # Component visual tests
├── fixtures/
│   ├── testData.json             # Test data fixtures
│   ├── users.json                # User test data
│   └── mockResponses.json        # API mock responses
├── utils/
│   ├── testHelpers.ts            # Common test utilities
│   ├── dbHelpers.ts              # Database test helpers
│   └── authHelpers.ts            # Authentication helpers
└── reports/
    ├── html/                     # HTML test reports
    └── screenshots/              # Test screenshots
```

### Cypress Setup (Alternative)

```
cypress/
├── cypress.config.ts             # Cypress configuration
├── e2e/
│   ├── auth/
│   │   └── auth-flows.cy.ts      # Authentication tests
│   ├── user/
│   │   └── user-journey.cy.ts    # User workflow tests
│   └── api/
│       └── graphql-api.cy.ts     # API tests
├── fixtures/
│   ├── users.json                # Test data
│   └── responses.json            # Mock API responses
├── support/
│   ├── commands.ts               # Custom commands
│   ├── e2e.ts                    # Global setup
│   └── index.d.ts                # Type definitions
└── downloads/                    # Downloaded files during tests
```

## Code Examples

### Playwright Login Test

```typescript
// e2e/tests/auth/login.spec.ts
import { test, expect } from '@playwright/test'
import { LoginPage } from '../pages/LoginPage'
import { DashboardPage } from '../pages/DashboardPage'
import { testUsers } from '../fixtures/users'

test.describe('Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page before each test
    await page.goto('/login')
  })

  test('successful login with valid credentials', async ({ page }) => {
    const loginPage = new LoginPage(page)
    const dashboardPage = new DashboardPage(page)

    await loginPage.login(testUsers.validUser.email, testUsers.validUser.password)

    // Verify navigation to dashboard
    await expect(page).toHaveURL('/dashboard')
    await expect(dashboardPage.welcomeMessage).toBeVisible()
    await expect(dashboardPage.welcomeMessage).toContainText(`Welcome, ${testUsers.validUser.name}`)
  })

  test('failed login with invalid credentials', async ({ page }) => {
    const loginPage = new LoginPage(page)

    await loginPage.login('invalid@email.com', 'wrongpassword')

    // Should stay on login page with error message
    await expect(page).toHaveURL('/login')
    await expect(loginPage.errorMessage).toBeVisible()
    await expect(loginPage.errorMessage).toContainText('Invalid credentials')
  })

  test('form validation for empty fields', async ({ page }) => {
    const loginPage = new LoginPage(page)

    await loginPage.submitForm()

    // Check validation messages
    await expect(loginPage.emailError).toBeVisible()
    await expect(loginPage.passwordError).toBeVisible()
    await expect(loginPage.emailError).toContainText('Email is required')
    await expect(loginPage.passwordError).toContainText('Password is required')
  })

  test('remember me functionality', async ({ page, context }) => {
    const loginPage = new LoginPage(page)

    await loginPage.login(testUsers.validUser.email, testUsers.validUser.password, { rememberMe: true })

    // Close and reopen browser to test persistence
    await page.close()
    const newPage = await context.newPage()
    await newPage.goto('/')

    // Should be automatically logged in
    await expect(newPage).toHaveURL('/dashboard')
  })

  test('login with OAuth provider', async ({ page }) => {
    const loginPage = new LoginPage(page)

    // Mock OAuth response
    await page.route('**/auth/google/callback*', async route => {
      await route.fulfill({
        status: 302,
        headers: {
          Location: '/dashboard?auth=success',
        },
      })
    })

    await loginPage.clickGoogleLogin()

    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard?auth=success')
  })
})
```

### Page Object Model

```typescript
// e2e/pages/LoginPage.ts
import { Page, Locator } from '@playwright/test'

export class LoginPage {
  readonly page: Page
  readonly emailInput: Locator
  readonly passwordInput: Locator
  readonly submitButton: Locator
  readonly rememberMeCheckbox: Locator
  readonly googleLoginButton: Locator
  readonly githubLoginButton: Locator
  readonly errorMessage: Locator
  readonly emailError: Locator
  readonly passwordError: Locator
  readonly forgotPasswordLink: Locator

  constructor(page: Page) {
    this.page = page
    this.emailInput = page.locator('[data-testid="email-input"]')
    this.passwordInput = page.locator('[data-testid="password-input"]')
    this.submitButton = page.locator('[data-testid="submit-button"]')
    this.rememberMeCheckbox = page.locator('[data-testid="remember-me"]')
    this.googleLoginButton = page.locator('[data-testid="google-login"]')
    this.githubLoginButton = page.locator('[data-testid="github-login"]')
    this.errorMessage = page.locator('[data-testid="error-message"]')
    this.emailError = page.locator('[data-testid="email-error"]')
    this.passwordError = page.locator('[data-testid="password-error"]')
    this.forgotPasswordLink = page.locator('[data-testid="forgot-password"]')
  }

  async login(email: string, password: string, options?: { rememberMe?: boolean }) {
    await this.emailInput.fill(email)
    await this.passwordInput.fill(password)

    if (options?.rememberMe) {
      await this.rememberMeCheckbox.check()
    }

    await this.submitButton.click()
  }

  async submitForm() {
    await this.submitButton.click()
  }

  async clickGoogleLogin() {
    await this.googleLoginButton.click()
  }

  async clickGithubLogin() {
    await this.githubLoginButton.click()
  }

  async clickForgotPassword() {
    await this.forgotPasswordLink.click()
  }
}
```

### Visual Regression Test

```typescript
// e2e/tests/visual/homepage.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Homepage Visual Tests', () => {
  test('homepage appears correctly on desktop', async ({ page }) => {
    await page.goto('/')

    // Wait for all images and fonts to load
    await page.waitForLoadState('networkidle')

    // Take full page screenshot
    await expect(page).toHaveScreenshot('homepage-desktop.png', {
      fullPage: true,
      threshold: 0.2, // Allow 20% pixel difference
    })
  })

  test('homepage appears correctly on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    await expect(page).toHaveScreenshot('homepage-mobile.png', {
      fullPage: true,
      threshold: 0.2,
    })
  })

  test('header component visual consistency', async ({ page }) => {
    await page.goto('/')
    const header = page.locator('[data-testid="header"]')

    await expect(header).toHaveScreenshot('header-component.png')
  })

  test('dark theme homepage', async ({ page }) => {
    await page.goto('/')

    // Switch to dark theme
    await page.locator('[data-testid="theme-toggle"]').click()
    await page.waitForTimeout(500) // Wait for theme transition

    await expect(page).toHaveScreenshot('homepage-dark-theme.png', {
      fullPage: true,
    })
  })
})
```

### API Testing Integration

```typescript
// e2e/tests/api/graphql.spec.ts
import { test, expect } from '@playwright/test'

test.describe('GraphQL API Tests', () => {
  test('users query returns correct data structure', async ({ request }) => {
    const response = await request.post('/graphql', {
      data: {
        query: `
          query GetUsers {
            users {
              id
              email
              name
              createdAt
            }
          }
        `,
      },
    })

    expect(response.status()).toBe(200)

    const json = await response.json()
    expect(json.errors).toBeUndefined()
    expect(json.data.users).toBeDefined()
    expect(Array.isArray(json.data.users)).toBe(true)

    if (json.data.users.length > 0) {
      const user = json.data.users[0]
      expect(user).toHaveProperty('id')
      expect(user).toHaveProperty('email')
      expect(user).toHaveProperty('name')
      expect(user).toHaveProperty('createdAt')
    }
  })

  test('authentication required for protected endpoints', async ({ request }) => {
    const response = await request.post('/graphql', {
      data: {
        query: `
          query GetCurrentUser {
            currentUser {
              id
              email
            }
          }
        `,
      },
    })

    expect(response.status()).toBe(200)
    const json = await response.json()
    expect(json.errors).toBeDefined()
    expect(json.errors[0].message).toContain('Authentication required')
  })

  test('mutation creates user successfully', async ({ request }) => {
    const response = await request.post('/graphql', {
      data: {
        query: `
          mutation CreateUser($input: CreateUserInput!) {
            createUser(input: $input) {
              id
              email
              name
            }
          }
        `,
        variables: {
          input: {
            email: 'newuser@test.com',
            name: 'New User',
            password: 'password123',
          },
        },
      },
    })

    expect(response.status()).toBe(200)
    const json = await response.json()
    expect(json.errors).toBeUndefined()
    expect(json.data.createUser).toBeDefined()
    expect(json.data.createUser.email).toBe('newuser@test.com')
    expect(json.data.createUser.name).toBe('New User')
  })
})
```

### Cross-Browser Test

```typescript
// e2e/tests/cross-browser/compatibility.spec.ts
import { test, expect, devices } from '@playwright/test'

const browsers = ['chromium', 'firefox', 'webkit'] as const

browsers.forEach(browserName => {
  test.describe(`Cross-browser compatibility - ${browserName}`, () => {
    test.use({ ...devices['Desktop Chrome'] })

    test(`login flow works in ${browserName}`, async ({ page }) => {
      await page.goto('/login')

      await page.fill('[data-testid="email-input"]', 'user@test.com')
      await page.fill('[data-testid="password-input"]', 'password')
      await page.click('[data-testid="submit-button"]')

      // Should work consistently across browsers
      await expect(page).toHaveURL('/dashboard')
      await expect(page.locator('[data-testid="welcome-message"]')).toBeVisible()
    })

    test(`responsive design works in ${browserName}`, async ({ page }) => {
      // Test mobile view
      await page.setViewportSize({ width: 375, height: 667 })
      await page.goto('/')

      const mobileMenu = page.locator('[data-testid="mobile-menu-button"]')
      await expect(mobileMenu).toBeVisible()

      // Test desktop view
      await page.setViewportSize({ width: 1200, height: 800 })
      await expect(mobileMenu).toBeHidden()

      const desktopNav = page.locator('[data-testid="desktop-navigation"]')
      await expect(desktopNav).toBeVisible()
    })
  })
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
  reporter: [
    ['html', { outputFolder: 'e2e/reports/html' }],
    ['json', { outputFile: 'e2e/reports/test-results.json' }],
    ['junit', { outputFile: 'e2e/reports/junit.xml' }],
  ],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    // Desktop browsers
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
    // Mobile devices
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
    // Tablet
    {
      name: 'iPad',
      use: { ...devices['iPad Pro'] },
    },
  ],
  webServer: {
    command: 'pnpm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
})
```

## Installation Steps

1. **Install Playwright Dependencies**

   ```bash
   pnpm add -D @playwright/test
   pnpm exec playwright install
   ```

2. **Install Cypress (Alternative)**

   ```bash
   pnpm add -D cypress @cypress/react @cypress/vite-dev-server
   ```

3. **Setup Test Scripts**

   ```json
   {
     "scripts": {
       "e2e": "playwright test",
       "e2e:headed": "playwright test --headed",
       "e2e:ui": "playwright test --ui",
       "e2e:report": "playwright show-report",
       "e2e:debug": "playwright test --debug"
     }
   }
   ```

4. **CI/CD Integration**

   ```yaml
   # .github/workflows/e2e-tests.yml
   - name: Run E2E Tests
     run: pnpm e2e

   - name: Upload test reports
     uses: actions/upload-artifact@v3
     if: always()
     with:
       name: e2e-reports
       path: e2e/reports/
   ```

This E2E testing setup provides comprehensive browser testing, visual regression detection, and API validation with modern tooling and best practices.
