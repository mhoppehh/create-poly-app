# NPM Publishing Guide

This document outlines the complete process for publishing `create-poly-app` to NPM with professional standards.

## 🚀 Quick Publishing

For immediate publishing with automated checks:

```bash
# Run comprehensive pre-publish checks
pnpm publish:check

# Publish with version bump
pnpm release:patch    # 1.0.0 → 1.0.1
pnpm release:minor    # 1.0.0 → 1.1.0
pnpm release:major    # 1.0.0 → 2.0.0
```

## 📋 Publishing Checklist

### Pre-Requisites

- [ ] NPM account with publishing rights
- [ ] Logged in to NPM (`npm whoami`)
- [ ] On `main` branch with clean working directory
- [ ] All changes committed and pushed

### Automated Checks

The `pnpm publish:check` script verifies:

- [ ] Git working directory is clean
- [ ] Dependencies installed and up-to-date
- [ ] TypeScript compilation successful
- [ ] ESLint checks pass
- [ ] Prettier formatting correct
- [ ] Build outputs generated correctly
- [ ] CLI executable works
- [ ] Security audit passes
- [ ] NPM authentication verified
- [ ] Version doesn't already exist on NPM

## 🔄 CI/CD Pipeline

### Automated Workflows

1. **Continuous Integration** (`.github/workflows/ci.yml`)
   - Runs on every push/PR
   - Tests across Node.js 18, 20, 22
   - Linting, formatting, type checking
   - Security audits

2. **Release Workflow** (`.github/workflows/release.yml`)
   - Manual trigger with version selection
   - Automated version bumping
   - Changelog updates
   - GitHub release creation
   - NPM publishing

### Triggering a Release

1. Go to **Actions** tab on GitHub
2. Select **Release** workflow
3. Click **Run workflow**
4. Choose version type: `patch`, `minor`, or `major`
5. Workflow automatically:
   - Runs all tests
   - Builds package
   - Updates version and changelog
   - Creates Git tag and GitHub release
   - Publishes to NPM

## 📦 Package Configuration

### Files Included in NPM Package

- `dist/` - Built JavaScript and TypeScript definitions
- `README.md` - Package documentation
- `LICENSE` - ISC license
- `package.json` - Package metadata

### Files Excluded (`.npmignore`)

- Source files (`src/`)
- Development configs
- Build tools
- Test files
- Development dependencies
- Git files
- IDE configs

## 🏷️ Version Management

### Semantic Versioning

- **PATCH** (1.0.1): Bug fixes, minor improvements
- **MINOR** (1.1.0): New features, backward compatible
- **MAJOR** (2.0.0): Breaking changes

### Manual Versioning

```bash
# Update version manually
npm version 1.2.3

# Publish specific version
npm publish
```

## 🔍 Testing Published Package

### Local Testing

```bash
# Pack without publishing
npm pack

# Install from local tarball
npm install -g ./create-poly-app-1.0.0.tgz

# Test CLI
create-poly-app --version
```

### NPM Testing

```bash
# Dry run publish
npm publish --dry-run

# Publish to test registry
npm publish --registry=https://registry.npmjs.org/
```

## 🐛 Troubleshooting

### Common Issues

1. **"Version already exists"**

   ```bash
   # Check existing versions
   npm view create-poly-app versions

   # Bump version
   npm version patch
   ```

2. **"Not logged in"**

   ```bash
   npm login
   npm whoami
   ```

3. **"Build fails"**

   ```bash
   # Clean and rebuild
   pnpm build:clean

   # Check for errors
   pnpm type-check
   pnpm lint
   ```

4. **"Security vulnerabilities"**
   ```bash
   # Audit and fix
   pnpm audit
   pnpm audit --fix
   ```

### Recovery

If publish fails:

1. Check NPM status: https://status.npmjs.org/
2. Verify NPM token/credentials
3. Check package.json validity
4. Ensure all build artifacts exist
5. Review `.npmignore` excludes

## 📊 Monitoring

### Post-Publish Verification

1. **NPM Package Page**: https://www.npmjs.com/package/create-poly-app
2. **Download Stats**: `npm view create-poly-app`
3. **Installation Test**: `npx create-poly-app@latest`

### Analytics

- NPM download statistics
- GitHub release metrics
- Issue/bug reports
- User feedback

## 🔐 Security

### NPM Token Management

- Use NPM automation tokens for CI/CD
- Store tokens as GitHub secrets
- Rotate tokens regularly
- Use organization/team scoped tokens when possible

### Package Security

- Regular security audits (`npm audit`)
- Dependency updates
- Vulnerability monitoring
- Code signing (optional)

## 📋 Maintenance

### Regular Tasks

- [ ] Update dependencies monthly
- [ ] Security audit quarterly
- [ ] Version bumps as needed
- [ ] Documentation updates
- [ ] Performance monitoring

### Long-term

- [ ] Major version planning
- [ ] Breaking change communication
- [ ] Migration guides
- [ ] Community feedback integration

---

For questions or issues with publishing, check the [troubleshooting section](#troubleshooting) or open an issue on GitHub.
