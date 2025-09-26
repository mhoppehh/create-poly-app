# Mobile Navigation

## Overview

Native navigation patterns for mobile applications using React Navigation, providing stack, tab, drawer navigation with deep linking and gesture support.

## Priority

**HIGH** - Essential for mobile user experience

## Dependencies

- React Native application setup
- React Navigation library

## Components

### Stack Navigation

- **Screen-to-screen Navigation**: Push/pop navigation pattern
- **Header Configuration**: Custom headers with back buttons and actions
- **Animation Support**: Custom transition animations between screens
- **Navigation State Management**: History and state persistence
- **Deep Navigation**: Multi-level nested navigation stacks

### Tab Navigation

- **Bottom Tab Navigation**: iOS/Android standard tab patterns
- **Tab Bar Customization**: Custom icons, badges, and styling
- **Dynamic Tabs**: Conditional tab rendering based on user state
- **Nested Navigation**: Stack navigators within tab screens
- **Badge Support**: Notification badges on tab items

### Drawer Navigation

- **Slide-out Menu**: Side drawer navigation pattern
- **Custom Drawer Content**: Branded drawer with user profile
- **Gesture Support**: Swipe-to-open drawer functionality
- **Responsive Design**: Adaptive behavior on different screen sizes
- **Drawer Status Tracking**: Open/closed state management

### Modal Navigation

- **Full-screen Modals**: Overlay screens for forms and detail views
- **Modal Presentation Styles**: Different modal animation styles
- **Dismissal Gestures**: Swipe-to-dismiss modal support
- **Modal Stack Management**: Multiple modal layers
- **Context Preservation**: Maintain navigation context in modals

### Deep Linking

- **URL-based Navigation**: Navigate to screens via URLs
- **Custom URL Schemes**: App-specific URL patterns
- **Universal Links**: iOS/Android universal link support
- **Parameter Passing**: URL parameters to screen props
- **Navigation State Restoration**: Restore navigation from URLs

## Configuration

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

## Generated Files

```
mobile/src/navigation/
├── AppNavigator.tsx              # Main app navigator
├── AuthNavigator.tsx             # Authentication flow
├── TabNavigator.tsx              # Bottom tab navigation
├── DrawerNavigator.tsx           # Drawer navigation
├── types.ts                      # Navigation type definitions
├── linking.ts                    # Deep linking configuration
└── hooks/
    ├── useNavigation.ts          # Typed navigation hook
    └── useRoute.ts               # Typed route hook
```

## Main App Navigator

```typescript
// navigation/AppNavigator.tsx
import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { useAuth } from '@shared/hooks/useAuth'

import AuthNavigator from './AuthNavigator'
import TabNavigator from './TabNavigator'
import { BookDetailScreen } from '../screens/books/BookDetailScreen'
import { ProfileEditScreen } from '../screens/profile/ProfileEditScreen'
import { linking } from './linking'
import { RootStackParamList } from './types'

const Stack = createNativeStackNavigator<RootStackParamList>()

export const AppNavigator: React.FC = () => {
  const { user, loading } = useAuth()

  if (loading) {
    return null // or loading screen
  }

  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <>
            <Stack.Screen
              name="Main"
              component={TabNavigator}
            />
            <Stack.Screen
              name="BookDetail"
              component={BookDetailScreen}
              options={{
                headerShown: true,
                headerTitle: 'Book Details',
                presentation: 'modal',
              }}
            />
            <Stack.Screen
              name="ProfileEdit"
              component={ProfileEditScreen}
              options={{
                headerShown: true,
                headerTitle: 'Edit Profile',
                presentation: 'modal',
              }}
            />
          </>
        ) : (
          <Stack.Screen
            name="Auth"
            component={AuthNavigator}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}
```

## Tab Navigator

