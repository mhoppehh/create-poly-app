# Security Features

## Overview

Comprehensive security hardening for web applications, including protection against common vulnerabilities, secure authentication practices, and compliance with security best practices.

## Priority

**HIGH** - Essential for production applications and data protection

## Dependencies

- `apollo-server` (for API security)
- `vite` (for frontend security)
- `authentication` (for auth security enhancements)

## Feature Components

### 1. HTTPS & SSL Certificate Management

**Description**: Automatic HTTPS setup with SSL certificate management

#### Components:

- **Automatic SSL**: Let's Encrypt integration for production
- **Local Development HTTPS**: Self-signed certificates for dev
- **Certificate Renewal**: Automated certificate renewal
- **HSTS Headers**: HTTP Strict Transport Security
- **Certificate Monitoring**: Certificate expiration alerts

#### Configuration:

```typescript
interface HTTPSConfig {
  enabled: boolean
  provider: 'letsencrypt' | 'cloudflare' | 'manual'
  domains: string[]
  autoRenewal: boolean
  hsts: {
    enabled: boolean
    maxAge: number
    includeSubDomains: boolean
  }
  localDevelopment: {
    selfSigned: boolean
    generateCerts: boolean
  }
}
```

### 2. CORS & Security Headers

**Description**: Proper Cross-Origin Resource Sharing and security headers configuration

#### Components:

- **CORS Configuration**: Secure cross-origin requests
- **Security Headers**: Comprehensive security headers
- **CSP (Content Security Policy)**: XSS protection
- **Frame Options**: Clickjacking protection
- **Referrer Policy**: Control referrer information

#### Configuration:

```typescript
interface CORSSecurityConfig {
  cors: {
    origin: string[] | boolean
    credentials: boolean
    optionsSuccessStatus: number
  }
  headers: {
    contentSecurityPolicy: boolean
    frameOptions: 'DENY' | 'SAMEORIGIN' | 'ALLOW-FROM'
    xssProtection: boolean
    noSniff: boolean
    referrerPolicy: string
  }
  rateLimiting: {
    windowMs: number
    maxRequests: number
    skipSuccessfulRequests: boolean
  }
}
```

### 3. Input Sanitization & Validation

**Description**: Comprehensive input validation and sanitization to prevent injection attacks

#### Components:

- **XSS Protection**: HTML sanitization and encoding
- **SQL Injection Prevention**: Parameterized queries
- **GraphQL Query Validation**: Query complexity and depth limits
- **File Upload Security**: MIME type validation and sanitization
- **Data Validation**: Schema-based input validation

#### Configuration:

```typescript
interface InputSecurityConfig {
  sanitization: {
    html: boolean
    javascript: boolean
    sql: boolean
  }
  validation: {
    schema: 'zod' | 'joi' | 'yup'
    strictMode: boolean
    customValidators: string[]
  }
  fileUpload: {
    allowedTypes: string[]
    maxFileSize: string
    scanForMalware: boolean
  }
  graphql: {
    maxDepth: number
    maxComplexity: number
    introspection: boolean
  }
}
```

### 4. Authentication Security Enhancements

**Description**: Advanced authentication security features

#### Components:

- **Multi-Factor Authentication**: TOTP and SMS 2FA
- **Account Lockout**: Brute force protection
- **Password Security**: Advanced password policies
- **Session Security**: Secure session management
- **OAuth Security**: Secure OAuth implementations

#### Configuration:

```typescript
interface AuthSecurityConfig {
  mfa: {
    enabled: boolean
    methods: ('totp' | 'sms' | 'email')[]
    required: boolean
  }
  bruteForce: {
    maxAttempts: number
    lockoutDuration: number
    progressiveDelay: boolean
  }
  password: {
    minLength: number
    requireComplexity: boolean
    preventReuse: number
    expiration: number // days
  }
  session: {
    secure: boolean
    httpOnly: boolean
    sameSite: 'strict' | 'lax' | 'none'
    maxAge: number
  }
}
```

### 5. Audit Logging & Security Monitoring

**Description**: Comprehensive security event logging and monitoring

#### Components:

- **Security Event Logging**: Track security-related events
- **Failed Login Monitoring**: Monitor suspicious login attempts
- **Data Access Logging**: Track sensitive data access
- **Anomaly Detection**: Identify unusual patterns
- **Compliance Reporting**: Generate compliance reports

