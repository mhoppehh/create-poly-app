import * as fs from 'fs'
import * as fsp from 'fs/promises'
import * as path from 'path'

// Dependency mappings for different GraphQL clients
const CLIENT_DEPENDENCIES = {
  'apollo-client': {
    dependencies: ['@apollo/client', 'graphql'],
    devDependencies: ['@types/react'],
    scripts: {
      codegen: 'graphql-codegen',
      'codegen:watch': 'graphql-codegen --watch',
    },
  },
  urql: {
    dependencies: ['urql', 'graphql'],
    devDependencies: ['@types/react'],
    scripts: {},
  },
  relay: {
    dependencies: ['react-relay', 'relay-runtime'],
    devDependencies: ['relay-compiler', '@types/react-relay', '@types/relay-runtime'],
    scripts: {
      relay: 'relay-compiler',
      'relay:watch': 'relay-compiler --watch',
    },
  },
  'graphql-request': {
    dependencies: ['graphql-request', 'graphql', '@tanstack/react-query'],
    devDependencies: ['@types/react'],
    scripts: {},
  },
} as const

export async function addGraphQLClientDependencies(
  filePath: string,
  config?: { clientType: keyof typeof CLIENT_DEPENDENCIES },
): Promise<void> {
  if (!config?.clientType) {
    throw new Error('Client type must be specified in config')
  }

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

    // Initialize dependencies objects
    pkg.dependencies = pkg.dependencies || {}
    pkg.devDependencies = pkg.devDependencies || {}
    pkg.scripts = pkg.scripts || {}

    const clientDeps = CLIENT_DEPENDENCIES[config.clientType]

    // Add regular dependencies (using 'latest' for now, could be made configurable)
    clientDeps.dependencies.forEach(dep => {
      if (!pkg.dependencies[dep]) {
        pkg.dependencies[dep] = 'latest'
      }
    })

    // Add dev dependencies
    clientDeps.devDependencies.forEach(dep => {
      if (!pkg.devDependencies[dep]) {
        pkg.devDependencies[dep] = 'latest'
      }
    })

    // Add client-specific scripts
    Object.entries(clientDeps.scripts).forEach(([key, value]) => {
      pkg.scripts[key] = value
    })

    await fsp.writeFile(filePath, JSON.stringify(pkg, null, 2) + '\n', 'utf8')
    console.log(`Added ${config.clientType} dependencies to ${filePath}`)
  }
}

// Export individual client codemods for easier usage
export async function addApolloClientDependencies(filePath: string): Promise<void> {
  return addGraphQLClientDependencies(filePath, { clientType: 'apollo-client' })
}

export async function addUrqlDependencies(filePath: string): Promise<void> {
  return addGraphQLClientDependencies(filePath, { clientType: 'urql' })
}

export async function addRelayDependencies(filePath: string): Promise<void> {
  return addGraphQLClientDependencies(filePath, { clientType: 'relay' })
}

export async function addGraphQLRequestDependencies(filePath: string): Promise<void> {
  return addGraphQLClientDependencies(filePath, { clientType: 'graphql-request' })
}

// Mobile-specific codemods
export async function addApolloClientDependenciesMobile(filePath: string): Promise<void> {
  return addGraphQLClientDependencies(filePath, { clientType: 'apollo-client' })
}

export async function addUrqlDependenciesMobile(filePath: string): Promise<void> {
  return addGraphQLClientDependencies(filePath, { clientType: 'urql' })
}

export async function addRelayDependenciesMobile(filePath: string): Promise<void> {
  return addGraphQLClientDependencies(filePath, { clientType: 'relay' })
}

export async function addGraphQLRequestDependenciesMobile(filePath: string): Promise<void> {
  return addGraphQLClientDependencies(filePath, { clientType: 'graphql-request' })
}
