# Authentication & Authorization

## Overview

A comprehensive authentication and authorization system for modern web applications, supporting multiple authentication strategies, role-based access control, and secure session management.

## Priority

**HIGH** - Essential for most production applications

## Dependencies

- `apollo-server` (for API authentication)
- `vite` (for frontend auth components)
- `prisma` (optional, for user storage)

## Feature Components

### 1. JWT Authentication

- **Description**: Token-based authentication using JSON Web Tokens
- **Implementation**:
  - JWT generation and validation middleware
  - Access token (short-lived) and refresh token (long-lived) strategy
  - Secure token storage on frontend (httpOnly cookies or secure localStorage)
  - Token blacklisting for logout functionality

### 2. OAuth Provider Integration

- **Supported Providers**:
  - Google OAuth 2.0
  - GitHub OAuth
  - Discord OAuth
  - Microsoft Azure AD
- **Implementation**:
  - OAuth redirect flow handling
  - Account linking for existing users
  - Profile data synchronization

### 3. Role-Based Access Control (RBAC)

- **Components**:
  - User roles and permissions system
  - GraphQL directive-based authorization (`@auth`, `@hasRole`)
  - Frontend route protection
  - Component-level permission checks
- **Default Roles**: Admin, User, Guest (customizable)

### 4. Session Management

- **Features**:
  - Secure session storage
  - Session expiration handling
  - Multi-device session management
  - Force logout from all devices

### 5. Password Management

- **Features**:
  - Password hashing with bcrypt/argon2
  - Password strength validation
  - Password reset flow with email verification
  - Password history prevention

## Configuration Options

```typescript
interface AuthConfig {
  strategy: 'jwt' | 'session' | 'both'
  providers: {
    google?: GoogleOAuthConfig
    github?: GitHubOAuthConfig
    discord?: DiscordOAuthConfig
  }
  jwt: {
    accessTokenExpiry: string // e.g., '15m'
    refreshTokenExpiry: string // e.g., '7d'
    secret: string
  }
  password: {
    minLength: number
    requireSymbols: boolean
    requireNumbers: boolean
    requireUppercase: boolean
  }
  rbac: {
    defaultRole: string
    customRoles: Role[]
  }
}
```

## Generated Files

### Backend (API)

```
api/src/
├── auth/
│   ├── index.ts                    # Auth module exports
│   ├── jwt.ts                      # JWT utilities
│   ├── middleware.ts               # Auth middleware
│   ├── resolvers.ts                # Auth GraphQL resolvers
│   ├── types.ts                    # Auth type definitions
│   └── providers/
│       ├── google.ts               # Google OAuth
│       ├── github.ts               # GitHub OAuth
│       └── discord.ts              # Discord OAuth
├── middleware/
│   ├── auth.ts                     # Authentication middleware
│   └── rbac.ts                     # Authorization middleware
└── schema/
    └── auth.graphql                # Auth GraphQL schema
```

### Frontend (Web)

```
web/src/
├── auth/
│   ├── index.ts                    # Auth exports
│   ├── AuthProvider.tsx            # React context provider
│   ├── hooks/
│   │   ├── useAuth.ts              # Main auth hook
│   │   ├── useLogin.ts             # Login functionality
│   │   └── usePermissions.ts       # Permission checking
│   ├── components/
│   │   ├── LoginForm.tsx           # Login form component
│   │   ├── SignupForm.tsx          # Registration form
│   │   ├── PasswordReset.tsx       # Password reset form
│   │   ├── OAuthButtons.tsx        # Social login buttons
│   │   └── ProtectedRoute.tsx      # Route protection
│   └── utils/
│       ├── auth.ts                 # Auth utilities
│       ├── storage.ts              # Token storage
│       └── permissions.ts          # Permission helpers
```

### Database Schema (if Prisma is enabled)

```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  username      String?   @unique
  passwordHash  String?
  firstName     String?
  lastName      String?
  avatar        String?
  role          Role      @default(USER)
  isEmailVerified Boolean @default(false)

  // OAuth
  googleId      String?   @unique
  githubId      String?   @unique
  discordId     String?   @unique

  // Session management
  refreshTokens RefreshToken[]
  sessions      Session[]

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model RefreshToken {
  id        String   @id @default(cuid())
  token     String   @unique
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt DateTime
  createdAt DateTime @default(now())
}

model Session {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  token     String   @unique
  userAgent String?
  ipAddress String?
  expiresAt DateTime
  createdAt DateTime @default(now())
}

enum Role {
  USER
  ADMIN
  MODERATOR
}
```

## GraphQL Schema Extensions

```graphql
type User {
  id: ID!
  email: String!
  username: String
  firstName: String
  lastName: String
  avatar: String
  role: Role!
  isEmailVerified: Boolean!
  createdAt: DateTime!
}

enum Role {
  USER
  ADMIN
  MODERATOR
}

type AuthPayload {
  user: User!
  accessToken: String!
  refreshToken: String!
}

type Query {
  me: User @auth
  users: [User!]! @hasRole(role: ADMIN)
}

type Mutation {
  # Authentication
  login(email: String!, password: String!): AuthPayload!
  register(input: RegisterInput!): AuthPayload!
  logout: Boolean! @auth
  refreshToken(token: String!): AuthPayload!

  # OAuth
  oauthLogin(provider: OAuthProvider!, code: String!): AuthPayload!

  # Password management
  requestPasswordReset(email: String!): Boolean!
  resetPassword(token: String!, newPassword: String!): Boolean!
  changePassword(currentPassword: String!, newPassword: String!): Boolean! @auth
}

input RegisterInput {
  email: String!
  password: String!
  firstName: String
  lastName: String
  username: String
}

enum OAuthProvider {
  GOOGLE
  GITHUB
  DISCORD
}
```

## Installation Scripts

1. **Install authentication dependencies**
2. **Setup JWT configuration**
3. **Configure OAuth providers**
4. **Generate auth schema and resolvers**
5. **Setup frontend auth components**
6. **Configure route protection**

## Environment Variables Required

```env
# JWT Configuration
JWT_ACCESS_SECRET=your-access-secret
JWT_REFRESH_SECRET=your-refresh-secret
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# OAuth Providers
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
DISCORD_CLIENT_ID=your-discord-client-id
DISCORD_CLIENT_SECRET=your-discord-client-secret

# Email (for password reset)
SMTP_HOST=your-smtp-host
SMTP_PORT=587
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password
```

## Usage Examples

### Frontend Hook Usage

```typescript
// Login component
const LoginComponent = () => {
  const { login, isLoading } = useLogin()

  const handleSubmit = async (email: string, password: string) => {
    try {
      await login({ email, password })
      // Redirect to dashboard
    } catch (error) {
      // Handle error
    }
  }

  return <LoginForm onSubmit={handleSubmit} loading={isLoading} />
}

// Protected route
const AdminPanel = () => {
  const { hasPermission } = usePermissions()

  if (!hasPermission('admin')) {
    return <div>Access Denied</div>
  }

  return <AdminDashboard />
}
```

### Backend Resolver Usage

```typescript
// Protected resolver
@Resolver()
export class UserResolver {
  @Query(() => User)
  @UseGuards(AuthGuard)
  async me(@CurrentUser() user: User): Promise<User> {
    return user
  }

  @Query(() => [User])
  @UseGuards(AuthGuard, RoleGuard('ADMIN'))
  async users(): Promise<User[]> {
    return this.userService.findAll()
  }
}
```

## Testing Strategy

- Unit tests for auth utilities and middleware
- Integration tests for GraphQL auth resolvers
- E2E tests for complete auth flows
- Security testing for token handling and validation
