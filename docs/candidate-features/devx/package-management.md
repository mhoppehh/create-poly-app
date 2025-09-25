# Package Management & Dependencies

## Overview

Advanced package management with automated dependency tracking, security auditing, and intelligent update management for optimal development workflow.

## Priority

**HIGH** - Essential for maintainable and secure applications

## Dependencies

- `pnpm` (package manager)
- `npm-check-updates` (dependency updates)
- `audit-ci` (security auditing)

## Components

### Package Manager Optimization

- **pnpm Workspaces**: Efficient monorepo package management
- **Dependency Deduplication**: Automatic dependency optimization
- **Lock File Management**: Consistent dependency resolution
- **Cache Optimization**: Local and global package caching
- **Offline Installation**: Support for offline development

### Dependency Management

- **Automated Updates**: Intelligent dependency update strategies
- **Security Auditing**: Continuous vulnerability scanning
- **License Compliance**: License compatibility checking
- **Bundle Analysis**: Bundle size impact analysis
- **Dependency Visualization**: Dependency tree visualization

### Development Dependencies

- **Tool Management**: Development tool version pinning
- **Script Management**: Automated build and development scripts
- **Environment Isolation**: Project-specific dependency isolation
- **Peer Dependency Resolution**: Automatic peer dependency handling
- **Version Conflicts**: Intelligent conflict resolution

### Performance Monitoring

- **Installation Performance**: Package installation time tracking
- **Bundle Impact**: Dependency bundle size analysis
- **Update Impact**: Performance impact of dependency updates
- **Unused Dependencies**: Detection and removal of unused packages
- **Alternative Suggestions**: Suggest lighter alternatives

### Security & Compliance

- **Vulnerability Scanning**: Automated security vulnerability detection
- **License Auditing**: License compliance checking
- **Supply Chain Security**: Package integrity verification
- **Security Policies**: Custom security policies and rules
- **Automated Fixes**: Automatic security issue resolution

## Configuration

```typescript
interface PackageConfig {
  manager: 'pnpm' | 'npm' | 'yarn'
  workspace: {
    enabled: boolean
    patterns: string[]
  }
  updates: {
    schedule: 'weekly' | 'monthly' | 'manual'
    autoMerge: boolean
    testRequired: boolean
  }
  security: {
    auditLevel: 'low' | 'moderate' | 'high' | 'critical'
    autoFix: boolean
    allowedLicenses: string[]
  }
}
```

## Generated Files

```
package.json                       # Main package configuration
pnpm-workspace.yaml               # Workspace configuration
.pnpmrc                           # pnpm configuration
scripts/
├── deps/
│   ├── check-updates.ts          # Dependency update checker
│   ├── audit-security.ts         # Security audit script
│   ├── analyze-bundle.ts         # Bundle size analysis
│   └── unused-deps.ts            # Unused dependency detection
├── maintenance/
│   ├── update-deps.ts            # Automated dependency updates
│   ├── clean-cache.ts            # Cache cleaning utilities
│   └── integrity-check.ts        # Package integrity verification
└── reporting/
    ├── dep-report.ts             # Dependency report generation
    └── security-report.ts        # Security audit reporting
```

## Package.json Configuration

```json
{
  "name": "my-poly-app",
  "version": "1.0.0",
  "private": true,
  "packageManager": "pnpm@8.10.0",
  "engines": {
    "node": ">=18.0.0",
    "pnpm": ">=8.0.0"
  },
  "scripts": {
    "dev": "pnpm run check:deps && vite",
    "build": "pnpm run check:security && vite build",
    "test": "vitest",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "type-check": "tsc --noEmit",
    "deps:check": "pnpm run check:updates && pnpm run check:security",
    "deps:update": "ncu -u && pnpm install",
    "deps:audit": "pnpm audit --audit-level moderate",
    "deps:outdated": "pnpm outdated",
    "deps:why": "pnpm why",
    "cache:clean": "pnpm store prune",
    "security:audit": "audit-ci --moderate",
    "security:fix": "pnpm audit --fix",
    "analyze:bundle": "pnpm build && bundlesize",
    "analyze:deps": "madge --circular --extensions ts,tsx src/",
    "check:updates": "ncu --doctor --upgrade --target patch",
    "check:security": "audit-ci --config .audit-ci.json",
    "check:licenses": "license-checker --onlyAllow 'MIT;Apache-2.0;BSD-3-Clause;ISC'",
    "report:deps": "pnpm list --depth=0 --json > dependency-report.json",
    "report:security": "pnpm audit --json > security-report.json"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@apollo/client": "^3.8.0",
    "graphql": "^16.8.0",
    "styled-components": "^6.0.0",
    "framer-motion": "^10.16.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "@vitejs/plugin-react": "^4.0.0",
    "eslint": "^8.45.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.0",
    "typescript": "^5.0.0",
    "vite": "^4.4.0",
    "vitest": "^0.34.0",
    "npm-check-updates": "^16.14.0",
    "audit-ci": "^6.6.0",
    "bundlesize": "^0.18.0",
    "madge": "^6.1.0",
    "license-checker": "^25.0.1"
  },
  "bundlesize": [
    {
      "path": "./dist/assets/*.js",
      "maxSize": "500kb"
    },
    {
      "path": "./dist/assets/*.css",
      "maxSize": "50kb"
    }
  ]
}
```

