#!/usr/bin/env node
import * as fs from 'fs'
import * as path from 'path'
import { runForm } from '../forms'
import {
  formBuilderForm,
  generateDynamicFormQuestions,
  generateFormFromAnswers,
  generateUsageExample,
} from '../forms/meta-form'

async function main() {
  console.log(`
🎯 Welcome to the Form Builder Demo!
=====================================

This script will demonstrate the power and flexibility of our form system
by using it to create other forms. You'll design a form through a series
of questions, and we'll generate the TypeScript code for your form!

Let's get started...
`)

  try {

    console.log('📝 Step 1: Basic Form Information')
    const basicAnswers = await runForm(formBuilderForm, {
      validateOnChange: true,
      autoSave: true,
      saveKey: 'form-builder-basic',
    })

    if (!basicAnswers.formId) {
      console.log('❌ Form creation cancelled.')
      return
    }

    console.log(`\n✅ Great! Creating form: "${basicAnswers.formTitle}"`)
    console.log(`📊 Groups to create: ${basicAnswers.numberOfGroups}`)

    console.log('\n📝 Step 2: Question Details')
    const dynamicForm = generateDynamicFormQuestions(basicAnswers.numberOfGroups)
    const detailAnswers = await runForm(dynamicForm.build(), {
      validateOnChange: true,
      autoSave: true,
      saveKey: 'form-builder-details',
    })

    console.log('\n🔧 Step 3: Generating Form Code...')
    const formCode = generateFormFromAnswers(basicAnswers, detailAnswers)
    const usageCode = generateUsageExample(basicAnswers.formId)

    const outputDir = path.join(process.cwd(), 'generated-forms')
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    const formFile = path.join(outputDir, `${basicAnswers.formId}-form.ts`)
    const testFile = path.join(outputDir, `test-${basicAnswers.formId}.ts`)

    fs.writeFileSync(formFile, formCode)
    fs.writeFileSync(testFile, usageCode)

    console.log(`
🎉 Success! Your form has been generated!

📁 Generated files:
   ${formFile}
   ${testFile}

📋 Form Summary:
   • Form ID: ${basicAnswers.formId}
   • Title: ${basicAnswers.formTitle}
   • Groups: ${basicAnswers.numberOfGroups}
   • Progress: ${basicAnswers.showProgress ? 'Enabled' : 'Disabled'}
   • Back Navigation: ${basicAnswers.allowBack ? 'Enabled' : 'Disabled'}

🚀 To test your generated form:
   1. Copy the form code to your project
   2. Import and use: runForm(${basicAnswers.formId}Form)
   3. Or run: npx ts-node ${testFile}

📖 Form Code Preview:
${'='.repeat(50)}`)

    const previewLines = formCode.split('\n').slice(0, 30)
    console.log(previewLines.join('\n'))
    if (formCode.split('\n').length > 30) {
      console.log('... (truncated, see full code in generated file)')
    }

    console.log('='.repeat(50))

    const { testNow } = await runForm({
      id: 'test-prompt',
      title: '🧪 Test Your Form',
      groups: [
        {
          id: 'test',
          questions: [
            {
              id: 'testNow',
              type: 'toggle',
              title: 'Would you like to test your generated form now?',
              defaultValue: true,
            },
          ],
        },
      ],
    })

    if (testNow) {
      console.log(`\n🧪 Testing your form: "${basicAnswers.formTitle}"...\n`)

      const testForm = createTestFormFromAnswers(basicAnswers, detailAnswers)

      const testAnswers = await runForm(testForm, {
        validateOnChange: true,
      })

      console.log(`
✅ Form test completed!

📊 Test Results:
${JSON.stringify(testAnswers, null, 2)}

🎯 Your form system is working perfectly!
`)
    }

    console.log(`
🌟 Demo Complete!

This demonstration shows how our form system can:
• Create complex, multi-step forms
• Handle conditional logic and validation
• Generate reusable form definitions
• Support various question types
• Provide a fluent, developer-friendly API

The form you just created through forms demonstrates the recursive power
and flexibility of the system. You can use this same approach to create
form builders for any domain!
`)
  } catch (error) {
    console.error('❌ Demo failed:', error)
    console.log('\n🔄 You can restart the demo anytime by running this script again.')
  }
}

function createTestFormFromAnswers(basicAnswers: any, detailAnswers: any) {
  const groups = []

  for (let groupIndex = 0; groupIndex < basicAnswers.numberOfGroups; groupIndex++) {
    const groupId = detailAnswers[`group${groupIndex}Id`]
    const groupTitle = detailAnswers[`group${groupIndex}Title`]
    const groupDescription = detailAnswers[`group${groupIndex}Description`]
    const questionCount = detailAnswers[`group${groupIndex}QuestionCount`]

    const questions = []

    for (let questionIndex = 0; questionIndex < questionCount; questionIndex++) {
      const qId = detailAnswers[`g${groupIndex}q${questionIndex}Id`]
      const qTitle = detailAnswers[`g${groupIndex}q${questionIndex}Title`]
      const qType = detailAnswers[`g${groupIndex}q${questionIndex}Type`]
      const qDescription = detailAnswers[`g${groupIndex}q${questionIndex}Description`]
      const qRequired = detailAnswers[`g${groupIndex}q${questionIndex}Required`]
      const qPlaceholder = detailAnswers[`g${groupIndex}q${questionIndex}Placeholder`]
      const qOptions = detailAnswers[`g${groupIndex}q${questionIndex}Options`]

      const question: any = {
        id: qId,
        type: qType,
        title: qTitle,
        required: qRequired || false,
      }

      if (qDescription) question.description = qDescription
      if (qPlaceholder) question.placeholder = qPlaceholder

      if (qOptions && ['select', 'multiselect'].includes(qType)) {
        const options = qOptions
          .split(',')
          .map((opt: string) => opt.trim())
          .filter((opt: string) => opt.length > 0)
          .map((opt: string) => ({
            label: opt,
            value: opt.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          }))
        question.options = options
      }

      if (qRequired || qType === 'email') {
        question.validation = []
        if (qRequired) {
          question.validation.push({ type: 'required', message: `${qTitle} is required` })
        }
        if (qType === 'email') {
          question.validation.push({ type: 'email', message: 'Please enter a valid email address' })
        }
      }

      questions.push(question)
    }

    groups.push({
      id: groupId,
      title: groupTitle,
      description: groupDescription,
      questions,
    })
  }

  return {
    id: basicAnswers.formId,
    title: basicAnswers.formTitle,
    description: basicAnswers.formDescription,
    settings: {
      allowBack: basicAnswers.allowBack,
      showProgress: basicAnswers.showProgress,
      submitLabel: basicAnswers.submitLabel || 'Submit',
      cancelLabel: 'Cancel',
    },
    groups,
  }
}

main().catch(error => {
  console.error('💥 Unexpected error:', error)
  process.exit(1)
})
