# End-to-End Testing Strategies for create-poly-app

## Executive Summary

This document outlines comprehensive end-to-end testing strategies for the `create-poly-app` scaffolding tool. Since this tool generates complete project structures, installs dependencies, and configures development environments, traditional testing approaches need to be adapted to validate that generated projects work correctly and meet user specifications.

## Problem Statement

Testing scaffolding tools presents unique challenges:

1. **Dynamic Output**: Each execution creates different project structures based on user choices
2. **External Dependencies**: Tool relies on npm/pnpm registries, external services, and system tools
3. **File System Operations**: Creates directories, files, and modifies existing configurations
4. **Side Effects**: Installs packages, runs commands, and modifies the host environment
5. **Long Execution Times**: Full project generation and validation can take several minutes
6. **Platform Dependencies**: Behavior may vary across different operating systems

## Current Project Understanding

Based on code analysis, `create-poly-app`:

- Uses an interactive form system to gather user preferences
- Supports multiple features: Vite (React), Apollo Server, Prisma, Tailwind, GraphQL clients
- Generates projects using templates, codemods, and install scripts
- Creates mono-repo structures with pnpm workspaces
- Handles complex dependency management and feature interactions

## Testing Strategy Categories

### 1. Snapshot Testing for Generated Projects

**Approach**: Create deterministic snapshots of generated project structures for regression testing.

**Implementation**:

```bash
# Test structure
tests/
├── snapshots/
│   ├── basic-react-app/
│   ├── full-stack-graphql/
│   └── prisma-enabled/
├── fixtures/
│   ├── user-inputs/
│   └── expected-outputs/
└── e2e/
    ├── generation-tests.js
    └── validation-tests.js
```

**Benefits**:

- Fast execution (no package installation)
- Reliable regression detection
- Version-controlled expected outputs
- Easy to maintain and review changes

**Limitations**:

- Doesn't validate runtime functionality
- May miss dynamic content issues
- Requires careful handling of generated timestamps/IDs

### 2. Containerized Full Integration Testing

**Approach**: Use Docker containers to create isolated environments for full project generation and validation.

**Implementation**:

```dockerfile
# test-runner.dockerfile
FROM node:18-alpine

# Install system dependencies
RUN apk add --no-cache git python3 make g++

# Install pnpm
RUN npm install -g pnpm

# Copy scaffolding tool
COPY . /create-poly-app
WORKDIR /create-poly-app
RUN pnpm install && pnpm build

# Test workspace
WORKDIR /test-workspace

# Entry point for running tests
ENTRYPOINT ["/create-poly-app/test/run-integration-test.sh"]
```

**Test Scenarios**:

```javascript
// Example test configuration
const testScenarios = [
  {
    name: 'basic-react-app',
    inputs: {
      projectName: 'test-react-app',
      projectWorkspaces: ['react-webapp'],
      graphqlClient: 'apollo-client',
    },
    validations: ['packages-install-successfully', 'dev-server-starts', 'build-completes', 'tests-pass'],
  },
  {
    name: 'full-stack-with-prisma',
    inputs: {
      projectName: 'test-fullstack-app',
      projectWorkspaces: ['react-webapp', 'graphql-server'],
      database: 'prisma',
      databaseProvider: 'postgresql',
    },
    validations: [
      'api-server-starts',
      'database-migrations-run',
      'graphql-playground-accessible',
      'frontend-connects-to-api',
    ],
  },
]
```

**Benefits**:

- True end-to-end validation
- Isolated test environments
- Validates complete user workflows
- Can test different Node.js versions

**Challenges**:

- Longer execution times (10-15 minutes per test)
- Requires robust CI/CD infrastructure
- Complex setup for database testing
- Higher maintenance overhead

### 3. Mock-Based Fast Testing

**Approach**: Mock external dependencies (npm registry, file system operations) for rapid testing of scaffolding logic.

**Implementation**:

