# Shared Component Library

## Overview

Cross-platform component library shared between web and mobile applications, providing consistent UI components, business logic, and utilities across all platforms.

## Priority

**HIGH** - Essential for code reuse and consistency

## Dependencies

- React Native application setup
- Web application (Next.js/React)
- TypeScript configuration

## Components

### UI Components

- **Cross-platform Components**: Buttons, inputs, cards, modals that work on web and mobile
- **Platform-specific Implementations**: Separate implementations for web and native
- **Consistent Design System**: Shared design tokens and theming
- **Accessibility Support**: WCAG compliance and React Native accessibility
- **Responsive Design**: Adaptive layouts for different screen sizes

### Business Logic

- **Shared Hooks**: Custom React hooks for common functionality
- **Utility Functions**: Pure functions for data manipulation and validation
- **State Management**: Shared state logic and reducers
- **Form Handling**: Common form validation and submission logic
- **Data Transformation**: API response parsing and formatting

### GraphQL Operations

- **Shared Queries**: Common GraphQL queries used across platforms
- **Shared Mutations**: GraphQL mutations with consistent error handling
- **Shared Subscriptions**: Real-time GraphQL subscriptions
- **Type Definitions**: Generated TypeScript types from GraphQL schema
- **Cache Policies**: Apollo Client cache configuration

### Type Definitions

- **API Types**: TypeScript interfaces for API responses
- **Domain Models**: Business entity type definitions
- **Utility Types**: Helper types for type safety
- **Platform-specific Types**: Types that vary by platform
- **Generic Types**: Reusable generic type definitions

### Theme System

- **Design Tokens**: Colors, typography, spacing, and shadows
- **Component Variants**: Different styles for component states
- **Dark Mode Support**: Light and dark theme configurations
- **Platform Adaptations**: Platform-specific theme adjustments
- **Responsive Breakpoints**: Screen size-based styling

## Configuration

```typescript
interface SharedLibraryConfig {
  components: {
    ui: boolean
    forms: boolean
    navigation: boolean
  }
  sharing: {
    hooks: boolean
    utils: boolean
    types: boolean
    graphql: boolean
  }
  bundling: 'monorepo' | 'npm-packages' | 'git-submodules'
}
```

## Generated Files

```
shared/
├── package.json                   # Shared package config
├── tsconfig.json                  # TypeScript configuration
├── src/
│   ├── components/                # Cross-platform components
│   │   ├── Button/
│   │   │   ├── Button.tsx         # Shared button logic
│   │   │   ├── Button.web.tsx     # Web-specific implementation
│   │   │   └── Button.native.tsx  # Native-specific implementation
│   │   ├── Input/
│   │   │   ├── Input.tsx
│   │   │   ├── Input.web.tsx
│   │   │   └── Input.native.tsx
│   │   ├── Card/
│   │   ├── Modal/
│   │   └── index.ts               # Component exports
│   ├── hooks/                     # Shared hooks
│   │   ├── useAuth.ts
│   │   ├── useBooks.ts
│   │   ├── useForm.ts
│   │   └── index.ts
│   ├── utils/                     # Shared utilities
│   │   ├── validation.ts
│   │   ├── formatting.ts
│   │   ├── api.ts
│   │   └── index.ts
│   ├── graphql/                   # Shared GraphQL operations
│   │   ├── queries/
│   │   │   ├── books.ts
│   │   │   └── users.ts
│   │   ├── mutations/
│   │   │   ├── auth.ts
│   │   │   └── books.ts
│   │   ├── subscriptions/
│   │   └── index.ts
│   ├── types/                     # Shared TypeScript types
│   │   ├── api.ts
│   │   ├── user.ts
│   │   ├── book.ts
│   │   └── index.ts
│   └── theme/                     # Shared theme system
│       ├── colors.ts
│       ├── typography.ts
│       ├── spacing.ts
│       └── index.ts
└── build/                         # Built shared package
```

