/**
 * Supabase Client Configuration for Next.js 15 App Router
 * Based on Context7 research for server-side rendering with cookies
 */

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createBrowserClient, getDatabaseConfig } from '@nutricoach/core-nutrition/config'
import type { Database } from '@nutricoach/core-nutrition/types'

/**
 * Create Supabase client for Server Components
 * This client can be used in Server Components, Route Handlers, and Server Actions
 */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies()
  const config = getDatabaseConfig()

  return createServerClient<Database>(
    config.url,
    config.anonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

/**
 * Create Supabase client for Client Components
 * This client should be used in Client Components
 */
export function createClientSupabaseClient() {
  return createBrowserClient()
}

/**
 * Utility to get the current user from server-side
 */
export async function getCurrentUser() {
  const supabase = await createServerSupabaseClient()
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      console.warn('Error getting current user:', error.message)
      return null
    }
    
    return user
  } catch (error) {
    console.error('Failed to get current user:', error)
    return null
  }
}

/**
 * Utility to get the current session from server-side
 */
export async function getCurrentSession() {
  const supabase = await createServerSupabaseClient()
  
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.warn('Error getting current session:', error.message)
      return null
    }
    
    return session
  } catch (error) {
    console.error('Failed to get current session:', error)
    return null
  }
}