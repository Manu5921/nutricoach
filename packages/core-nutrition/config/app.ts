/**
 * Application Configuration
 * Centralized configuration management with environment detection
 */

import { z } from 'zod'

// Configuration schema validation
const ConfigSchema = z.object({
  // Environment
  environment: z.enum(['development', 'staging', 'production']).default('development'),
  
  // Application
  app: z.object({
    name: z.string().default('NutriCoach Core'),
    version: z.string().default('1.0.0'),
    port: z.number().int().min(1).max(65535).default(3000),
    host: z.string().default('localhost'),
    baseUrl: z.string().url().optional(),
  }),

  // Database
  database: z.object({
    url: z.string().min(1),
    poolSize: z.number().int().min(1).max(50).default(10),
    connectionTimeout: z.number().int().min(1000).default(30000),
    queryTimeout: z.number().int().min(1000).default(60000),
    enableLogging: z.boolean().default(false),
  }),

  // Authentication
  auth: z.object({
    sessionTimeout: z.number().int().min(300).default(3600), // 1 hour
    refreshTokenTimeout: z.number().int().min(3600).default(604800), // 7 days
    passwordMinLength: z.number().int().min(6).max(128).default(8),
    maxLoginAttempts: z.number().int().min(1).max(10).default(5),
    lockoutDuration: z.number().int().min(60).default(900), // 15 minutes
    enableTwoFactor: z.boolean().default(false),
    enableOAuth: z.boolean().default(true),
    oauthProviders: z.array(z.enum(['google', 'facebook', 'apple', 'github'])).default(['google']),
  }),

  // Features
  features: z.object({
    enableCaching: z.boolean().default(true),
    enableRateLimiting: z.boolean().default(true),
    enableMetrics: z.boolean().default(true),
    enableFileUploads: z.boolean().default(true),
    enableNotifications: z.boolean().default(true),
    enableRecipeSharing: z.boolean().default(true),
    enableSocialFeatures: z.boolean().default(false),
    enableAdvancedNutrition: z.boolean().default(true),
    enableMealPlanning: z.boolean().default(false),
  }),

  // Rate Limiting
  rateLimit: z.object({
    windowMs: z.number().int().min(1000).default(900000), // 15 minutes
    maxRequests: z.number().int().min(1).default(100),
    maxRequestsPerUser: z.number().int().min(1).default(1000),
    skipSuccessfulRequests: z.boolean().default(false),
    skipFailedRequests: z.boolean().default(false),
  }),

  // Caching
  cache: z.object({
    provider: z.enum(['memory', 'redis']).default('memory'),
    ttl: z.number().int().min(60).default(3600), // 1 hour
    maxSize: z.number().int().min(100).default(10000),
    enableCompression: z.boolean().default(true),
  }),

  // File Storage
  storage: z.object({
    provider: z.enum(['local', 'supabase', 'aws-s3', 'cloudinary']).default('supabase'),
    maxFileSize: z.number().int().min(1024).default(10485760), // 10MB
    allowedTypes: z.array(z.string()).default(['image/jpeg', 'image/png', 'image/webp']),
    uploadPath: z.string().default('/uploads'),
  }),

  // Logging
  logging: z.object({
    level: z.enum(['debug', 'info', 'warn', 'error', 'fatal']).default('info'),
    enableConsole: z.boolean().default(true),
    enableFile: z.boolean().default(false),
    enableStructured: z.boolean().default(false),
    filePath: z.string().default('./logs/app.log'),
    maxFileSize: z.number().int().min(1024).default(10485760), // 10MB
    maxFiles: z.number().int().min(1).default(5),
  }),

  // Security
  security: z.object({
    enableHttps: z.boolean().default(false),
    enableCors: z.boolean().default(true),
    corsOrigins: z.array(z.string()).default(['http://localhost:3000']),
    enableHelmet: z.boolean().default(true),
    enableCSRF: z.boolean().default(true),
    csrfSecret: z.string().optional(),
    jwtSecret: z.string().min(32).optional(),
    encryptionKey: z.string().min(32).optional(),
  }),

  // External Services
  services: z.object({
    nutrition: z.object({
      provider: z.enum(['internal', 'edamam', 'spoonacular']).default('internal'),
      apiKey: z.string().optional(),
      rateLimit: z.number().int().min(1).default(100),
      timeout: z.number().int().min(1000).default(5000),
    }),
    email: z.object({
      provider: z.enum(['none', 'sendgrid', 'resend', 'ses']).default('none'),
      apiKey: z.string().optional(),
      fromEmail: z.string().email().optional(),
      fromName: z.string().optional(),
    }),
    analytics: z.object({
      provider: z.enum(['none', 'google', 'mixpanel', 'amplitude']).default('none'),
      apiKey: z.string().optional(),
      enableTracking: z.boolean().default(false),
    }),
  }),

  // Performance
  performance: z.object({
    enableCompression: z.boolean().default(true),
    enableEtag: z.boolean().default(true),
    maxRequestSize: z.number().int().min(1024).default(1048576), // 1MB
    requestTimeout: z.number().int().min(1000).default(30000),
    enableKeepAlive: z.boolean().default(true),
  }),

  // Development
  development: z.object({
    enableDevTools: z.boolean().default(false),
    enableHotReload: z.boolean().default(false),
    enableDebugMode: z.boolean().default(false),
    enableMockData: z.boolean().default(false),
    seedDatabase: z.boolean().default(false),
  }),
})

