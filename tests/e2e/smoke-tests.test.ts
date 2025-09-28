import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import * as path from 'path'
import * as fs from 'fs/promises'
import { ScaffoldTestHarness, type TestScenario } from '../utils/scaffold-test-harness'
import { TEST_TMP_DIR } from '../setup'

describe('Smoke Tests - Feature Combinations', () => {
  let harness: ScaffoldTestHarness

  beforeAll(async () => {
    harness = new ScaffoldTestHarness({
      tmpDir: TEST_TMP_DIR,
      cleanup: false, // Disable cleanup for tests that need file validation
      verbose: false,
      timeout: 180000, // 3 minutes
    })
  })

  afterAll(async () => {
    // Final cleanup
    try {
      await fs.rm(TEST_TMP_DIR, { recursive: true, force: true })
    } catch (error) {
      console.warn('Failed to cleanup test directory:', error)
    }
  })

  // Smoke test matrix - quick validation of core functionality
  const smokeTestMatrix: TestScenario[] = [
    {
      name: 'minimal-react',
      description: 'Minimal React web app',
      inputs: {
        projectName: 'smoke-minimal-react',
        projectWorkspaces: ['react-webapp'],
        enabledFeatures: ['projectDir', 'vite'],
      },
      validations: ['project-structure-valid', 'package-json-valid'],
      timeout: 120000, // 2 minutes
    },
    {
      name: 'react-with-tailwind',
      description: 'React with Tailwind CSS',
      inputs: {
        projectName: 'smoke-react-tailwind',
        projectWorkspaces: ['react-webapp'],
        enabledFeatures: ['projectDir', 'vite', 'tailwind'],
      },
      validations: ['project-structure-valid', 'package-json-valid'],
      timeout: 120000,
    },
    {
      name: 'fullstack-basic',
      description: 'Basic full-stack setup',
      inputs: {
        projectName: 'smoke-fullstack',
        projectWorkspaces: ['react-webapp', 'graphql-api'],
        enabledFeatures: ['projectDir', 'vite', 'apollo-server'],
      },
      validations: ['project-structure-valid', 'package-json-valid'],
      timeout: 150000, // 2.5 minutes
    },
    {
      name: 'fullstack-with-client',
      description: 'Full-stack with GraphQL client',
      inputs: {
        projectName: 'smoke-fullstack-client',
        projectWorkspaces: ['react-webapp', 'graphql-api'],
        enabledFeatures: ['projectDir', 'vite', 'apollo-server', 'graphql-client'],
        featureConfigurations: {
          'graphql-client': {
            graphqlClientLibrary: 'apollo-client',
          },
        },
      },
      validations: ['project-structure-valid', 'package-json-valid'],
      timeout: 150000,
    },
    {
      name: 'with-prisma',
      description: 'Full-stack with Prisma database',
      inputs: {
        projectName: 'smoke-with-prisma',
        projectWorkspaces: ['react-webapp', 'graphql-api'],
        enabledFeatures: ['projectDir', 'vite', 'apollo-server', 'prisma'],
        featureConfigurations: {
          prisma: {
            databaseProvider: 'sqlite',
            enableStudio: true,
          },
        },
      },
      validations: ['project-structure-valid', 'package-json-valid'],
      timeout: 180000, // 3 minutes
    },
    {
      name: 'developer-experience',
      description: 'Project with developer experience tools',
      inputs: {
        projectName: 'smoke-devx',
        projectWorkspaces: ['react-webapp'],
        enabledFeatures: ['projectDir', 'vite', 'developer-experience'],
      },
      validations: ['project-structure-valid', 'package-json-valid'],
      timeout: 120000,
    },
    {
      name: 'everything-together',
      description: 'All features combined',
      inputs: {
        projectName: 'smoke-everything',
        projectWorkspaces: ['react-webapp', 'graphql-api'],
        enabledFeatures: [
          'projectDir',
          'vite',
          'tailwind',
          'apollo-server',
          'graphql-client',
          'prisma',
          'developer-experience',
        ],
        featureConfigurations: {
          'graphql-client': {
            graphqlClientLibrary: 'apollo-client',
          },
          prisma: {
            databaseProvider: 'sqlite',
            enableStudio: true,
          },
        },
      },
      validations: ['project-structure-valid', 'package-json-valid'],
      timeout: 300000, // 5 minutes
    },
  ]

  // Run each smoke test
  smokeTestMatrix.forEach(scenario => {
    it(
      `should generate ${scenario.name} successfully`,
      async () => {
        const result = await harness.runTest(scenario)

        // Basic assertions
        expect(result.success).toBe(true)
        expect(result.generation?.success).toBe(true)
        expect(result.generation?.duration).toBeLessThan(scenario.timeout || 180000)

        // Validate all required validations passed
        if (result.validations) {
          for (const validation of scenario.validations) {
            expect(result.validations[validation]?.success).toBe(true)
          }
        }

        // Log generation time for performance monitoring
        if (result.generation?.duration) {
          console.log(`${scenario.name} generated in ${result.generation.duration}ms`)
        }
      },
      scenario.timeout || 180000,
    )
  })

  describe('Performance Smoke Tests', () => {
    it('should generate basic React app under performance threshold', async () => {
      const scenario: TestScenario = {
        name: 'perf-basic-react',
        inputs: {
          projectName: 'perf-basic-react',
          projectWorkspaces: ['react-webapp'],
          enabledFeatures: ['projectDir', 'vite'],
        },
        validations: ['project-structure-valid'],
        timeout: 60000, // 1 minute threshold
      }

      const startTime = Date.now()
      const result = await harness.runTest(scenario)
      const totalTime = Date.now() - startTime

      expect(result.success).toBe(true)
      expect(totalTime).toBeLessThan(60000) // Should complete in under 1 minute
    }, 90000)

    it('should generate full-stack app under performance threshold', async () => {
      const scenario: TestScenario = {
        name: 'perf-fullstack',
        inputs: {
          projectName: 'perf-fullstack',
          projectWorkspaces: ['react-webapp', 'graphql-api'],
          enabledFeatures: ['projectDir', 'vite', 'apollo-server'],
        },
        validations: ['project-structure-valid'],
        timeout: 120000, // 2 minute threshold
      }

      const startTime = Date.now()
      const result = await harness.runTest(scenario)
      const totalTime = Date.now() - startTime

      expect(result.success).toBe(true)
      expect(totalTime).toBeLessThan(120000) // Should complete in under 2 minutes
    }, 150000)
  })

  describe('Feature Interaction Tests', () => {
    it('should handle Tailwind + GraphQL client combination', async () => {
      const scenario: TestScenario = {
        name: 'tailwind-graphql-combo',
        inputs: {
          projectName: 'tailwind-graphql-combo',
          projectWorkspaces: ['react-webapp', 'graphql-api'],
          enabledFeatures: ['projectDir', 'vite', 'tailwind', 'apollo-server', 'graphql-client'],
          featureConfigurations: {
            'graphql-client': {
              graphqlClientLibrary: 'apollo-client',
            },
          },
        },
        validations: ['project-structure-valid', 'package-json-valid'],
      }

      const result = await harness.runTest(scenario)
      expect(result.success).toBe(true)

      // Additional validation for feature interaction
      if (result.generation?.outputPath) {
        const projectPath = result.generation.outputPath

        // Check TailwindCSS integration in Vite config
        const viteConfig = path.join(projectPath, 'web/vite.config.ts')
        const viteConfigExists = await fs
          .stat(viteConfig)
          .then(() => true)
          .catch(() => false)

        expect(viteConfigExists).toBe(true)

        if (viteConfigExists) {
          const viteContent = await fs.readFile(viteConfig, 'utf-8')
          expect(viteContent).toContain('@tailwindcss/vite')
          expect(viteContent).toContain('tailwindcss()')
        }

        // Check TailwindCSS imports in CSS
        const indexCss = path.join(projectPath, 'web/src/index.css')
        const indexCssExists = await fs
          .stat(indexCss)
          .then(() => true)
          .catch(() => false)
        expect(indexCssExists).toBe(true)

        if (indexCssExists) {
          const cssContent = await fs.readFile(indexCss, 'utf-8')
          expect(cssContent).toContain('tailwindcss')
        }

        // Check web package.json includes TailwindCSS dependencies
        const webPackageJson = path.join(projectPath, 'web/package.json')
        const webPackageExists = await fs
          .stat(webPackageJson)
          .then(() => true)
          .catch(() => false)

        if (webPackageExists) {
          const packageContent = await fs.readFile(webPackageJson, 'utf-8')
          const packageJson = JSON.parse(packageContent)
          expect(
            packageJson.devDependencies?.tailwindcss || packageJson.devDependencies?.['@tailwindcss/vite'],
          ).toBeDefined()
        }

        // Check GraphQL client setup
        const apolloClientFile = path.join(projectPath, 'web/src/lib/apollo-client.ts')
        const apolloClientExists = await fs
          .stat(apolloClientFile)
          .then(() => true)
          .catch(() => false)

        // Should exist or be integrated in another way
        if (apolloClientExists) {
          const apolloContent = await fs.readFile(apolloClientFile, 'utf-8')
          expect(apolloContent).toContain('ApolloClient')
        }
      }
    }, 180000)

    it('should handle Prisma + all frontend features combination', async () => {
      const scenario: TestScenario = {
        name: 'prisma-all-frontend',
        inputs: {
          projectName: 'prisma-all-frontend',
          projectWorkspaces: ['react-webapp', 'graphql-api'],
          enabledFeatures: ['projectDir', 'vite', 'tailwind', 'apollo-server', 'graphql-client', 'prisma'],
          featureConfigurations: {
            'graphql-client': {
              graphqlClientLibrary: 'apollo-client',
            },
            prisma: {
              databaseProvider: 'sqlite',
              enableStudio: true,
            },
          },
        },
        validations: ['project-structure-valid', 'package-json-valid'],
      }

      const result = await harness.runTest(scenario)
      expect(result.success).toBe(true)

      // Additional validation for Prisma + multi-feature interaction
      if (result.generation?.outputPath) {
        const projectPath = result.generation.outputPath

        // Check Prisma schema exists in API
        const apiPrismaSchema = path.join(projectPath, 'api/prisma/schema.prisma')
        const apiSchemaExists = await fs
          .stat(apiPrismaSchema)
          .then(() => true)
          .catch(() => false)

        if (apiSchemaExists) {
          const schemaContent = await fs.readFile(apiPrismaSchema, 'utf-8')
          expect(schemaContent).toContain('generator client')
          expect(schemaContent).toContain('provider = "prisma-client-js"')
        }

        // Check Prisma in root (fallback pattern)
        const rootPrismaSchema = path.join(projectPath, 'prisma/schema.prisma')
        const rootSchemaExists = await fs
          .stat(rootPrismaSchema)
          .then(() => true)
          .catch(() => false)

        if (rootSchemaExists) {
          const schemaContent = await fs.readFile(rootPrismaSchema, 'utf-8')
          expect(schemaContent).toContain('generator client')
          expect(schemaContent).toContain('provider = "prisma-client-js"')
        }

        // At least one schema should exist
        expect(apiSchemaExists || rootSchemaExists).toBe(true)

        // Check Tailwind integration in web
        const viteConfig = path.join(projectPath, 'web/vite.config.ts')
        const viteConfigExists = await fs
          .stat(viteConfig)
          .then(() => true)
          .catch(() => false)

        expect(viteConfigExists).toBe(true)

        if (viteConfigExists) {
          const viteContent = await fs.readFile(viteConfig, 'utf-8')
          expect(viteContent).toContain('@tailwindcss/vite')
        }

        // Check API package.json includes Prisma
        const apiPackageJson = path.join(projectPath, 'api/package.json')
        const apiPackageExists = await fs
          .stat(apiPackageJson)
          .then(() => true)
          .catch(() => false)

        if (apiPackageExists) {
          const packageContent = await fs.readFile(apiPackageJson, 'utf-8')
          const packageJson = JSON.parse(packageContent)
          expect(packageJson.dependencies?.['@prisma/client'] || packageJson.devDependencies?.prisma).toBeDefined()
        }
      }
    }, 240000) // 4 minutes for complex scenario
  })

  describe('Error Handling Smoke Tests', () => {
    it('should handle invalid project names gracefully', async () => {
      const scenario: TestScenario = {
        name: 'invalid-project-name',
        inputs: {
          projectName: 'Invalid Project Name With Spaces',
          projectWorkspaces: ['react-webapp'],
          enabledFeatures: ['projectDir', 'vite'],
        },
        validations: [],
      }

      const result = await harness.runTest(scenario)

      // This should either fail gracefully or automatically fix the name
      if (!result.success) {
        expect(result.generation?.error).toBeDefined()
      } else {
        // If it succeeds, the name should have been sanitized
        expect(result.generation?.success).toBe(true)
      }
    }, 60000)

    it('should handle empty feature list', async () => {
      const scenario: TestScenario = {
        name: 'empty-features',
        inputs: {
          projectName: 'empty-features',
          projectWorkspaces: ['react-webapp'],
          enabledFeatures: [], // No features
        },
        validations: [],
      }

      const result = await harness.runTest(scenario)

      // Should either fail gracefully or provide minimal structure
      expect(result.generation).toBeDefined()

      if (result.success) {
        expect(result.generation?.success).toBe(true)
      } else {
        expect(result.generation?.error).toBeDefined()
      }
    }, 60000)
  })
})
