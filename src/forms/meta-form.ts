import { FormBuilder, QuestionHelpers, ValidationHelpers, ConditionalHelpers, OptionHelpers } from './helpers'

/**
 * Meta-form: A form that helps you create forms!
 * This demonstrates the power and flexibility of our form system.
 */
export const formBuilderForm = new FormBuilder('form-builder', '🎯 Form Builder')
  .description('Create your own custom form using our powerful form system')
  .settings({
    allowBack: true,
    showProgress: true,
    submitLabel: 'Generate Form',
    cancelLabel: 'Cancel',
  })

  // Basic form information
  .group('form-basics', 'Form Information', 'Tell us about the form you want to create')
  .question(
    QuestionHelpers.text('formId', 'Form ID', {
      description: 'A unique identifier for your form (used internally)',
      required: true,
      placeholder: 'my-survey',
      validation: [
        ValidationHelpers.required('Form ID is required'),
        ValidationHelpers.pattern(
          /^[a-zA-Z0-9-_]+$/,
          'Form ID can only contain letters, numbers, hyphens, and underscores',
        ),
      ],
    }),
  )
  .question(
    QuestionHelpers.text('formTitle', 'Form Title', {
      description: 'The title that users will see at the top of your form',
      required: true,
      placeholder: 'Customer Feedback Survey',
      validation: [ValidationHelpers.required('Form title is required')],
    }),
  )
  .question(
    QuestionHelpers.text('formDescription', 'Form Description (optional)', {
      description: 'A brief description of what your form is for',
      placeholder: 'Help us improve our products and services',
    }),
  )

  // Form settings
  .group('form-settings', 'Form Settings', 'Configure how your form behaves')
  .question(
    QuestionHelpers.toggle('allowBack', 'Allow users to go back to previous questions?', {
      defaultValue: true,
      description: 'Users can navigate backwards through the form',
    }),
  )
  .question(
    QuestionHelpers.toggle('showProgress', 'Show progress indicator?', {
      defaultValue: true,
      description: 'Display progress bar or step counter',
    }),
  )
  .question(
    QuestionHelpers.text('submitLabel', 'Submit Button Label', {
      defaultValue: 'Submit',
      placeholder: 'Submit Survey',
    }),
  )

  // Number of groups
  .group('form-structure', 'Form Structure', 'Organize your questions into groups')
  .question(
    QuestionHelpers.number('numberOfGroups', 'How many question groups do you want?', {
      description: 'Groups help organize related questions together',
      required: true,
      defaultValue: 1,
      validation: [
        ValidationHelpers.required(),
        ValidationHelpers.min(1, 'You need at least 1 group'),
        ValidationHelpers.max(10, 'Maximum 10 groups allowed for this demo'),
      ],
    }),
  )

  // Dynamic group creation (we'll handle this programmatically)
  .build()

/**
 * Generate additional questions for each group and question
 */