```javascript
// Example mock-based test
describe('Project Generation Logic', () => {
  let mockFs, mockExecSync, mockNpmRegistry

  beforeEach(() => {
    mockFs = new MockFileSystem()
    mockExecSync = jest.fn()
    mockNpmRegistry = new MockNpmRegistry()
  })

  test('generates correct package.json for React + Apollo setup', async () => {
    const userInputs = {
      projectName: 'test-app',
      projectWorkspaces: ['react-webapp', 'graphql-server'],
    }

    await scaffoldProject(userInputs, {
      fs: mockFs,
      exec: mockExecSync,
      registry: mockNpmRegistry,
    })

    expect(mockFs.readFile('/test-app/package.json')).toMatchSnapshot()
    expect(mockFs.readFile('/test-app/web/package.json')).toMatchSnapshot()
    expect(mockExecSync).toHaveBeenCalledWith('pnpm install')
  })
})
```

**Benefits**:

- Fast execution (seconds)
- Reliable and deterministic
- No external dependencies
- Easy to test error conditions

**Limitations**:

- Doesn't catch integration issues
- Mocks may diverge from reality
- Complex to maintain realistic mocks

### 4. Smoke Testing Generated Projects

**Approach**: Generate projects and run minimal smoke tests to ensure basic functionality.

**Test Matrix**:

```yaml
# smoke-test-matrix.yml
test_matrix:
  - name: 'minimal-react'
    features: ['react-webapp']
    tests: ['build', 'type-check']

  - name: 'react-with-tailwind'
    features: ['react-webapp', 'tailwind']
    tests: ['build', 'type-check', 'css-compilation']

  - name: 'full-stack'
    features: ['react-webapp', 'graphql-server']
    tests: ['build-all', 'api-start', 'frontend-start']

  - name: 'with-database'
    features: ['react-webapp', 'graphql-server', 'prisma']
    tests: ['build-all', 'db-generate', 'api-start']
```

**Implementation Strategy**:

```javascript
async function runSmokeTests(projectPath, features, tests) {
  const results = {}

  for (const test of tests) {
    switch (test) {
      case 'build':
        results[test] = await runCommand('pnpm build', projectPath)
        break
      case 'type-check':
        results[test] = await runCommand('pnpm type-check', projectPath)
        break
      case 'api-start':
        results[test] = await testServerStart(projectPath + '/api', 30000)
        break
    }
  }

  return results
}
```

### 5. Progressive Validation Testing

**Approach**: Validate projects at different stages of the generation process to catch issues early.

**Validation Stages**:

1. **Pre-Generation Validation**
   - User input validation
   - Feature compatibility checks
   - System requirement verification

2. **Template Generation Validation**
   - Template rendering correctness
   - File structure validation
   - Configuration file syntax

3. **Dependency Resolution Validation**
   - Package.json validity
   - Dependency compatibility
   - Version conflict detection

4. **Post-Installation Validation**
   - All packages installed correctly
   - No missing dependencies
   - Script execution success

5. **Runtime Validation**
   - Applications start successfully
   - Basic functionality works
   - Inter-service communication

### 6. User Journey Testing

**Approach**: Test complete user workflows from tool invocation to working application.

**Test Scenarios**:

```javascript
describe('User Journeys', () => {
  test('First-time user creates React app', async () => {
    // 1. User runs create-poly-app
    const { process, stdin } = await startInteractiveProcess('create-poly-app')

    // 2. User provides inputs
    await stdin.write('my-first-app\n')
    await stdin.write('react-webapp\n')
    await stdin.write('apollo-client\n')

    // 3. Generation completes
    await process.waitForExit()
    expect(process.exitCode).toBe(0)

    // 4. Generated project works
    const projectPath = './my-first-app'
    await expect(runCommand('pnpm install', projectPath)).resolves.toBe(0)
    await expect(runCommand('pnpm build', projectPath)).resolves.toBe(0)
  })

  test('Experienced user creates full-stack app', async () => {
    // Test advanced configuration flow
    const inputs = {
      projectName: 'advanced-app',
      projectWorkspaces: ['react-webapp', 'graphql-server'],
      database: 'prisma',
      authMethod: 'jwt',
    }

    await testUserJourney(inputs, [
      'project-creates',
      'dependencies-install',
      'database-setup',
      'servers-start',
      'end-to-end-functionality',
    ])
  })
})
```

## Recommended Implementation Plan

### Phase 1: Foundation (Weeks 1-2)

1. Set up basic test infrastructure
2. Implement snapshot testing for file generation
3. Create mock-based unit tests for core logic
4. Set up CI/CD pipeline with basic tests

### Phase 2: Integration (Weeks 3-4)

