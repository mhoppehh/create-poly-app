# State Management

## Overview

Powerful client-side state management solutions with persistence, DevTools integration, and type safety for complex React applications.

## Priority

**HIGH** - Essential for managing application state in complex UIs

## Dependencies

- `vite` (React application base)
- `tailwind` (for UI components)

## Feature Description

Comprehensive state management infrastructure supporting multiple libraries, persistence strategies, DevTools integration, and type-safe state access patterns for scalable React applications.

### Key Features

- **Multiple Libraries**: Zustand, Redux Toolkit, Jotai, Valtio support
- **Persistence Layer**: localStorage, sessionStorage, IndexedDB integration
- **DevTools Integration**: Time-travel debugging and state inspection
- **Type Safety**: Full TypeScript support with type inference
- **Async Actions**: Promise-based and async state updates
- **Middleware Support**: Logging, persistence, and custom middleware
- **Performance Optimization**: Selective subscriptions and memoization

## Configuration

```typescript
interface StateManagementConfig {
  library: 'zustand' | 'redux-toolkit' | 'jotai' | 'valtio'
  persistence: {
    enabled: boolean
    storage: 'localStorage' | 'sessionStorage' | 'indexedDB'
    whitelist: string[] // Which stores to persist
    encryption: boolean
  }
  devtools: {
    enabled: boolean
    name: string
    trace: boolean
  }
  middleware: {
    logger: boolean
    immer: boolean
    subscribeWithSelector: boolean
  }
  performance: {
    equalityFn: 'shallow' | 'deep' | 'custom'
    suspense: boolean
  }
}
```

## Generated Files

### Zustand Implementation

```
web/src/
├── store/
│   ├── index.ts                  # Store exports and configuration
│   ├── slices/
│   │   ├── authSlice.ts          # Authentication state
│   │   ├── uiSlice.ts            # UI state management
│   │   ├── booksSlice.ts         # Books data state
│   │   ├── userSlice.ts          # User profile state
│   │   └── notificationsSlice.ts # Notifications state
│   ├── middleware/
│   │   ├── persistenceMiddleware.ts # State persistence
│   │   ├── loggerMiddleware.ts   # State logging
│   │   └── devtoolsMiddleware.ts # DevTools integration
│   ├── hooks/
│   │   ├── useAuthStore.ts       # Auth store hook
│   │   ├── useUiStore.ts         # UI store hook
│   │   ├── useBooksStore.ts      # Books store hook
│   │   └── useStoreActions.ts    # Action hooks
│   ├── selectors/
│   │   ├── authSelectors.ts      # Auth state selectors
│   │   ├── uiSelectors.ts        # UI state selectors
│   │   └── booksSelectors.ts     # Books state selectors
│   ├── utils/
│   │   ├── storeUtils.ts         # Store utilities
│   │   ├── persistence.ts        # Persistence utilities
│   │   └── typeUtils.ts          # Type utilities
│   └── types.ts                  # Store type definitions
```

### Redux Toolkit Implementation

```
web/src/
├── store/
│   ├── index.ts                  # Store configuration
│   ├── slices/
│   │   ├── authSlice.ts          # Auth slice with RTK
│   │   ├── booksSlice.ts         # Books slice with async thunks
│   │   ├── uiSlice.ts            # UI slice
│   │   └── apiSlice.ts           # RTK Query API slice
│   ├── middleware/
│   │   ├── persistenceMiddleware.ts # Redux Persist
│   │   └── loggerMiddleware.ts   # Redux Logger
│   ├── hooks/
│   │   ├── reduxHooks.ts         # Typed Redux hooks
│   │   └── apiHooks.ts           # RTK Query hooks
│   └── types.ts                  # Redux type definitions
```

## Code Examples

### Zustand Store Implementation

