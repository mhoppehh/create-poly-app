# Accessibility

## Overview

Comprehensive accessibility (a11y) implementation ensuring WCAG 2.1 AA compliance, screen reader support, keyboard navigation, and inclusive design patterns for React applications.

## Priority

**HIGH** - Essential for inclusive design and legal compliance

## Dependencies

- `vite` (React application base)
- `tailwind` (accessible styling foundation)
- `ui-component-library` (accessible UI components)

## Feature Description

Complete accessibility infrastructure providing WCAG compliance, assistive technology support, keyboard navigation, focus management, and comprehensive testing tools for creating inclusive React applications.

### Key Features

- **WCAG Compliance**: WCAG 2.1 AA/AAA standards implementation
- **Screen Reader Support**: ARIA labels, landmarks, live regions, descriptions
- **Keyboard Navigation**: Focus management, keyboard shortcuts, skip links
- **Color & Contrast**: High contrast themes, color-blind friendly palettes
- **Motion & Animation**: Reduced motion preferences, safe animations
- **Testing Tools**: Automated accessibility testing, manual testing guides
- **Documentation**: Accessibility guidelines and best practices

## Configuration

```typescript
interface AccessibilityConfig {
  compliance: {
    level: 'A' | 'AA' | 'AAA'
    guidelines: 'WCAG21' | 'WCAG22' | 'Section508'
    autoTest: boolean
    reportViolations: boolean
  }
  features: {
    skipLinks: boolean
    focusManagement: boolean
    liveRegions: boolean
    keyboardShortcuts: boolean
    highContrast: boolean
    reducedMotion: boolean
  }
  screenReader: {
    announcements: boolean
    descriptions: boolean
    landmarks: boolean
    headingStructure: boolean
  }
  testing: {
    axeCore: boolean
    lighthouse: boolean
    manualChecklist: boolean
    colorContrast: boolean
  }
  preferences: {
    persistUserSettings: boolean
    respectSystemSettings: boolean
    customizations: boolean
  }
}
```

## Generated Files

### Accessibility Structure

```
web/src/
├── accessibility/
│   ├── index.ts                      # Accessibility exports
│   ├── components/
│   │   ├── SkipLinks.tsx             # Skip navigation links
│   │   ├── LiveRegion.tsx            # ARIA live regions
│   │   ├── FocusManager.tsx          # Focus management
│   │   ├── KeyboardShortcuts.tsx     # Keyboard shortcut handler
│   │   ├── AccessibilityMenu.tsx     # Accessibility preferences
│   │   ├── HighContrastToggle.tsx    # High contrast theme toggle
│   │   ├── ReducedMotionToggle.tsx   # Motion preference toggle
│   │   ├── FontSizeControl.tsx       # Font size adjustment
│   │   ├── ScreenReaderOnly.tsx      # Screen reader only content
│   │   └── AccessibilityTester.tsx   # Testing component
│   ├── hooks/
│   │   ├── useAccessibility.ts       # Main accessibility hook
│   │   ├── useFocusManagement.ts     # Focus management hook
│   │   ├── useKeyboardNavigation.ts  # Keyboard navigation
│   │   ├── useScreenReader.ts        # Screen reader utilities
│   │   ├── useReducedMotion.ts       # Motion preference hook
│   │   ├── useHighContrast.ts        # High contrast hook
│   │   ├── useLiveRegion.ts          # Live region announcements
│   │   └── useAccessibilityTesting.ts # Testing utilities
│   ├── utils/
│   │   ├── a11yUtils.ts              # Accessibility utilities
│   │   ├── ariaUtils.ts              # ARIA attribute helpers
│   │   ├── focusUtils.ts             # Focus management utilities
│   │   ├── keyboardUtils.ts          # Keyboard handling utilities
│   │   ├── colorUtils.ts             # Color and contrast utilities
│   │   ├── textUtils.ts              # Text and typography utilities
│   │   └── testingUtils.ts           # Testing helper functions
│   ├── providers/
│   │   ├── AccessibilityProvider.tsx # Accessibility context
│   │   ├── FocusProvider.tsx         # Focus management context
│   │   └── PreferencesProvider.tsx   # User preferences context
│   ├── styles/
│   │   ├── high-contrast.css         # High contrast theme
│   │   ├── reduced-motion.css        # Reduced motion styles
│   │   ├── focus-visible.css         # Focus indication styles
│   │   └── screen-reader.css         # Screen reader specific styles
│   ├── constants/
│   │   ├── ariaLabels.ts             # Standard ARIA labels
│   │   ├── keyboardShortcuts.ts      # Keyboard shortcut definitions
│   │   ├── landmarks.ts              # ARIA landmark definitions
│   │   └── roles.ts                  # ARIA role definitions
│   ├── testing/
│   │   ├── axeConfig.ts              # axe-core configuration
│   │   ├── testSuites.ts             # Automated test suites
│   │   ├── manualChecklist.ts        # Manual testing checklist
│   │   └── reportGenerator.ts        # Accessibility report generator
│   └── types/
│       ├── accessibility.ts          # Accessibility type definitions
│       ├── aria.ts                   # ARIA types
│       ├── keyboard.ts               # Keyboard types
│       └── testing.ts                # Testing types
```

