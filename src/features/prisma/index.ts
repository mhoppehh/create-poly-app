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
  stages: [
    {
      name: 'install-prisma-dependencies',
      scripts: [{ src: 'pnpm install prisma', dir: 'api' }],
    },
    {
      name: 'setup-prisma-files',
      scripts: [{ src: 'npx prisma init --datasource-provider sqlite --output ../generated/prisma', dir: 'api' }],
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