#### Configuration:

```typescript
interface SecurityMonitoringConfig {
  logging: {
    securityEvents: boolean
    failedLogins: boolean
    dataAccess: boolean
    adminActions: boolean
  }
  alerting: {
    bruteForceAttempts: boolean
    suspiciousActivity: boolean
    dataBreaches: boolean
  }
  storage: {
    retention: number // days
    encryption: boolean
    destination: 'file' | 'database' | 'external'
  }
}
```

### 6. Data Encryption & Protection

**Description**: Data encryption at rest and in transit

#### Components:

- **Database Encryption**: Encrypted database fields
- **File Encryption**: Encrypted file storage
- **API Encryption**: Request/response encryption
- **Key Management**: Secure key storage and rotation
- **PII Protection**: Personal data encryption

#### Configuration:

```typescript
interface DataEncryptionConfig {
  database: {
    encryptSensitiveFields: boolean
    algorithm: 'AES-256-GCM' | 'ChaCha20-Poly1305'
    keyRotation: boolean
  }
  files: {
    encryptUploads: boolean
    encryptLogs: boolean
  }
  keys: {
    storage: 'env' | 'vault' | 'aws-kms' | 'azure-keyvault'
    rotation: {
      enabled: boolean
      interval: number // days
    }
  }
  pii: {
    autoDetection: boolean
    encryptionFields: string[]
  }
}
```

## Generated Files

### Security Middleware

```
api/src/
├── security/
│   ├── index.ts                   # Security exports
│   ├── middleware/
│   │   ├── cors.ts                # CORS configuration
│   │   ├── headers.ts             # Security headers
│   │   ├── rateLimiting.ts        # Rate limiting
│   │   ├── authentication.ts     # Auth middleware
│   │   └── validation.ts          # Input validation
│   ├── encryption/
│   │   ├── crypto.ts              # Encryption utilities
│   │   ├── keyManager.ts          # Key management
│   │   └── fieldEncryption.ts     # Database field encryption
│   ├── monitoring/
│   │   ├── securityLogger.ts      # Security event logging
│   │   ├── anomalyDetection.ts    # Pattern detection
│   │   └── alerting.ts            # Security alerting
│   ├── validation/
│   │   ├── sanitizer.ts           # Input sanitization
│   │   ├── validators.ts          # Custom validators
│   │   └── schemas.ts             # Validation schemas
│   └── audit/
│       ├── auditLogger.ts         # Audit trail logging
│       ├── compliance.ts          # Compliance reporting
│       └── dataAccess.ts          # Data access tracking
```

### Frontend Security

```
web/src/
├── security/
│   ├── index.ts                   # Security exports
│   ├── csp/
│   │   ├── policy.ts              # Content Security Policy
│   │   └── nonce.ts               # CSP nonce generation
│   ├── sanitization/
│   │   ├── htmlSanitizer.ts       # HTML sanitization
│   │   └── inputSanitizer.ts      # Input sanitization
│   ├── validation/
│   │   ├── clientValidation.ts    # Client-side validation
│   │   └── schemas.ts             # Frontend schemas
│   └── monitoring/
│       ├── errorReporting.ts      # Security error reporting
│       └── cspReporting.ts        # CSP violation reporting
```

### SSL & HTTPS Configuration

```
certificates/
├── generate-ssl.sh                # SSL certificate generation
├── localhost.crt                  # Development certificate
├── localhost.key                  # Development private key
└── ca.crt                         # Certificate authority

nginx/
├── ssl.conf                       # SSL configuration
├── security-headers.conf          # Security headers
└── rate-limiting.conf             # Rate limiting rules
```

### Security Monitoring

```
monitoring/
├── security/
│   ├── dashboard.ts               # Security dashboard
│   ├── metrics.ts                 # Security metrics
│   ├── reports/
│   │   ├── daily.ts               # Daily security reports
│   │   ├── incidents.ts           # Incident reports
│   │   └── compliance.ts          # Compliance reports
│   └── alerts/
│       ├── bruteForce.ts          # Brute force alerts
│       ├── dataAccess.ts          # Data access alerts
│       └── anomaly.ts             # Anomaly detection alerts
```

