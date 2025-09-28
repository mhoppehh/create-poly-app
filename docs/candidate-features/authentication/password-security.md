# Password Security

## Overview

Comprehensive password management system with secure hashing, strength validation, recovery flows, and security best practices.

## Priority

**HIGH** - Critical for application security

## Dependencies

- `apollo-server` (for password-related GraphQL resolvers)
- `vite` (for frontend password components)
- `prisma` (for password storage and history)
- `email-service` (for password reset emails)

## Feature Description

Advanced password security implementation with modern hashing algorithms, comprehensive validation, breach detection, and secure recovery processes.

### Key Features

- **Secure Hashing**: Argon2id or bcrypt with proper salt rounds
- **Password Strength Validation**: Configurable complexity requirements
- **Password History**: Prevent password reuse
- **Recovery Flow**: Secure email-based password reset
- **Breach Detection**: Check against known compromised passwords
- **Account Lockout**: Protection against brute force attacks

## Configuration

```typescript
interface PasswordConfig {
  hashing: {
    algorithm: 'argon2id' | 'bcrypt'
    saltRounds: number // bcrypt rounds or argon2 memory cost
    memoryCost?: number // argon2 specific
    timeCost?: number // argon2 specific
    parallelism?: number // argon2 specific
  }
  validation: {
    minLength: number
    maxLength: number
    requireUppercase: boolean
    requireLowercase: boolean
    requireNumbers: boolean
    requireSymbols: boolean
    customPattern?: RegExp
    forbidCommonPasswords: boolean
    checkBreachedPasswords: boolean
  }
  security: {
    maxLoginAttempts: number
    lockoutDurationMinutes: number
    passwordHistoryCount: number
    resetTokenExpiryMinutes: number
    forcePasswordChangeAfterDays?: number
  }
  recovery: {
    enabled: boolean
    tokenLength: number
    maxResetAttempts: number
    requireOldPassword: boolean
  }
}
```

## Generated Files

### Backend Implementation

```
api/src/
├── auth/
│   ├── password/
│   │   ├── index.ts              # Password exports
│   │   ├── service.ts            # Password service logic
│   │   ├── validation.ts         # Password validation
│   │   ├── hashing.ts            # Password hashing utilities
│   │   ├── recovery.ts           # Password recovery flow
│   │   ├── breachCheck.ts        # Compromised password checking
│   │   └── types.ts              # Password type definitions
│   └── resolvers/
│       └── passwordResolvers.ts  # Password management resolvers
```

### Frontend Implementation

```
web/src/
├── auth/
│   ├── password/
│   │   ├── index.ts              # Password exports
│   │   ├── components/
│   │   │   ├── PasswordInput.tsx # Enhanced password input
│   │   │   ├── StrengthMeter.tsx # Password strength indicator
│   │   │   ├── ChangePassword.tsx # Password change form
│   │   │   ├── ResetPassword.tsx # Password reset form
│   │   │   └── SecuritySettings.tsx # Password security settings
│   │   ├── hooks/
│   │   │   ├── usePasswordValidation.ts # Password validation hook
│   │   │   ├── usePasswordStrength.ts # Strength calculation hook
│   │   │   └── usePasswordReset.ts # Reset flow hook
│   │   └── utils/
│   │       ├── validation.ts     # Client-side validation
│   │       ├── strength.ts       # Strength calculation
│   │       └── generator.ts      # Password generation
```

## Code Examples

### Password Service (Backend)

