# UI Component Library

## Overview

Enterprise-grade modular component library with design system, theming, accessibility, and comprehensive UI components for rapid application development. Automatically adapts to support web-only, mobile-only, or cross-platform development based on detected platforms.

## Priority

**HIGH** - Essential foundation for consistent, accessible UI development

## Dependencies

- `vite` (React web application base) OR React Native setup (mobile application base)
- `tailwind` (styling foundation for web - when web platform detected)

## Auto-Detected Extensions

- **Cross-Platform Mode**: Automatically enabled when both web and mobile platforms are detected
- **GraphQL Integration**: Enhanced when `graphql-client` is present
- **Shared State Management**: Advanced sharing when both platforms use compatible state solutions

## Feature Description

Intelligent component library that automatically scales from single-platform to cross-platform development. Provides consistent design system, accessibility standards, theme support, and extensive component collection while maintaining optimal bundle sizes and platform-specific optimizations.

### Inspiration from Popular Component Libraries

This system draws best practices from leading component libraries:

#### Web Component Libraries
- **shadcn/ui**: Modular, copy-paste components with Tailwind CSS styling
- **Chakra UI**: Simple, modular, and accessible component library
- **Material-UI (MUI)**: Comprehensive React components implementing Material Design
- **Ant Design**: Enterprise-grade UI design language and React components
- **Mantine**: Full-featured components and hooks library with dark theme support
- **Headless UI**: Unstyled, accessible UI components for React and Vue

#### Cross-Platform Libraries
- **NativeBase**: Universal components that work on web, iOS, and Android
- **Tamagui**: Universal UI components with optimizations for React Native and web
- **Gluestack UI**: Universal components with platform-specific optimizations
- **React Native Elements**: Cross-platform UI toolkit for React Native and React

#### Design System Inspirations
- **Atlassian Design System**: Comprehensive design tokens and component guidelines
- **IBM Carbon**: Open-source design system with React components
- **Shopify Polaris**: Design system for building consistent merchant experiences
- **GitHub Primer**: Design system powering GitHub's interface

### Key Features

- **Complete Design System**: Typography, colors, spacing, shadows, and layout tokens
- **Cross-Platform Design Tokens**: Shared design tokens that work across web and mobile
- **Theme Support**: Light/dark mode, custom themes, platform-adaptive styling
- **Accessibility First**: WCAG 2.1 AA compliance, screen reader support, keyboard navigation
- **Component Variants**: Multiple sizes, states, and style variations
- **Platform Abstraction**: Unified API with platform-specific implementations
- **Composition Patterns**: Compound components, render props, headless components
- **Animation System**: Smooth transitions, micro-interactions, loading states
- **Icon Library**: Comprehensive icon set with platform-specific optimizations
- **Form Components**: Advanced form controls with validation integration
- **Modular Architecture**: Tree-shakable components for optimal bundle size

### Component Library Integration Options

The system supports multiple integration approaches based on your preferences:

#### shadcn/ui Style (Copy-Paste)
- Components are copied into your project for full customization
- Tailwind CSS-based styling with design tokens
- Full control over component implementation
- Easy customization and modification

#### Library Package Style (npm install)
- Traditional npm package installation
- Versioned releases with semantic versioning
- Automatic updates and bug fixes
- Smaller bundle sizes through tree-shaking

#### Hybrid Approach (Recommended)
- Core design system as npm package
- Component implementations as copyable templates
- Best of both worlds: consistency + customization
- Gradual migration path between approaches

### Popular Component Patterns Supported

#### From shadcn/ui
- **CLI-based component installation**: `npx ui add button`
- **Customizable component variants**: Using class-variance-authority (cva)
- **Tailwind CSS integration**: Full design token support
- **TypeScript-first**: Complete type safety

#### From Chakra UI
- **Simple API**: Intuitive prop-based styling
- **Responsive design**: Built-in responsive props
- **Theme customization**: Easy theme overrides
- **Accessibility**: ARIA attributes and keyboard navigation

#### From Material-UI
- **Comprehensive components**: Complete component ecosystem
- **Theming system**: Advanced theme customization
- **Design tokens**: Consistent spacing, colors, and typography
- **Styled components**: CSS-in-JS styling approach

#### From Headless UI
- **Unstyled components**: Logic without styling constraints
- **Full accessibility**: Complete ARIA implementation
- **Flexible styling**: Use any CSS framework
- **Behavior patterns**: Focus management, keyboard navigation

## Architecture

### Adaptive Structure

The component library automatically adapts its structure based on detected platforms:

