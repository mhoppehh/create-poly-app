import { readFile, writeFile } from 'fs/promises'
import path from 'path'
import type { PackageJsonDeps, WorkspaceDependency } from './types'

interface PackageJson extends PackageJsonDeps {
  name?: string
  version?: string
  type?: string
  scripts?: Record<string, string>
  [key: string]: any
}

export class WorkspaceManager {
  constructor(private rootPath: string) {}

  getPackageJsonPath(workspace: string): string {
    if (workspace === 'root' || workspace === '.') {
      return path.join(this.rootPath, 'package.json')
    }
    return path.join(this.rootPath, workspace, 'package.json')
  }

  async readPackageJson(workspace: string): Promise<PackageJson> {
    const packagePath = this.getPackageJsonPath(workspace)
    try {
      const content = await readFile(packagePath, 'utf-8')
      return JSON.parse(content)
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return {}
      }
      throw error
    }
  }

  async writePackageJson(workspace: string, packageJson: PackageJson): Promise<void> {
    const packagePath = this.getPackageJsonPath(workspace)
    const content = JSON.stringify(packageJson, null, 2) + '\n'
    await writeFile(packagePath, content, 'utf-8')
  }

  async getDependencies(workspace: string): Promise<WorkspaceDependency[]> {
    const packageJson = await this.readPackageJson(workspace)
    const dependencies: WorkspaceDependency[] = []
    const packagePath = this.getPackageJsonPath(workspace)

    if (packageJson.dependencies) {
      for (const [name, version] of Object.entries(packageJson.dependencies)) {
        dependencies.push({
          name,
          version,
          type: 'dependencies',
          workspace,
          packageJsonPath: packagePath,
        })
      }
    }

    if (packageJson.devDependencies) {
      for (const [name, version] of Object.entries(packageJson.devDependencies)) {
        dependencies.push({
          name,
          version,
          type: 'devDependencies',
          workspace,
          packageJsonPath: packagePath,
        })
      }
    }

    return dependencies
  }

  async hasDependency(
    workspace: string,
    dependencyName: string,
    type?: 'dependencies' | 'devDependencies',
  ): Promise<boolean> {
    const packageJson = await this.readPackageJson(workspace)

    if (type) {
      return !!packageJson[type]?.[dependencyName]
    }

    return !!(packageJson.dependencies?.[dependencyName] || packageJson.devDependencies?.[dependencyName])
  }

  async getDependency(workspace: string, dependencyName: string): Promise<WorkspaceDependency | null> {
    const packageJson = await this.readPackageJson(workspace)
    const packagePath = this.getPackageJsonPath(workspace)

    if (packageJson.dependencies?.[dependencyName]) {
      return {
        name: dependencyName,
        version: packageJson.dependencies[dependencyName],
        type: 'dependencies',
        workspace,
        packageJsonPath: packagePath,
      }
    }

    if (packageJson.devDependencies?.[dependencyName]) {
      return {
        name: dependencyName,
        version: packageJson.devDependencies[dependencyName],
        type: 'devDependencies',
        workspace,
        packageJsonPath: packagePath,
      }
    }

    return null
  }

  async addDependency(
    workspace: string,
    dependencyName: string,
    version: string,
    type: 'dependencies' | 'devDependencies' = 'dependencies',
  ): Promise<void> {
    const packageJson = await this.readPackageJson(workspace)

    if (!packageJson[type]) {
      packageJson[type] = {}
    }

    packageJson[type]![dependencyName] = version
    await this.writePackageJson(workspace, packageJson)
  }

  async addDependencies(
    workspace: string,
    dependencies: Array<{
      name: string
      version: string
      type: 'dependencies' | 'devDependencies'
    }>,
  ): Promise<void> {
    const packageJson = await this.readPackageJson(workspace)

    for (const dep of dependencies) {
      if (!packageJson[dep.type]) {
        packageJson[dep.type] = {}
      }
      packageJson[dep.type]![dep.name] = dep.version
    }

    await this.writePackageJson(workspace, packageJson)
  }

  async removeDependency(
    workspace: string,
    dependencyName: string,
    type?: 'dependencies' | 'devDependencies',
  ): Promise<void> {
    const packageJson = await this.readPackageJson(workspace)
    let updated = false

    if (!type || type === 'dependencies') {
      if (packageJson.dependencies?.[dependencyName]) {
        delete packageJson.dependencies[dependencyName]
        updated = true
      }
    }

    if (!type || type === 'devDependencies') {
      if (packageJson.devDependencies?.[dependencyName]) {
        delete packageJson.devDependencies[dependencyName]
        updated = true
      }
    }

    if (updated) {
      await this.writePackageJson(workspace, packageJson)
    }
  }

  async updateDependency(
    workspace: string,
    dependencyName: string,
    newVersion: string,
    type?: 'dependencies' | 'devDependencies',
  ): Promise<void> {
    const packageJson = await this.readPackageJson(workspace)
    let updated = false

    if (!type || type === 'dependencies') {
      if (packageJson.dependencies?.[dependencyName]) {
        packageJson.dependencies[dependencyName] = newVersion
        updated = true
      }
    }

    if (!type || type === 'devDependencies') {
      if (packageJson.devDependencies?.[dependencyName]) {
        packageJson.devDependencies[dependencyName] = newVersion
        updated = true
      }
    }

    if (!updated) {
      throw new Error(`Dependency '${dependencyName}' not found in workspace '${workspace}'`)
    }

    await this.writePackageJson(workspace, packageJson)
  }

  async convertToCatalogReference(workspace: string, dependencyName: string): Promise<void> {
    const packageJson = await this.readPackageJson(workspace)
    let updated = false

    if (packageJson.dependencies?.[dependencyName]) {
      packageJson.dependencies[dependencyName] = 'catalog:'
      updated = true
    }

    if (packageJson.devDependencies?.[dependencyName]) {
      packageJson.devDependencies[dependencyName] = 'catalog:'
      updated = true
    }

    if (updated) {
      await this.writePackageJson(workspace, packageJson)
    }
  }

  async usesCatalogReference(workspace: string, dependencyName: string): Promise<boolean> {
    const packageJson = await this.readPackageJson(workspace)

    const depVersion = packageJson.dependencies?.[dependencyName]
    const devDepVersion = packageJson.devDependencies?.[dependencyName]

    return depVersion === 'catalog:' || devDepVersion === 'catalog:'
  }

  async getWorkspacesWithDependency(
    workspaces: string[],
    dependencyName: string,
  ): Promise<Array<{ workspace: string; version: string; type: 'dependencies' | 'devDependencies' }>> {
    const results: Array<{ workspace: string; version: string; type: 'dependencies' | 'devDependencies' }> = []

    for (const workspace of workspaces) {
      const dependency = await this.getDependency(workspace, dependencyName)
      if (dependency) {
        results.push({
          workspace,
          version: dependency.version,
          type: dependency.type,
        })
      }
    }

    return results
  }

  async sortDependencies(workspace: string): Promise<void> {
    const packageJson = await this.readPackageJson(workspace)
    let updated = false

    if (packageJson.dependencies) {
      const sorted = Object.entries(packageJson.dependencies)
        .sort(([a], [b]) => a.localeCompare(b))
        .reduce(
          (acc, [key, value]) => {
            acc[key] = value
            return acc
          },
          {} as Record<string, string>,
        )

      packageJson.dependencies = sorted
      updated = true
    }

    if (packageJson.devDependencies) {
      const sorted = Object.entries(packageJson.devDependencies)
        .sort(([a], [b]) => a.localeCompare(b))
        .reduce(
          (acc, [key, value]) => {
            acc[key] = value
            return acc
          },
          {} as Record<string, string>,
        )

      packageJson.devDependencies = sorted
      updated = true
    }

    if (updated) {
      await this.writePackageJson(workspace, packageJson)
    }
  }

  async cleanupEmptyDependencies(workspace: string): Promise<void> {
    const packageJson = await this.readPackageJson(workspace)
    let updated = false

    if (packageJson.dependencies && Object.keys(packageJson.dependencies).length === 0) {
      delete packageJson.dependencies
      updated = true
    }

    if (packageJson.devDependencies && Object.keys(packageJson.devDependencies).length === 0) {
      delete packageJson.devDependencies
      updated = true
    }

    if (updated) {
      await this.writePackageJson(workspace, packageJson)
    }
  }
}
