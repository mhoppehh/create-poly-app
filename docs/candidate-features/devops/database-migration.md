# Database Migration & Management

## Overview

Production-safe database operations and migration management with versioned migrations, rollback strategies, and automated backups.

## Priority

**HIGH** - Critical for database schema management

## Dependencies

- Prisma (recommended) or alternative ORM
- Database hosting platform

## Components

### Migration Scripts

- Versioned database migrations with timestamps
- Forward and backward migration support
- Schema change tracking and history
- Automated migration generation from schema changes

### Rollback Strategies

- Safe rollback procedures for failed migrations
- Point-in-time recovery capabilities
- Schema version management
- Data integrity validation during rollbacks

### Seed Data Management

- Environment-specific seed data
- Production, staging, and development datasets
- Referential integrity maintenance
- Bulk data operations optimization

### Backup Automation

- Automated database backups with scheduling
- Cross-region backup replication
- Backup verification and testing
- Restore procedures and automation

### Migration Validation

- Pre-deployment migration testing
- Schema compatibility validation
- Performance impact assessment
- Rollback plan verification

## Configuration

```typescript
interface MigrationConfig {
  strategy: 'prisma' | 'knex' | 'typeorm' | 'sql-files'
  versioning: {
    format: 'timestamp' | 'sequential'
    prefix: string
  }
  backup: {
    enabled: boolean
    schedule: string // cron format
    retention: number // days
    crossRegion: boolean
  }
  validation: {
    preDeployment: boolean
    performanceCheck: boolean
    rollbackPlan: boolean
  }
}
```

## Generated Files

```
├── migrations/
│   ├── 001_initial_schema.sql
│   ├── 002_add_user_profiles.sql
│   ├── 003_create_books_table.sql
│   └── rollback/
│       ├── 001_rollback_initial.sql
│       ├── 002_rollback_user_profiles.sql
│       └── 003_rollback_books_table.sql
├── seeds/
│   ├── development/
│   │   ├── users.ts
│   │   ├── books.ts
│   │   └── categories.ts
│   ├── staging/
│   │   └── production-like-data.ts
│   └── production/
│       └── essential-data.ts
├── scripts/
│   ├── migrate.sh
│   ├── rollback.sh
│   ├── backup.sh
│   ├── restore.sh
│   └── validate-migration.sh
└── backup/
    ├── automated/
    └── manual/
```

## Prisma Migration Management

### Schema Migration

```typescript
// scripts/migrate.ts
import { PrismaClient } from '@prisma/client'
import { execSync } from 'child_process'

const prisma = new PrismaClient()

async function runMigration() {
  try {
    console.log('🔄 Running database migration...')

    // Check database connectivity
    await prisma.$connect()
    console.log('✅ Database connection established')

    // Run Prisma migrations
    execSync('npx prisma migrate deploy', { stdio: 'inherit' })
    console.log('✅ Migrations applied successfully')

    // Verify migration status
    const migrations = await prisma.$queryRaw`
      SELECT * FROM _prisma_migrations 
      WHERE finished_at IS NULL
    `

    if (Array.isArray(migrations) && migrations.length > 0) {
      throw new Error('Some migrations failed to complete')
    }

    console.log('✅ Migration verification passed')
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

runMigration()
```

### Backup Script

```bash
#!/bin/bash
# scripts/backup.sh

set -e

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="backup/automated"
DB_NAME="${DATABASE_NAME:-myapp}"
DB_HOST="${DATABASE_HOST:-localhost}"
DB_USER="${DATABASE_USER:-user}"

mkdir -p $BACKUP_DIR

echo "📦 Creating database backup..."

# Create backup
pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME \
  --verbose \
  --clean \
  --no-owner \
  --no-privileges \
  --format=custom \
  > "$BACKUP_DIR/backup_${TIMESTAMP}.sql"

# Compress backup
gzip "$BACKUP_DIR/backup_${TIMESTAMP}.sql"

echo "✅ Backup created: backup_${TIMESTAMP}.sql.gz"

# Clean old backups (keep last 7 days)
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete

# Verify backup
if [ -f "$BACKUP_DIR/backup_${TIMESTAMP}.sql.gz" ]; then
  echo "✅ Backup verification passed"

  # Upload to cloud storage if configured
  if [ ! -z "$AWS_S3_BACKUP_BUCKET" ]; then
    aws s3 cp "$BACKUP_DIR/backup_${TIMESTAMP}.sql.gz" \
      "s3://$AWS_S3_BACKUP_BUCKET/database-backups/"
    echo "☁️ Backup uploaded to S3"
  fi
else
  echo "❌ Backup verification failed"
  exit 1
fi
```

### Rollback Script

