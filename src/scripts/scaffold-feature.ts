#!/usr/bin/env node

import * as path from 'path'
import * as fs from 'fs'
import * as fsp from 'fs/promises'
import { fileURLToPath } from 'url'
import handlebars from 'handlebars'
import { Project } from 'ts-morph'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

interface ScaffoldFeatureOptions {
  featureName: string
  displayName?: string
  description?: string
  dependsOn?: string[]
  hasTemplates?: boolean
  templateFiles?: string[]
  hasCodemods?: boolean
  hasScripts?: boolean
}

class FeatureScaffolder {
  private featuresDir: string

  constructor() {
    this.featuresDir = path.join(__dirname, '../features')
  }

  async scaffold(options: ScaffoldFeatureOptions): Promise<void> {
    const {
      featureName,
      displayName = this.toTitleCase(featureName),
      description = `A new feature: ${featureName}`,
      dependsOn = [],
      hasTemplates = false,
      templateFiles = [],
      hasCodemods = false,
      hasScripts = false,
    } = options

    console.log(`🚀 Scaffolding new feature: ${featureName}`)

    this.validateFeatureName(featureName)

    const featureDir = path.join(this.featuresDir, featureName)
    await this.createDirectory(featureDir)

    await this.generateFeatureIndex(featureDir, {
      featureName,
      displayName,
      description,
      dependsOn,
      hasTemplates,
      hasCodemods,
      hasScripts,
    })

    if (hasTemplates) {
      await this.generateTemplatesStructure(featureDir, featureName, templateFiles)
    }

    if (hasCodemods) {
      await this.generateCodemodsStructure(featureDir, featureName)
    }

    await this.updateFeaturesIndex(featureName)

    console.log(`✅ Feature '${featureName}' scaffolded successfully!`)
    console.log(`📁 Location: ${featureDir}`)
    console.log(`🔧 Next steps:`)
    console.log(`   1. Update the feature configuration in ${featureName}/index.ts`)
    if (hasTemplates) {
      console.log(`   2. Add your templates to ${featureName}/templates/`)
    }
    if (hasCodemods) {
      console.log(`   3. Implement your codemods in ${featureName}/codemods/`)
    }
    console.log(`   4. Test your feature by running the main script`)
  }

  private validateFeatureName(featureName: string): void {
    if (!featureName || featureName.trim() === '') {
      throw new Error('Feature name cannot be empty')
    }

    if (!/^[a-z][a-z0-9-]*[a-z0-9]$/.test(featureName) && featureName.length > 1) {
      throw new Error('Feature name must be kebab-case (lowercase, hyphens allowed, start and end with letter/number)')
    }

    const featureDir = path.join(this.featuresDir, featureName)
    if (fs.existsSync(featureDir)) {
      throw new Error(`Feature '${featureName}' already exists`)
    }
  }

  private async createDirectory(dirPath: string): Promise<void> {
    if (!fs.existsSync(dirPath)) {
      await fsp.mkdir(dirPath, { recursive: true })
      console.log(`📁 Created directory: ${dirPath}`)
    }
  }