```typescript
// web/src/store/slices/authSlice.ts
import { StateCreator } from 'zustand'
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

export interface User {
  id: string
  email: string
  username: string
  avatar?: string
}

export interface AuthSlice {
  // State
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null

  // Actions
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => void
  register: (data: RegisterData) => Promise<void>
  updateProfile: (data: Partial<User>) => Promise<void>
  clearError: () => void
  refreshToken: () => Promise<void>
}

export const createAuthSlice: StateCreator<
  AuthSlice,
  [['zustand/immer', never], ['zustand/devtools', never]],
  [],
  AuthSlice
> = (set, get) => ({
  // Initial state
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  // Actions
  login: async credentials => {
    set(
      state => {
        state.isLoading = true
        state.error = null
      },
      false,
      'auth/login/start',
    )

    try {
      const response = await authApi.login(credentials)

      set(
        state => {
          state.user = response.user
          state.token = response.token
          state.isAuthenticated = true
          state.isLoading = false
        },
        false,
        'auth/login/success',
      )

      // Store token for API requests
      setAuthToken(response.token)
    } catch (error) {
      set(
        state => {
          state.error = error.message
          state.isLoading = false
          state.isAuthenticated = false
        },
        false,
        'auth/login/error',
      )

      throw error
    }
  },

  logout: () => {
    set(
      state => {
        state.user = null
        state.token = null
        state.isAuthenticated = false
        state.error = null
      },
      false,
      'auth/logout',
    )

    // Clear API token
    clearAuthToken()

    // Clear persisted state
    localStorage.removeItem('auth-storage')
  },

  register: async data => {
    set(
      state => {
        state.isLoading = true
        state.error = null
      },
      false,
      'auth/register/start',
    )

    try {
      const response = await authApi.register(data)

      set(
        state => {
          state.user = response.user
          state.token = response.token
          state.isAuthenticated = true
          state.isLoading = false
        },
        false,
        'auth/register/success',
      )

      setAuthToken(response.token)
    } catch (error) {
      set(
        state => {
          state.error = error.message
          state.isLoading = false
        },
        false,
        'auth/register/error',
      )

      throw error
    }
  },

  updateProfile: async data => {
    if (!get().user) throw new Error('User not authenticated')

    set(
      state => {
        state.isLoading = true
        state.error = null
      },
      false,
      'auth/updateProfile/start',
    )

    try {
      const updatedUser = await authApi.updateProfile(data)

      set(
        state => {
          state.user = { ...state.user!, ...updatedUser }
          state.isLoading = false
        },
        false,
        'auth/updateProfile/success',
      )
    } catch (error) {
      set(
        state => {
          state.error = error.message
          state.isLoading = false
        },
        false,
        'auth/updateProfile/error',
      )

      throw error
    }
  },

  clearError: () => {
    set(
      state => {
        state.error = null
      },
      false,
      'auth/clearError',
    )
  },

  refreshToken: async () => {
    const currentToken = get().token
    if (!currentToken) throw new Error('No token to refresh')

    try {
      const response = await authApi.refreshToken(currentToken)

      set(
        state => {
          state.token = response.token
        },
        false,
        'auth/refreshToken/success',
      )

      setAuthToken(response.token)
    } catch (error) {
      // Token refresh failed, logout user
      get().logout()
      throw error
    }
  },
})

interface LoginCredentials {
  email: string
  password: string
}

interface RegisterData {
  email: string
  username: string
  password: string
}
```

### Main Store Configuration

```typescript
// web/src/store/index.ts
import { create } from 'zustand'
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { createAuthSlice, AuthSlice } from './slices/authSlice'
import { createUiSlice, UiSlice } from './slices/uiSlice'
import { createBooksSlice, BooksSlice } from './slices/booksSlice'

export type StoreState = AuthSlice & UiSlice & BooksSlice

export const useStore = create<StoreState>()(
  devtools(
    subscribeWithSelector(
      immer(
        persist(
          (...a) => ({
            ...createAuthSlice(...a),
            ...createUiSlice(...a),
            ...createBooksSlice(...a),
          }),
          {
            name: 'app-storage',
            partialize: state => ({
              // Only persist specific parts of the state
              user: state.user,
              token: state.token,
              isAuthenticated: state.isAuthenticated,
              theme: state.theme,
              language: state.language,
            }),
            storage: createJSONStorage(() => localStorage),
          },
        ),
      ),
    ),
    {
      name: 'app-store',
      trace: true,
    },
  ),
)

// Selectors
export const useAuth = () =>
  useStore(state => ({
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    error: state.error,
    login: state.login,
    logout: state.logout,
    register: state.register,
    updateProfile: state.updateProfile,
    clearError: state.clearError,
  }))

export const useUi = () =>
  useStore(state => ({
    theme: state.theme,
    language: state.language,
    sidebarOpen: state.sidebarOpen,
    notifications: state.notifications,
    toggleTheme: state.toggleTheme,
    setLanguage: state.setLanguage,
    toggleSidebar: state.toggleSidebar,
    addNotification: state.addNotification,
    removeNotification: state.removeNotification,
  }))

export const useBooks = () =>
  useStore(state => ({
    books: state.books,
    selectedBook: state.selectedBook,
    isLoading: state.isLoading,
    error: state.error,
    fetchBooks: state.fetchBooks,
    createBook: state.createBook,
    updateBook: state.updateBook,
    deleteBook: state.deleteBook,
    selectBook: state.selectBook,
  }))

// Action hooks for better organization
export const useAuthActions = () =>
  useStore(state => ({
    login: state.login,
    logout: state.logout,
    register: state.register,
    updateProfile: state.updateProfile,
    clearError: state.clearError,
  }))

export const useBooksActions = () =>
  useStore(state => ({
    fetchBooks: state.fetchBooks,
    createBook: state.createBook,
    updateBook: state.updateBook,
    deleteBook: state.deleteBook,
    selectBook: state.selectBook,
  }))
```

