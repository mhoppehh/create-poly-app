# Environment Configuration Management

## Overview

Robust environment variable and configuration management across development, staging, and production environments with validation and security.

## Priority

**HIGH** - Essential for secure configuration management

## Dependencies

- None (foundational feature)

## Components

### Environment Validation

- Runtime configuration validation using schemas
- Type-safe environment variables
- Required vs optional variable handling
- Default value management

### Secret Management

- Secure handling of sensitive data
- Encryption of secrets at rest
- Key rotation capabilities
- Access control for secrets

### Multi-Environment Support

- Development, staging, and production configurations
- Environment-specific variable overrides
- Configuration inheritance and merging
- Environment detection and switching

### Configuration Hot-Reloading

- Runtime configuration updates without restart
- Configuration change notifications
- Safe configuration rollback
- Configuration versioning

### Environment Detection

- Automatic environment detection based on context
- Manual environment override capability
- Environment-specific feature flags
- Runtime environment validation

## Configuration

```typescript
interface EnvironmentConfig {
  environments: ('development' | 'staging' | 'production')[]
  validation: {
    schema: boolean
    required: string[]
    optional: string[]
  }
  secrets: {
    encryption: boolean
    provider: 'env' | 'vault' | 'aws-secrets'
    rotation: boolean
  }
  hotReload: boolean
}
```

## Generated Files

```
├── config/
│   ├── index.ts                   # Configuration loader
│   ├── schema.ts                  # Configuration validation schema
│   ├── environments/
│   │   ├── development.ts         # Development config
│   │   ├── staging.ts             # Staging config
│   │   ├── production.ts          # Production config
│   │   └── test.ts                # Test config
│   └── secrets/
│       ├── secretManager.ts       # Secret management
│       └── encryption.ts          # Secret encryption
├── .env.example                   # Environment template
├── .env.local                     # Local development vars
└── scripts/
    ├── validate-env.ts            # Environment validation
    └── setup-secrets.ts           # Secret setup script
```

## Configuration Schema Example

```typescript
import { z } from 'zod'

export const configSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production', 'test']),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),

  // Optional configurations
  REDIS_URL: z.string().url().optional(),
  SENTRY_DSN: z.string().url().optional(),

  // Environment-specific
  DEBUG: z.boolean().default(false),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),

  // External services
  STRIPE_SECRET_KEY: z.string().optional(),
  SENDGRID_API_KEY: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_S3_BUCKET: z.string().optional(),
})

export type Config = z.infer<typeof configSchema>
```

## Environment Configuration Loader

```typescript
// config/index.ts
import { configSchema } from './schema'
import { loadEnvironmentConfig } from './environments'

let config: Config | null = null

export function getConfig(): Config {
  if (!config) {
    const env = process.env.NODE_ENV || 'development'
    const envVars = loadEnvironmentConfig(env)

    try {
      config = configSchema.parse(envVars)
    } catch (error) {
      console.error('Invalid configuration:', error)
      process.exit(1)
    }
  }

  return config
}

export function validateConfig(): boolean {
  try {
    getConfig()
    return true
  } catch {
    return false
  }
}
```

## Secret Management

```typescript
// config/secrets/secretManager.ts
import crypto from 'crypto'

export class SecretManager {
  private static instance: SecretManager
  private encryptionKey: string

  private constructor() {
    this.encryptionKey = process.env.ENCRYPTION_KEY || this.generateKey()
  }

  static getInstance(): SecretManager {
    if (!SecretManager.instance) {
      SecretManager.instance = new SecretManager()
    }
    return SecretManager.instance
  }

  encrypt(text: string): string {
    const algorithm = 'aes-256-gcm'
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipher(algorithm, this.encryptionKey)

    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')

    const tag = cipher.getAuthTag()

    return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`
  }

  decrypt(encryptedText: string): string {
    const algorithm = 'aes-256-gcm'
    const [ivHex, tagHex, encrypted] = encryptedText.split(':')

    const iv = Buffer.from(ivHex, 'hex')
    const tag = Buffer.from(tagHex, 'hex')

    const decipher = crypto.createDecipher(algorithm, this.encryptionKey)
    decipher.setAuthTag(tag)

    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
  }

  private generateKey(): string {
    return crypto.randomBytes(32).toString('hex')
  }
}
```
