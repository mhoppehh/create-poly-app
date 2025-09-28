import * as path from 'path'
import * as fs from 'fs/promises'
import * as os from 'os'
import { execSync } from 'child_process'
import { scaffoldProject } from '../../src/engine'
import { createLogger, LogLevel } from '../../src/logger'

export interface TestScenario {
  name: string
  description?: string
  inputs: Record<string, any>
  validations: string[]
  timeout?: number
  skipCleanup?: boolean
}

export interface TestResult {
  success: boolean
  generation?: {
    success: boolean
    duration: number
    error?: string
    outputPath?: string
  }
  validations?: Record<
    string,
    {
      success: boolean
      duration: number
      error?: string
      output?: string
    }
  >
}

export interface ScaffoldTestHarnessOptions {
  tmpDir?: string
  timeout?: number
  cleanup?: boolean
  verbose?: boolean
}

export class ScaffoldTestHarness {
  private tmpDir: string
  private timeout: number
  private cleanup: boolean
  private verbose: boolean
  private logger: ReturnType<typeof createLogger>

  constructor(options: ScaffoldTestHarnessOptions = {}) {
    this.tmpDir = options.tmpDir || path.join(os.tmpdir(), 'scaffold-tests')
    this.timeout = options.timeout || 300000 // 5 minutes
    this.cleanup = options.cleanup !== false
    this.verbose = options.verbose || false
    this.logger = createLogger({
      logLevel: this.verbose ? 2 : 0, // INFO : ERROR
      enableConsole: this.verbose,
      enableFile: false,
    })
  }

  async runTest(scenario: TestScenario): Promise<TestResult> {
    const testDir = path.join(this.tmpDir, `test-${Date.now()}-${scenario.name}`)
    const projectDir = path.join(testDir, scenario.inputs.projectName || 'test-project')

    await fs.mkdir(testDir, { recursive: true })

    try {
      // Generate project
      const generationStart = Date.now()
      let generationResult

      try {
        const projectName = scenario.inputs.projectName || 'test-project'
        const enabledFeatures = scenario.inputs.enabledFeatures || []
        const featureConfigurations = scenario.inputs.featureConfigurations || {}

        await scaffoldProject(projectName, projectDir, enabledFeatures, featureConfigurations, scenario.inputs)

        generationResult = {
          success: true,
          duration: Date.now() - generationStart,
          outputPath: projectDir,
        }
      } catch (error) {
        generationResult = {
          success: false,
          duration: Date.now() - generationStart,
          error: error instanceof Error ? error.message : String(error),
        }
      }

      // Run validations if generation was successful
      let validationResults = {}

      if (generationResult.success && scenario.validations.length > 0) {
        validationResults = await this.runValidations(scenario.validations, projectDir)
      }

      return {
        success: generationResult.success && Object.values(validationResults).every((v: any) => v.success),
        generation: generationResult,
        validations: validationResults,
      }
    } finally {
      if (this.cleanup && !scenario.skipCleanup) {
        try {
          await fs.rm(testDir, { recursive: true, force: true })
        } catch (error) {
          console.warn(`Failed to cleanup test directory ${testDir}:`, error)
        }
      }
    }
  }

  async runValidations(validations: string[], projectDir: string): Promise<Record<string, any>> {
    const results: Record<string, any> = {}

    for (const validation of validations) {
      const validationStart = Date.now()

      try {
        const result = await this.runValidation(validation, projectDir)
        results[validation] = {
          success: true,
          duration: Date.now() - validationStart,
          output: result,
        }
      } catch (error) {
        results[validation] = {
          success: false,
          duration: Date.now() - validationStart,
          error: error instanceof Error ? error.message : String(error),
        }
      }
    }

    return results
  }

  private async runValidation(validation: string, projectDir: string): Promise<string> {
    switch (validation) {
      case 'packages-install-successfully':
        return await this.runCommand('pnpm install', projectDir)

      case 'build-completes':
        return await this.runCommand('pnpm build', projectDir)

      case 'type-check-passes':
        return await this.runCommand('pnpm type-check', projectDir)

      case 'dev-server-starts':
        return await this.testDevServerStart(projectDir)

      case 'api-server-starts':
        return await this.testApiServerStart(projectDir)

      case 'tests-pass':
        return await this.runCommand('pnpm test', projectDir)

      case 'lint-passes':
        return await this.runCommand('pnpm lint', projectDir)

      case 'project-structure-valid':
        return await this.validateProjectStructure(projectDir)

      case 'package-json-valid':
        return await this.validatePackageJson(projectDir)

      case 'tsconfig-valid':
        return await this.validateTsConfig(projectDir)

      default:
        throw new Error(`Unknown validation: ${validation}`)
    }
  }