export function generateDynamicFormQuestions(numberOfGroups: number): FormBuilder {
  const builder = new FormBuilder('form-builder-dynamic', '🎯 Form Builder - Configure Questions')
    .description("Now let's set up your question groups and individual questions")
    .settings({
      allowBack: true,
      showProgress: true,
      submitLabel: 'Generate Form Code',
      cancelLabel: 'Back',
    })

  // For each group, ask for group details
  for (let groupIndex = 0; groupIndex < numberOfGroups; groupIndex++) {
    const groupNum = groupIndex + 1

    builder
      .group(`group-${groupIndex}-info`, `Group ${groupNum} Information`, `Configure question group ${groupNum}`)
      .question(
        QuestionHelpers.text(`group${groupIndex}Id`, `Group ${groupNum} ID`, {
          required: true,
          defaultValue: `group-${groupNum}`,
          validation: [
            ValidationHelpers.required(),
            ValidationHelpers.pattern(
              /^[a-zA-Z0-9-_]+$/,
              'Group ID can only contain letters, numbers, hyphens, and underscores',
            ),
          ],
        }),
      )
      .question(
        QuestionHelpers.text(`group${groupIndex}Title`, `Group ${groupNum} Title`, {
          required: true,
          placeholder: `Section ${groupNum}`,
          validation: [ValidationHelpers.required()],
        }),
      )
      .question(
        QuestionHelpers.text(`group${groupIndex}Description`, `Group ${groupNum} Description (optional)`, {
          placeholder: 'Brief description of this section',
        }),
      )
      .question(
        QuestionHelpers.number(`group${groupIndex}QuestionCount`, `How many questions in Group ${groupNum}?`, {
          required: true,
          defaultValue: 2,
          validation: [
            ValidationHelpers.required(),
            ValidationHelpers.min(1, 'At least 1 question required'),
            ValidationHelpers.max(10, 'Maximum 10 questions per group for this demo'),
          ],
        }),
      )
  }

  // For each group's questions, ask for question details
  for (let groupIndex = 0; groupIndex < numberOfGroups; groupIndex++) {
    const groupNum = groupIndex + 1

    // Create one group for all questions in this form group
    builder.group(
      `group-${groupIndex}-questions`,
      `Group ${groupNum} - Questions`,
      `Configure all questions for group ${groupNum}`,
    )

    for (let questionIndex = 0; questionIndex < 5; questionIndex++) {
      // Max 5 questions per group for simplicity
      const questionNum = questionIndex + 1

      // Apply conditional logic to each individual question, not the group
      const questionCondition = [ConditionalHelpers.greaterThan(`group${groupIndex}QuestionCount`, questionIndex)]

      builder
        .question(
          QuestionHelpers.text(`g${groupIndex}q${questionIndex}Id`, `Question ${questionNum} ID`, {
            required: true,
            defaultValue: `question-${groupNum}-${questionNum}`,
            showIf: questionCondition,
            validation: [
              ValidationHelpers.required(),
              ValidationHelpers.pattern(
                /^[a-zA-Z0-9-_]+$/,
                'Question ID can only contain letters, numbers, hyphens, and underscores',
              ),
            ],
          }),
        )
        .question(
          QuestionHelpers.text(`g${groupIndex}q${questionIndex}Title`, `Question ${questionNum} Text`, {
            required: true,
            placeholder: 'What is your name?',
            showIf: questionCondition,
            validation: [ValidationHelpers.required()],
          }),
        )
        .question(
          QuestionHelpers.select(
            `g${groupIndex}q${questionIndex}Type`,
            `Question ${questionNum} Type`,
            [
              { label: 'Text Input', value: 'text', description: 'Single line text input' },
              { label: 'Number Input', value: 'number', description: 'Numeric input with validation' },
              { label: 'Yes/No Toggle', value: 'toggle', description: 'Boolean true/false question' },
              { label: 'Single Choice', value: 'select', description: 'Choose one option from a list' },
              { label: 'Multiple Choice', value: 'multiselect', description: 'Choose multiple options from a list' },
              { label: 'Email Address', value: 'email', description: 'Email input with validation' },
            ],
            {
              required: true,
              defaultValue: 'text',
              showIf: questionCondition,
            },
          ),
        )
        .question(
          QuestionHelpers.text(
            `g${groupIndex}q${questionIndex}Description`,
            `Question ${questionNum} Description (optional)`,
            {
              placeholder: 'Additional help text for users',
              showIf: questionCondition,
            },
          ),
        )
        .question(
          QuestionHelpers.toggle(`g${groupIndex}q${questionIndex}Required`, `Is Question ${questionNum} required?`, {
            defaultValue: false,
            showIf: questionCondition,
          }),
        )
        .question(
          QuestionHelpers.text(
            `g${groupIndex}q${questionIndex}Placeholder`,
            `Question ${questionNum} Placeholder (optional)`,
            {
              placeholder: 'Enter your response here...',
              showIf: [
                ...questionCondition,
                ConditionalHelpers.in(`g${groupIndex}q${questionIndex}Type`, ['text', 'email']),
              ],
            },
          ),
        )
        .question(
          QuestionHelpers.text(`g${groupIndex}q${questionIndex}Options`, `Question ${questionNum} Options`, {
            description: 'Enter options separated by commas (e.g., "Option 1, Option 2, Option 3")',
            required: true,
            placeholder: 'Excellent, Good, Fair, Poor',
            showIf: [
              ...questionCondition,
              ConditionalHelpers.in(`g${groupIndex}q${questionIndex}Type`, ['select', 'multiselect']),
            ],
            validation: [
              ValidationHelpers.custom(value => {
                if (!value || typeof value !== 'string') return false
                const options = value
                  .split(',')
                  .map(s => s.trim())
                  .filter(s => s.length > 0)
                return options.length >= 2 || 'Please provide at least 2 options'
              }),
            ],
          }),
        )
    }
  }

  return builder
}

/**
 * Process form builder answers and generate the actual form definition
 */
