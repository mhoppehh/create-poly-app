---
mode: agent
---

# Feature Scaffolding Guide for AI Models

## Overview

This project includes an automated feature scaffolding script that generates new features following established patterns and conventions. The script creates properly structured feature folders with templates, codemods, and configuration files.

## Usage

### Basic Command

```bash
pnpm scaffold:feature <feature-name>
```

### Available Options

- `--display-name <name>` - Human-readable name for the feature
- `--description <text>` - Brief description of what the feature does
- `--depends-on <features>` - Comma-separated list of feature dependencies
- `--templates` - Generate templates directory with example .hbs files
- `--template-files <files>` - Comma-separated list of specific template files to create (empty files)
- `--codemods` - Generate codemods directory with example file modification functions
- `--scripts` - Include scripts configuration in the feature definition

### Examples

**Simple feature:**

```bash
pnpm scaffold:feature database
```

**Full-featured scaffold:**

```bash
pnpm scaffold:feature auth-system \
  --display-name "Authentication System" \
  --description "JWT-based authentication with role management" \
  --depends-on "vite,apollo-server" \
  --templates --codemods --scripts
```

**Custom template files:**

```bash
pnpm scaffold:feature database \
  --display-name "Database Layer" \
  --description "Database configuration and models" \
  --template-files "schema.prisma.hbs,config/database.json.hbs,src/models/user.ts.hbs,src/index.ts.hbs"
```

## Generated Structure

When scaffolding a feature called `my-feature`, the script creates:

```
src/features/my-feature/
├── index.ts                           # Feature definition with stages
├── templates/ (if --templates)        # Handlebars template files
│   └── example.html.hbs
└── codemods/ (if --codemods)          # File modification functions
    └── example-my-feature-codemod.ts
```

## Key Concepts

### Feature Definition

Every feature exports a `Feature` object with:

- **id**: kebab-case identifier
- **name**: Display name
- **description**: Brief explanation
- **dependsOn**: Array of prerequisite features
- **stages**: Array of installation/setup steps

### Stages

Features execute in stages that can include:

- **scripts**: Shell commands to run
- **templates**: Handlebars files to process and copy
- **mods**: Code modifications using ts-morph
- **activatedBy**: Conditional activation rules that determine if the stage should run

#### Stage Activation System

Stages can be conditionally activated based on user inputs through the `activatedBy` property. This allows features to include optional functionality or different implementations based on user preferences.

**Stage Structure:**

```typescript
{
  name: 'stage-name',
  activatedBy?: FeatureActivationRule | FeatureActivationCondition,
  scripts?: InstallScript[],
  templates?: InstallTemplate[],
  mods?: Record<string, CodeMod[]>
}
```

**Activation Conditions:**

- `ActivationConditions.equals(questionId, value)` - Activates when answer equals specific value
- `ActivationConditions.includesValue(questionId, value)` - Activates when array answer includes value
- `ActivationConditions.isOneOf(questionId, values)` - Activates when answer is one of provided values
- `ActivationConditions.custom(questionId, evaluator)` - Custom evaluation function

**Activation Rules (for complex logic):**

- `ActivationRules.and(...conditions)` - All conditions must be true
- `ActivationRules.or(...conditions)` - At least one condition must be true

**Examples:**

```typescript
// Simple condition - only run if GraphQL client is Apollo
{
  name: 'setup-apollo-client',
  activatedBy: ActivationConditions.equals('graphqlClient', 'apollo-client'),
  scripts: [{ src: 'pnpm install @apollo/client', dir: 'web' }]
}

// Complex condition - run if both conditions are met
{
  name: 'setup-advanced-features',
  activatedBy: ActivationRules.and(
    ActivationConditions.includesValue('features', 'advanced-mode'),
    ActivationConditions.equals('databaseProvider', 'postgresql')
  ),
  scripts: [{ src: 'pnpm install advanced-pg-features', dir: 'api' }]
}

// Custom evaluation
{
  name: 'conditional-setup',
  activatedBy: ActivationConditions.custom('customField', (value, allAnswers) => {
    return value === 'special' && allAnswers.environment === 'production'
  }),
  templates: [{ source: 'templates/production', destination: 'config' }]
}
```

### Templates

- Use `.hbs` extension for Handlebars templates
- Support variable interpolation: `{{variableName}}`

### Codemods

- Functions that modify existing files using ts-morph
- Common use cases: updating package.json, adding imports, modifying configs
- **Use sparingly**: Only when terminal commands or templates cannot achieve the desired result

## Implementation Strategy

### Stage Activation Strategy

When designing features with multiple stages, consider using conditional activation to:

1. **Support multiple implementations**: Different GraphQL clients, database providers, or styling frameworks
2. **Enable optional features**: Advanced configurations, development tools, or integrations
3. **Environment-specific setup**: Different configurations for development vs production
4. **User preference customization**: Allow users to opt-in/out of specific functionality

