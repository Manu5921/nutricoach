import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { SecurityAudit, SessionSecurity } from '@/lib/auth/security'
import { SecurityLevel } from '@/lib/auth/types'
import { UserService } from '@/lib/auth/user-service'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const supabase = createRouteHandlerClient({ cookies })
    let ipAddress: string | undefined
    const xForwardedFor = request.headers.get('x-forwarded-for')
    if (xForwardedFor) {
      ipAddress = xForwardedFor.split(',')[0].trim()
    }
    if (!ipAddress) {
      // Fallback for environments where x-forwarded-for might not be set
      // Note: request.ip is not reliably available in Edge environments
      ipAddress = 'unknown'
    }
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Check if account is locked before attempting login
    const { data: userData } = await supabase
      .from('users')
      .select('id, failed_login_attempts, account_locked_until')
      .eq('email', email)
      .single()

    if (userData?.account_locked_until) {
      const lockUntil = new Date(userData.account_locked_until)
      if (lockUntil > new Date()) {
        await SecurityAudit.logAccess({
          userId: userData.id,
          action: 'login',
          securityLevel: SecurityLevel.PERSONAL,
          ipAddress,
          userAgent,
          success: false,
          failureReason: 'Account locked'
        })

        return NextResponse.json(
          { 
            error: 'Account temporarily locked due to multiple failed login attempts',
            lockUntil: lockUntil.toISOString()
          },
          { status: 423 } // Locked
        )
      }
    }

    // Attempt login
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (authError || !authData.user) {
      // Handle failed login
      if (userData?.id) {
        // Increment failed login attempts
        await supabase.rpc('handle_failed_login', { user_email: email })

        await SecurityAudit.logAccess({
          userId: userData.id,
          action: 'login',
          securityLevel: SecurityLevel.PERSONAL,
          ipAddress,
          userAgent,
          success: false,
          failureReason: authError?.message || 'Invalid credentials'
        })
      }

      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    const userId = authData.user.id

    // Validate session security
    const securityCheck = await SessionSecurity.validateRequest(ipAddress, userAgent, userId)
    if (!securityCheck.valid) {
      await SecurityAudit.logAccess({
        userId,
        action: 'login',
        securityLevel: SecurityLevel.PERSONAL,
        ipAddress,
        userAgent,
        success: false,
        failureReason: securityCheck.reason
      })

      return NextResponse.json(
        { error: 'Security validation failed', reason: securityCheck.reason },
        { status: 403 }
      )
    }

    // Update last login and reset failed attempts
    await supabase
      .from('users')
      .update({
        last_login_at: new Date().toISOString(),
        failed_login_attempts: 0,
        account_locked_until: null
      })
      .eq('id', userId)

    // Log successful login
    await SecurityAudit.logAccess({
      userId,
      action: 'login',
      securityLevel: SecurityLevel.PERSONAL,
      ipAddress,
      userAgent,
      success: true
    })

    // Get user profile
    const userService = new UserService()
    const userProfile = await userService.getUserProfile(
      userId,
      SecurityLevel.PERSONAL,
      { ipAddress, userAgent }
    )

    // Check subscription status
    const hasAccess = await userService.hasActiveAccess(userId)

    return NextResponse.json({
      user: userProfile,
      session: authData.session,
      hasAccess,
      message: 'Login successful'
    })

  } catch (error) {
    console.error('Login error:', error)
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Social login endpoints
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const provider = searchParams.get('provider') as 'google' | 'github'

  if (!provider || !['google', 'github'].includes(provider)) {
    return NextResponse.json(
      { error: 'Invalid provider' },
      { status: 400 }
    )
  }

  const supabase = createRouteHandlerClient({ cookies })
  const redirectTo = `${process.env.NEXT_PUBLIC_URL}/api/auth/callback`

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent'
      }
    }
  })

  if (error) {
    console.error('OAuth error:', error)
    return NextResponse.json(
      { error: 'OAuth authentication failed' },
      { status: 500 }
    )
  }

  return NextResponse.redirect(data.url)
}