import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { SecurityAudit } from '@/lib/auth/security'
import { SecurityLevel } from '@/lib/auth/types'

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    let ipAddress: string | undefined
    const xForwardedFor = request.headers.get('x-forwarded-for')
    if (xForwardedFor) {
      ipAddress = xForwardedFor.split(',')[0].trim()
    }
    if (!ipAddress) {
      ipAddress = 'unknown'
    }
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Get current session
    const { data: { session } } = await supabase.auth.getSession()
    
    if (session?.user?.id) {
      // Log logout before signing out
      await SecurityAudit.logAccess({
        userId: session.user.id,
        action: 'logout',
        securityLevel: SecurityLevel.PERSONAL,
        ipAddress,
        userAgent,
        success: true
      })
    }

    // Sign out user
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error('Logout error:', error)
      return NextResponse.json(
        { error: 'Failed to logout' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Logged out successfully' })

  } catch (error) {
    console.error('Logout error:', error)
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}