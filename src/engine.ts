import * as path from 'path'
import * as fs from 'fs'
import * as fsp from 'fs/promises'
import { Project } from 'ts-morph'
import { merge } from 'lodash'
import handlebars from 'handlebars'
import { execSync } from 'child_process'

import { CodeMod, InstallScript } from './types'
import { FEATURES } from './features'
import { createFile, createFolder } from './utils'

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
  console.log(`Scaffolding ${projectName}...`)

  // 1. SORT FEATURES
  const sortedIds = sortFeatures(featureIds)
  const features = sortedIds.map(id => FEATURES[id])

  async function runScripts(scripts: InstallScript[] | undefined, args: any) {
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
          console.log(`Created directory for script: ${targetDir}`)
        }
        cd = `cd ${targetDir}`
      }

      console.log(`Running script: ${src}`)
      try {
        // Execute the script and stream output to the parent process
        execSync([cd, src].join(' && '), { stdio: 'inherit' })
      } catch (err) {
        console.error(`Script failed: ${src}`)
        throw err
      }
    }
  }

  async function copyTemplates(templates: Record<string, any> | undefined, args: any) {
    if (!templates) return
    for (const [src, tpl] of Object.entries(templates)) {
      // Resolve template source: absolute, then relative to this file, then relative to cwd
      let templatePath = src
      if (!path.isAbsolute(templatePath)) {
        const candidate = path.join(__dirname, templatePath)
        if (fs.existsSync(candidate)) {
          templatePath = candidate
        } else {
          const cwdCandidate = path.join(process.cwd(), templatePath)
          if (fs.existsSync(cwdCandidate)) {
            templatePath = cwdCandidate
          }
        }
      }

      if (!fs.existsSync(templatePath)) {
        console.warn(`Template not found: ${src} (resolved: ${templatePath}), skipping`)
        continue
      }

      // Render template with Handlebars using supplied context merged with runtime args
      const templateSrc = await fsp.readFile(templatePath, 'utf8')
      const template = handlebars.compile(templateSrc)
      const context = Object.assign({}, tpl.context || {}, args)
      const rendered = template(context)

      const destPath = path.join(projectDir, tpl.destination)
      const destDir = path.dirname(destPath)
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true })
        console.log('Created directory for template:', destDir)
      }

      await fsp.writeFile(destPath, rendered, 'utf8')
      console.log(`Wrote template ${src} -> ${destPath}`)
    }
  }

  // Helper to run code mods
  async function runMods(mods: Record<string, CodeMod[]> | undefined) {
    if (!mods) return
    const project = new Project()
    for (const [relativePath, modFns] of Object.entries(mods)) {
      const filePath = path.join(projectDir, relativePath)
      if (!fs.existsSync(filePath)) continue
      const sourceFile = project.addSourceFileAtPath(filePath)
      for (const mod of modFns) {
        mod(sourceFile)
        console.log(`Applied code mod to ${filePath}`)
      }
    }
    await project.save()
  }

  // Helper to process a single stage
  async function processStage(stageName: string, scripts?: any[], templates?: any, mods?: any) {
    const args = { projectName, projectDir }

    console.log(`  Processing stage: ${stageName}`)
    await runScripts(scripts, args)
    await copyTemplates(templates, args)
    await runMods(mods)
  }

  // Run install steps for each feature in sorted order
  for (const feature of features) {
    if (!feature) {
      console.log('Feature not found')
      continue
    }

    console.log(`Processing feature: ${feature.name}`)

    // Process all stages
    if (feature.stages && feature.stages.length > 0) {
      for (const stage of feature.stages) {
        await processStage(stage.name, stage.scripts, stage.templates, stage.mods)
      }
    } else {
      console.log(`  No stages defined for feature: ${feature.name}`)
    }
  }

  console.log('Scaffold complete.')
}
