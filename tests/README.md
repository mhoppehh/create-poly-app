# End-to-End Testing for create-poly-app

This document describes the comprehensive testing strategy and implementation for the `create-poly-app` scaffolding tool.

## Overview

The testing strategy uses a multi-layered approach to ensure reliability and quality:

1. **Unit Tests** - Fast, isolated tests with mocks
2. **Snapshot Tests** - Deterministic project structure validation
3. **Integration Tests** - Full project generation in Docker containers
4. **Smoke Tests** - Quick validation of core functionality
5. **End-to-End Tests** - Complete user workflow validation
6. **Cross-Platform Tests** - Validation across different operating systems

## Test Structure

```
tests/
├── unit/                 # Fast unit tests with mocks
├── integration/         # Docker-based full integration tests
├── e2e/                # End-to-end smoke tests
├── snapshots/          # Project structure snapshots
├── fixtures/           # Test data and configurations
├── utils/              # Test utilities and harnesses
│   ├── scaffold-test-harness.ts
│   ├── snapshot-manager.ts
│   └── mock-filesystem.ts
└── setup.ts            # Global test configuration
```

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm
- Docker (for integration tests)

### Installation

```bash
# Install dependencies
pnpm install

# Install testing dependencies
pnpm add -D vitest @vitest/coverage-v8 memfs
```

### Running Tests

```bash
# Run all tests
pnpm test

# Run specific test types
pnpm test:unit        # Unit tests only
pnpm test:snapshots   # Snapshot tests
pnpm test:e2e         # Smoke/E2E tests
pnpm test:integration # Docker integration tests

# Run with coverage
pnpm test:coverage

# Watch mode for development
pnpm test:watch
```

## Test Types

### 1. Unit Tests (`tests/unit/`)

Fast tests with mocked dependencies for testing core logic.

**Example:**

```typescript
import { MockFileSystem } from '../utils/mock-filesystem'

describe('Engine Tests', () => {
  let mockFs: MockFileSystem

  beforeEach(() => {
    mockFs = new MockFileSystem()
  })

  it('should generate correct package.json', () => {
    // Test scaffolding logic with mocked filesystem
  })
})
```

**Features:**

- Mock filesystem operations
- Mock npm registry responses
- Fast execution (< 10 seconds total)
- High coverage of core logic

### 2. Snapshot Tests (`tests/snapshots/`)

Deterministic tests that capture and compare generated project structures.

**Example:**

```typescript
import { SnapshotManager } from '../utils/snapshot-manager'

it('should generate consistent React app structure', async () => {
  const snapshot = await snapshotManager.createSnapshot(projectPath, 'basic-react-app')
  expect(snapshot.files.find(f => f.path === 'package.json')).toBeDefined()
})
```

**Features:**

- Captures complete project structures
- Detects unexpected changes in generated files
- Version-controlled expected outputs
- Fast execution without package installation

### 3. Integration Tests (`tests/integration/`)

Full project generation and validation in isolated Docker containers.

**Example:**

```bash
# Run integration tests
docker-compose -f tests/integration/docker-compose.yml run integration-tests

# Run smoke tests only
docker-compose -f tests/integration/docker-compose.yml run smoke-tests
```

**Features:**

- Complete project generation
- Package installation validation
- Build process validation
- Isolated test environment
- Multiple Node.js versions

### 4. Smoke Tests (`tests/e2e/`)

Quick validation of common feature combinations and user workflows.

**Test Scenarios:**

- Basic React app
- React + Tailwind
- Full-stack GraphQL
- Prisma integration
- All features combined

**Features:**

- Representative feature combinations
- Performance thresholds
- Error handling validation
- Feature interaction testing

## Test Utilities

### ScaffoldTestHarness

Main utility for running scaffolding tests with various configurations.

```typescript
import { ScaffoldTestHarness } from '../utils/scaffold-test-harness'

const harness = new ScaffoldTestHarness({
  tmpDir: '/tmp/test-workspace',
  cleanup: true,
  verbose: false,
  timeout: 300000, // 5 minutes
})

const result = await harness.runTest({
  name: 'basic-react-app',
  inputs: {
    projectName: 'test-app',
    projectWorkspaces: ['react-webapp'],
    enabledFeatures: ['projectDir', 'vite'],
  },
  validations: ['project-structure-valid', 'packages-install-successfully'],
})
```

### SnapshotManager

Utility for creating and comparing project structure snapshots.

```typescript
import { SnapshotManager } from '../utils/snapshot-manager'

const snapshotManager = new SnapshotManager('./tests/snapshots')

// Create snapshot
const snapshot = await snapshotManager.createSnapshot(projectPath, 'snapshot-name', {
  ignoreFiles: ['node_modules/**', '*.log'],
  normalizeContent: true,
})

// Compare snapshots
const comparison = await snapshotManager.compareSnapshots(snapshot1, snapshot2)
```

### Mock Utilities

Mock external dependencies for fast unit testing.

```typescript
import { MockFileSystem, MockNpmRegistry } from '../utils/mock-filesystem'

const mockFs = new MockFileSystem()
const mockRegistry = new MockNpmRegistry()

mockFs.writeFile('/project/package.json', '{"name": "test"}')
mockRegistry.addPackage('react', { '18.3.1': { ... } })
```

