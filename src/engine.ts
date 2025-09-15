import * as path from 'path'
import * as fs from 'fs'
import * as fsp from 'fs/promises'
import { Project } from 'ts-morph'
import handlebars from 'handlebars'
import { execSync } from 'child_process'
import { glob } from 'glob'

import { CodeMod, InstallScript, InstallTemplate } from './types'
import { FEATURES } from './features'
import { getLogger } from './logger'

// In your engine.ts
function sortFeatures(featureIds: string[]): string[] {
  const sorted: string[] = []
  const visited = new Set<string>()
  const visiting = new Set<string>()

  function visit(id: string) {
    if (visiting.has(id)) {
      throw new Error(`Circular dependency detected involving ${id}`)
    }
    if (visited.has(id)) {
      return
    }

    visiting.add(id)

    const feature = FEATURES[id]
    if (!feature) {
      throw new Error(`Feature not found: ${id}`)
    }
    if (feature.dependsOn) {
      feature.dependsOn.forEach(depId => visit(depId))
    }

    visiting.delete(id)
    visited.add(id)
    sorted.push(id)
  }

  featureIds.forEach(id => visit(id))
  return sorted
}

export async function scaffoldProject(projectName: string, projectDir: string, featureIds: string[]) {
  const logger = getLogger()
  logger.projectStart('engine', projectName)

  // 1. SORT FEATURES
  const sortedIds = sortFeatures(featureIds)
  const features = sortedIds.map(id => FEATURES[id])

  async function runScripts(scripts: InstallScript[] | undefined, args: any, featureName: string) {
    if (!scripts) return

    for (const scriptFn of scripts) {
      let src: string
      if (typeof scriptFn.src === 'string') {
        src = scriptFn.src
      } else {
        src = scriptFn.src(args)
      }

      let cd = `cd ${projectDir}`
      let targetDir = projectDir
      if (scriptFn.dir) {
        targetDir = path.join(projectDir, scriptFn.dir)
        // Create the target directory if it doesn't exist
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true })
          logger.directoryCreated(featureName, targetDir)
        }
        cd = `cd ${targetDir}`
      }

      logger.scriptStart(featureName, src)
      try {
        // Execute the script with suppressed output, only log to file
        const result = execSync([cd, src].join(' && '), {
          stdio: ['inherit', 'pipe', 'pipe'],
          encoding: 'utf8',
        })

        // Log the command output to file only
        if (result) {
          logger.infoFileOnly(featureName, 'Script output: %s', result)
        }

        logger.scriptComplete(featureName, src)
      } catch (err: any) {
        // Log error output to file
        if (err.stdout) {
          logger.infoFileOnly(featureName, 'Script stdout: %s', err.stdout)
        }
        if (err.stderr) {
          logger.infoFileOnly(featureName, 'Script stderr: %s', err.stderr)
        }

        logger.scriptFailed(featureName, src, err)
        throw err
      }
    }
  }

  async function copyTemplates(templates: InstallTemplate[] | undefined, args: any, featureName: string) {
    if (!templates) return

    for (const template of templates) {
      await processTemplate(template, args, featureName)
    }
  }

  async function processTemplate(template: InstallTemplate, args: any, featureName: string) {
    const { source, destination, context = {} } = template

    // Resolve template source path
    let sourcePath = source
    if (!path.isAbsolute(sourcePath)) {
      const candidate = path.join(__dirname, sourcePath)
      if (fs.existsSync(candidate)) {
        sourcePath = candidate
      } else {
        const cwdCandidate = path.join(process.cwd(), sourcePath)
        if (fs.existsSync(cwdCandidate)) {
          sourcePath = cwdCandidate
        }
      }
    }

    // Handle different source types
    const sourceStats = fs.existsSync(sourcePath) ? fs.statSync(sourcePath) : null

    if (!sourceStats) {
      // Try as glob pattern
      const matches = await glob(sourcePath, { nodir: true })
      if (matches.length === 0) {
        logger.warn(featureName, 'No templates found matching pattern: %s', source)
        return
      }

      for (const match of matches) {
        await processTemplateFile(match, template, args, featureName, sourcePath)
      }
    } else if (sourceStats.isDirectory()) {
      // Process entire directory
      const pattern = path.join(sourcePath, '**', '*.hbs')
      const matches = await glob(pattern, { nodir: true })

      for (const match of matches) {
        await processTemplateFile(match, template, args, featureName, sourcePath)
      }
    } else {
      // Single file
      await processTemplateFile(sourcePath, template, args, featureName)
    }
  }

  async function processTemplateFile(
    filePath: string,
    template: InstallTemplate,
    args: any,
    featureName: string,
    basePath?: string,
  ) {
    const { destination, context = {} } = template

    // Calculate destination path
    let destPath: string
    if (basePath && fs.statSync(basePath).isDirectory()) {
      // Preserve directory structure relative to base
      let relativePath = path.relative(basePath, filePath)
      // Remove .hbs extension
      if (relativePath.endsWith('.hbs')) {
        relativePath = relativePath.slice(0, -4)
      }
      destPath = path.join(projectDir, destination, relativePath)
    } else {
      // Direct destination for single files
      let fileName = path.basename(filePath)
      if (fileName.endsWith('.hbs')) {
        fileName = fileName.slice(0, -4)
      }
      destPath = path.join(projectDir, destination)

      // If destination doesn't include a file extension, treat it as directory
      if (!path.extname(destination)) {
        destPath = path.join(destPath, fileName)
      }
    }

    // Render template with Handlebars
    const templateSrc = await fsp.readFile(filePath, 'utf8')
    const handlebarsTemplate = handlebars.compile(templateSrc)
    const mergedContext = Object.assign({}, context, args)
    const rendered = handlebarsTemplate(mergedContext)

    // Ensure destination directory exists
    const destDir = path.dirname(destPath)
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true })
      logger.directoryCreated(featureName, destDir)
    }

    // Write rendered template
    await fsp.writeFile(destPath, rendered, 'utf8')
    logger.templateWritten(featureName, filePath, destPath)
  }

  // Helper to run code mods
  async function runMods(mods: Record<string, CodeMod[]> | undefined, featureName: string) {
    if (!mods) return
    const project = new Project()

    for (const [relativePath, modFns] of Object.entries(mods)) {
      const filePath = path.join(projectDir, relativePath)
      if (!fs.existsSync(filePath)) continue
      const sourceFile = project.addSourceFileAtPath(filePath)
      for (const mod of modFns) {
        mod(sourceFile)
        logger.codeModApplied(featureName, filePath)
      }
    }
    await project.save()
  }

  // Helper to process a single stage
  async function processStage(stageName: string, featureName: string, scripts?: any[], templates?: any, mods?: any) {
    const args = { projectName, projectDir }

    logger.stageProcessing(featureName, stageName)
    await runScripts(scripts, args, featureName)
    await copyTemplates(templates, args, featureName)
    await runMods(mods, featureName)
  }

  // Run install steps for each feature in sorted order
  for (const feature of features) {
    if (!feature) {
      logger.warn('engine', 'Feature not found')
      continue
    }

    logger.featureProcessing(feature.name, feature.name)

    // Process all stages
    if (feature.stages && feature.stages.length > 0) {
      for (const stage of feature.stages) {
        await processStage(stage.name, feature.name, stage.scripts, stage.templates, stage.mods)
      }
    } else {
      logger.warn(feature.name, 'No stages defined for feature: %s', feature.name)
    }
  }

  logger.projectComplete('engine')
}