## Code Examples

### Main Accessibility Hook

```typescript
// web/src/accessibility/hooks/useAccessibility.ts
import { useState, useEffect, useCallback, useContext, createContext } from 'react'
import { useReducedMotion } from './useReducedMotion'
import { useHighContrast } from './useHighContrast'
import { useFocusManagement } from './useFocusManagement'
import { useScreenReader } from './useScreenReader'

export interface AccessibilityPreferences {
  reducedMotion: boolean
  highContrast: boolean
  fontSize: 'small' | 'medium' | 'large' | 'extra-large'
  keyboardNavigation: boolean
  screenReaderOptimized: boolean
  announcements: boolean
}

export interface AccessibilityState {
  preferences: AccessibilityPreferences
  isKeyboardUser: boolean
  isScreenReaderActive: boolean
  violations: any[]
}

export interface AccessibilityActions {
  updatePreference: <K extends keyof AccessibilityPreferences>(
    key: K,
    value: AccessibilityPreferences[K]
  ) => void
  resetPreferences: () => void
  announceToScreenReader: (message: string, priority?: 'polite' | 'assertive') => void
  focusElement: (selector: string) => void
  skipToContent: () => void
}

const defaultPreferences: AccessibilityPreferences = {
  reducedMotion: false,
  highContrast: false,
  fontSize: 'medium',
  keyboardNavigation: true,
  screenReaderOptimized: false,
  announcements: true,
}

const AccessibilityContext = createContext<{
  state: AccessibilityState
  actions: AccessibilityActions
} | null>(null)

export function useAccessibility() {
  const context = useContext(AccessibilityContext)
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider')
  }
  return context
}

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useState<AccessibilityPreferences>(() => {
    // Load from localStorage or system preferences
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('accessibility-preferences')
      if (saved) {
        try {
          return { ...defaultPreferences, ...JSON.parse(saved) }
        } catch (error) {
          console.error('Failed to parse accessibility preferences:', error)
        }
      }

      // Detect system preferences
      return {
        ...defaultPreferences,
        reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        highContrast: window.matchMedia('(prefers-contrast: high)').matches,
      }
    }

    return defaultPreferences
  })

  const [isKeyboardUser, setIsKeyboardUser] = useState(false)
  const [isScreenReaderActive, setIsScreenReaderActive] = useState(false)
  const [violations, setViolations] = useState<any[]>([])

  // Initialize accessibility features
  const { prefersReducedMotion } = useReducedMotion()
  const { prefersHighContrast } = useHighContrast()
  const { focusElement, skipToContent } = useFocusManagement()
  const { announceToScreenReader, detectScreenReader } = useScreenReader()

  // Detect keyboard usage
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        setIsKeyboardUser(true)
        document.body.classList.add('keyboard-navigation')
      }
    }

    const handleMouseDown = () => {
      setIsKeyboardUser(false)
      document.body.classList.remove('keyboard-navigation')
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handleMouseDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleMouseDown)
    }
  }, [])

  // Detect screen reader
  useEffect(() => {
    const detected = detectScreenReader()
    setIsScreenReaderActive(detected)
  }, [detectScreenReader])

  // Apply preferences to DOM
  useEffect(() => {
    const root = document.documentElement

    // Font size
    root.setAttribute('data-font-size', preferences.fontSize)

    // High contrast
    if (preferences.highContrast || prefersHighContrast) {
      root.classList.add('high-contrast')
    } else {
      root.classList.remove('high-contrast')
    }

    // Reduced motion
    if (preferences.reducedMotion || prefersReducedMotion) {
      root.classList.add('reduced-motion')
    } else {
      root.classList.remove('reduced-motion')
    }

    // Screen reader optimized
    if (preferences.screenReaderOptimized || isScreenReaderActive) {
      root.classList.add('screen-reader-optimized')
    } else {
      root.classList.remove('screen-reader-optimized')
    }

    // Save preferences
    localStorage.setItem('accessibility-preferences', JSON.stringify(preferences))
  }, [preferences, prefersHighContrast, prefersReducedMotion, isScreenReaderActive])

  // Actions
  const updatePreference = useCallback(<K extends keyof AccessibilityPreferences>(
    key: K,
    value: AccessibilityPreferences[K]
  ) => {
    setPreferences(prev => ({ ...prev, [key]: value }))

    if (preferences.announcements) {
      announceToScreenReader(`${key} preference updated to ${value}`)
    }
  }, [preferences.announcements, announceToScreenReader])

  const resetPreferences = useCallback(() => {
    setPreferences(defaultPreferences)
    announceToScreenReader('Accessibility preferences reset to default')
  }, [announceToScreenReader])

  const state: AccessibilityState = {
    preferences,
    isKeyboardUser,
    isScreenReaderActive,
    violations,
  }

  const actions: AccessibilityActions = {
    updatePreference,
    resetPreferences,
    announceToScreenReader,
    focusElement,
    skipToContent,
  }

  return (
    <AccessibilityContext.Provider value={{ state, actions }}>
      {children}
    </AccessibilityContext.Provider>
  )
}
```