## pnpm Workspace Configuration

```yaml
# pnpm-workspace.yaml
packages:
  - 'packages/*'
  - 'apps/*'
  - 'tools/*'

# Optional: Configure workspace-wide settings
prefer-workspace-packages: true
link-workspace-packages: true
shared-workspace-lockfile: true
```

```ini
# .pnpmrc
# Store configuration
store-dir=~/.pnpm-store
cache-dir=~/.pnpm-cache

# Resolution configuration
auto-install-peers=true
strict-peer-dependencies=false

# Registry configuration
registry=https://registry.npmjs.org/
@types:registry=https://registry.npmjs.org/

# Security configuration
audit-level=moderate

# Performance configuration
frozen-lockfile=true
prefer-frozen-lockfile=true

# Workspace configuration
link-workspace-packages=true
prefer-workspace-packages=true

# Logging
loglevel=warn
```

## Dependency Update Management

```typescript
// scripts/deps/check-updates.ts
import { execSync } from 'child_process'
import { readFileSync, writeFileSync } from 'fs'
import chalk from 'chalk'

interface PackageUpdate {
  package: string
  current: string
  wanted: string
  latest: string
  type: 'patch' | 'minor' | 'major'
  breaking: boolean
}

export class DependencyManager {
  private readonly packageJsonPath = 'package.json'

  async checkUpdates(): Promise<PackageUpdate[]> {
    try {
      console.log(chalk.blue('🔍 Checking for dependency updates...'))

      // Use npm-check-updates to get available updates
      const result = execSync('ncu --jsonUpgraded', { encoding: 'utf-8' })
      const updates = JSON.parse(result)

      const packageUpdates: PackageUpdate[] = []

      for (const [packageName, versions] of Object.entries(updates)) {
        const current = this.getCurrentVersion(packageName)
        const wanted = versions as string
        const latest = this.getLatestVersion(packageName)

        packageUpdates.push({
          package: packageName,
          current,
          wanted,
          latest,
          type: this.getUpdateType(current, wanted),
          breaking: this.isBreakingChange(current, wanted),
        })
      }

      return packageUpdates
    } catch (error) {
      console.error(chalk.red('❌ Error checking updates:'), error)
      return []
    }
  }

  async updateDependencies(updates: PackageUpdate[], options: { onlyPatch?: boolean; onlyMinor?: boolean } = {}) {
    const { onlyPatch = false, onlyMinor = false } = options

    const allowedUpdates = updates.filter(update => {
      if (onlyPatch && update.type !== 'patch') return false
      if (onlyMinor && !['patch', 'minor'].includes(update.type)) return false
      return true
    })

    if (allowedUpdates.length === 0) {
      console.log(chalk.yellow('📦 No updates to apply'))
      return
    }

    console.log(chalk.blue(`📦 Updating ${allowedUpdates.length} dependencies...`))

    for (const update of allowedUpdates) {
      try {
        const command = `pnpm add ${update.package}@${update.wanted}`
        console.log(chalk.gray(`  Updating ${update.package}: ${update.current} → ${update.wanted}`))

        execSync(command, { stdio: 'inherit' })

        console.log(chalk.green(`✅ Updated ${update.package}`))
      } catch (error) {
        console.error(chalk.red(`❌ Failed to update ${update.package}:`), error)
      }
    }
  }

  private getCurrentVersion(packageName: string): string {
    const packageJson = JSON.parse(readFileSync(this.packageJsonPath, 'utf-8'))
    return packageJson.dependencies[packageName] || packageJson.devDependencies[packageName] || 'unknown'
  }

  private getLatestVersion(packageName: string): string {
    try {
      const result = execSync(`npm view ${packageName} version`, { encoding: 'utf-8' })
      return result.trim()
    } catch {
      return 'unknown'
    }
  }

  private getUpdateType(current: string, wanted: string): 'patch' | 'minor' | 'major' {
    const currentParts = current.replace(/^[\^~]/, '').split('.')
    const wantedParts = wanted.split('.')

    if (currentParts[0] !== wantedParts[0]) return 'major'
    if (currentParts[1] !== wantedParts[1]) return 'minor'
    return 'patch'
  }

  private isBreakingChange(current: string, wanted: string): boolean {
    return this.getUpdateType(current, wanted) === 'major'
  }
}

// CLI usage
async function main() {
  const manager = new DependencyManager()
  const updates = await manager.checkUpdates()

  if (updates.length === 0) {
    console.log(chalk.green('✅ All dependencies are up to date'))
    return
  }

  console.log(chalk.blue('\n📊 Available Updates:'))
  console.table(
    updates.map(u => ({
      Package: u.package,
      Current: u.current,
      Wanted: u.wanted,
      Type: u.type,
      Breaking: u.breaking ? '⚠️' : '✅',
    })),
  )

  // Apply patch updates automatically
  const patchUpdates = updates.filter(u => u.type === 'patch')
  if (patchUpdates.length > 0) {
    await manager.updateDependencies(patchUpdates)
  }

  // Report breaking changes
  const breakingUpdates = updates.filter(u => u.breaking)
  if (breakingUpdates.length > 0) {
    console.log(chalk.yellow('\n⚠️  Breaking changes available:'))
    breakingUpdates.forEach(u => {
      console.log(`  ${u.package}: ${u.current} → ${u.wanted}`)
    })
  }
}

if (require.main === module) {
  main().catch(console.error)
}
```

