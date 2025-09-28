import { readFile, writeFile } from 'fs/promises'
import { parse, stringify } from 'yaml'
import path from 'path'
import type { CatalogEntry, PnpmWorkspaceConfig } from './types'

export class CatalogManager {
  private workspaceFilePath: string

  constructor(private rootPath: string) {
    this.workspaceFilePath = path.join(rootPath, 'pnpm-workspace.yaml')
  }

  async readWorkspaceConfig(): Promise<PnpmWorkspaceConfig> {
    try {
      const content = await readFile(this.workspaceFilePath, 'utf-8')
      const config = parse(content) as PnpmWorkspaceConfig
      return {
        packages: config.packages || [],
        catalog: config.catalog || {},
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return {
          packages: ['web', 'api'],
          catalog: {},
        }
      }
      throw error
    }
  }

  async writeWorkspaceConfig(config: PnpmWorkspaceConfig): Promise<void> {
    const content = stringify(config, {
      lineWidth: -1,
    })
    await writeFile(this.workspaceFilePath, content, 'utf-8')
  }

  async getCatalogEntries(): Promise<CatalogEntry[]> {
    const config = await this.readWorkspaceConfig()
    return Object.entries(config.catalog || {}).map(([name, version]) => ({
      name,
      version,
    }))
  }

  async hasCatalogEntry(dependencyName: string): Promise<boolean> {
    const config = await this.readWorkspaceConfig()
    return dependencyName in (config.catalog || {})
  }

  async getCatalogEntry(dependencyName: string): Promise<CatalogEntry | null> {
    const config = await this.readWorkspaceConfig()
    const version = config.catalog?.[dependencyName]
    if (!version) {
      return null
    }
    return { name: dependencyName, version }
  }

  async addCatalogEntry(name: string, version: string): Promise<void> {
    const config = await this.readWorkspaceConfig()

    if (!config.catalog) {
      config.catalog = {}
    }

    config.catalog[name] = version
    await this.writeWorkspaceConfig(config)
  }

  async addCatalogEntries(entries: CatalogEntry[]): Promise<void> {
    const config = await this.readWorkspaceConfig()

    if (!config.catalog) {
      config.catalog = {}
    }

    for (const entry of entries) {
      config.catalog[entry.name] = entry.version
    }

    await this.writeWorkspaceConfig(config)
  }

  async removeCatalogEntry(dependencyName: string): Promise<void> {
    const config = await this.readWorkspaceConfig()

    if (config.catalog && config.catalog[dependencyName]) {
      delete config.catalog[dependencyName]
      await this.writeWorkspaceConfig(config)
    }
  }

  async updateCatalogEntry(name: string, version: string): Promise<void> {
    const config = await this.readWorkspaceConfig()

    if (config.catalog && config.catalog[name]) {
      config.catalog[name] = version
      await this.writeWorkspaceConfig(config)
    } else {
      throw new Error(`Catalog entry '${name}' not found`)
    }
  }

  async getWorkspaces(): Promise<string[]> {
    const config = await this.readWorkspaceConfig()
    return config.packages || []
  }

  async addWorkspace(workspace: string): Promise<void> {
    const config = await this.readWorkspaceConfig()

    if (!config.packages.includes(workspace)) {
      config.packages.push(workspace)
      await this.writeWorkspaceConfig(config)
    }
  }

  async sortCatalog(): Promise<void> {
    const config = await this.readWorkspaceConfig()

    if (config.catalog) {
      const sortedEntries = Object.entries(config.catalog)
        .sort(([a], [b]) => a.localeCompare(b))
        .reduce(
          (acc, [key, value]) => {
            acc[key] = value
            return acc
          },
          {} as Record<string, string>,
        )

      config.catalog = sortedEntries
      await this.writeWorkspaceConfig(config)
    }
  }

  validateCatalogEntries(entries: CatalogEntry[]): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    for (const entry of entries) {
      if (!entry.name || typeof entry.name !== 'string') {
        errors.push(`Invalid package name: ${entry.name}`)
      }

      if (!entry.version || typeof entry.version !== 'string') {
        errors.push(`Invalid version for ${entry.name}: ${entry.version}`)
      }

      const versionRegex = /^[\^~]?\d+\.\d+\.\d+.*$|^latest$|^next$/
      if (entry.version && !versionRegex.test(entry.version)) {
        errors.push(`Invalid version format for ${entry.name}: ${entry.version}`)
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }
}
