import { CatalogManager } from './catalog-manager'
import { WorkspaceManager } from './workspace-manager'
import { DependencyAnalyzer } from './analyzer'
import { ConfigManager } from './config-manager'
import type {
  ProcessedDependencyAddition,
  DependencyAnalysis,
  DependencyResolution,
  OptimizationReport,
  PolyDependencyConfig,
  DependencyManager as IDependencyManager,
} from './types'

export class DependencyManager implements IDependencyManager {
  private catalogManager: CatalogManager
  private workspaceManager: WorkspaceManager
  private analyzer: DependencyAnalyzer
  private configManager: ConfigManager
  private config: PolyDependencyConfig | null = null

  constructor(
    private rootPath: string,
    config?: Partial<PolyDependencyConfig>,
  ) {
    this.catalogManager = new CatalogManager(rootPath)
    this.workspaceManager = new WorkspaceManager(rootPath)
    this.analyzer = new DependencyAnalyzer(rootPath)
    this.configManager = new ConfigManager(rootPath)

    if (config) {
      this.config = {
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
        autoOptimize: true,
        versionStrategy: 'caret',
        ...config,
      }
    }
  }

  private async getConfig(): Promise<PolyDependencyConfig> {
    if (!this.config) {
      this.config = await this.configManager.getDependencyConfig()
    }
    return this.config
  }

  async addDependency(dep: ProcessedDependencyAddition): Promise<void> {
    console.log(`Adding dependency: ${dep.name} to ${dep.workspace}`)

    const resolution = await this.resolveDependency(dep)

    switch (resolution.action) {
      case 'use-catalog':
        await this.workspaceManager.addDependency(dep.workspace, dep.name, 'catalog:', dep.type)
        console.log(`✓ Added ${dep.name} using catalog reference`)
        break

      case 'add-to-catalog':
        if (resolution.catalogEntry) {
          await this.catalogManager.addCatalogEntry(resolution.catalogEntry.name, resolution.catalogEntry.version)
          await this.workspaceManager.addDependency(dep.workspace, dep.name, 'catalog:', dep.type)
          console.log(`✓ Added ${dep.name} to catalog and workspace`)

          await this.convertExistingToCatalog(dep.name)
        }
        break

      case 'add-direct':
        const version = dep.version || (await this.getLatestVersion(dep.name))
        await this.workspaceManager.addDependency(dep.workspace, dep.name, await this.formatVersion(version), dep.type)
        console.log(`✓ Added ${dep.name}@${version} directly to ${dep.workspace}`)
        break

      case 'conflict':
        console.warn(`⚠ Conflict detected for ${dep.name}: ${resolution.reason}`)
        if (resolution.warnings) {
          resolution.warnings.forEach(warning => console.warn(`  - ${warning}`))
        }

        if (dep.force) {
          const version = dep.version || (await this.getLatestVersion(dep.name))
          await this.workspaceManager.addDependency(
            dep.workspace,
            dep.name,
            await this.formatVersion(version),
            dep.type,
          )
          console.log(`✓ Force added ${dep.name}@${version} to ${dep.workspace}`)
        } else {
          throw new Error(`Cannot add ${dep.name}: ${resolution.reason}. Use force=true to override.`)
        }
        break
    }
  }

  async addDependencies(deps: ProcessedDependencyAddition[]): Promise<void> {
    console.log(`Adding ${deps.length} dependencies...`)

    const resolutions = new Map<ProcessedDependencyAddition, DependencyResolution>()

    for (const dep of deps) {
      const resolution = await this.resolveDependency(dep)
      resolutions.set(dep, resolution)
    }

    const catalogEntries: Array<{ name: string; version: string }> = []

    for (const [, resolution] of resolutions.entries()) {
      if (resolution.action === 'add-to-catalog' && resolution.catalogEntry) {
        catalogEntries.push(resolution.catalogEntry)
      }
    }

    if (catalogEntries.length > 0) {
      await this.catalogManager.addCatalogEntries(catalogEntries)
      console.log(`✓ Added ${catalogEntries.length} entries to catalog`)
    }

    const workspaceAdditions = new Map<
      string,
      Array<{ name: string; version: string; type: 'dependencies' | 'devDependencies' }>
    >()

    for (const [dep, resolution] of resolutions.entries()) {
      if (!workspaceAdditions.has(dep.workspace)) {
        workspaceAdditions.set(dep.workspace, [])
      }

      let version: string

      switch (resolution.action) {
        case 'use-catalog':
        case 'add-to-catalog':
          version = 'catalog:'
          break
        case 'add-direct':
          version = await this.formatVersion(dep.version || (await this.getLatestVersion(dep.name)))
          break
        default:
          if (dep.force) {
            version = await this.formatVersion(dep.version || (await this.getLatestVersion(dep.name)))
          } else {
            console.warn(`⚠ Skipping ${dep.name} due to conflict: ${resolution.reason}`)
            continue
          }
      }

      workspaceAdditions.get(dep.workspace)!.push({
        name: dep.name,
        version,
        type: dep.type,
      })
    }

    for (const [workspace, dependencies] of workspaceAdditions.entries()) {
      if (dependencies.length > 0) {
        await this.workspaceManager.addDependencies(workspace, dependencies)
        console.log(`✓ Added ${dependencies.length} dependencies to ${workspace}`)
      }
    }

    for (const catalogEntry of catalogEntries) {
      await this.convertExistingToCatalog(catalogEntry.name)
    }
  }