  private toTitleCase(str: string): string {
    return str
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  private async generateFeatureIndex(
    featureDir: string,
    options: {
      featureName: string
      displayName: string
      description: string
      dependsOn: string[]
      hasTemplates: boolean
      hasCodemods: boolean
      hasScripts: boolean
    },
  ): Promise<void> {
    const template = `{{#if hasCodemods}}{{#each codemods}}import { {{name}} } from './codemods/{{fileName}}'
{{/each}}{{/if}}import type { Feature } from '../../types'

export const {{camelCaseName}}: Feature = {
  id: '{{featureName}}',
  description: '{{description}}',
  name: '{{displayName}}',{{#if dependsOn.length}}
  dependsOn: [{{#each dependsOn}}'{{this}}'{{#unless @last}}, {{/unless}}{{/each}}],{{/if}}
  stages: [
    {
      name: 'setup-{{featureName}}',{{#if hasScripts}}
      scripts: [
        // Add your setup scripts here
        // Example: { src: 'npm install example-package', dir: 'web' },
      ],{{/if}}{{#if hasTemplates}}
      templates: [
        {
          source: 'src/features/{{featureName}}/templates',
          destination: 'your-destination-folder',
        },
      ],{{/if}}{{#if hasCodemods}}
      mods: {
        // Add your file modifications here
        // Example: 'package.json': [exampleCodemod],
      },{{/if}}
    },
  ],
}
`

    const handlebarsTemplate = handlebars.compile(template)
    const rendered = handlebarsTemplate({
      ...options,
      camelCaseName: this.toCamelCase(options.featureName),
      codemods: options.hasCodemods
        ? [
            {
              name: `example${this.toPascalCase(options.featureName)}Codemod`,
              fileName: `example-${options.featureName}-codemod`,
            },
          ]
        : [],
    })

    const indexPath = path.join(featureDir, 'index.ts')
    await fsp.writeFile(indexPath, rendered, 'utf8')
    console.log(`📄 Created: ${indexPath}`)
  }

  private async generateTemplatesStructure(
    featureDir: string,
    featureName: string,
    templateFiles: string[] = [],
  ): Promise<void> {
    const templatesDir = path.join(featureDir, 'templates')
    await this.createDirectory(templatesDir)

    if (templateFiles.length > 0) {
      for (const templateFile of templateFiles) {
        const templatePath = path.join(templatesDir, templateFile)

        const templateFileDir = path.dirname(templatePath)
        if (templateFileDir !== templatesDir) {
          await this.createDirectory(templateFileDir)
        }

        await fsp.writeFile(templatePath, '', 'utf8')
        console.log(`📄 Created template: ${templatePath}`)
      }
    } else {
      const exampleTemplate = `<!-- Example template for {{featureName}} -->
<div class="{{featureName}}-component">
  <h1>{{title}}</h1>
  <p>{{description}}</p>
</div>
`

      const examplePath = path.join(templatesDir, 'example.html.hbs')
      await fsp.writeFile(examplePath, exampleTemplate, 'utf8')
      console.log(`📄 Created example template: ${examplePath}`)
    }
  }

  private async generateCodemodsStructure(featureDir: string, featureName: string): Promise<void> {
    const codemodsDir = path.join(featureDir, 'codemods')
    await this.createDirectory(codemodsDir)

    const exampleCodemod = `import * as fs from 'fs'
import * as fsp from 'fs/promises'
import * as path from 'path'
import { SourceFile } from 'ts-morph'

export async function example${this.toPascalCase(featureName)}Codemod(sourceFile: SourceFile): Promise<void> {
  const filePath = sourceFile.getFilePath()

  if (path.basename(filePath) === 'package.json') {
    const dir = path.dirname(filePath)
    if (!fs.existsSync(dir)) {
      await fsp.mkdir(dir, { recursive: true })
    }

    let pkg: any = {}
    if (fs.existsSync(filePath)) {
      try {
        const src = await fsp.readFile(filePath, 'utf8')
        pkg = src.trim() ? JSON.parse(src) : {}
      } catch (err) {
        throw new Error(\`Failed to read or parse \${filePath}: \${String(err)}\`)
      }
    }

    pkg.scripts = pkg.scripts || {}
    pkg.scripts['${featureName}'] = 'echo "Running ${featureName} command"'

    await fsp.writeFile(filePath, JSON.stringify(pkg, null, 2) + '\\n', 'utf8')
    console.log(\`Added ${featureName} script to \${filePath}\`)
  }
}
`

    const codemodPath = path.join(codemodsDir, `example-${featureName}-codemod.ts`)
    await fsp.writeFile(codemodPath, exampleCodemod, 'utf8')
    console.log(`📄 Created example codemod: ${codemodPath}`)
  }

  private async updateFeaturesIndex(featureName: string): Promise<void> {
    const indexPath = path.join(this.featuresDir, 'index.ts')

    if (!fs.existsSync(indexPath)) {
      throw new Error(`Features index file not found: ${indexPath}`)
    }

    const project = new Project()
    const sourceFile = project.addSourceFileAtPath(indexPath)

    const camelCaseName = this.toCamelCase(featureName)

    sourceFile.addImportDeclaration({
      namedImports: [camelCaseName],
      moduleSpecifier: `./${featureName}`,
    })

    const variableStatement = sourceFile.getVariableStatementOrThrow('FEATURES')
    const declarations = variableStatement.getDeclarations()
    if (declarations.length === 0) {
      throw new Error('FEATURES variable declaration not found')
    }

    const declaration = declarations[0]
    if (!declaration) {
      throw new Error('FEATURES declaration is undefined')
    }

    const initializer = declaration.getInitializer()

    if (!initializer || !initializer.getKind) {
      throw new Error('FEATURES initializer not found')
    }

    const objectLiteral = initializer.getText()
    const newProperty = `  '${featureName}': ${camelCaseName},`

    const insertIndex = objectLiteral.lastIndexOf('}')
    const newObjectLiteral = objectLiteral.slice(0, insertIndex) + newProperty + '\n' + objectLiteral.slice(insertIndex)

    declaration.setInitializer(newObjectLiteral)

    await project.save()
    console.log(`📄 Updated features index: ${indexPath}`)
  }

  private toCamelCase(str: string): string {
    return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())
  }

