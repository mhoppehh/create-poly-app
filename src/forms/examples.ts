import { FormBuilder, QuestionHelpers, ValidationHelpers, ConditionalHelpers, OptionHelpers } from './helpers'

/**
 * Example showing how to use the FormBuilder to create the same createPolyAppForm
 */
export const createPolyAppFormUsingBuilder = new FormBuilder('create-poly-app-builder', '🚀 Create Poly App')
  .description("Let's set up your new polyglot project with the features you need.")
  .settings({
    allowBack: true,
    showProgress: true,
    submitLabel: 'Create Project',
    cancelLabel: 'Cancel',
  })

  // Project basics group
  .group('project-basics', 'Project Setup', 'Tell us about your project')
  .question(
    QuestionHelpers.text('projectName', 'What is the name of your project?', {
      description: 'This will be used as the directory name and package name',
      required: true,
      defaultValue: 'my-awesome-project',
      placeholder: 'my-awesome-project',
      validation: [
        ValidationHelpers.required('Project name is required'),
        ValidationHelpers.minLength(1, 'Project name cannot be empty'),
        ValidationHelpers.pattern(
          /^[a-zA-Z0-9-_]+$/,
          'Project name can only contain letters, numbers, hyphens, and underscores',
        ),
      ],
    }),
  )
  .question(
    QuestionHelpers.text('projectDescription', 'Project description (optional)', {
      description: 'A brief description of what your project does',
      placeholder: 'An awesome polyglot application',
    }),
  )

  // Frontend setup group
  .group('frontend-setup', 'Frontend Configuration', 'Choose your frontend setup')
  .question(
    QuestionHelpers.toggle('includeFrontend', 'Do you want to include a frontend application?', {
      description: 'This will create a React + TypeScript frontend with Vite',
      required: true,
      defaultValue: true,
    }),
  )
  .question(
    QuestionHelpers.toggle('includeTailwind', 'Do you want to include TailwindCSS?', {
      description: 'A utility-first CSS framework for rapid UI development',
      required: true,
      defaultValue: true,
      showIf: [ConditionalHelpers.equals('includeFrontend', true)],
    }),
  )

  // Backend setup group
  .group('backend-setup', 'Backend Configuration', 'Choose your backend setup')
  .question(
    QuestionHelpers.toggle('includeGraphQLServer', 'Do you want to include a GraphQL API server?', {
      description: 'This will create an Apollo Server with TypeScript',
      required: true,
      defaultValue: true,
    }),
  )

  // API features group (conditional)
  .group('api-features', 'API Features', 'Configure your GraphQL API features')
  .groupShowIf([ConditionalHelpers.equals('includeGraphQLServer', true)])
  .question(
    QuestionHelpers.multiselect(
      'apiFeatures',
      'Which API features would you like to include?',
      [
        {
          label: 'Books Module',
          value: 'books',
          description: 'Sample books GraphQL module with queries and mutations',
        },
        { label: 'Authentication', value: 'auth', description: 'User authentication and authorization (coming soon)' },
        { label: 'Database Integration', value: 'database', description: 'Prisma ORM integration (coming soon)' },
        { label: 'File Upload', value: 'upload', description: 'File upload capabilities (coming soon)' },
        {
          label: 'Real-time Subscriptions',
          value: 'subscriptions',
          description: 'GraphQL subscriptions for real-time features (coming soon)',
        },
      ],
      {
        description: 'Select the features you want in your GraphQL API',
        defaultValue: ['books'],
      },
    ),
  )
  .question(
    QuestionHelpers.toggle('includeDocumentation', 'Generate API documentation?', {
      description: 'This will include GraphQL Playground and schema documentation',
      defaultValue: true,
    }),
  )

  // Development setup group
  .group('development-setup', 'Development Environment', 'Configure your development environment')
  .question(
    QuestionHelpers.select('packageManager', 'Which package manager do you prefer?', OptionHelpers.packageManagers(), {
      description: 'This will be used for installing dependencies',
      required: true,
      defaultValue: 'pnpm',
    }),
  )
  .question(
    QuestionHelpers.toggle('includeESLint', 'Include ESLint configuration?', {
      description: 'Linting helps maintain code quality and consistency',
      defaultValue: true,
    }),
  )
  .question(
    QuestionHelpers.toggle('includePrettier', 'Include Prettier configuration?', {
      description: 'Code formatting for consistent style',
      defaultValue: true,
    }),
  )
  .question(
    QuestionHelpers.toggle('includeGitignore', 'Create .gitignore file?', {
      description: 'Exclude common files from version control',
      defaultValue: true,
    }),
  )
  .build()

/**
 * Example of a simple contact form
 */
