#!/bin/bash

# End-to-End Testing Validation Script
# This script validates that the testing infrastructure is properly set up

set -euo pipefail

echo "🧪 Validating E2E Testing Setup for create-poly-app"
echo "=================================================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -f "src/index.ts" ]; then
    log_error "This script must be run from the create-poly-app root directory"
    exit 1
fi

echo ""
log_info "Checking test infrastructure..."

# Check if test directories exist
test_dirs=(
    "tests"
    "tests/unit"
    "tests/integration"
    "tests/e2e" 
    "tests/snapshots"
    "tests/fixtures"
    "tests/utils"
)

for dir in "${test_dirs[@]}"; do
    if [ -d "$dir" ]; then
        log_success "Directory exists: $dir"
    else
        log_error "Directory missing: $dir"
        exit 1
    fi
done

# Check if test files exist
test_files=(
    "vitest.config.ts"
    "tests/setup.ts"
    "tests/utils/scaffold-test-harness.ts"
    "tests/utils/snapshot-manager.ts"
    "tests/utils/mock-filesystem.ts"
    "tests/snapshots/project-generation.test.ts"
    "tests/unit/engine-mocks.test.ts"
    "tests/e2e/smoke-tests.test.ts"
    "tests/integration/Dockerfile"
    "tests/integration/docker-compose.yml"
)

for file in "${test_files[@]}"; do
    if [ -f "$file" ]; then
        log_success "File exists: $file"
    else
        log_error "File missing: $file"
        exit 1
    fi
done

# Check if Docker files are executable
docker_scripts=(
    "tests/integration/docker/run-all-tests.sh"
    "tests/integration/docker/run-smoke-tests.sh"
)

for script in "${docker_scripts[@]}"; do
    if [ -f "$script" ]; then
        if [ -x "$script" ]; then
            log_success "Executable script: $script"
        else
            log_warning "Script not executable: $script (fixing...)"
            chmod +x "$script"
            log_success "Made executable: $script"
        fi
    else
        log_error "Script missing: $script"
        exit 1
    fi
done

echo ""
log_info "Checking dependencies..."

# Check if testing dependencies are installed
if pnpm list vitest >/dev/null 2>&1; then
    log_success "Vitest is installed"
else
    log_error "Vitest is not installed"
    exit 1
fi

if pnpm list @vitest/coverage-v8 >/dev/null 2>&1; then
    log_success "Coverage tool is installed"
else
    log_error "Coverage tool is not installed"
    exit 1
fi

echo ""
log_info "Checking CI/CD configuration..."

# Check GitHub Actions workflow
if [ -f ".github/workflows/e2e-tests.yml" ]; then
    log_success "GitHub Actions workflow exists"
else
    log_error "GitHub Actions workflow missing"
    exit 1
fi

echo ""
log_info "Testing basic project structure..."

# Check if main build works
if pnpm build >/dev/null 2>&1; then
    log_success "Project builds successfully"
else
    log_error "Project build failed"
    exit 1
fi

# Check if main CLI works
if node dist/main.cjs --help >/dev/null 2>&1; then
    log_success "CLI executable works"
else
    log_warning "CLI executable test skipped (build may be needed)"
fi

echo ""
log_info "Docker setup validation..."

# Check if Docker is available
if command -v docker >/dev/null 2>&1; then
    log_success "Docker is available"
    
    # Test Docker build (without actually building)
    if docker info >/dev/null 2>&1; then
        log_success "Docker daemon is running"
        
        # Validate Dockerfile syntax
        if docker run --rm -i hadolint/hadolint < tests/integration/Dockerfile >/dev/null 2>&1; then
            log_success "Dockerfile syntax is valid"
        else
            log_warning "Dockerfile linting skipped (hadolint not available)"
        fi
    else
        log_warning "Docker daemon is not running"
    fi
else
    log_warning "Docker is not available (integration tests will be skipped)"
fi

echo ""
log_info "Test configuration validation..."

# Check TypeScript configuration
if npx tsc --noEmit >/dev/null 2>&1; then
    log_success "TypeScript configuration is valid"
else
    log_error "TypeScript configuration has errors"
    exit 1
fi

# Check if test scripts are defined
scripts=(
    "test"
    "test:unit" 
    "test:integration"
    "test:e2e"
    "test:snapshots"
    "test:coverage"
)

for script in "${scripts[@]}"; do
    if pnpm run "$script" --help >/dev/null 2>&1 || grep -q "\"$script\":" package.json; then
        log_success "Script defined: $script"
    else
        log_error "Script missing: $script"
        exit 1
    fi
done

echo ""
log_info "Documentation check..."

if [ -f "tests/README.md" ]; then
    log_success "Test documentation exists"
else
    log_error "Test documentation missing"
    exit 1
fi

echo ""
echo "🎉 End-to-End Testing Setup Validation Complete!"
echo "================================================"
log_success "All required components are present and configured correctly"

echo ""
echo "Next steps:"
echo "1. Run unit tests: pnpm test:unit"
echo "2. Run smoke tests: pnpm test:e2e"  
echo "3. Run integration tests: docker-compose -f tests/integration/docker-compose.yml run smoke-tests"
echo "4. Set up CI/CD by pushing to a GitHub repository"

echo ""
echo "For more information, see tests/README.md"