1. Implement containerized integration testing
2. Create test matrix for common feature combinations
3. Set up smoke testing pipeline
4. Add progressive validation checkpoints

### Phase 3: Advanced (Weeks 5-6)

1. Implement user journey testing
2. Add performance benchmarking
3. Create visual regression tests for generated UIs
4. Set up cross-platform testing (Windows, macOS, Linux)

### Phase 4: Optimization (Weeks 7-8)

1. Optimize test execution times
2. Add parallel test execution
3. Implement intelligent test selection
4. Create comprehensive reporting dashboard

## Infrastructure Requirements

### CI/CD Pipeline

```yaml
# .github/workflows/e2e-tests.yml
name: E2E Tests
on: [push, pull_request]

jobs:
  snapshot-tests:
    runs-on: ubuntu-latest
    steps:
      - name: Run snapshot tests
        run: npm run test:snapshots

  smoke-tests:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18, 20]
        feature-combo: [basic, full-stack, with-db]
    steps:
      - name: Run smoke tests
        run: npm run test:smoke -- --combo=${{ matrix.feature-combo }}

  full-integration:
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    steps:
      - name: Run full integration tests
        run: npm run test:integration
        timeout-minutes: 30
```

### Test Utilities

**Test Harness**:

```javascript
// test/utils/scaffold-test-harness.js
export class ScaffoldTestHarness {
  constructor(options = {}) {
    this.tmpDir = options.tmpDir || '/tmp/scaffold-tests'
    this.timeout = options.timeout || 300000 // 5 minutes
    this.cleanup = options.cleanup !== false
  }

  async runTest(scenario) {
    const testDir = path.join(this.tmpDir, scenario.name)
    await fs.ensureDir(testDir)

    try {
      // Generate project
      const result = await this.generateProject(scenario.inputs, testDir)

      // Run validations
      const validationResults = await this.runValidations(scenario.validations, testDir)

      return { generation: result, validations: validationResults }
    } finally {
      if (this.cleanup) {
        await fs.remove(testDir)
      }
    }
  }

  async generateProject(inputs, targetDir) {
    // Mock or real project generation
    return await scaffoldProject(inputs, targetDir)
  }

  async runValidations(validations, projectDir) {
    const results = {}

    for (const validation of validations) {
      results[validation] = await this.runValidation(validation, projectDir)
    }

    return results
  }
}
```

## Testing Anti-Patterns to Avoid

### 1. Over-Mocking

- **Problem**: Mocking too many external dependencies leads to tests that pass but don't reflect reality
- **Solution**: Use integration tests for critical paths, mocks for edge cases only

### 2. Flaky Network Tests

- **Problem**: Tests fail randomly due to network issues or external service downtime
- **Solution**: Use circuit breakers, retries, and fallback mechanisms

### 3. Inadequate Cleanup

- **Problem**: Test artifacts accumulate and cause interference between test runs
- **Solution**: Implement robust cleanup mechanisms and isolated test environments

### 4. Version Drift

- **Problem**: Tests pass in development but fail in production due to version mismatches
- **Solution**: Pin dependency versions in tests and regularly update test scenarios

## Metrics and Monitoring

### Key Testing Metrics

1. **Test Coverage**: Percentage of code paths tested
2. **Test Execution Time**: Average time for full test suite
3. **Flakiness Rate**: Percentage of tests that fail intermittently
4. **Feature Coverage**: Percentage of feature combinations tested
5. **Platform Coverage**: Number of supported platforms tested

### Success Criteria

- 95%+ test coverage for core scaffolding logic
- 90%+ of common feature combinations tested
- <5% flaky test rate
- <30 minute full test suite execution
- Zero regression bugs in releases

## Conclusion

Testing scaffolding tools requires a multi-layered approach combining fast unit tests, comprehensive integration tests, and real-world validation. The recommended strategy balances test coverage, execution speed, and maintenance overhead while ensuring the reliability of generated projects.

The key success factors are:

1. **Layered testing strategy** from unit to integration tests
2. **Containerized environments** for reliable, reproducible testing
3. **Progressive validation** to catch issues early
4. **Comprehensive test matrix** covering feature combinations
5. **Robust CI/CD pipeline** with appropriate timeout and retry mechanisms

By implementing these strategies, `create-poly-app` can achieve high confidence in generated project quality while maintaining rapid development velocity.
