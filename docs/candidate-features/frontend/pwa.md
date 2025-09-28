# Progressive Web App (PWA)

## Overview

Complete Progressive Web App implementation with offline capabilities, service workers, app manifest, push notifications, and native-like user experience.

## Priority

**MEDIUM** - Important for mobile-first applications and offline functionality

## Dependencies

- `vite` (React application base with PWA plugin)
- `tailwind` (styling foundation)
- `ui-component-library` (UI components)

## Feature Description

Comprehensive Progressive Web App infrastructure providing offline functionality, installability, push notifications, background sync, and native-like user experience for React web applications.

### Key Features

- **Service Worker**: Offline caching, background sync, push notification handling
- **App Manifest**: Installable web app with native appearance
- **Offline Strategy**: Cache-first, network-first, stale-while-revalidate strategies
- **Push Notifications**: Web push notifications with customizable templates
- **Background Sync**: Queue actions for when connection is restored
- **Install Prompts**: Custom app installation experience
- **Performance Optimization**: Resource caching, preloading, lazy loading

## Configuration

```typescript
interface PWAConfig {
  manifest: {
    name: string
    shortName: string
    description: string
    themeColor: string
    backgroundColor: string
    display: 'standalone' | 'fullscreen' | 'minimal-ui' | 'browser'
    orientation: 'portrait' | 'landscape' | 'any'
    startUrl: string
    scope: string
    categories: string[]
  }
  serviceWorker: {
    enabled: boolean
    scope: string
    updateInterval: number
    cacheStrategy: 'cacheFirst' | 'networkFirst' | 'staleWhileRevalidate'
    cacheResources: string[]
    excludeRoutes: string[]
  }
  notifications: {
    enabled: boolean
    vapidKeys: {
      publicKey: string
      privateKey: string
    }
    defaultIcon: string
    defaultBadge: string
  }
  offline: {
    enabled: boolean
    fallbackPage: string
    cacheName: string
    maxCacheSize: number
  }
  updates: {
    autoUpdate: boolean
    showUpdatePrompt: boolean
    forceUpdate: boolean
  }
}
```

## Generated Files

### PWA Structure

```
web/
├── public/
│   ├── manifest.json                 # Web app manifest
│   ├── sw.js                         # Service worker
│   ├── icons/                        # App icons
│   │   ├── icon-72x72.png
│   │   ├── icon-96x96.png
│   │   ├── icon-128x128.png
│   │   ├── icon-144x144.png
│   │   ├── icon-152x152.png
│   │   ├── icon-192x192.png
│   │   ├── icon-384x384.png
│   │   ├── icon-512x512.png
│   │   └── maskable-icon-512x512.png
│   └── offline.html                  # Offline fallback page
├── src/
│   ├── pwa/
│   │   ├── index.ts                  # PWA exports
│   │   ├── components/
│   │   │   ├── InstallPrompt.tsx     # App install prompt
│   │   │   ├── UpdatePrompt.tsx      # App update notification
│   │   │   ├── OfflineIndicator.tsx  # Offline status indicator
│   │   │   ├── NotificationPermission.tsx # Notification permission
│   │   │   └── PWABadge.tsx          # PWA installation badge
│   │   ├── hooks/
│   │   │   ├── usePWA.ts             # Main PWA hook
│   │   │   ├── useServiceWorker.ts   # Service worker management
│   │   │   ├── useNotifications.ts   # Push notifications
│   │   │   ├── useOffline.ts         # Offline state management
│   │   │   ├── useInstallPrompt.ts   # Install prompt handling
│   │   │   ├── useBackgroundSync.ts  # Background sync
│   │   │   └── usePWAUpdate.ts       # App update handling
│   │   ├── services/
│   │   │   ├── serviceWorkerService.ts # Service worker utilities
│   │   │   ├── notificationService.ts  # Notification service
│   │   │   ├── cacheService.ts         # Cache management
│   │   │   ├── syncService.ts          # Background sync service
│   │   │   └── analyticsService.ts     # PWA analytics
│   │   ├── utils/
│   │   │   ├── pwaUtils.ts           # PWA utilities
│   │   │   ├── cacheStrategies.ts    # Caching strategies
│   │   │   ├── offlineQueue.ts       # Offline action queue
│   │   │   └── installability.ts     # Installation detection
│   │   ├── types/
│   │   │   ├── pwa.ts                # PWA type definitions
│   │   │   ├── serviceWorker.ts      # Service worker types
│   │   │   ├── notifications.ts      # Notification types
│   │   │   └── cache.ts              # Cache types
│   │   └── providers/
│   │       ├── PWAProvider.tsx       # PWA context provider
│   │       └── ServiceWorkerProvider.tsx # Service worker context
│   └── sw/                           # Service worker source files
│       ├── sw.ts                     # Main service worker
│       ├── strategies/
│       │   ├── cacheFirst.ts         # Cache-first strategy
│       │   ├── networkFirst.ts       # Network-first strategy
│       │   └── staleWhileRevalidate.ts # Stale-while-revalidate
│       ├── handlers/
│       │   ├── notificationHandler.ts # Push notification handler
│       │   ├── backgroundSyncHandler.ts # Background sync handler
│       │   ├── installHandler.ts     # Install event handler
│       │   └── activateHandler.ts    # Activate event handler
│       └── utils/
│           ├── cacheUtils.ts         # Cache utilities
│           └── messageUtils.ts       # Message passing utilities
```

