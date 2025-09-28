# Mobile App Support

## Overview

React Native mobile application development with shared components, navigation, and cross-platform capabilities integrated with the existing GraphQL backend.

## Priority

**MEDIUM** - Expands platform coverage and provides native mobile experience

## Dependencies

- `apollo-server` (for shared GraphQL API)
- `graphql-client` (for shared GraphQL operations)

## Feature Components

### 1. React Native Application Setup

**Description**: Native mobile application using React Native with TypeScript

#### Components:

- **Expo Integration**: Managed React Native development workflow
- **Bare React Native**: Traditional React Native CLI setup
- **Metro Configuration**: Optimized bundler setup
- **Platform-specific Code**: iOS and Android specific implementations
- **Native Modules**: Access to device capabilities

#### Configuration:

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

### 2. Shared Component Library

**Description**: Cross-platform component library shared between web and mobile

#### Components:

- **UI Components**: Buttons, inputs, cards, modals
- **Business Logic**: Shared hooks and utilities
- **GraphQL Operations**: Shared queries and mutations
- **Type Definitions**: Shared TypeScript types
- **Theme System**: Consistent design system

#### Configuration:

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

### 3. Mobile Navigation

**Description**: Native navigation patterns for mobile applications

#### Components:

- **Stack Navigation**: Screen-to-screen navigation
- **Tab Navigation**: Bottom tab navigation
- **Drawer Navigation**: Slide-out menu navigation
- **Modal Navigation**: Full-screen modals
- **Deep Linking**: URL-based navigation

#### Configuration:

```typescript
interface NavigationConfig {
  library: 'react-navigation' | 'expo-router'
  patterns: {
    stack: boolean
    tabs: boolean
    drawer: boolean
    modal: boolean
  }
  features: {
    deepLinking: boolean
    gestures: boolean
    animations: boolean
  }
}
```

### 4. Native Device Features

**Description**: Integration with native device capabilities

#### Components:

- **Camera**: Photo and video capture
- **Location**: GPS and location services
- **Push Notifications**: Local and remote notifications
- **Biometrics**: Fingerprint and face recognition
- **File System**: Local file storage and access
- **Contacts**: Access device contacts
- **Calendar**: Calendar integration

#### Configuration:

```typescript
interface DeviceFeaturesConfig {
  camera: {
    enabled: boolean
    features: ('photo' | 'video' | 'barcode')[]
  }
  location: {
    enabled: boolean
    precision: 'coarse' | 'fine'
    background: boolean
  }
  notifications: {
    local: boolean
    remote: boolean
    provider: 'expo' | 'firebase'
  }
  biometrics: boolean
  fileSystem: boolean
}
```

### 5. State Management & Offline Support

**Description**: Mobile-optimized state management with offline capabilities

#### Components:

- **Offline-First Architecture**: Local-first data approach
- **Data Synchronization**: Sync with backend when online
- **Cache Management**: Intelligent caching strategies
- **Background Sync**: Update data in background
- **Conflict Resolution**: Handle data conflicts

#### Configuration:

```typescript
interface OfflineConfig {
  strategy: 'offline-first' | 'cache-first' | 'network-first'
  storage: 'asyncstorage' | 'sqlite' | 'realm'
  sync: {
    automatic: boolean
    interval: number
    onlyOnWifi: boolean
  }
}
```

## Generated Files

### Mobile Application Structure

```
mobile/
├── App.tsx                        # App entry point
├── app.json                       # Expo configuration
├── metro.config.js                # Metro bundler config
├── babel.config.js                # Babel configuration
├── tsconfig.json                  # TypeScript config
├── src/
│   ├── components/                # Mobile-specific components
│   │   ├── ui/                    # UI components
│   │   ├── forms/                 # Form components
│   │   └── navigation/            # Navigation components
│   ├── screens/                   # App screens
│   │   ├── auth/
│   │   │   ├── LoginScreen.tsx
│   │   │   └── RegisterScreen.tsx
│   │   ├── books/
│   │   │   ├── BooksListScreen.tsx
│   │   │   └── BookDetailScreen.tsx
│   │   └── profile/
│   │       └── ProfileScreen.tsx
│   ├── navigation/                # Navigation configuration
│   │   ├── AppNavigator.tsx       # Main navigator
│   │   ├── AuthNavigator.tsx      # Auth flow navigator
│   │   └── TabNavigator.tsx       # Tab navigation
│   ├── services/                  # Mobile services
│   │   ├── api/                   # GraphQL client
│   │   ├── auth/                  # Authentication
│   │   ├── storage/               # Local storage
│   │   └── sync/                  # Data synchronization
│   ├── hooks/                     # Mobile-specific hooks
│   │   ├── useCamera.ts
│   │   ├── useLocation.ts
│   │   └── useOfflineSync.ts
│   ├── utils/                     # Utility functions
│   │   ├── platform.ts            # Platform detection
│   │   ├── permissions.ts         # Permission handling
│   │   └── notifications.ts       # Notification helpers
│   └── types/                     # Mobile-specific types
│       └── navigation.ts          # Navigation types
└── assets/                        # Static assets
    ├── images/
    ├── icons/
    └── fonts/
```

