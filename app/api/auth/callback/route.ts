import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { UserService } from '@/lib/auth/user-service'
import { SecurityAudit } from '@/lib/auth/security'
import { SecurityLevel } from '@/lib/auth/types'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = createRouteHandlerClient({ cookies })
    const ipAddress = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    try {
      // Exchange code for session
      const { data: authData, error: authError } = await supabase.auth.exchangeCodeForSession(code)

      if (authError) {
        console.error('Auth callback error:', authError)
        return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
      }

      if (!authData.user) {
        return NextResponse.redirect(`${origin}/login?error=no_user_data`)
      }

      const userId = authData.user.id
      const email = authData.user.email!

      // Check if user profile exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('id', userId)
        .single()

      const userService = new UserService()

      if (!existingUser) {
        // Create new user profile for OAuth signup
        try {
          await userService.createUser(
            {
              email,
              fullName: authData.user.user_metadata?.full_name || authData.user.user_metadata?.name,
              avatarUrl: authData.user.user_metadata?.avatar_url
            },
            { ipAddress, userAgent }
          )

          // Log new OAuth user creation
          await SecurityAudit.logAccess({
            userId,
            action: 'profile_update',
            securityLevel: SecurityLevel.PERSONAL,
            ipAddress,
            userAgent,
            success: true,
            dataAccessed: ['oauth_signup']
          })

        } catch (profileError) {
          console.error('OAuth profile creation error:', profileError)
          return NextResponse.redirect(`${origin}/login?error=profile_creation_failed`)
        }
      } else {
        // Update last login for existing user
        await supabase
          .from('users')
          .update({
            last_login_at: new Date().toISOString(),
            failed_login_attempts: 0,
            account_locked_until: null
          })
          .eq('id', userId)

        // Log successful OAuth login
        await SecurityAudit.logAccess({
          userId,
          action: 'login',
          securityLevel: SecurityLevel.PERSONAL,
          ipAddress,
          userAgent,
          success: true,
          dataAccessed: ['oauth_login']
        })
      }

      // Redirect to dashboard or intended page
      return NextResponse.redirect(`${origin}${next}`)

    } catch (error) {
      console.error('OAuth callback error:', error)
      return NextResponse.redirect(`${origin}/login?error=callback_error`)
    }
  }

  // No code parameter
  return NextResponse.redirect(`${origin}/login?error=no_code`)
}