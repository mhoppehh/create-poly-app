import * as path from 'path'
import { vi } from 'vitest'

export interface MockFileSystemEntry {
  type: 'file' | 'directory'
  content?: string
  children?: Record<string, MockFileSystemEntry>
  stats?: {
    mtime: Date
    size: number
  }
}

export class MockFileSystem {
  private filesystem: Record<string, MockFileSystemEntry> = {}

  constructor() {
    this.reset()
  }

  reset(): void {
    this.filesystem = {}
  }

  writeFile(filePath: string, content: string): void {
    const normalizedPath = this.normalizePath(filePath)
    const dirname = path.dirname(normalizedPath)

    // Ensure parent directories exist
    this.ensureDirectory(dirname)

    this.filesystem[normalizedPath] = {
      type: 'file',
      content,
      stats: {
        mtime: new Date(),
        size: Buffer.byteLength(content, 'utf-8'),
      },
    }
  }

  readFile(filePath: string): string {
    const normalizedPath = this.normalizePath(filePath)
    const entry = this.filesystem[normalizedPath]

    if (!entry) {
      throw new Error(`ENOENT: no such file or directory, open '${filePath}'`)
    }

    if (entry.type !== 'file') {
      throw new Error(`EISDIR: illegal operation on a directory, read '${filePath}'`)
    }

    return entry.content || ''
  }

  mkdir(dirPath: string): void {
    const normalizedPath = this.normalizePath(dirPath)
    this.ensureDirectory(normalizedPath)
  }

  exists(filePath: string): boolean {
    const normalizedPath = this.normalizePath(filePath)
    return normalizedPath in this.filesystem
  }

  isDirectory(filePath: string): boolean {
    const normalizedPath = this.normalizePath(filePath)
    const entry = this.filesystem[normalizedPath]
    return entry?.type === 'directory'
  }

  isFile(filePath: string): boolean {
    const normalizedPath = this.normalizePath(filePath)
    const entry = this.filesystem[normalizedPath]
    return entry?.type === 'file'
  }

  readdir(dirPath: string): string[] {
    const normalizedPath = this.normalizePath(dirPath)
    const entry = this.filesystem[normalizedPath]

    if (!entry) {
      throw new Error(`ENOENT: no such file or directory, scandir '${dirPath}'`)
    }

    if (entry.type !== 'directory') {
      throw new Error(`ENOTDIR: not a directory, scandir '${dirPath}'`)
    }

    const files: string[] = []
    const prefix = normalizedPath + '/'

    for (const filepath in this.filesystem) {
      if (filepath.startsWith(prefix)) {
        const relativePath = filepath.slice(prefix.length)
        const parts = relativePath.split('/')
        if (parts.length === 1 && parts[0]) {
          files.push(parts[0])
        }
      }
    }

    return files.sort()
  }

  stat(filePath: string): { mtime: Date; size: number; isDirectory: () => boolean; isFile: () => boolean } {
    const normalizedPath = this.normalizePath(filePath)
    const entry = this.filesystem[normalizedPath]

    if (!entry) {
      throw new Error(`ENOENT: no such file or directory, stat '${filePath}'`)
    }

    return {
      mtime: entry.stats?.mtime || new Date(),
      size: entry.stats?.size || 0,
      isDirectory: () => entry.type === 'directory',
      isFile: () => entry.type === 'file',
    }
  }

  remove(filePath: string): void {
    const normalizedPath = this.normalizePath(filePath)

    // Remove the entry itself
    delete this.filesystem[normalizedPath]

    // Remove all child entries for directories
    const prefix = normalizedPath + '/'
    for (const filepath in this.filesystem) {
      if (filepath.startsWith(prefix)) {
        delete this.filesystem[filepath]
      }
    }
  }

  getFileTree(): Record<string, MockFileSystemEntry> {
    return { ...this.filesystem }
  }

  private normalizePath(filePath: string): string {
    return path.posix.normalize(filePath.replace(/\\/g, '/'))
  }

