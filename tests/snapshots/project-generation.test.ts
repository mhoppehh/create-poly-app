import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import * as path from 'path'
import * as fs from 'fs/promises'
import { ScaffoldTestHarness, commonTestScenarios } from '../utils/scaffold-test-harness'
import { SnapshotManager } from '../utils/snapshot-manager'
import { TEST_TMP_DIR, TEST_SNAPSHOTS_DIR } from '../setup'

describe('Project Generation Snapshots', () => {
  let harness: ScaffoldTestHarness
  let snapshotManager: SnapshotManager

  beforeAll(async () => {
    harness = new ScaffoldTestHarness({
      tmpDir: TEST_TMP_DIR,
      cleanup: false, // Keep files for snapshot comparison
      verbose: false,
    })

    snapshotManager = new SnapshotManager(TEST_SNAPSHOTS_DIR)

    // Ensure directories exist
    await fs.mkdir(TEST_TMP_DIR, { recursive: true })
    await fs.mkdir(TEST_SNAPSHOTS_DIR, { recursive: true })
  })

  afterAll(async () => {
    // Cleanup test directories
    try {
      await fs.rm(TEST_TMP_DIR, { recursive: true, force: true })
    } catch (error) {
      console.warn('Failed to cleanup test directory:', error)
    }
  })

  describe('Basic Project Structures', () => {
    it('should generate consistent basic React app structure', async () => {
      const scenario = {
        name: 'basic-react-app',
        description: 'Basic React application with Vite',
        inputs: {
          projectName: 'snapshot-basic-react',
          projectWorkspaces: ['react-webapp'],
          enabledFeatures: ['projectDir', 'vite'],
        },
        validations: ['project-structure-valid'],
      }

      const result = await harness.runTest(scenario)
      expect(result.success).toBe(true)

      if (result.generation?.outputPath) {
        const snapshot = await snapshotManager.createSnapshot(result.generation.outputPath, 'basic-react-app', {
          ignoreFiles: ['node_modules/**', '*.log', '.git/**'],
          normalizeContent: true,
        })

        // Check key files exist
        expect(snapshot.files.find(f => f.path === 'package.json')).toBeDefined()
        expect(snapshot.files.find(f => f.path === 'pnpm-workspace.yaml')).toBeDefined()
        expect(snapshot.files.find(f => f.path === 'web/package.json')).toBeDefined()
        expect(snapshot.files.find(f => f.path === 'web/src/App.tsx')).toBeDefined()

        // Verify package.json structure
        const packageJsonFile = snapshot.files.find(f => f.path === 'package.json')
        if (packageJsonFile) {
          const packageJson = JSON.parse(packageJsonFile.content)
          expect(packageJson.name).toBe('snapshot-basic-react')
          expect(packageJson.workspaces).toBeDefined()
        }
      }
    }, 120000) // 2 minutes timeout

    it('should generate consistent React + Tailwind structure', async () => {
      const scenario = {
        name: 'react-tailwind-app',
        description: 'React application with Tailwind CSS',
        inputs: {
          projectName: 'snapshot-react-tailwind',
          projectWorkspaces: ['react-webapp'],
          enabledFeatures: ['projectDir', 'vite', 'tailwind'],
        },
        validations: ['project-structure-valid'],
      }

      const result = await harness.runTest(scenario)
      expect(result.success).toBe(true)

      if (result.generation?.outputPath) {
        const snapshot = await snapshotManager.createSnapshot(result.generation.outputPath, 'react-tailwind-app', {
          ignoreFiles: ['node_modules/**', '*.log', '.git/**'],
          normalizeContent: true,
        })

        // Check Tailwind-specific files
        expect(snapshot.files.find(f => f.path === 'web/tailwind.config.js')).toBeDefined()
        expect(snapshot.files.find(f => f.path === 'web/src/index.css')).toBeDefined()

        // Verify Tailwind is configured in package.json
        const webPackageJsonFile = snapshot.files.find(f => f.path === 'web/package.json')
        if (webPackageJsonFile) {
          const packageJson = JSON.parse(webPackageJsonFile.content)
          expect(packageJson.dependencies.tailwindcss || packageJson.devDependencies.tailwindcss).toBeDefined()
        }
      }
    }, 120000)
  })

  describe('Full-Stack Project Structures', () => {
    it('should generate consistent full-stack app structure', async () => {
      const scenario = {
        name: 'fullstack-app',
        description: 'Full-stack application with React and GraphQL API',
        inputs: {
          projectName: 'snapshot-fullstack',
          projectWorkspaces: ['react-webapp', 'graphql-api'],
          enabledFeatures: ['projectDir', 'vite', 'apollo-server', 'graphql-client'],
        },
        validations: ['project-structure-valid'],
      }

      const result = await harness.runTest(scenario)
      expect(result.success).toBe(true)

      if (result.generation?.outputPath) {
        const snapshot = await snapshotManager.createSnapshot(result.generation.outputPath, 'fullstack-app', {
          ignoreFiles: ['node_modules/**', '*.log', '.git/**'],
          normalizeContent: true,
        })

        // Check both web and API structures
        expect(snapshot.files.find(f => f.path === 'web/package.json')).toBeDefined()
        expect(snapshot.files.find(f => f.path === 'api/package.json')).toBeDefined()
        expect(snapshot.files.find(f => f.path === 'api/src/server.ts')).toBeDefined()

        // Check GraphQL files
        expect(snapshot.files.find(f => f.path.includes('schema.graphql') || f.path.includes('.graphql'))).toBeDefined()
      }
    }, 180000) // 3 minutes timeout
  })

  describe('Snapshot Regression Testing', () => {
    it('should detect changes in basic React app generation', async () => {
      const scenario = {
        name: 'regression-basic-react',
        inputs: {
          projectName: 'regression-basic-react',
          projectWorkspaces: ['react-webapp'],
          enabledFeatures: ['projectDir', 'vite'],
        },
        validations: ['project-structure-valid'],
      }

      // Generate project twice
      const result1 = await harness.runTest(scenario)
      const result2 = await harness.runTest({
        ...scenario,
        inputs: { ...scenario.inputs, projectName: 'regression-basic-react-2' },
      })

      expect(result1.success).toBe(true)
      expect(result2.success).toBe(true)

      if (result1.generation?.outputPath && result2.generation?.outputPath) {
        const snapshot1 = await snapshotManager.createSnapshot(result1.generation.outputPath, 'regression-test-1', {
          ignoreFiles: ['node_modules/**', '*.log'],
          normalizeContent: true,
        })

        const snapshot2 = await snapshotManager.createSnapshot(result2.generation.outputPath, 'regression-test-2', {
          ignoreFiles: ['node_modules/**', '*.log'],
          normalizeContent: true,
        })

        const comparison = await snapshotManager.compareSnapshots(snapshot1, snapshot2)

        // Should be identical except for project name references
        const significantDifferences = comparison.differences.filter(diff => {
          // Filter out expected differences (project names)
          return !diff.description.includes('regression-basic-react')
        })

        expect(significantDifferences.length).toBe(0)
      }
    }, 180000)
  })
})