```typescript
// api/src/auth/password/service.ts
import argon2 from 'argon2'
import bcrypt from 'bcryptjs'
import { randomBytes } from 'crypto'
import { PrismaClient } from '@prisma/client'

export class PasswordService {
  constructor(
    private prisma: PrismaClient,
    private config: PasswordConfig,
  ) {}

  async hashPassword(plainPassword: string): Promise<string> {
    if (this.config.hashing.algorithm === 'argon2id') {
      return argon2.hash(plainPassword, {
        type: argon2.argon2id,
        memoryCost: this.config.hashing.memoryCost || 65536,
        timeCost: this.config.hashing.timeCost || 3,
        parallelism: this.config.hashing.parallelism || 4,
      })
    } else {
      return bcrypt.hash(plainPassword, this.config.hashing.saltRounds)
    }
  }

  async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    if (this.config.hashing.algorithm === 'argon2id') {
      return argon2.verify(hashedPassword, plainPassword)
    } else {
      return bcrypt.compare(plainPassword, hashedPassword)
    }
  }

  async validatePasswordStrength(password: string): Promise<PasswordValidationResult> {
    const errors: string[] = []
    let score = 0

    // Length check
    if (password.length < this.config.validation.minLength) {
      errors.push(`Password must be at least ${this.config.validation.minLength} characters`)
    } else {
      score += 20
    }

    if (password.length > this.config.validation.maxLength) {
      errors.push(`Password must not exceed ${this.config.validation.maxLength} characters`)
      return { isValid: false, errors, score: 0 }
    }

    // Character type requirements
    if (this.config.validation.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter')
    } else if (this.config.validation.requireUppercase) {
      score += 15
    }

    if (this.config.validation.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter')
    } else if (this.config.validation.requireLowercase) {
      score += 15
    }

    if (this.config.validation.requireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number')
    } else if (this.config.validation.requireNumbers) {
      score += 15
    }

    if (this.config.validation.requireSymbols && !/[^A-Za-z0-9]/.test(password)) {
      errors.push('Password must contain at least one special character')
    } else if (this.config.validation.requireSymbols) {
      score += 15
    }

    // Additional complexity scoring
    if (password.length >= 12) score += 10
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 10
    if (!/(.)\1{2,}/.test(password)) score += 10 // No repeated characters

    // Common password check
    if (this.config.validation.forbidCommonPasswords) {
      const isCommon = await this.isCommonPassword(password)
      if (isCommon) {
        errors.push('This password is too common. Please choose a more unique password.')
        score = Math.min(score, 30)
      }
    }

    // Breach check
    if (this.config.validation.checkBreachedPasswords) {
      const isBreached = await this.isPasswordBreached(password)
      if (isBreached) {
        errors.push('This password has been found in data breaches. Please choose a different password.')
        score = 0
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      score: Math.min(score, 100),
    }
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void> {
    // Verify old password
    const user = await this.prisma.user.findUnique({ where: { id: userId } })
    if (!user || !(await this.verifyPassword(oldPassword, user.password))) {
      throw new Error('Current password is incorrect')
    }

    // Validate new password
    const validation = await this.validatePasswordStrength(newPassword)
    if (!validation.isValid) {
      throw new Error(`Password validation failed: ${validation.errors.join(', ')}`)
    }

    // Check password history
    if (this.config.security.passwordHistoryCount > 0) {
      const isReused = await this.isPasswordReused(userId, newPassword)
      if (isReused) {
        throw new Error(`Cannot reuse any of your last ${this.config.security.passwordHistoryCount} passwords`)
      }
    }

    // Hash new password
    const hashedPassword = await this.hashPassword(newPassword)

    // Update password and add to history
    await this.prisma.$transaction(async tx => {
      await tx.user.update({
        where: { id: userId },
        data: {
          password: hashedPassword,
          passwordChangedAt: new Date(),
        },
      })

      // Add old password to history
      await tx.passwordHistory.create({
        data: {
          userId,
          passwordHash: user.password,
          createdAt: new Date(),
        },
      })

      // Cleanup old password history
      const historyToKeep = await tx.passwordHistory.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: this.config.security.passwordHistoryCount,
      })

      if (historyToKeep.length === this.config.security.passwordHistoryCount) {
        await tx.passwordHistory.deleteMany({
          where: {
            userId,
            id: { notIn: historyToKeep.map(h => h.id) },
          },
        })
      }
    })

    // Invalidate all sessions except current
    await this.invalidateOtherSessions(userId)
  }

  async initiatePasswordReset(email: string): Promise<string> {
    const user = await this.prisma.user.findUnique({ where: { email } })
    if (!user) {
      // Still return success to prevent email enumeration
      return 'reset-initiated'
    }

    // Check for existing unexpired reset tokens
    const existingToken = await this.prisma.passwordResetToken.findFirst({
      where: {
        userId: user.id,
        expiresAt: { gt: new Date() },
        usedAt: null,
      },
    })

    if (existingToken) {
      // Optionally resend existing token or create new one
      return existingToken.token
    }

    // Generate secure reset token
    const token = randomBytes(this.config.recovery.tokenLength).toString('hex')
    const expiresAt = new Date(Date.now() + this.config.recovery.resetTokenExpiryMinutes * 60 * 1000)

    await this.prisma.passwordResetToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt,
        createdAt: new Date(),
      },
    })

    return token
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const resetToken = await this.prisma.passwordResetToken.findFirst({
      where: {
        token,
        expiresAt: { gt: new Date() },
        usedAt: null,
      },
      include: { user: true },
    })

    if (!resetToken) {
      throw new Error('Invalid or expired reset token')
    }

    // Validate new password
    const validation = await this.validatePasswordStrength(newPassword)
    if (!validation.isValid) {
      throw new Error(`Password validation failed: ${validation.errors.join(', ')}`)
    }

    // Hash new password
    const hashedPassword = await this.hashPassword(newPassword)

    // Update password and mark token as used
    await this.prisma.$transaction(async tx => {
      await tx.user.update({
        where: { id: resetToken.userId },
        data: {
          password: hashedPassword,
          passwordChangedAt: new Date(),
        },
      })

      await tx.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      })
    })

    // Invalidate all sessions
    await this.invalidateAllSessions(resetToken.userId)
  }

  private async isCommonPassword(password: string): Promise<boolean> {
    // Check against common passwords list (implement based on your needs)
    const commonPasswords = [
      'password',
      '123456',
      'password123',
      'admin',
      'qwerty',
      // Add more common passwords
    ]
    return commonPasswords.includes(password.toLowerCase())
  }

  private async isPasswordBreached(password: string): Promise<boolean> {
    // Implement HaveIBeenPwned API check or similar
    // This is a simplified example
    try {
      const sha1 = require('crypto').createHash('sha1').update(password).digest('hex').toUpperCase()
      const prefix = sha1.slice(0, 5)
      const suffix = sha1.slice(5)

      const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`)
      const text = await response.text()

      return text.includes(suffix)
    } catch (error) {
      // If service is unavailable, don't block the user
      return false
    }
  }

  private async isPasswordReused(userId: string, newPassword: string): Promise<boolean> {
    const history = await this.prisma.passwordHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: this.config.security.passwordHistoryCount,
    })

    for (const record of history) {
      if (await this.verifyPassword(newPassword, record.passwordHash)) {
        return true
      }
    }

    return false
  }
}