## Security Audit Management

```typescript
// scripts/deps/audit-security.ts
import { execSync } from 'child_process'
import { writeFileSync } from 'fs'
import chalk from 'chalk'

interface SecurityVulnerability {
  id: string
  severity: 'low' | 'moderate' | 'high' | 'critical'
  title: string
  package: string
  version: string
  patchedIn?: string
  recommendation: string
}

export class SecurityAuditor {
  private readonly auditLevels = ['low', 'moderate', 'high', 'critical']

  async auditSecurity(minLevel: string = 'moderate'): Promise<SecurityVulnerability[]> {
    try {
      console.log(chalk.blue('🔒 Running security audit...'))

      const result = execSync('pnpm audit --json', { encoding: 'utf-8' })
      const auditData = JSON.parse(result)

      const vulnerabilities: SecurityVulnerability[] = []

      if (auditData.advisories) {
        for (const [id, advisory] of Object.entries(auditData.advisories)) {
          const vuln = advisory as any

          if (this.shouldIncludeVulnerability(vuln.severity, minLevel)) {
            vulnerabilities.push({
              id,
              severity: vuln.severity,
              title: vuln.title,
              package: vuln.module_name,
              version: vuln.vulnerable_versions,
              patchedIn: vuln.patched_versions,
              recommendation: this.getRecommendation(vuln),
            })
          }
        }
      }

      return vulnerabilities
    } catch (error) {
      console.error(chalk.red('❌ Security audit failed:'), error)
      return []
    }
  }

  async fixVulnerabilities(autoFix = true): Promise<void> {
    if (autoFix) {
      try {
        console.log(chalk.blue('🔧 Attempting to fix vulnerabilities...'))
        execSync('pnpm audit --fix', { stdio: 'inherit' })
        console.log(chalk.green('✅ Vulnerabilities fixed automatically'))
      } catch (error) {
        console.warn(chalk.yellow('⚠️  Some vulnerabilities could not be fixed automatically'))
      }
    }
  }

  generateSecurityReport(vulnerabilities: SecurityVulnerability[]): void {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: vulnerabilities.length,
        critical: vulnerabilities.filter(v => v.severity === 'critical').length,
        high: vulnerabilities.filter(v => v.severity === 'high').length,
        moderate: vulnerabilities.filter(v => v.severity === 'moderate').length,
        low: vulnerabilities.filter(v => v.severity === 'low').length,
      },
      vulnerabilities: vulnerabilities.map(v => ({
        ...v,
        impact: this.getImpactLevel(v.severity),
        urgency: this.getUrgency(v.severity),
      })),
      recommendations: this.generateRecommendations(vulnerabilities),
    }

    writeFileSync('security-report.json', JSON.stringify(report, null, 2))
    console.log(chalk.blue('📊 Security report saved to security-report.json'))
  }

  private shouldIncludeVulnerability(severity: string, minLevel: string): boolean {
    const severityIndex = this.auditLevels.indexOf(severity)
    const minLevelIndex = this.auditLevels.indexOf(minLevel)
    return severityIndex >= minLevelIndex
  }

  private getRecommendation(vulnerability: any): string {
    if (vulnerability.patched_versions) {
      return `Update to version ${vulnerability.patched_versions}`
    }
    if (vulnerability.recommendation) {
      return vulnerability.recommendation
    }
    return 'Review package usage and consider alternatives'
  }

  private getImpactLevel(severity: string): string {
    switch (severity) {
      case 'critical':
        return 'IMMEDIATE'
      case 'high':
        return 'HIGH'
      case 'moderate':
        return 'MEDIUM'
      case 'low':
        return 'LOW'
      default:
        return 'UNKNOWN'
    }
  }

  private getUrgency(severity: string): string {
    switch (severity) {
      case 'critical':
        return 'Fix immediately'
      case 'high':
        return 'Fix within 7 days'
      case 'moderate':
        return 'Fix within 30 days'
      case 'low':
        return 'Fix when convenient'
      default:
        return 'Review when possible'
    }
  }

  private generateRecommendations(vulnerabilities: SecurityVulnerability[]): string[] {
    const recommendations = [
      'Keep dependencies up to date regularly',
      'Enable automated security updates',
      'Review security advisories before updating',
      'Consider using dependency scanning in CI/CD',
    ]

    const criticalCount = vulnerabilities.filter(v => v.severity === 'critical').length
    if (criticalCount > 0) {
      recommendations.unshift('Address critical vulnerabilities immediately')
    }

    return recommendations
  }
}

// CLI usage
async function main() {
  const auditor = new SecurityAuditor()
  const vulnerabilities = await auditor.auditSecurity()

  if (vulnerabilities.length === 0) {
    console.log(chalk.green('✅ No security vulnerabilities found'))
    return
  }

  console.log(chalk.red(`\n🚨 Found ${vulnerabilities.length} security vulnerabilities:`))

  vulnerabilities.forEach(vuln => {
    const severityColor =
      {
        critical: chalk.bgRed.white,
        high: chalk.red,
        moderate: chalk.yellow,
        low: chalk.blue,
      }[vuln.severity] || chalk.gray

    console.log(`\n${severityColor(vuln.severity.toUpperCase())} ${vuln.title}`)
    console.log(`  Package: ${vuln.package}`)
    console.log(`  Version: ${vuln.version}`)
    if (vuln.patchedIn) {
      console.log(`  Patched in: ${vuln.patchedIn}`)
    }
    console.log(`  Recommendation: ${vuln.recommendation}`)
  })

  auditor.generateSecurityReport(vulnerabilities)

  // Attempt automatic fixes
  await auditor.fixVulnerabilities(true)
}

if (require.main === module) {
  main().catch(console.error)
}
```

