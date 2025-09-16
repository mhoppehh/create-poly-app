#!/usr/bin/env node
import path from 'path'
import { scaffoldProject } from './engine'
import { createLogger } from './logger'
import { loadLoggingConfig } from './config'
import { runForm } from './forms'
import { createPolyAppForm } from './forms/definitions'

async function main() {
  // Initialize logger with configuration
  const loggingConfig = loadLoggingConfig()
  const logger = createLogger({
    logLevel: loggingConfig.level,
    logFilePath: path.resolve(process.cwd(), loggingConfig.logFilePath || 'create-poly-app.log'),
    enableConsole: loggingConfig.enableConsole,
    enableFile: loggingConfig.enableFile,
  })

  logger.infoFileOnly('main', 'Starting create-poly-app')

  try {
    // Use the new form system
    const answers = await runForm(createPolyAppForm, {
      validateOnChange: true,
      autoSave: true,
      saveKey: 'create-poly-app-state',
    })

    logger.infoFileOnly('main', 'User choices: %o', answers)

    // Extract project details
    const projectName = answers.projectName
    const projectPath = path.resolve(process.cwd(), projectName)
    logger.infoFileOnly('main', 'Project will be created at: %s', projectPath)

    // Build feature list based on user selections
    const features = ['projectDir']

    if (answers.includeFrontend) {
      features.push('vite')
      if (answers.includeTailwind) {
        features.push('tailwind')
      }
    }

    if (answers.includeGraphQLServer) {
      features.push('apollo-server')
    }

    console.log('\n🎯 Creating project with features:', features.join(', '))

    await scaffoldProject(projectName, projectPath, features)

    console.log(`\n✅ Project "${projectName}" created successfully!`)
    console.log(`📁 Location: ${projectPath}`)
    console.log('\n🚀 Next steps:')
    console.log(`   cd ${projectName}`)

    if (answers.packageManager === 'pnpm') {
      console.log('   pnpm install')
      if (answers.includeFrontend) {
        console.log('   pnpm dev  # Start the frontend')
      }
      if (answers.includeGraphQLServer) {
        console.log('   pnpm --filter=api dev  # Start the API server')
      }
    } else if (answers.packageManager === 'yarn') {
      console.log('   yarn install')
      if (answers.includeFrontend) {
        console.log('   yarn dev  # Start the frontend')
      }
    } else {
      console.log('   npm install')
      if (answers.includeFrontend) {
        console.log('   npm run dev  # Start the frontend')
      }
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