interface PasswordValidationResult {
  isValid: boolean
  errors: string[]
  score: number
}
```

### Password Strength Component (Frontend)

```typescript
// web/src/auth/password/components/StrengthMeter.tsx
import React from 'react'
import { usePasswordStrength } from '../hooks/usePasswordStrength'

interface PasswordStrengthMeterProps {
  password: string
  showRequirements?: boolean
}

export const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({
  password,
  showRequirements = true,
}) => {
  const { strength, score, requirements } = usePasswordStrength(password)

  const getStrengthColor = (score: number) => {
    if (score < 30) return 'bg-red-500'
    if (score < 60) return 'bg-yellow-500'
    if (score < 80) return 'bg-blue-500'
    return 'bg-green-500'
  }

  const getStrengthText = (score: number) => {
    if (score < 30) return 'Weak'
    if (score < 60) return 'Fair'
    if (score < 80) return 'Good'
    return 'Strong'
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <div className="flex-1 bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${getStrengthColor(score)}`}
            style={{ width: `${score}%` }}
          />
        </div>
        <span className="text-sm font-medium">{getStrengthText(score)}</span>
      </div>

      {showRequirements && password && (
        <div className="space-y-1">
          {requirements.map((req, index) => (
            <div key={index} className="flex items-center space-x-2 text-sm">
              <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                req.met ? 'bg-green-500 text-white' : 'bg-gray-300'
              }`}>
                {req.met && <span className="text-xs">✓</span>}
              </div>
              <span className={req.met ? 'text-green-600' : 'text-gray-600'}>
                {req.description}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

This password security system provides comprehensive protection with modern hashing, breach detection, and user-friendly validation interfaces.
