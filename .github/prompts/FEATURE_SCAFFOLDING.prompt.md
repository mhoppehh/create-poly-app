---
mode: agent
---

# Feature Scaffolding Guide for AI Models

## Overview

This prompt guides AI models to scaffold new features for the create-poly-app project. The focus is on creating the proper structure, configuration, and form questions - NOT on implementing the actual functionality. Implementation details should be left as placeholders or TODOs for human developers.

## Your Task

When asked to scaffold a new feature, you should:

1. **Analyze the feature request** to understand what the feature should do
2. **Create the feature scaffolding** using the scaffold script
3. **Define form questions** for user configuration
4. **Set up feature structure** with proper stages and dependencies
5. **Leave implementation as TODOs** for human developers

## Step-by-Step Process

### 1. Run the Scaffold Script

Use the scaffold script to create the basic structure:

```bash
pnpm scaffold:feature <feature-name> \
  --display-name "<Human Readable Name>" \
  --description "<Brief description>" \
  --depends-on "<comma-separated-dependencies>" \
  --templates --codemods
```

**Guidelines for scaffold options:**

- Choose a descriptive `kebab-case` feature name
- Write a clear, concise description
- Identify logical dependencies on existing features
- Always include `--templates` and `--codemods` for flexibility

### 2. Define Form Questions

After scaffolding, you need to update the feature's configuration to include form questions that collect user preferences. These questions should cover:

**Common Question Types:**

- **Implementation choice**: Which library/framework to use (e.g., GraphQL client, database provider)
- **Feature toggles**: Optional functionality that can be enabled/disabled
- **Configuration options**: Customizable settings (ports, names, paths)
- **Integration preferences**: How to integrate with other features

**Question Structure Examples:**

```typescript
// Single choice selection
{
  name: 'database-provider',
  prompt: 'Which database provider would you like to use?',
  type: 'select',
  choices: [
    { title: 'PostgreSQL', value: 'postgresql' },
    { title: 'MySQL', value: 'mysql' },
    { title: 'SQLite', value: 'sqlite' }
  ]
}

// Multiple choice selection
{
  name: 'auth-features',
  prompt: 'Which authentication features do you need?',
  type: 'multiselect',
  choices: [
    { title: 'JWT Authentication', value: 'jwt' },
    { title: 'Social Login', value: 'social' },
    { title: 'Two-Factor Auth', value: '2fa' },
    { title: 'Role-Based Access', value: 'rbac' }
  ]
}

// Boolean toggle
{
  name: 'enable-advanced-features',
  prompt: 'Enable advanced configuration options?',
  type: 'confirm',
  initial: false
}

// Text input
{
  name: 'api-port',
  prompt: 'What port should the API server run on?',
  type: 'text',
  initial: '4000'
}
```

### 3. Structure Feature Stages

Design stages that handle different user configurations using conditional activation:

**Stage Design Principles:**

- **Base stage**: Always runs, sets up core functionality
- **Choice-specific stages**: Activated based on user selections
- **Optional feature stages**: Activated by boolean toggles
- **Integration stages**: Activated when multiple features are combined

**Example Stage Structure:**

```typescript
stages: [
  {
    name: 'base-setup',
    // Always runs - core setup
    scripts: [{ src: 'pnpm install core-package', dir: 'api' }],
    templates: [{ source: 'templates/base', destination: 'api/src' }],
  },
  {
    name: 'setup-postgresql',
    activatedBy: ActivationConditions.equals('database-provider', 'postgresql'),
    scripts: [
      // TODO: Add PostgreSQL specific installation commands
    ],
    templates: [
      // TODO: Add PostgreSQL specific templates
    ],
  },
  {
    name: 'setup-mysql',
    activatedBy: ActivationConditions.equals('database-provider', 'mysql'),
    scripts: [
      // TODO: Add MySQL specific installation commands
    ],
  },
  {
    name: 'enable-advanced-config',
    activatedBy: ActivationConditions.equals('enable-advanced-features', true),
    templates: [
      // TODO: Add advanced configuration templates
    ],
  },
]
```

### 4. Create Placeholder Templates

Generate template files with placeholder content:

**Template Guidelines:**

- Use `.hbs` extension for Handlebars templates
- Include variable placeholders: `{{variableName}}`
- Add TODO comments for implementation details
- Structure files logically (config, source, documentation)

**Example Template Content:**

```handlebars
{{! src/features/my-feature/templates/config.json.hbs }}
{ "feature": "{{featureName}}", "provider": "{{databaseProvider}}",
{{#if enableAdvancedFeatures}}
  "advanced": { // TODO: Implement advanced configuration options },
{{/if}}
// TODO: Add feature-specific configuration }
```

### 5. Create Codemod Placeholders

Generate codemod files with function signatures and TODO comments:

```typescript
// src/features/my-feature/codemods/example-codemod.ts
import type { CodeMod } from '../../../types'

export const exampleCodemod: CodeMod = (project, filePath, options) => {
  // TODO: Implement file modifications
  // This codemod should:
  // - Modify existing files to integrate the new feature
  // - Add imports, exports, or configuration changes
  // - Update package.json dependencies if needed

  console.log(`Modifying ${filePath} for feature integration`)
  // Implementation goes here
}
```

## What NOT to Implement

**Avoid these implementation details:**

- Actual package installation commands (leave as TODOs)
- Specific template file contents (use placeholders)
- Detailed codemod implementations (provide structure only)
- Real configuration values (use example/placeholder values)
- Functional code logic (focus on structure)

## Focus Areas

**DO focus on:**

- ✅ Feature structure and organization
- ✅ Form questions for user input
- ✅ Stage activation logic and conditions
- ✅ Dependencies between features
- ✅ Template file organization
- ✅ Codemod function signatures
- ✅ Proper naming conventions

**DON'T implement:**

- ❌ Actual installation scripts
- ❌ Real template content
- ❌ Functional codemod logic
- ❌ Specific package versions
- ❌ Detailed configuration files

## Example Workflow

When asked to scaffold a "payment-processing" feature:

1. **Run scaffold script**:

   ```bash
   pnpm scaffold:feature payment-processing \
     --display-name "Payment Processing" \
     --description "Integrate payment providers for e-commerce functionality" \
     --depends-on "apollo-server,database" \
     --templates --codemods
   ```

2. **Add form questions** for payment provider selection, webhook configuration, etc.

3. **Create stages** for different providers (Stripe, PayPal, Square) using conditional activation

4. **Generate template files** with placeholder content for API routes, database schemas, client components

5. **Create codemod placeholders** for integrating payment routes with existing server setup

6. **Document TODOs** for implementation details that developers need to complete

## Success Criteria

A properly scaffolded feature should have:

- [ ] Clear, descriptive feature name and description
- [ ] Comprehensive form questions covering all user choices
- [ ] Well-structured stages with proper activation conditions
- [ ] Organized template directory with placeholder files
- [ ] Codemod functions with clear TODO comments
- [ ] Proper dependencies declared
- [ ] No actual implementation details (left as TODOs)

## Remember

Your job is to create the **structure and configuration**, not the **implementation**. Leave detailed implementation work for human developers who understand the specific requirements and can test the functionality properly.