### Books Store Slice

```typescript
// web/src/store/slices/booksSlice.ts
import { StateCreator } from 'zustand'

export interface Book {
  id: string
  title: string
  author: string
  description: string
  publishedAt: string
  createdAt: string
  updatedAt: string
}

export interface BooksSlice {
  // State
  books: Book[]
  selectedBook: Book | null
  isLoading: boolean
  error: string | null
  pagination: {
    page: number
    limit: number
    total: number
    hasMore: boolean
  }

  // Actions
  fetchBooks: (params?: FetchBooksParams) => Promise<void>
  createBook: (data: CreateBookData) => Promise<Book>
  updateBook: (id: string, data: UpdateBookData) => Promise<Book>
  deleteBook: (id: string) => Promise<void>
  selectBook: (book: Book | null) => void
  loadMoreBooks: () => Promise<void>
  searchBooks: (query: string) => Promise<void>
  clearBooks: () => void
}

export const createBooksSlice: StateCreator<
  BooksSlice,
  [['zustand/immer', never], ['zustand/devtools', never]],
  [],
  BooksSlice
> = (set, get) => ({
  // Initial state
  books: [],
  selectedBook: null,
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    hasMore: false,
  },

  // Actions
  fetchBooks: async (params = {}) => {
    set(
      state => {
        state.isLoading = true
        state.error = null
      },
      false,
      'books/fetchBooks/start',
    )

    try {
      const response = await booksApi.getBooks({
        page: params.page || get().pagination.page,
        limit: params.limit || get().pagination.limit,
        search: params.search,
        sortBy: params.sortBy,
        sortOrder: params.sortOrder,
      })

      set(
        state => {
          if (params.page === 1) {
            state.books = response.books
          } else {
            state.books.push(...response.books)
          }

          state.pagination = {
            page: response.page,
            limit: response.limit,
            total: response.total,
            hasMore: response.hasMore,
          }

          state.isLoading = false
        },
        false,
        'books/fetchBooks/success',
      )
    } catch (error) {
      set(
        state => {
          state.error = error.message
          state.isLoading = false
        },
        false,
        'books/fetchBooks/error',
      )
    }
  },

  createBook: async data => {
    set(
      state => {
        state.isLoading = true
        state.error = null
      },
      false,
      'books/createBook/start',
    )

    try {
      const newBook = await booksApi.createBook(data)

      set(
        state => {
          state.books.unshift(newBook)
          state.isLoading = false
        },
        false,
        'books/createBook/success',
      )

      return newBook
    } catch (error) {
      set(
        state => {
          state.error = error.message
          state.isLoading = false
        },
        false,
        'books/createBook/error',
      )

      throw error
    }
  },

  updateBook: async (id, data) => {
    set(
      state => {
        state.isLoading = true
        state.error = null
      },
      false,
      'books/updateBook/start',
    )

    try {
      const updatedBook = await booksApi.updateBook(id, data)

      set(
        state => {
          const index = state.books.findIndex(book => book.id === id)
          if (index !== -1) {
            state.books[index] = updatedBook
          }

          if (state.selectedBook?.id === id) {
            state.selectedBook = updatedBook
          }

          state.isLoading = false
        },
        false,
        'books/updateBook/success',
      )

      return updatedBook
    } catch (error) {
      set(
        state => {
          state.error = error.message
          state.isLoading = false
        },
        false,
        'books/updateBook/error',
      )

      throw error
    }
  },

  deleteBook: async id => {
    set(
      state => {
        state.isLoading = true
        state.error = null
      },
      false,
      'books/deleteBook/start',
    )

    try {
      await booksApi.deleteBook(id)

      set(
        state => {
          state.books = state.books.filter(book => book.id !== id)

          if (state.selectedBook?.id === id) {
            state.selectedBook = null
          }

          state.isLoading = false
        },
        false,
        'books/deleteBook/success',
      )
    } catch (error) {
      set(
        state => {
          state.error = error.message
          state.isLoading = false
        },
        false,
        'books/deleteBook/error',
      )

      throw error
    }
  },

  selectBook: book => {
    set(
      state => {
        state.selectedBook = book
      },
      false,
      'books/selectBook',
    )
  },

  loadMoreBooks: async () => {
    const { pagination, fetchBooks } = get()

    if (pagination.hasMore && !get().isLoading) {
      await fetchBooks({ page: pagination.page + 1 })
    }
  },

  searchBooks: async query => {
    await get().fetchBooks({ page: 1, search: query })
  },

  clearBooks: () => {
    set(
      state => {
        state.books = []
        state.selectedBook = null
        state.pagination = {
          page: 1,
          limit: 10,
          total: 0,
          hasMore: false,
        }
      },
      false,
      'books/clearBooks',
    )
  },
})

interface FetchBooksParams {
  page?: number
  limit?: number
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

interface CreateBookData {
  title: string
  author: string
  description: string
}

interface UpdateBookData {
  title?: string
  author?: string
  description?: string
}
```

