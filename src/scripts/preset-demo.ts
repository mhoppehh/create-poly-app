#!/usr/bin/env node

import { runForm, runFormWithPresets, saveFormAsPreset } from '../forms'
import {
  createPresetLoadForm,
  createPresetManagementForm,
  createSavePresetPromptForm,
  defaultPresetManager,
} from '../forms'
import { FormBuilder, QuestionHelpers, ValidationHelpers } from '../forms/helpers'

// Create a sample form to demonstrate presets
const sampleForm = new FormBuilder('sample-app', '🚀 Sample App Generator')
  .description('Create your sample application with presets!')
  .settings({
    allowBack: true,
    showProgress: true,
    submitLabel: 'Generate App',
    cancelLabel: 'Cancel',
  })

  .group('project-info', 'Project Information')
  .question(
    QuestionHelpers.text('projectName', 'Project Name', {
      required: true,
      defaultValue: 'my-sample-app',
      validation: [
        ValidationHelpers.required(),
        ValidationHelpers.pattern(
          /^[a-zA-Z0-9-_]+$/,
          'Project name can only contain letters, numbers, hyphens, and underscores',
        ),
      ],
    }),
  )
  .question(
    QuestionHelpers.text('description', 'Project Description', {
      placeholder: 'A sample application',
    }),
  )

  .group('features', 'Features')
  .question(
    QuestionHelpers.multiselect(
      'selectedFeatures',
      'Which features would you like?',
      [
        { label: 'TypeScript', value: 'typescript' },
        { label: 'React', value: 'react' },
        { label: 'Node.js API', value: 'api' },
        { label: 'Database (PostgreSQL)', value: 'database' },
        { label: 'Authentication', value: 'auth' },
        { label: 'GraphQL', value: 'graphql' },
      ],
      {
        required: true,
        defaultValue: ['typescript'],
      },
    ),
  )

  .group('deployment', 'Deployment Options')
  .question(
    QuestionHelpers.select(
      'deploymentTarget',
      'Deployment Target',
      [
        { label: 'Docker', value: 'docker' },
        { label: 'Vercel', value: 'vercel' },
        { label: 'Heroku', value: 'heroku' },
        { label: 'AWS', value: 'aws' },
        { label: 'None', value: 'none' },
      ],
      {
        defaultValue: 'docker',
      },
    ),
  )

  .build()

async function runPresetDemo() {
  console.log(`
🎯 Preset System Demo
====================

This demo shows how to use the preset system to save and reuse form configurations.

Features demonstrated:
• Loading existing presets
• Saving form answers as presets
• Managing presets
• Preset metadata and organization

Let's get started!
`)

  const { demo } = await runForm({
    id: 'preset-demo-choice',
    title: 'Preset Demo Selection',
    groups: [
      {
        id: 'choice',
        questions: [
          {
            id: 'demo',
            type: 'select',
            title: 'What would you like to do?',
            required: true,
            options: [
              {
                label: '🆕 Create and Save a Preset',
                value: 'create',
                description: 'Fill out the form and save as a preset',
              },
              {
                label: '📂 Load and Use a Preset',
                value: 'load',
                description: 'Use an existing preset (requires saved presets)',
              },
              {
                label: '⚙️ Manage Presets',
                value: 'manage',
                description: 'View, delete, or export presets',
              },
              {
                label: '🎮 Full Demo',
                value: 'full',
                description: 'Complete workflow: create, save, load presets',
              },
            ],
          },
        ],
      },
    ],
  })

  switch (demo) {
    case 'create':
      await demoCreatePreset()
      break
    case 'load':
      await demoLoadPreset()
      break
    case 'manage':
      await demoManagePresets()
      break
    case 'full':
      await demoFullWorkflow()
      break
  }
}

async function demoCreatePreset() {
  console.log(`\n📝 Create and Save Preset Demo\n`)

  try {
    // Run the form normally
    const answers = await runForm(sampleForm, {
      validateOnChange: true,
    })

    console.log('\n✅ Form completed! Here are your answers:')
    console.log(JSON.stringify(answers, null, 2))

    // Ask if they want to save as preset
    const savePrompt = createSavePresetPromptForm()
    const saveChoice = await runForm(savePrompt, { validateOnChange: true })

    if (saveChoice.shouldSave) {
      // Get preset details
      const { savePresetForm } = await import('../forms/definitions')
      const presetDetails = await runForm(savePresetForm, { validateOnChange: true })

      // Save the preset
      const success = await saveFormAsPreset(
        sampleForm.id,
        answers,
        presetDetails.presetName,
        presetDetails.presetDescription,
        presetDetails.presetTags
          ?.split(',')
          .map((tag: string) => tag.trim())
          .filter(Boolean),
      )

      if (success) {
        console.log(`\n💾 Preset saved successfully as: "${presetDetails.presetName}"`)

        // Show preset count
        const presets = await defaultPresetManager.getPresetsForForm(sampleForm.id)
        console.log(`📊 You now have ${presets.length} preset(s) for this form`)
      } else {
        console.log('\n❌ Failed to save preset')
      }
    } else {
      console.log('\n⏭️  Skipped saving preset')
    }
  } catch (error) {
    console.log('\n❌ Demo was cancelled or failed')
  }
}

