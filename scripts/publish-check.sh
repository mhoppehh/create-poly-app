#!/usr/bin/env bash

# NPM Publish Preparation Script
# This script performs all the necessary checks before publishing to NPM

set -e  # Exit on any error

echo "🚀 Preparing for NPM publish..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Are you in the project root?"
    exit 1
fi

# Check if we're on the main branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ] && [ "$CURRENT_BRANCH" != "master" ]; then
    print_warning "You're on branch '$CURRENT_BRANCH', not 'main'. Continue? (y/N)"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        print_error "Aborted. Switch to main branch first."
        exit 1
    fi
fi

# Check if working directory is clean
if [ -n "$(git status --porcelain)" ]; then
    print_error "Working directory is not clean. Commit or stash your changes first."
    git status --short
    exit 1
fi

print_success "Git working directory is clean"

# Install dependencies
print_status "Installing dependencies..."
pnpm install --frozen-lockfile

# Type checking
print_status "Running type check..."
pnpm type-check
print_success "Type check passed"

# Linting
print_status "Running linter..."
pnpm lint
print_success "Linting passed"

# Formatting check
print_status "Checking code formatting..."
pnpm format
print_success "Code formatting is correct"

# Clean build
print_status "Building project..."
pnpm build:clean
print_success "Build completed successfully"

# Verify build outputs exist
print_status "Verifying build outputs..."
REQUIRED_FILES=("dist/main.cjs" "dist/main.mjs" "dist/index.d.ts")
for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        print_error "Required build output missing: $file"
        exit 1
    fi
done
print_success "All required build outputs present"

# Check CLI executable
print_status "Testing CLI executable..."
if node dist/main.cjs --help >/dev/null 2>&1; then
    print_success "CLI executable works"
else
    print_warning "CLI help command failed (this might be expected)"
fi

# Package size check
print_status "Checking package size..."
PACK_OUTPUT=$(npm pack --dry-run 2>/dev/null | grep "package size" || echo "")
if [ -n "$PACK_OUTPUT" ]; then
    print_status "$PACK_OUTPUT"
else
    # Alternative method to estimate size
    SIZE=$(du -sh dist/ 2>/dev/null | cut -f1 || echo "unknown")
    print_status "Estimated package size: $SIZE"
fi

# Security audit
print_status "Running security audit..."
if pnpm audit --audit-level moderate >/dev/null 2>&1; then
    print_success "Security audit passed"
else
    print_warning "Security audit found issues. Review them carefully."
    pnpm audit --audit-level moderate || true
fi

# Check NPM credentials
print_status "Checking NPM authentication..."
if npm whoami >/dev/null 2>&1; then
    NPM_USER=$(npm whoami)
    print_success "Logged in to NPM as: $NPM_USER"
else
    print_error "Not logged in to NPM. Run 'npm login' first."
    exit 1
fi

# Package validation
print_status "Validating package.json..."
PACKAGE_NAME=$(node -p "require('./package.json').name")
PACKAGE_VERSION=$(node -p "require('./package.json').version")

if [ -z "$PACKAGE_NAME" ] || [ -z "$PACKAGE_VERSION" ]; then
    print_error "Invalid package.json: missing name or version"
    exit 1
fi

print_status "Package: $PACKAGE_NAME@$PACKAGE_VERSION"

# Check if version exists on NPM
if npm view "$PACKAGE_NAME@$PACKAGE_VERSION" version >/dev/null 2>&1; then
    print_error "Version $PACKAGE_VERSION already exists on NPM!"
    print_status "Current versions on NPM:"
    npm view "$PACKAGE_NAME" versions --json | tail -10
    exit 1
fi

print_success "Version $PACKAGE_VERSION is available for publishing"

# Final confirmation
echo ""
print_status "🎯 Ready to publish $PACKAGE_NAME@$PACKAGE_VERSION"
print_status "📋 Pre-publish checklist complete:"
echo "   ✅ Git working directory clean"
echo "   ✅ Dependencies installed"
echo "   ✅ Type checking passed"
echo "   ✅ Linting passed"
echo "   ✅ Code formatting correct"
echo "   ✅ Build successful"
echo "   ✅ Build outputs verified"
echo "   ✅ Security audit completed"
echo "   ✅ NPM authentication verified"
echo "   ✅ Package version available"

echo ""
print_warning "Ready to publish! Run one of these commands:"
echo "   npm publish                 # Publish current version"
echo "   npm publish --tag beta      # Publish as beta"
echo "   npm publish --dry-run       # Test publish without actually publishing"

echo ""
print_status "Or use the automated release scripts:"
echo "   pnpm release:patch          # Bump patch version and publish"
echo "   pnpm release:minor          # Bump minor version and publish"
echo "   pnpm release:major          # Bump major version and publish"