### Skip Links Component

```typescript
// web/src/accessibility/components/SkipLinks.tsx
import React from 'react'
import { cn } from '../../utils/cn'

export interface SkipLink {
  href: string
  label: string
  key?: string
}

export interface SkipLinksProps {
  links?: SkipLink[]
  className?: string
}

const defaultSkipLinks: SkipLink[] = [
  { href: '#main-content', label: 'Skip to main content' },
  { href: '#navigation', label: 'Skip to navigation' },
  { href: '#search', label: 'Skip to search' },
  { href: '#footer', label: 'Skip to footer' },
]

export const SkipLinks: React.FC<SkipLinksProps> = ({
  links = defaultSkipLinks,
  className
}) => {
  const handleSkipClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    const href = event.currentTarget.getAttribute('href')
    if (!href) return

    const targetId = href.substring(1) // Remove #
    const targetElement = document.getElementById(targetId)

    if (targetElement) {
      event.preventDefault()

      // Focus the target element
      targetElement.focus({ preventScroll: false })

      // Scroll to the element
      targetElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      })

      // Add temporary focus outline for non-focusable elements
      if (!targetElement.hasAttribute('tabindex')) {
        targetElement.setAttribute('tabindex', '-1')
        targetElement.addEventListener('blur', () => {
          targetElement.removeAttribute('tabindex')
        }, { once: true })
      }
    }
  }

  return (
    <nav
      className={cn("skip-links", className)}
      aria-label="Skip links"
    >
      <ul className="sr-only focus-within:not-sr-only fixed top-0 left-0 z-50 bg-primary text-primary-foreground p-2 rounded-br-md">
        {links.map((link, index) => (
          <li key={link.key || index}>
            <a
              href={link.href}
              onClick={handleSkipClick}
              className={cn(
                "block px-3 py-2 rounded text-sm font-medium",
                "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                "hover:bg-primary/90 transition-colors"
              )}
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}

// Screen reader only utility component
export const ScreenReaderOnly: React.FC<{
  children: React.ReactNode
  as?: keyof JSX.IntrinsicElements
  className?: string
}> = ({ children, as: Component = 'span', className, ...props }) => {
  return (
    <Component
      className={cn("sr-only", className)}
      {...props}
    >
      {children}
    </Component>
  )
}

// Focus management utility
export const FocusGuard: React.FC<{
  children: React.ReactNode
  enabled?: boolean
  initialFocus?: string
  finalFocus?: string
}> = ({
  children,
  enabled = true,
  initialFocus,
  finalFocus
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!enabled || !containerRef.current) return

    const container = containerRef.current
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )

    const firstFocusable = focusableElements[0] as HTMLElement
    const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement

    // Set initial focus
    if (initialFocus) {
      const initialElement = container.querySelector(initialFocus) as HTMLElement
      initialElement?.focus()
    } else {
      firstFocusable?.focus()
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return

      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstFocusable) {
          event.preventDefault()
          lastFocusable?.focus()
        }
      } else {
        // Tab
        if (document.activeElement === lastFocusable) {
          event.preventDefault()
          firstFocusable?.focus()
        }
      }
    }

    container.addEventListener('keydown', handleKeyDown)

    return () => {
      container.removeEventListener('keydown', handleKeyDown)

      // Return focus to final element
      if (finalFocus) {
        const finalElement = document.querySelector(finalFocus) as HTMLElement
        finalElement?.focus()
      }
    }
  }, [enabled, initialFocus, finalFocus])

  return (
    <div ref={containerRef} className="focus-guard">
      {children}
    </div>
  )
}
```

