# Visual Testing

## Overview

Automated visual regression testing to detect UI changes and ensure consistent visual appearance across browsers, devices, and application updates.

## Priority

**MEDIUM** - Important for maintaining UI consistency and catching visual regressions

## Dependencies

- `vite` (for frontend application)
- `e2e-testing` (integrates with E2E testing framework)

## Feature Description

Comprehensive visual testing solution with screenshot comparison, cross-browser validation, responsive design testing, and automated visual regression detection.

### Key Features

- **Screenshot Comparison**: Pixel-perfect visual regression detection
- **Cross-Browser Testing**: Visual consistency across different browsers
- **Responsive Testing**: Visual validation across device sizes
- **Component Testing**: Individual component visual testing
- **Accessibility Testing**: Visual accessibility validation
- **Theme Testing**: Dark/light theme visual validation

## Configuration

```typescript
interface VisualTestingConfig {
  framework: 'playwright' | 'cypress' | 'puppeteer' | 'backstop'
  browsers: ('chromium' | 'firefox' | 'webkit')[]
  viewports: {
    mobile: { width: number; height: number }
    tablet: { width: number; height: number }
    desktop: { width: number; height: number }
    custom?: Array<{ name: string; width: number; height: number }>
  }
  comparison: {
    threshold: number // 0.0 to 1.0
    diffColor: string
    highlightDifferences: boolean
    ignoreAntialiasing: boolean
  }
  features: {
    fullPageScreenshots: boolean
    componentScreenshots: boolean
    responsiveScreenshots: boolean
    themeScreenshots: boolean
    accessibilityScreenshots: boolean
  }
  storage: {
    baselineDir: string
    actualDir: string
    diffDir: string
    reportDir: string
  }
}
```

## Generated Files

### Visual Testing Structure

```
visual-tests/
├── config/
│   ├── visual.config.ts            # Visual testing configuration
│   └── viewports.ts                # Device viewport definitions
├── tests/
│   ├── pages/
│   │   ├── homepage.visual.test.ts # Homepage visual tests
│   │   ├── login.visual.test.ts    # Login page visual tests
│   │   ├── dashboard.visual.test.ts # Dashboard visual tests
│   │   └── profile.visual.test.ts  # Profile page visual tests
│   ├── components/
│   │   ├── button.visual.test.ts   # Button component visuals
│   │   ├── form.visual.test.ts     # Form component visuals
│   │   ├── modal.visual.test.ts    # Modal component visuals
│   │   └── navigation.visual.test.ts # Navigation visuals
│   ├── responsive/
│   │   ├── mobile.visual.test.ts   # Mobile-specific visual tests
│   │   ├── tablet.visual.test.ts   # Tablet-specific visual tests
│   │   └── desktop.visual.test.ts  # Desktop-specific visual tests
│   ├── themes/
│   │   ├── light-theme.visual.test.ts # Light theme visuals
│   │   ├── dark-theme.visual.test.ts  # Dark theme visuals
│   │   └── contrast.visual.test.ts    # High contrast visuals
│   └── accessibility/
│       ├── focus-states.visual.test.ts # Focus state visuals
│       └── color-contrast.visual.test.ts # Color contrast tests
├── baselines/                      # Reference screenshots
│   ├── chromium/
│   ├── firefox/
│   └── webkit/
├── results/                        # Test result screenshots
│   ├── actual/
│   ├── diff/
│   └── reports/
├── utils/
│   ├── visualHelpers.ts           # Visual testing utilities
│   ├── deviceEmulation.ts         # Device emulation helpers
│   └── imageComparison.ts         # Image comparison utilities
└── storybook/                     # Storybook visual tests
    ├── stories.visual.test.ts     # All stories visual test
    └── chromatic.config.ts        # Chromatic configuration
```

## Code Examples

### Playwright Visual Testing