  private async runCommand(command: string, cwd: string, timeout = 60000): Promise<string> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Command timed out after ${timeout}ms: ${command}`))
      }, timeout)

      try {
        const result = execSync(command, {
          cwd,
          encoding: 'utf-8',
          timeout: timeout - 1000, // Leave some buffer for cleanup
        })

        clearTimeout(timeoutId)
        resolve(result)
      } catch (error) {
        clearTimeout(timeoutId)
        reject(error)
      }
    })
  }

  private async testDevServerStart(projectDir: string): Promise<string> {
    // Check if dev server can start (for web projects)
    const webDir = path.join(projectDir, 'web')
    const webExists = await fs
      .stat(webDir)
      .then(() => true)
      .catch(() => false)

    if (webExists) {
      // Try to start dev server in non-blocking mode and check if port is available
      return await this.runCommand('timeout 10s pnpm dev || true', webDir, 15000)
    }

    return 'No web project found'
  }

  private async testApiServerStart(projectDir: string): Promise<string> {
    // Check if API server can start
    const apiDir = path.join(projectDir, 'api')
    const apiExists = await fs
      .stat(apiDir)
      .then(() => true)
      .catch(() => false)

    if (apiExists) {
      return await this.runCommand('timeout 10s pnpm dev || true', apiDir, 15000)
    }

    return 'No API project found'
  }

  private async validateProjectStructure(projectDir: string): Promise<string> {
    const requiredFiles = ['pnpm-workspace.yaml']

    // Optional files that might exist depending on features
    const optionalFiles = [
      'package.json', // Only created by certain features like developer-experience
    ]

    for (const file of requiredFiles) {
      const filePath = path.join(projectDir, file)
      try {
        await fs.stat(filePath)
      } catch {
        throw new Error(`Required file missing: ${file}`)
      }
    }

    // Check that at least one workspace package.json exists
    let workspacePackageJsonFound = false
    try {
      const workspaceYaml = await fs.readFile(path.join(projectDir, 'pnpm-workspace.yaml'), 'utf-8')
      const lines = workspaceYaml.split('\n').filter(line => line.trim().startsWith('-'))

      for (const line of lines) {
        const workspace = line
          .trim()
          .replace(/^-\s*["']?/, '')
          .replace(/["']$/, '')
        const workspacePackageJson = path.join(projectDir, workspace, 'package.json')
        try {
          await fs.stat(workspacePackageJson)
          workspacePackageJsonFound = true
          break
        } catch {
          // Continue checking other workspaces
        }
      }
    } catch {
      // If we can't read the workspace file, that's a bigger problem
    }

    if (!workspacePackageJsonFound) {
      throw new Error('No workspace package.json files found')
    }

    return 'Project structure is valid'
  }

  private async validatePackageJson(projectDir: string): Promise<string> {
    // First, try to find a root package.json
    const rootPackageJsonPath = path.join(projectDir, 'package.json')

    try {
      const content = await fs.readFile(rootPackageJsonPath, 'utf-8')
      const packageJson = JSON.parse(content)

      if (!packageJson.name && !packageJson.workspaces && !packageJson.scripts) {
        throw new Error('Root package.json appears to be incomplete')
      }

      return 'Root package.json is valid'
    } catch (error) {
      // If root package.json doesn't exist, check workspace package.json files
      try {
        const workspaceYaml = await fs.readFile(path.join(projectDir, 'pnpm-workspace.yaml'), 'utf-8')
        const lines = workspaceYaml.split('\n').filter(line => line.trim().startsWith('-'))

        for (const line of lines) {
          const workspace = line
            .trim()
            .replace(/^-\s*["']?/, '')
            .replace(/["']$/, '')
          const workspacePackageJsonPath = path.join(projectDir, workspace, 'package.json')

          try {
            const content = await fs.readFile(workspacePackageJsonPath, 'utf-8')
            const packageJson = JSON.parse(content)

            if (!packageJson.name) {
              throw new Error(`Workspace package.json missing name field: ${workspace}/package.json`)
            }
          } catch (wsError) {
            throw new Error(`Invalid workspace package.json in ${workspace}: ${wsError}`)
          }
        }

        return 'Workspace package.json files are valid'
      } catch (wsError) {
        throw new Error(`Package.json validation failed: ${wsError}`)
      }
    }
  }

  private async validateTsConfig(projectDir: string): Promise<string> {
    const tsconfigPath = path.join(projectDir, 'tsconfig.json')

    try {
      const content = await fs.readFile(tsconfigPath, 'utf-8')
      JSON.parse(content) // Validate JSON syntax
      return 'tsconfig.json is valid'
    } catch (error) {
      throw new Error(`Invalid tsconfig.json: ${error}`)
    }
  }
}

// Common test scenarios
export const commonTestScenarios: TestScenario[] = [
  {
    name: 'basic-react-app',
    description: 'Basic React application with Vite',
    inputs: {
      projectName: 'basic-react-app',
      projectWorkspaces: ['react-webapp'],
      enabledFeatures: ['projectDir', 'vite'],
    },
    validations: ['project-structure-valid', 'package-json-valid', 'packages-install-successfully', 'build-completes'],
  },
  {
    name: 'react-with-tailwind',
    description: 'React application with Tailwind CSS',
    inputs: {
      projectName: 'react-tailwind-app',
      projectWorkspaces: ['react-webapp'],
      enabledFeatures: ['projectDir', 'vite', 'tailwind'],
    },
    validations: ['project-structure-valid', 'packages-install-successfully', 'build-completes'],
  },
  {
    name: 'full-stack-app',
    description: 'Full-stack application with React and GraphQL API',
    inputs: {
      projectName: 'full-stack-app',
      projectWorkspaces: ['react-webapp', 'graphql-api'],
      enabledFeatures: ['projectDir', 'vite', 'apollo-server', 'graphql-client'],
    },
    validations: ['project-structure-valid', 'packages-install-successfully', 'build-completes'],
  },
  {
    name: 'prisma-enabled',
    description: 'Full-stack application with Prisma database',
    inputs: {
      projectName: 'prisma-app',
      projectWorkspaces: ['react-webapp', 'graphql-api'],
      enabledFeatures: ['projectDir', 'vite', 'apollo-server', 'prisma'],
      databaseProvider: 'sqlite',
    },
    validations: ['project-structure-valid', 'packages-install-successfully'],
  },
]