#### Single Platform Mode (Web Only)
```
packages/
├── ui-core/                    # Core design system and tokens
│   ├── tokens/                 # Design tokens (colors, spacing, typography)
│   ├── themes/                 # Theme definitions and utilities
│   └── utils/                  # Shared utilities and helpers
└── ui-web/                     # Web-specific implementations
    ├── components/             # React components for web
    ├── styles/                 # CSS/Tailwind implementations
    └── hooks/                  # Web-specific hooks
```

#### Single Platform Mode (Mobile Only)
```
packages/
├── ui-core/                    # Core design system and tokens
│   ├── tokens/                 # Design tokens (colors, spacing, typography)
│   ├── themes/                 # Theme definitions and utilities
│   └── utils/                  # Shared utilities and helpers
└── ui-mobile/                  # Mobile-specific implementations
    ├── components/             # React Native components
    ├── styles/                 # React Native StyleSheet implementations
    └── hooks/                  # Mobile-specific hooks
```

#### Cross-Platform Mode (Both Platforms Detected)
```
packages/
├── ui-core/                    # Core design system and tokens
│   ├── tokens/                 # Design tokens (colors, spacing, typography)
│   ├── themes/                 # Theme definitions and utilities
│   └── utils/                  # Shared utilities and helpers
├── ui-web/                     # Web-specific implementations
│   ├── components/             # React components for web
│   ├── styles/                 # CSS/Tailwind implementations
│   └── hooks/                  # Web-specific hooks
├── ui-mobile/                  # Mobile-specific implementations
│   ├── components/             # React Native components
│   ├── styles/                 # React Native StyleSheet implementations
│   └── hooks/                  # Mobile-specific hooks
└── ui-shared/                  # Cross-platform components (auto-generated)
    ├── components/             # Platform-agnostic component logic
    │   ├── Button/             # Shared Button logic with platform renderers
    │   ├── Form/               # Shared form validation and state management
    │   ├── Modal/              # Shared modal logic with platform-specific UI
    │   └── DataTable/          # Shared data logic with platform adaptations
    ├── hooks/                  # Cross-platform business logic hooks
    │   ├── useAuth.ts          # Shared authentication logic
    │   ├── useApi.ts           # Shared API interaction patterns
    │   └── useForm.ts          # Shared form state management
    ├── utils/                  # Platform-agnostic utilities
    │   ├── validation.ts       # Shared validation functions
    │   ├── formatting.ts       # Data formatting utilities
    │   └── constants.ts        # Shared constants and enums
    └── graphql/                # Shared GraphQL operations (when GraphQL detected)
        ├── queries/            # Shared GraphQL queries
        ├── mutations/          # Shared GraphQL mutations
        └── subscriptions/      # Shared real-time subscriptions
```

### Component Implementation Strategy

- **Base Components**: Core design system components (Button, Input, Card, etc.)
- **Compound Components**: Complex multi-part components (Modal, Dropdown, etc.)
- **Layout Components**: Responsive grid, flex, and container components
- **Form Components**: Comprehensive form controls with validation
- **Data Display**: Tables, lists, charts, and visualization components
- **Feedback Components**: Loading states, notifications, progress indicators

### Platform-Specific Adaptations

- **Web Implementation**: Uses HTML elements with Tailwind CSS styling
- **Mobile Implementation**: Uses React Native components with StyleSheet
- **Shared Logic**: Business logic, state management, and utilities (cross-platform mode only)
- **Conditional Loading**: Platform-specific code splitting and lazy loading

### Cross-Platform Features (Auto-Enabled)

When both web and mobile platforms are detected, the following features are automatically enabled:

#### Intelligent Component Composition

- **Headless Components**: Logic-only components with platform-specific renderers
- **Render Props Pattern**: Flexible component composition across platforms
- **Hook-Based Architecture**: Shared business logic through custom hooks
- **Context Providers**: Shared state management and theming
- **Error Boundaries**: Consistent error handling across platforms

#### Business Logic Sharing

- **Authentication Flow**: Shared auth logic with platform-specific UI
- **Data Fetching**: Unified data loading patterns and caching
- **Form Management**: Shared validation, state, and submission logic
- **Navigation Logic**: Shared routing logic with platform-specific navigation
- **State Synchronization**: Real-time state sync between platforms

#### GraphQL Integration (When GraphQL Client Present)

- **Shared Operations**: Common queries, mutations, and subscriptions
- **Type Safety**: Generated TypeScript types shared across platforms
- **Cache Policies**: Unified Apollo Client cache configuration
- **Error Handling**: Consistent GraphQL error management
- **Optimistic Updates**: Shared optimistic update patterns

#### Mobile-Specific Integrations

- **Device Features**: Camera, location, push notifications, haptics
- **Native Navigation**: Platform-appropriate navigation patterns
- **Offline Support**: Local storage and sync capabilities
- **Performance Optimization**: Mobile-specific performance enhancements
- **Platform UI Guidelines**: iOS and Android design guideline compliance