### Live Region Component

```typescript
// web/src/accessibility/components/LiveRegion.tsx
import React, { useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../../utils/cn'

export interface LiveRegionProps {
  message: string
  priority?: 'polite' | 'assertive' | 'off'
  atomic?: boolean
  relevant?: 'additions' | 'removals' | 'text' | 'all'
  busy?: boolean
  className?: string
}

export const LiveRegion: React.FC<LiveRegionProps> = ({
  message,
  priority = 'polite',
  atomic = true,
  relevant = 'text',
  busy = false,
  className,
}) => {
  const regionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (regionRef.current && message) {
      // Clear and set message to ensure it's announced
      regionRef.current.textContent = ''
      setTimeout(() => {
        if (regionRef.current) {
          regionRef.current.textContent = message
        }
      }, 10)
    }
  }, [message])

  if (typeof window === 'undefined') return null

  return createPortal(
    <div
      ref={regionRef}
      aria-live={priority}
      aria-atomic={atomic}
      aria-relevant={relevant}
      aria-busy={busy}
      className={cn("sr-only", className)}
    >
      {message}
    </div>,
    document.body
  )
}

// Global live region hook
export function useLiveRegion() {
  const [announcements, setAnnouncements] = React.useState<Array<{
    id: string
    message: string
    priority: 'polite' | 'assertive'
    timestamp: number
  }>>([])

  const announce = React.useCallback((
    message: string,
    priority: 'polite' | 'assertive' = 'polite'
  ) => {
    const id = Date.now().toString()

    setAnnouncements(prev => [...prev, {
      id,
      message,
      priority,
      timestamp: Date.now()
    }])

    // Remove announcement after it's been announced
    setTimeout(() => {
      setAnnouncements(prev => prev.filter(a => a.id !== id))
    }, 1000)
  }, [])

  const announceError = React.useCallback((message: string) => {
    announce(`Error: ${message}`, 'assertive')
  }, [announce])

  const announceSuccess = React.useCallback((message: string) => {
    announce(`Success: ${message}`, 'polite')
  }, [announce])

  const announceWarning = React.useCallback((message: string) => {
    announce(`Warning: ${message}`, 'polite')
  }, [announce])

  const announceInfo = React.useCallback((message: string) => {
    announce(message, 'polite')
  }, [announce])

  return {
    announcements,
    announce,
    announceError,
    announceSuccess,
    announceWarning,
    announceInfo,
  }
}

// Live region provider component
export const LiveRegionProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const { announcements } = useLiveRegion()

  return (
    <>
      {children}

      {/* Polite announcements */}
      {announcements
        .filter(a => a.priority === 'polite')
        .map(announcement => (
          <LiveRegion
            key={announcement.id}
            message={announcement.message}
            priority="polite"
          />
        ))}

      {/* Assertive announcements */}
      {announcements
        .filter(a => a.priority === 'assertive')
        .map(announcement => (
          <LiveRegion
            key={announcement.id}
            message={announcement.message}
            priority="assertive"
          />
        ))}
    </>
  )
}
```

### Accessibility Menu Component

