// Ultra-simple Railway exports - no complex dependencies
export { createClient } from './supabase-client'
export { createServerComponentClient, createMiddlewareClient } from './supabase-simple'

// Re-export simplified auth classes for Railway deployment
export { UserService, SecurityAudit, SessionSecurity, SecurityLevel, DataEncryption } from './auth-disabled'