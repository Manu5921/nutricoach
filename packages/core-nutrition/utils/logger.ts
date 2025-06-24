/**
 * Structured Logging Utilities
 * Comprehensive logging system with multiple levels and contexts
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4
}

export interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: LogContext
  metadata?: Record<string, unknown>
  error?: {
    name: string
    message: string
    stack?: string
    code?: string
  }
}

export interface LogContext {
  requestId?: string
  userId?: string
  operation?: string
  service?: string
  module?: string
  environment?: string
  version?: string
}

export interface LoggerConfig {
  level: LogLevel
  enableConsole: boolean
  enableFile: boolean
  enableStructured: boolean
  context?: Partial<LogContext>
  formatters?: {
    console?: (entry: LogEntry) => string
    structured?: (entry: LogEntry) => string
  }
}

// Default logger configuration
const defaultConfig: LoggerConfig = {
  level: process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG,
  enableConsole: true,
  enableFile: false,
  enableStructured: process.env.NODE_ENV === 'production',
  context: {
    service: 'nutricoach-core',
    environment: process.env.NODE_ENV || 'development',
    version: process.env.APP_VERSION || '1.0.0'
  }
}

// Logger class
export class Logger {
  private config: LoggerConfig
  private context: LogContext

  constructor(config: Partial<LoggerConfig> = {}, context: Partial<LogContext> = {}) {
    this.config = { ...defaultConfig, ...config }
    this.context = { ...this.config.context, ...context }
  }

  // Create child logger with additional context
  child(context: Partial<LogContext>): Logger {
    return new Logger(this.config, { ...this.context, ...context })
  }

  // Update logger context
  setContext(context: Partial<LogContext>): void {
    this.context = { ...this.context, ...context }
  }

  // Core logging method
  private log(level: LogLevel, message: string, metadata?: Record<string, unknown>, error?: Error): void {
    if (level < this.config.level) {
      return
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: this.context,
      metadata,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: 'code' in error ? String(error.code) : undefined
      } : undefined
    }

    this.output(entry)
  }

  // Output methods
  private output(entry: LogEntry): void {
    if (this.config.enableConsole) {
      this.outputConsole(entry)
    }

    if (this.config.enableFile) {
      this.outputFile(entry)
    }

    // Could add other outputs here (external logging services, etc.)
  }

  private outputConsole(entry: LogEntry): void {
    const formatter = this.config.formatters?.console || this.defaultConsoleFormatter
    const formatted = formatter(entry)

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(formatted)
        break
      case LogLevel.INFO:
        console.info(formatted)
        break
      case LogLevel.WARN:
        console.warn(formatted)
        break
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(formatted)
        break
    }
  }

  private outputFile(entry: LogEntry): void {
    // In a real implementation, this would write to a file
    // For now, we'll just use structured format to stderr
    const formatter = this.config.formatters?.structured || this.defaultStructuredFormatter
    const formatted = formatter(entry)
    process.stderr.write(formatted + '\n')
  }

  // Default formatters
  private defaultConsoleFormatter = (entry: LogEntry): string => {
    const levelName = LogLevel[entry.level]
    const timestamp = new Date(entry.timestamp).toLocaleTimeString()
    
    let formatted = `[${timestamp}] ${levelName}: ${entry.message}`

    if (entry.context?.requestId) {
      formatted += ` (req: ${entry.context.requestId})`
    }

    if (entry.context?.userId) {
      formatted += ` (user: ${entry.context.userId})`
    }

    if (entry.context?.operation) {
      formatted += ` (op: ${entry.context.operation})`
    }

    if (entry.metadata) {
      formatted += ` ${JSON.stringify(entry.metadata)}`
    }

    if (entry.error) {
      formatted += `\nError: ${entry.error.name}: ${entry.error.message}`
      if (entry.error.stack && entry.level >= LogLevel.ERROR) {
        formatted += `\n${entry.error.stack}`
      }
    }

    return formatted
  }

  private defaultStructuredFormatter = (entry: LogEntry): string => {
    return JSON.stringify(entry)
  }

  // Public logging methods
  debug(message: string, metadata?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, message, metadata)
  }

  info(message: string, metadata?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, message, metadata)
  }

  warn(message: string, metadata?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, message, metadata)
  }

  error(message: string, error?: Error, metadata?: Record<string, unknown>): void {
    this.log(LogLevel.ERROR, message, metadata, error)
  }

  fatal(message: string, error?: Error, metadata?: Record<string, unknown>): void {
    this.log(LogLevel.FATAL, message, metadata, error)
  }

  // Convenience methods for common scenarios
  request(method: string, path: string, statusCode?: number, duration?: number): void {
    this.info('HTTP Request', {
      method,
      path,
      statusCode,
      duration: duration ? `${duration}ms` : undefined
    })
  }

  database(operation: string, table: string, duration?: number, rowCount?: number): void {
    this.debug('Database Operation', {
      operation,
      table,
      duration: duration ? `${duration}ms` : undefined,
      rowCount
    })
  }

  auth(event: string, userId?: string, success: boolean = true): void {
    this.info('Authentication Event', {
      event,
      userId,
      success
    })
  }

  validation(field: string, error: string, value?: unknown): void {
    this.warn('Validation Error', {
      field,
      error,
      value: typeof value === 'object' ? '[Object]' : value
    })
  }

  performance(operation: string, duration: number, metadata?: Record<string, unknown>): void {
    const level = duration > 1000 ? LogLevel.WARN : LogLevel.DEBUG
    this.log(level, `Performance: ${operation} took ${duration}ms`, metadata)
  }

  security(event: string, severity: 'low' | 'medium' | 'high' | 'critical', metadata?: Record<string, unknown>): void {
    const level = severity === 'critical' ? LogLevel.FATAL : 
                 severity === 'high' ? LogLevel.ERROR :
                 severity === 'medium' ? LogLevel.WARN : LogLevel.INFO

    this.log(level, `Security Event: ${event}`, { severity, ...metadata })
  }

  // Timing utilities
  time(label: string): () => void {
    const start = Date.now()
    return () => {
      const duration = Date.now() - start
      this.performance(label, duration)
    }
  }

  async timeAsync<T>(label: string, operation: () => Promise<T>): Promise<T> {
    const start = Date.now()
    try {
      const result = await operation()
      const duration = Date.now() - start
      this.performance(label, duration)
      return result
    } catch (error) {
      const duration = Date.now() - start
      this.performance(label, duration, { error: true })
      throw error
    }
  }
}

// Create default logger instance
export const logger = new Logger()

// Factory functions for common logger types
export const createRequestLogger = (requestId: string, userId?: string): Logger =>
  logger.child({ requestId, userId, module: 'request' })

export const createServiceLogger = (service: string, operation?: string): Logger =>
  logger.child({ service, operation, module: 'service' })

export const createDatabaseLogger = (table?: string): Logger =>
  logger.child({ module: 'database', operation: table })

export const createAuthLogger = (): Logger =>
  logger.child({ module: 'auth' })

// Middleware helper for request logging
export const loggerMiddleware = () => {
  return (req: any, res: any, next: any) => {
    const requestId = crypto.randomUUID()
    const requestLogger = createRequestLogger(requestId, req.user?.id)
    
    req.logger = requestLogger
    req.requestId = requestId

    const start = Date.now()
    
    requestLogger.info('Request Started', {
      method: req.method,
      path: req.path,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    })

    // Override res.end to log completion
    const originalEnd = res.end
    res.end = function(...args: any[]) {
      const duration = Date.now() - start
      requestLogger.request(req.method, req.path, res.statusCode, duration)
      
      if (res.statusCode >= 400) {
        requestLogger.warn('Request Failed', {
          statusCode: res.statusCode,
          duration
        })
      }

      originalEnd.apply(this, args)
    }

    next()
  }
}

// Performance monitoring utilities
export class PerformanceMonitor {
  private static measurements = new Map<string, number>()

  static start(label: string): void {
    this.measurements.set(label, Date.now())
  }

  static end(label: string, metadata?: Record<string, unknown>): number {
    const start = this.measurements.get(label)
    if (!start) {
      logger.warn('Performance measurement not found', { label })
      return 0
    }

    const duration = Date.now() - start
    this.measurements.delete(label)

    logger.performance(label, duration, metadata)
    return duration
  }

  static measure<T>(label: string, operation: () => T): T {
    this.start(label)
    try {
      const result = operation()
      this.end(label)
      return result
    } catch (error) {
      this.end(label, { error: true })
      throw error
    }
  }

  static async measureAsync<T>(label: string, operation: () => Promise<T>): Promise<T> {
    this.start(label)
    try {
      const result = await operation()
      this.end(label)
      return result
    } catch (error) {
      this.end(label, { error: true })
      throw error
    }
  }
}

// Log correlation utilities
export class LogCorrelation {
  private static correlationMap = new Map<string, string>()

  static setCorrelationId(requestId: string, correlationId: string): void {
    this.correlationMap.set(requestId, correlationId)
  }

  static getCorrelationId(requestId: string): string | undefined {
    return this.correlationMap.get(requestId)
  }

  static createCorrelatedLogger(requestId: string): Logger {
    const correlationId = this.getCorrelationId(requestId) || requestId
    return logger.child({ requestId, correlationId })
  }

  static cleanup(requestId: string): void {
    this.correlationMap.delete(requestId)
  }
}

// Export commonly used items
export { LogLevel } from './logger.js'
export type { LogEntry, LogContext, LoggerConfig } from './logger.js'