import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-client'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()

    // Sign out user
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error('Logout error:', error)
      return NextResponse.json(
        { error: 'Erreur lors de la déconnexion' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Déconnexion réussie'
    })

  } catch (error) {
    console.error('Logout API error:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}