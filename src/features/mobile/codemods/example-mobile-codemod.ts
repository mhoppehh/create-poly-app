import * as fs from 'fs'
import * as fsp from 'fs/promises'
import * as path from 'path'
import { parse, stringify } from 'yaml'

/**
 * Add mobile workspace to pnpm-workspace.yaml
 */
export async function addMobileToWorkspace(filePath: string): Promise<void> {
  if (path.basename(filePath) === 'pnpm-workspace.yaml') {
    let content: any = {}

    if (fs.existsSync(filePath)) {
      try {
        const src = await fsp.readFile(filePath, 'utf8')
        content = (parse(src) as any) || {}
      } catch (err) {
        throw new Error(`Failed to read or parse ${filePath}: ${String(err)}`)
      }
    }

    content.packages = content.packages || []

    if (!content.packages.includes('mobile')) {
      content.packages.push('mobile')
    }

    const yamlContent = stringify(content, undefined, {
      lineWidth: 0,
      singleQuote: false,
    })

    await fsp.writeFile(filePath, yamlContent, 'utf8')
    console.log(`Added mobile to workspace packages in ${filePath}`)
  }
}

/**
 * Modify root package.json to add mobile-related scripts
 */
export async function modifyRootPackageJsonForMobile(filePath: string): Promise<void> {
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
        throw new Error(`Failed to read or parse ${filePath}: ${String(err)}`)
      }
    }

    pkg.scripts = pkg.scripts || {}

    // Add mobile development scripts
    if (!pkg.scripts['mobile:dev']) {
      pkg.scripts['mobile:dev'] = 'pnpm --filter mobile dev'
    }
    if (!pkg.scripts['mobile:build']) {
      pkg.scripts['mobile:build'] = 'pnpm --filter mobile build'
    }
    if (!pkg.scripts['mobile:test']) {
      pkg.scripts['mobile:test'] = 'pnpm --filter mobile test'
    }

    await fsp.writeFile(filePath, JSON.stringify(pkg, null, 2) + '\n', 'utf8')
    console.log(`Added mobile scripts to root ${filePath}`)
  }
}

/**
 * Add Expo-specific scripts to root package.json
 */
export async function addExpoScripts(filePath: string): Promise<void> {
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
        throw new Error(`Failed to read or parse ${filePath}: ${String(err)}`)
      }
    }

    pkg.scripts = pkg.scripts || {}

    // Add Expo-specific scripts
    if (!pkg.scripts['mobile:start']) {
      pkg.scripts['mobile:start'] = 'pnpm --filter mobile start'
    }
    if (!pkg.scripts['mobile:ios']) {
      pkg.scripts['mobile:ios'] = 'pnpm --filter mobile ios'
    }
    if (!pkg.scripts['mobile:android']) {
      pkg.scripts['mobile:android'] = 'pnpm --filter mobile android'
    }
    if (!pkg.scripts['mobile:web']) {
      pkg.scripts['mobile:web'] = 'pnpm --filter mobile web'
    }

    await fsp.writeFile(filePath, JSON.stringify(pkg, null, 2) + '\n', 'utf8')
    console.log(`Added Expo scripts to root ${filePath}`)
  }
}

/**
 * Add React Native CLI-specific scripts to root package.json
 */
export async function addReactNativeScripts(filePath: string): Promise<void> {
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
        throw new Error(`Failed to read or parse ${filePath}: ${String(err)}`)
      }
    }

    pkg.scripts = pkg.scripts || {}

    // Add React Native CLI-specific scripts
    if (!pkg.scripts['mobile:start']) {
      pkg.scripts['mobile:start'] = 'pnpm --filter mobile start'
    }
    if (!pkg.scripts['mobile:ios']) {
      pkg.scripts['mobile:ios'] = 'pnpm --filter mobile ios'
    }
    if (!pkg.scripts['mobile:android']) {
      pkg.scripts['mobile:android'] = 'pnpm --filter mobile android'
    }
    if (!pkg.scripts['mobile:clean']) {
      pkg.scripts['mobile:clean'] = 'pnpm --filter mobile clean'
    }

    await fsp.writeFile(filePath, JSON.stringify(pkg, null, 2) + '\n', 'utf8')
    console.log(`Added React Native CLI scripts to root ${filePath}`)
  }
}