```typescript
// navigation/TabNavigator.tsx
import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Ionicons } from '@expo/vector-icons'

import { BooksListScreen } from '../screens/books/BooksListScreen'
import { FavoritesScreen } from '../screens/favorites/FavoritesScreen'
import { SearchScreen } from '../screens/search/SearchScreen'
import { ProfileScreen } from '../screens/profile/ProfileScreen'
import { TabParamList } from './types'

const Tab = createBottomTabNavigator<TabParamList>()

export const TabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap

          switch (route.name) {
            case 'Books':
              iconName = focused ? 'library' : 'library-outline'
              break
            case 'Favorites':
              iconName = focused ? 'heart' : 'heart-outline'
              break
            case 'Search':
              iconName = focused ? 'search' : 'search-outline'
              break
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline'
              break
            default:
              iconName = 'ellipse'
          }

          return <Ionicons name={iconName} size={size} color={color} />
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
        headerShown: true,
      })}
    >
      <Tab.Screen
        name="Books"
        component={BooksListScreen}
        options={{
          headerTitle: 'My Library',
          tabBarLabel: 'Books',
        }}
      />
      <Tab.Screen
        name="Favorites"
        component={FavoritesScreen}
        options={{
          headerTitle: 'Favorites',
          tabBarLabel: 'Favorites',
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{
          headerTitle: 'Search Books',
          tabBarLabel: 'Search',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          headerTitle: 'Profile',
          tabBarLabel: 'Profile',
        }}
      />
    </Tab.Navigator>
  )
}

export default TabNavigator
```

## Authentication Navigator

```typescript
// navigation/AuthNavigator.tsx
import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'

import { WelcomeScreen } from '../screens/auth/WelcomeScreen'
import { LoginScreen } from '../screens/auth/LoginScreen'
import { RegisterScreen } from '../screens/auth/RegisterScreen'
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen'
import { AuthStackParamList } from './types'

const Stack = createNativeStackNavigator<AuthStackParamList>()

export const AuthNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="Welcome"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="Welcome"
        component={WelcomeScreen}
      />
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{
          headerShown: true,
          headerTitle: 'Sign In',
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen
        name="Register"
        component={RegisterScreen}
        options={{
          headerShown: true,
          headerTitle: 'Create Account',
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen
        name="ForgotPassword"
        component={ForgotPasswordScreen}
        options={{
          headerShown: true,
          headerTitle: 'Reset Password',
          headerBackTitle: 'Back',
        }}
      />
    </Stack.Navigator>
  )
}

export default AuthNavigator
```

## Navigation Types

```typescript
// navigation/types.ts
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs'
import type { CompositeScreenProps } from '@react-navigation/native'

// Root Stack Navigator Types
export type RootStackParamList = {
  Auth: undefined
  Main: undefined
  BookDetail: { bookId: string }
  ProfileEdit: undefined
}

// Tab Navigator Types
export type TabParamList = {
  Books: undefined
  Favorites: undefined
  Search: undefined
  Profile: undefined
}

// Auth Stack Navigator Types
export type AuthStackParamList = {
  Welcome: undefined
  Login: undefined
  Register: undefined
  ForgotPassword: undefined
}

// Screen Props Types
export type RootStackScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<RootStackParamList, T>

export type TabScreenProps<T extends keyof TabParamList> = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, T>,
  RootStackScreenProps<keyof RootStackParamList>
>

export type AuthStackScreenProps<T extends keyof AuthStackParamList> = NativeStackScreenProps<AuthStackParamList, T>

// Navigation Props
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
```

## Deep Linking Configuration

```typescript
// navigation/linking.ts
import { LinkingOptions } from '@react-navigation/native'
import { RootStackParamList } from './types'

const config = {
  screens: {
    Auth: {
      screens: {
        Welcome: 'welcome',
        Login: 'login',
        Register: 'register',
        ForgotPassword: 'forgot-password',
      },
    },
    Main: {
      screens: {
        Books: {
          screens: {
            Books: 'books',
          },
        },
        Favorites: 'favorites',
        Search: 'search',
        Profile: 'profile',
      },
    },
    BookDetail: 'book/:bookId',
    ProfileEdit: 'profile/edit',
  },
}

export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['yourapp://', 'https://yourapp.com'],
  config,
  async getInitialURL() {
    // Custom logic for handling initial URL
    return null
  },
}
```

## Custom Navigation Hooks

