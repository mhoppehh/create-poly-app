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

export const DEFAULT_PRESET_CONFIG: PresetConfig = {
  filePath: path.join(homedir(), 'create-poly-app', 'presets.json'),
  createDirectoryIfNotExists: true,
}

export const DEFAULT_CONFIG: Config = {
  logging: DEFAULT_LOGGING_CONFIG,
  presets: DEFAULT_PRESET_CONFIG,
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

export function loadPresetConfig(): PresetConfig {
  const config = { ...DEFAULT_PRESET_CONFIG }

  if (process.env.PRESET_FILE_PATH) {
    config.filePath = path.resolve(process.env.PRESET_FILE_PATH)
  }

  if (process.env.PRESET_CREATE_DIR !== undefined) {
    config.createDirectoryIfNotExists = process.env.PRESET_CREATE_DIR.toLowerCase() === 'true'
  }

  return config
}

export function loadConfig(): Config {
  return {
    logging: loadLoggingConfig(),
    presets: loadPresetConfig(),
  }
}
