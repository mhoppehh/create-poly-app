import { CatalogManager } from './catalog-manager'
import { WorkspaceManager } from './workspace-manager'
import type {
  DependencyAnalysis,
  DependencyConflict,
  OptimizationReport,
  OptimizationSuggestion,
  WorkspaceDependency,
  PolyDependencyConfig,
} from './types'

export class DependencyAnalyzer {
  private catalogManager: CatalogManager
  private workspaceManager: WorkspaceManager

  constructor(private rootPath: string) {
    this.catalogManager = new CatalogManager(rootPath)
    this.workspaceManager = new WorkspaceManager(rootPath)
  }

  async analyzeDependencies(): Promise<DependencyAnalysis> {
    const catalogEntries = await this.catalogManager.getCatalogEntries()
    const workspaces = await this.catalogManager.getWorkspaces()

    const workspaceDependencies: WorkspaceDependency[] = []
    for (const workspace of ['root', ...workspaces]) {
      const deps = await this.workspaceManager.getDependencies(workspace)
      workspaceDependencies.push(...deps)
    }

    const duplicates = this.findDuplicateDependencies(workspaceDependencies)

    const missingFromCatalog = this.findMissingCatalogEntries(workspaceDependencies, catalogEntries)

    const unusedCatalogEntries = this.findUnusedCatalogEntries(catalogEntries, workspaceDependencies)

    return {
      catalogEntries,
      workspaceDependencies,
      duplicates,
      missingFromCatalog,
      unusedCatalogEntries,
    }
  }

  private findDuplicateDependencies(dependencies: WorkspaceDependency[]): DependencyConflict[] {
    const dependencyMap = new Map<string, Array<{ workspace: string; version: string }>>()

    for (const dep of dependencies) {
      if (!dependencyMap.has(dep.name)) {
        dependencyMap.set(dep.name, [])
      }
      dependencyMap.get(dep.name)!.push({
        workspace: dep.workspace,
        version: dep.version,
      })
    }

    const conflicts: DependencyConflict[] = []

    for (const [name, occurrences] of dependencyMap.entries()) {
      if (occurrences.length > 1) {
        const versionMap = new Map<string, string[]>()

        for (const occurrence of occurrences) {
          if (!versionMap.has(occurrence.version)) {
            versionMap.set(occurrence.version, [])
          }
          versionMap.get(occurrence.version)!.push(occurrence.workspace)
        }

        if (versionMap.size > 1 || occurrences.length > 1) {
          conflicts.push({
            name,
            versions: Array.from(versionMap.entries()).map(([version, workspaces]) => ({
              version,
              workspaces,
            })),
          })
        }
      }
    }

    return conflicts
  }

  private findMissingCatalogEntries(workspaceDependencies: WorkspaceDependency[], catalogEntries: any[]): string[] {
    const catalogNames = new Set(catalogEntries.map(entry => entry.name))
    const duplicates = this.findDuplicateDependencies(workspaceDependencies)

    return duplicates.filter(duplicate => !catalogNames.has(duplicate.name)).map(duplicate => duplicate.name)
  }

  private findUnusedCatalogEntries(catalogEntries: any[], workspaceDependencies: WorkspaceDependency[]): string[] {
    const usedDependencies = new Set(workspaceDependencies.map(dep => dep.name))

    return catalogEntries.filter(entry => !usedDependencies.has(entry.name)).map(entry => entry.name)
  }