  async createCatalogEntry(name: string, version: string): Promise<void> {
    await this.catalogManager.addCatalogEntry(name, version)
    console.log(`✓ Added ${name}@${version} to catalog`)

    await this.convertExistingToCatalog(name)
  }

  async checkIfShouldBeCatalog(name: string): Promise<boolean> {
    const config = await this.getConfig()
    const result = await this.analyzer.shouldBeCatalogued(name, config)
    return result.shouldCatalog
  }

  async analyzeDependencies(): Promise<DependencyAnalysis> {
    return this.analyzer.analyzeDependencies()
  }

  async optimizeWorkspace(): Promise<OptimizationReport> {
    console.log('Analyzing workspace for optimization opportunities...')

    const config = await this.getConfig()
    const report = await this.analyzer.generateOptimizationReport(config)

    if (config.autoOptimize) {
      console.log(`Applying ${report.suggestions.length} optimizations...`)

      for (const suggestion of report.suggestions) {
        try {
          await this.applySuggestion(suggestion)
          console.log(`✓ Applied: ${suggestion.description}`)
        } catch (error) {
          console.warn(`⚠ Failed to apply suggestion: ${suggestion.description}`)
          console.warn(`  Error: ${error}`)
        }
      }
    } else {
      console.log(`Found ${report.suggestions.length} optimization opportunities`)
      report.suggestions.forEach(suggestion => {
        console.log(`  ${suggestion.impact.toUpperCase()}: ${suggestion.description}`)
      })
    }

    return report
  }

  async migrateToCatalog(): Promise<void> {
    console.log('Migrating workspace to catalog approach...')

    const config = await this.getConfig()
    const analysis = await this.analyzeDependencies()

    const catalogEntries: Array<{ name: string; version: string }> = []

    for (const duplicate of analysis.duplicates) {
      if (duplicate.versions.length > 1) {
        const bestVersion = this.determineBestVersion(duplicate.versions.map(v => v.version))
        catalogEntries.push({ name: duplicate.name, version: bestVersion })
      }
    }

    for (const commonDep of config.commonDependencies) {
      const existingDep = analysis.workspaceDependencies.find(dep => dep.name === commonDep)
      if (existingDep && !catalogEntries.find(entry => entry.name === commonDep)) {
        catalogEntries.push({ name: commonDep, version: existingDep.version })
      }
    }

    if (catalogEntries.length > 0) {
      await this.catalogManager.addCatalogEntries(catalogEntries)
      console.log(`✓ Added ${catalogEntries.length} entries to catalog`)

      for (const entry of catalogEntries) {
        await this.convertExistingToCatalog(entry.name)
      }
    }

    await this.catalogManager.sortCatalog()

    const workspaces = await this.catalogManager.getWorkspaces()
    for (const workspace of ['root', ...workspaces]) {
      await this.workspaceManager.sortDependencies(workspace)
      await this.workspaceManager.cleanupEmptyDependencies(workspace)
    }

    console.log('✓ Migration completed')
  }

