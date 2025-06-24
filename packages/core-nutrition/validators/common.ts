/**
 * Common Validation Schemas and Utilities
 * Reusable validation patterns and helpers
 */

import { z } from 'zod'

// Pagination schemas
export const PaginationSchema = z.object({
  page: z
    .number()
    .int({ message: 'Page must be a whole number' })
    .min(1, { message: 'Page must be at least 1' })
    .max(1000, { message: 'Page cannot exceed 1000' })
    .default(1),
  limit: z
    .number()
    .int({ message: 'Limit must be a whole number' })
    .min(1, { message: 'Limit must be at least 1' })
    .max(100, { message: 'Limit cannot exceed 100' })
    .default(20),
  offset: z
    .number()
    .int({ message: 'Offset must be a whole number' })
    .min(0, { message: 'Offset cannot be negative' })
    .optional()
})

// API query parameter schemas
export const ApiPaginationQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().min(1).max(1000)).default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().min(1).max(100)).default('20'),
  offset: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().min(0)).optional()
})

export const ApiSearchQuerySchema = z.object({
  q: z.string().max(100).trim().optional(),
  search: z.string().max(100).trim().optional(),
  query: z.string().max(100).trim().optional()
})

export const ApiSortQuerySchema = z.object({
  sortBy: z.string().max(50).optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  orderBy: z.string().max(50).optional()
})

// UUID validation
export const UuidSchema = z.string().uuid({ message: 'Invalid UUID format' })

// Common string patterns
export const SlugSchema = z
  .string()
  .min(1, { message: 'Slug is required' })
  .max(100, { message: 'Slug must be less than 100 characters' })
  .regex(/^[a-z0-9-]+$/, { message: 'Slug can only contain lowercase letters, numbers, and hyphens' })

export const ColorHexSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, { message: 'Invalid hex color format' })

export const EmailSchema = z
  .string()
  .email({ message: 'Please enter a valid email address' })
  .min(1, { message: 'Email is required' })
  .max(255, { message: 'Email must be less than 255 characters' })
  .toLowerCase()
  .trim()

// Date and time schemas
export const DateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Date must be in YYYY-MM-DD format' })
  .refine(dateStr => {
    const date = new Date(dateStr)
    return !isNaN(date.getTime())
  }, { message: 'Invalid date' })

export const DateTimeStringSchema = z
  .string()
  .datetime({ message: 'Invalid datetime format' })

export const TimeStringSchema = z
  .string()
  .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'Time must be in HH:MM format' })

// File upload schemas
export const FileTypeSchema = z.enum([
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'application/pdf', 'text/csv', 'application/json'
], {
  errorMap: () => ({ message: 'Unsupported file type' })
})

export const FileSizeSchema = z
  .number()
  .min(1, { message: 'File size must be greater than 0' })
  .max(10 * 1024 * 1024, { message: 'File size cannot exceed 10MB' }) // 10MB

export const FileUploadSchema = z.object({
  name: z.string().min(1).max(255),
  type: FileTypeSchema,
  size: FileSizeSchema,
  data: z.string().optional(), // Base64 data
  url: z.string().url().optional()
})

// Validation error formatting
export const formatZodError = (error: z.ZodError): Array<{
  field: string
  message: string
  code: string
}> => {
  return error.issues.map(issue => ({
    field: issue.path.join('.') || 'root',
    message: issue.message,
    code: issue.code
  }))
}

// Create validation result helper
export const createValidationResult = <T>(
  result: z.SafeParseReturnType<unknown, T>
): {
  success: boolean
  data?: T
  errors?: Array<{ field: string; message: string; code: string }>
} => {
  if (result.success) {
    return {
      success: true,
      data: result.data
    }
  }

  return {
    success: false,
    errors: formatZodError(result.error)
  }
}

// Generic API validation middleware helper
export const validateRequestBody = <T>(
  schema: z.ZodSchema<T>,
  body: unknown
): { success: true; data: T } | { success: false; errors: Array<{ field: string; message: string; code: string }> } => {
  const result = schema.safeParse(body)
  return createValidationResult(result)
}

// Sanitization helpers
export const sanitizeString = (str: string): string => {
  return str
    .trim()
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/[<>]/g, '') // Remove potential HTML tags
}

export const sanitizeHtml = (html: string): string => {
  // Basic HTML sanitization - in production, use a proper library like DOMPurify
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '') // Remove event handlers
    .trim()
}

