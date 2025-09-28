#!/usr/bin/env node
import path from 'path'
import { scaffoldProject } from './engine'
import { createLogger } from './logger'
import { loadLoggingConfig } from './config'
import { runForm } from './forms'
import { createPolyAppForm } from './forms/definitions'
import { createPresetLoadForm, createSavePresetPromptForm, defaultPresetManager } from './forms'
import {
  selectFeaturesFromAnswers,
  getFeatureConfigurationQuestions,
  extractFeatureConfigurations,
} from './forms/feature-selector'

async function main() {
  const loggingConfig = loadLoggingConfig()
  const logger = createLogger({
    logLevel: loggingConfig.level,
    logFilePath: path.resolve(process.cwd(), loggingConfig.logFilePath || 'create-poly-app.log'),
    enableConsole: loggingConfig.enableConsole,
    enableFile: loggingConfig.enableFile,
  })

  logger.infoFileOnly('main', 'Starting create-poly-app')

  try {
    console.log('\n🚀 Welcome to Create Poly App!\n')

    const presetLoadForm = await createPresetLoadForm(createPolyAppForm.id)
    const presetChoice = await runForm(presetLoadForm, {
      validateOnChange: true,
    })

    let answers: Record<string, any>

    if (presetChoice.selectedPreset && presetChoice.selectedPreset !== 'none') {
      const preset = await defaultPresetManager.getPreset(presetChoice.selectedPreset)
      if (preset) {
        console.log(`\n📂 Loading preset: "${preset.name}"`)
        answers = preset.answers
        logger.infoFileOnly('main', 'Loaded preset: %s', preset.name)
        logger.infoFileOnly('main', 'Preset answers: %o', answers)
      } else {
        console.log('\n❌ Failed to load preset, starting fresh...')
        answers = await runForm(createPolyAppForm, {
          validateOnChange: true,
          autoSave: true,
          saveKey: 'create-poly-app-state',
        })
      }
    } else {
      answers = await runForm(createPolyAppForm, {
        validateOnChange: true,
        autoSave: true,
        saveKey: 'create-poly-app-state',
      })
    }

    logger.infoFileOnly('main', 'User choices: %o', answers)

    const projectName = answers.projectName
    const projectPath = path.resolve(process.cwd(), projectName)
    logger.infoFileOnly('main', 'Project will be created at: %s', projectPath)

    const features = selectFeaturesFromAnswers(answers)
    logger.infoFileOnly('main', 'Selected features: %o', features)

    const configQuestions = getFeatureConfigurationQuestions(features)
    let allAnswers = { ...answers }

    if (configQuestions.length > 0) {
      console.log('\n⚙️  Configuring features...')

      const configForm = {
        id: 'feature-config',
        title: '⚙️  Feature Configuration',
        description: 'Configure the selected features for your project',
        groups: configQuestions,
      }

      const configAnswers = await runForm(configForm, {
        validateOnChange: true,
        autoSave: true,
        saveKey: 'create-poly-app-config-state',
        presetAnswers: answers,
      })

      allAnswers = { ...answers, ...configAnswers }
      logger.infoFileOnly('main', 'Feature configurations: %o', configAnswers)
    }

    const featureConfigurations = extractFeatureConfigurations(allAnswers, features)
    logger.infoFileOnly('main', 'Extracted feature configurations: %o', featureConfigurations)

    const usedPreset = presetChoice.selectedPreset && presetChoice.selectedPreset !== 'none'

    if (!usedPreset) {
      console.log('\n💾 Would you like to save your configuration as a preset for future use?')
      console.log('   This will be saved before project creation, so you can reuse it even if scaffolding fails.')

      try {
        const savePrompt = createSavePresetPromptForm()
        const saveChoice = await runForm(savePrompt, {
          validateOnChange: true,
        })

        if (saveChoice.shouldSave) {
          const { savePresetForm } = await import('./forms/definitions')
          const presetDetails = await runForm(savePresetForm, {
            validateOnChange: true,
          })

          const tags = presetDetails.presetTags
            ? presetDetails.presetTags
                .split(',')
                .map((tag: string) => tag.trim())
                .filter((tag: string) => tag.length > 0)
            : undefined

          const savedPreset = await defaultPresetManager.savePreset({
            name: presetDetails.presetName,
            description: presetDetails.presetDescription || undefined,
            formId: createPolyAppForm.id,
            answers: allAnswers,
            tags,
          })

          if (savedPreset) {
            console.log(`\n✨ Preset saved successfully as: "${savedPreset.name}"`)
            console.log(`📝 You can reuse this configuration next time by selecting it from the preset list.`)
            logger.infoFileOnly('main', 'Saved preset: %s', savedPreset.name)
          } else {
            console.log('\n⚠️  Failed to save preset')
          }
        }
      } catch (saveError) {
        console.log('\n⚠️  Preset saving was cancelled or failed')
        logger.error('main', 'Preset saving failed: %s', saveError)
      }
    } else {
      logger.infoFileOnly('main', 'Preset was used, skipping save prompt')
    }

    console.log('\n🎯 Creating project with features:', features.join(', '))

    await scaffoldProject(projectName, projectPath, features, featureConfigurations, allAnswers)

    console.log(`\n✅ Project "${projectName}" created successfully!`)
    console.log(`📁 Location: ${projectPath}`)

    console.log('\n🚀 Next steps:')
    console.log(`   cd ${projectName}`)
    console.log('   pnpm install')

    if (features.includes('vite')) {
      console.log('   pnpm dev  # Start the frontend')
    }

    if (features.includes('apollo-server')) {
      console.log('   pnpm --filter=api dev  # Start the API server')
    }

    if (features.includes('prisma')) {
      console.log('\n📊 Database Setup (Prisma):')
      console.log('   1. Update your DATABASE_URL in api/.env')
      console.log('   2. Run database migrations:')
      console.log('      pnpm --filter=api prisma:push    # Push schema to database')
      console.log('      pnpm --filter=api prisma:seed    # Seed with sample data')
      console.log('      pnpm --filter=api prisma:studio  # Open Prisma Studio')
    }
  } catch (error) {
    logger.error('main', 'Project creation failed: %s', error)
    console.error('❌ Project creation failed:', error)
    process.exit(1)
  }
}

main().catch(error => {
  const loggingConfig = loadLoggingConfig()
  const logger = createLogger({
    logLevel: loggingConfig.level,
    enableConsole: loggingConfig.enableConsole,
    enableFile: loggingConfig.enableFile,
  })
  logger.error('main', 'Unhandled error: %s', error)
  process.exit(1)
})