  private toPascalCase(str: string): string {
    return this.toCamelCase(str.charAt(0).toUpperCase() + str.slice(1))
  }
}

async function main() {
  const args = process.argv.slice(2)

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
🚀 Feature Scaffolder

Usage: pnpm scaffold:feature <feature-name> [options]

Arguments:
  feature-name    The name of the feature (kebab-case)

Options:
  --display-name  Display name for the feature (default: auto-generated)
  --description   Description of the feature
  --depends-on    Comma-separated list of features this depends on
  --templates     Include templates structure with default example
  --template-files Comma-separated list of template files to create (enables --templates)
  --codemods      Include codemods structure
  --scripts       Include scripts in the feature configuration
  --help, -h      Show this help message

Examples:
  pnpm scaffold:feature my-new-feature
  pnpm scaffold:feature my-feature --templates --codemods
  pnpm scaffold:feature auth-system --display-name "Authentication System" --depends-on "vite,tailwind"
  pnpm scaffold:feature database --template-files "schema.prisma.hbs,config.json.hbs,src/index.ts.hbs"
`)
    return
  }

  const featureName = args[0]
  if (!featureName) {
    console.error('❌ Error: Feature name is required')
    process.exit(1)
  }

  const options: ScaffoldFeatureOptions = { featureName }

  for (let i = 1; i < args.length; i++) {
    const arg = args[i]
    switch (arg) {
      case '--display-name':
        const displayName = args[++i]
        if (displayName) {
          options.displayName = displayName
        }
        break
      case '--description':
        const description = args[++i]
        if (description) {
          options.description = description
        }
        break
      case '--depends-on':
        const dependsOn = args[++i]
        if (dependsOn) {
          options.dependsOn = dependsOn.split(',').map(dep => dep.trim())
        }
        break
      case '--templates':
        options.hasTemplates = true
        break
      case '--template-files':
        const templateFiles = args[++i]
        if (templateFiles) {
          options.hasTemplates = true
          options.templateFiles = templateFiles.split(',').map(file => file.trim())
        }
        break
      case '--codemods':
        options.hasCodemods = true
        break
      case '--scripts':
        options.hasScripts = true
        break
    }
  }

  try {
    const scaffolder = new FeatureScaffolder()
    await scaffolder.scaffold(options)
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}

main().catch(error => {
  console.error('❌ Unexpected error:', error)
  process.exit(1)
})

export { FeatureScaffolder }
