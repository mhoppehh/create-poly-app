# Role-Based Access Control (RBAC)

## Overview

Comprehensive role and permission system for fine-grained access control in web applications, with GraphQL directive-based authorization and frontend route protection.

## Priority

**HIGH** - Essential for multi-user applications with varying access levels

## Dependencies

- `apollo-server` (for GraphQL authorization directives)
- `vite` (for frontend route protection)
- `prisma` (for role and permission storage)
- `jwt-auth` (for user context in authorization)

## Feature Description

Implements a flexible RBAC system with hierarchical roles, granular permissions, and seamless integration with GraphQL resolvers and React components.

### Key Features

- **Hierarchical Roles**: Admin > Manager > User > Guest structure
- **Granular Permissions**: Resource-based permissions (read, write, delete, admin)
- **GraphQL Directives**: `@auth`, `@hasRole`, `@hasPermission` directives
- **Frontend Guards**: Route and component-level protection
- **Dynamic Role Assignment**: Runtime role and permission management

## Configuration

```typescript
interface RBACConfig {
  defaultRole: string
  roles: Role[]
  permissions: Permission[]
  features: {
    hierarchicalRoles: boolean
    dynamicPermissions: boolean
    roleInheritance: boolean
    auditLogging: boolean
  }
  graphql: {
    enableDirectives: boolean
    defaultRequireAuth: boolean
  }
  frontend: {
    enableRouteGuards: boolean
    enableComponentGuards: boolean
    fallbackRoute: string
  }
}

interface Role {
  id: string
  name: string
  description: string
  level: number // For hierarchy
  permissions: string[]
  inheritsFrom?: string[] // Role inheritance
}

interface Permission {
  id: string
  name: string
  resource: string
  action: string // 'create', 'read', 'update', 'delete', 'admin'
  description: string
}
```

## Generated Files

### Backend Implementation

```
api/src/
├── auth/
│   ├── rbac/
│   │   ├── index.ts              # RBAC exports
│   │   ├── service.ts            # RBAC service logic
│   │   ├── directives/
│   │   │   ├── auth.ts           # @auth directive
│   │   │   ├── hasRole.ts        # @hasRole directive
│   │   │   ├── hasPermission.ts  # @hasPermission directive
│   │   │   └── index.ts          # Directive exports
│   │   ├── middleware.ts         # RBAC middleware
│   │   ├── decorators.ts         # Method decorators
│   │   └── types.ts              # RBAC type definitions
│   └── resolvers/
│       ├── roleResolvers.ts      # Role management resolvers
│       └── permissionResolvers.ts # Permission management resolvers
```

### Frontend Implementation

```
web/src/
├── auth/
│   ├── rbac/
│   │   ├── index.ts              # RBAC exports
│   │   ├── context.tsx           # RBAC context provider
│   │   ├── hooks/
│   │   │   ├── useRoles.ts       # Role management hook
│   │   │   ├── usePermissions.ts # Permission checking hook
│   │   │   └── useAuthorization.ts # Authorization hook
│   │   ├── guards/
│   │   │   ├── RouteGuard.tsx    # Route protection component
│   │   │   ├── PermissionGuard.tsx # Permission-based guard
│   │   │   └── RoleGuard.tsx     # Role-based guard
│   │   ├── components/
│   │   │   ├── RoleSelector.tsx  # Role selection UI
│   │   │   ├── PermissionList.tsx # Permission display
│   │   │   └── AccessDenied.tsx  # Access denied page
│   │   └── utils/
│   │       ├── permissions.ts    # Permission utilities
│   │       └── roleHierarchy.ts  # Role hierarchy logic
```

## Code Examples

### RBAC Service (Backend)