## Code Examples

### Main PWA Hook

```typescript
// web/src/pwa/hooks/usePWA.ts
import { useState, useEffect, useCallback } from 'react'
import { useServiceWorker } from './useServiceWorker'
import { useNotifications } from './useNotifications'
import { useOffline } from './useOffline'
import { useInstallPrompt } from './useInstallPrompt'

export interface PWAState {
  isInstallable: boolean
  isInstalled: boolean
  isOffline: boolean
  hasUpdate: boolean
  notificationsEnabled: boolean
  serviceWorkerRegistered: boolean
}

export interface PWAActions {
  installApp: () => Promise<boolean>
  enableNotifications: () => Promise<boolean>
  updateApp: () => Promise<void>
  skipUpdate: () => void
  checkForUpdate: () => Promise<void>
}

export function usePWA() {
  const [pwaState, setPWAState] = useState<PWAState>({
    isInstallable: false,
    isInstalled: false,
    isOffline: false,
    hasUpdate: false,
    notificationsEnabled: false,
    serviceWorkerRegistered: false,
  })

  const { registration, hasUpdate, updateApp, skipUpdate, checkForUpdate } = useServiceWorker()

  const { isSupported: notificationsSupported, isEnabled: notificationsEnabled, requestPermission } = useNotifications()

  const { isOffline } = useOffline()

  const { isInstallable, isInstalled, installApp } = useInstallPrompt()

  // Update PWA state
  useEffect(() => {
    setPWAState(prev => ({
      ...prev,
      isInstallable,
      isInstalled,
      isOffline,
      hasUpdate,
      notificationsEnabled,
      serviceWorkerRegistered: !!registration,
    }))
  }, [isInstallable, isInstalled, isOffline, hasUpdate, notificationsEnabled, registration])

  // PWA actions
  const enableNotifications = useCallback(async (): Promise<boolean> => {
    if (!notificationsSupported) {
      console.warn('Push notifications are not supported in this browser')
      return false
    }

    try {
      const granted = await requestPermission()
      return granted
    } catch (error) {
      console.error('Failed to enable notifications:', error)
      return false
    }
  }, [notificationsSupported, requestPermission])

  const actions: PWAActions = {
    installApp,
    enableNotifications,
    updateApp,
    skipUpdate,
    checkForUpdate,
  }

  return {
    state: pwaState,
    actions,
    // Individual hook states for advanced usage
    serviceWorker: { registration, hasUpdate },
    notifications: {
      isSupported: notificationsSupported,
      isEnabled: notificationsEnabled,
    },
    offline: { isOffline },
    install: { isInstallable, isInstalled },
  }
}
```

