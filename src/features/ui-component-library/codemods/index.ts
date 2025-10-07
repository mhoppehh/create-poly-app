// Codemods for UI Component Library Feature
// These codemods handle file modifications for component library integration

// Package and workspace configuration
export {
  configureSharedPackageJson,
  configureWebPackageJson,
  updateWorkspaceConfig,
  updateMainPackageJson,
  configureViteIntegration,
  configureTypeScriptPaths,
} from './configure-packages'

// Dependency management
export {
  configureComponentLibraryDeps,
  configureDesignSystemDeps,
  configureTestingDeps,
  configureIntegrationDeps,
  configureMobileDeps,
} from './configure-dependencies'

// Application and system integrations
export {
  configureAppIntegration,
  configureStylingIntegration,
  configureStorybookIntegration,
  configureGraphQLIntegration,
  configureFormIntegration,
  configureAccessibilityIntegration,
} from './configure-integrations'

// TODO: Add additional codemods as needed
// TODO: Create codemods for specific component library setups
// TODO: Add codemods for mobile platform integration
// TODO: Create codemods for advanced build configurations
