# React Native Application Setup

## Overview

Native mobile application setup using React Native with TypeScript, providing the foundation for cross-platform mobile development integrated with the existing GraphQL backend.

## Priority

**MEDIUM** - Core foundation for mobile app development

## Dependencies

- `apollo-server` (for shared GraphQL API)
- `graphql-client` (for shared GraphQL operations)
- Node.js development environment

## Components

### Expo Integration

- **Managed Workflow**: Simplified React Native development with Expo CLI
- **Expo Application Services (EAS)**: Cloud-based build and deployment
- **Over-the-Air Updates**: Instant app updates without app store approval
- **Development Tools**: Expo DevTools and debugging capabilities
- **Native Module Access**: Easy integration with device features

### Bare React Native

- **Traditional CLI Setup**: Full control over native code and dependencies
- **Custom Native Modules**: Direct access to iOS and Android native APIs
- **Advanced Configuration**: Fine-tuned build and deployment settings
- **Third-party Integration**: Seamless integration with native libraries
- **Performance Optimization**: Direct native code optimization

### Metro Configuration

- **Bundle Optimization**: Efficient JavaScript bundling for mobile
- **Monorepo Support**: Shared package integration across workspace
- **Custom Transformers**: Asset and code transformation pipeline
- **Development Speed**: Fast refresh and hot reloading
- **Production Builds**: Optimized production bundle generation

### Platform-specific Code

- **iOS Implementation**: iOS-specific features and UI components
- **Android Implementation**: Android-specific features and UI components
- **Platform Detection**: Automatic platform-specific code execution
- **Native Module Bridging**: Communication between JavaScript and native code
- **Performance Optimization**: Platform-specific performance improvements

### Native Modules

- **Device Capabilities**: Access to camera, location, sensors
- **System Integration**: File system, contacts, calendar access
- **Third-party Services**: Payment, analytics, crash reporting
- **Custom Native Code**: Custom iOS/Android native functionality
- **Bridge Communication**: Efficient JavaScript to native communication

## Configuration

```typescript
interface MobileConfig {
  framework: 'expo' | 'react-native-cli'
  platforms: ('ios' | 'android')[]
  features: {
    navigation: boolean
    pushNotifications: boolean
    camera: boolean
    location: boolean
    biometrics: boolean
  }
  buildTools: {
    eas: boolean // Expo Application Services
    fastlane: boolean // iOS/Android deployment automation
  }
}
```

## Generated Files

```
mobile/
├── App.tsx                        # App entry point
├── app.json                       # Expo configuration
├── metro.config.js                # Metro bundler config
├── babel.config.js                # Babel configuration
├── tsconfig.json                  # TypeScript config
├── package.json                   # Dependencies and scripts
├── src/
│   ├── components/                # Mobile-specific components
│   │   ├── ui/                    # UI components
│   │   └── forms/                 # Form components
│   ├── screens/                   # App screens
│   │   ├── auth/
│   │   │   ├── LoginScreen.tsx
│   │   │   └── RegisterScreen.tsx
│   │   ├── books/
│   │   │   ├── BooksListScreen.tsx
│   │   │   └── BookDetailScreen.tsx
│   │   └── profile/
│   │       └── ProfileScreen.tsx
│   ├── navigation/                # Navigation setup
│   ├── services/                  # Mobile services
│   ├── hooks/                     # Mobile-specific hooks
│   ├── utils/                     # Utility functions
│   └── types/                     # Mobile-specific types
├── assets/                        # Static assets
│   ├── images/
│   ├── icons/
│   └── fonts/
└── android/                       # Android native code
    └── ios/                       # iOS native code
```

## Expo Configuration

```json
{
  "expo": {
    "name": "YourApp",
    "slug": "your-app",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "assetBundlePatterns": ["**/*"],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.yourcompany.yourapp",
      "buildNumber": "1",
      "infoPlist": {
        "CFBundleAllowMixedLocalizations": true
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#FFFFFF"
      },
      "package": "com.yourcompany.yourapp",
      "versionCode": 1
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "plugins": [
      "expo-camera",
      "expo-location",
      "expo-notifications",
      [
        "expo-build-properties",
        {
          "ios": {
            "useFrameworks": "static"
          }
        }
      ]
    ],
    "extra": {
      "eas": {
        "projectId": "your-project-id"
      }
    }
  }
}
```

## Metro Configuration

```javascript
// metro.config.js
const { getDefaultConfig } = require('@expo/metro-config')
const path = require('path')

const config = getDefaultConfig(__dirname)

// Add monorepo support
const projectRoot = __dirname
const workspaceRoot = path.resolve(projectRoot, '..')

config.watchFolders = [workspaceRoot]
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
]

// Support for shared packages
config.resolver.disableHierarchicalLookup = false

// Add support for additional file extensions
config.resolver.assetExts.push('db', 'mp3', 'ttf', 'obj', 'png', 'jpg')

module.exports = config
```

## Main App Component