async function demoLoadPreset() {
  console.log(`\n📂 Load Preset Demo\n`)

  try {
    // Check if any presets exist
    const presets = await defaultPresetManager.getPresetsForForm(sampleForm.id)

    if (presets.length === 0) {
      console.log('❌ No presets found for this form. Please create and save a preset first.')
      return
    }

    console.log(`📊 Found ${presets.length} preset(s) for this form:`)
    presets.forEach((preset, index) => {
      console.log(`   ${index + 1}. ${preset.name}${preset.description ? ` - ${preset.description}` : ''}`)
    })

    // Use the preset-enabled form runner
    const result = await runFormWithPresets(sampleForm, {
      validateOnChange: true,
    })

    console.log('\n✅ Form completed!')

    if (result.usedPreset) {
      const preset = await defaultPresetManager.getPreset(result.usedPreset)
      console.log(`📂 Loaded from preset: "${preset?.name}"`)
    } else {
      console.log('🆕 Started fresh (no preset loaded)')
    }

    console.log('\n📋 Final answers:')
    console.log(JSON.stringify(result.answers, null, 2))
  } catch (error) {
    console.log('\n❌ Demo was cancelled or failed')
  }
}

async function demoManagePresets() {
  console.log(`\n⚙️ Preset Management Demo\n`)

  try {
    // Show current presets
    const allPresets = await defaultPresetManager.getAllPresets()
    const formPresets = await defaultPresetManager.getPresetsForForm(sampleForm.id)

    console.log(`📊 Storage Info:`)
    const storageInfo = defaultPresetManager.getStorageInfo()
    console.log(`   • Total presets: ${storageInfo.count}`)
    console.log(`   • Storage size: ${storageInfo.estimatedSize}`)
    console.log(`   • Presets for this form: ${formPresets.length}`)

    if (allPresets.length === 0) {
      console.log('\n❌ No presets found. Create some presets first!')
      return
    }

    console.log('\n📋 All presets:')
    allPresets.forEach((preset, index) => {
      const date = new Date(preset.createdAt).toLocaleDateString()
      console.log(`   ${index + 1}. ${preset.name} (${preset.formId}) - ${date}`)
      if (preset.description) {
        console.log(`      Description: ${preset.description}`)
      }
      if (preset.tags && preset.tags.length > 0) {
        console.log(`      Tags: ${preset.tags.join(', ')}`)
      }
    })

    // Run management form
    const managementForm = await createPresetManagementForm()
    const action = await runForm(managementForm, { validateOnChange: true })

    if (action.action === 'view' && action.selectedPreset) {
      const preset = await defaultPresetManager.getPreset(action.selectedPreset)
      if (preset) {
        console.log(`\n📋 Preset Details: "${preset.name}"`)
        console.log(`   • Form: ${preset.formId}`)
        console.log(`   • Created: ${new Date(preset.createdAt).toLocaleString()}`)
        console.log(`   • Updated: ${new Date(preset.updatedAt).toLocaleString()}`)
        console.log(`   • Answer count: ${Object.keys(preset.answers).length}`)
        if (preset.description) {
          console.log(`   • Description: ${preset.description}`)
        }
        if (preset.tags) {
          console.log(`   • Tags: ${preset.tags.join(', ')}`)
        }
        console.log('\n📊 Answers:')
        console.log(JSON.stringify(preset.answers, null, 2))
      }
    } else if (action.action === 'delete' && action.selectedPreset && action.confirmDelete) {
      const success = await defaultPresetManager.deletePreset(action.selectedPreset)
      if (success) {
        console.log('\n✅ Preset deleted successfully')
      } else {
        console.log('\n❌ Failed to delete preset')
      }
    } else if (action.action === 'export') {
      const exportData = await defaultPresetManager.exportPresets()
      console.log('\n📤 Export Data:')
      console.log(exportData)
      console.log('\n💡 You can save this to a file and import it later')
    } else if (action.action === 'clear' && action.confirmClear === 'DELETE ALL') {
      await defaultPresetManager.clearAllPresets()
      console.log('\n✅ All presets cleared')
    }
  } catch (error) {
    console.log('\n❌ Management demo was cancelled or failed')
  }
}

async function demoFullWorkflow() {
  console.log(`\n🎮 Full Preset Workflow Demo\n`)

  try {
    console.log('Step 1: Create your first preset...')
    await demoCreatePreset()

    console.log('\n' + '='.repeat(50))
    console.log('Step 2: Load and modify the preset...')
    await demoLoadPreset()

    console.log('\n' + '='.repeat(50))
    console.log('Step 3: Manage your presets...')
    await demoManagePresets()

    console.log('\n🎉 Full workflow demo completed!')
  } catch (error) {
    console.log('\n❌ Full workflow demo was cancelled or failed')
  }
}

async function main() {
  try {
    await runPresetDemo()

    console.log(`
🌟 Preset Demo Complete!

The preset system provides powerful capabilities for saving and reusing form configurations:

✨ Key Features Demonstrated:
   • Save form answers as reusable presets
   • Load presets to prefill forms
   • Organize presets with names, descriptions, and tags
   • Manage presets (view, delete, export)
   • Automatic storage in localStorage
   • Form-specific preset filtering

💡 Integration Tips:
   • Use \`runFormWithPresets()\` for automatic preset loading
   • Use \`saveFormAsPreset()\` for easy preset saving
   • Use \`PresetManager\` for advanced preset operations
   • Presets work with any form using the form system

🚀 This system can significantly improve user experience by allowing them
   to save and reuse common configurations across multiple runs!
`)
  } catch (error) {
    console.error('💥 Demo failed:', error)
    process.exit(1)
  }
}

main().catch(error => {
  console.error('💥 Unexpected error:', error)
  process.exit(1)
})

export { runPresetDemo, demoCreatePreset, demoLoadPreset, demoManagePresets, demoFullWorkflow }