```bash
#!/bin/bash
# scripts/rollback.sh

set -e

TARGET_MIGRATION=${1}

if [ -z "$TARGET_MIGRATION" ]; then
  echo "Usage: $0 <target_migration_id>"
  echo "Example: $0 20231201000000_add_user_profiles"
  exit 1
fi

echo "⚠️ Rolling back to migration: $TARGET_MIGRATION"
echo "This will revert all migrations after $TARGET_MIGRATION"
read -p "Are you sure? (y/N): " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Rollback cancelled"
  exit 1
fi

# Create backup before rollback
echo "📦 Creating backup before rollback..."
./scripts/backup.sh

# Reset database to target migration
echo "🔄 Rolling back database..."
npx prisma migrate resolve --rolled-back $TARGET_MIGRATION

# Apply any necessary data fixes
if [ -f "migrations/rollback/fix_${TARGET_MIGRATION}.sql" ]; then
  echo "🔧 Applying rollback fixes..."
  psql $DATABASE_URL -f "migrations/rollback/fix_${TARGET_MIGRATION}.sql"
fi

echo "✅ Rollback completed"
echo "🔍 Please verify your application functionality"
```

## Migration Validation

```typescript
// scripts/validate-migration.ts
import { PrismaClient } from '@prisma/client'
import { performance } from 'perf_hooks'

const prisma = new PrismaClient()

interface ValidationResult {
  passed: boolean
  errors: string[]
  warnings: string[]
  performanceMetrics: {
    migrationTime: number
    tableCount: number
    indexCount: number
  }
}

async function validateMigration(): Promise<ValidationResult> {
  const result: ValidationResult = {
    passed: true,
    errors: [],
    warnings: [],
    performanceMetrics: {
      migrationTime: 0,
      tableCount: 0,
      indexCount: 0,
    },
  }

  try {
    const startTime = performance.now()

    // Test database connectivity
    await prisma.$connect()
    console.log('✅ Database connectivity: OK')

    // Check migration status
    const pendingMigrations = await prisma.$queryRaw`
      SELECT migration_name FROM _prisma_migrations 
      WHERE finished_at IS NULL
    `

    if (Array.isArray(pendingMigrations) && pendingMigrations.length > 0) {
      result.errors.push('Pending migrations detected')
      result.passed = false
    }

    // Validate schema integrity
    const tables = await prisma.$queryRaw`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public'
    `

    result.performanceMetrics.tableCount = Array.isArray(tables) ? tables.length : 0

    // Check for missing indexes on foreign keys
    const missingIndexes = await prisma.$queryRaw`
      SELECT DISTINCT
        kcu.table_name,
        kcu.column_name
      FROM information_schema.key_column_usage kcu
      JOIN information_schema.table_constraints tc
        ON kcu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND NOT EXISTS (
          SELECT 1 FROM pg_indexes
          WHERE tablename = kcu.table_name
            AND indexname LIKE '%' || kcu.column_name || '%'
        )
    `

    if (Array.isArray(missingIndexes) && missingIndexes.length > 0) {
      result.warnings.push(`Missing indexes on foreign keys: ${missingIndexes.length}`)
    }

    result.performanceMetrics.migrationTime = performance.now() - startTime

    console.log('✅ Migration validation completed')
  } catch (error) {
    result.errors.push(`Validation error: ${error.message}`)
    result.passed = false
  } finally {
    await prisma.$disconnect()
  }

  return result
}

// Run validation if script is called directly
if (require.main === module) {
  validateMigration()
    .then(result => {
      console.log('📊 Validation Results:')
      console.log(`Status: ${result.passed ? '✅ PASSED' : '❌ FAILED'}`)

      if (result.errors.length > 0) {
        console.log('Errors:')
        result.errors.forEach(error => console.log(`  - ${error}`))
      }

      if (result.warnings.length > 0) {
        console.log('Warnings:')
        result.warnings.forEach(warning => console.log(`  - ${warning}`))
      }

      console.log('Performance Metrics:')
      console.log(`  - Migration time: ${result.performanceMetrics.migrationTime.toFixed(2)}ms`)
      console.log(`  - Table count: ${result.performanceMetrics.tableCount}`)

      process.exit(result.passed ? 0 : 1)
    })
    .catch(error => {
      console.error('❌ Validation failed:', error)
      process.exit(1)
    })
}

export { validateMigration }
```

## Automated Backup Scheduling

```javascript
// scripts/schedule-backups.js
const cron = require('node-cron')
const { execSync } = require('child_process')

// Daily backup at 2 AM
cron.schedule('0 2 * * *', () => {
  console.log('🕐 Running scheduled backup...')
  try {
    execSync('./scripts/backup.sh', { stdio: 'inherit' })
    console.log('✅ Scheduled backup completed')
  } catch (error) {
    console.error('❌ Scheduled backup failed:', error)
    // Send alert notification
    notifyBackupFailure(error)
  }
})

// Weekly full backup on Sunday at 1 AM
cron.schedule('0 1 * * 0', () => {
  console.log('📦 Running weekly full backup...')
  try {
    execSync('./scripts/backup.sh --full', { stdio: 'inherit' })
    console.log('✅ Weekly backup completed')
  } catch (error) {
    console.error('❌ Weekly backup failed:', error)
    notifyBackupFailure(error)
  }
})

function notifyBackupFailure(error) {
  // Implementation depends on notification service
  console.error('🚨 Backup failure notification:', error.message)
}
```
