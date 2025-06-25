import { NextRequest, NextResponse } from 'next/server'
import { createServerComponentClient } from '@/lib/supabase-railway'
import { SecurityAudit } from '@/lib/auth/security'
import { SecurityLevel } from '@/lib/auth/types'
import { UserService } from '@/lib/auth/user-service'

export async function POST(request: NextRequest) {
  try {
    const { email, password, fullName } = await request.json()

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Password strength validation
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      )
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    const supabase = createServerComponentClient()
    let ipAddress: string | undefined
    const xForwardedFor = request.headers.get('x-forwarded-for')
    if (xForwardedFor) {
      ipAddress = xForwardedFor.split(',')[0].trim()
    }
    if (!ipAddress) {
      ipAddress = 'unknown'
    }
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      )
    }

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName || ''
        }
      }
    })

    if (authError) {
      console.error('Signup auth error:', authError)
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create user account' },
        { status: 500 }
      )
    }

    const userId = authData.user.id

    try {
      // Create user profile in our database
      const userService = new UserService()
      const userProfile = await userService.createUser(
        {
          email,
          fullName,
          avatarUrl: authData.user.user_metadata?.avatar_url
        },
        { ipAddress, userAgent }
      )

      // Log successful signup
      await SecurityAudit.logAccess({
        userId,
        action: 'profile_update',
        securityLevel: SecurityLevel.PERSONAL,
        ipAddress,
        userAgent,
        success: true,
        dataAccessed: ['account_creation']
      })

      // If email confirmation is required
      if (!authData.session) {
        return NextResponse.json({
          message: 'Please check your email to confirm your account',
          user: userProfile,
          requiresConfirmation: true
        })
      }

      // Auto-login successful
      return NextResponse.json({
        user: userProfile,
        session: authData.session,
        message: 'Account created successfully',
        hasAccess: true // New users get 7-day trial
      })

    } catch (profileError) {
      console.error('Profile creation error:', profileError)
      
      // If profile creation fails, clean up auth user
      await supabase.auth.admin.deleteUser(userId)
      
      await SecurityAudit.logAccess({
        userId,
        action: 'profile_update',
        securityLevel: SecurityLevel.PERSONAL,
        ipAddress,
        userAgent,
        success: false,
        failureReason: 'Profile creation failed'
      })

      return NextResponse.json(
        { error: 'Failed to create user profile' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Signup error:', error)
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}