### Shared Package Structure

```
shared/
├── package.json                   # Shared package config
├── src/
│   ├── components/                # Cross-platform components
│   │   ├── Button/
│   │   │   ├── Button.tsx         # Shared button logic
│   │   │   ├── Button.web.tsx     # Web-specific implementation
│   │   │   └── Button.native.tsx  # Native-specific implementation
│   │   ├── Input/
│   │   └── Card/
│   ├── hooks/                     # Shared hooks
│   │   ├── useAuth.ts
│   │   ├── useBooks.ts
│   │   └── useForm.ts
│   ├── utils/                     # Shared utilities
│   │   ├── validation.ts
│   │   └── formatting.ts
│   ├── graphql/                   # Shared GraphQL operations
│   │   ├── queries/
│   │   ├── mutations/
│   │   └── subscriptions/
│   ├── types/                     # Shared TypeScript types
│   │   ├── api.ts
│   │   ├── user.ts
│   │   └── book.ts
│   └── theme/                     # Shared theme system
│       ├── colors.ts
│       ├── typography.ts
│       └── spacing.ts
└── build/                         # Built shared package
```

## Configuration Files

### Expo Configuration

```json
{
  "expo": {
    "name": "Your App",
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
      "bundleIdentifier": "com.yourcompany.yourapp"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#FFFFFF"
      },
      "package": "com.yourcompany.yourapp"
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "plugins": [
      "expo-camera",
      "expo-location",
      "expo-notifications",
      [
        "expo-local-authentication",
        {
          "faceIDPermission": "Allow app to use Face ID for authentication"
        }
      ]
    ]
  }
}
```

### Metro Configuration

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

module.exports = config
```

### Navigation Setup

```typescript
// navigation/AppNavigator.tsx
import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { useAuth } from '@shared/hooks/useAuth'

import AuthNavigator from './AuthNavigator'
import BooksListScreen from '../screens/books/BooksListScreen'
import BookDetailScreen from '../screens/books/BookDetailScreen'
import ProfileScreen from '../screens/profile/ProfileScreen'

const Stack = createNativeStackNavigator()
const Tab = createBottomTabNavigator()

const MainTabNavigator = () => (
  <Tab.Navigator>
    <Tab.Screen
      name="Books"
      component={BooksListScreen}
      options={{
        tabBarIcon: ({ focused, color, size }) => (
          <Icon name="book" size={size} color={color} />
        )
      }}
    />
    <Tab.Screen
      name="Profile"
      component={ProfileScreen}
      options={{
        tabBarIcon: ({ focused, color, size }) => (
          <Icon name="user" size={size} color={color} />
        )
      }}
    />
  </Tab.Navigator>
)

export const AppNavigator = () => {
  const { isAuthenticated } = useAuth()

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {isAuthenticated ? (
          <>
            <Stack.Screen
              name="Main"
              component={MainTabNavigator}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="BookDetail"
              component={BookDetailScreen}
              options={{ title: 'Book Details' }}
            />
          </>
        ) : (
          <Stack.Screen
            name="Auth"
            component={AuthNavigator}
            options={{ headerShown: false }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}
```

### Cross-Platform Component Example

```typescript
// shared/components/Button/Button.tsx
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

export default Button
export type { ButtonProps }
```

```typescript
// shared/components/Button/Button.native.tsx
import React from 'react'
import { TouchableOpacity, Text, StyleSheet } from 'react-native'
import { ButtonProps } from './types'

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  disabled = false
}) => (
  <TouchableOpacity
    style={[
      styles.button,
      styles[variant],
      disabled && styles.disabled
    ]}
    onPress={onPress}
    disabled={disabled}
  >
    <Text style={[styles.text, styles[`${variant}Text`]]}>
      {title}
    </Text>
  </TouchableOpacity>
)

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: '#007AFF',
  },
  secondary: {
    backgroundColor: '#F2F2F7',
    borderWidth: 1,
    borderColor: '#D1D1D6',
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
  primaryText: {
    color: '#FFFFFF',
  },
  secondaryText: {
    color: '#007AFF',
  },
  disabled: {
    opacity: 0.5,
  },
})

