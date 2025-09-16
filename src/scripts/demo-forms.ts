#!/usr/bin/env node

/**
 * Simple Form System Demo
 *
 * This script demonstrates the basic capabilities of our form system
 * with a simple, working example that you can run immediately.
 */

// Import the form system (adjust paths if needed)
import { runForm, FormBuilder, QuestionHelpers, ValidationHelpers, ConditionalHelpers } from '../forms'

async function runSimpleDemo() {
  console.log(`
🎯 Form System Demo
==================

This demo shows the basic capabilities of our form system:
• Different question types
• Conditional logic
• Validation
• Grouped questions

Let's start with a simple survey...
`)

  // Create a simple form using the builder
  const demoForm = new FormBuilder('demo', '📋 Quick Survey')
    .description('A simple demo of our form system capabilities')
    .settings({ showProgress: true, allowBack: true })

    .group('personal', 'Personal Information')
    .question(
      QuestionHelpers.text('name', 'What is your name?', {
        required: true,
        validation: [ValidationHelpers.required()],
      }),
    )
    .question(
      QuestionHelpers.select(
        'role',
        'What is your role?',
        [
          { label: 'Developer', value: 'dev' },
          { label: 'Designer', value: 'design' },
          { label: 'Manager', value: 'mgmt' },
          { label: 'Student', value: 'student' },
          { label: 'Other', value: 'other' },
        ],
        { required: true },
      ),
    )
    .question(
      QuestionHelpers.text('otherRole', 'Please specify your role', {
        showIf: [ConditionalHelpers.equals('role', 'other')],
        required: true,
      }),
    )

    .group('preferences', 'Preferences')
    .question(QuestionHelpers.toggle('likesJS', 'Do you enjoy working with JavaScript?'))
    .question(
      QuestionHelpers.multiselect(
        'frameworks',
        'Which frameworks do you use?',
        [
          { label: 'React', value: 'react' },
          { label: 'Vue', value: 'vue' },
          { label: 'Angular', value: 'angular' },
          { label: 'Svelte', value: 'svelte' },
          { label: 'None', value: 'none' },
        ],
        {
          showIf: [ConditionalHelpers.equals('likesJS', true)],
        },
      ),
    )
    .question(
      QuestionHelpers.number('experience', 'Years of experience?', {
        validation: [ValidationHelpers.min(0), ValidationHelpers.max(50)],
      }),
    )

    .group('feedback', 'Feedback')
    .question(QuestionHelpers.text('suggestion', 'Any suggestions for improvement?'))
    .question(QuestionHelpers.toggle('recommend', 'Would you recommend our tools?'))

    .build()

  try {
    const answers = await runForm(demoForm, {
      validateOnChange: true,
    })

    console.log(`
✅ Survey Complete!

📊 Your Answers:
${JSON.stringify(answers, null, 2)}

🎉 This demonstrates:
• Text input with validation
• Select dropdowns  
• Conditional questions (only showed "specify role" if you picked "other")
• Framework selection (only if you like JavaScript)
• Multi-select options
• Number validation
• Form grouping and progress
• Back/forward navigation

The same system powers create-poly-app and can be used for any form needs!
`)
  } catch (error) {
    console.log('\n❌ Demo cancelled or failed:', error.message)
  }
}

async function runMetaFormDemo() {
  console.log(`
🔄 Meta-Form Demo
=================

Now let's see something really cool - using forms to CREATE forms!
This shows the recursive power of our form system.
`)

  try {
    // Simple form to create a basic survey
    const metaForm = new FormBuilder('meta', '🎯 Form Creator')
      .description('Create a simple survey form')

      .group('setup', 'Survey Setup')
      .question(
        QuestionHelpers.text('surveyTitle', 'What should your survey be called?', {
          required: true,
          placeholder: 'Customer Feedback Survey',
        }),
      )
      .question(
        QuestionHelpers.number('questionCount', 'How many questions?', {
          required: true,
          defaultValue: 3,
          validation: [ValidationHelpers.min(1), ValidationHelpers.max(5)],
        }),
      )

      .build()

    const setup = await runForm(metaForm)

    if (!setup.surveyTitle) {
      console.log('❌ Meta-form demo cancelled')
      return
    }

    console.log(`\n🔧 Creating "${setup.surveyTitle}" with ${setup.questionCount} questions...`)

    // Generate form code
    const formCode = `
// Generated Survey: ${setup.surveyTitle}
const generatedSurvey = {
  id: 'generated-survey',
  title: '${setup.surveyTitle}',
  groups: [{
    id: 'questions',
    questions: [
${Array.from(
  { length: setup.questionCount },
  (_, i) => `      {
        id: 'q${i + 1}',
        type: 'text',
        title: 'Question ${i + 1}',
        required: false
      }`,
).join(',\n')}
    ]
  }]
}

// Usage: const answers = await runForm(generatedSurvey)
`

    console.log(`
✅ Generated form code:
${'='.repeat(60)}
${formCode}
${'='.repeat(60)}

🌟 This shows how you can use forms to create forms recursively!
   The full form-builder-demo.ts script has a complete implementation
   that generates working TypeScript code.
`)
  } catch (error) {
    console.log('\n❌ Meta-form demo cancelled:', error.message)
  }
}

async function main() {
  console.log(`
🚀 Welcome to the Form System Demonstration!

This script shows off the capabilities of the form system we built.
Choose what you'd like to see:
`)

  const { demo } = await runForm({
    id: 'demo-choice',
    title: 'Demo Selection',
    groups: [
      {
        id: 'choice',
        questions: [
          {
            id: 'demo',
            type: 'select',
            title: 'Which demo would you like to run?',
            required: true,
            options: [
              {
                label: 'Basic Form Demo',
                value: 'basic',
                description: 'See different question types and conditional logic',
              },
              {
                label: 'Meta-Form Demo',
                value: 'meta',
                description: 'Use forms to create other forms!',
              },
              {
                label: 'Both Demos',
                value: 'both',
                description: 'Run both demonstrations',
              },
            ],
          },
        ],
      },
    ],
  })

  switch (demo) {
    case 'basic':
      await runSimpleDemo()
      break
    case 'meta':
      await runMetaFormDemo()
      break
    case 'both':
      await runSimpleDemo()
      console.log('\n' + '='.repeat(80) + '\n')
      await runMetaFormDemo()
      break
    default:
      console.log('❌ No demo selected')
  }
}

main().catch(error => {
  console.error('💥 Demo failed:', error)
  process.exit(1)
})

module.exports = { runSimpleDemo, runMetaFormDemo, main }