```typescript
// visual-tests/tests/pages/homepage.visual.test.ts
import { test, expect } from '@playwright/test'

test.describe('Homepage Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    // Wait for all images and fonts to load
    await page.waitForLoadState('networkidle')
    // Wait for any animations to complete
    await page.waitForTimeout(500)
  })

  test('homepage renders correctly on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 })

    await expect(page).toHaveScreenshot('homepage-desktop.png', {
      fullPage: true,
      threshold: 0.2,
      animations: 'disabled',
    })
  })

  test('homepage renders correctly on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })

    await expect(page).toHaveScreenshot('homepage-tablet.png', {
      fullPage: true,
      threshold: 0.2,
      animations: 'disabled',
    })
  })

  test('homepage renders correctly on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })

    await expect(page).toHaveScreenshot('homepage-mobile.png', {
      fullPage: true,
      threshold: 0.2,
      animations: 'disabled',
    })
  })

  test('hero section visual consistency', async ({ page }) => {
    const heroSection = page.locator('[data-testid="hero-section"]')
    await expect(heroSection).toBeVisible()

    await expect(heroSection).toHaveScreenshot('hero-section.png', {
      threshold: 0.1,
    })
  })

  test('navigation menu visual states', async ({ page }) => {
    const navigation = page.locator('[data-testid="main-navigation"]')

    // Default state
    await expect(navigation).toHaveScreenshot('navigation-default.png')

    // Hover states
    await navigation.locator('a:first-child').hover()
    await expect(navigation).toHaveScreenshot('navigation-hover.png')

    // Mobile menu
    await page.setViewportSize({ width: 375, height: 667 })
    const mobileMenuButton = page.locator('[data-testid="mobile-menu-button"]')
    await mobileMenuButton.click()

    await expect(page.locator('[data-testid="mobile-menu"]')).toHaveScreenshot('mobile-menu-open.png')
  })

  test('call-to-action buttons visual states', async ({ page }) => {
    const ctaButton = page.locator('[data-testid="primary-cta"]')

    // Default state
    await expect(ctaButton).toHaveScreenshot('cta-button-default.png')

    // Hover state
    await ctaButton.hover()
    await expect(ctaButton).toHaveScreenshot('cta-button-hover.png')

    // Focus state
    await ctaButton.focus()
    await expect(ctaButton).toHaveScreenshot('cta-button-focus.png')

    // Active state (simulate click but don't actually click)
    await page.addStyleTag({
      content: '[data-testid="primary-cta"]:active { background-color: #1a365d; }',
    })
    await ctaButton.dispatchEvent('mousedown')
    await expect(ctaButton).toHaveScreenshot('cta-button-active.png')
  })
})
```

### Component Visual Testing

```typescript
// visual-tests/tests/components/button.visual.test.ts
import { test, expect } from '@playwright/test'

test.describe('Button Component Visual Tests', () => {
  const buttonVariants = ['primary', 'secondary', 'success', 'warning', 'danger', 'outline', 'ghost', 'link']

  const buttonSizes = ['sm', 'md', 'lg', 'xl']

  test.beforeEach(async ({ page }) => {
    // Navigate to component showcase/storybook page
    await page.goto('/components/button')
    await page.waitForLoadState('networkidle')
  })

  buttonVariants.forEach(variant => {
    test(`${variant} button variant renders correctly`, async ({ page }) => {
      const button = page.locator(`[data-variant="${variant}"]`)
      await expect(button).toBeVisible()

      await expect(button).toHaveScreenshot(`button-${variant}.png`, {
        threshold: 0.1,
      })
    })

    test(`${variant} button states render correctly`, async ({ page }) => {
      const button = page.locator(`[data-variant="${variant}"]`).first()

      // Default state
      await expect(button).toHaveScreenshot(`button-${variant}-default.png`)

      // Hover state
      await button.hover()
      await expect(button).toHaveScreenshot(`button-${variant}-hover.png`)

      // Focus state
      await button.focus()
      await expect(button).toHaveScreenshot(`button-${variant}-focus.png`)

      // Disabled state
      await page.evaluate(
        el => {
          el.setAttribute('disabled', 'true')
        },
        await button.elementHandle(),
      )
      await expect(button).toHaveScreenshot(`button-${variant}-disabled.png`)
    })
  })

  buttonSizes.forEach(size => {
    test(`button ${size} size renders correctly`, async ({ page }) => {
      const button = page.locator(`[data-size="${size}"]`)
      await expect(button).toBeVisible()

      await expect(button).toHaveScreenshot(`button-size-${size}.png`, {
        threshold: 0.1,
      })
    })
  })

  test('button with icon renders correctly', async ({ page }) => {
    const iconButton = page.locator('[data-testid="button-with-icon"]')
    await expect(iconButton).toHaveScreenshot('button-with-icon.png')

    const iconOnlyButton = page.locator('[data-testid="icon-only-button"]')
    await expect(iconOnlyButton).toHaveScreenshot('button-icon-only.png')
  })

  test('loading button state renders correctly', async ({ page }) => {
    const loadingButton = page.locator('[data-testid="loading-button"]')

    // Trigger loading state
    await loadingButton.click()
    await page.waitForSelector('[data-testid="loading-spinner"]')

    await expect(loadingButton).toHaveScreenshot('button-loading.png')
  })
})
```

### Theme Visual Testing