// Environment-aware validation
export const EnvironmentSchema = z.enum(['development', 'staging', 'production'], {
  errorMap: () => ({ message: 'Invalid environment' })
})

// Feature flag schema
export const FeatureFlagSchema = z.object({
  name: z.string().min(1).max(50),
  enabled: z.boolean(),
  conditions: z.object({
    userIds: z.array(UuidSchema).optional(),
    percentage: z.number().min(0).max(100).optional(),
    environment: EnvironmentSchema.optional()
  }).optional()
})

// Configuration validation
export const ConfigSchema = z.object({
  environment: EnvironmentSchema,
  features: z.object({
    enableCaching: z.boolean().default(true),
    enableRateLimiting: z.boolean().default(true),
    enableMetrics: z.boolean().default(true),
    enableDebugLogging: z.boolean().default(false)
  }),
  limits: z.object({
    maxRequestsPerMinute: z.number().min(1).max(10000).default(100),
    maxFileUploadSize: z.number().min(1).max(100 * 1024 * 1024).default(10 * 1024 * 1024), // 10MB
    maxQueryResults: z.number().min(1).max(1000).default(100)
  })
})

// Health check schema
export const HealthCheckSchema = z.object({
  status: z.enum(['healthy', 'unhealthy', 'degraded']),
  timestamp: DateTimeStringSchema,
  version: z.string().min(1),
  uptime: z.number().min(0),
  services: z.record(z.object({
    status: z.enum(['up', 'down']),
    responseTime: z.number().min(0).optional(),
    lastChecked: DateTimeStringSchema.optional(),
    error: z.string().optional()
  })),
  environment: EnvironmentSchema
})

// Rate limiting schemas
export const RateLimitSchema = z.object({
  windowMs: z.number().min(1000), // At least 1 second
  maxRequests: z.number().min(1),
  skipSuccessfulRequests: z.boolean().default(false),
  skipFailedRequests: z.boolean().default(false)
})

// Notification schemas
export const NotificationTypeSchema = z.enum([
  'info', 'success', 'warning', 'error'
], {
  errorMap: () => ({ message: 'Invalid notification type' })
})

export const NotificationSchema = z.object({
  id: UuidSchema,
  type: NotificationTypeSchema,
  title: z.string().min(1).max(100),
  message: z.string().min(1).max(500),
  createdAt: DateTimeStringSchema,
  readAt: DateTimeStringSchema.optional(),
  expiresAt: DateTimeStringSchema.optional(),
  metadata: z.record(z.unknown()).optional()
})

// Type exports
export type Pagination = z.infer<typeof PaginationSchema>
export type ApiPaginationQuery = z.infer<typeof ApiPaginationQuerySchema>
export type ApiSearchQuery = z.infer<typeof ApiSearchQuerySchema>
export type ApiSortQuery = z.infer<typeof ApiSortQuerySchema>
export type FileUpload = z.infer<typeof FileUploadSchema>
export type FeatureFlag = z.infer<typeof FeatureFlagSchema>
export type Config = z.infer<typeof ConfigSchema>
export type HealthCheck = z.infer<typeof HealthCheckSchema>
export type RateLimit = z.infer<typeof RateLimitSchema>
export type Notification = z.infer<typeof NotificationSchema>
export type NotificationType = z.infer<typeof NotificationTypeSchema>
export type Environment = z.infer<typeof EnvironmentSchema>

// Validation helpers
export const validatePagination = (data: unknown) => PaginationSchema.safeParse(data)
export const validateApiPaginationQuery = (data: unknown) => ApiPaginationQuerySchema.safeParse(data)
export const validateApiSearchQuery = (data: unknown) => ApiSearchQuerySchema.safeParse(data)
export const validateApiSortQuery = (data: unknown) => ApiSortQuerySchema.safeParse(data)
export const validateFileUpload = (data: unknown) => FileUploadSchema.safeParse(data)
export const validateFeatureFlag = (data: unknown) => FeatureFlagSchema.safeParse(data)
export const validateConfig = (data: unknown) => ConfigSchema.safeParse(data)
export const validateHealthCheck = (data: unknown) => HealthCheckSchema.safeParse(data)
export const validateRateLimit = (data: unknown) => RateLimitSchema.safeParse(data)
export const validateNotification = (data: unknown) => NotificationSchema.safeParse(data)