# Session Management

## Overview

Comprehensive session handling system providing secure session storage, multi-device management, and automatic session cleanup.

## Priority

**MEDIUM-HIGH** - Important for user experience and security

## Dependencies

- `apollo-server` (for session handling in GraphQL context)
- `vite` (for frontend session management)
- `prisma` (for session persistence)

## Feature Description

Advanced session management with Redis-backed storage, device tracking, concurrent session limits, and secure session handling.

### Key Features

- **Secure Session Storage**: Redis or database-backed sessions
- **Multi-Device Management**: Track and manage sessions across devices
- **Session Expiration**: Configurable timeouts and sliding expiration
- **Force Logout**: Ability to terminate all sessions
- **Session Analytics**: Track active sessions and usage patterns

## Configuration

```typescript
interface SessionConfig {
  storage: 'redis' | 'database' | 'memory'
  security: {
    httpOnly: boolean
    secure: boolean
    sameSite: 'strict' | 'lax' | 'none'
    secret: string
  }
  expiration: {
    maxAge: number // milliseconds
    sliding: boolean // extend on activity
    cleanup: boolean // auto cleanup expired
  }
  limits: {
    maxConcurrentSessions: number
    maxSessionsPerUser: number
  }
  tracking: {
    deviceInfo: boolean
    ipAddress: boolean
    userAgent: boolean
    lastActivity: boolean
  }
}
```

## Generated Files

### Backend Implementation

```
api/src/
├── auth/
│   ├── session/
│   │   ├── index.ts              # Session exports
│   │   ├── service.ts            # Session service logic
│   │   ├── store.ts              # Session store implementation
│   │   ├── middleware.ts         # Session middleware
│   │   ├── cleanup.ts            # Session cleanup job
│   │   └── types.ts              # Session type definitions
│   └── resolvers/
│       └── sessionResolvers.ts   # Session management resolvers
```

### Frontend Implementation

```
web/src/
├── auth/
│   ├── session/
│   │   ├── index.ts              # Session exports
│   │   ├── context.tsx           # Session context provider
│   │   ├── hooks/
│   │   │   ├── useSession.ts     # Session management hook
│   │   │   └── useDeviceSessions.ts # Multi-device session hook
│   │   ├── components/
│   │   │   ├── SessionList.tsx   # Active sessions display
│   │   │   ├── SessionTimeout.tsx # Session timeout warning
│   │   │   └── DeviceManager.tsx # Device session management
│   │   └── utils/
│   │       ├── sessionStorage.ts # Browser session utilities
│   │       └── deviceFingerprint.ts # Device identification
```

## Code Examples

### Session Service (Backend)

```typescript
// api/src/auth/session/service.ts
import { Redis } from 'ioredis'
import { v4 as uuidv4 } from 'uuid'

export interface SessionData {
  id: string
  userId: string
  deviceId: string
  deviceInfo: {
    userAgent: string
    platform: string
    browser: string
  }
  ipAddress: string
  createdAt: Date
  lastActivity: Date
  expiresAt: Date
}

export class SessionService {
  private redis?: Redis

  constructor(private config: SessionConfig) {
    if (config.storage === 'redis') {
      this.redis = new Redis()
    }
  }

  async createSession(userId: string, deviceInfo: any, ipAddress: string): Promise<SessionData> {
    // Check session limits
    const activeSessions = await this.getUserSessions(userId)
    if (activeSessions.length >= this.config.limits.maxSessionsPerUser) {
      // Remove oldest session
      const oldestSession = activeSessions.sort(
        (a, b) => new Date(a.lastActivity).getTime() - new Date(b.lastActivity).getTime(),
      )[0]
      await this.destroySession(oldestSession.id)
    }

    const sessionId = uuidv4()
    const now = new Date()
    const expiresAt = new Date(now.getTime() + this.config.expiration.maxAge)

    const sessionData: SessionData = {
      id: sessionId,
      userId,
      deviceId: this.generateDeviceId(deviceInfo),
      deviceInfo,
      ipAddress,
      createdAt: now,
      lastActivity: now,
      expiresAt,
    }

    await this.saveSession(sessionData)
    return sessionData
  }

  async getSession(sessionId: string): Promise<SessionData | null> {
    if (this.config.storage === 'redis' && this.redis) {
      const data = await this.redis.get(`session:${sessionId}`)
      return data ? JSON.parse(data) : null
    }
    // Database implementation would go here
    return null
  }

  async updateActivity(sessionId: string): Promise<void> {
    const session = await this.getSession(sessionId)
    if (!session) return

    const now = new Date()
    session.lastActivity = now

    if (this.config.expiration.sliding) {
      session.expiresAt = new Date(now.getTime() + this.config.expiration.maxAge)
    }

    await this.saveSession(session)
  }

  async destroySession(sessionId: string): Promise<void> {
    if (this.config.storage === 'redis' && this.redis) {
      await this.redis.del(`session:${sessionId}`)
    }
    // Database cleanup would go here
  }

  async destroyAllUserSessions(userId: string): Promise<void> {
    const sessions = await this.getUserSessions(userId)
    await Promise.all(sessions.map(session => this.destroySession(session.id)))
  }

  async getUserSessions(userId: string): Promise<SessionData[]> {
    if (this.config.storage === 'redis' && this.redis) {
      const pattern = `session:*`
      const keys = await this.redis.keys(pattern)
      const sessions = await Promise.all(
        keys.map(async key => {
          const data = await this.redis!.get(key)
          return data ? (JSON.parse(data) as SessionData) : null
        }),
      )
      return sessions.filter(Boolean).filter(session => session.userId === userId)
    }
    return []
  }

  private async saveSession(sessionData: SessionData): Promise<void> {
    if (this.config.storage === 'redis' && this.redis) {
      const ttl = Math.floor((sessionData.expiresAt.getTime() - Date.now()) / 1000)
      await this.redis.setex(`session:${sessionData.id}`, ttl, JSON.stringify(sessionData))
    }
  }

  private generateDeviceId(deviceInfo: any): string {
    // Create a fingerprint based on device characteristics
    const fingerprint = `${deviceInfo.userAgent}_${deviceInfo.platform}_${deviceInfo.browser}`
    return Buffer.from(fingerprint).toString('base64')
  }
}
```

