# State Management & Offline Support

## Overview

Mobile-optimized state management with offline-first architecture, data synchronization, and intelligent caching strategies for robust mobile applications.

## Priority

**HIGH** - Essential for mobile data management and user experience

## Dependencies

- React Native application setup
- Apollo Client for GraphQL
- AsyncStorage for local storage

## Components

### Offline-First Architecture

- **Local-First Data**: Prioritize local data for immediate user feedback
- **Optimistic Updates**: Update UI immediately, sync with server later
- **Conflict Resolution**: Handle conflicts between local and server data
- **Data Persistence**: Store critical data locally for offline access
- **Network Status Awareness**: React to network connectivity changes

### Data Synchronization

- **Background Sync**: Sync data when network becomes available
- **Incremental Sync**: Only sync changed data to minimize bandwidth
- **Queue Management**: Queue operations while offline for later execution
- **Retry Logic**: Automatic retry with exponential backoff
- **Delta Synchronization**: Efficient data transfer using deltas

### Cache Management

- **Apollo Cache**: GraphQL query and mutation result caching
- **Image Caching**: Efficient image storage and retrieval
- **File Caching**: Document and asset caching
- **Cache Policies**: Configurable cache-first, network-first strategies
- **Cache Invalidation**: Smart cache updates and cleanup

### Background Sync

- **Background Tasks**: Execute sync operations when app is backgrounded
- **Scheduled Sync**: Periodic data synchronization
- **Push-triggered Sync**: Server-initiated synchronization
- **Battery Optimization**: Respect device battery and data usage
- **Network-aware Sync**: Sync only on WiFi or adjust based on connection

### Conflict Resolution

- **Last-Write-Wins**: Simple conflict resolution strategy
- **Operational Transform**: Advanced conflict resolution for collaborative features
- **User-Mediated Resolution**: Allow users to resolve conflicts manually
- **Automatic Merge**: Intelligent automatic merging of non-conflicting changes
- **Conflict Logging**: Track and report conflicts for analysis

## Configuration

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

```
mobile/src/
├── store/
│   ├── index.ts                  # Store configuration
│   ├── slices/                   # Redux slices
│   │   ├── authSlice.ts
│   │   ├── booksSlice.ts
│   │   └── syncSlice.ts
│   └── middleware/
│       ├── syncMiddleware.ts     # Sync operation middleware
│       └── offlineMiddleware.ts  # Offline handling middleware
├── services/
│   ├── sync/
│   │   ├── SyncManager.ts       # Main sync coordination
│   │   ├── OperationQueue.ts    # Offline operation queueing
│   │   ├── ConflictResolver.ts  # Conflict resolution
│   │   └── DeltaSync.ts         # Incremental synchronization
│   ├── storage/
│   │   ├── StorageService.ts    # Local data storage
│   │   ├── CacheService.ts      # Cache management
│   │   └── ImageCache.ts        # Image caching
│   └── network/
│       ├── NetworkMonitor.ts    # Network status monitoring
│       └── BackgroundSync.ts    # Background synchronization
├── hooks/
│   ├── useOfflineSync.ts        # Offline sync hook
│   ├── useNetworkStatus.ts      # Network status hook
│   └── usePersistentStorage.ts  # Persistent storage hook
└── utils/
    ├── offlineUtils.ts          # Offline utility functions
    └── syncUtils.ts             # Synchronization helpers
```

## Sync Manager Implementation