export type AppConfig = z.infer<typeof ConfigSchema>

// Environment variable mapping
const getEnvVar = (key: string, defaultValue?: string): string | undefined => {
  return process.env[key] || defaultValue
}

const getEnvVarAsNumber = (key: string, defaultValue?: number): number | undefined => {
  const value = getEnvVar(key)
  if (value === undefined) return defaultValue
  const parsed = parseInt(value, 10)
  return isNaN(parsed) ? defaultValue : parsed
}

const getEnvVarAsBoolean = (key: string, defaultValue?: boolean): boolean => {
  const value = getEnvVar(key)
  if (value === undefined) return defaultValue ?? false
  return value.toLowerCase() === 'true' || value === '1'
}

const getEnvVarAsArray = (key: string, defaultValue: string[] = []): string[] => {
  const value = getEnvVar(key)
  if (!value) return defaultValue
  return value.split(',').map(item => item.trim()).filter(Boolean)
}

// Load configuration from environment variables
export const loadConfig = (): AppConfig => {
  const env = getEnvVar('NODE_ENV', 'development') as 'development' | 'staging' | 'production'
  const isProduction = env === 'production'
  const isDevelopment = env === 'development'

  const rawConfig = {
    environment: env,
    
    app: {
      name: getEnvVar('APP_NAME', 'NutriCoach Core'),
      version: getEnvVar('APP_VERSION', '1.0.0'),
      port: getEnvVarAsNumber('PORT', 3000),
      host: getEnvVar('HOST', 'localhost'),
      baseUrl: getEnvVar('BASE_URL'),
    },

    database: {
      url: getEnvVar('DATABASE_URL') || getEnvVar('SUPABASE_URL') || '',
      poolSize: getEnvVarAsNumber('DB_POOL_SIZE', 10),
      connectionTimeout: getEnvVarAsNumber('DB_CONNECTION_TIMEOUT', 30000),
      queryTimeout: getEnvVarAsNumber('DB_QUERY_TIMEOUT', 60000),
      enableLogging: getEnvVarAsBoolean('DB_ENABLE_LOGGING', !isProduction),
    },

    auth: {
      sessionTimeout: getEnvVarAsNumber('AUTH_SESSION_TIMEOUT', 3600),
      refreshTokenTimeout: getEnvVarAsNumber('AUTH_REFRESH_TOKEN_TIMEOUT', 604800),
      passwordMinLength: getEnvVarAsNumber('AUTH_PASSWORD_MIN_LENGTH', 8),
      maxLoginAttempts: getEnvVarAsNumber('AUTH_MAX_LOGIN_ATTEMPTS', 5),
      lockoutDuration: getEnvVarAsNumber('AUTH_LOCKOUT_DURATION', 900),
      enableTwoFactor: getEnvVarAsBoolean('AUTH_ENABLE_2FA', false),
      enableOAuth: getEnvVarAsBoolean('AUTH_ENABLE_OAUTH', true),
      oauthProviders: getEnvVarAsArray('AUTH_OAUTH_PROVIDERS', ['google']),
    },

    features: {
      enableCaching: getEnvVarAsBoolean('ENABLE_CACHING', true),
      enableRateLimiting: getEnvVarAsBoolean('ENABLE_RATE_LIMITING', isProduction),
      enableMetrics: getEnvVarAsBoolean('ENABLE_METRICS', isProduction),
      enableFileUploads: getEnvVarAsBoolean('ENABLE_FILE_UPLOADS', true),
      enableNotifications: getEnvVarAsBoolean('ENABLE_NOTIFICATIONS', true),
      enableRecipeSharing: getEnvVarAsBoolean('ENABLE_RECIPE_SHARING', true),
      enableSocialFeatures: getEnvVarAsBoolean('ENABLE_SOCIAL_FEATURES', false),
      enableAdvancedNutrition: getEnvVarAsBoolean('ENABLE_ADVANCED_NUTRITION', true),
      enableMealPlanning: getEnvVarAsBoolean('ENABLE_MEAL_PLANNING', false),
    },

    rateLimit: {
      windowMs: getEnvVarAsNumber('RATE_LIMIT_WINDOW_MS', 900000),
      maxRequests: getEnvVarAsNumber('RATE_LIMIT_MAX_REQUESTS', 100),
      maxRequestsPerUser: getEnvVarAsNumber('RATE_LIMIT_MAX_REQUESTS_PER_USER', 1000),
      skipSuccessfulRequests: getEnvVarAsBoolean('RATE_LIMIT_SKIP_SUCCESS', false),
      skipFailedRequests: getEnvVarAsBoolean('RATE_LIMIT_SKIP_FAILED', false),
    },

    cache: {
      provider: getEnvVar('CACHE_PROVIDER', 'memory') as 'memory' | 'redis',
      ttl: getEnvVarAsNumber('CACHE_TTL', 3600),
      maxSize: getEnvVarAsNumber('CACHE_MAX_SIZE', 10000),
      enableCompression: getEnvVarAsBoolean('CACHE_ENABLE_COMPRESSION', true),
    },

    storage: {
      provider: getEnvVar('STORAGE_PROVIDER', 'supabase') as 'local' | 'supabase' | 'aws-s3' | 'cloudinary',
      maxFileSize: getEnvVarAsNumber('STORAGE_MAX_FILE_SIZE', 10485760),
      allowedTypes: getEnvVarAsArray('STORAGE_ALLOWED_TYPES', ['image/jpeg', 'image/png', 'image/webp']),
      uploadPath: getEnvVar('STORAGE_UPLOAD_PATH', '/uploads'),
    },

    logging: {
      level: getEnvVar('LOG_LEVEL', isProduction ? 'info' : 'debug') as 'debug' | 'info' | 'warn' | 'error' | 'fatal',
      enableConsole: getEnvVarAsBoolean('LOG_ENABLE_CONSOLE', true),
      enableFile: getEnvVarAsBoolean('LOG_ENABLE_FILE', isProduction),
      enableStructured: getEnvVarAsBoolean('LOG_ENABLE_STRUCTURED', isProduction),
      filePath: getEnvVar('LOG_FILE_PATH', './logs/app.log'),
      maxFileSize: getEnvVarAsNumber('LOG_MAX_FILE_SIZE', 10485760),
      maxFiles: getEnvVarAsNumber('LOG_MAX_FILES', 5),
    },

    security: {
      enableHttps: getEnvVarAsBoolean('SECURITY_ENABLE_HTTPS', isProduction),
      enableCors: getEnvVarAsBoolean('SECURITY_ENABLE_CORS', true),
      corsOrigins: getEnvVarAsArray('SECURITY_CORS_ORIGINS', isDevelopment ? ['http://localhost:3000'] : []),
      enableHelmet: getEnvVarAsBoolean('SECURITY_ENABLE_HELMET', isProduction),
      enableCSRF: getEnvVarAsBoolean('SECURITY_ENABLE_CSRF', isProduction),
      csrfSecret: getEnvVar('SECURITY_CSRF_SECRET'),
      jwtSecret: getEnvVar('JWT_SECRET') || getEnvVar('SUPABASE_JWT_SECRET'),
      encryptionKey: getEnvVar('ENCRYPTION_KEY'),
    },

    services: {
      nutrition: {
        provider: getEnvVar('NUTRITION_PROVIDER', 'internal') as 'internal' | 'edamam' | 'spoonacular',
        apiKey: getEnvVar('NUTRITION_API_KEY'),
        rateLimit: getEnvVarAsNumber('NUTRITION_RATE_LIMIT', 100),
        timeout: getEnvVarAsNumber('NUTRITION_TIMEOUT', 5000),
      },
      email: {
        provider: getEnvVar('EMAIL_PROVIDER', 'none') as 'none' | 'sendgrid' | 'resend' | 'ses',
        apiKey: getEnvVar('EMAIL_API_KEY'),
        fromEmail: getEnvVar('EMAIL_FROM_EMAIL'),
        fromName: getEnvVar('EMAIL_FROM_NAME'),
      },
      analytics: {
        provider: getEnvVar('ANALYTICS_PROVIDER', 'none') as 'none' | 'google' | 'mixpanel' | 'amplitude',
        apiKey: getEnvVar('ANALYTICS_API_KEY'),
        enableTracking: getEnvVarAsBoolean('ANALYTICS_ENABLE_TRACKING', false),
      },
    },

    performance: {
      enableCompression: getEnvVarAsBoolean('PERFORMANCE_ENABLE_COMPRESSION', true),
      enableEtag: getEnvVarAsBoolean('PERFORMANCE_ENABLE_ETAG', true),
      maxRequestSize: getEnvVarAsNumber('PERFORMANCE_MAX_REQUEST_SIZE', 1048576),
      requestTimeout: getEnvVarAsNumber('PERFORMANCE_REQUEST_TIMEOUT', 30000),
      enableKeepAlive: getEnvVarAsBoolean('PERFORMANCE_ENABLE_KEEP_ALIVE', true),
    },

    development: {
      enableDevTools: getEnvVarAsBoolean('DEV_ENABLE_DEV_TOOLS', isDevelopment),
      enableHotReload: getEnvVarAsBoolean('DEV_ENABLE_HOT_RELOAD', isDevelopment),
      enableDebugMode: getEnvVarAsBoolean('DEV_ENABLE_DEBUG_MODE', isDevelopment),
      enableMockData: getEnvVarAsBoolean('DEV_ENABLE_MOCK_DATA', false),
      seedDatabase: getEnvVarAsBoolean('DEV_SEED_DATABASE', false),
    },
  }

  // Validate configuration
  const result = ConfigSchema.safeParse(rawConfig)
  
  if (!result.success) {
    console.error('Configuration validation failed:', result.error.flatten())
    throw new Error('Invalid configuration')
  }

  return result.data
}