## Configuration Files

### Express Security Middleware

```typescript
// api/src/security/middleware/headers.ts
import helmet from 'helmet'
import { Request, Response, NextFunction } from 'express'

export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https:'],
      scriptSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  frameguard: {
    action: 'deny',
  },
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin',
  },
})

export const corsConfig = {
  origin: (origin: string | undefined, callback: Function) => {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000']

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'), false)
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
}
```

### Input Sanitization

```typescript
// api/src/security/validation/sanitizer.ts
import DOMPurify from 'isomorphic-dompurify'
import { z } from 'zod'

export class InputSanitizer {
  static sanitizeHtml(input: string): string {
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u'],
      ALLOWED_ATTR: [],
    })
  }

  static sanitizeString(input: string): string {
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim()
  }

  static validateAndSanitize<T>(schema: z.ZodSchema<T>, data: unknown): T {
    const validated = schema.parse(data)

    if (typeof validated === 'object' && validated !== null) {
      return this.sanitizeObject(validated) as T
    }

    return validated
  }

  private static sanitizeObject(obj: any): any {
    if (typeof obj === 'string') {
      return this.sanitizeString(obj)
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item))
    }

    if (typeof obj === 'object' && obj !== null) {
      const sanitized: any = {}
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = this.sanitizeObject(value)
      }
      return sanitized
    }

    return obj
  }
}
```

### Database Encryption

```typescript
// api/src/security/encryption/fieldEncryption.ts
import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const SECRET_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32)

export class FieldEncryption {
  static encrypt(text: string): string {
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipher(ALGORITHM, SECRET_KEY)
    cipher.setAAD(Buffer.from('authenticated'))

    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')

    const authTag = cipher.getAuthTag()

    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
  }

  static decrypt(encryptedText: string): string {
    const [ivHex, authTagHex, encrypted] = encryptedText.split(':')

    const iv = Buffer.from(ivHex, 'hex')
    const authTag = Buffer.from(authTagHex, 'hex')

    const decipher = crypto.createDecipher(ALGORITHM, SECRET_KEY)
    decipher.setAAD(Buffer.from('authenticated'))
    decipher.setAuthTag(authTag)

    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
  }
}

// Prisma middleware for automatic encryption
export const createEncryptionMiddleware = (encryptedFields: string[]) => {
  return async (params: any, next: any) => {
    if (params.action === 'create' || params.action === 'update') {
      for (const field of encryptedFields) {
        if (params.args.data[field]) {
          params.args.data[field] = FieldEncryption.encrypt(params.args.data[field])
        }
      }
    }

    const result = await next(params)

    if (params.action === 'findUnique' || params.action === 'findMany' || params.action === 'findFirst') {
      const decryptResult = (data: any) => {
        if (!data) return data

        for (const field of encryptedFields) {
          if (data[field]) {
            data[field] = FieldEncryption.decrypt(data[field])
          }
        }
        return data
      }

      if (Array.isArray(result)) {
        return result.map(decryptResult)
      }

      return decryptResult(result)
    }

    return result
  }
}
```

### Security Audit Logger