### Service Worker Hook

```typescript
// web/src/pwa/hooks/useServiceWorker.ts
import { useState, useEffect, useCallback } from 'react'

export function useServiceWorker() {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)
  const [hasUpdate, setHasUpdate] = useState(false)
  const [updateAvailable, setUpdateAvailable] = useState<ServiceWorkerRegistration | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Register service worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      registerServiceWorker()
    } else {
      console.warn('Service workers are not supported in this browser')
      setIsLoading(false)
    }
  }, [])

  const registerServiceWorker = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      })

      console.log('Service worker registered successfully:', registration.scope)
      setRegistration(registration)

      // Listen for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing
        if (!newWorker) return

        console.log('New service worker installing...')

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('New service worker installed, update available')
            setHasUpdate(true)
            setUpdateAvailable(registration)
          }
        })
      })

      // Listen for controlling service worker changes
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('Service worker controller changed, reloading page')
        window.location.reload()
      })

      // Check for immediate updates
      registration.update()
    } catch (error) {
      console.error('Service worker registration failed:', error)
      setError(error instanceof Error ? error.message : 'Registration failed')
    } finally {
      setIsLoading(false)
    }
  }

  // Update the app
  const updateApp = useCallback(async () => {
    if (!updateAvailable) {
      console.warn('No update available')
      return
    }

    try {
      const newWorker = updateAvailable.waiting || updateAvailable.installing

      if (newWorker) {
        // Send message to service worker to skip waiting
        newWorker.postMessage({ type: 'SKIP_WAITING' })

        // Wait for the new service worker to take control
        await new Promise<void>(resolve => {
          const handleControllerChange = () => {
            navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange)
            resolve()
          }
          navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange)
        })

        // Reload the page
        window.location.reload()
      }
    } catch (error) {
      console.error('Failed to update app:', error)
      throw error
    }
  }, [updateAvailable])

  // Skip update
  const skipUpdate = useCallback(() => {
    setHasUpdate(false)
    setUpdateAvailable(null)
    console.log('App update skipped')
  }, [])

  // Check for updates manually
  const checkForUpdate = useCallback(async () => {
    if (!registration) {
      console.warn('Service worker not registered')
      return
    }

    try {
      await registration.update()
      console.log('Checked for service worker updates')
    } catch (error) {
      console.error('Failed to check for updates:', error)
    }
  }, [registration])

  // Send message to service worker
  const sendMessage = useCallback(
    async (message: any) => {
      if (!registration || !registration.active) {
        console.warn('Service worker not active')
        return null
      }

      return new Promise(resolve => {
        const messageChannel = new MessageChannel()

        messageChannel.port1.onmessage = event => {
          resolve(event.data)
        }

        registration.active?.postMessage(message, [messageChannel.port2])
      })
    },
    [registration],
  )

  return {
    registration,
    hasUpdate,
    isLoading,
    error,
    updateApp,
    skipUpdate,
    checkForUpdate,
    sendMessage,
  }
}
```

### Install Prompt Component

```typescript
// web/src/pwa/components/InstallPrompt.tsx
import React from 'react'
import { X, Download, Smartphone } from 'lucide-react'
import { Button } from '../../components/ui/button/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card/Card'
import { useInstallPrompt } from '../hooks/useInstallPrompt'

export interface InstallPromptProps {
  onInstall?: () => void
  onDismiss?: () => void
  className?: string
}

export const InstallPrompt: React.FC<InstallPromptProps> = ({
  onInstall,
  onDismiss,
  className,
}) => {
  const { isInstallable, installApp, dismissPrompt } = useInstallPrompt()

  if (!isInstallable) return null

  const handleInstall = async () => {
    try {
      const installed = await installApp()
      if (installed) {
        onInstall?.()
      }
    } catch (error) {
      console.error('Installation failed:', error)
    }
  }

  const handleDismiss = () => {
    dismissPrompt()
    onDismiss?.()
  }

  return (
    <Card className={`install-prompt ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Smartphone className="h-5 w-5" />
          Install App
        </CardTitle>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDismiss}
          className="h-6 w-6"
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Install this app on your device for a better experience.
          Access it directly from your home screen and use it offline.
        </p>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleInstall}
            className="flex-1"
            size="sm"
          >
            <Download className="h-4 w-4 mr-2" />
            Install Now
          </Button>

          <Button
            variant="outline"
            onClick={handleDismiss}
            size="sm"
          >
            Later
          </Button>
        </div>

        <div className="text-xs text-muted-foreground">
          <p>✓ Works offline</p>
          <p>✓ Fast loading</p>
          <p>✓ Push notifications</p>
        </div>
      </CardContent>
    </Card>
  )
}

