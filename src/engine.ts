import * as path from 'path'
import * as fs from 'fs'
import * as fsp from 'fs/promises'
import { Project } from 'ts-morph'
import handlebars from 'handlebars'
import { execSync } from 'child_process'
import { glob } from 'glob'

import { CodeMod, InstallScript, InstallTemplate } from './types'
import { FEATURES } from './features/index'
import { getLogger } from './logger'
import { evaluateRule } from './forms/feature-selector'

// Register Handlebars helpers
handlebars.registerHelper('eq', function (a: any, b: any) {
  return a === b
})

handlebars.registerHelper('ne', function (a: any, b: any) {
  return a !== b
})

handlebars.registerHelper('if_eq', function (this: any, a: any, b: any, options: any) {
  if (a === b) {
    return options.fn(this)
  }
  return options.inverse(this)
})

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

export async function scaffoldProject(
  projectName: string,
  projectDir: string,
  featureIds: string[],
  featureConfigurations: Record<string, Record<string, any>> = {},
  allAnswers: Record<string, any> = {},
) {
  const logger = getLogger()
  logger.projectStart('engine', projectName)

  const sortedIds = sortFeatures(featureIds)
  const features = sortedIds.map(id => FEATURES[id])

  async function runScripts(
    scripts: InstallScript[] | undefined,
    args: any,
    featureName: string,
    featureConfig: Record<string, any> = {},
  ) {
    if (!scripts) return

    for (const scriptFn of scripts) {
      let src: string
      if (typeof scriptFn.src === 'string') {
        src = scriptFn.src
        for (const [key, value] of Object.entries(featureConfig)) {
          src = src.replace(new RegExp(`{{${key}}}`, 'g'), String(value))
        }
      } else {
        src = scriptFn.src(args, featureConfig)
      }

      let cd = `cd ${projectDir}`
      let targetDir = projectDir
      if (scriptFn.dir) {
        targetDir = path.join(projectDir, scriptFn.dir)

        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true })
          logger.directoryCreated(featureName, targetDir)
        }
        cd = `cd ${targetDir}`
      }

      logger.scriptStart(featureName, src)
      try {
        const result = execSync([cd, src].join(' && '), {
          stdio: ['inherit', 'pipe', 'pipe'],
          encoding: 'utf8',
        })

        if (result) {
          logger.infoFileOnly(featureName, 'Script output: %s', result)
        }

        logger.scriptComplete(featureName, src)
      } catch (err: any) {
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

  async function copyTemplates(
    templates: InstallTemplate[] | undefined,
    args: any,
    featureName: string,
    featureConfig: Record<string, any> = {},
  ) {
    if (!templates) return

    for (const template of templates) {
      await processTemplate(template, args, featureName, featureConfig)
    }
  }

  async function processTemplate(
    template: InstallTemplate,
    args: any,
    featureName: string,
    featureConfig: Record<string, any> = {},
  ) {
    const { source, destination, context = {} } = template

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

    const sourceStats = fs.existsSync(sourcePath) ? fs.statSync(sourcePath) : null

    if (!sourceStats) {
      const matches = await glob(sourcePath, { nodir: true })
      if (matches.length === 0) {
        logger.warn(featureName, 'No templates found matching pattern: %s', source)
        return
      }

      for (const match of matches) {
        await processTemplateFile(match, template, args, featureName, sourcePath, featureConfig)
      }
    } else if (sourceStats.isDirectory()) {
      const pattern = path.join(sourcePath, '**', '*.hbs')
      const matches = await glob(pattern, { nodir: true })

      for (const match of matches) {
        await processTemplateFile(match, template, args, featureName, sourcePath, featureConfig)
      }
    } else {
      await processTemplateFile(sourcePath, template, args, featureName, undefined, featureConfig)
    }
  }

  async function processTemplateFile(
    filePath: string,
    template: InstallTemplate,
    args: any,
    featureName: string,
    basePath?: string,
    featureConfig: Record<string, any> = {},
  ) {
    const { destination, context = {} } = template

    let destPath: string
    if (basePath && fs.statSync(basePath).isDirectory()) {
      let relativePath = path.relative(basePath, filePath)

      if (relativePath.endsWith('.hbs')) {
        relativePath = relativePath.slice(0, -4)
      }
      destPath = path.join(projectDir, destination, relativePath)
    } else {
      let fileName = path.basename(filePath)
      if (fileName.endsWith('.hbs')) {
        fileName = fileName.slice(0, -4)
      }
      destPath = path.join(projectDir, destination)

      if (!path.extname(destination)) {
        destPath = path.join(destPath, fileName)
      }
    }

    const templateSrc = await fsp.readFile(filePath, 'utf8')
    const handlebarsTemplate = handlebars.compile(templateSrc)
    const mergedContext = Object.assign({}, context, args, featureConfig)
    const rendered = handlebarsTemplate(mergedContext)

    const destDir = path.dirname(destPath)
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true })
      logger.directoryCreated(featureName, destDir)
    }

    await fsp.writeFile(destPath, rendered, 'utf8')
    logger.templateWritten(featureName, filePath, destPath)
  }

  async function runMods(
    mods: Record<string, CodeMod[]> | undefined,
    featureName: string,
    featureConfig: Record<string, any> = {},
  ) {
    if (!mods) return

    for (const [relativePath, modFns] of Object.entries(mods)) {
      const filePath = path.join(projectDir, relativePath)
      if (!fs.existsSync(filePath)) continue

      for (const mod of modFns) {
        await mod(filePath, featureConfig)
        logger.codeModApplied(featureName, filePath)
      }
    }
  }

  async function processStage(
    stageName: string,
    featureName: string,
    featureConfig: Record<string, any>,
    scripts?: any[],
    templates?: any,
    mods?: any,
  ) {
    const args = { projectName, projectDir }

    logger.stageProcessing(featureName, stageName)
    await runScripts(scripts, args, featureName, featureConfig)
    await copyTemplates(templates, args, featureName, featureConfig)
    await runMods(mods, featureName, featureConfig)
  }

  for (const feature of features) {
    if (!feature) {
      logger.warn('engine', 'Feature not found')
      continue
    }

    const featureConfig = featureConfigurations[feature.id] || {}
    logger.featureProcessing(feature.name, feature.name)

    if (feature.stages && feature.stages.length > 0) {
      for (const stage of feature.stages) {
        if (stage.activatedBy) {
          const shouldActivate = evaluateRule(stage.activatedBy, allAnswers)
          if (!shouldActivate) {
            logger.infoFileOnly(feature.name, 'Skipping stage "%s" - activation condition not met', stage.name)
            logger.infoFileOnly(feature.name, 'Stage activation debug - allAnswers: %o', allAnswers)
            logger.infoFileOnly(feature.name, 'Stage activation debug - condition: %o', stage.activatedBy)
            continue
          }
        }

        await processStage(stage.name, feature.name, featureConfig, stage.scripts, stage.templates, stage.mods)
      }
    } else {
      logger.warn(feature.name, 'No stages defined for feature: %s', feature.name)
    }
  }

  logger.projectComplete('engine')
}