// Global configuration instance
let config: AppConfig | null = null

export const getConfig = (): AppConfig => {
  if (!config) {
    config = loadConfig()
  }
  return config
}

// Configuration helpers
export const isProduction = (): boolean => getConfig().environment === 'production'
export const isDevelopment = (): boolean => getConfig().environment === 'development'
export const isStaging = (): boolean => getConfig().environment === 'staging'

export const isFeatureEnabled = (feature: keyof AppConfig['features']): boolean => {
  return getConfig().features[feature]
}

// Validate required environment variables
export const validateRequiredEnvVars = (): void => {
  const requiredVars = [
    'DATABASE_URL',
  ]

  const missingVars = requiredVars.filter(varName => !getEnvVar(varName))
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`)
  }

  // Validate production-specific requirements
  if (isProduction()) {
    const prodRequiredVars = [
      'JWT_SECRET',
      'ENCRYPTION_KEY',
    ]

    const missingProdVars = prodRequiredVars.filter(varName => !getEnvVar(varName))
    
    if (missingProdVars.length > 0) {
      throw new Error(`Missing required production environment variables: ${missingProdVars.join(', ')}`)
    }
  }
}

// Configuration validation
export const validateConfig = (): { isValid: boolean; errors: string[] } => {
  const errors: string[] = []

  try {
    const config = getConfig()

    // Database validation
    if (!config.database.url) {
      errors.push('Database URL is required')
    }

    // Auth validation
    if (config.auth.passwordMinLength < 6) {
      errors.push('Password minimum length must be at least 6 characters')
    }

    // Security validation in production
    if (isProduction()) {
      if (!config.security.jwtSecret) {
        errors.push('JWT secret is required in production')
      }
      if (!config.security.encryptionKey) {
        errors.push('Encryption key is required in production')
      }
      if (config.security.corsOrigins.length === 0) {
        errors.push('CORS origins must be specified in production')
      }
    }

    // File storage validation
    if (config.storage.maxFileSize < 1024) {
      errors.push('Maximum file size must be at least 1KB')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  } catch (error) {
    errors.push(`Configuration validation error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    return {
      isValid: false,
      errors
    }
  }
}

export default getConfig