```typescript
// App.tsx
import React from 'react'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { ApolloProvider } from '@apollo/client'
import { NavigationContainer } from '@react-navigation/native'

import { createApolloClient } from './src/services/apollo'
import { AppNavigator } from './src/navigation/AppNavigator'
import { AuthProvider } from './src/providers/AuthProvider'
import { ThemeProvider } from './src/providers/ThemeProvider'

const apolloClient = createApolloClient()

export default function App() {
  return (
    <ApolloProvider client={apolloClient}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <NavigationContainer>
              <AppNavigator />
              <StatusBar style="auto" />
            </NavigationContainer>
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </ApolloProvider>
  )
}
```

## Apollo Client Setup

```typescript
// src/services/apollo.ts
import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client'
import { setContext } from '@apollo/client/link/context'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { persistCache, AsyncStorageWrapper } from 'apollo3-cache-persist'

const httpLink = createHttpLink({
  uri: __DEV__ ? 'http://localhost:4000/graphql' : 'https://your-api.railway.app/graphql',
})

const authLink = setContext(async (_, { headers }) => {
  const token = await AsyncStorage.getItem('auth_token')

  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  }
})

export async function createApolloClient() {
  const cache = new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          books: {
            merge(existing, incoming) {
              return incoming
            },
          },
        },
      },
    },
  })

  // Persist cache for offline support
  await persistCache({
    cache,
    storage: new AsyncStorageWrapper(AsyncStorage),
    maxSize: 1048576, // 1 MB
  })

  return new ApolloClient({
    link: authLink.concat(httpLink),
    cache,
    defaultOptions: {
      watchQuery: {
        errorPolicy: 'all',
      },
      query: {
        errorPolicy: 'all',
      },
    },
  })
}
```

## Development Scripts

```json
{
  "name": "mobile",
  "version": "1.0.0",
  "main": "node_modules/expo/AppEntry.js",
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web",
    "build:android": "eas build --platform android",
    "build:ios": "eas build --platform ios",
    "build:all": "eas build --platform all",
    "submit:android": "eas submit --platform android",
    "submit:ios": "eas submit --platform ios",
    "update": "eas update",
    "test": "jest --watchAll=false",
    "test:watch": "jest --watchAll",
    "type-check": "tsc --noEmit",
    "lint": "eslint . --ext .ts,.tsx,.js,.jsx",
    "lint:fix": "eslint . --ext .ts,.tsx,.js,.jsx --fix"
  },
  "dependencies": {
    "@apollo/client": "^3.8.0",
    "@react-navigation/native": "^6.1.0",
    "@react-navigation/native-stack": "^6.9.0",
    "@react-navigation/bottom-tabs": "^6.5.0",
    "expo": "~49.0.0",
    "expo-status-bar": "~1.6.0",
    "react": "18.2.0",
    "react-native": "0.72.0",
    "react-native-safe-area-context": "4.6.3",
    "react-native-screens": "~3.22.0",
    "@react-native-async-storage/async-storage": "1.18.2",
    "apollo3-cache-persist": "^0.14.0"
  },
  "devDependencies": {
    "@babel/core": "^7.20.0",
    "@types/react": "~18.2.0",
    "@types/react-native": "~0.72.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "eslint": "^8.0.0",
    "eslint-plugin-react": "^7.33.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "jest": "^29.0.0",
    "typescript": "^5.0.0"
  }
}
```

## TypeScript Configuration

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@shared/*": ["../shared/src/*"]
    },
    "types": ["jest"]
  },
  "include": ["**/*.ts", "**/*.tsx", ".expo/types/**/*.ts", "expo-env.d.ts"]
}
```

## EAS Build Configuration

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "resourceClass": "m1-medium"
      }
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "production": {
      "ios": {
        "resourceClass": "m1-medium"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

## Platform Detection Utility

```typescript
// src/utils/platform.ts
import { Platform } from 'react-native'

export const isIOS = Platform.OS === 'ios'
export const isAndroid = Platform.OS === 'android'
export const isWeb = Platform.OS === 'web'

export function platformSelect<T>(options: { ios?: T; android?: T; web?: T; default?: T }): T {
  return Platform.select({
    ios: options.ios ?? options.default,
    android: options.android ?? options.default,
    web: options.web ?? options.default,
    default: options.default,
  }) as T
}

export function getPlatformVersion(): string {
  if (isIOS) {
    return Platform.Version as string
  } else if (isAndroid) {
    return Platform.Version.toString()
  }
  return 'unknown'
}

export function isTablet(): boolean {
  // Simple tablet detection - can be enhanced with device-specific logic
  const { width, height } = require('react-native').Dimensions.get('window')
  const aspectRatio = width / height
  return Math.min(width, height) > 600 && (aspectRatio > 1.2 || aspectRatio < 0.9)
}
```

## Error Boundary for React Native

```typescript
// src/components/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    // Here you would typically send the error to a logging service
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <View style={styles.container}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>
            {__DEV__ ? this.state.error?.message : 'Please try again'}
          </Text>
          <TouchableOpacity style={styles.button} onPress={this.handleRetry}>
            <Text style={styles.buttonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )
    }

    return this.props.children
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
})
```