**Best Practices for Stage Activation:**

- **Use descriptive stage names** that clearly indicate what functionality they provide
- **Group related functionality** in single stages rather than splitting unnecessarily
- **Consider dependencies** between stages when using activation conditions
- **Test activation logic** by ensuring all combinations of user inputs work correctly
- **Document activation requirements** in feature descriptions and comments

**Common Activation Patterns:**

```typescript
// Multiple implementation pattern (GraphQL clients)
stages: [
  {
    name: 'setup-apollo-client',
    activatedBy: ActivationConditions.equals('graphqlClient', 'apollo-client'),
    // Apollo-specific setup
  },
  {
    name: 'setup-urql',
    activatedBy: ActivationConditions.equals('graphqlClient', 'urql'),
    // URQL-specific setup
  },
]

// Optional feature pattern
stages: [
  {
    name: 'basic-setup',
    // Always runs - no activatedBy
    scripts: [{ src: 'npm install core-package' }],
  },
  {
    name: 'enable-advanced-features',
    activatedBy: ActivationConditions.equals('enableAdvanced', true),
    scripts: [{ src: 'npm install advanced-package' }],
  },
]

// Conditional dependency pattern
stages: [
  {
    name: 'setup-database-with-auth',
    activatedBy: ActivationRules.and(
      ActivationConditions.includesValue('features', 'database'),
      ActivationConditions.includesValue('features', 'authentication'),
    ),
    scripts: [{ src: 'npm install auth-db-integration' }],
  },
]
```

### When to Use Terminal Commands (Preferred)

Use scripts in the `scripts` array for:

- Installing dependencies: `pnpm install package-name`
- Initializing tools: `npx create-react-app`, `prisma init`
- Running setup commands: `pnpm build`, `git init`
- Package management operations: `npm update`, `npm uninstall`

Example:

```typescript
scripts: [
  { src: 'pnpm install @prisma/client prisma', dir: 'api' },
  { src: 'npx prisma init', dir: 'api' },
]
```

### When to Use Templates (Secondary)

Use templates for:

- Creating new source code files
- Configuration files with dynamic content
- Documentation files
- Any file that needs variable interpolation

Example:

```typescript
templates: [
  {
    source: 'src/features/my-feature/templates',
    destination: 'api/src',
  },
]
```

### When to Use Codemods (Last Resort)

Use codemods only for:

- Complex modifications to existing files that can't be automated via CLI
- Adding specific imports or exports to existing files
- Modifying configuration objects in existing files
- Workspace configuration updates (pnpm-workspace.yaml, etc.)

Example:

```typescript
mods: {
  'pnpm-workspace.yaml': [addToWorkspace],
  'existing-config.js': [modifyExistingConfig],
}
```

## Best Practices for AI Models

When creating new features:

1. **Use descriptive names** in kebab-case (e.g., `stripe-payments`, `user-auth`)
2. **Include dependencies** if your feature builds on others
3. **Plan for conditional functionality** using stage activation when features have multiple implementations or optional components
4. **Design activation logic carefully** to ensure all user input combinations are handled properly
5. **Prefer terminal commands over codemods** when possible (e.g., use `pnpm install package` instead of manually modifying package.json)
6. **Use templates for all new files** unless the file can be created via terminal commands (e.g., configuration files, source code)
7. **Add codemods only when necessary** for complex file modifications that can't be achieved via terminal commands
8. **Follow the existing patterns** in other features for consistency
9. **Test activation conditions** by considering different user input scenarios
10. **Document stage purpose** with clear, descriptive stage names and comments

### Stage Activation Guidelines

- **Always activate stages**: Stages without `activatedBy` run unconditionally when the feature is enabled
- **Conditional stages**: Use `activatedBy` for stages that should only run under specific conditions
- **Complex conditions**: Use `ActivationRules.and()` and `ActivationRules.or()` for multi-condition logic
- **Custom logic**: Use `ActivationConditions.custom()` for complex evaluation scenarios
- **Question dependencies**: Ensure activation questions are defined in the feature's `configuration` array
- **Logical grouping**: Group related setup steps in single stages rather than splitting unnecessarily

### Rule Priority

1. **Terminal commands first**: If something can be achieved with a terminal command (installing packages, initializing configs), prefer that over file modifications
2. **Templates for new files**: If a new file needs to be created, always use a template (.hbs file) to ensure consistency and proper structure
3. **Codemods as last resort**: Only use codemods for complex modifications that cannot be achieved through terminal commands or templates

## Naming Conventions

- Feature names: `kebab-case` (lowercase with hyphens)
- Display names: `Title Case`
- File names: Follow existing project patterns
- Function names: `camelCase`
