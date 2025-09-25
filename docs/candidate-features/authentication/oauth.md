# OAuth Provider Integration

## Overview

Complete OAuth 2.0 integration supporting multiple providers (Google, GitHub, Discord, Microsoft) for seamless social authentication.

## Priority

**HIGH** - Essential for user-friendly authentication

## Dependencies

- `apollo-server` (for OAuth callback handling)
- `vite` (for OAuth redirect flows)
- `prisma` (for user account linking)
- `jwt-auth` (optional, for token generation after OAuth)

## Feature Description

Implements OAuth 2.0 authentication flows with multiple provider support, account linking, and profile synchronization.

### Supported Providers

- **Google OAuth 2.0**: Gmail integration and Google services
- **GitHub OAuth**: Developer-focused authentication
- **Discord OAuth**: Gaming and community platforms
- **Microsoft Azure AD**: Enterprise authentication
- **Custom Providers**: Extensible for additional OAuth providers

### Key Features

- OAuth redirect flow handling
- Account linking for existing users
- Profile data synchronization
- Provider-specific scopes and permissions
- Error handling and fallbacks

## Configuration

```typescript
interface OAuthConfig {
  providers: {
    google?: {
      clientId: string
      clientSecret: string
      scopes: string[]
      callbackUrl: string
    }
    github?: {
      clientId: string
      clientSecret: string
      scopes: string[]
      callbackUrl: string
    }
    discord?: {
      clientId: string
      clientSecret: string
      scopes: string[]
      callbackUrl: string
    }
    microsoft?: {
      clientId: string
      clientSecret: string
      tenantId: string
      scopes: string[]
      callbackUrl: string
    }
  }
  features: {
    accountLinking: boolean
    profileSync: boolean
    autoCreateUser: boolean
  }
  redirects: {
    success: string
    error: string
    signup: string
  }
}
```

## Generated Files

### Backend Implementation

```
api/src/
├── auth/
│   ├── oauth/
│   │   ├── index.ts              # OAuth exports
│   │   ├── providers/
│   │   │   ├── google.ts         # Google OAuth implementation
│   │   │   ├── github.ts         # GitHub OAuth implementation
│   │   │   ├── discord.ts        # Discord OAuth implementation
│   │   │   ├── microsoft.ts      # Microsoft OAuth implementation
│   │   │   └── base.ts           # Base OAuth provider class
│   │   ├── routes.ts             # OAuth callback routes
│   │   ├── service.ts            # OAuth service logic
│   │   └── types.ts              # OAuth type definitions
│   └── resolvers/
│       └── authResolvers.ts      # GraphQL OAuth mutations
```

### Frontend Implementation

```
web/src/
├── auth/
│   ├── oauth/
│   │   ├── index.ts              # OAuth exports
│   │   ├── providers/
│   │   │   ├── GoogleLogin.tsx   # Google login button
│   │   │   ├── GithubLogin.tsx   # GitHub login button
│   │   │   ├── DiscordLogin.tsx  # Discord login button
│   │   │   └── MicrosoftLogin.tsx # Microsoft login button
│   │   ├── OAuthCallback.tsx     # OAuth callback handler
│   │   ├── OAuthService.ts       # OAuth client service
│   │   └── hooks/
│   │       ├── useOAuth.ts       # OAuth hook
│   │       └── useOAuthCallback.ts # Callback handling hook
│   └── components/
│       ├── SocialLoginButtons.tsx # Combined social login UI
│       └── AccountLinking.tsx    # Account linking interface
```

## Code Examples

### Google OAuth Provider (Backend)

