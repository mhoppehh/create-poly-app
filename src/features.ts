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
    stages: [
      {
        name: 'setup-directory',
        scripts: [{ src: args => `mkdir -p ${args.projectName}`, dir: '../' }],
      },
      {
        name: 'create-workspace',
        templates: [
          {
            source: 'templates/pnpm-workspace.template.yaml',
            destination: 'pnpm-workspace.yaml',
          },
        ],
      },
    ],
  },
  vite: {
    id: 'vite',
    description: 'A modern frontend build tool',
    name: 'Vite',
    dependsOn: ['projectDir'],
    stages: [
      {
        name: 'create-vite-app',
        scripts: [{ src: 'npm create vite@latest web -- --template react-ts' }],
      },
    ],
  },
  tailwind: {
    id: 'tailwind',
    description: 'A utility-first CSS framework',
    name: 'TailwindCSS',
    dependsOn: ['vite'],
    devDependencies: {
      tailwindcss: '^3.4.0',
      postcss: '^8.4.30',
      autoprefixer: '^10.4.10',
    },
    stages: [
      {
        name: 'install-tailwind',
        scripts: [{ src: 'pnpm install tailwindcss @tailwindcss/vite', dir: 'web' }],
      },
      {
        name: 'configure-tailwind',
        mods: {
          'web/vite.config.ts': [addViteConfig],
          'web/src/index.css': [addTailwindImport],
        },
      },
    ],
  },
  'apollo-server': {
    id: 'apollo-server',
    description: 'A GraphQL Server for React',
    name: 'Apollo Server',
    dependsOn: ['projectDir'],
    stages: [
      {
        name: 'setup-api-structure',
        scripts: [
          { src: 'pnpm init && pnpm pkg set type="module"', dir: 'api' },
          { src: 'pnpm install -D typescript @types/node', dir: 'api' },
        ],
        templates: [
          {
            source: 'templates/apollo-server',
            destination: 'api',
          },
        ],
      },
      {
        name: 'install-dependencies',
        scripts: [{ src: 'pnpm install @apollo/server graphql', dir: 'api' }],
      },
      {
        name: 'configure-workspace',
        mods: {
          'api/package.json': [modPackageJsonApolloServer],
          'pnpm-workspace.yaml': [addApiToPnpmWorkspace],
        },
      },
      {
        name: 'create-modules',
        scripts: [
          {
            src: 'pnpm install --filter=api @graphql-tools/load-files @graphql-tools/merge @graphql-tools/utils graphql-scalars',
            dir: 'api',
          },
        ],
        // templates: [
        //   {
        //     source: 'templates/apollo-server',
        //     destination: 'api',
        //   },
        // ],
      },
    ],
  },
}
