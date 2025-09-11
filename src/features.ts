// src/features.ts
import { add } from 'lodash'
import { modPackageJsonApolloServer } from './codemods/apollo-server/mod-package-json-api'
import { addTailwindImport } from './codemods/tailwind/add-imports'
import { addViteConfig } from './codemods/tailwind/add-vite-config'
import type { Feature } from './types'
import { addApiToPnpmWorkspace } from './codemods/apollo-server/add-api-to-pnpm-workspace'

export const FEATURES: Record<string, Feature> = {
  projectDir: {
    id: 'projectDir',
    description: 'The root directory of the project',
    name: 'Project Directory',
    preInstallScripts: [{ src: args => `mkdir -p ${args.projectName}`, dir: '../' }],
    adInstallTemplate: {
      'templates/pnpm-workspace.template.yaml': {
        destination: 'pnpm-workspace.yaml',
      },
    },
  },
  vite: {
    id: 'vite',
    description: 'A modern frontend build tool',
    name: 'Vite',
    dependsOn: ['projectDir'],
    adInstallScripts: [{ src: 'npm create vite@latest web -- --template react-ts' }],
  },
  tailwind: {
    id: 'tailwind',
    description: 'A utility-first CSS framework',
    name: 'TailwindCSS',
    dependsOn: ['vite'],
    preInstallScripts: [{ src: 'pnpm install tailwindcss @tailwindcss/vite', dir: 'web' }],
    devDependencies: {
      tailwindcss: '^3.4.0',
      postcss: '^8.4.30',
      autoprefixer: '^10.4.10',
    },
    postInstallMods: {
      'web/vite.config.ts': [addViteConfig],
      'web/src/index.css': [addTailwindImport],
    },
  },
  'apollo-server': {
    id: 'apollo-server',
    description: 'A GraphQL Server for React',
    name: 'Apollo Server',
    dependsOn: ['projectDir'],
    preInstallScripts: [
      { src: 'mkdir -p api' },
      { src: 'pnpm init && pnpm pkg set type="module"', dir: 'api' },
      { src: 'mkdir -p src', dir: 'api' },
      { src: 'touch index.ts', dir: 'api/src' },
      { src: 'pnpm install -D typescript @types/node', dir: 'api/src' },
    ],
    preInstallTemplate: {
      'templates/api/tsconfig.json.hbs': {
        destination: 'api/tsconfig.json',
      },
    },
    adInstallScripts: [{ src: 'pnpm install @apollo/server graphql', dir: 'api' }],
    postInstallMods: {
      'api/package.json': [modPackageJsonApolloServer],
      'pnpm-workspace.yaml': [addApiToPnpmWorkspace],
    },
    postInstallScripts: [
      { src: 'mkdir -p modules', dir: 'api/src' },
      { src: 'mkdir -p books', dir: 'api/src/modules' },
    ],
    postInstallTemplate: {
      'templates/api/index.ts.hbs': {
        destination: 'api/src/index.ts',
      },
      'templates/api/modules/index.ts.hbs': {
        destination: 'api/src/modules/index.ts',
      },
      'templates/api/modules/books/books.ts.hbs': {
        destination: 'api/src/modules/books/books.ts',
      },
    },
  },
}
