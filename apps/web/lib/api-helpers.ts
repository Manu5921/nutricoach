/**
 * API Helper Functions for Next.js 15 App Router
 * Based on Context7 research for TypeScript API patterns
 */

import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { 
  formatApiError, 
  getStatusCodeFromError,
  sanitizeErrorMessage,
  logApiRequest,
  createLogger,
  type ApiResponse,
  type ServiceError,
} from '@nutricoach/core-nutrition'
import { createServerSupabaseClient, getCurrentUser } from './supabase'

const logger = createLogger('api-helpers')

/**
 * Create a standardized API response
 */
export function createApiResponse<T>(
  data?: T,
  options: {
    status?: number
    message?: string
    meta?: Record<string, unknown>
  } = {}
): NextResponse<ApiResponse<T>> {
  const { status = 200, message, meta } = options

  const response: ApiResponse<T> = {
    success: status < 400,
    ...(data !== undefined && { data }),
    ...(message && { 
      error: { 
        message,
        code: status >= 400 ? 'API_ERROR' : undefined 
      } 
    }),
    meta: {
      timestamp: new Date().toISOString(),
      ...meta,
    },
  }

  return NextResponse.json(response, { status })
}

/**
 * Create an error response
 */
export function createErrorResponse(
  error: unknown,
  options: {
    defaultMessage?: string
    includeDetails?: boolean
  } = {}
): NextResponse<ApiResponse<never>> {
  const { defaultMessage = 'An error occurred', includeDetails = false } = options
  
  const apiError = formatApiError(error)
  const statusCode = getStatusCodeFromError(error)
  
  const sanitizedMessage = sanitizeErrorMessage(
    error, 
    process.env.NODE_ENV === 'production'
  )

  const response: ApiResponse<never> = {
    success: false,
    error: {
      message: sanitizedMessage,
      code: apiError.code,
      ...(includeDetails && { details: apiError.details }),
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  }

  return NextResponse.json(response, { status: statusCode })
}

/**
 * API route wrapper with error handling and logging
 */
export function withApiHandler<T = unknown>(
  handler: (
    request: NextRequest,
    context: { params?: Record<string, string> }
  ) => Promise<NextResponse<ApiResponse<T>>>
) {
  return async (
    request: NextRequest,
    context: { params?: Record<string, string> } = {}
  ): Promise<NextResponse<ApiResponse<T>>> => {
    const start = Date.now()
    const method = request.method
    const url = new URL(request.url)
    const path = url.pathname
    
    try {
      logger.debug(`${method} ${path} - Started`)
      
      const response = await handler(request, context)
      const duration = Date.now() - start
      const status = response.status
      
      logApiRequest(method, path, status, duration)
      
      return response
    } catch (error) {
      const duration = Date.now() - start
      const errorResponse = createErrorResponse(error)
      
      logApiRequest(method, path, errorResponse.status, duration)
      logger.error(`API Error: ${method} ${path}`, error)
      
      return errorResponse
    }
  }
}

/**
 * Validate request body with Zod schema
 */
export async function validateRequestBody<T>(
  request: NextRequest,
  schema: { parse: (data: unknown) => T }
): Promise<T> {
  try {
    const body = await request.json()
    return schema.parse(body)
  } catch (error) {
    if (error instanceof ZodError) {
      const validationErrors = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code,
      }))
      
      throw new Error(`Validation failed: ${validationErrors.map(e => e.message).join(', ')}`)
    }
    
    if (error instanceof SyntaxError) {
      throw new Error('Invalid JSON in request body')
    }
    
    throw error
  }
}

/**
 * Validate query parameters with Zod schema
 */
export function validateQueryParams<T>(
  request: NextRequest,
  schema: { parse: (data: unknown) => T }
): T {
  try {
    const url = new URL(request.url)
    const params = Object.fromEntries(url.searchParams.entries())
    
    // Convert string values to appropriate types
    const processedParams = Object.entries(params).reduce((acc, [key, value]) => {
      // Try to parse numbers
      if (!isNaN(Number(value)) && value !== '') {
        acc[key] = Number(value)
      }
      // Try to parse booleans
      else if (value === 'true' || value === 'false') {
        acc[key] = value === 'true'
      }
      // Keep as string
      else {
        acc[key] = value
      }
      return acc
    }, {} as Record<string, unknown>)
    
    return schema.parse(processedParams)
  } catch (error) {
    if (error instanceof ZodError) {
      const validationErrors = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code,
      }))
      
      throw new Error(`Invalid query parameters: ${validationErrors.map(e => e.message).join(', ')}`)
    }
    
    throw error
  }
}

/**
 * Authentication middleware for API routes
 */
export async function requireAuth(request: NextRequest): Promise<{
  user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>
}> {
  const supabase = await createServerSupabaseClient()
  const user = await getCurrentUser()
  
  if (!user) {
    throw new Error('Authentication required')
  }
  
  return { user, supabase }
}

/**
 * Extract pagination parameters from request
 */
export function extractPaginationParams(request: NextRequest): {
  page: number
  limit: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
} {
  const url = new URL(request.url)
  const searchParams = url.searchParams
  
  return {
    page: Math.max(1, parseInt(searchParams.get('page') || '1', 10)),
    limit: Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10))),
    sortBy: searchParams.get('sortBy') || undefined,
    sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || undefined,
  }
}

/**
 * Handle CORS for API routes
 */
export function withCors(response: NextResponse): NextResponse {
  // Set CORS headers
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  return response
}

/**
 * Handle OPTIONS request for CORS preflight
 */
export function handleOptions(): NextResponse {
  return withCors(new NextResponse(null, { status: 200 }))
}

/**
 * Service response to API response converter
 */
export function serviceToApiResponse<T>(
  serviceResponse: { data: T | null; error: ServiceError | null }
): NextResponse<ApiResponse<T>> {
  if (serviceResponse.error) {
    return createErrorResponse(serviceResponse.error)
  }
  
  if (serviceResponse.data === null) {
    return createErrorResponse(new Error('Not found'), {
      defaultMessage: 'Resource not found'
    })
  }
  
  return createApiResponse(serviceResponse.data)
}

/**
 * Parse route parameters
 */
export function parseRouteParams(
  params: Record<string, string> | undefined,
  required: string[] = []
): Record<string, string> {
  if (!params) {
    throw new Error('Missing route parameters')
  }
  
  for (const param of required) {
    if (!params[param]) {
      throw new Error(`Missing required parameter: ${param}`)
    }
  }
  
  return params
}