import { readFile, writeFile } from 'fs/promises'
import path from 'path'
import type { PolyDependencyConfig } from './types'

interface PolyRcConfig {
  dependencyManagement?: PolyDependencyConfig
  [key: string]: any
}

export class ConfigManager {
  private configFilePath: string
  private defaultConfig: PolyDependencyConfig

  constructor(private rootPath: string) {
    this.configFilePath = path.join(rootPath, '.polyrc.json')
    this.defaultConfig = {
      autoCatalog: true,
      catalogThreshold: 2,
      commonDependencies: [
        'typescript',
        '@types/node',
        'eslint',
        'prettier',
        '@apollo/client',
        'graphql',
        '@graphql-codegen/cli',
        '@graphql-codegen/typescript',
        '@graphql-codegen/typescript-operations',
        'react',
        '@types/react',
      ],
      workspaceSpecific: {
        api: ['@prisma/client', 'prisma', '@apollo/server'],
        mobile: ['expo', 'react-native'],
        web: ['vite', 'react-dom'],
      },
      autoOptimize: false,
      versionStrategy: 'caret',
    }
  }

  async readConfig(): Promise<PolyRcConfig> {
    try {
      const content = await readFile(this.configFilePath, 'utf-8')
      return JSON.parse(content)
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return {}
      }
      throw error
    }
  }

  async writeConfig(config: PolyRcConfig): Promise<void> {
    const content = JSON.stringify(config, null, 2) + '\n'
    await writeFile(this.configFilePath, content, 'utf-8')
  }

  async getDependencyConfig(): Promise<PolyDependencyConfig> {
    const config = await this.readConfig()
    return {
      ...this.defaultConfig,
      ...config.dependencyManagement,
    }
  }

  async updateDependencyConfig(updates: Partial<PolyDependencyConfig>): Promise<void> {
    const config = await this.readConfig()

    config.dependencyManagement = {
      ...this.defaultConfig,
      ...config.dependencyManagement,
      ...updates,
    }

    await this.writeConfig(config)
  }

  async initializeConfig(): Promise<void> {
    const config = await this.readConfig()

    if (!config.dependencyManagement) {
      config.dependencyManagement = this.defaultConfig
      await this.writeConfig(config)
      console.log('✓ Initialized .polyrc.json with default dependency management settings')
    }
  }

  async hasConfig(): Promise<boolean> {
    try {
      await readFile(this.configFilePath, 'utf-8')
      return true
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return false
      }
      throw error
    }
  }

  validateDependencyConfig(config: PolyDependencyConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (typeof config.autoCatalog !== 'boolean') {
      errors.push('autoCatalog must be a boolean')
    }

    if (typeof config.catalogThreshold !== 'number' || config.catalogThreshold < 1) {
      errors.push('catalogThreshold must be a positive number')
    }

    if (!Array.isArray(config.commonDependencies)) {
      errors.push('commonDependencies must be an array')
    } else {
      config.commonDependencies.forEach((dep, index) => {
        if (typeof dep !== 'string') {
          errors.push(`commonDependencies[${index}] must be a string`)
        }
      })
    }

    if (typeof config.workspaceSpecific !== 'object' || config.workspaceSpecific === null) {
      errors.push('workspaceSpecific must be an object')
    } else {
      Object.entries(config.workspaceSpecific).forEach(([workspace, deps]) => {
        if (!Array.isArray(deps)) {
          errors.push(`workspaceSpecific.${workspace} must be an array`)
        } else {
          deps.forEach((dep, index) => {
            if (typeof dep !== 'string') {
              errors.push(`workspaceSpecific.${workspace}[${index}] must be a string`)
            }
          })
        }
      })
    }

    if (typeof config.autoOptimize !== 'boolean') {
      errors.push('autoOptimize must be a boolean')
    }

    const validStrategies = ['latest', 'exact', 'caret', 'tilde']
    if (!validStrategies.includes(config.versionStrategy)) {
      errors.push(`versionStrategy must be one of: ${validStrategies.join(', ')}`)
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  async addCommonDependency(dependency: string): Promise<void> {
    const config = await this.getDependencyConfig()

    if (!config.commonDependencies.includes(dependency)) {
      config.commonDependencies.push(dependency)
      config.commonDependencies.sort()
      await this.updateDependencyConfig(config)
      console.log(`✓ Added '${dependency}' to common dependencies`)
    }
  }

  async removeCommonDependency(dependency: string): Promise<void> {
    const config = await this.getDependencyConfig()
    const index = config.commonDependencies.indexOf(dependency)

    if (index > -1) {
      config.commonDependencies.splice(index, 1)
      await this.updateDependencyConfig(config)
      console.log(`✓ Removed '${dependency}' from common dependencies`)
    }
  }

  async addWorkspaceSpecificDependencies(workspace: string, dependencies: string[]): Promise<void> {
    const config = await this.getDependencyConfig()

    if (!config.workspaceSpecific[workspace]) {
      config.workspaceSpecific[workspace] = []
    }

    for (const dep of dependencies) {
      if (!config.workspaceSpecific[workspace].includes(dep)) {
        config.workspaceSpecific[workspace].push(dep)
      }
    }

    config.workspaceSpecific[workspace].sort()
    await this.updateDependencyConfig(config)
    console.log(`✓ Added ${dependencies.length} workspace-specific dependencies for '${workspace}'`)
  }

  getDefaultConfigTemplate(): PolyRcConfig {
    return {
      dependencyManagement: this.defaultConfig,
    }
  }

  async resetDependencyConfig(): Promise<void> {
    const config = await this.readConfig()
    config.dependencyManagement = this.defaultConfig
    await this.writeConfig(config)
    console.log('✓ Reset dependency management configuration to defaults')
  }

  async getConfigSummary(): Promise<{
    autoCatalog: boolean
    catalogThreshold: number
    commonDependenciesCount: number
    workspaceSpecificCount: number
    autoOptimize: boolean
    versionStrategy: string
  }> {
    const config = await this.getDependencyConfig()

    return {
      autoCatalog: config.autoCatalog,
      catalogThreshold: config.catalogThreshold,
      commonDependenciesCount: config.commonDependencies.length,
      workspaceSpecificCount: Object.keys(config.workspaceSpecific).length,
      autoOptimize: config.autoOptimize,
      versionStrategy: config.versionStrategy,
    }
  }
}