```typescript
// api/src/auth/rbac/service.ts
import { PrismaClient } from '@prisma/client'

export class RBACService {
  constructor(
    private prisma: PrismaClient,
    private config: RBACConfig,
  ) {}

  async hasRole(userId: string, roleName: string): Promise<boolean> {
    const userRoles = await this.getUserRoles(userId)

    if (this.config.features.hierarchicalRoles) {
      return this.checkRoleHierarchy(userRoles, roleName)
    }

    return userRoles.some(role => role.name === roleName)
  }

  async hasPermission(userId: string, resource: string, action: string): Promise<boolean> {
    const userRoles = await this.getUserRoles(userId)
    const permissions = await this.getRolePermissions(userRoles.map(r => r.id))

    return permissions.some(
      permission => permission.resource === resource && (permission.action === action || permission.action === 'admin'),
    )
  }

  async assignRole(userId: string, roleId: string, assignedBy: string): Promise<void> {
    const role = await this.prisma.role.findUnique({ where: { id: roleId } })
    if (!role) throw new Error('Role not found')

    // Check if assigner has permission to assign this role
    const canAssign = await this.hasPermission(assignedBy, 'users', 'admin')
    if (!canAssign) throw new Error('Insufficient permissions to assign role')

    await this.prisma.userRole.create({
      data: {
        userId,
        roleId,
        assignedBy,
        assignedAt: new Date(),
      },
    })

    if (this.config.features.auditLogging) {
      await this.logRoleChange('ASSIGN', userId, roleId, assignedBy)
    }
  }

  async revokeRole(userId: string, roleId: string, revokedBy: string): Promise<void> {
    const canRevoke = await this.hasPermission(revokedBy, 'users', 'admin')
    if (!canRevoke) throw new Error('Insufficient permissions to revoke role')

    await this.prisma.userRole.deleteMany({
      where: { userId, roleId },
    })

    if (this.config.features.auditLogging) {
      await this.logRoleChange('REVOKE', userId, roleId, revokedBy)
    }
  }

  private async getUserRoles(userId: string) {
    const userRoles = await this.prisma.userRole.findMany({
      where: { userId },
      include: { role: true },
    })
    return userRoles.map(ur => ur.role)
  }

  private async getRolePermissions(roleIds: string[]) {
    const rolePermissions = await this.prisma.rolePermission.findMany({
      where: { roleId: { in: roleIds } },
      include: { permission: true },
    })
    return rolePermissions.map(rp => rp.permission)
  }

  private checkRoleHierarchy(userRoles: any[], requiredRole: string): boolean {
    const requiredRoleObj = this.config.roles.find(r => r.name === requiredRole)
    if (!requiredRoleObj) return false

    return userRoles.some(userRole => {
      const userRoleObj = this.config.roles.find(r => r.name === userRole.name)
      return userRoleObj && userRoleObj.level >= requiredRoleObj.level
    })
  }

  private async logRoleChange(action: string, userId: string, roleId: string, performedBy: string) {
    await this.prisma.auditLog.create({
      data: {
        action: `ROLE_${action}`,
        resource: 'User',
        resourceId: userId,
        details: { roleId, performedBy },
        performedBy,
        performedAt: new Date(),
      },
    })
  }
}
```

### GraphQL Authorization Directives

```typescript
// api/src/auth/rbac/directives/hasRole.ts
import { SchemaDirectiveVisitor } from 'graphql-tools'
import { AuthenticationError, ForbiddenError } from 'apollo-server-express'
import { RBACService } from '../service'

export class HasRoleDirective extends SchemaDirectiveVisitor {
  visitFieldDefinition(field: any) {
    const { resolve = defaultFieldResolver } = field
    const roles = this.args.roles || []

    field.resolve = async function (source: any, args: any, context: any, info: any) {
      const { user, rbacService }: { user: any; rbacService: RBACService } = context

      if (!user) {
        throw new AuthenticationError('Authentication required')
      }

      // Check if user has any of the required roles
      const hasRequiredRole = await Promise.all(roles.map((role: string) => rbacService.hasRole(user.userId, role)))

      if (!hasRequiredRole.some(Boolean)) {
        throw new ForbiddenError(`Access denied. Required roles: ${roles.join(', ')}`)
      }

      return resolve.call(this, source, args, context, info)
    }
  }
}

// Usage in GraphQL schema:
// type Query {
//   adminOnlyData: [User!]! @hasRole(roles: ["ADMIN"])
//   managerData: [Report!]! @hasRole(roles: ["ADMIN", "MANAGER"])
// }
```

### Permission Guard Component (Frontend)

```typescript
// web/src/auth/rbac/guards/PermissionGuard.tsx
import React from 'react'
import { usePermissions } from '../hooks/usePermissions'
import { AccessDenied } from '../components/AccessDenied'

interface PermissionGuardProps {
  resource: string
  action: string
  fallback?: React.ComponentType
  children: React.ReactNode
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  resource,
  action,
  fallback: Fallback = AccessDenied,
  children,
}) => {
  const { hasPermission, isLoading } = usePermissions()

  if (isLoading) {
    return <div className="flex justify-center p-4">Loading...</div>
  }

  if (!hasPermission(resource, action)) {
    return <Fallback />
  }

  return <>{children}</>
}

// Usage:
// <PermissionGuard resource="posts" action="create">
//   <CreatePostButton />
// </PermissionGuard>
```

### Authorization Hook (Frontend)