  private async resolveDependency(dep: ProcessedDependencyAddition): Promise<DependencyResolution> {
    const config = await this.getConfig()

    const catalogEntry = await this.catalogManager.getCatalogEntry(dep.name)
    if (catalogEntry) {
      return {
        action: 'use-catalog',
        reason: 'Dependency exists in catalog',
      }
    }

    const shouldCatalog = await this.checkIfShouldBeCatalog(dep.name)

    if (shouldCatalog || config.autoCatalog) {
      const workspaces = await this.catalogManager.getWorkspaces()
      const allWorkspaces = ['root', ...workspaces]

      let existingVersion: string | null = null
      let workspaceCount = 0

      for (const workspace of allWorkspaces) {
        const existing = await this.workspaceManager.getDependency(workspace, dep.name)
        if (existing && existing.version !== 'catalog:') {
          existingVersion = existing.version
          workspaceCount++
        }
      }

      if (workspaceCount > 0) {
        const version = dep.version || existingVersion || (await this.getLatestVersion(dep.name))

        return {
          action: 'add-to-catalog',
          catalogEntry: { name: dep.name, version: await this.formatVersion(version) },
          reason: `Dependency found in ${workspaceCount} workspace(s), adding to catalog`,
        }
      }

      if (config.commonDependencies.includes(dep.name)) {
        const version = dep.version || (await this.getLatestVersion(dep.name))

        return {
          action: 'add-to-catalog',
          catalogEntry: { name: dep.name, version: await this.formatVersion(version) },
          reason: 'Common dependency, adding to catalog',
        }
      }
    }

    const existing = await this.workspaceManager.getDependency(dep.workspace, dep.name)
    if (existing && existing.version !== 'catalog:') {
      const requestedVersion = dep.version || (await this.getLatestVersion(dep.name))
      const formattedVersion = await this.formatVersion(requestedVersion)

      if (existing.version !== formattedVersion) {
        return {
          action: 'conflict',
          reason: `Version conflict: existing ${existing.version} vs requested ${formattedVersion}`,
          warnings: [`Existing dependency will be overwritten`],
        }
      }
    }

    return {
      action: 'add-direct',
      reason: 'Adding directly to workspace',
    }
  }

  private async convertExistingToCatalog(dependencyName: string): Promise<void> {
    const workspaces = await this.catalogManager.getWorkspaces()
    const allWorkspaces = ['root', ...workspaces]

    for (const workspace of allWorkspaces) {
      const existing = await this.workspaceManager.getDependency(workspace, dependencyName)
      if (existing && existing.version !== 'catalog:') {
        await this.workspaceManager.convertToCatalogReference(workspace, dependencyName)
      }
    }
  }

  private async applySuggestion(suggestion: any): Promise<void> {
    switch (suggestion.type) {
      case 'catalog':
        if (suggestion.suggestedVersion) {
          await this.createCatalogEntry(suggestion.dependency, suggestion.suggestedVersion)
        }
        break

      case 'duplicate-removal':
        await this.catalogManager.removeCatalogEntry(suggestion.dependency)
        break

      case 'version-conflict':
        if (suggestion.suggestedVersion) {
          const catalogEntry = await this.catalogManager.getCatalogEntry(suggestion.dependency)
          if (catalogEntry) {
            await this.catalogManager.updateCatalogEntry(suggestion.dependency, suggestion.suggestedVersion)
          }
        }
        break
    }
  }

  private determineBestVersion(versions: string[]): string {
    const actualVersions = versions.filter(v => v !== 'catalog:')

    if (actualVersions.length === 0) return 'latest'
    if (actualVersions.length === 1) return actualVersions[0]!

    if (actualVersions.includes('latest')) return 'latest'
    if (actualVersions.includes('next')) return 'next'

    const caretVersions = actualVersions.filter(v => v.startsWith('^'))
    if (caretVersions.length > 0) return caretVersions[0]!

    const tildeVersions = actualVersions.filter(v => v.startsWith('~'))
    if (tildeVersions.length > 0) return tildeVersions[0]!

    return actualVersions[0]!
  }

  private async formatVersion(version: string): Promise<string> {
    if (version === 'latest' || version === 'next' || version.match(/^[\^~]/)) {
      return version
    }

    const config = await this.getConfig()
    switch (config.versionStrategy) {
      case 'caret':
        return `^${version}`
      case 'tilde':
        return `~${version}`
      case 'exact':
        return version
      case 'latest':
      default:
        return version.includes('.') ? `^${version}` : version
    }
  }

  private async getLatestVersion(name: string): Promise<string> {
    console.log(`Resolving latest version for ${name}`)
    return 'latest'
  }
}