```typescript
// api/src/security/audit/auditLogger.ts
import { PrismaClient } from '@prisma/client'

interface AuditEvent {
  userId?: string
  action: string
  resource: string
  details: Record<string, any>
  ipAddress?: string
  userAgent?: string
  success: boolean
  timestamp: Date
}

export class SecurityAuditLogger {
  constructor(private prisma: PrismaClient) {}

  async logSecurityEvent(event: AuditEvent): Promise<void> {
    await this.prisma.securityAuditLog.create({
      data: {
        userId: event.userId,
        action: event.action,
        resource: event.resource,
        details: event.details,
        ipAddress: event.ipAddress,
        userAgent: event.userAgent,
        success: event.success,
        timestamp: event.timestamp,
      },
    })

    // Alert on critical security events
    if (this.isCriticalEvent(event)) {
      await this.sendSecurityAlert(event)
    }
  }

  async logFailedLogin(email: string, ipAddress: string, userAgent: string): Promise<void> {
    await this.logSecurityEvent({
      action: 'LOGIN_FAILED',
      resource: 'authentication',
      details: { email },
      ipAddress,
      userAgent,
      success: false,
      timestamp: new Date(),
    })

    // Check for brute force attempts
    const recentFailures = await this.prisma.securityAuditLog.count({
      where: {
        action: 'LOGIN_FAILED',
        ipAddress,
        timestamp: {
          gte: new Date(Date.now() - 15 * 60 * 1000), // Last 15 minutes
        },
      },
    })

    if (recentFailures >= 5) {
      await this.logSecurityEvent({
        action: 'BRUTE_FORCE_DETECTED',
        resource: 'authentication',
        details: { email, attemptCount: recentFailures },
        ipAddress,
        userAgent,
        success: false,
        timestamp: new Date(),
      })
    }
  }

  async logDataAccess(userId: string, resource: string, action: string, recordIds: string[]): Promise<void> {
    await this.logSecurityEvent({
      userId,
      action: `DATA_${action.toUpperCase()}`,
      resource,
      details: { recordIds, recordCount: recordIds.length },
      success: true,
      timestamp: new Date(),
    })
  }

  private isCriticalEvent(event: AuditEvent): boolean {
    const criticalActions = [
      'BRUTE_FORCE_DETECTED',
      'UNAUTHORIZED_ACCESS',
      'DATA_BREACH',
      'ADMIN_ACTION',
      'PRIVILEGE_ESCALATION',
    ]

    return criticalActions.includes(event.action)
  }

  private async sendSecurityAlert(event: AuditEvent): Promise<void> {
    // Implementation for sending alerts (email, Slack, etc.)
    console.error('SECURITY ALERT:', event)

    // Could integrate with external alerting services
    // await this.notificationService.sendSecurityAlert(event)
  }
}
```

### Content Security Policy Configuration

```typescript
// web/src/security/csp/policy.ts
export const generateCSPPolicy = (nonce?: string) => {
  const policy = {
    'default-src': ["'self'"],
    'script-src': ["'self'", nonce ? `'nonce-${nonce}'` : "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
    'style-src': [
      "'self'",
      "'unsafe-inline'", // For CSS-in-JS libraries
      'https://fonts.googleapis.com',
    ],
    'font-src': ["'self'", 'https://fonts.gstatic.com'],
    'img-src': ["'self'", 'data:', 'https:'],
    'connect-src': ["'self'", process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'],
    'frame-src': ["'none'"],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
    'upgrade-insecure-requests': [],
  }

  return Object.entries(policy)
    .map(([key, values]) => `${key} ${values.join(' ')}`)
    .join('; ')
}
```

## Environment Variables

```env
# HTTPS Configuration
SSL_ENABLED=true
SSL_CERT_PATH=/path/to/cert.pem
SSL_KEY_PATH=/path/to/private-key.pem

# Security Configuration
ENCRYPTION_KEY=your-32-byte-encryption-key-here
JWT_SECRET=your-jwt-secret-at-least-32-characters
SESSION_SECRET=your-session-secret-key

# CORS Configuration
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Security Features
MFA_ENABLED=true
BRUTE_FORCE_PROTECTION=true
AUDIT_LOGGING=true

# External Services
SECURITY_MONITORING_URL=https://your-monitoring-service
ALERT_WEBHOOK_URL=https://your-alert-webhook
```

## Package Dependencies

```json
{
  "dependencies": {
    "helmet": "^7.1.0",
    "cors": "^2.8.5",
    "express-rate-limit": "^7.1.0",
    "express-slow-down": "^2.0.0",
    "bcrypt": "^5.1.0",
    "argon2": "^0.31.0",
    "crypto": "^1.0.1",
    "isomorphic-dompurify": "^2.4.0",
    "speakeasy": "^2.0.0",
    "qrcode": "^1.5.0",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "@types/bcrypt": "^5.0.0",
    "@types/cors": "^2.8.0",
    "@types/qrcode": "^1.5.0"
  }
}
```

## Installation Scripts

1. **Setup security middleware and headers**
2. **Configure HTTPS and SSL certificates**
3. **Implement input validation and sanitization**
4. **Setup audit logging and monitoring**
5. **Configure data encryption**
6. **Setup MFA and advanced authentication**
7. **Configure rate limiting and DDoS protection**
8. **Generate security documentation**

This comprehensive security feature set provides enterprise-level protection against common web application vulnerabilities and ensures compliance with security best practices.
