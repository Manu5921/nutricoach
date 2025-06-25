import { createBrowserClient } from '@supabase/ssr'

// Client-side Supabase client for components with fallbacks
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
  
  if (url === 'https://placeholder.supabase.co') {
    console.warn('⚠️ Using placeholder Supabase credentials. Configure your Railway environment variables.')
  }
  
  return createBrowserClient(url, key)
}