import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/dashboard'

    if (code) {
      const supabase = createClient()
      
      // Exchange code for session
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (!error) {
        // Successful authentication, redirect to dashboard or specified page
        return NextResponse.redirect(`${origin}${next}`)
      } else {
        console.error('Auth callback error:', error)
        // Redirect to login with error
        return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
      }
    }

    // No code provided, redirect to login
    return NextResponse.redirect(`${origin}/login?error=no_auth_code`)
    
  } catch (error) {
    console.error('Callback API error:', error)
    return NextResponse.redirect(`${request.nextUrl.origin}/login?error=callback_error`)
  }
}