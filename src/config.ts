import { LogLevel } from './logger'
import * as path from 'path'
import { homedir } from 'os'

export interface LoggingConfig {
  level: LogLevel
  enableConsole: boolean
  enableFile: boolean
  logFilePath?: string
  colorize?: boolean
}

export interface PresetConfig {
  filePath: string
  createDirectoryIfNotExists: boolean
}

export interface Config {
  logging: LoggingConfig
  presets: PresetConfig
}

export const DEFAULT_LOGGING_CONFIG: LoggingConfig = {
  level: LogLevel.INFO,
  enableConsole: true,
  enableFile: true,
  logFilePath: 'create-poly-app.log',
  colorize: true,
}
