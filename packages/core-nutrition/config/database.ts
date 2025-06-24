/**
 * Database Configuration for Supabase
 * Based on Context7 research for TypeScript Supabase integration
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import type { Database, DatabaseConfig } from '../types'

// Environment configuration
export const getDatabaseConfig = (): DatabaseConfig => {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !anonKey) {
    throw new Error(
      'Missing required Supabase environment variables. Please check SUPABASE_URL and SUPABASE_ANON_KEY are set.'
    )
  }

  return {
    url,
    anonKey,
    serviceRoleKey,
  }
}

// Client-side Supabase client (for browser usage)
export const createBrowserClient = (): SupabaseClient<Database> => {
  const config = getDatabaseConfig()
  
  return createClient<Database>(config.url, config.anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    db: {
      schema: 'public',
    },
    global: {
      headers: {
        'X-Client-Info': 'nutricoach-web',
      },
    },
  })
}

// Server-side Supabase client (for API routes and server components)
export const createServerSupabaseClient = (
  cookieStore?: {
    getAll: () => Array<{ name: string; value: string }>
    setAll: (cookies: Array<{ name: string; value: string; options?: CookieOptions }>) => void
  }
): SupabaseClient<Database> => {
  const config = getDatabaseConfig()

  if (cookieStore) {
    // For server-side rendering with cookie management
    return createServerClient<Database>(config.url, config.anonKey, {
      cookies: cookieStore,
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    })
  }

  // For server-side without cookie management (e.g., background jobs)
  return createClient<Database>(config.url, config.anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })
}

// Admin Supabase client (for administrative operations)
export const createAdminClient = (): SupabaseClient<Database> => {
  const config = getDatabaseConfig()
  
  if (!config.serviceRoleKey) {
    throw new Error(
      'Missing SUPABASE_SERVICE_ROLE_KEY environment variable. This is required for admin operations.'
    )
  }

  return createClient<Database>(config.url, config.serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    db: {
      schema: 'public',
    },
    global: {
      headers: {
        'X-Client-Info': 'nutricoach-admin',
      },
    },
  })
}

// Connection health check
export const checkDatabaseConnection = async (client: SupabaseClient<Database>): Promise<boolean> => {
  try {
    const { error } = await client.from('users').select('id').limit(1)
    return !error
  } catch {
    return false
  }
}

// Database utility functions
export const withTransaction = async <T>(
  client: SupabaseClient<Database>,
  callback: (tx: SupabaseClient<Database>) => Promise<T>
): Promise<T> => {
  // Note: Supabase doesn't have explicit transaction support in the client
  // This is a wrapper for future enhancement or when using direct SQL
  return callback(client)
}

// Query helpers
export const buildSelectQuery = (
  fields: string[],
  options?: {
    count?: boolean
    single?: boolean
  }
): string => {
  let query = fields.join(', ')
  
  if (options?.count) {
    query += ', count(*)'
  }
  
  return query
}

export const buildPaginationQuery = (page: number, limit: number) => {
  const from = (page - 1) * limit
  const to = from + limit - 1
  return { from, to }
}

// Error handling for database operations
export class DatabaseError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'DatabaseError'
  }
}

export const handleDatabaseError = (error: any): DatabaseError => {
  if (error?.code) {
    switch (error.code) {
      case '23505':
        return new DatabaseError('Duplicate entry', 'DUPLICATE_KEY', error)
      case '23503':
        return new DatabaseError('Foreign key constraint violation', 'FOREIGN_KEY_VIOLATION', error)
      case '42P01':
        return new DatabaseError('Table does not exist', 'TABLE_NOT_FOUND', error)
      case 'PGRST116':
        return new DatabaseError('Row not found', 'NOT_FOUND', error)
      default:
        return new DatabaseError(error.message || 'Database operation failed', error.code, error)
    }
  }
  
  return new DatabaseError('Unknown database error', 'UNKNOWN', { originalError: error })
}

// Connection pooling configuration (for future enhancement)
export const connectionConfig = {
  maxConnections: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  maxLifetimeSeconds: 3600,
}

// Database monitoring helpers
export const logSlowQuery = (query: string, duration: number, threshold: number = 1000) => {
  if (duration > threshold) {
    console.warn(`Slow query detected (${duration}ms):`, query)
  }
}

export const measureQueryTime = async <T>(
  operation: () => Promise<T>,
  queryName?: string
): Promise<T> => {
  const start = Date.now()
  try {
    const result = await operation()
    const duration = Date.now() - start
    
    if (queryName) {
      logSlowQuery(queryName, duration)
    }
    
    return result
  } catch (error) {
    const duration = Date.now() - start
    console.error(`Query failed after ${duration}ms:`, error)
    throw error
  }
}