export { DependencyManager } from './index'
export { CatalogManager } from './catalog-manager'
export { WorkspaceManager } from './workspace-manager'
export { DependencyAnalyzer } from './analyzer'
export { ConfigManager } from './config-manager'

export type {
  DependencyAddition,
  ProcessedDependencyAddition,
  CatalogEntry,
  WorkspaceDependency,
  DependencyConflict,
  OptimizationSuggestion,
  OptimizationReport,
  DependencyAnalysis,
  DependencyManager as IDependencyManager,
  PolyDependencyConfig,
  PnpmWorkspaceConfig,
  PackageJsonDeps,
  DependencyResolution,
  FeatureStageWithDependencies,
  FeatureWithDependencies,
} from './types'
