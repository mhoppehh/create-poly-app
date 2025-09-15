import * as fs from 'fs'
import * as fsp from 'fs/promises'
import * as path from 'path'
import { format } from 'util'

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

export interface LoggerOptions {
  logLevel?: LogLevel
  logFilePath?: string
  enableConsole?: boolean
  enableFile?: boolean
}

class Logger {
  private logLevel: LogLevel
  private logFilePath: string
  private enableConsole: boolean
  private enableFile: boolean
  private logFileStream: fs.WriteStream | null = null

  constructor(options: LoggerOptions = {}) {
    this.logLevel = options.logLevel ?? LogLevel.INFO
    this.logFilePath = options.logFilePath ?? path.join(process.cwd(), 'create-poly-app.log')
    this.enableConsole = options.enableConsole ?? true
    this.enableFile = options.enableFile ?? true

    if (this.enableFile) {
      this.initializeLogFile()
    }
  }

  private initializeLogFile(): void {
    try {
      // Ensure log directory exists
      const logDir = path.dirname(this.logFilePath)
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true })
      }

      // Create write stream for log file, overwriting any existing content
      this.logFileStream = fs.createWriteStream(this.logFilePath, { flags: 'w' })

      // Add initial separator for new session
      const sessionStart = `${'='.repeat(50)}\n[${new Date().toISOString()}] NEW SESSION STARTED\n${'='.repeat(50)}\n`
      this.logFileStream.write(sessionStart)
    } catch (error) {
      console.error('Failed to initialize log file:', error)
      this.enableFile = false
    }
  }

  private formatMessage(level: string, source: string, message: string, ...args: any[]): string {
    const timestamp = new Date().toISOString()
    const formattedMessage = args.length > 0 ? format(message, ...args) : message
    return `[${timestamp}] [${level.toUpperCase()}] [${source}] ${formattedMessage}`
  }

  private formatConsoleMessage(level: string, source: string, message: string, ...args: any[]): string {
    const timestamp = new Date().toLocaleTimeString()
    const formattedMessage = args.length > 0 ? format(message, ...args) : message

    // Color codes for different log levels
    const colors = {
      ERROR: '\x1b[31m', // Red
      WARN: '\x1b[33m', // Yellow
      INFO: '\x1b[36m', // Cyan
      DEBUG: '\x1b[37m', // White
      RESET: '\x1b[0m', // Reset
    }

    const color = colors[level.toUpperCase() as keyof typeof colors] || colors.INFO
    const sourceColor = '\x1b[35m' // Magenta for source

    return `${color}[${timestamp}]${colors.RESET} ${sourceColor}[${source}]${colors.RESET} ${formattedMessage}`
  }

  private writeToFile(formattedMessage: string): void {
    if (this.enableFile && this.logFileStream) {
      this.logFileStream.write(formattedMessage + '\n')
    }
  }

  private writeToConsole(level: string, source: string, message: string, ...args: any[]): void {
    if (!this.enableConsole) return

    const consoleMessage = this.formatConsoleMessage(level, source, message, ...args)

    switch (level.toUpperCase()) {
      case 'ERROR':
        console.error(consoleMessage)
        break
      case 'WARN':
        console.warn(consoleMessage)
        break
      case 'DEBUG':
        console.debug(consoleMessage)
        break
      default:
        console.log(consoleMessage)
    }
  }

  private log(level: LogLevel, levelName: string, source: string, message: string, ...args: any[]): void {
    if (level > this.logLevel) return

    const formattedMessage = this.formatMessage(levelName, source, message, ...args)

    this.writeToConsole(levelName, source, message, ...args)
    this.writeToFile(formattedMessage)
  }

  private logFileOnly(level: LogLevel, levelName: string, source: string, message: string, ...args: any[]): void {
    if (level > this.logLevel) return

    const formattedMessage = this.formatMessage(levelName, source, message, ...args)
    this.writeToFile(formattedMessage)
  }

  private logConsoleOnly(level: LogLevel, levelName: string, source: string, message: string, ...args: any[]): void {
    if (level > this.logLevel) return

    this.writeToConsole(levelName, source, message, ...args)
  }

  error(source: string, message: string, ...args: any[]): void {
    this.log(LogLevel.ERROR, 'ERROR', source, message, ...args)
  }

  warn(source: string, message: string, ...args: any[]): void {
    this.log(LogLevel.WARN, 'WARN', source, message, ...args)
  }

  info(source: string, message: string, ...args: any[]): void {
    this.log(LogLevel.INFO, 'INFO', source, message, ...args)
  }

  debug(source: string, message: string, ...args: any[]): void {
    this.log(LogLevel.DEBUG, 'DEBUG', source, message, ...args)
  }

  // File-only logging methods for detailed information
  infoFileOnly(source: string, message: string, ...args: any[]): void {
    this.logFileOnly(LogLevel.INFO, 'INFO', source, message, ...args)
  }

  debugFileOnly(source: string, message: string, ...args: any[]): void {
    this.logFileOnly(LogLevel.DEBUG, 'DEBUG', source, message, ...args)
  }

  // Console-only logging methods for status updates
  statusInfo(source: string, message: string, ...args: any[]): void {
    this.logConsoleOnly(LogLevel.INFO, 'INFO', source, message, ...args)
  }

  // Combined methods that log minimal status to console and detailed info to file
  operation(source: string, consoleMessage: string, fileMessage: string, ...args: any[]): void {
    this.logConsoleOnly(LogLevel.INFO, 'INFO', source, consoleMessage, ...args)
    this.logFileOnly(LogLevel.INFO, 'INFO', source, fileMessage, ...args)
  }

  // Convenience methods for common patterns with refined console/file separation
  scriptStart(source: string, script: string): void {
    this.operation(source, 'Running script...', 'Starting script: %s', script)
  }

  scriptComplete(source: string, script: string): void {
    this.infoFileOnly(source, 'Completed script: %s', script)
  }

  scriptFailed(source: string, script: string, error?: any): void {
    this.error(source, 'Script failed: %s', script)
    if (error) {
      this.infoFileOnly(source, 'Error details: %s', error.message || error)
    }
  }

  fileCreated(source: string, filePath: string): void {
    this.infoFileOnly(source, 'Created file: %s', filePath)
  }

  directoryCreated(source: string, dirPath: string): void {
    this.infoFileOnly(source, 'Created directory: %s', dirPath)
  }

  templateWritten(source: string, templateSrc: string, destination: string): void {
    this.infoFileOnly(source, 'Wrote template %s -> %s', templateSrc, destination)
  }

  featureProcessing(source: string, featureName: string): void {
    this.statusInfo(source, 'Processing feature: %s', featureName)
    this.infoFileOnly(source, 'Starting feature processing: %s', featureName)
  }

  stageProcessing(source: string, stageName: string): void {
    this.statusInfo(source, '  %s', stageName)
    this.infoFileOnly(source, 'Processing stage: %s', stageName)
  }

  codeModApplied(source: string, filePath: string): void {
    this.infoFileOnly(source, 'Applied code modification to: %s', filePath)
  }

  projectStart(source: string, projectName: string): void {
    this.statusInfo(source, 'Creating project: %s', projectName)
    this.infoFileOnly(source, 'Starting project scaffolding: %s', projectName)
  }

  projectComplete(source: string): void {
    this.statusInfo(source, 'Project created successfully!')
    this.infoFileOnly(source, 'Project scaffolding completed')
  }

  async close(): Promise<void> {
    if (this.logFileStream) {
      const sessionEnd = `[${new Date().toISOString()}] SESSION ENDED\n${'='.repeat(50)}\n`
      this.logFileStream.write(sessionEnd)

      return new Promise(resolve => {
        this.logFileStream!.end(() => {
          this.logFileStream = null
          resolve()
        })
      })
    }
  }
}

// Create singleton instance
let loggerInstance: Logger | null = null

export function createLogger(options?: LoggerOptions): Logger {
  if (loggerInstance) {
    return loggerInstance
  }
  loggerInstance = new Logger(options)
  return loggerInstance
}

export function getLogger(): Logger {
  if (!loggerInstance) {
    loggerInstance = new Logger()
  }
  return loggerInstance
}

// Cleanup on process exit
process.on('exit', () => {
  if (loggerInstance) {
    loggerInstance.close()
  }
})

process.on('SIGINT', async () => {
  if (loggerInstance) {
    await loggerInstance.close()
  }
  process.exit(0)
})

process.on('SIGTERM', async () => {
  if (loggerInstance) {
    await loggerInstance.close()
  }
  process.exit(0)
})