## Cross-Platform Button Component

```typescript
// shared/src/components/Button/Button.tsx
import React from 'react'
import { ButtonProps } from './types'

// Platform-specific imports
import ButtonWeb from './Button.web'
import ButtonNative from './Button.native'
import { Platform } from 'react-native'

const Button = Platform.select({
  web: ButtonWeb,
  default: ButtonNative,
})

export default Button as React.ComponentType<ButtonProps>
```

```typescript
// shared/src/components/Button/types.ts
export interface ButtonProps {
  title: string
  onPress: () => void
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'small' | 'medium' | 'large'
  disabled?: boolean
  loading?: boolean
  icon?: string
  fullWidth?: boolean
  children?: React.ReactNode
}
```

```typescript
// shared/src/components/Button/Button.web.tsx
import React from 'react'
import { ButtonProps } from './types'
import { useTheme } from '../../theme'

const ButtonWeb: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  fullWidth = false,
  children,
  ...props
}) => {
  const theme = useTheme()

  const baseStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    borderRadius: theme.borderRadius.md,
    fontWeight: '600',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s ease',
    opacity: disabled ? 0.6 : 1,
    width: fullWidth ? '100%' : 'auto',
  }

  const variantStyles = {
    primary: {
      backgroundColor: theme.colors.primary,
      color: theme.colors.white,
    },
    secondary: {
      backgroundColor: theme.colors.secondary,
      color: theme.colors.white,
    },
    outline: {
      backgroundColor: 'transparent',
      color: theme.colors.primary,
      border: `1px solid ${theme.colors.primary}`,
    },
    ghost: {
      backgroundColor: 'transparent',
      color: theme.colors.primary,
    },
  }

  const sizeStyles = {
    small: {
      padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
      fontSize: theme.typography.sizes.sm,
    },
    medium: {
      padding: `${theme.spacing.sm} ${theme.spacing.md}`,
      fontSize: theme.typography.sizes.base,
    },
    large: {
      padding: `${theme.spacing.md} ${theme.spacing.lg}`,
      fontSize: theme.typography.sizes.lg,
    },
  }

  return (
    <button
      style={{
        ...baseStyles,
        ...variantStyles[variant],
        ...sizeStyles[size],
      }}
      onClick={onPress}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? 'Loading...' : children || title}
    </button>
  )
}

export default ButtonWeb
```

```typescript
// shared/src/components/Button/Button.native.tsx
import React from 'react'
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
} from 'react-native'
import { ButtonProps } from './types'
import { useTheme } from '../../theme'

const ButtonNative: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  fullWidth = false,
  children,
  ...props
}) => {
  const theme = useTheme()

  const buttonStyles = [
    styles.button,
    styles[variant],
    styles[size],
    fullWidth && styles.fullWidth,
    disabled && styles.disabled,
  ]

  const textStyles = [
    styles.text,
    styles[`${variant}Text`],
    styles[`${size}Text`],
  ]

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={theme.colors.white} />
      ) : (
        <Text style={textStyles}>{children || title}</Text>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    flexDirection: 'row',
  },
  primary: {
    backgroundColor: '#007AFF',
  },
  secondary: {
    backgroundColor: '#6C757D',
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  small: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  medium: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  large: {
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.6,
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  primaryText: {
    color: '#FFFFFF',
  },
  secondaryText: {
    color: '#FFFFFF',
  },
  outlineText: {
    color: '#007AFF',
  },
  ghostText: {
    color: '#007AFF',
  },
  smallText: {
    fontSize: 14,
  },
  mediumText: {
    fontSize: 16,
  },
  largeText: {
    fontSize: 18,
  },
})

export default ButtonNative
```

## Shared Authentication Hook