```typescript
// services/sync/SyncManager.ts
import { ApolloClient } from '@apollo/client'
import { NetworkMonitor } from '../network/NetworkMonitor'
import { OperationQueue, QueuedOperation } from './OperationQueue'
import { ConflictResolver } from './ConflictResolver'
import { StorageService } from '../storage/StorageService'

export interface SyncConfig {
  syncInterval: number
  retryDelay: number
  maxRetries: number
  onlyOnWifi: boolean
  batchSize: number
}

export interface SyncStatus {
  isOnline: boolean
  isSyncing: boolean
  pendingOperations: number
  lastSyncTime: Date | null
  errors: string[]
}

export class SyncManager {
  private apolloClient: ApolloClient<any>
  private networkMonitor: NetworkMonitor
  private operationQueue: OperationQueue
  private conflictResolver: ConflictResolver
  private storageService: StorageService
  private config: SyncConfig
  private syncInterval: NodeJS.Timeout | null = null
  private status: SyncStatus

  constructor(apolloClient: ApolloClient<any>, config: Partial<SyncConfig> = {}) {
    this.apolloClient = apolloClient
    this.networkMonitor = new NetworkMonitor()
    this.operationQueue = new OperationQueue()
    this.conflictResolver = new ConflictResolver()
    this.storageService = new StorageService()

    this.config = {
      syncInterval: 30000, // 30 seconds
      retryDelay: 5000, // 5 seconds
      maxRetries: 3,
      onlyOnWifi: false,
      batchSize: 10,
      ...config,
    }

    this.status = {
      isOnline: false,
      isSyncing: false,
      pendingOperations: 0,
      lastSyncTime: null,
      errors: [],
    }

    this.initialize()
  }

  private async initialize() {
    // Monitor network status
    this.networkMonitor.onStatusChange(isOnline => {
      this.status.isOnline = isOnline
      if (isOnline) {
        this.performSync()
      }
    })

    // Load queued operations from storage
    await this.operationQueue.loadFromStorage()
    this.updateStatus()

    // Start periodic sync
    this.startPeriodicSync()
  }

  private startPeriodicSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
    }

    this.syncInterval = setInterval(() => {
      if (this.shouldSync()) {
        this.performSync()
      }
    }, this.config.syncInterval)
  }

  private shouldSync(): boolean {
    if (!this.status.isOnline || this.status.isSyncing) {
      return false
    }

    if (this.config.onlyOnWifi && !this.networkMonitor.isWifi()) {
      return false
    }

    return this.operationQueue.hasPendingOperations()
  }

  async performSync(): Promise<void> {
    if (this.status.isSyncing) {
      return
    }

    try {
      this.status.isSyncing = true
      this.status.errors = []
      this.updateStatus()

      const pendingOperations = await this.operationQueue.getNextBatch(this.config.batchSize)

      for (const operation of pendingOperations) {
        await this.processOperation(operation)
      }

      this.status.lastSyncTime = new Date()
    } catch (error) {
      console.error('Sync error:', error)
      this.status.errors.push(error.message || 'Sync failed')
    } finally {
      this.status.isSyncing = false
      this.updateStatus()
    }
  }

  private async processOperation(operation: QueuedOperation): Promise<void> {
    try {
      let result

      switch (operation.type) {
        case 'mutation':
          result = await this.apolloClient.mutate({
            mutation: operation.mutation,
            variables: operation.variables,
          })
          break

        case 'query':
          result = await this.apolloClient.query({
            query: operation.query,
            variables: operation.variables,
            fetchPolicy: 'network-only',
          })
          break

        default:
          throw new Error(`Unknown operation type: ${operation.type}`)
      }

      // Handle conflicts if any
      if (result.errors) {
        const conflictError = result.errors.find(error => error.extensions?.code === 'CONFLICT')

        if (conflictError) {
          await this.conflictResolver.resolve(operation, conflictError)
        }
      }

      // Remove successful operation from queue
      await this.operationQueue.removeOperation(operation.id)
    } catch (error) {
      console.error('Operation failed:', error)

      // Increment retry count
      operation.retryCount = (operation.retryCount || 0) + 1

      if (operation.retryCount >= this.config.maxRetries) {
        // Max retries reached, remove from queue
        await this.operationQueue.removeOperation(operation.id)
        this.status.errors.push(`Max retries reached for operation ${operation.id}`)
      } else {
        // Schedule retry
        await this.operationQueue.scheduleRetry(operation, this.config.retryDelay)
      }
    }
  }

  async queueOperation(operation: Omit<QueuedOperation, 'id' | 'timestamp'>): Promise<void> {
    await this.operationQueue.addOperation(operation)
    this.updateStatus()

    // Try immediate sync if online
    if (this.shouldSync()) {
      this.performSync()
    }
  }

  private updateStatus() {
    this.status.pendingOperations = this.operationQueue.getPendingCount()
  }

  getStatus(): SyncStatus {
    return { ...this.status }
  }

  async clearQueue(): Promise<void> {
    await this.operationQueue.clear()
    this.updateStatus()
  }

  destroy(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
    }
    this.networkMonitor.destroy()
  }
}
```

## Operation Queue Implementation