## Bundle Analysis

```typescript
// scripts/deps/analyze-bundle.ts
import { execSync } from 'child_process'
import { readFileSync, existsSync } from 'fs'
import { gzipSync } from 'zlib'
import chalk from 'chalk'

interface BundleAnalysis {
  files: BundleFile[]
  summary: {
    totalSize: number
    gzipSize: number
    largestFiles: BundleFile[]
    recommendations: string[]
  }
}

interface BundleFile {
  name: string
  size: number
  gzipSize: number
  type: 'js' | 'css' | 'asset'
}

export class BundleAnalyzer {
  private readonly distPath = './dist'

  async analyzeBundles(): Promise<BundleAnalysis> {
    if (!existsSync(this.distPath)) {
      throw new Error('Build directory not found. Run build first.')
    }

    console.log(chalk.blue('📊 Analyzing bundle sizes...'))

    const files = this.scanBundleFiles()
    const totalSize = files.reduce((sum, file) => sum + file.size, 0)
    const gzipSize = files.reduce((sum, file) => sum + file.gzipSize, 0)

    const analysis: BundleAnalysis = {
      files,
      summary: {
        totalSize,
        gzipSize,
        largestFiles: files.sort((a, b) => b.size - a.size).slice(0, 10),
        recommendations: this.generateRecommendations(files),
      },
    }

    this.displayAnalysis(analysis)
    return analysis
  }

  private scanBundleFiles(): BundleFile[] {
    const files: BundleFile[] = []

    try {
      const result = execSync(`find ${this.distPath} -type f \\( -name "*.js" -o -name "*.css" -o -name "*.html" \\)`, {
        encoding: 'utf-8',
      })

      const filePaths = result.trim().split('\n').filter(Boolean)

      for (const filePath of filePaths) {
        try {
          const content = readFileSync(filePath)
          const gzipContent = gzipSync(content)

          files.push({
            name: filePath.replace(this.distPath + '/', ''),
            size: content.length,
            gzipSize: gzipContent.length,
            type: this.getFileType(filePath),
          })
        } catch (error) {
          console.warn(chalk.yellow(`⚠️  Could not analyze ${filePath}`))
        }
      }
    } catch (error) {
      console.error(chalk.red('❌ Failed to scan bundle files:'), error)
    }

    return files
  }

  private getFileType(filePath: string): 'js' | 'css' | 'asset' {
    if (filePath.endsWith('.js')) return 'js'
    if (filePath.endsWith('.css')) return 'css'
    return 'asset'
  }

  private formatSize(bytes: number): string {
    const kb = bytes / 1024
    if (kb < 1024) {
      return `${kb.toFixed(1)} KB`
    }
    const mb = kb / 1024
    return `${mb.toFixed(2)} MB`
  }

  private generateRecommendations(files: BundleFile[]): string[] {
    const recommendations: string[] = []

    const largeJsFiles = files.filter(f => f.type === 'js' && f.size > 500 * 1024)
    if (largeJsFiles.length > 0) {
      recommendations.push('Consider code splitting for large JavaScript bundles')
    }

    const largeCssFiles = files.filter(f => f.type === 'css' && f.size > 100 * 1024)
    if (largeCssFiles.length > 0) {
      recommendations.push('Consider CSS optimization and unused style removal')
    }

    const totalJs = files.filter(f => f.type === 'js').reduce((sum, f) => sum + f.size, 0)
    if (totalJs > 1024 * 1024) {
      recommendations.push('Total JavaScript size exceeds 1MB - review dependencies')
    }

    const compressionRatio = files.reduce((sum, f) => sum + f.gzipSize, 0) / files.reduce((sum, f) => sum + f.size, 0)
    if (compressionRatio > 0.7) {
      recommendations.push('Poor compression ratio - consider minification improvements')
    }

    return recommendations
  }

  private displayAnalysis(analysis: BundleAnalysis): void {
    console.log(chalk.blue('\n📊 Bundle Analysis Results:'))
    console.log(`Total Size: ${this.formatSize(analysis.summary.totalSize)}`)
    console.log(`Gzipped Size: ${this.formatSize(analysis.summary.gzipSize)}`)
    console.log(`Compression Ratio: ${((analysis.summary.gzipSize / analysis.summary.totalSize) * 100).toFixed(1)}%`)

    console.log(chalk.blue('\n📋 Largest Files:'))
    analysis.summary.largestFiles.forEach((file, index) => {
      const sizeColor = file.size > 1024 * 1024 ? chalk.red : file.size > 500 * 1024 ? chalk.yellow : chalk.green

      console.log(`${index + 1}. ${file.name}`)
      console.log(`   Size: ${sizeColor(this.formatSize(file.size))} (${this.formatSize(file.gzipSize)} gzipped)`)
    })

    if (analysis.summary.recommendations.length > 0) {
      console.log(chalk.blue('\n💡 Recommendations:'))
      analysis.summary.recommendations.forEach(rec => {
        console.log(`  • ${rec}`)
      })
    }
  }
}

// CLI usage
async function main() {
  try {
    const analyzer = new BundleAnalyzer()
    await analyzer.analyzeBundles()
  } catch (error) {
    console.error(chalk.red('❌ Bundle analysis failed:'), error)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}
```