```typescript
// shared/src/hooks/useAuth.ts
import { useState, useEffect, useCallback } from 'react'
import { useMutation, useQuery } from '@apollo/client'
import { LOGIN_MUTATION, REGISTER_MUTATION, ME_QUERY } from '../graphql/auth'
import { User, LoginInput, RegisterInput } from '../types/user'
import { storeToken, getToken, removeToken } from '../utils/auth'

interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
}

interface AuthActions {
  login: (input: LoginInput) => Promise<void>
  register: (input: RegisterInput) => Promise<void>
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

export function useAuth(): AuthState & AuthActions {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  })

  const {
    data: userData,
    loading: userLoading,
    refetch: refetchUser,
  } = useQuery(ME_QUERY, {
    skip: !getToken(),
    errorPolicy: 'all',
  })

  const [loginMutation] = useMutation(LOGIN_MUTATION)
  const [registerMutation] = useMutation(REGISTER_MUTATION)

  useEffect(() => {
    if (userData?.me) {
      setAuthState(prev => ({
        ...prev,
        user: userData.me,
        loading: false,
        error: null,
      }))
    } else if (!userLoading) {
      setAuthState(prev => ({
        ...prev,
        user: null,
        loading: false,
      }))
    }
  }, [userData, userLoading])

  const login = useCallback(
    async (input: LoginInput) => {
      try {
        setAuthState(prev => ({ ...prev, loading: true, error: null }))

        const { data } = await loginMutation({
          variables: { input },
        })

        if (data?.login?.token) {
          await storeToken(data.login.token)
          setAuthState(prev => ({
            ...prev,
            user: data.login.user,
            loading: false,
            error: null,
          }))
        }
      } catch (error) {
        setAuthState(prev => ({
          ...prev,
          loading: false,
          error: error.message || 'Login failed',
        }))
        throw error
      }
    },
    [loginMutation],
  )

  const register = useCallback(
    async (input: RegisterInput) => {
      try {
        setAuthState(prev => ({ ...prev, loading: true, error: null }))

        const { data } = await registerMutation({
          variables: { input },
        })

        if (data?.register?.token) {
          await storeToken(data.register.token)
          setAuthState(prev => ({
            ...prev,
            user: data.register.user,
            loading: false,
            error: null,
          }))
        }
      } catch (error) {
        setAuthState(prev => ({
          ...prev,
          loading: false,
          error: error.message || 'Registration failed',
        }))
        throw error
      }
    },
    [registerMutation],
  )

  const logout = useCallback(async () => {
    try {
      await removeToken()
      setAuthState({
        user: null,
        loading: false,
        error: null,
      })
    } catch (error) {
      console.error('Logout error:', error)
    }
  }, [])

  const refresh = useCallback(async () => {
    try {
      await refetchUser()
    } catch (error) {
      console.error('Refresh error:', error)
      await logout()
    }
  }, [refetchUser, logout])

  return {
    ...authState,
    login,
    register,
    logout,
    refresh,
  }
}
```

## Shared Theme System

```typescript
// shared/src/theme/colors.ts
export const colors = {
  // Primary colors
  primary: '#007AFF',
  primaryLight: '#4DA3FF',
  primaryDark: '#0056CC',

  // Secondary colors
  secondary: '#6C757D',
  secondaryLight: '#ADB5BD',
  secondaryDark: '#495057',

  // Neutral colors
  white: '#FFFFFF',
  black: '#000000',
  gray100: '#F8F9FA',
  gray200: '#E9ECEF',
  gray300: '#DEE2E6',
  gray400: '#CED4DA',
  gray500: '#ADB5BD',
  gray600: '#6C757D',
  gray700: '#495057',
  gray800: '#343A40',
  gray900: '#212529',

  // Semantic colors
  success: '#28A745',
  successLight: '#6EC174',
  successDark: '#1E7E34',

  warning: '#FFC107',
  warningLight: '#FFD54F',
  warningDark: '#F57C00',

  error: '#DC3545',
  errorLight: '#EF5350',
  errorDark: '#C62828',

  info: '#17A2B8',
  infoLight: '#4FC3F7',
  infoDark: '#0E6B7A',

  // Background colors
  background: '#FFFFFF',
  backgroundSecondary: '#F8F9FA',
  surface: '#FFFFFF',
  surfaceSecondary: '#F8F9FA',

  // Text colors
  textPrimary: '#212529',
  textSecondary: '#6C757D',
  textTertiary: '#ADB5BD',
  textOnPrimary: '#FFFFFF',
  textOnSecondary: '#FFFFFF',
} as const

export const darkColors = {
  ...colors,
  background: '#121212',
  backgroundSecondary: '#1E1E1E',
  surface: '#1E1E1E',
  surfaceSecondary: '#2D2D2D',

  textPrimary: '#FFFFFF',
  textSecondary: '#B0B0B0',
  textTertiary: '#808080',
} as const

export type Colors = typeof colors
```

