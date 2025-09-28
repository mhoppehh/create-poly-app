import * as path from 'path'
import * as fs from 'fs/promises'
import * as crypto from 'crypto'
import { glob } from 'glob'

export interface SnapshotOptions {
  ignoreFiles?: string[]
  ignoreDirs?: string[]
  normalizeContent?: boolean
  sortFiles?: boolean
}

export interface FileSnapshot {
  path: string
  content: string
  hash: string
}

export interface ProjectSnapshot {
  name: string
  structure: string[]
  files: FileSnapshot[]
  metadata: {
    createdAt: string
    totalFiles: number
    totalSize: number
  }
}

export class SnapshotManager {
  private snapshotDir: string

  constructor(snapshotDir: string) {
    this.snapshotDir = snapshotDir
  }

  async createSnapshot(
    projectPath: string,
    snapshotName: string,
    options: SnapshotOptions = {},
  ): Promise<ProjectSnapshot> {
    const {
      ignoreFiles = ['node_modules', '.git', 'dist', 'build', '*.log'],
      ignoreDirs = ['node_modules', '.git', 'dist', 'build'],
      normalizeContent = true,
      sortFiles = true,
    } = options

    // Get all files in the project
    const allFiles = await glob('**/*', {
      cwd: projectPath,
      ignore: [...ignoreFiles, ...ignoreDirs.map(dir => `${dir}/**`)],
      nodir: true,
      dot: true,
    })

    const sortedFiles = sortFiles ? allFiles.sort() : allFiles
    const fileSnapshots: FileSnapshot[] = []
    let totalSize = 0

    // Read file contents and create snapshots
    for (const relativeFilePath of sortedFiles) {
      const fullPath = path.join(projectPath, relativeFilePath)

      try {
        let content = await fs.readFile(fullPath, 'utf-8')

        if (normalizeContent) {
          content = this.normalizeContent(content, relativeFilePath)
        }

        const hash = crypto.createHash('md5').update(content).digest('hex')

        fileSnapshots.push({
          path: relativeFilePath,
          content,
          hash,
        })

        totalSize += Buffer.byteLength(content, 'utf-8')
      } catch (error) {
        console.warn(`Failed to read file ${fullPath}:`, error)
      }
    }

    // Get directory structure
    const allPaths = await glob('**/*', {
      cwd: projectPath,
      ignore: [...ignoreFiles, ...ignoreDirs.map(dir => `${dir}/**`)],
      dot: true,
    })

    const structure = sortFiles ? allPaths.sort() : allPaths

    const snapshot: ProjectSnapshot = {
      name: snapshotName,
      structure,
      files: fileSnapshots,
      metadata: {
        createdAt: new Date().toISOString(),
        totalFiles: fileSnapshots.length,
        totalSize,
      },
    }

    // Save snapshot to disk
    await this.saveSnapshot(snapshot)

    return snapshot
  }

  async saveSnapshot(snapshot: ProjectSnapshot): Promise<void> {
    await fs.mkdir(this.snapshotDir, { recursive: true })

    const snapshotPath = path.join(this.snapshotDir, `${snapshot.name}.json`)
    await fs.writeFile(snapshotPath, JSON.stringify(snapshot, null, 2), 'utf-8')
  }

  async loadSnapshot(snapshotName: string): Promise<ProjectSnapshot | null> {
    const snapshotPath = path.join(this.snapshotDir, `${snapshotName}.json`)

    try {
      const content = await fs.readFile(snapshotPath, 'utf-8')
      return JSON.parse(content) as ProjectSnapshot
    } catch (error) {
      return null
    }
  }

  async compareSnapshots(snapshot1: ProjectSnapshot, snapshot2: ProjectSnapshot): Promise<SnapshotComparison> {
    const differences: SnapshotDifference[] = []

    // Compare structure
    const structure1Set = new Set(snapshot1.structure)
    const structure2Set = new Set(snapshot2.structure)

    // Files/dirs in snapshot1 but not in snapshot2
    for (const item of structure1Set) {
      if (!structure2Set.has(item)) {
        differences.push({
          type: 'removed',
          path: item,
          description: `Path removed: ${item}`,
        })
      }
    }

    // Files/dirs in snapshot2 but not in snapshot1
    for (const item of structure2Set) {
      if (!structure1Set.has(item)) {
        differences.push({
          type: 'added',
          path: item,
          description: `Path added: ${item}`,
        })
      }
    }

    // Compare file contents
    const files1Map = new Map(snapshot1.files.map(f => [f.path, f]))
    const files2Map = new Map(snapshot2.files.map(f => [f.path, f]))

    for (const [filePath, file1] of files1Map) {
      const file2 = files2Map.get(filePath)

      if (!file2) {
        differences.push({
          type: 'removed',
          path: filePath,
          description: `File removed: ${filePath}`,
        })
        continue
      }

      if (file1.hash !== file2.hash) {
        differences.push({
          type: 'modified',
          path: filePath,
          description: `File modified: ${filePath}`,
          details: {
            oldHash: file1.hash,
            newHash: file2.hash,
            contentDiff: this.generateContentDiff(file1.content, file2.content),
          },
        })
      }
    }

    return {
      identical: differences.length === 0,
      differences,
      summary: {
        totalDifferences: differences.length,
        added: differences.filter(d => d.type === 'added').length,
        removed: differences.filter(d => d.type === 'removed').length,
        modified: differences.filter(d => d.type === 'modified').length,
      },
    }
  }

  private normalizeContent(content: string, filePath: string): string {
    let normalized = content

    // Normalize line endings
    normalized = normalized.replace(/\r\n/g, '\n')

    // Remove trailing whitespace from lines
    normalized = normalized.replace(/[ \t]+$/gm, '')

    // Normalize timestamps in common files
    if (filePath.includes('package.json')) {
      // Don't normalize package.json as dependencies versions matter
    } else if (filePath.includes('.log')) {
      // Normalize log timestamps
      normalized = normalized.replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/g, 'TIMESTAMP')
    }

    return normalized
  }

  private generateContentDiff(content1: string, content2: string): string {
    // Simple line-based diff for basic comparison
    const lines1 = content1.split('\n')
    const lines2 = content2.split('\n')

    const maxLines = Math.max(lines1.length, lines2.length)
    const diffLines: string[] = []

    for (let i = 0; i < maxLines; i++) {
      const line1 = lines1[i] || ''
      const line2 = lines2[i] || ''

      if (line1 !== line2) {
        if (line1) diffLines.push(`- ${line1}`)
        if (line2) diffLines.push(`+ ${line2}`)
      }
    }

    return diffLines.slice(0, 20).join('\n') + (diffLines.length > 20 ? '\n... (truncated)' : '')
  }
}

export interface SnapshotDifference {
  type: 'added' | 'removed' | 'modified'
  path: string
  description: string
  details?: {
    oldHash?: string
    newHash?: string
    contentDiff?: string
  }
}

export interface SnapshotComparison {
  identical: boolean
  differences: SnapshotDifference[]
  summary: {
    totalDifferences: number
    added: number
    removed: number
    modified: number
  }
}