```typescript
// visual-tests/tests/themes/dark-theme.visual.test.ts
import { test, expect } from '@playwright/test'

test.describe('Dark Theme Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')

    // Enable dark theme
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark')
    })

    // Wait for theme transition
    await page.waitForTimeout(300)
    await page.waitForLoadState('networkidle')
  })

  test('homepage in dark theme', async ({ page }) => {
    await expect(page).toHaveScreenshot('homepage-dark-theme.png', {
      fullPage: true,
      threshold: 0.3, // Higher threshold for theme differences
    })
  })

  test('navigation in dark theme', async ({ page }) => {
    const navigation = page.locator('[data-testid="main-navigation"]')
    await expect(navigation).toHaveScreenshot('navigation-dark-theme.png')
  })

  test('form components in dark theme', async ({ page }) => {
    await page.goto('/components/forms')

    const formSection = page.locator('[data-testid="form-showcase"]')
    await expect(formSection).toHaveScreenshot('forms-dark-theme.png')
  })

  test('button variants in dark theme', async ({ page }) => {
    await page.goto('/components/button')

    const buttonShowcase = page.locator('[data-testid="button-showcase"]')
    await expect(buttonShowcase).toHaveScreenshot('buttons-dark-theme.png')
  })

  test('modal in dark theme', async ({ page }) => {
    await page.goto('/components/modal')

    const openModalButton = page.locator('[data-testid="open-modal"]')
    await openModalButton.click()

    const modal = page.locator('[data-testid="modal"]')
    await expect(modal).toBeVisible()
    await expect(modal).toHaveScreenshot('modal-dark-theme.png')
  })
})
```

### Responsive Visual Testing

```typescript
// visual-tests/tests/responsive/mobile.visual.test.ts
import { test, expect, devices } from '@playwright/test'

const mobileDevices = [
  { name: 'iPhone 12', ...devices['iPhone 12'] },
  { name: 'Pixel 5', ...devices['Pixel 5'] },
  { name: 'iPhone SE', ...devices['iPhone SE'] },
]

test.describe('Mobile Responsive Visual Tests', () => {
  mobileDevices.forEach(device => {
    test.describe(`${device.name}`, () => {
      test.use({ ...device })

      test('homepage mobile layout', async ({ page }) => {
        await page.goto('/')
        await page.waitForLoadState('networkidle')

        await expect(page).toHaveScreenshot(`homepage-${device.name.toLowerCase().replace(/\s+/g, '-')}.png`, {
          fullPage: true,
          threshold: 0.2,
        })
      })

      test('mobile navigation menu', async ({ page }) => {
        await page.goto('/')

        const mobileMenuButton = page.locator('[data-testid="mobile-menu-button"]')
        await expect(mobileMenuButton).toBeVisible()
        await expect(mobileMenuButton).toHaveScreenshot(
          `mobile-menu-button-${device.name.toLowerCase().replace(/\s+/g, '-')}.png`,
        )

        await mobileMenuButton.click()
        const mobileMenu = page.locator('[data-testid="mobile-menu"]')
        await expect(mobileMenu).toBeVisible()
        await expect(mobileMenu).toHaveScreenshot(
          `mobile-menu-open-${device.name.toLowerCase().replace(/\s+/g, '-')}.png`,
        )
      })

      test('mobile form layout', async ({ page }) => {
        await page.goto('/contact')

        const contactForm = page.locator('[data-testid="contact-form"]')
        await expect(contactForm).toHaveScreenshot(`contact-form-${device.name.toLowerCase().replace(/\s+/g, '-')}.png`)
      })
    })
  })
})
```

### Accessibility Visual Testing

```typescript
// visual-tests/tests/accessibility/focus-states.visual.test.ts
import { test, expect } from '@playwright/test'

test.describe('Accessibility Focus States Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')

    // Enable high contrast mode for better focus visibility
    await page.addStyleTag({
      content: `
        :focus {
          outline: 3px solid #0066cc !important;
          outline-offset: 2px !important;
        }
        :focus-visible {
          outline: 3px solid #0066cc !important;
          outline-offset: 2px !important;
        }
      `,
    })
  })

  test('keyboard navigation focus states', async ({ page }) => {
    const focusableElements = await page
      .locator('a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])')
      .all()

    for (let i = 0; i < Math.min(focusableElements.length, 10); i++) {
      const element = focusableElements[i]
      await element.focus()

      const elementId =
        (await element.getAttribute('data-testid')) || (await element.getAttribute('id')) || `element-${i}`

      await expect(element).toHaveScreenshot(`focus-state-${elementId}.png`, {
        threshold: 0.1,
      })
    }
  })

  test('form focus states', async ({ page }) => {
    await page.goto('/contact')

    const formInputs = [
      '[data-testid="name-input"]',
      '[data-testid="email-input"]',
      '[data-testid="message-textarea"]',
      '[data-testid="submit-button"]',
    ]

    for (const selector of formInputs) {
      const input = page.locator(selector)
      await input.focus()

      const testId = selector.replace(/\[data-testid="(.+)"\]/, '$1')
      await expect(input).toHaveScreenshot(`form-focus-${testId}.png`)
    }
  })

  test('skip link visibility', async ({ page }) => {
    // Press Tab to show skip link
    await page.keyboard.press('Tab')

    const skipLink = page.locator('[data-testid="skip-to-content"]')
    await expect(skipLink).toBeVisible()
    await expect(skipLink).toHaveScreenshot('skip-link-visible.png')
  })
})
```

