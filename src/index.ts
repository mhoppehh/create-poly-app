#!/usr/bin/env node
import prompts from 'prompts'
import path from 'path'
import { scaffoldProject } from './engine'
import { createLogger } from './logger'
import { loadLoggingConfig } from './config'

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

  const response = await prompts([
    {
      type: 'text',
      name: 'projectName',
      message: 'What is the name of your project?',
      initial: 'my-awesome-project',
    },
    {
      type: 'toggle',
      name: 'includeGraphQLServer',
      message: 'Do you want to include a basic GraphQL server?',
      initial: true,
      active: 'yes',
      inactive: 'no',
    },
    // ... more questions for React vs React Native, etc.
  ])

  logger.infoFileOnly('main', 'User choices: %o', response)
  const projectPath = path.resolve(process.cwd(), response.projectName)
  logger.infoFileOnly('main', 'Project will be created at: %s', projectPath)

  try {
    await scaffoldProject(response.projectName, projectPath, ['projectDir', 'vite', 'tailwind', 'apollo-server'])
  } catch (error) {
    logger.error('main', 'Project creation failed: %s', error)
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
