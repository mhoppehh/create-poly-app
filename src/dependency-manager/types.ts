export interface DependencyAddition {
  name: string | string[]
  version?: string
  workspace: 'root' | 'api' | 'web' | 'mobile' | string
  type: 'dependencies' | 'devDependencies'
  force?: boolean
}

export interface ProcessedDependencyAddition {
  name: string
  version?: string
  workspace: 'root' | 'api' | 'web' | 'mobile' | string
  type: 'dependencies' | 'devDependencies'
  force?: boolean
}

export interface CatalogEntry {
  name: string
  version: string
}

export interface WorkspaceDependency {
  name: string
  version: string
  type: 'dependencies' | 'devDependencies'
  workspace: string
  packageJsonPath: string
}

export interface DependencyConflict {
  name: string
  versions: Array<{
    version: string
    workspaces: string[]
  }>
}

export interface OptimizationSuggestion {
  type: 'catalog' | 'version-conflict' | 'duplicate-removal'
  dependency: string
  description: string
  impact: 'high' | 'medium' | 'low'
  workspaces: string[]
  suggestedVersion?: string
}

export interface OptimizationReport {
  duplicates: DependencyConflict[]
  suggestions: OptimizationSuggestion[]
  potentialCatalogEntries: string[]
  conflictsResolved: number
  duplicatesRemoved: number
}

export interface DependencyAnalysis {
  catalogEntries: CatalogEntry[]
  workspaceDependencies: WorkspaceDependency[]
  duplicates: DependencyConflict[]
  missingFromCatalog: string[]
  unusedCatalogEntries: string[]
}

export interface DependencyManager {
  addDependency(dep: DependencyAddition): Promise<void>
  addDependencies(deps: DependencyAddition[]): Promise<void>
  createCatalogEntry(name: string, version: string): Promise<void>
  checkIfShouldBeCatalog(name: string): Promise<boolean>
  analyzeDependencies(): Promise<DependencyAnalysis>
  optimizeWorkspace(): Promise<OptimizationReport>
  migrateToCatalog(): Promise<void>
}

export interface PolyDependencyConfig {
  autoCatalog: boolean
  catalogThreshold: number
  commonDependencies: string[]
  workspaceSpecific: Record<string, string[]>
  autoOptimize: boolean
  versionStrategy: 'latest' | 'exact' | 'caret' | 'tilde'
}

export interface PnpmWorkspaceConfig {
  packages: string[]
  catalog?: Record<string, string>
}

export interface PackageJsonDeps {
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
}

export interface DependencyResolution {
  action: 'add-to-catalog' | 'add-direct' | 'use-catalog' | 'conflict'
  catalogEntry?: CatalogEntry
  reason: string
  warnings?: string[]
}

export interface FeatureStageWithDependencies {
  name: string
  scripts?: Array<{ src: string | ((args: any, config?: Record<string, any>) => string); dir?: string }>
  dependencies?: DependencyAddition[]
  templates?: Array<{ source: string; destination: string; context?: any }>
  mods?: Record<string, Array<(filePath: string, config?: Record<string, any>) => void | Promise<void>>>
  activatedBy?: any
}

export interface FeatureWithDependencies {
  id: string
  name: string
  description: string
  dependsOn?: string[]
  activatedBy?: any
  configuration?: any[]
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  scripts?: Record<string, string>
  configMerges?: Record<string, object>
  stages?: FeatureStageWithDependencies[]
}
