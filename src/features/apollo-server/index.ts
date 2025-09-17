import { modPackageJsonApolloServer } from './codemods/mod-package-json-api'
import { addApiToPnpmWorkspace } from './codemods/add-api-to-pnpm-workspace'
import type { Feature } from '../../types'

export const apolloServer: Feature = {
  id: 'apollo-server',
  description: 'A GraphQL Server for React',
  name: 'Apollo Server',
  dependsOn: ['projectDir'],
  stages: [
    {
      name: 'setup-api-structure',
      scripts: [
        { src: 'pnpm init && pnpm pkg set type="module"', dir: 'api' },
        { src: 'pnpm install -D typescript @types/node tsx', dir: 'api' },
      ],
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
      scripts: [{ src: 'pnpm install --filter=api @apollo/server graphql', dir: 'api' }],
    },
    {
      name: 'create-modules',
      scripts: [
        {
          src: 'pnpm install --filter=api @graphql-tools/load-files @graphql-tools/merge @graphql-tools/utils graphql-scalars',
          dir: 'api',
        },
      ],
    },
  ],
}
