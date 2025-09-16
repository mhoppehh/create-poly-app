# Form System

A flexible, reusable form system with conditional logic, validation, and support for multiple question types. Built for `create-poly-app` but designed to be used in any TypeScript/Node.js project.

## Features

- **Multiple Question Types**: text, number, boolean/toggle, select, multiselect, date, email, password, URL
- **Conditional Logic**: Show/hide questions based on previous answers
- **Validation**: Built-in and custom validation rules
- **Group Organization**: Organize questions into logical groups
- **Progress Tracking**: Optional progress indicators
- **Auto-save**: Save form state to localStorage
- **TypeScript**: Full type safety and IntelliSense support
- **Builder Pattern**: Fluent API for creating forms programmatically

## Quick Start

### Basic Usage

```typescript
import { runForm, Form } from './forms'

const myForm: Form = {
  id: 'my-form',
  title: 'My Survey',
  groups: [
    {
      id: 'basics',
      title: 'Basic Information',
      questions: [
        {
          id: 'name',
          type: 'text',
          title: 'What is your name?',
          required: true,
        },
        {
          id: 'email',
          type: 'email',
          title: 'Email address',
          required: true,
          validation: [{ type: 'email' }],
        },
      ],
    },
  ],
}

// Run the form
const answers = await runForm(myForm)
console.log(answers) // { name: "John", email: "john@example.com" }
```

### Using the Builder Pattern

```typescript
import { FormBuilder, QuestionHelpers, ValidationHelpers, ConditionalHelpers } from './forms'

const form = new FormBuilder('survey', 'User Survey')
  .description('Tell us about yourself')
  .settings({ showProgress: true })

  .group('personal', 'Personal Info')
  .question(
    QuestionHelpers.text('name', 'Your name', {
      required: true,
      validation: [ValidationHelpers.required()],
    }),
  )
  .question(
    QuestionHelpers.number('age', 'Your age', {
      validation: [ValidationHelpers.min(13), ValidationHelpers.max(120)],
    }),
  )

  .group('preferences', 'Preferences')
  .question(QuestionHelpers.toggle('newsletter', 'Subscribe to newsletter?'))
  .question(
    QuestionHelpers.text('interests', 'What interests you?', {
      showIf: [ConditionalHelpers.equals('newsletter', true)],
    }),
  )

  .build()

const answers = await runForm(form)
```

## Question Types

### Text Input

```typescript
{
  id: 'description',
  type: 'text',
  title: 'Project description',
  placeholder: 'Enter description...',
  validation: [{ type: 'minLength', value: 10 }]
}
```

### Number Input

```typescript
{
  id: 'budget',
  type: 'number',
  title: 'Budget ($)',
  validation: [
    { type: 'min', value: 100 },
    { type: 'max', value: 10000 }
  ]
}
```

### Boolean/Toggle

```typescript
{
  id: 'accept',
  type: 'toggle',
  title: 'Accept terms and conditions?',
  required: true
}
```

### Select (Single Choice)

```typescript
{
  id: 'framework',
  type: 'select',
  title: 'Preferred framework',
  options: [
    { label: 'React', value: 'react' },
    { label: 'Vue', value: 'vue' },
    { label: 'Angular', value: 'angular' }
  ]
}
```

### Multiselect (Multiple Choice)

```typescript
{
  id: 'features',
  type: 'multiselect',
  title: 'Which features do you need?',
  options: [
    { label: 'Authentication', value: 'auth' },
    { label: 'Database', value: 'db' },
    { label: 'File Upload', value: 'upload' }
  ]
}
```

## Conditional Logic

Questions can be shown/hidden based on answers to previous questions:

```typescript
{
  id: 'details',
  type: 'text',
  title: 'Please provide details',
  showIf: [
    {
      dependsOn: 'hasIssue',
      condition: { type: 'equals', value: true }
    }
  ]
}
```

### Condition Types

- `equals`: Value equals specific value
- `notEquals`: Value doesn't equal specific value
- `in`: Value is in array of values
- `notIn`: Value is not in array of values
- `greaterThan`: Numeric value is greater than
- `lessThan`: Numeric value is less than
- `contains`: String contains substring
- `custom`: Custom function `(value, allAnswers) => boolean`

## Validation

### Built-in Validation Rules

```typescript
validation: [
  { type: 'required', message: 'This field is required' },
  { type: 'minLength', value: 3, message: 'Must be at least 3 characters' },
  { type: 'maxLength', value: 50 },
  { type: 'min', value: 18 },
  { type: 'max', value: 65 },
  { type: 'pattern', value: /^[A-Z]+$/, message: 'Only uppercase letters' },
  { type: 'email' },
  { type: 'url' },
]
```

### Custom Validation

```typescript
{
  type: 'custom',
  validator: (value) => {
    if (value.includes('badword')) {
      return 'Please use appropriate language'
    }
    return true
  }
}
```

## Form Engine

For advanced use cases, you can use the `FormEngine` directly:

```typescript
import { FormEngine } from './forms'

const engine = new FormEngine(form, {
  validateOnChange: true,
  autoSave: true,
  saveKey: 'my-form-state',
})

// Set answers
engine.setAnswer('name', 'John')
engine.setAnswer('email', 'john@example.com')

// Navigate
engine.next() // Move to next group
engine.previous() // Move to previous group

// Get state
const state = engine.getState()
console.log(state.answers, state.errors, state.isComplete)

// Validate
const validation = engine.validateCurrentGroup()
if (!validation.isValid) {
  console.log(validation.errors)
}
```

## Integration Example

Here's how the form system is integrated into `create-poly-app`:

```typescript
// In src/index.ts
import { runForm } from './forms'
import { createPolyAppForm } from './forms/definitions'

async function main() {
  const answers = await runForm(createPolyAppForm, {
    validateOnChange: true,
    autoSave: true,
    saveKey: 'create-poly-app-state',
  })

  // Use answers to configure project generation
  const features = ['projectDir']
  if (answers.includeFrontend) features.push('vite')
  if (answers.includeTailwind) features.push('tailwind')
  if (answers.includeGraphQLServer) features.push('apollo-server')

  await scaffoldProject(answers.projectName, projectPath, features)
}
```

## Reusability

The form system is designed to be easily reusable in other projects:

1. **Copy the forms directory** to your project
2. **Install dependencies**: `prompts` (and `@types/prompts` if using TypeScript)
3. **Import and use**: `import { runForm, FormBuilder } from './forms'`

The system has no dependencies on the specific create-poly-app logic and can be used for any form/survey needs.

## Examples

See `src/forms/examples.ts` for complete examples including:

- Project setup form (used in create-poly-app)
- Contact form
- User survey with complex conditional logic

Each example demonstrates different features and patterns you can use in your own forms.
