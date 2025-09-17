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
              label: 'Prisma Integration',
              value: 'database',
              description: 'Prisma ORM and type-safe database operations',
            },
          ],
          defaultValue: ['database'],
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