## CI/CD Pipeline

### GitHub Actions Workflow

The CI/CD pipeline runs different test types based on the trigger:

**On every push/PR:**

- Unit tests
- Snapshot tests
- Smoke tests

**On main branch pushes:**

- Integration tests
- Performance benchmarks

**Nightly (scheduled):**

- Full integration tests
- Cross-platform tests

**Manual dispatch:**

- Configurable test types
- Node.js version selection

### Workflow Jobs

1. **unit-tests**: Fast tests with Node.js 18 & 20
2. **snapshot-tests**: Project structure validation
3. **smoke-tests**: Core functionality validation
4. **integration-tests**: Docker-based full validation
5. **cross-platform-tests**: Windows, macOS, Linux
6. **performance-tests**: Performance benchmarking
7. **test-summary**: Results aggregation and reporting

## Docker Integration

### Dockerfile Structure

Multi-stage Docker build for testing:

```dockerfile
FROM node:18-alpine AS base
# System dependencies

FROM base AS tool-builder
# Build create-poly-app

FROM base AS integration-tester
# Run full integration tests

FROM integration-tester AS smoke-tester
# Run smoke tests only
```

### Test Execution

```bash
# Build and run all integration tests
docker-compose -f tests/integration/docker-compose.yml up

# Run specific test scenarios
docker-compose run integration-tests
docker-compose run smoke-tests
```

## Performance Monitoring

### Metrics Tracked

- Project generation time by feature combination
- Memory usage during generation
- Package installation time
- Build process duration

### Performance Thresholds

- Basic React app: < 60 seconds
- Full-stack app: < 120 seconds
- All features combined: < 300 seconds

### Benchmarking

```typescript
it('should generate basic React app under performance threshold', async () => {
  const startTime = Date.now()
  const result = await harness.runTest(scenario)
  const totalTime = Date.now() - startTime

  expect(result.success).toBe(true)
  expect(totalTime).toBeLessThan(60000) // 1 minute
})
```

## Configuration

### Test Configuration (`vitest.config.ts`)

```typescript
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    testTimeout: 30000,
    coverage: {
      provider: 'v8',
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
  },
})
```

### Environment Variables

```bash
NODE_ENV=test        # Test environment
CI=true             # CI environment flag
TEST_TIMEOUT=30000  # Default test timeout
```

## Best Practices

### Writing Tests

1. **Use descriptive test names** that explain the scenario
2. **Test feature interactions**, not just individual features
3. **Include performance assertions** for time-sensitive operations
4. **Clean up resources** in test teardown
5. **Use appropriate timeouts** for different test types

### Mock Usage

1. **Mock external dependencies** (npm registry, filesystem) in unit tests
2. **Use real implementations** in integration tests
3. **Keep mocks realistic** and up-to-date
4. **Test error conditions** with mock failures

### Snapshot Management

1. **Review snapshot changes** carefully in PRs
2. **Update snapshots** when intentional changes are made
3. **Ignore dynamic content** (timestamps, random IDs)
4. **Use meaningful snapshot names**

## Troubleshooting

### Common Issues

**Tests timing out:**

- Increase timeout for complex scenarios
- Check network connectivity for package installation
- Verify Docker resources are sufficient

**Snapshot mismatches:**

- Check for unexpected file content changes
- Verify normalization settings
- Review ignored files configuration

**Docker build failures:**

- Check Docker daemon is running
- Verify sufficient disk space
- Review Docker build logs

**Flaky tests:**

- Add retry mechanisms for network operations
- Increase timeouts for slow operations
- Use deterministic test data

### Debugging

```bash
# Run tests with verbose output
pnpm test:e2e --verbose

# Debug specific test
pnpm test:e2e --test-name-pattern="basic React app"

# Keep test artifacts for inspection
CLEANUP=false pnpm test:e2e
```

### Log Analysis

Test logs are structured with different levels:

- **INFO**: General test progress
- **SUCCESS**: Successful operations
- **WARNING**: Non-fatal issues
- **ERROR**: Test failures and errors

## Contributing

### Adding New Tests

1. **Identify test type**: Unit, snapshot, smoke, or integration
2. **Create test file** in appropriate directory
3. **Add to test matrix** if needed
4. **Update documentation**

### Modifying Existing Tests

1. **Understand test purpose** before making changes
2. **Update related snapshots** if structure changes
3. **Verify CI pipeline** passes with changes
4. **Update timeouts** if needed

### Test Data Management

1. **Use fixtures** for reusable test data
2. **Keep test data minimal** but representative
3. **Document test scenarios** and their purpose
4. **Version control** important test artifacts

## Metrics and Reporting

### Success Criteria

- 95%+ test coverage for core scaffolding logic
- 90%+ of common feature combinations tested
- <5% flaky test rate
- <30 minute full test suite execution
- Zero regression bugs in releases

### Monitoring

Test results are tracked and reported through:

- GitHub Actions workflow summaries
- Test artifact uploads
- Performance benchmarking reports
- Coverage reports

The testing strategy ensures `create-poly-app` maintains high quality and reliability while supporting rapid development and feature additions.