```typescript
// api/src/auth/oauth/providers/google.ts
import { OAuth2Client } from 'google-auth-library'
import { BaseOAuthProvider } from './base'

export class GoogleOAuthProvider extends BaseOAuthProvider {
  private client: OAuth2Client

  constructor(config: GoogleOAuthConfig) {
    super('google', config)
    this.client = new OAuth2Client(config.clientId, config.clientSecret, config.callbackUrl)
  }

  getAuthUrl(state?: string): string {
    return this.client.generateAuthUrl({
      access_type: 'offline',
      scope: this.config.scopes,
      state: state,
      prompt: 'consent',
    })
  }

  async handleCallback(code: string, state?: string) {
    try {
      const { tokens } = await this.client.getToken(code)
      this.client.setCredentials(tokens)

      const ticket = await this.client.verifyIdToken({
        idToken: tokens.id_token!,
        audience: this.config.clientId,
      })

      const payload = ticket.getPayload()
      if (!payload) throw new Error('Invalid token payload')

      return {
        providerId: 'google',
        providerUserId: payload.sub,
        email: payload.email!,
        name: payload.name || `${payload.given_name} ${payload.family_name}`,
        avatar: payload.picture,
        emailVerified: payload.email_verified || false,
        profile: {
          firstName: payload.given_name,
          lastName: payload.family_name,
          locale: payload.locale,
        },
        tokens: {
          accessToken: tokens.access_token!,
          refreshToken: tokens.refresh_token,
          expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
        },
      }
    } catch (error) {
      throw new Error(`Google OAuth error: ${error.message}`)
    }
  }

  async refreshToken(refreshToken: string) {
    this.client.setCredentials({ refresh_token: refreshToken })
    const { credentials } = await this.client.refreshAccessToken()
    return {
      accessToken: credentials.access_token!,
      refreshToken: credentials.refresh_token || refreshToken,
      expiresAt: credentials.expiry_date ? new Date(credentials.expiry_date) : undefined,
    }
  }
}
```

### OAuth Service (Backend)

```typescript
// api/src/auth/oauth/service.ts
import { PrismaClient } from '@prisma/client'
import { GoogleOAuthProvider } from './providers/google'
import { GitHubOAuthProvider } from './providers/github'

export class OAuthService {
  private providers: Map<string, BaseOAuthProvider>

  constructor(
    private prisma: PrismaClient,
    private config: OAuthConfig,
  ) {
    this.providers = new Map()

    if (config.providers.google) {
      this.providers.set('google', new GoogleOAuthProvider(config.providers.google))
    }
    if (config.providers.github) {
      this.providers.set('github', new GitHubOAuthProvider(config.providers.github))
    }
    // Add other providers...
  }

  getAuthUrl(provider: string, redirectUrl?: string): string {
    const providerInstance = this.providers.get(provider)
    if (!providerInstance) throw new Error(`Provider ${provider} not configured`)

    const state = redirectUrl ? Buffer.from(redirectUrl).toString('base64') : undefined
    return providerInstance.getAuthUrl(state)
  }

  async handleCallback(provider: string, code: string, state?: string) {
    const providerInstance = this.providers.get(provider)
    if (!providerInstance) throw new Error(`Provider ${provider} not configured`)

    const oauthResult = await providerInstance.handleCallback(code, state)

    // Check if user exists by OAuth provider
    let oauthAccount = await this.prisma.oAuthAccount.findUnique({
      where: {
        providerId_providerUserId: {
          providerId: oauthResult.providerId,
          providerUserId: oauthResult.providerUserId,
        },
      },
      include: { user: true },
    })

    let user = oauthAccount?.user

    if (!user && this.config.features.accountLinking) {
      // Try to find user by email for account linking
      user = await this.prisma.user.findUnique({
        where: { email: oauthResult.email },
      })
    }

    if (!user && this.config.features.autoCreateUser) {
      // Create new user
      user = await this.prisma.user.create({
        data: {
          email: oauthResult.email,
          name: oauthResult.name,
          avatar: oauthResult.avatar,
          emailVerified: oauthResult.emailVerified,
        },
      })
    }

    if (!user) {
      throw new Error('User account not found and auto-creation is disabled')
    }

    // Create or update OAuth account
    if (!oauthAccount) {
      oauthAccount = await this.prisma.oAuthAccount.create({
        data: {
          userId: user.id,
          providerId: oauthResult.providerId,
          providerUserId: oauthResult.providerUserId,
          accessToken: oauthResult.tokens.accessToken,
          refreshToken: oauthResult.tokens.refreshToken,
          expiresAt: oauthResult.tokens.expiresAt,
          profile: oauthResult.profile,
        },
      })
    } else {
      // Update tokens
      await this.prisma.oAuthAccount.update({
        where: { id: oauthAccount.id },
        data: {
          accessToken: oauthResult.tokens.accessToken,
          refreshToken: oauthResult.tokens.refreshToken,
          expiresAt: oauthResult.tokens.expiresAt,
          profile: this.config.features.profileSync ? oauthResult.profile : undefined,
        },
      })
    }

    // Update user profile if sync is enabled
    if (this.config.features.profileSync) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          name: oauthResult.name,
          avatar: oauthResult.avatar,
        },
      })
    }

    return { user, oauthAccount }
  }
}
```