### UI Store Slice

```typescript
// web/src/store/slices/uiSlice.ts
import { StateCreator } from 'zustand'

export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  duration?: number
  actions?: NotificationAction[]
}

export interface NotificationAction {
  label: string
  action: () => void
  variant?: 'primary' | 'secondary'
}

export interface UiSlice {
  // State
  theme: 'light' | 'dark' | 'system'
  language: string
  sidebarOpen: boolean
  notifications: Notification[]
  loading: {
    global: boolean
    operations: Record<string, boolean>
  }
  modals: {
    [key: string]: {
      open: boolean
      data?: any
    }
  }

  // Actions
  toggleTheme: () => void
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  setLanguage: (language: string) => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  addNotification: (notification: Omit<Notification, 'id'>) => void
  removeNotification: (id: string) => void
  clearNotifications: () => void
  setGlobalLoading: (loading: boolean) => void
  setOperationLoading: (operation: string, loading: boolean) => void
  openModal: (modalId: string, data?: any) => void
  closeModal: (modalId: string) => void
  toggleModal: (modalId: string) => void
}

export const createUiSlice: StateCreator<
  UiSlice,
  [['zustand/immer', never], ['zustand/devtools', never]],
  [],
  UiSlice
> = (set, get) => ({
  // Initial state
  theme: 'system',
  language: 'en',
  sidebarOpen: false,
  notifications: [],
  loading: {
    global: false,
    operations: {},
  },
  modals: {},

  // Actions
  toggleTheme: () => {
    set(
      state => {
        const themes: Array<'light' | 'dark' | 'system'> = ['light', 'dark', 'system']
        const currentIndex = themes.indexOf(state.theme)
        state.theme = themes[(currentIndex + 1) % themes.length]
      },
      false,
      'ui/toggleTheme',
    )
  },

  setTheme: theme => {
    set(
      state => {
        state.theme = theme
      },
      false,
      'ui/setTheme',
    )
  },

  setLanguage: language => {
    set(
      state => {
        state.language = language
      },
      false,
      'ui/setLanguage',
    )
  },

  toggleSidebar: () => {
    set(
      state => {
        state.sidebarOpen = !state.sidebarOpen
      },
      false,
      'ui/toggleSidebar',
    )
  },

  setSidebarOpen: open => {
    set(
      state => {
        state.sidebarOpen = open
      },
      false,
      'ui/setSidebarOpen',
    )
  },

  addNotification: notification => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9)

    set(
      state => {
        state.notifications.push({
          id,
          ...notification,
          duration: notification.duration ?? 5000,
        })
      },
      false,
      'ui/addNotification',
    )

    // Auto-remove notification after duration
    if (notification.duration !== 0) {
      setTimeout(() => {
        get().removeNotification(id)
      }, notification.duration ?? 5000)
    }
  },

  removeNotification: id => {
    set(
      state => {
        state.notifications = state.notifications.filter(n => n.id !== id)
      },
      false,
      'ui/removeNotification',
    )
  },

  clearNotifications: () => {
    set(
      state => {
        state.notifications = []
      },
      false,
      'ui/clearNotifications',
    )
  },

  setGlobalLoading: loading => {
    set(
      state => {
        state.loading.global = loading
      },
      false,
      'ui/setGlobalLoading',
    )
  },

  setOperationLoading: (operation, loading) => {
    set(
      state => {
        if (loading) {
          state.loading.operations[operation] = true
        } else {
          delete state.loading.operations[operation]
        }
      },
      false,
      'ui/setOperationLoading',
    )
  },

  openModal: (modalId, data) => {
    set(
      state => {
        state.modals[modalId] = { open: true, data }
      },
      false,
      'ui/openModal',
    )
  },

  closeModal: modalId => {
    set(
      state => {
        if (state.modals[modalId]) {
          state.modals[modalId].open = false
          state.modals[modalId].data = undefined
        }
      },
      false,
      'ui/closeModal',
    )
  },

  toggleModal: modalId => {
    set(
      state => {
        if (state.modals[modalId]) {
          state.modals[modalId].open = !state.modals[modalId].open
          if (!state.modals[modalId].open) {
            state.modals[modalId].data = undefined
          }
        } else {
          state.modals[modalId] = { open: true }
        }
      },
      false,
      'ui/toggleModal',
    )
  },
})
```

