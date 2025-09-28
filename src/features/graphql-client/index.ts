import {
  addApolloClientDependencies,
  addUrqlDependencies,
  addRelayDependencies,
  addGraphQLRequestDependencies,
} from './codemods/example-graphql-client-codemod'
import type { Feature } from '../../types'
import { ActivationConditions, ActivationRules } from '../../forms/feature-selector'

export const graphqlClient: Feature = {
  id: 'graphql-client',
  description: 'GraphQL client setup with support for Relay, URQL, Apollo Client, and GraphQL Request',
  name: 'GraphQL Client',
  dependsOn: ['vite'],
  activatedBy: ActivationRules.and(
    ActivationConditions.includesValue('projectWorkspaces', 'react-webapp'),
    ActivationConditions.includesValue('projectWorkspaces', 'graphql-server'),
    ActivationConditions.custom('graphqlClient', value => value && value !== 'none'),
  ),
  configuration: [
    {
      id: 'graphqlEndpoint',
      type: 'text',
      title: 'GraphQL API Endpoint',
      description: 'The URL of your GraphQL API endpoint',
      defaultValue: 'http://localhost:4000/graphql',
      placeholder: 'http://localhost:4000/graphql',
      required: true,
      validation: [
        {
          type: 'required',
          message: 'GraphQL endpoint is required',
        },
        {
          type: 'pattern',
          value: /^https?:\/\/.+/,
          message: 'Please enter a valid HTTP/HTTPS URL',
        },
      ],
    },
    {
      id: 'schemaPath',
      type: 'text',
      title: 'Schema Path (for Relay)',
      description: 'Path to your GraphQL schema file (only needed for Relay)',
      defaultValue: './schema.graphql',
      placeholder: './schema.graphql',
      required: false,
      showIf: [
        {
          dependsOn: 'graphqlClient',
          condition: { type: 'equals', value: 'relay' },
        },
      ],
    },
  ],
  stages: [
    {
      name: 'setup-apollo-client',
      activatedBy: ActivationConditions.equals('graphqlClient', 'apollo-client'),
      dependencies: [
        { name: ['@apollo/client', 'graphql'], workspace: 'web', type: 'dependencies' },
        {
          name: [
            '@graphql-codegen/cli',
            '@graphql-codegen/typescript',
            '@graphql-codegen/typescript-operations',
            '@graphql-codegen/typescript-react-apollo',
          ],
          workspace: 'web',
          type: 'devDependencies',
        },
      ],
      templates: [
        {
          source: 'src/features/graphql-client/templates/apollo-client',
          destination: 'web',
          context: {
            clientType: 'apollo-client',
            graphqlEndpoint: '{{graphqlEndpoint}}',
          },
        },
      ],
      mods: {
        'web/package.json': [addApolloClientDependencies],
      },
    },
    {
      name: 'setup-urql',
      activatedBy: ActivationConditions.equals('graphqlClient', 'urql'),
      dependencies: [
        { name: ['urql', 'graphql'], workspace: 'web', type: 'dependencies' },
        {
          name: [
            '@graphql-codegen/cli',
            '@graphql-codegen/typescript',
            '@graphql-codegen/typescript-operations',
            '@graphql-codegen/typescript-urql',
          ],
          workspace: 'web',
          type: 'devDependencies',
        },
      ],
      templates: [
        {
          source: 'src/features/graphql-client/templates/urql',
          destination: 'web',
          context: {
            clientType: 'urql',
            graphqlEndpoint: '{{graphqlEndpoint}}',
          },
        },
      ],
      mods: {
        'web/package.json': [addUrqlDependencies],
      },
    },
    {
      name: 'setup-relay',
      activatedBy: ActivationConditions.equals('graphqlClient', 'relay'),
      dependencies: [
        { name: ['react-relay', 'relay-runtime'], workspace: 'web', type: 'dependencies' },
        {
          name: ['relay-compiler', '@types/react-relay', '@types/relay-runtime'],
          workspace: 'web',
          type: 'devDependencies',
        },
      ],
      templates: [
        {
          source: 'src/features/graphql-client/templates/relay',
          destination: 'web',
          context: {
            clientType: 'relay',
            graphqlEndpoint: '{{graphqlEndpoint}}',
            schemaPath: '{{schemaPath}}',
          },
        },
      ],
      mods: {
        'web/package.json': [addRelayDependencies],
      },
    },
    {
      name: 'setup-graphql-request',
      activatedBy: ActivationConditions.equals('graphqlClient', 'graphql-request'),
      dependencies: [
        { name: ['graphql-request', 'graphql', '@tanstack/react-query'], workspace: 'web', type: 'dependencies' },
        {
          name: ['@graphql-codegen/cli', '@graphql-codegen/typescript', '@graphql-codegen/typescript-operations'],
          workspace: 'web',
          type: 'devDependencies',
        },
      ],
      templates: [
        {
          source: 'src/features/graphql-client/templates/graphql-request',
          destination: 'web',
          context: {
            clientType: 'graphql-request',
            graphqlEndpoint: '{{graphqlEndpoint}}',
          },
        },
      ],
      mods: {
        'web/package.json': [addGraphQLRequestDependencies],
      },
    },
  ],
}
