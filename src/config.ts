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