```typescript
// navigation/hooks/useNavigation.ts
import { useNavigation as useRNNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../types'

export function useNavigation() {
  return useRNNavigation<NativeStackNavigationProp<RootStackParamList>>()
}
```

```typescript
// navigation/hooks/useRoute.ts
import { useRoute as useRNRoute, RouteProp } from '@react-navigation/native'
import type { RootStackParamList } from '../types'

export function useRoute<T extends keyof RootStackParamList>() {
  return useRNRoute<RouteProp<RootStackParamList, T>>()
}
```

## Drawer Navigator (Optional)

```typescript
// navigation/DrawerNavigator.tsx
import React from 'react'
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerItemList,
  DrawerItem,
} from '@react-navigation/drawer'
import { View, Text, Image, StyleSheet } from 'react-native'
import { useAuth } from '@shared/hooks/useAuth'

import TabNavigator from './TabNavigator'
import { SettingsScreen } from '../screens/settings/SettingsScreen'
import { AboutScreen } from '../screens/about/AboutScreen'

const Drawer = createDrawerNavigator()

function CustomDrawerContent(props: any) {
  const { user, logout } = useAuth()

  return (
    <DrawerContentScrollView {...props}>
      {/* User Profile Section */}
      <View style={styles.userSection}>
        <Image
          source={{ uri: user?.avatar || 'https://via.placeholder.com/50' }}
          style={styles.avatar}
        />
        <Text style={styles.userName}>{user?.name}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
      </View>

      {/* Default drawer items */}
      <DrawerItemList {...props} />

      {/* Custom drawer items */}
      <DrawerItem
        label="Logout"
        onPress={logout}
        icon={({ color, size }) => (
          <Ionicons name="log-out-outline" color={color} size={size} />
        )}
      />
    </DrawerContentScrollView>
  )
}

export const DrawerNavigator: React.FC = () => {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerActiveTintColor: '#007AFF',
        drawerInactiveTintColor: '#666',
      }}
    >
      <Drawer.Screen
        name="Home"
        component={TabNavigator}
        options={{
          drawerLabel: 'Home',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="home-outline" color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          drawerLabel: 'Settings',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen
        name="About"
        component={AboutScreen}
        options={{
          drawerLabel: 'About',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="information-outline" color={color} size={size} />
          ),
        }}
      />
    </Drawer.Navigator>
  )
}

const styles = StyleSheet.create({
  userSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    marginBottom: 10,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginBottom: 10,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
  },
})
```

## Screen Component Example

```typescript
// screens/books/BooksListScreen.tsx
import React from 'react'
import { View, FlatList, StyleSheet } from 'react-native'
import { useQuery } from '@apollo/client'
import { useNavigation } from '../../navigation/hooks/useNavigation'
import { BOOKS_QUERY } from '@shared/graphql/books'
import { BookCard } from '../../components/BookCard'
import { LoadingSpinner } from '../../components/LoadingSpinner'
import { ErrorMessage } from '../../components/ErrorMessage'

export const BooksListScreen: React.FC = () => {
  const navigation = useNavigation()
  const { data, loading, error } = useQuery(BOOKS_QUERY)

  const handleBookPress = (bookId: string) => {
    navigation.navigate('BookDetail', { bookId })
  }

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error.message} />

  return (
    <View style={styles.container}>
      <FlatList
        data={data?.books}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <BookCard
            book={item}
            onPress={() => handleBookPress(item.id)}
          />
        )}
        contentContainerStyle={styles.list}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  list: {
    padding: 16,
  },
})
```

## Navigation Gesture Configuration

```typescript
// navigation/gestures.ts
import { Gesture } from 'react-native-gesture-handler'

export const createBackGesture = (navigation: any) => {
  return Gesture.Pan()
    .activeOffsetX([-20, 20])
    .onEnd(event => {
      if (event.velocityX > 500 && event.translationX > 50) {
        navigation.goBack()
      }
    })
}

export const createDrawerGesture = (navigation: any) => {
  return Gesture.Pan()
    .activeOffsetX(10)
    .onEnd(event => {
      if (event.velocityX > 500 && event.translationX > 100) {
        navigation.openDrawer()
      }
    })
}
```