### Session Context (Frontend)

```typescript
// web/src/auth/session/context.tsx
import React, { createContext, useContext, useEffect, useState } from 'react'
import { SessionService } from './SessionService'

interface SessionContextType {
  sessionId: string | null
  isActive: boolean
  lastActivity: Date | null
  expiresAt: Date | null
  renewSession: () => Promise<void>
  endSession: () => Promise<void>
  endAllSessions: () => Promise<void>
}

const SessionContext = createContext<SessionContextType | null>(null)

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sessionState, setSessionState] = useState({
    sessionId: null as string | null,
    isActive: false,
    lastActivity: null as Date | null,
    expiresAt: null as Date | null,
  })

  const sessionService = new SessionService()

  useEffect(() => {
    initializeSession()
    setupActivityTracking()
    setupExpirationCheck()
  }, [])

  const initializeSession = async () => {
    const sessionId = sessionService.getSessionId()
    if (sessionId) {
      const sessionData = await sessionService.getSessionInfo(sessionId)
      if (sessionData) {
        setSessionState({
          sessionId,
          isActive: true,
          lastActivity: new Date(sessionData.lastActivity),
          expiresAt: new Date(sessionData.expiresAt),
        })
      }
    }
  }

  const setupActivityTracking = () => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']
    let lastActivityTime = Date.now()

    const trackActivity = () => {
      const now = Date.now()
      if (now - lastActivityTime > 60000) { // Only track every minute
        lastActivityTime = now
        sessionService.updateActivity()
        setSessionState(prev => ({ ...prev, lastActivity: new Date() }))
      }
    }

    events.forEach(event => document.addEventListener(event, trackActivity, true))
    return () => events.forEach(event => document.removeEventListener(event, trackActivity, true))
  }

  const setupExpirationCheck = () => {
    const interval = setInterval(() => {
      if (sessionState.expiresAt && new Date() > sessionState.expiresAt) {
        endSession()
      }
    }, 60000) // Check every minute

    return () => clearInterval(interval)
  }

  const renewSession = async () => {
    if (sessionState.sessionId) {
      await sessionService.renewSession(sessionState.sessionId)
      const sessionData = await sessionService.getSessionInfo(sessionState.sessionId)
      if (sessionData) {
        setSessionState(prev => ({
          ...prev,
          expiresAt: new Date(sessionData.expiresAt),
        }))
      }
    }
  }

  const endSession = async () => {
    if (sessionState.sessionId) {
      await sessionService.destroySession(sessionState.sessionId)
      setSessionState({
        sessionId: null,
        isActive: false,
        lastActivity: null,
        expiresAt: null,
      })
    }
  }

  const endAllSessions = async () => {
    await sessionService.destroyAllSessions()
    await endSession()
  }

  return (
    <SessionContext.Provider value={{
      ...sessionState,
      renewSession,
      endSession,
      endAllSessions,
    }}>
      {children}
    </SessionContext.Provider>
  )
}

export const useSession = () => {
  const context = useContext(SessionContext)
  if (!context) throw new Error('useSession must be used within SessionProvider')
  return context
}
```

This session management system provides enterprise-level session handling with security, multi-device support, and comprehensive session lifecycle management.