// Alternative minimal install prompt
export const InstallBadge: React.FC<{
  onInstall?: () => void
  className?: string
}> = ({ onInstall, className }) => {
  const { isInstallable, installApp } = useInstallPrompt()

  if (!isInstallable) return null

  const handleInstall = async () => {
    try {
      const installed = await installApp()
      if (installed) {
        onInstall?.()
      }
    } catch (error) {
      console.error('Installation failed:', error)
    }
  }

  return (
    <Button
      onClick={handleInstall}
      size="sm"
      className={`install-badge ${className}`}
    >
      <Download className="h-4 w-4 mr-2" />
      Install App
    </Button>
  )
}
```

### Offline Indicator Component

```typescript
// web/src/pwa/components/OfflineIndicator.tsx
import React from 'react'
import { Wifi, WifiOff, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '../../components/ui/alert/Alert'
import { useOffline } from '../hooks/useOffline'
import { cn } from '../../utils/cn'

export interface OfflineIndicatorProps {
  showOnlineMessage?: boolean
  hideWhenOnline?: boolean
  position?: 'top' | 'bottom' | 'floating'
  className?: string
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  showOnlineMessage = false,
  hideWhenOnline = false,
  position = 'floating',
  className,
}) => {
  const { isOffline, isOnline, lastOnline } = useOffline()

  // Hide when online if specified
  if (hideWhenOnline && isOnline) return null

  // Don't show online message if disabled
  if (isOnline && !showOnlineMessage) return null

  const positionClasses = {
    top: 'fixed top-4 left-4 right-4 z-50',
    bottom: 'fixed bottom-4 left-4 right-4 z-50',
    floating: 'fixed bottom-4 right-4 z-50 max-w-sm',
  }

  return (
    <Alert
      className={cn(
        positionClasses[position],
        isOffline ? 'border-destructive bg-destructive/10' : 'border-green-500 bg-green-50',
        'shadow-lg',
        className
      )}
    >
      {isOffline ? (
        <WifiOff className="h-4 w-4" />
      ) : (
        <Wifi className="h-4 w-4" />
      )}

      <AlertDescription className="flex items-center justify-between">
        <div>
          {isOffline ? (
            <div>
              <p className="font-medium">You're offline</p>
              <p className="text-sm opacity-80">
                Some features may not be available
                {lastOnline && (
                  <span className="block">
                    Last online: {lastOnline.toLocaleTimeString()}
                  </span>
                )}
              </p>
            </div>
          ) : (
            <div>
              <p className="font-medium text-green-700">You're back online</p>
              <p className="text-sm text-green-600">All features are available</p>
            </div>
          )}
        </div>

        {isOffline && (
          <AlertCircle className="h-4 w-4 ml-2" />
        )}
      </AlertDescription>
    </Alert>
  )
}

// Simple status indicator for header/navigation
export const NetworkStatus: React.FC<{
  showText?: boolean
  className?: string
}> = ({ showText = false, className }) => {
  const { isOffline } = useOffline()

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className={cn(
        "w-2 h-2 rounded-full",
        isOffline ? "bg-red-500" : "bg-green-500"
      )} />

      {showText && (
        <span className={cn(
          "text-sm",
          isOffline ? "text-red-600" : "text-green-600"
        )}>
          {isOffline ? 'Offline' : 'Online'}
        </span>
      )}
    </div>
  )
}
```

### Push Notifications Hook

```typescript
// web/src/pwa/hooks/useNotifications.ts
import { useState, useEffect, useCallback } from 'react'