```typescript
// shared/src/theme/typography.ts
export const typography = {
  fonts: {
    primary: 'System',
    secondary: 'System',
    mono: 'Courier New',
  },

  sizes: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
    '6xl': 64,
  },

  weights: {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },

  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const

export type Typography = typeof typography
```

```typescript
// shared/src/theme/index.ts
import { colors, darkColors } from './colors'
import { typography } from './typography'
import { spacing } from './spacing'

export interface Theme {
  colors: typeof colors
  typography: typeof typography
  spacing: typeof spacing
  borderRadius: {
    none: number
    sm: number
    md: number
    lg: number
    xl: number
    full: number
  }
  shadows: {
    sm: string
    md: string
    lg: string
    xl: string
  }
}

export const lightTheme: Theme = {
  colors,
  typography,
  spacing,
  borderRadius: {
    none: 0,
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },
  shadows: {
    sm: '0 1px 3px rgba(0, 0, 0, 0.1)',
    md: '0 4px 6px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px rgba(0, 0, 0, 0.1)',
  },
}

export const darkTheme: Theme = {
  ...lightTheme,
  colors: darkColors,
}

// Theme context and hook
import React, { createContext, useContext, ReactNode } from 'react'

const ThemeContext = createContext<Theme>(lightTheme)

export function ThemeProvider({
  children,
  theme = lightTheme
}: {
  children: ReactNode
  theme?: Theme
}) {
  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): Theme {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

export * from './colors'
export * from './typography'
export * from './spacing'
```

## Shared GraphQL Operations

```typescript
// shared/src/graphql/auth.ts
import { gql } from '@apollo/client'

export const ME_QUERY = gql`
  query Me {
    me {
      id
      email
      name
      avatar
      role
      createdAt
      updatedAt
    }
  }
`

export const LOGIN_MUTATION = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      token
      user {
        id
        email
        name
        avatar
        role
      }
    }
  }
`

export const REGISTER_MUTATION = gql`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      token
      user {
        id
        email
        name
        avatar
        role
      }
    }
  }
`

export const REFRESH_TOKEN_MUTATION = gql`
  mutation RefreshToken {
    refreshToken {
      token
      user {
        id
        email
        name
        avatar
        role
      }
    }
  }
`
```

## Package Configuration

```json
{
  "name": "@yourapp/shared",
  "version": "1.0.0",
  "main": "build/index.js",
  "types": "build/index.d.ts",
  "scripts": {
    "build": "tsc",
    "build:watch": "tsc --watch",
    "test": "jest",
    "test:watch": "jest --watch",
    "type-check": "tsc --noEmit",
    "lint": "eslint src --ext .ts,.tsx",
    "lint:fix": "eslint src --ext .ts,.tsx --fix"
  },
  "peerDependencies": {
    "react": ">=16.8.0",
    "react-native": ">=0.60.0",
    "@apollo/client": "^3.8.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-native": "^0.72.0",
    "typescript": "^5.0.0",
    "jest": "^29.0.0"
  }
}
```
