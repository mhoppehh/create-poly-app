import { Form } from './types'

export const createPolyAppForm: Form = {
  id: 'create-poly-app',
  title: '🚀 Create Poly App',
  description: "Let's set up your new polyglot project with the features you need.",
  settings: {
    allowBack: true,
    showProgress: true,
    submitLabel: 'Create Project',
    cancelLabel: 'Cancel',
  },
  groups: [
    {
      id: 'project-basics',
      title: 'Project Setup',
      description: 'Tell us about your project',
      questions: [
        {
          id: 'projectName',
          type: 'text',
          title: 'What is the name of your project?',
          description: 'This will be used as the directory name and package name',
          required: true,
          defaultValue: 'my-awesome-project',
          validation: [
            { type: 'required', message: 'Project name is required' },
            { type: 'minLength', value: 1, message: 'Project name cannot be empty' },
            {
              type: 'pattern',
              value: /^[a-zA-Z0-9-_]+$/,
              message: 'Project name can only contain letters, numbers, hyphens, and underscores',
            },
          ],
          placeholder: 'my-awesome-project',
        },
        {
          id: 'projectDescription',
          type: 'text',
          title: 'Project description (optional)',
          description: 'A brief description of what your project does',
          required: false,
          placeholder: 'An awesome polyglot application',
        },
        {
          id: 'projectWorkspaces',
          type: 'multiselect',
          title: 'Which workspaces would you like to include?',
          description: 'Select the workspaces you want in your project',
          required: true,
          options: [
            {
              label: 'GraphQL API Server (Apollo Server)',
              value: 'graphql-server',
              description: 'A TypeScript-based Apollo Server for your API',
            },
            {
              label: 'React Webapp (Vite)',
              value: 'react-webapp',
              description: 'A React + TypeScript frontend application using Vite',
            },
            {
              label: 'Mobile App (React Native)',
              value: 'mobile-app',
              description: 'A React Native mobile application',
            },
          ],
          defaultValue: ['react-webapp', 'graphql-server'],
        },
      ],
    },
    {
      id: 'mobile-setup',
      title: 'Mobile Configuration',
      description: 'Configure your React Native mobile application',
      showIf: [
        {
          dependsOn: 'projectWorkspaces',
          condition: { type: 'includes', value: 'mobile-app' },
        },
      ],
      questions: [
        {
          id: 'mobileFramework',
          type: 'select',
          title: 'Mobile Framework',
          description: 'Choose your React Native development approach',
          defaultValue: 'expo',
          required: true,
          options: [
            {
              label: 'Expo (Managed Workflow)',
              value: 'expo',
              description: 'Quick setup with managed development workflow',
            },
            {
              label: 'React Native CLI (Bare)',
              value: 'react-native-cli',
              description: 'Traditional React Native CLI setup with full control',
            },
          ],
        },
        {
          id: 'mobileAppName',
          type: 'text',
          title: 'Mobile App Name',
          description: 'The display name for your mobile application',
          defaultValue: 'MyApp',
          placeholder: 'MyApp',
          required: true,
          validation: [
            {
              type: 'required',
              message: 'App name is required',
            },
            {
              type: 'pattern',
              value: /^[A-Za-z][A-Za-z0-9\s]*$/,
              message: 'App name must start with a letter and contain only letters, numbers, and spaces',
            },
          ],
        },
        {
          id: 'bundleId',
          type: 'text',
          title: 'Bundle Identifier',
          description: 'Unique identifier for your app (e.g., com.yourcompany.appname)',
          defaultValue: 'com.example.myapp',
          placeholder: 'com.example.myapp',
          required: true,
          validation: [
            {
              type: 'required',
              message: 'Bundle identifier is required',
            },
            {
              type: 'pattern',
              value: /^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*)+$/,
              message: 'Bundle ID must follow reverse domain notation (e.g., com.example.app)',
            },
          ],
        },
        {
          id: 'enableNativeModules',
          type: 'boolean',
          title: 'Enable Native Modules',
          description: 'Include setup for common native modules (camera, location, push notifications, etc.)',
          defaultValue: false,
        },
        {
          id: 'mobileNavigation',
          type: 'select',
          title: 'Navigation Library',
          description: 'Choose navigation solution for your mobile app',
          defaultValue: 'react-navigation',
          required: true,
          options: [
            {
              label: 'React Navigation 6',
              value: 'react-navigation',
              description: 'Most popular React Native navigation library',
            },
            {
              label: 'React Native Navigation (Wix)',
              value: 'react-native-navigation',
              description: 'Native navigation performance',
            },
            {
              label: 'None',
              value: 'none',
              description: 'Set up navigation manually later',
            },
          ],
        },
      ],
    },
    {
      id: 'frontend-setup',
      title: 'Frontend Configuration',
      description: 'Choose your frontend setup',
      showIf: [
        {
          dependsOn: 'projectWorkspaces',
          condition: {
            type: 'custom',
            evaluator: (value: any, allAnswers: Record<string, any>) => {
              const workspaces = allAnswers.projectWorkspaces || []
              const hasGraphQLServer = workspaces.includes('graphql-server')
              const hasReactWebapp = workspaces.includes('react-webapp')
              const hasMobileApp = workspaces.includes('mobile-app')
              return hasGraphQLServer && (hasReactWebapp || hasMobileApp)
            },
          },
        },
      ],
      questions: [
        {
          id: 'graphqlClient',
          type: 'select',
          title: 'Which GraphQL client would you like to use?',
          description: 'Choose the GraphQL client library for your applications',
          required: false,
          options: [
            {
              label: 'Apollo Client',
              value: 'apollo-client',
              description: 'The most popular React GraphQL client with comprehensive features',
            },
            {
              label: 'URQL',
              value: 'urql',
              description: 'A lightweight, flexible GraphQL client with great caching',
            },
            {
              label: 'Relay',
              value: 'relay',
              description: "Facebook's powerful GraphQL client with advanced features",
            },
            {
              label: 'GraphQL Request',
              value: 'graphql-request',
              description: 'Simple GraphQL client with React Query integration',
            },
            {
              label: 'None',
              value: 'none',
              description: 'Skip GraphQL client setup',
            },
          ],
          defaultValue: 'apollo-client',
        },
      ],
    },
    {
      id: 'api-features',
      title: 'API Features',
      description: 'Configure your GraphQL API features',
      showIf: [
        {
          dependsOn: 'projectWorkspaces',
          condition: { type: 'includes', value: 'graphql-server' },
        },
      ],
      questions: [
        {
          id: 'apiFeatures',
          type: 'multiselect',
          title: 'Which API features would you like to include?',
          description: 'Select the features you want in your GraphQL API',
          required: false,
          options: [
            {
              label: 'Prisma Integration',
              value: 'database',
              description: 'Prisma ORM and type-safe database operations',
            },
          ],
          defaultValue: ['database'],
        },
      ],
    },
    {
      id: 'developer-experience',
      title: 'Developer Experience',
      description: 'Enhance your development workflow with professional tooling',
      questions: [
        {
          id: 'enableDevX',
          type: 'toggle',
          title: 'Enable Developer Experience Suite?',
          description: 'Add comprehensive linting, formatting, Git automation, and productivity tools',
          required: false,
          defaultValue: true,
        },
      ],
    },
  ],
}