export default Button
```

### GraphQL Client Setup for Mobile

```typescript
// mobile/src/services/api/client.ts
import { ApolloClient, InMemoryCache, from } from '@apollo/client'
import { createHttpLink } from '@apollo/client/link/http'
import { setContext } from '@apollo/client/link/context'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { persistCache } from 'apollo3-cache-persist'

const httpLink = createHttpLink({
  uri: 'http://localhost:4000/graphql', // Use your actual API URL
})

const authLink = setContext(async (_, { headers }) => {
  const token = await AsyncStorage.getItem('authToken')

  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  }
})

const cache = new InMemoryCache()

// Persist cache to AsyncStorage
export const initializeApollo = async () => {
  await persistCache({
    cache,
    storage: AsyncStorage,
  })

  return new ApolloClient({
    link: from([authLink, httpLink]),
    cache,
    defaultOptions: {
      watchQuery: {
        errorPolicy: 'ignore',
      },
      query: {
        errorPolicy: 'all',
      },
    },
  })
}
```

### Device Features Integration

```typescript
// mobile/src/hooks/useCamera.ts
import { useState } from 'react'
import { Camera } from 'expo-camera'
import * as ImagePicker from 'expo-image-picker'

export const useCamera = () => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)

  const requestPermission = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync()
    setHasPermission(status === 'granted')
    return status === 'granted'
  }

  const takePicture = async () => {
    const hasPermission = await requestPermission()
    if (!hasPermission) return null

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    })

    if (!result.canceled) {
      return result.assets[0]
    }
    return null
  }

  const selectImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    })

    if (!result.canceled) {
      return result.assets[0]
    }
    return null
  }

  return {
    hasPermission,
    requestPermission,
    takePicture,
    selectImage,
  }
}
```

## Package Dependencies

### Mobile App Dependencies

```json
{
  "dependencies": {
    "expo": "~49.0.0",
    "@expo/vector-icons": "^13.0.0",
    "react": "18.2.0",
    "react-native": "0.72.6",
    "@react-navigation/native": "^6.0.2",
    "@react-navigation/native-stack": "^6.0.2",
    "@react-navigation/bottom-tabs": "^6.0.5",
    "@apollo/client": "^3.8.0",
    "react-native-async-storage": "1.17.11",
    "apollo3-cache-persist": "^0.14.1",
    "expo-camera": "~13.4.4",
    "expo-image-picker": "~14.3.2",
    "expo-location": "~16.1.0",
    "expo-notifications": "~0.20.1",
    "expo-local-authentication": "~13.4.1"
  },
  "devDependencies": {
    "@babel/core": "^7.20.0",
    "@types/react": "~18.2.14",
    "@types/react-native": "~0.72.2",
    "typescript": "^5.1.3"
  }
}
```

### Shared Package Dependencies

```json
{
  "name": "@yourapp/shared",
  "version": "1.0.0",
  "main": "build/index.js",
  "types": "build/index.d.ts",
  "dependencies": {
    "react": "^18.2.0",
    "graphql": "^16.8.0",
    "@apollo/client": "^3.8.0"
  },
  "peerDependencies": {
    "react-native": ">=0.72.0"
  }
}
```

## Installation Scripts

1. **Initialize React Native/Expo application**
2. **Setup shared component library**
3. **Configure cross-platform navigation**
4. **Setup GraphQL client with offline support**
5. **Configure native device features**
6. **Setup build and deployment configuration**
7. **Generate platform-specific assets**
8. **Configure development and build scripts**

## Build and Deployment

### EAS Build Configuration (Expo)

```json
{
  "cli": {
    "version": ">= 5.4.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "resourceClass": "m1-medium"
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

### Build Scripts

```json
{
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web",
    "build:android": "eas build --platform android",
    "build:ios": "eas build --platform ios",
    "submit:android": "eas submit --platform android",
    "submit:ios": "eas submit --platform ios"
  }
}
```

This mobile app feature provides a comprehensive React Native setup that shares code and functionality with the web application while providing native mobile capabilities and user experience.