export function generateFormFromAnswers(basicAnswers: any, detailAnswers: any): string {
  const { formId, formTitle, formDescription, allowBack, showProgress, submitLabel, numberOfGroups } = basicAnswers

  // Start building the form code
  let formCode = `import { Form } from './types'

// Generated form: ${formTitle}
export const ${formId}Form: Form = {
  id: '${formId}',
  title: '${formTitle}',`

  if (formDescription) {
    formCode += `
  description: '${formDescription}',`
  }

  formCode += `
  settings: {
    allowBack: ${allowBack},
    showProgress: ${showProgress},
    submitLabel: '${submitLabel}',
    cancelLabel: 'Cancel'
  },
  groups: [`

  // Generate groups
  for (let groupIndex = 0; groupIndex < numberOfGroups; groupIndex++) {
    const groupId = detailAnswers[`group${groupIndex}Id`]
    const groupTitle = detailAnswers[`group${groupIndex}Title`]
    const groupDescription = detailAnswers[`group${groupIndex}Description`]
    const questionCount = detailAnswers[`group${groupIndex}QuestionCount`]

    formCode += `
    {
      id: '${groupId}',
      title: '${groupTitle}',`

    if (groupDescription) {
      formCode += `
      description: '${groupDescription}',`
    }

    formCode += `
      questions: [`

    // Generate questions for this group
    for (let questionIndex = 0; questionIndex < questionCount; questionIndex++) {
      const qId = detailAnswers[`g${groupIndex}q${questionIndex}Id`]
      const qTitle = detailAnswers[`g${groupIndex}q${questionIndex}Title`]
      const qType = detailAnswers[`g${groupIndex}q${questionIndex}Type`]
      const qDescription = detailAnswers[`g${groupIndex}q${questionIndex}Description`]
      const qRequired = detailAnswers[`g${groupIndex}q${questionIndex}Required`]
      const qPlaceholder = detailAnswers[`g${groupIndex}q${questionIndex}Placeholder`]
      const qOptions = detailAnswers[`g${groupIndex}q${questionIndex}Options`]

      formCode += `
        {
          id: '${qId}',
          type: '${qType}',
          title: '${qTitle}',`

      if (qDescription) {
        formCode += `
          description: '${qDescription}',`
      }

      if (qRequired) {
        formCode += `
          required: true,`
      }

      if (qPlaceholder) {
        formCode += `
          placeholder: '${qPlaceholder}',`
      }

      // Add options for select/multiselect
      if (qOptions && ['select', 'multiselect'].includes(qType)) {
        const options = qOptions
          .split(',')
          .map((opt: string) => opt.trim())
          .filter((opt: string) => opt.length > 0)
        formCode += `
          options: [`
        options.forEach((option: string, index: number) => {
          formCode += `
            { label: '${option}', value: '${option.toLowerCase().replace(/[^a-z0-9]/g, '-')}' }`
          if (index < options.length - 1) formCode += ','
        })
        formCode += `
          ],`
      }

      // Add basic validation
      if (qRequired || qType === 'email') {
        formCode += `
          validation: [`

        if (qRequired) {
          formCode += `
            { type: 'required', message: '${qTitle} is required' }`
        }

        if (qType === 'email') {
          if (qRequired) formCode += ','
          formCode += `
            { type: 'email', message: 'Please enter a valid email address' }`
        }

        formCode += `
          ]`
      }

      formCode += `
        }`

      if (questionIndex < questionCount - 1) formCode += ','
    }

    formCode += `
      ]
    }`

    if (groupIndex < numberOfGroups - 1) formCode += ','
  }

  formCode += `
  ]
}

// Usage example:
// import { runForm } from './renderer'
// const answers = await runForm(${formId}Form)
// console.log('Form answers:', answers)
`

  return formCode
}

/**
 * Helper to create a simple usage example
 */
export function generateUsageExample(formId: string): string {
  return `#!/usr/bin/env node
import { runForm } from './forms'
import { ${formId}Form } from './generated-form'

async function main() {
  console.log('\\n🎯 Running your generated form...\\n')
  
  try {
    const answers = await runForm(${formId}Form, {
      validateOnChange: true,
      autoSave: true,
      saveKey: '${formId}-state'
    })

    console.log('\\n✅ Form completed successfully!')
    console.log('📊 Collected answers:')
    console.log(JSON.stringify(answers, null, 2))
    
  } catch (error) {
    console.error('❌ Form was cancelled or failed:', error)
  }
}

main().catch(console.error)
`
}
