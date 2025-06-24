/**
 * Error Handling Utilities
 * Comprehensive error management with structured logging
 */

import { ErrorCodes, HttpStatusCodes } from '../types/service.js'

// Base error class for all service errors
export class ServiceError extends Error {
  public readonly code: string
  public readonly statusCode: number
  public readonly details?: Record<string, unknown>
  public readonly timestamp: string
  public readonly isOperational: boolean

  constructor(
    code: string,
    message: string,
    statusCode: number = HttpStatusCodes.INTERNAL_SERVER_ERROR,
    details?: Record<string, unknown>,
    isOperational: boolean = true
  ) {
    super(message)
    this.name = 'ServiceError'
    this.code = code
    this.statusCode = statusCode
    this.details = details
    this.timestamp = new Date().toISOString()
    this.isOperational = isOperational

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, ServiceError)
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      details: this.details,
      timestamp: this.timestamp,
      stack: this.stack
    }
  }
}

// Authentication errors
export class AuthenticationError extends ServiceError {
  constructor(
    message: string = 'Authentication failed',
    code: string = ErrorCodes.AUTH_UNAUTHORIZED,
    details?: Record<string, unknown>
  ) {
    super(code, message, HttpStatusCodes.UNAUTHORIZED, details)
    this.name = 'AuthenticationError'
  }
}

export class AuthorizationError extends ServiceError {
  constructor(
    message: string = 'Insufficient permissions',
    code: string = ErrorCodes.AUTH_UNAUTHORIZED,
    details?: Record<string, unknown>
  ) {
    super(code, message, HttpStatusCodes.FORBIDDEN, details)
    this.name = 'AuthorizationError'
  }
}

export class InvalidCredentialsError extends ServiceError {
  constructor(
    message: string = 'Invalid email or password',
    details?: Record<string, unknown>
  ) {
    super(ErrorCodes.AUTH_INVALID_CREDENTIALS, message, HttpStatusCodes.UNAUTHORIZED, details)
    this.name = 'InvalidCredentialsError'
  }
}

export class EmailNotConfirmedError extends ServiceError {
  constructor(
    message: string = 'Email address not confirmed',
    details?: Record<string, unknown>
  ) {
    super(ErrorCodes.AUTH_EMAIL_NOT_CONFIRMED, message, HttpStatusCodes.UNAUTHORIZED, details)
    this.name = 'EmailNotConfirmedError'
  }
}

export class TokenExpiredError extends ServiceError {
  constructor(
    message: string = 'Token has expired',
    details?: Record<string, unknown>
  ) {
    super(ErrorCodes.AUTH_TOKEN_EXPIRED, message, HttpStatusCodes.UNAUTHORIZED, details)
    this.name = 'TokenExpiredError'
  }
}

// User errors
export class UserNotFoundError extends ServiceError {
  constructor(
    message: string = 'User not found',
    details?: Record<string, unknown>
  ) {
    super(ErrorCodes.USER_NOT_FOUND, message, HttpStatusCodes.NOT_FOUND, details)
    this.name = 'UserNotFoundError'
  }
}

export class UserProfileIncompleteError extends ServiceError {
  constructor(
    message: string = 'User profile is incomplete',
    details?: Record<string, unknown>
  ) {
    super(ErrorCodes.USER_PROFILE_INCOMPLETE, message, HttpStatusCodes.UNPROCESSABLE_ENTITY, details)
    this.name = 'UserProfileIncompleteError'
  }
}

// Recipe errors
export class RecipeNotFoundError extends ServiceError {
  constructor(
    message: string = 'Recipe not found',
    details?: Record<string, unknown>
  ) {
    super(ErrorCodes.RECIPE_NOT_FOUND, message, HttpStatusCodes.NOT_FOUND, details)
    this.name = 'RecipeNotFoundError'
  }
}

export class RecipePermissionError extends ServiceError {
  constructor(
    message: string = 'You do not have permission to access this recipe',
    details?: Record<string, unknown>
  ) {
    super(ErrorCodes.RECIPE_PERMISSION_DENIED, message, HttpStatusCodes.FORBIDDEN, details)
    this.name = 'RecipePermissionError'
  }
}

export class NutritionCalculationError extends ServiceError {
  constructor(
    message: string = 'Failed to calculate nutrition information',
    details?: Record<string, unknown>
  ) {
    super(ErrorCodes.RECIPE_NUTRITION_CALCULATION_ERROR, message, HttpStatusCodes.UNPROCESSABLE_ENTITY, details)
    this.name = 'NutritionCalculationError'
  }
}

// Validation errors
export class ValidationError extends ServiceError {
  constructor(
    message: string = 'Validation failed',
    details?: Record<string, unknown>
  ) {
    super(ErrorCodes.VALIDATION_ERROR, message, HttpStatusCodes.BAD_REQUEST, details)
    this.name = 'ValidationError'
  }
}

// Database errors
export class DatabaseError extends ServiceError {
  constructor(
    message: string = 'Database operation failed',
    details?: Record<string, unknown>
  ) {
    super(ErrorCodes.DATABASE_ERROR, message, HttpStatusCodes.INTERNAL_SERVER_ERROR, details)
    this.name = 'DatabaseError'
  }
}

// Network errors
export class NetworkError extends ServiceError {
  constructor(
    message: string = 'Network request failed',
    details?: Record<string, unknown>
  ) {
    super(ErrorCodes.NETWORK_ERROR, message, HttpStatusCodes.SERVICE_UNAVAILABLE, details)
    this.name = 'NetworkError'
  }
}