export interface NotificationOptions {
  title: string
  body?: string
  icon?: string
  badge?: string
  tag?: string
  data?: any
  actions?: Array<{
    action: string
    title: string
    icon?: string
  }>
  silent?: boolean
  renotify?: boolean
  requireInteraction?: boolean
}

export function useNotifications() {
  const [isSupported, setIsSupported] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [subscription, setSubscription] = useState<PushSubscription | null>(null)

  // Check if notifications are supported
  useEffect(() => {
    const supported = 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window
    setIsSupported(supported)

    if (supported) {
      setPermission(Notification.permission)
    }
  }, [])

  // Request permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      console.warn('Push notifications are not supported')
      return false
    }

    try {
      const permission = await Notification.requestPermission()
      setPermission(permission)

      if (permission === 'granted') {
        console.log('Notification permission granted')
        return true
      } else {
        console.log('Notification permission denied')
        return false
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error)
      return false
    }
  }, [isSupported])

  // Subscribe to push notifications
  const subscribeToPush = useCallback(
    async (vapidPublicKey: string): Promise<PushSubscription | null> => {
      if (!isSupported || permission !== 'granted') {
        console.warn('Cannot subscribe to push notifications')
        return null
      }

      try {
        const registration = await navigator.serviceWorker.ready

        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        })

        setSubscription(subscription)
        console.log('Subscribed to push notifications:', subscription.endpoint)

        return subscription
      } catch (error) {
        console.error('Failed to subscribe to push notifications:', error)
        return null
      }
    },
    [isSupported, permission],
  )

  // Unsubscribe from push notifications
  const unsubscribeFromPush = useCallback(async (): Promise<boolean> => {
    if (!subscription) {
      console.warn('No subscription to unsubscribe from')
      return false
    }

    try {
      const success = await subscription.unsubscribe()
      if (success) {
        setSubscription(null)
        console.log('Unsubscribed from push notifications')
      }
      return success
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error)
      return false
    }
  }, [subscription])

  // Show local notification
  const showNotification = useCallback(
    (options: NotificationOptions) => {
      if (!isSupported || permission !== 'granted') {
        console.warn('Cannot show notification')
        return null
      }

      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/icons/icon-192x192.png',
        badge: options.badge || '/icons/icon-72x72.png',
        tag: options.tag,
        data: options.data,
        silent: options.silent,
        renotify: options.renotify,
        requireInteraction: options.requireInteraction,
      })

      // Handle notification click
      notification.onclick = event => {
        event.preventDefault()
        window.focus()

        if (options.data?.url) {
          window.open(options.data.url, '_blank')
        }

        notification.close()
      }

      return notification
    },
    [isSupported, permission],
  )

  // Send notification via service worker
  const sendNotification = useCallback(
    async (options: NotificationOptions) => {
      if (!isSupported || permission !== 'granted') {
        console.warn('Cannot send notification')
        return
      }

      try {
        const registration = await navigator.serviceWorker.ready

        await registration.showNotification(options.title, {
          body: options.body,
          icon: options.icon || '/icons/icon-192x192.png',
          badge: options.badge || '/icons/icon-72x72.png',
          tag: options.tag,
          data: options.data,
          actions: options.actions,
          silent: options.silent,
          renotify: options.renotify,
          requireInteraction: options.requireInteraction,
        })
      } catch (error) {
        console.error('Failed to send notification:', error)
      }
    },
    [isSupported, permission],
  )

  return {
    isSupported,
    permission,
    isEnabled: permission === 'granted',
    subscription,
    requestPermission,
    subscribeToPush,
    unsubscribeFromPush,
    showNotification,
    sendNotification,
  }
}

// Utility function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }

  return outputArray
}
```

### Service Worker Implementation

```typescript
// web/src/sw/sw.ts
/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope

