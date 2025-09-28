#!/usr/bin/env node
import path from 'path'
import { readFileSync } from 'fs'
import { scaffoldProject } from './engine'
import { createLogger, LogLevel } from './logger'
import { LoggingConfig, DEFAULT_LOGGING_CONFIG } from './config'
import { runForm } from './forms'
import { createPolyAppForm } from './forms/definitions'
import {
  selectFeaturesFromAnswers,
  getFeatureConfigurationQuestions,
  extractFeatureConfigurations,
} from './forms/feature-selector'

interface ParsedArgs {
  loggingConfig: LoggingConfig
}

function showVersion() {
  try {
    const packageJsonPath = path.join(__dirname, '../package.json')
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))
    console.log(`v${packageJson.version}`)
  } catch (error) {
    console.log('version unknown')
  }
}

function showHelp() {
  console.log(`
create-poly-app - A powerful CLI tool for scaffolding modern polyglot applications

Usage:
  create-poly-app [options]

Options:
  --version, -v            Show version number
  --help, -h              Show this help message
  
Logging Options:
  --log-level <level>     Set logging level (error, warn, info, debug) [default: info]
  --log-console           Enable console logging [default: true]
  --no-log-console        Disable console logging
  --log-file              Enable file logging [default: true]
  --no-log-file           Disable file logging
  --log-file-path <path>  Set log file path [default: create-poly-app.log]
  --log-colorize          Enable colored log output [default: true]
  --no-log-colorize       Disable colored log output

Description:
  Interactive CLI tool to scaffold modern applications with React, GraphQL, 
  Prisma, and more. Run without arguments to start the interactive setup.
`)
}

function parseArgs(): ParsedArgs {
  const args = process.argv.slice(2)
  const loggingConfig = { ...DEFAULT_LOGGING_CONFIG }

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]

    switch (arg) {
      case '--version':
      case '-v':
        showVersion()
        process.exit(0)
      case '--help':
      case '-h':
        showHelp()
        process.exit(0)
      case '--log-level':
        const levelValue = args[i + 1]
        if (!levelValue) {
          console.error('Error: --log-level requires a value (error, warn, info, debug)')
          process.exit(1)
        }
        const levelMap: Record<string, LogLevel> = {
          error: LogLevel.ERROR,
          warn: LogLevel.WARN,
          info: LogLevel.INFO,
          debug: LogLevel.DEBUG,
        }
        const level = levelMap[levelValue.toLowerCase()]
        if (level === undefined) {
          console.error(`Error: Invalid log level "${levelValue}". Valid options: error, warn, info, debug`)
          process.exit(1)
        }
        loggingConfig.level = level
        i++ // Skip next argument as it was the value
        break
      case '--log-console':
        loggingConfig.enableConsole = true
        break
      case '--no-log-console':
        loggingConfig.enableConsole = false
        break
      case '--log-file':
        loggingConfig.enableFile = true
        break
      case '--no-log-file':
        loggingConfig.enableFile = false
        break
      case '--log-file-path':
        const pathValue = args[i + 1]
        if (!pathValue) {
          console.error('Error: --log-file-path requires a path value')
          process.exit(1)
        }
        loggingConfig.logFilePath = pathValue
        i++ // Skip next argument as it was the value
        break
      case '--log-colorize':
        loggingConfig.colorize = true
        break
      case '--no-log-colorize':
        loggingConfig.colorize = false
        break
      default:
        if (arg && arg.startsWith('-')) {
          console.error(`Unknown option: ${arg}`)
          console.error('Run "create-poly-app --help" for usage information.')
          process.exit(1)
        }
    }
  }

  return { loggingConfig }
}

async function main() {
  // Parse command line arguments first
  const { loggingConfig } = parseArgs()

  // Initialize logger with configuration from CLI flags
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
      })

      allAnswers = { ...answers, ...configAnswers }
      logger.infoFileOnly('main', 'Feature configurations: %o', configAnswers)
    }

    const featureConfigurations = extractFeatureConfigurations(allAnswers, features)
    logger.infoFileOnly('main', 'Extracted feature configurations: %o', featureConfigurations)

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
  // Use default logging config for error handling since CLI parsing failed
  const logger = createLogger({
    logLevel: DEFAULT_LOGGING_CONFIG.level,
    enableConsole: DEFAULT_LOGGING_CONFIG.enableConsole,
    enableFile: DEFAULT_LOGGING_CONFIG.enableFile,
  })
  logger.error('main', 'Unhandled error: %s', error)
  process.exit(1)
})
