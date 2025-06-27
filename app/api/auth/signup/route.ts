import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-client'

export async function POST(request: NextRequest) {
  try {
    const { email, password, fullName } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email et mot de passe requis' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Create user account
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName || null
        }
      }
    })

    if (authError) {
      console.error('Signup error:', authError)
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      )
    }

    // If user was created successfully, create profile
    if (authData.user) {
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: authData.user.id,
          email: email,
          full_name: fullName || null,
          // Set default trial period (7 days)
          created_at: new Date().toISOString()
        })

      if (profileError) {
        console.error('Profile creation error:', profileError)
        // Continue anyway - profile can be created later
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Compte créé avec succès',
      user: authData.user
    })

  } catch (error) {
    console.error('Signup API error:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}