```typescript
// web/src/auth/rbac/hooks/useAuthorization.ts
import { useContext, useCallback } from 'react'
import { RBACContext } from '../context'

export const useAuthorization = () => {
  const context = useContext(RBACContext)
  if (!context) throw new Error('useAuthorization must be used within RBACProvider')

  const { userRoles, userPermissions, isLoading } = context

  const hasRole = useCallback(
    (roleName: string): boolean => {
      return userRoles.some(role => role.name === roleName)
    },
    [userRoles],
  )

  const hasAnyRole = useCallback(
    (roleNames: string[]): boolean => {
      return roleNames.some(roleName => hasRole(roleName))
    },
    [hasRole],
  )

  const hasPermission = useCallback(
    (resource: string, action: string): boolean => {
      return userPermissions.some(
        permission =>
          permission.resource === resource && (permission.action === action || permission.action === 'admin'),
      )
    },
    [userPermissions],
  )

  const hasAnyPermission = useCallback(
    (permissions: Array<{ resource: string; action: string }>): boolean => {
      return permissions.some(({ resource, action }) => hasPermission(resource, action))
    },
    [hasPermission],
  )

  const isAdmin = useCallback((): boolean => {
    return hasRole('ADMIN') || hasPermission('*', 'admin')
  }, [hasRole, hasPermission])

  const canAccess = useCallback(
    (requirements: {
      roles?: string[]
      permissions?: Array<{ resource: string; action: string }>
      requireAll?: boolean
    }): boolean => {
      const { roles = [], permissions = [], requireAll = false } = requirements

      const roleCheck = roles.length === 0 || (requireAll ? roles.every(role => hasRole(role)) : hasAnyRole(roles))

      const permissionCheck =
        permissions.length === 0 ||
        (requireAll
          ? permissions.every(({ resource, action }) => hasPermission(resource, action))
          : hasAnyPermission(permissions))

      return roleCheck && permissionCheck
    },
    [hasRole, hasAnyRole, hasPermission, hasAnyPermission],
  )

  return {
    hasRole,
    hasAnyRole,
    hasPermission,
    hasAnyPermission,
    isAdmin,
    canAccess,
    userRoles,
    userPermissions,
    isLoading,
  }
}
```

### Route Protection with RBAC

```typescript
// web/src/auth/rbac/guards/RouteGuard.tsx
import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthorization } from '../hooks/useAuthorization'

interface RouteGuardProps {
  roles?: string[]
  permissions?: Array<{resource: string, action: string}>
  requireAll?: boolean
  fallbackPath?: string
  children: React.ReactNode
}

export const RouteGuard: React.FC<RouteGuardProps> = ({
  roles = [],
  permissions = [],
  requireAll = false,
  fallbackPath = '/access-denied',
  children,
}) => {
  const { canAccess, isLoading } = useAuthorization()
  const location = useLocation()

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>
  }

  if (!canAccess({ roles, permissions, requireAll })) {
    return <Navigate to={fallbackPath} state={{ from: location }} replace />
  }

  return <>{children}</>
}

// Usage in router:
// <Route path="/admin/*" element={
//   <RouteGuard roles={['ADMIN']}>
//     <AdminDashboard />
//   </RouteGuard>
// } />
```

## Database Schema

```prisma
// Add to schema.prisma
model Role {
  id          String   @id @default(cuid())
  name        String   @unique
  description String?
  level       Int      @default(0) // For hierarchy
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  userRoles       UserRole[]
  rolePermissions RolePermission[]

  @@map("roles")
}

model Permission {
  id          String   @id @default(cuid())
  name        String   @unique
  resource    String   // e.g., 'posts', 'users', 'reports'
  action      String   // e.g., 'create', 'read', 'update', 'delete', 'admin'
  description String?
  createdAt   DateTime @default(now())

  rolePermissions RolePermission[]

  @@unique([resource, action])
  @@map("permissions")
}

model UserRole {
  id         String    @id @default(cuid())
  userId     String
  roleId     String
  assignedBy String
  assignedAt DateTime  @default(now())
  expiresAt  DateTime?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  role Role @relation(fields: [roleId], references: [id], onDelete: Cascade)

  @@unique([userId, roleId])
  @@map("user_roles")
}

model RolePermission {
  id           String @id @default(cuid())
  roleId       String
  permissionId String

  role       Role       @relation(fields: [roleId], references: [id], onDelete: Cascade)
  permission Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)

  @@unique([roleId, permissionId])
  @@map("role_permissions")
}

// Extend User model
model User {
  id        String     @id @default(cuid())
  email     String     @unique
  userRoles UserRole[]
  // ... other user fields
}
```

## Installation Steps

1. **Install Dependencies**

   ```bash
   # Backend
   pnpm add graphql-tools

   # Frontend
   pnpm add react-router-dom
   ```

2. **Database Migration**

   ```bash
   pnpm prisma migrate dev --name add-rbac-system
   ```

3. **Seed Default Roles**
   ```typescript
   // Seed script
   await prisma.role.createMany({
     data: [
       { name: 'GUEST', level: 0, description: 'Guest user' },
       { name: 'USER', level: 10, description: 'Regular user' },
       { name: 'MANAGER', level: 50, description: 'Manager' },
       { name: 'ADMIN', level: 100, description: 'Administrator' },
     ],
   })
   ```

This RBAC system provides enterprise-grade authorization with flexible roles, granular permissions, and seamless integration across the full stack.