  private ensureDirectory(dirPath: string): void {
    const normalizedPath = this.normalizePath(dirPath)

    if (normalizedPath === '.' || normalizedPath === '/') {
      return
    }

    // Ensure parent directory exists
    const parentDir = path.dirname(normalizedPath)
    if (parentDir !== normalizedPath) {
      this.ensureDirectory(parentDir)
    }

    // Create this directory if it doesn't exist
    if (!this.filesystem[normalizedPath]) {
      this.filesystem[normalizedPath] = {
        type: 'directory',
        children: {},
      }
    }
  }
}

export class MockNpmRegistry {
  private packages: Record<string, any> = {}
  private registryUrl = 'https://registry.npmjs.org'

  constructor() {
    this.setupDefaultPackages()
  }

  addPackage(name: string, versions: Record<string, any>): void {
    this.packages[name] = {
      name,
      versions,
      'dist-tags': {
        latest: Object.keys(versions).sort().pop(),
      },
    }
  }

  getPackage(name: string): any {
    const pkg = this.packages[name]
    if (!pkg) {
      throw new Error(`Package not found: ${name}`)
    }
    return pkg
  }

  mockFetch(): void {
    const originalFetch = global.fetch

    global.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      let url: string
      if (typeof input === 'string') {
        url = input
      } else if (input instanceof URL) {
        url = input.toString()
      } else if (typeof Request !== 'undefined' && input instanceof Request) {
        url = input.url
      } else {
        url = String(input)
      }

      if (url.startsWith(this.registryUrl)) {
        const packageName = url.replace(`${this.registryUrl}/`, '').split('/')[0]

        try {
          const pkg = this.getPackage(packageName)
          return {
            ok: true,
            json: async () => pkg,
            status: 200,
          } as Response
        } catch {
          return {
            ok: false,
            status: 404,
            statusText: 'Not Found',
          } as Response
        }
      }

      // Fall back to original fetch for other URLs
      return originalFetch(input, init)
    })
  }

  restore(): void {
    vi.restoreAllMocks()
  }

  private setupDefaultPackages(): void {
    // Add common packages that create-poly-app might use
    this.addPackage('react', {
      '18.3.1': {
        name: 'react',
        version: '18.3.1',
        dependencies: {},
        dist: { tarball: 'https://registry.npmjs.org/react/-/react-18.3.1.tgz' },
      },
    })

    this.addPackage('@types/react', {
      '18.3.3': {
        name: '@types/react',
        version: '18.3.3',
        dependencies: {},
        dist: { tarball: 'https://registry.npmjs.org/@types/react/-/react-18.3.3.tgz' },
      },
    })

    this.addPackage('vite', {
      '5.4.6': {
        name: 'vite',
        version: '5.4.6',
        dependencies: {},
        dist: { tarball: 'https://registry.npmjs.org/vite/-/vite-5.4.6.tgz' },
      },
    })

    this.addPackage('typescript', {
      '5.5.4': {
        name: 'typescript',
        version: '5.5.4',
        dependencies: {},
        dist: { tarball: 'https://registry.npmjs.org/typescript/-/typescript-5.5.4.tgz' },
      },
    })

    this.addPackage('tailwindcss', {
      '4.1.12': {
        name: 'tailwindcss',
        version: '4.1.12',
        dependencies: {},
        dist: { tarball: 'https://registry.npmjs.org/tailwindcss/-/tailwindcss-4.1.12.tgz' },
      },
    })

    this.addPackage('graphql', {
      '16.9.0': {
        name: 'graphql',
        version: '16.9.0',
        dependencies: {},
        dist: { tarball: 'https://registry.npmjs.org/graphql/-/graphql-16.9.0.tgz' },
      },
    })
  }
}

export function createMockExecSync(): any {
  return vi.fn((command: string, options: any = {}) => {
    // Mock successful execution of common commands
    if (command.includes('pnpm install')) {
      return 'Dependencies installed successfully'
    }

    if (command.includes('npm install')) {
      return 'Dependencies installed successfully'
    }

    if (command.includes('pnpm build')) {
      return 'Build completed successfully'
    }

    if (command.includes('tsc --noEmit')) {
      return 'No type errors found'
    }

    if (command.includes('git init')) {
      return 'Initialized empty Git repository'
    }

    // Default success response
    return `Command executed: ${command}`
  })
}