### Store Provider Component

```typescript
// web/src/store/StoreProvider.tsx
import React, { createContext, useContext, useEffect, ReactNode } from 'react'
import { useStore } from './index'

interface StoreProviderProps {
  children: ReactNode
}

const StoreContext = createContext<typeof useStore | null>(null)

export const StoreProvider: React.FC<StoreProviderProps> = ({ children }) => {
  const initializeStore = useStore((state) => state.initializeStore)

  useEffect(() => {
    // Initialize store on app start
    initializeStore?.()
  }, [initializeStore])

  return (
    <StoreContext.Provider value={useStore}>
      {children}
    </StoreContext.Provider>
  )
}

export const useStoreContext = () => {
  const context = useContext(StoreContext)
  if (!context) {
    throw new Error('useStoreContext must be used within a StoreProvider')
  }
  return context
}
```

### Usage Examples

```typescript
// web/src/components/LoginForm.tsx
import React from 'react'
import { useAuth } from '../store'
import { useForm } from 'react-hook-form'

interface LoginFormProps {
  onSuccess?: () => void
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const { login, isLoading, error } = useAuth()
  const { register, handleSubmit, formState: { errors } } = useForm<{
    email: string
    password: string
  }>()

  const onSubmit = async (data: { email: string; password: string }) => {
    try {
      await login(data)
      onSuccess?.()
    } catch (error) {
      // Error is handled by the store
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <input
          {...register('email', { required: 'Email is required' })}
          type="email"
          placeholder="Email"
        />
        {errors.email && <span>{errors.email.message}</span>}
      </div>

      <div>
        <input
          {...register('password', { required: 'Password is required' })}
          type="password"
          placeholder="Password"
        />
        {errors.password && <span>{errors.password.message}</span>}
      </div>

      {error && <div className="error">{error}</div>}

      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  )
}

// web/src/components/BooksList.tsx
import React, { useEffect } from 'react'
import { useBooks } from '../store'

export const BooksList: React.FC = () => {
  const {
    books,
    isLoading,
    error,
    fetchBooks,
    deleteBook,
    pagination
  } = useBooks()

  useEffect(() => {
    fetchBooks()
  }, [fetchBooks])

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this book?')) {
      await deleteBook(id)
    }
  }

  if (isLoading && books.length === 0) {
    return <div>Loading books...</div>
  }

  if (error) {
    return <div>Error loading books: {error}</div>
  }

  return (
    <div className="books-list">
      {books.map((book) => (
        <div key={book.id} className="book-item">
          <h3>{book.title}</h3>
          <p>by {book.author}</p>
          <p>{book.description}</p>
          <button onClick={() => handleDelete(book.id)}>
            Delete
          </button>
        </div>
      ))}

      {pagination.hasMore && (
        <button onClick={loadMoreBooks} disabled={isLoading}>
          {isLoading ? 'Loading...' : 'Load More'}
        </button>
      )}
    </div>
  )
}
```

## Installation Steps

1. **Install State Management Dependencies**

   ```bash
   # Zustand (recommended)
   pnpm add zustand immer

   # Redux Toolkit (alternative)
   pnpm add @reduxjs/toolkit react-redux

   # Jotai (alternative)
   pnpm add jotai

   # Valtio (alternative)
   pnpm add valtio
   ```

2. **Configure DevTools Integration**

   ```bash
   # For Zustand
   pnpm add -D @types/node

   # For Redux
   pnpm add -D redux-devtools-extension
   ```

3. **Setup Persistence**
   ```bash
   # For advanced persistence
   pnpm add idb-keyval localforage
   ```

This state management system provides enterprise-grade client state management with persistence, DevTools integration, and excellent TypeScript support for scalable React applications.