export const contactForm = new FormBuilder('contact', 'Contact Us')
  .description('Get in touch with our team')

  .group('personal-info', 'Personal Information')
  .question(
    QuestionHelpers.text('fullName', 'Full Name', {
      required: true,
      validation: [ValidationHelpers.required(), ValidationHelpers.minLength(2)],
    }),
  )
  .question(
    QuestionHelpers.text('email', 'Email Address', {
      type: 'email',
      required: true,
      validation: [ValidationHelpers.required(), ValidationHelpers.email()],
    }),
  )
  .question(
    QuestionHelpers.text('phone', 'Phone Number (optional)', {
      validation: [ValidationHelpers.pattern(/^\+?[\d\s-()]+$/, 'Please enter a valid phone number')],
    }),
  )

  .group('inquiry', 'Your Inquiry')
  .question(
    QuestionHelpers.select(
      'inquiryType',
      'Type of Inquiry',
      [
        { label: 'General Question', value: 'general' },
        { label: 'Support Request', value: 'support' },
        { label: 'Feature Request', value: 'feature' },
        { label: 'Bug Report', value: 'bug' },
        { label: 'Business Partnership', value: 'business' },
      ],
      {
        required: true,
      },
    ),
  )
  .question(
    QuestionHelpers.text('subject', 'Subject', {
      required: true,
      validation: [ValidationHelpers.required(), ValidationHelpers.minLength(5)],
    }),
  )
  .question(
    QuestionHelpers.text('message', 'Message', {
      required: true,
      validation: [ValidationHelpers.required(), ValidationHelpers.minLength(20)],
      props: { multiline: true },
    }),
  )

  .group('follow-up', 'Follow-up Preferences')
  .question(
    QuestionHelpers.select(
      'preferredContact',
      'Preferred contact method',
      [
        { label: 'Email', value: 'email' },
        { label: 'Phone', value: 'phone' },
        { label: 'Either', value: 'either' },
      ],
      {
        required: true,
        defaultValue: 'email',
      },
    ),
  )
  .question(
    QuestionHelpers.toggle('urgent', 'Is this urgent?', {
      defaultValue: false,
    }),
  )
  .question(
    QuestionHelpers.text('urgentReason', 'Please explain why this is urgent', {
      required: true,
      showIf: [ConditionalHelpers.equals('urgent', true)],
      validation: [ValidationHelpers.required('Please explain the urgency')],
    }),
  )
  .build()

/**
 * Example of a survey form with complex conditional logic
 */
export const userSurveyForm = new FormBuilder('user-survey', 'User Experience Survey')
  .description('Help us understand how you use our tools')

  .group('demographics', 'About You')
  .question(
    QuestionHelpers.select(
      'role',
      'What is your primary role?',
      [
        { label: 'Frontend Developer', value: 'frontend' },
        { label: 'Backend Developer', value: 'backend' },
        { label: 'Full-stack Developer', value: 'fullstack' },
        { label: 'DevOps Engineer', value: 'devops' },
        { label: 'Product Manager', value: 'pm' },
        { label: 'Designer', value: 'designer' },
        { label: 'Student', value: 'student' },
        { label: 'Other', value: 'other' },
      ],
      {
        required: true,
      },
    ),
  )
  .question(
    QuestionHelpers.text('otherRole', 'Please specify your role', {
      required: true,
      showIf: [ConditionalHelpers.equals('role', 'other')],
    }),
  )
  .question(
    QuestionHelpers.select('experience', 'Years of development experience', OptionHelpers.experienceLevels(), {
      required: true,
    }),
  )

  .group('usage', 'Tool Usage')
  .question(
    QuestionHelpers.multiselect(
      'tools',
      'Which development tools do you use regularly?',
      [
        { label: 'Visual Studio Code', value: 'vscode' },
        { label: 'IntelliJ IDEA', value: 'intellij' },
        { label: 'Sublime Text', value: 'sublime' },
        { label: 'Vim/Neovim', value: 'vim' },
        { label: 'Emacs', value: 'emacs' },
        { label: 'Atom', value: 'atom' },
        { label: 'Other', value: 'other' },
      ],
      {
        required: true,
      },
    ),
  )
  .question(
    QuestionHelpers.select(
      'primaryFramework',
      'What is your primary frontend framework?',
      OptionHelpers.frontendFrameworks(),
      {
        required: true,
        showIf: [ConditionalHelpers.in('role', ['frontend', 'fullstack'])],
      },
    ),
  )

  .group('feedback', 'Feedback')
  .question(
    QuestionHelpers.number('satisfaction', 'Overall satisfaction (1-10)', {
      required: true,
      validation: [ValidationHelpers.required(), ValidationHelpers.min(1), ValidationHelpers.max(10)],
    }),
  )
  .question(
    QuestionHelpers.text('improvements', 'What could we improve?', {
      required: true,
      showIf: [ConditionalHelpers.lessThan('satisfaction', 8)],
      validation: [ValidationHelpers.required('Please tell us what we could improve')],
    }),
  )
  .question(
    QuestionHelpers.text('favoriteFeature', 'What is your favorite feature?', {
      showIf: [ConditionalHelpers.greaterThan('satisfaction', 7)],
    }),
  )
  .build()
