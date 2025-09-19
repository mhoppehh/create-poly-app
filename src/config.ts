import { LogLevel } from './logger'

export interface LoggingConfig {
  level: LogLevel
  enableConsole: boolean
  enableFile: boolean
  logFilePath?: string
  colorize?: boolean
}

export const DEFAULT_LOGGING_CONFIG: LoggingConfig = {
  level: LogLevel.INFO,
  enableConsole: true,
  enableFile: true,
  logFilePath: 'create-poly-app.log',
  colorize: true,
}

export function loadLoggingConfig(): LoggingConfig {
  const config = { ...DEFAULT_LOGGING_CONFIG }

  if (process.env.LOG_LEVEL) {
    const levelMap: Record<string, LogLevel> = {
      error: LogLevel.ERROR,
      warn: LogLevel.WARN,
      info: LogLevel.INFO,
      debug: LogLevel.DEBUG,
    }
    const level = levelMap[process.env.LOG_LEVEL.toLowerCase()]
    if (level !== undefined) {
      config.level = level
    }
  }

  if (process.env.LOG_CONSOLE !== undefined) {
    config.enableConsole = process.env.LOG_CONSOLE.toLowerCase() === 'true'
  }

  if (process.env.LOG_FILE !== undefined) {
    config.enableFile = process.env.LOG_FILE.toLowerCase() === 'true'
  }

  if (process.env.LOG_FILE_PATH) {
    config.logFilePath = process.env.LOG_FILE_PATH
  }

  if (process.env.LOG_COLORIZE !== undefined) {
    config.colorize = process.env.LOG_COLORIZE.toLowerCase() === 'true'
  }

  return config
}
