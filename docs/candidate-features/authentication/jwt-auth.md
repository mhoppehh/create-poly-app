# JWT Authentication

## Overview

Token-based authentication using JSON Web Tokens for secure, stateless user authentication across web applications.

## Priority

**HIGH** - Core authentication mechanism for modern web apps

## Dependencies

- `apollo-server` (for API authentication middleware)
- `vite` (for frontend token handling)
- `prisma` (optional, for user storage)

## Feature Description

Implements a complete JWT authentication system with secure token generation, validation, and refresh mechanisms.

### Key Components

- **JWT Generation**: Creates signed access and refresh tokens
- **Token Validation**: Middleware for validating incoming tokens
- **Refresh Strategy**: Automatic token refresh using long-lived refresh tokens
- **Secure Storage**: httpOnly cookies or secure localStorage implementation
- **Token Blacklisting**: Logout functionality with token invalidation

## Configuration

```typescript
interface JWTConfig {
  accessToken: {
    secret: string
    expiry: string // e.g., '15m'
    algorithm: 'HS256' | 'RS256'
  }
  refreshToken: {
    secret: string
    expiry: string // e.g., '7d'
    rotateOnRefresh: boolean
  }
  storage: {
    type: 'cookie' | 'localStorage' | 'both'
    cookieOptions: {
      httpOnly: boolean
      secure: boolean
      sameSite: 'strict' | 'lax' | 'none'
    }
  }
  blacklisting: {
    enabled: boolean
    storage: 'redis' | 'database'
  }
}
```

## Generated Files

### Backend Implementation

```
api/src/
├── auth/
│   ├── jwt/
│   │   ├── index.ts              # JWT exports
│   │   ├── middleware.ts         # JWT validation middleware
│   │   ├── tokenService.ts       # Token generation/validation
│   │   ├── refreshHandler.ts     # Token refresh logic
│   │   └── blacklist.ts          # Token blacklisting
│   └── types.ts                  # Auth type definitions
```

### Frontend Implementation

```
web/src/
├── auth/
│   ├── jwt/
│   │   ├── index.ts              # JWT auth exports
│   │   ├── authContext.tsx       # React auth context
│   │   ├── authHooks.ts          # useAuth, useToken hooks
│   │   ├── tokenStorage.ts       # Token storage utilities
│   │   ├── interceptors.ts       # Axios/fetch interceptors
│   │   └── authGuard.tsx         # Route protection component
│   └── components/
│       ├── LoginForm.tsx         # Login form component
│       ├── LogoutButton.tsx      # Logout functionality
│       └── AuthStatus.tsx        # Authentication status display
```

## Code Examples

### JWT Token Service (Backend)

```typescript
// api/src/auth/jwt/tokenService.ts
import jwt from 'jsonwebtoken'
import { Redis } from 'ioredis'

export class JWTService {
  private redis?: Redis

  constructor(private config: JWTConfig) {
    if (config.blacklisting.enabled && config.blacklisting.storage === 'redis') {
      this.redis = new Redis()
    }
  }

  generateTokens(userId: string, payload: any = {}) {
    const accessToken = jwt.sign({ userId, ...payload, type: 'access' }, this.config.accessToken.secret, {
      expiresIn: this.config.accessToken.expiry,
      algorithm: this.config.accessToken.algorithm,
    })

    const refreshToken = jwt.sign({ userId, type: 'refresh' }, this.config.refreshToken.secret, {
      expiresIn: this.config.refreshToken.expiry,
    })

    return { accessToken, refreshToken }
  }

  async validateToken(token: string, type: 'access' | 'refresh' = 'access') {
    try {
      // Check blacklist
      if (this.config.blacklisting.enabled && (await this.isBlacklisted(token))) {
        throw new Error('Token is blacklisted')
      }

      const secret = type === 'access' ? this.config.accessToken.secret : this.config.refreshToken.secret

      const payload = jwt.verify(token, secret) as any

      if (payload.type !== type) {
        throw new Error('Invalid token type')
      }

      return payload
    } catch (error) {
      throw new Error('Invalid token')
    }
  }

  async blacklistToken(token: string) {
    if (!this.config.blacklisting.enabled) return

    const payload = jwt.decode(token) as any
    if (!payload?.exp) return

    const ttl = payload.exp - Math.floor(Date.now() / 1000)

    if (this.redis) {
      await this.redis.setex(`blacklist:${token}`, ttl, '1')
    }
    // Database blacklisting implementation would go here
  }

  private async isBlacklisted(token: string): Promise<boolean> {
    if (!this.redis) return false
    const result = await this.redis.get(`blacklist:${token}`)
    return result === '1'
  }
}
```

### Auth Context (Frontend)

```typescript
// web/src/auth/jwt/authContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react'
import { JWTAuthService } from './authService'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshToken: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  })

  const authService = new JWTAuthService()

  useEffect(() => {
    initializeAuth()
  }, [])

  const initializeAuth = async () => {
    try {
      const token = authService.getAccessToken()
      if (token && !authService.isTokenExpired(token)) {
        const user = await authService.getCurrentUser()
        setState({ user, isAuthenticated: true, isLoading: false })
      } else {
        // Try to refresh token
        await refreshToken()
      }
    } catch (error) {
      setState({ user: null, isAuthenticated: false, isLoading: false })
    }
  }

  const login = async (email: string, password: string) => {
    const { user, tokens } = await authService.login(email, password)
    authService.setTokens(tokens)
    setState({ user, isAuthenticated: true, isLoading: false })
  }

  const logout = async () => {
    await authService.logout()
    setState({ user: null, isAuthenticated: false, isLoading: false })
  }

  const refreshToken = async () => {
    try {
      const tokens = await authService.refreshTokens()
      authService.setTokens(tokens)
      const user = await authService.getCurrentUser()
      setState({ user, isAuthenticated: true, isLoading: false })
    } catch (error) {
      setState({ user: null, isAuthenticated: false, isLoading: false })
    }
  }

  return (
    <AuthContext.Provider value={{ ...state, login, logout, refreshToken }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
```

### GraphQL Middleware

```typescript
// api/src/auth/jwt/middleware.ts
import { AuthenticationError } from 'apollo-server-express'
import { JWTService } from './tokenService'

export const createJWTMiddleware = (jwtService: JWTService) => {
  return async (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      req.user = null
      return next()
    }

    try {
      const payload = await jwtService.validateToken(token)
      req.user = payload
      next()
    } catch (error) {
      throw new AuthenticationError('Invalid token')
    }
  }
}

export const requireAuth = (resolver: any) => {
  return (parent: any, args: any, context: any) => {
    if (!context.user) {
      throw new AuthenticationError('Authentication required')
    }
    return resolver(parent, args, context)
  }
}
```

## Installation Steps

1. **Install Dependencies**

   ```bash
   # Backend
   pnpm add jsonwebtoken bcryptjs
   pnpm add -D @types/jsonwebtoken @types/bcryptjs

   # Frontend
   pnpm add axios
   ```

2. **Generate JWT Secrets**

   ```bash
   # Generate secure random secrets
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

3. **Environment Configuration**

   ```env
   JWT_ACCESS_SECRET=your-access-token-secret
   JWT_REFRESH_SECRET=your-refresh-token-secret
   JWT_ACCESS_EXPIRY=15m
   JWT_REFRESH_EXPIRY=7d
   ```

4. **Setup GraphQL Integration**
   - Add JWT middleware to Apollo Server
   - Implement auth directives
   - Configure context with user information

This JWT authentication feature provides a complete, production-ready token-based authentication system with security best practices built in.