const CACHE_NAME = 'app-cache-v1'
const RUNTIME_CACHE = 'runtime-cache-v1'

// Files to cache on install
const PRECACHE_URLS = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/offline.html',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
]

// Install event - precache resources
self.addEventListener('install', event => {
  console.log('Service worker installing...')

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(cache => {
        console.log('Caching app shell')
        return cache.addAll(PRECACHE_URLS)
      })
      .then(() => {
        // Skip waiting to activate immediately
        return self.skipWaiting()
      }),
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('Service worker activating...')

  event.waitUntil(
    caches
      .keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE)
            .map(cacheName => {
              console.log('Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }),
        )
      })
      .then(() => {
        // Take control of all pages
        return self.clients.claim()
      }),
  )
})

// Fetch event - serve cached content when offline
self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)

  // Only handle same-origin requests
  if (url.origin !== location.origin) return

  // Handle navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        // Return cached page or offline fallback
        return caches.match('/') || caches.match('/offline.html')
      }),
    )
    return
  }

  // Handle other requests with cache-first strategy
  event.respondWith(
    caches
      .match(request)
      .then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse
        }

        // Not in cache, fetch from network
        return fetch(request).then(response => {
          // Don't cache non-successful responses
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response
          }

          // Clone the response
          const responseToCache = response.clone()

          // Add to runtime cache
          caches.open(RUNTIME_CACHE).then(cache => {
            cache.put(request, responseToCache)
          })

          return response
        })
      })
      .catch(() => {
        // Network failed, try to return offline fallback for HTML requests
        if (request.headers.get('accept')?.includes('text/html')) {
          return caches.match('/offline.html')
        }
      }),
  )
})

// Handle push notifications
self.addEventListener('push', event => {
  console.log('Push notification received')

  let notificationData = {
    title: 'New Notification',
    body: 'You have a new message',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    data: {},
  }

  if (event.data) {
    try {
      notificationData = { ...notificationData, ...event.data.json() }
    } catch (error) {
      console.error('Error parsing push data:', error)
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      data: notificationData.data,
      actions: [
        {
          action: 'open',
          title: 'Open App',
        },
        {
          action: 'close',
          title: 'Close',
        },
      ],
    }),
  )
})

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  console.log('Notification clicked:', event.notification.tag)

  event.notification.close()

  if (event.action === 'close') {
    return
  }

  // Open or focus the app
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(clientList => {
      // Try to focus existing window
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus()
        }
      }

      // Open new window
      if (self.clients.openWindow) {
        return self.clients.openWindow('/')
      }
    }),
  )
})

// Handle background sync
self.addEventListener('sync', event => {
  console.log('Background sync triggered:', event.tag)

  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Handle queued actions here
      syncQueuedActions(),
    )
  }
})

// Handle messages from main thread
self.addEventListener('message', event => {
  console.log('Service worker received message:', event.data)

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }

  // Send response back
  if (event.ports[0]) {
    event.ports[0].postMessage({ success: true })
  }
})

// Background sync function
async function syncQueuedActions() {
  try {
    // Get queued actions from IndexedDB or localStorage
    // Process them when online
    console.log('Processing queued actions...')

    // Example: sync offline form submissions
    // const queuedActions = await getQueuedActions()
    // for (const action of queuedActions) {
    //   await processAction(action)
    // }
  } catch (error) {
    console.error('Background sync failed:', error)
  }
}
```

## Installation Steps

1. **Install PWA Dependencies**

   ```bash
   # PWA plugin for Vite
   pnpm add vite-plugin-pwa -D

   # Service worker utilities
   pnpm add workbox-window workbox-core

   # Optional: Push notification server
   pnpm add web-push
   ```

2. **Configure Vite for PWA**

   ```bash
   # Update vite.config.ts with PWA plugin configuration
   # (see generated vite.config.ts)
   ```

3. **Setup TypeScript Configuration**
   ```bash
   # Add service worker types
   pnpm add -D @types/serviceworker
   ```

This PWA implementation provides comprehensive offline functionality, installability, push notifications, and native-like user experience for React web applications.
