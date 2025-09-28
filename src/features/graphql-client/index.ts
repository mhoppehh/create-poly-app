import {
  addApolloClientDependencies,
  addUrqlDependencies,
  addRelayDependencies,
  addGraphQLRequestDependencies,
  addApolloClientDependenciesMobile,
  addUrqlDependenciesMobile,
  addRelayDependenciesMobile,
  addGraphQLRequestDependenciesMobile,
} from './codemods/example-graphql-client-codemod'
import type { Feature } from '../../types'
import { ActivationConditions, ActivationRules } from '../../forms/feature-selector'

export const graphqlClient: Feature = {
  id: 'graphql-client',
  description: 'GraphQL client setup with support for Relay, URQL, Apollo Client, and GraphQL Request',
  name: 'GraphQL Client',
  dependsOn: ['vite'],
  activatedBy: ActivationRules.and(
    ActivationRules.or(
      ActivationConditions.includesValue('projectWorkspaces', 'react-webapp'),
      ActivationConditions.includesValue('projectWorkspaces', 'mobile-app'),
    ),
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
      scripts: [
        { src: 'pnpm install -w @apollo/client graphql', dir: 'web' },
        {
          src: 'pnpm install -D -w @graphql-codegen/cli @graphql-codegen/typescript @graphql-codegen/typescript-operations @graphql-codegen/typescript-react-apollo',
          dir: 'web',
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
      scripts: [
        { src: 'pnpm install urql graphql', dir: 'web' },
        {
          src: 'pnpm install -D @graphql-codegen/cli @graphql-codegen/typescript @graphql-codegen/typescript-operations @graphql-codegen/typescript-urql',
          dir: 'web',
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
      scripts: [
        { src: 'pnpm install react-relay relay-runtime', dir: 'web' },
        { src: 'pnpm install -D relay-compiler @types/react-relay @types/relay-runtime', dir: 'web' },
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
      scripts: [
        { src: 'pnpm install graphql-request graphql @tanstack/react-query', dir: 'web' },
        {
          src: 'pnpm install -D @graphql-codegen/cli @graphql-codegen/typescript @graphql-codegen/typescript-operations',
          dir: 'web',
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
    {
      name: 'setup-apollo-client-mobile',
      activatedBy: ActivationRules.and(
        ActivationConditions.equals('graphqlClient', 'apollo-client'),
        ActivationConditions.includesValue('projectWorkspaces', 'mobile-app'),
      ),
      scripts: [
        { src: 'pnpm install -w @apollo/client graphql', dir: 'mobile' },
        {
          src: 'pnpm install -D -w @graphql-codegen/cli @graphql-codegen/typescript @graphql-codegen/typescript-operations @graphql-codegen/typescript-react-apollo',
          dir: 'mobile',
        },
      ],
      templates: [
        {
          source: 'src/features/graphql-client/templates/apollo-client',
          destination: 'mobile/src/graphql',
          context: {
            clientType: 'apollo-client',
            graphqlEndpoint: '{{graphqlEndpoint}}',
          },
        },
      ],
      mods: {
        'mobile/package.json': [addApolloClientDependenciesMobile],
      },
    },
    {
      name: 'setup-urql-mobile',
      activatedBy: ActivationRules.and(
        ActivationConditions.equals('graphqlClient', 'urql'),
        ActivationConditions.includesValue('projectWorkspaces', 'mobile-app'),
      ),
      scripts: [
        { src: 'pnpm install urql graphql', dir: 'mobile' },
        {
          src: 'pnpm install -D @graphql-codegen/cli @graphql-codegen/typescript @graphql-codegen/typescript-operations @graphql-codegen/typescript-urql',
          dir: 'mobile',
        },
      ],
      templates: [
        {
          source: 'src/features/graphql-client/templates/urql',
          destination: 'mobile/src/graphql',
          context: {
            clientType: 'urql',
            graphqlEndpoint: '{{graphqlEndpoint}}',
          },
        },
      ],
      mods: {
        'mobile/package.json': [addUrqlDependenciesMobile],
      },
    },
    {
      name: 'setup-relay-mobile',
      activatedBy: ActivationRules.and(
        ActivationConditions.equals('graphqlClient', 'relay'),
        ActivationConditions.includesValue('projectWorkspaces', 'mobile-app'),
      ),
      scripts: [
        { src: 'pnpm install react-relay relay-runtime', dir: 'mobile' },
        { src: 'pnpm install -D relay-compiler @types/react-relay @types/relay-runtime', dir: 'mobile' },
      ],
      templates: [
        {
          source: 'src/features/graphql-client/templates/relay',
          destination: 'mobile/src/graphql',
          context: {
            clientType: 'relay',
            graphqlEndpoint: '{{graphqlEndpoint}}',
            schemaPath: '{{schemaPath}}',
          },
        },
      ],
      mods: {
        'mobile/package.json': [addRelayDependenciesMobile],
      },
    },
    {
      name: 'setup-graphql-request-mobile',
      activatedBy: ActivationRules.and(
        ActivationConditions.equals('graphqlClient', 'graphql-request'),
        ActivationConditions.includesValue('projectWorkspaces', 'mobile-app'),
      ),
      scripts: [
        { src: 'pnpm install graphql-request graphql @tanstack/react-query', dir: 'mobile' },
        {
          src: 'pnpm install -D @graphql-codegen/cli @graphql-codegen/typescript @graphql-codegen/typescript-operations',
          dir: 'mobile',
        },
      ],
      templates: [
        {
          source: 'src/features/graphql-client/templates/graphql-request',
          destination: 'mobile/src/graphql',
          context: {
            clientType: 'graphql-request',
            graphqlEndpoint: '{{graphqlEndpoint}}',
          },
        },
      ],
      mods: {
        'mobile/package.json': [addGraphQLRequestDependenciesMobile],
      },
    },
  ],
}