export const feedbackForm: Form = {
  id: 'feedback',
  title: 'User Feedback Survey',
  description: 'Help us improve our tools by providing feedback',
  groups: [
    {
      id: 'basic-info',
      title: 'Basic Information',
      questions: [
        {
          id: 'userType',
          type: 'select',
          title: 'What best describes you?',
          required: true,
          options: [
            { label: 'Frontend Developer', value: 'frontend' },
            { label: 'Backend Developer', value: 'backend' },
            { label: 'Full-stack Developer', value: 'fullstack' },
            { label: 'DevOps Engineer', value: 'devops' },
            { label: 'Student', value: 'student' },
            { label: 'Other', value: 'other' },
          ],
        },
        {
          id: 'experience',
          type: 'select',
          title: 'How many years of development experience do you have?',
          required: true,
          options: [
            { label: 'Less than 1 year', value: '0-1' },
            { label: '1-3 years', value: '1-3' },
            { label: '3-5 years', value: '3-5' },
            { label: '5-10 years', value: '5-10' },
            { label: 'More than 10 years', value: '10+' },
          ],
        },
      ],
    },
    {
      id: 'tool-feedback',
      title: 'Tool Feedback',
      questions: [
        {
          id: 'overallRating',
          type: 'number',
          title: 'How would you rate this tool overall? (1-10)',
          required: true,
          validation: [
            { type: 'min', value: 1, message: 'Rating must be at least 1' },
            { type: 'max', value: 10, message: 'Rating cannot exceed 10' },
          ],
        },
        {
          id: 'recommendToOthers',
          type: 'toggle',
          title: 'Would you recommend this tool to others?',
          required: true,
          defaultValue: true,
        },
        {
          id: 'improvementSuggestions',
          type: 'text',
          title: 'What could we improve?',
          description: 'Any suggestions or feedback for improvement',
          required: false,
          showIf: [
            {
              dependsOn: 'overallRating',
              condition: { type: 'lessThan', value: 8 },
            },
          ],
        },
      ],
    },
  ],
}
