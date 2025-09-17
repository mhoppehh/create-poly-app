#!/usr/bin/env node
import path from 'path'
import { scaffoldProject } from './engine'
import { createLogger } from './logger'
import { loadLoggingConfig } from './config'
import { runForm } from './forms'
import { createPolyAppForm } from './forms/definitions'
import { selectFeaturesFromAnswers } from './forms/feature-selector'

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
    const answers = await runForm(createPolyAppForm, {
      validateOnChange: true,
      autoSave: true,
      saveKey: 'create-poly-app-state',
    })

    logger.infoFileOnly('main', 'User choices: %o', answers)

    const projectName = answers.projectName
    const projectPath = path.resolve(process.cwd(), projectName)
    logger.infoFileOnly('main', 'Project will be created at: %s', projectPath)

    const features = selectFeaturesFromAnswers(answers)
    logger.infoFileOnly('main', 'Selected features: %o', features)

    console.log('\n🎯 Creating project with features:', features.join(', '))

    await scaffoldProject(projectName, projectPath, features)

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