```typescript
// web/src/accessibility/components/AccessibilityMenu.tsx
import React, { useState } from 'react'
import { Settings, Eye, Type, Zap, Volume2 } from 'lucide-react'
import { Button } from '../../components/ui/button/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card/Card'
import { Switch } from '../../components/ui/switch/Switch'
import { Select } from '../../components/ui/select/Select'
import { Modal } from '../../components/ui/modal/Modal'
import { useAccessibility } from '../hooks/useAccessibility'
import { cn } from '../../utils/cn'

export interface AccessibilityMenuProps {
  trigger?: React.ReactNode
  className?: string
}

export const AccessibilityMenu: React.FC<AccessibilityMenuProps> = ({
  trigger,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const { state, actions } = useAccessibility()

  const fontSizeOptions = [
    { value: 'small', label: 'Small' },
    { value: 'medium', label: 'Medium (Default)' },
    { value: 'large', label: 'Large' },
    { value: 'extra-large', label: 'Extra Large' },
  ]

  const defaultTrigger = (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Open accessibility settings"
    >
      <Settings className="h-4 w-4" />
    </Button>
  )

  return (
    <>
      <div onClick={() => setIsOpen(true)}>
        {trigger || defaultTrigger}
      </div>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Accessibility Settings"
        description="Customize your experience with accessibility preferences"
        size="md"
      >
        <div className={cn("space-y-6", className)}>
          {/* Visual Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Eye className="h-5 w-5" />
                Visual Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Font Size */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Type className="h-4 w-4" />
                  <label htmlFor="font-size" className="text-sm font-medium">
                    Font Size
                  </label>
                </div>
                <Select
                  value={state.preferences.fontSize}
                  onValueChange={(value) => actions.updatePreference('fontSize', value as any)}
                  options={fontSizeOptions}
                  className="w-40"
                />
              </div>

              {/* High Contrast */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-current rounded-sm" />
                  <label htmlFor="high-contrast" className="text-sm font-medium">
                    High Contrast
                  </label>
                </div>
                <Switch
                  id="high-contrast"
                  checked={state.preferences.highContrast}
                  onCheckedChange={(checked) => actions.updatePreference('highContrast', checked)}
                />
              </div>

              {/* Reduced Motion */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  <label htmlFor="reduced-motion" className="text-sm font-medium">
                    Reduce Motion
                  </label>
                </div>
                <Switch
                  id="reduced-motion"
                  checked={state.preferences.reducedMotion}
                  onCheckedChange={(checked) => actions.updatePreference('reducedMotion', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Navigation Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Navigation Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Keyboard Navigation */}
              <div className="flex items-center justify-between">
                <label htmlFor="keyboard-nav" className="text-sm font-medium">
                  Enhanced Keyboard Navigation
                </label>
                <Switch
                  id="keyboard-nav"
                  checked={state.preferences.keyboardNavigation}
                  onCheckedChange={(checked) => actions.updatePreference('keyboardNavigation', checked)}
                />
              </div>

              {/* Screen Reader Optimized */}
              <div className="flex items-center justify-between">
                <label htmlFor="screen-reader" className="text-sm font-medium">
                  Screen Reader Optimized
                </label>
                <Switch
                  id="screen-reader"
                  checked={state.preferences.screenReaderOptimized}
                  onCheckedChange={(checked) => actions.updatePreference('screenReaderOptimized', checked)}
                />
              </div>

              {/* Announcements */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Volume2 className="h-4 w-4" />
                  <label htmlFor="announcements" className="text-sm font-medium">
                    Screen Reader Announcements
                  </label>
                </div>
                <Switch
                  id="announcements"
                  checked={state.preferences.announcements}
                  onCheckedChange={(checked) => actions.updatePreference('announcements', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Status Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Accessibility Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span>Keyboard Navigation Detected:</span>
                <span className={state.isKeyboardUser ? 'text-green-600' : 'text-gray-500'}>
                  {state.isKeyboardUser ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Screen Reader Detected:</span>
                <span className={state.isScreenReaderActive ? 'text-green-600' : 'text-gray-500'}>
                  {state.isScreenReaderActive ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Accessibility Violations:</span>
                <span className={state.violations.length === 0 ? 'text-green-600' : 'text-red-600'}>
                  {state.violations.length}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button
              variant="outline"
              onClick={actions.resetPreferences}
            >
              Reset to Default
            </Button>
            <Button
              onClick={() => {
                actions.announceToScreenReader('Accessibility settings saved')
                setIsOpen(false)
              }}
            >
              Save Settings
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}

// Quick accessibility actions component
export const QuickA11yActions: React.FC<{
  className?: string
}> = ({ className }) => {
  const { actions } = useAccessibility()

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => actions.skipToContent()}
        className="sr-only focus:not-sr-only"
      >
        Skip to Content
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => actions.focusElement('#main-navigation')}
        className="sr-only focus:not-sr-only"
      >
        Go to Navigation
      </Button>
    </div>
  )
}
```

