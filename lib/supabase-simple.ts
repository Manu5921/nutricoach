import { createClient } from '@supabase/supabase-js'

// Ultra-simple Railway-compatible Supabase clients with fallbacks
export function createServerComponentClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
  
  if (url === 'https://placeholder.supabase.co') {
    console.warn('⚠️ Using placeholder Supabase credentials. Configure your environment variables.')
  }
  
  return createClient(url, key)
}

export function createMiddlewareClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
  
  return createClient(url, key)
}