### Visual Testing Configuration

```typescript
// visual-tests/config/visual.config.ts
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './visual-tests/tests',
  fullyParallel: false, // Visual tests should run sequentially for consistency
  forbidOnly: !!process.env.CI,
  retries: 0, // No retries for visual tests
  workers: 1, // Single worker for consistency

  reporter: [
    ['html', { outputFolder: 'visual-tests/results/reports' }],
    ['json', { outputFile: 'visual-tests/results/test-results.json' }],
  ],

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',

    // Consistent visual settings
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,

    // Disable animations for consistent screenshots
    reducedMotion: 'reduce',
  },

  expect: {
    // Visual comparison threshold
    toHaveScreenshot: {
      threshold: 0.2,
      mode: 'pixel',
      animations: 'disabled',
    },
    toMatchSnapshot: {
      threshold: 0.3,
    },
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Consistent font rendering
        fontFamily: 'Arial, sans-serif',
      },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  webServer: {
    command: 'pnpm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
})
```

### Visual Testing Utilities

```typescript
// visual-tests/utils/visualHelpers.ts
import { Page } from '@playwright/test'

export class VisualTestHelpers {
  constructor(private page: Page) {}

  async waitForAllImages() {
    // Wait for all images to load
    await this.page.evaluate(async () => {
      const images = Array.from(document.querySelectorAll('img'))
      await Promise.all(
        images.map(img => {
          if (img.complete) return Promise.resolve()
          return new Promise(resolve => {
            img.onload = resolve
            img.onerror = resolve
          })
        }),
      )
    })
  }

  async disableAnimations() {
    await this.page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
        }
      `,
    })
  }

  async scrollToElement(selector: string) {
    await this.page.locator(selector).scrollIntoViewIfNeeded()
    await this.page.waitForTimeout(100) // Allow scroll to settle
  }

  async setTheme(theme: 'light' | 'dark') {
    await this.page.evaluate(theme => {
      document.documentElement.setAttribute('data-theme', theme)
    }, theme)
    await this.page.waitForTimeout(300) // Wait for theme transition
  }

  async mockSystemDateTime(dateTime: string) {
    await this.page.clock.install({ time: new Date(dateTime) })
  }

  async stabilizeContent() {
    await this.waitForAllImages()
    await this.page.waitForLoadState('networkidle')
    await this.page.waitForTimeout(500) // Allow any remaining animations
  }
}
```

## Installation Steps

1. **Install Visual Testing Dependencies**

   ```bash
   # For Playwright visual testing
   pnpm add -D @playwright/test
   pnpm exec playwright install

   # For Storybook visual testing (optional)
   pnpm add -D @storybook/addon-visual-tests chromatic
   ```

2. **Setup Visual Testing Scripts**

   ```json
   {
     "scripts": {
       "test:visual": "playwright test --config=visual-tests/config/visual.config.ts",
       "test:visual:update": "playwright test --config=visual-tests/config/visual.config.ts --update-snapshots",
       "test:visual:ui": "playwright test --config=visual-tests/config/visual.config.ts --ui",
       "test:visual:headed": "playwright test --config=visual-tests/config/visual.config.ts --headed"
     }
   }
   ```

3. **Configure CI/CD for Visual Tests**

   ```yaml
   # .github/workflows/visual-tests.yml
   - name: Run Visual Tests
     run: pnpm test:visual

   - name: Upload Visual Test Reports
     uses: actions/upload-artifact@v3
     if: always()
     with:
       name: visual-test-reports
       path: visual-tests/results/
   ```

This visual testing framework provides comprehensive visual regression detection, cross-browser consistency validation, and automated visual quality assurance for modern web applications.