### Accessibility Testing Hook

```typescript
// web/src/accessibility/hooks/useAccessibilityTesting.ts
import { useEffect, useState, useCallback } from 'react'
import { AxeResults } from 'axe-core'

export function useAccessibilityTesting(enabled: boolean = process.env.NODE_ENV === 'development') {
  const [violations, setViolations] = useState<AxeResults['violations']>([])
  const [isLoading, setIsLoading] = useState(false)
  const [lastScan, setLastScan] = useState<Date | null>(null)

  const runAccessibilityTest = useCallback(
    async (element?: Element) => {
      if (!enabled) return

      setIsLoading(true)

      try {
        // Dynamically import axe-core to avoid bundling in production
        const axe = await import('axe-core')

        const results = await axe.run(element || document, {
          rules: {
            // Configure rules based on WCAG level
            'color-contrast': { enabled: true },
            'keyboard-navigation': { enabled: true },
            'aria-labels': { enabled: true },
            'heading-order': { enabled: true },
            'focus-management': { enabled: true },
          },
          tags: ['wcag2a', 'wcag2aa', 'wcag21aa'],
        })

        setViolations(results.violations)
        setLastScan(new Date())

        // Log violations in development
        if (results.violations.length > 0) {
          console.group('🚨 Accessibility Violations Found')
          results.violations.forEach(violation => {
            console.error(`${violation.impact?.toUpperCase()}: ${violation.help}`)
            console.log(
              'Elements affected:',
              violation.nodes.map(node => node.html),
            )
            console.log('How to fix:', violation.helpUrl)
          })
          console.groupEnd()
        } else {
          console.log('✅ No accessibility violations found')
        }
      } catch (error) {
        console.error('Accessibility testing failed:', error)
      } finally {
        setIsLoading(false)
      }
    },
    [enabled],
  )

  // Auto-run tests on DOM changes in development
  useEffect(() => {
    if (!enabled) return

    let timeoutId: NodeJS.Timeout

    const observer = new MutationObserver(() => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        runAccessibilityTest()
      }, 1000) // Debounce by 1 second
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['aria-*', 'role', 'tabindex'],
    })

    // Initial test
    runAccessibilityTest()

    return () => {
      observer.disconnect()
      clearTimeout(timeoutId)
    }
  }, [enabled, runAccessibilityTest])

  const getViolationSummary = useCallback(() => {
    const summary = violations.reduce(
      (acc, violation) => {
        const impact = violation.impact || 'minor'
        acc[impact] = (acc[impact] || 0) + violation.nodes.length
        return acc
      },
      {} as Record<string, number>,
    )

    return {
      total: violations.reduce((sum, v) => sum + v.nodes.length, 0),
      critical: summary.critical || 0,
      serious: summary.serious || 0,
      moderate: summary.moderate || 0,
      minor: summary.minor || 0,
    }
  }, [violations])

  return {
    violations,
    isLoading,
    lastScan,
    runAccessibilityTest,
    getViolationSummary,
    hasViolations: violations.length > 0,
  }
}
```

## Installation Steps

1. **Install Accessibility Dependencies**

   ```bash
   # Core accessibility testing
   pnpm add -D axe-core @axe-core/react

   # Additional testing utilities
   pnpm add -D @testing-library/jest-axe

   # Focus management
   pnpm add focus-trap-react
   ```

2. **Setup Accessibility Linting**

   ```bash
   # ESLint accessibility rules
   pnpm add -D eslint-plugin-jsx-a11y

   # Add to .eslintrc.js:
   # extends: ['plugin:jsx-a11y/recommended']
   ```

3. **Configure Testing Tools**

   ```bash
   # Lighthouse CI for accessibility auditing
   pnpm add -D @lhci/cli

   # Automated accessibility testing in CI
   pnpm add -D pa11y
   ```

This accessibility system provides comprehensive WCAG compliance, assistive technology support, and inclusive design patterns for React applications.