// Rate limiting errors
export class RateLimitError extends ServiceError {
  constructor(
    message: string = 'Rate limit exceeded',
    details?: Record<string, unknown>
  ) {
    super(ErrorCodes.RATE_LIMIT_EXCEEDED, message, HttpStatusCodes.TOO_MANY_REQUESTS, details)
    this.name = 'RateLimitError'
  }
}

// Error factory functions for common scenarios
export const createAuthError = (message?: string, details?: Record<string, unknown>) =>
  new AuthenticationError(message, ErrorCodes.AUTH_UNAUTHORIZED, details)

export const createUserNotFoundError = (userId?: string) =>
  new UserNotFoundError('User not found', { userId })

export const createRecipeNotFoundError = (recipeId?: string) =>
  new RecipeNotFoundError('Recipe not found', { recipeId })

export const createValidationError = (field: string, message: string, value?: unknown) =>
  new ValidationError(`Validation failed for field '${field}': ${message}`, { field, value })

export const createDatabaseError = (operation: string, table?: string, error?: Error) =>
  new DatabaseError(`Database ${operation} failed`, {
    operation,
    table,
    originalError: error?.message,
    stack: error?.stack
  })

// Error recovery utilities
export const withErrorRecovery = async <T>(
  operation: () => Promise<T>,
  recoveryAttempts: number = 3,
  delayMs: number = 1000
): Promise<T> => {
  let lastError: Error | undefined

  for (let attempt = 1; attempt <= recoveryAttempts; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error as Error
      
      // Don't retry on certain error types
      if (error instanceof ValidationError || 
          error instanceof AuthenticationError ||
          error instanceof AuthorizationError) {
        throw error
      }

      if (attempt === recoveryAttempts) {
        break
      }

      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delayMs * Math.pow(2, attempt - 1)))
    }
  }

  throw new ServiceError(
    ErrorCodes.INTERNAL_SERVER_ERROR,
    `Operation failed after ${recoveryAttempts} attempts`,
    HttpStatusCodes.INTERNAL_SERVER_ERROR,
    { attempts: recoveryAttempts, lastError: lastError?.message }
  )
}

// Error sanitization for production
export const sanitizeError = (error: Error, isProd: boolean = false): ServiceError => {
  if (error instanceof ServiceError) {
    if (isProd && error.statusCode >= 500) {
      // Don't expose internal server errors in production
      return new ServiceError(
        ErrorCodes.INTERNAL_SERVER_ERROR,
        'An internal error occurred',
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
        undefined,
        error.isOperational
      )
    }
    return error
  }

  // Convert unknown errors to ServiceError
  if (isProd) {
    return new ServiceError(
      ErrorCodes.INTERNAL_SERVER_ERROR,
      'An unexpected error occurred',
      HttpStatusCodes.INTERNAL_SERVER_ERROR,
      undefined,
      false // Unknown errors are not operational
    )
  }

  return new ServiceError(
    ErrorCodes.INTERNAL_SERVER_ERROR,
    error.message,
    HttpStatusCodes.INTERNAL_SERVER_ERROR,
    { originalError: error.name, stack: error.stack },
    false
  )
}

// Error context builder
export class ErrorContext {
  private context: Record<string, unknown> = {}

  add(key: string, value: unknown): ErrorContext {
    this.context[key] = value
    return this
  }

  addUser(userId: string): ErrorContext {
    return this.add('userId', userId)
  }

  addRequest(requestId: string, method: string, path: string): ErrorContext {
    return this.add('requestId', requestId)
           .add('method', method)
           .add('path', path)
  }

  addOperation(operation: string, table?: string): ErrorContext {
    this.add('operation', operation)
    if (table) this.add('table', table)
    return this
  }

  build(): Record<string, unknown> {
    return { ...this.context }
  }
}

// Error aggregation for batch operations
export class ErrorCollection {
  private errors: ServiceError[] = []

  add(error: ServiceError): void {
    this.errors.push(error)
  }

  addValidation(field: string, message: string, value?: unknown): void {
    this.add(createValidationError(field, message, value))
  }

  hasErrors(): boolean {
    return this.errors.length > 0
  }

  getErrors(): ServiceError[] {
    return [...this.errors]
  }

  getErrorCount(): number {
    return this.errors.length
  }

  throwIfErrors(): void {
    if (this.hasErrors()) {
      throw new ValidationError(
        `Multiple validation errors occurred`,
        { errors: this.errors.map(e => e.toJSON()), count: this.errors.length }
      )
    }
  }

  clear(): void {
    this.errors = []
  }
}

// Type guards
export const isServiceError = (error: unknown): error is ServiceError =>
  error instanceof ServiceError

export const isOperationalError = (error: Error): boolean =>
  error instanceof ServiceError && error.isOperational

export const isAuthError = (error: unknown): error is AuthenticationError | AuthorizationError =>
  error instanceof AuthenticationError || error instanceof AuthorizationError

export const isValidationError = (error: unknown): error is ValidationError =>
  error instanceof ValidationError

export const isDatabaseError = (error: unknown): error is DatabaseError =>
  error instanceof DatabaseError

// Error metrics helper
export const getErrorMetrics = (error: ServiceError) => ({
  code: error.code,
  statusCode: error.statusCode,
  category: error.name,
  isOperational: error.isOperational,
  timestamp: error.timestamp
})