### OAuth Login Component (Frontend)

```typescript
// web/src/auth/oauth/providers/GoogleLogin.tsx
import React from 'react'
import { useOAuth } from '../hooks/useOAuth'

interface GoogleLoginProps {
  onSuccess?: (user: any) => void
  onError?: (error: Error) => void
  redirectUrl?: string
  disabled?: boolean
  children?: React.ReactNode
}

export const GoogleLogin: React.FC<GoogleLoginProps> = ({
  onSuccess,
  onError,
  redirectUrl,
  disabled,
  children,
}) => {
  const { initiateOAuth, isLoading } = useOAuth()

  const handleLogin = async () => {
    try {
      await initiateOAuth('google', redirectUrl)
    } catch (error) {
      onError?.(error as Error)
    }
  }

  return (
    <button
      onClick={handleLogin}
      disabled={disabled || isLoading}
      className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
    >
      {children || (
        <>
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          {isLoading ? 'Connecting...' : 'Continue with Google'}
        </>
      )}
    </button>
  )
}
```

### OAuth Hook (Frontend)

```typescript
// web/src/auth/oauth/hooks/useOAuth.ts
import { useState } from 'react'
import { OAuthService } from '../OAuthService'

export const useOAuth = () => {
  const [isLoading, setIsLoading] = useState(false)
  const oauthService = new OAuthService()

  const initiateOAuth = async (provider: string, redirectUrl?: string) => {
    setIsLoading(true)
    try {
      const authUrl = await oauthService.getAuthUrl(provider, redirectUrl)
      window.location.href = authUrl
    } catch (error) {
      setIsLoading(false)
      throw error
    }
  }

  const handleCallback = async (provider: string, code: string, state?: string) => {
    setIsLoading(true)
    try {
      const result = await oauthService.handleCallback(provider, code, state)
      setIsLoading(false)
      return result
    } catch (error) {
      setIsLoading(false)
      throw error
    }
  }

  return {
    initiateOAuth,
    handleCallback,
    isLoading,
  }
}
```

## Environment Configuration

```env
# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# GitHub OAuth
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Discord OAuth
DISCORD_CLIENT_ID=your-discord-client-id
DISCORD_CLIENT_SECRET=your-discord-client-secret

# Microsoft OAuth
MICROSOFT_CLIENT_ID=your-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret
MICROSOFT_TENANT_ID=your-tenant-id

# OAuth Configuration
OAUTH_SUCCESS_REDIRECT=/dashboard
OAUTH_ERROR_REDIRECT=/login?error=oauth
```

## Database Schema

```prisma
// Add to schema.prisma
model OAuthAccount {
  id              String    @id @default(cuid())
  userId          String
  providerId      String    // 'google', 'github', etc.
  providerUserId  String    // Provider's user ID
  accessToken     String
  refreshToken    String?
  expiresAt       DateTime?
  profile         Json?     // Provider-specific profile data
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([providerId, providerUserId])
  @@map("oauth_accounts")
}

model User {
  id            String         @id @default(cuid())
  email         String         @unique
  name          String?
  avatar        String?
  emailVerified Boolean        @default(false)
  oauthAccounts OAuthAccount[]
  // ... other user fields
}
```

## Installation Steps

1. **Install Dependencies**

   ```bash
   # Backend
   pnpm add google-auth-library @octokit/oauth-app passport

   # Frontend
   pnpm add query-string
   ```

2. **Configure OAuth Applications**
   - Register applications with each provider
   - Configure callback URLs
   - Set up required scopes

3. **Database Migration**
   ```bash
   pnpm prisma migrate dev --name add-oauth-accounts
   ```

This OAuth integration provides a complete social authentication system with support for major providers and enterprise features like account linking and profile synchronization.
