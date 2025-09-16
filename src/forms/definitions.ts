import { Form } from './types'

// Main project setup form for create-poly-app
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
      ],
    },
    {
      id: 'frontend-setup',
      title: 'Frontend Configuration',
      description: 'Choose your frontend setup',
      questions: [
        {
          id: 'includeFrontend',
          type: 'toggle',
          title: 'Do you want to include a frontend application?',
          description: 'This will create a React + TypeScript frontend with Vite',
          required: true,
          defaultValue: true,
        },
        {
          id: 'includeTailwind',
          type: 'toggle',
          title: 'Do you want to include TailwindCSS?',
          description: 'A utility-first CSS framework for rapid UI development',
          required: true,
          defaultValue: true,
          showIf: [
            {
              dependsOn: 'includeFrontend',
              condition: { type: 'equals', value: true },
            },
          ],
        },
      ],
    },
    {
      id: 'backend-setup',
      title: 'Backend Configuration',
      description: 'Choose your backend setup',
      questions: [
        {
          id: 'includeGraphQLServer',
          type: 'toggle',
          title: 'Do you want to include a GraphQL API server?',
          description: 'This will create an Apollo Server with TypeScript',
          required: true,
          defaultValue: true,
        },
      ],
    },
    {
      id: 'api-features',
      title: 'API Features',
      description: 'Configure your GraphQL API features',
      showIf: [
        {
          dependsOn: 'includeGraphQLServer',
          condition: { type: 'equals', value: true },
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
              label: 'Books Module',
              value: 'books',
              description: 'Sample books GraphQL module with queries and mutations',
            },
            {
              label: 'Authentication',
              value: 'auth',
              description: 'User authentication and authorization (coming soon)',
            },
            {
              label: 'Database Integration',
              value: 'database',
              description: 'Prisma ORM integration (coming soon)',
            },
            {
              label: 'File Upload',
              value: 'upload',
              description: 'File upload capabilities (coming soon)',
            },
            {
              label: 'Real-time Subscriptions',
              value: 'subscriptions',
              description: 'GraphQL subscriptions for real-time features (coming soon)',
            },
          ],
          defaultValue: ['books'],
        },
        {
          id: 'includeDocumentation',
          type: 'toggle',
          title: 'Generate API documentation?',
          description: 'This will include GraphQL Playground and schema documentation',
          required: false,
          defaultValue: true,
        },
      ],
    },
    {
      id: 'development-setup',
      title: 'Development Environment',
      description: 'Configure your development environment',
      questions: [
        {
          id: 'packageManager',
          type: 'select',
          title: 'Which package manager do you prefer?',
          description: 'This will be used for installing dependencies',
          required: true,
          defaultValue: 'pnpm',
          options: [
            {
              label: 'pnpm (recommended)',
              value: 'pnpm',
              description: 'Fast, disk space efficient package manager',
            },
            {
              label: 'npm',
              value: 'npm',
              description: 'Default Node.js package manager',
            },
            {
              label: 'yarn',
              value: 'yarn',
              description: 'Fast, reliable, and secure dependency management',
            },
          ],
        },
        {
          id: 'includeESLint',
          type: 'toggle',
          title: 'Include ESLint configuration?',
          description: 'Linting helps maintain code quality and consistency',
          required: false,
          defaultValue: true,
        },
        {
          id: 'includePrettier',
          type: 'toggle',
          title: 'Include Prettier configuration?',
          description: 'Code formatting for consistent style',
          required: false,
          defaultValue: true,
        },
        {
          id: 'includeGitignore',
          type: 'toggle',
          title: 'Create .gitignore file?',
          description: 'Exclude common files from version control',
          required: false,
          defaultValue: true,
        },
      ],
    },
  ],
}

// Example of a simple survey form to demonstrate versatility
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
