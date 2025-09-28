import { modPackageJsonApolloServer } from './codemods/mod-package-json-api'
import { addApiToPnpmWorkspace } from './codemods/add-api-to-pnpm-workspace'
import type { Feature } from '../../types'
import { ActivationConditions } from '../../forms/feature-selector'

export const apolloServer: Feature = {
  id: 'apollo-server',
  description: 'A GraphQL Server for React',
  name: 'Apollo Server',
  dependsOn: ['projectDir'],
  activatedBy: ActivationConditions.includesValue('projectWorkspaces', 'graphql-server'),
  stages: [
    {
      name: 'create-api',
      scripts: [{ src: 'pnpm init && pnpm pkg set type="module"', dir: 'api' }],
    },
    {
      name: 'setup-api-structure',
      scripts: [{ src: 'pnpm pkg set type="module"', dir: 'api' }],
      dependencies: [{ name: ['typescript', '@types/node', 'tsx'], workspace: 'api', type: 'devDependencies' }],
      mods: {
        'api/package.json': [modPackageJsonApolloServer],
        'pnpm-workspace.yaml': [addApiToPnpmWorkspace],
      },
      templates: [
        {
          source: 'src/features/apollo-server/templates',
          destination: 'api',
        },
      ],
    },
    {
      name: 'install-dependencies',
      dependencies: [{ name: ['@apollo/server', 'graphql'], workspace: 'api', type: 'dependencies' }],
    },
    {
      name: 'create-modules',
      dependencies: [
        {
          name: [
            '@graphql-codegen/cli',
            '@graphql-codegen/graphql-modules-preset',
            '@graphql-codegen/typescript-resolvers',
            '@graphql-codegen/typescript',
          ],
          workspace: 'api',
          type: 'devDependencies',
        },
        {
          name: [
            '@graphql-tools/load-files',
            '@graphql-tools/merge',
            '@graphql-tools/utils',
            'graphql-scalars',
            'graphql-modules',
          ],
          workspace: 'api',
          type: 'dependencies',
        },
      ],
      scripts: [
        {
          src: 'pnpm codegen',
          dir: 'api',
        },
      ],
    },
  ],
}