## Implementation Examples

### shadcn/ui Style Component (Web)

```typescript
// Web-only Button component inspired by shadcn/ui
import { cn } from '@/lib/utils'
import { cva, type VariantProps } from 'class-variance-authority'
import { ButtonHTMLAttributes, forwardRef } from 'react'

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'underline-offset-4 hover:underline text-primary',
      },
      size: {
        default: 'h-10 py-2 px-4',
        sm: 'h-9 px-3 rounded-md',
        lg: 'h-11 px-8 rounded-md',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
```

### Chakra UI Style Component (Cross-Platform)

```typescript
// Cross-platform Button inspired by Chakra UI's simple API
interface ButtonProps {
  variant?: 'solid' | 'outline' | 'ghost'
  colorScheme?: 'blue' | 'green' | 'red' | 'gray'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  isLoading?: boolean
  isDisabled?: boolean
  children: React.ReactNode
  onPress?: () => void
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'solid',
  colorScheme = 'blue',
  size = 'md',
  isLoading,
  isDisabled,
  children,
  onPress,
}) => {
  const styles = useButtonStyles({ variant, colorScheme, size, isDisabled })
  
  return (
    <Pressable
      style={styles.button}
      onPress={onPress}
      disabled={isDisabled || isLoading}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
    >
      {isLoading ? <Spinner size={size} /> : children}
    </Pressable>
  )
}
```

### Headless UI Style Component (Platform Agnostic)

```typescript
// Headless Modal component with platform-specific renderers
import { useModal } from '@/hooks/useModal'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
}

// Headless logic
export const useModalLogic = ({ isOpen, onClose }: Pick<ModalProps, 'isOpen' | 'onClose'>) => {
  const modalRef = useRef<HTMLDivElement>(null)
  
  const handleEscapeKey = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      onClose()
    }
  }, [onClose])
  
  const handleBackdropClick = useCallback((event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      onClose()
    }
  }, [onClose])
  
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey)
      return () => document.removeEventListener('keydown', handleEscapeKey)
    }
  }, [isOpen, handleEscapeKey])
  
  return {
    modalRef,
    handleBackdropClick,
    isOpen
  }
}

// Platform-specific implementations
export const Modal = Platform.select({
  web: WebModal,      // Uses HTML dialog element
  ios: IOSModal,      // Uses React Native Modal with iOS styling
  android: AndroidModal, // Uses React Native Modal with Material styling
  default: WebModal
})
```

### Material-UI Style Theme System

```typescript
// Comprehensive theme system inspired by Material-UI
export const createTheme = (options: ThemeOptions = {}) => {
  const palette = {
    primary: {
      50: '#eff6ff',
      500: '#3b82f6',
      900: '#1e3a8a',
      main: options.palette?.primary?.main || '#3b82f6',
      contrastText: '#ffffff',
    },
    secondary: {
      main: options.palette?.secondary?.main || '#64748b',
      contrastText: '#ffffff',
    },
    // ... more palette options
  }
  
  const typography = {
    fontFamily: options.typography?.fontFamily || 'Inter, sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      lineHeight: 1.2,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.5,
    },
    // ... more typography variants
  }
  
  const components = {
    Button: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
      },
      variants: [
        {
          props: { variant: 'gradient' },
          style: {
            background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
          },
        },
      ],
    },
    // ... more component overrides
  }
  
  return {
    palette,
    typography,
    components,
    spacing: (factor: number) => factor * 8, // 8px base spacing
  }
}
```

### Cross-Platform Component (Auto-Generated)

```typescript
// NativeBase/Tamagui style cross-platform component
import { Platform } from 'react-native'

// Shared component logic with platform-specific implementations
export const useButton = (props: ButtonProps) => {
  const { onPress, disabled, loading } = props
  
  const handlePress = useCallback(() => {
    if (!disabled && !loading) {
      onPress?.()
    }
  }, [onPress, disabled, loading])
  
  return {
    handlePress,
    isInteractive: !disabled && !loading,
    accessibilityProps: {
      accessibilityRole: 'button' as const,
      accessibilityState: { disabled }
    }
  }
}

// Platform-specific implementations (inspired by Tamagui's approach)
export const Button = styled(Pressable, {
  name: 'Button',
  variants: {
    variant: {
      primary: {
        backgroundColor: '$primary',
        color: '$primaryForeground',
        web: {
          ':hover': {
            backgroundColor: '$primaryHover',
          }
        }
      },
      outline: {
        borderWidth: 1,
        borderColor: '$borderColor',
        backgroundColor: 'transparent',
        web: {
          ':hover': {
            backgroundColor: '$accent',
          }
        }
      }
    },
    size: {
      sm: {
        paddingHorizontal: '$3',
        paddingVertical: '$2',
        fontSize: '$sm'
      },
      md: {
        paddingHorizontal: '$4',
        paddingVertical: '$2.5',
        fontSize: '$base'
      }
    }
  },
  defaultVariants: {
    variant: 'primary',
    size: 'md'
  }
})

// Usage remains consistent across platforms
const MyComponent = () => {
  return (
    <Button variant="primary" size="md" onPress={() => console.log('Pressed')}>
      Click me
    </Button>
  )
}
```

