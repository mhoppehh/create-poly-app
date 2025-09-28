import { modPackageJsonPrisma } from './codemods/prisma-package-json-mod'
import type { Feature } from '../../types'
import { ActivationConditions, ActivationRules } from '../../forms/feature-selector'

export const prisma: Feature = {
  id: 'prisma',
  description: 'Database ORM with schema management and type-safe client generation',
  name: 'Prisma ORM',
  dependsOn: ['apollo-server'],
  activatedBy: ActivationRules.and(
    ActivationConditions.includesValue('projectWorkspaces', 'graphql-server'),
    ActivationConditions.includesValue('apiFeatures', 'database'),
  ),
  configuration: [
    {
      id: 'databaseProvider',
      type: 'select',
      title: 'Which database provider would you like to use?',
      description: 'Choose the database that best fits your project needs',
      required: true,
      defaultValue: 'sqlite',
      options: [
        {
          label: 'SQLite (Local development)',
          value: 'sqlite',
          description: 'File-based database, perfect for local development and prototyping',
        },
        {
          label: 'PostgreSQL',
          value: 'postgresql',
          description: 'Production-ready relational database with advanced features',
        },
        {
          label: 'MySQL',
          value: 'mysql',
          description: 'Popular open-source relational database',
        },
        {
          label: 'MongoDB',
          value: 'mongodb',
          description: 'NoSQL document database for flexible data structures',
        },
      ],
    },
    {
      id: 'enableStudio',
      type: 'boolean',
      title: 'Enable Prisma Studio?',
      description: 'Include Prisma Studio for visual database management',
      required: false,
      defaultValue: true,
    },
  ],
  stages: [
    {
      name: 'install-prisma-dependencies',
      dependencies: [
        { name: 'prisma', workspace: 'api', type: 'devDependencies' },
        { name: '@prisma/client', workspace: 'api', type: 'dependencies' },
      ],
    },
    {
      name: 'setup-prisma-files',
      scripts: [
        { src: 'npx prisma init --datasource-provider {{databaseProvider}} --output ../generated/prisma', dir: 'api' },
      ],
      templates: [
        {
          source: 'src/features/prisma/templates',
          destination: 'api',
        },
      ],
    },
    {
      name: 'configure-prisma-scripts',
      mods: {
        'api/package.json': [modPackageJsonPrisma],
      },
    },
    {
      name: 'generate-prisma-client',
      scripts: [{ src: 'pnpm prisma:generate', dir: 'api' }],
    },
  ],
}