```typescript
// services/sync/OperationQueue.ts
import AsyncStorage from '@react-native-async-storage/async-storage'
import { DocumentNode } from 'graphql'

export interface QueuedOperation {
  id: string
  type: 'mutation' | 'query'
  mutation?: DocumentNode
  query?: DocumentNode
  variables?: any
  timestamp: number
  retryCount?: number
  scheduledRetryTime?: number
}

const QUEUE_STORAGE_KEY = 'operation_queue'

export class OperationQueue {
  private operations: QueuedOperation[] = []

  async loadFromStorage(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(QUEUE_STORAGE_KEY)
      if (stored) {
        this.operations = JSON.parse(stored)
      }
    } catch (error) {
      console.error('Failed to load operation queue:', error)
    }
  }

  private async saveToStorage(): Promise<void> {
    try {
      await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(this.operations))
    } catch (error) {
      console.error('Failed to save operation queue:', error)
    }
  }

  async addOperation(operation: Omit<QueuedOperation, 'id' | 'timestamp'>): Promise<void> {
    const queuedOperation: QueuedOperation = {
      ...operation,
      id: this.generateId(),
      timestamp: Date.now(),
    }

    this.operations.push(queuedOperation)
    await this.saveToStorage()
  }

  async removeOperation(id: string): Promise<void> {
    this.operations = this.operations.filter(op => op.id !== id)
    await this.saveToStorage()
  }

  async getNextBatch(batchSize: number): Promise<QueuedOperation[]> {
    const now = Date.now()

    // Filter operations that are ready (not scheduled for retry or retry time has passed)
    const readyOperations = this.operations.filter(op => !op.scheduledRetryTime || op.scheduledRetryTime <= now)

    return readyOperations.sort((a, b) => a.timestamp - b.timestamp).slice(0, batchSize)
  }

  async scheduleRetry(operation: QueuedOperation, delayMs: number): Promise<void> {
    const operationIndex = this.operations.findIndex(op => op.id === operation.id)
    if (operationIndex !== -1) {
      this.operations[operationIndex] = {
        ...operation,
        scheduledRetryTime: Date.now() + delayMs,
      }
      await this.saveToStorage()
    }
  }

  hasPendingOperations(): boolean {
    return this.operations.length > 0
  }

  getPendingCount(): number {
    return this.operations.length
  }

  async clear(): Promise<void> {
    this.operations = []
    await this.saveToStorage()
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}
```

## Network Monitor

```typescript
// services/network/NetworkMonitor.ts
import NetInfo, { NetInfoState } from '@react-native-netinfo/netinfo'

export interface NetworkStatus {
  isConnected: boolean
  isInternetReachable: boolean
  type: string
  isWifiEnabled: boolean
}

export class NetworkMonitor {
  private listeners: Array<(isOnline: boolean) => void> = []
  private currentStatus: NetworkStatus = {
    isConnected: false,
    isInternetReachable: false,
    type: 'unknown',
    isWifiEnabled: false,
  }

  constructor() {
    this.initialize()
  }

  private initialize() {
    NetInfo.addEventListener(this.handleNetworkChange)
  }

  private handleNetworkChange = (state: NetInfoState) => {
    const wasOnline = this.currentStatus.isConnected && this.currentStatus.isInternetReachable

    this.currentStatus = {
      isConnected: state.isConnected ?? false,
      isInternetReachable: state.isInternetReachable ?? false,
      type: state.type,
      isWifiEnabled: state.type === 'wifi',
    }

    const isOnline = this.currentStatus.isConnected && this.currentStatus.isInternetReachable

    if (wasOnline !== isOnline) {
      this.notifyListeners(isOnline)
    }
  }

  onStatusChange(callback: (isOnline: boolean) => void): () => void {
    this.listeners.push(callback)

    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback)
    }
  }

  private notifyListeners(isOnline: boolean) {
    this.listeners.forEach(listener => listener(isOnline))
  }

  isOnline(): boolean {
    return this.currentStatus.isConnected && this.currentStatus.isInternetReachable
  }

  isWifi(): boolean {
    return this.currentStatus.isWifiEnabled
  }

  getStatus(): NetworkStatus {
    return { ...this.currentStatus }
  }

  async refresh(): Promise<NetworkStatus> {
    const state = await NetInfo.fetch()
    this.handleNetworkChange(state)
    return this.getStatus()
  }

  destroy(): void {
    NetInfo.addEventListener(() => {}) // This removes all listeners in NetInfo
  }
}
```

## Offline Sync Hook