  async generateOptimizationSuggestions(config: PolyDependencyConfig): Promise<OptimizationSuggestion[]> {
    const analysis = await this.analyzeDependencies()
    const suggestions: OptimizationSuggestion[] = []

    for (const duplicate of analysis.duplicates) {
      const suggestedVersion = this.determineBestVersion(duplicate.versions.map(v => v.version))

      suggestions.push({
        type: 'catalog',
        dependency: duplicate.name,
        description: `Add '${duplicate.name}' to catalog to unify versions across workspaces`,
        impact: duplicate.versions.length > 2 ? 'high' : 'medium',
        workspaces: duplicate.versions.flatMap(v => v.workspaces),
        suggestedVersion,
      })
    }

    for (const unused of analysis.unusedCatalogEntries) {
      suggestions.push({
        type: 'duplicate-removal',
        dependency: unused,
        description: `Remove unused catalog entry '${unused}'`,
        impact: 'low',
        workspaces: [],
      })
    }

    for (const duplicate of analysis.duplicates) {
      if (duplicate.versions.length > 1) {
        const conflictingVersions = duplicate.versions.filter(v => v.version !== 'catalog:')
        if (conflictingVersions.length > 1) {
          suggestions.push({
            type: 'version-conflict',
            dependency: duplicate.name,
            description: `Resolve version conflict for '${duplicate.name}' (${conflictingVersions.map(v => v.version).join(', ')})`,
            impact: 'high',
            workspaces: duplicate.versions.flatMap(v => v.workspaces),
            suggestedVersion: this.determineBestVersion(conflictingVersions.map(v => v.version)),
          })
        }
      }
    }

    const workspaceDeps = analysis.workspaceDependencies.filter(
      dep => !dep.version.startsWith('catalog:') && config.commonDependencies.includes(dep.name),
    )

    const commonDepGroups = new Map<string, WorkspaceDependency[]>()
    for (const dep of workspaceDeps) {
      if (!commonDepGroups.has(dep.name)) {
        commonDepGroups.set(dep.name, [])
      }
      commonDepGroups.get(dep.name)!.push(dep)
    }

    for (const [depName, deps] of commonDepGroups.entries()) {
      if (deps.length >= config.catalogThreshold) {
        suggestions.push({
          type: 'catalog',
          dependency: depName,
          description: `Add common dependency '${depName}' to catalog`,
          impact: 'medium',
          workspaces: deps.map(d => d.workspace),
          suggestedVersion: this.determineBestVersion(deps.map(d => d.version)),
        })
      }
    }

    return suggestions.sort((a, b) => {
      const impactOrder = { high: 3, medium: 2, low: 1 }
      return impactOrder[b.impact] - impactOrder[a.impact]
    })
  }

  private determineBestVersion(versions: string[]): string {
    const actualVersions = versions.filter(v => v !== 'catalog:')

    if (actualVersions.length === 0) {
      return 'latest'
    }

    if (actualVersions.length === 1) {
      return actualVersions[0]!
    }

    if (actualVersions.includes('latest')) {
      return 'latest'
    }

    if (actualVersions.includes('next')) {
      return 'next'
    }

    const caretVersions = actualVersions.filter(v => v.startsWith('^'))
    if (caretVersions.length > 0) {
      return caretVersions[0]!
    }

    const tildeVersions = actualVersions.filter(v => v.startsWith('~'))
    if (tildeVersions.length > 0) {
      return tildeVersions[0]!
    }

    return actualVersions[0]!
  }

  async generateOptimizationReport(config: PolyDependencyConfig): Promise<OptimizationReport> {
    const analysis = await this.analyzeDependencies()
    const suggestions = await this.generateOptimizationSuggestions(config)

    return {
      duplicates: analysis.duplicates,
      suggestions,
      potentialCatalogEntries: analysis.missingFromCatalog,
      conflictsResolved: suggestions.filter(s => s.type === 'version-conflict').length,
      duplicatesRemoved: suggestions.filter(s => s.type === 'duplicate-removal').length,
    }
  }

  async shouldBeCatalogued(
    dependencyName: string,
    config: PolyDependencyConfig,
  ): Promise<{ shouldCatalog: boolean; reason: string }> {
    if (config.commonDependencies.includes(dependencyName)) {
      return {
        shouldCatalog: true,
        reason: 'Listed as common dependency in configuration',
      }
    }

    const workspaces = await this.catalogManager.getWorkspaces()
    const allWorkspaces = ['root', ...workspaces]

    let usageCount = 0
    for (const workspace of allWorkspaces) {
      if (await this.workspaceManager.hasDependency(workspace, dependencyName)) {
        usageCount++
      }
    }

    if (usageCount >= config.catalogThreshold) {
      return {
        shouldCatalog: true,
        reason: `Used in ${usageCount} workspaces (threshold: ${config.catalogThreshold})`,
      }
    }

    return {
      shouldCatalog: false,
      reason: `Only used in ${usageCount} workspace(s), below threshold of ${config.catalogThreshold}`,
    }
  }

  async getDependencyStats(): Promise<{
    totalDependencies: number
    catalogDependencies: number
    duplicatedDependencies: number
    workspaceCount: number
    averageDependenciesPerWorkspace: number
  }> {
    const analysis = await this.analyzeDependencies()
    const workspaces = await this.catalogManager.getWorkspaces()

    return {
      totalDependencies: analysis.workspaceDependencies.length,
      catalogDependencies: analysis.catalogEntries.length,
      duplicatedDependencies: analysis.duplicates.length,
      workspaceCount: workspaces.length + 1,
      averageDependenciesPerWorkspace: analysis.workspaceDependencies.length / (workspaces.length + 1),
    }
  }
}