### Component Library CLI (shadcn/ui Inspired)

```bash
# Install individual components
npx ui add button
npx ui add modal
npx ui add form

# Install component groups
npx ui add forms      # All form-related components
npx ui add feedback   # Loading, toast, alert components
npx ui add navigation # Tabs, breadcrumb, pagination

# Cross-platform installation
npx ui add button --platforms web,mobile
npx ui add modal --mobile-only
npx ui add table --web-only

# Theme and customization
npx ui init --theme shadcn
npx ui init --theme chakra
npx ui init --theme material
```

### Shared Hook with GraphQL

```typescript
// Cross-platform authentication hook (auto-generated when GraphQL detected)
export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  
  const [loginMutation] = useMutation(LOGIN_MUTATION)
  
  const login = async (credentials: LoginCredentials) => {
    const { data } = await loginMutation({ variables: credentials })
    setUser(data.login.user)
    
    // Platform-specific storage
    await storage.setItem('token', data.login.token)
    
    return data.login
  }
  
  return { user, loading, login, logout }
}
```

## Migration and Scaling

### Automatic Platform Detection

The system automatically detects available platforms and scales accordingly:

1. **Single Platform**: Provides optimized, platform-specific components
2. **Cross-Platform Detection**: Automatically generates shared component layer
3. **Incremental Enhancement**: Existing components are enhanced without breaking changes
4. **Performance Optimization**: Platform-specific bundles maintain optimal size

### Development Workflow

- **Hot Reloading**: Changes reflect instantly across all detected platforms
- **Type Safety**: Full TypeScript support with automatic type generation
- **Testing**: Platform-specific and shared test utilities
- **Storybook Integration**: Component documentation works across all platforms
- **Bundle Analysis**: Platform-specific bundle optimization and analysis

### Component Library Ecosystem

The system integrates with popular tools and libraries:

#### Design Tools
- **Figma Integration**: Design tokens sync with Figma design systems
- **Sketch Support**: Import design tokens from Sketch libraries
- **Adobe XD**: Component mapping and design token extraction

#### Development Tools
- **Storybook**: Interactive component documentation and testing
- **Chromatic**: Visual testing and component review workflow
- **Plop.js**: Component generation templates and CLI tools
- **ESLint/Prettier**: Code quality and formatting rules

#### Testing Ecosystem
- **Jest/Vitest**: Unit testing for component logic
- **React Testing Library**: Component behavior testing
- **Playwright/Cypress**: End-to-end testing across platforms
- **Detox**: React Native end-to-end testing

#### Build Tools
- **Vite**: Fast development and optimized production builds
- **Metro**: React Native bundler with shared package support
- **Rollup/esbuild**: Library packaging and distribution
- **TypeScript**: Full type safety and IntelliSense support

### Popular Component Library Comparisons

| Feature | shadcn/ui | Chakra UI | MUI | Ant Design | This System |
|---------|-----------|-----------|-----|------------|-------------|
| **Styling** | Tailwind CSS | CSS-in-JS | CSS-in-JS | Less/CSS | Adaptive (Tailwind + RN) |
| **Customization** | Full Control | Theme-based | Theme + Styled | Theme + Less | Hybrid Approach |
| **Bundle Size** | Tree-shakable | Medium | Large | Large | Platform-optimized |
| **TypeScript** | Excellent | Good | Excellent | Good | Excellent |
| **Mobile Support** | None | None | None | None | Native Support |
| **Accessibility** | Good | Excellent | Excellent | Good | WCAG 2.1 AA |
| **Learning Curve** | Low | Low | Medium | Medium | Low-Medium |
| **Ecosystem** | Growing | Mature | Very Mature | Very Mature | Modern Stack |

### Migration Paths

#### From shadcn/ui
```bash
# Existing shadcn/ui components can be enhanced
npx ui migrate shadcn --enable-mobile
npx ui migrate shadcn --add-cross-platform
```

#### From Chakra UI
```bash
# Convert Chakra components to cross-platform
npx ui migrate chakra --preserve-api
npx ui migrate chakra --mobile-components
```

#### From Material-UI
```bash
# Migrate MUI components with theme preservation
npx ui migrate mui --keep-theme
npx ui migrate mui --responsive-props
```