```typescript
// hooks/useOfflineSync.ts
import { useEffect, useState, useCallback } from 'react'
import { useApolloClient } from '@apollo/client'
import { SyncManager, SyncStatus } from '../services/sync/SyncManager'
import { DocumentNode } from 'graphql'

let syncManagerInstance: SyncManager | null = null

export function useOfflineSync() {
  const apolloClient = useApolloClient()
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: false,
    isSyncing: false,
    pendingOperations: 0,
    lastSyncTime: null,
    errors: [],
  })

  useEffect(() => {
    if (!syncManagerInstance) {
      syncManagerInstance = new SyncManager(apolloClient, {
        syncInterval: 30000,
        onlyOnWifi: false,
        maxRetries: 3,
      })
    }

    const updateStatus = () => {
      setSyncStatus(syncManagerInstance!.getStatus())
    }

    // Update status periodically
    const interval = setInterval(updateStatus, 1000)
    updateStatus()

    return () => {
      clearInterval(interval)
    }
  }, [apolloClient])

  const queueMutation = useCallback(async (mutation: DocumentNode, variables?: any) => {
    if (syncManagerInstance) {
      await syncManagerInstance.queueOperation({
        type: 'mutation',
        mutation,
        variables,
      })
    }
  }, [])

  const queueQuery = useCallback(async (query: DocumentNode, variables?: any) => {
    if (syncManagerInstance) {
      await syncManagerInstance.queueOperation({
        type: 'query',
        query,
        variables,
      })
    }
  }, [])

  const performSync = useCallback(async () => {
    if (syncManagerInstance) {
      await syncManagerInstance.performSync()
    }
  }, [])

  const clearQueue = useCallback(async () => {
    if (syncManagerInstance) {
      await syncManagerInstance.clearQueue()
    }
  }, [])

  return {
    syncStatus,
    queueMutation,
    queueQuery,
    performSync,
    clearQueue,
  }
}
```

## Persistent Storage Hook

```typescript
// hooks/usePersistentStorage.ts
import { useState, useEffect, useCallback } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

export function usePersistentStorage<T>(key: string, defaultValue: T): [T, (value: T) => Promise<void>, boolean] {
  const [storedValue, setStoredValue] = useState<T>(defaultValue)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadStoredValue = async () => {
      try {
        const item = await AsyncStorage.getItem(key)
        if (item) {
          setStoredValue(JSON.parse(item))
        }
      } catch (error) {
        console.error(`Error loading stored value for key "${key}":`, error)
      } finally {
        setLoading(false)
      }
    }

    loadStoredValue()
  }, [key])

  const setValue = useCallback(
    async (value: T) => {
      try {
        setStoredValue(value)
        await AsyncStorage.setItem(key, JSON.stringify(value))
      } catch (error) {
        console.error(`Error setting stored value for key "${key}":`, error)
      }
    },
    [key],
  )

  return [storedValue, setValue, loading]
}
```

## Apollo Client Offline Configuration

```typescript
// services/apollo/offlineClient.ts
import { ApolloClient, InMemoryCache, from } from '@apollo/client'
import { setContext } from '@apollo/client/link/context'
import { onError } from '@apollo/client/link/error'
import { RetryLink } from '@apollo/client/link/retry'
import { createUploadLink } from 'apollo-upload-client'
import { persistCache, AsyncStorageWrapper } from 'apollo3-cache-persist'
import AsyncStorage from '@react-native-async-storage/async-storage'

const httpLink = createUploadLink({
  uri: __DEV__ ? 'http://localhost:4000/graphql' : 'https://api.yourapp.com/graphql',
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

const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path }) => {
      console.error(`GraphQL error: Message: ${message}, Location: ${locations}, Path: ${path}`)
    })
  }

  if (networkError) {
    console.error(`Network error: ${networkError}`)

    // Queue operation for retry when back online
    if (networkError.statusCode === 0) {
      // Network unavailable, queue for offline sync
      // This would integrate with the SyncManager
    }
  }
})

const retryLink = new RetryLink({
  delay: {
    initial: 300,
    max: Infinity,
    jitter: true,
  },
  attempts: {
    max: 3,
    retryIf: (error, _operation) => !!error,
  },
})

export async function createOfflineApolloClient() {
  const cache = new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          books: {
            merge(existing, incoming, { args }) {
              // Implement cache merging logic for offline support
              return incoming
            },
          },
        },
      },
    },
  })

  // Persist cache to AsyncStorage
  await persistCache({
    cache,
    storage: new AsyncStorageWrapper(AsyncStorage),
    maxSize: 1048576 * 5, // 5MB
  })

  return new ApolloClient({
    link: from([authLink, errorLink, retryLink, httpLink]),
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
