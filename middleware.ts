export const runtime = 'nodejs'; // Force Node.js runtime pour compatibilité avec le module crypto

import { createMiddlewareClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { UserService } from '@/lib/auth/user-service'
import { SecurityAudit, SessionSecurity } from '@/lib/auth/security'
import { SecurityLevel } from '@/lib/auth/types'

// Routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/recipes',
  '/menu',
  '/profile',
  '/settings',
  '/api/menu',
  '/api/recipes',
  '/api/profile'
]

// Routes that require active subscription
const subscriptionRoutes = [
  '/recipes',
  '/menu',
  '/api/menu',
  '/api/recipes'
]

// Public routes that don't require auth
const publicRoutes = [
  '/',
  '/login',
  '/signup',
  '/pricing',
  '/about',
  '/privacy',
  '/terms',
  '/api/auth',
  '/api/stripe/webhook'
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const { supabase, response } = createMiddlewareClient(request)

  // Allow public routes
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return response
  }

  // Get session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()

  // Redirect to login if no session
  if (sessionError || !session) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  const userId = session.user.id
  // Correctly get IP address in Edge Runtime and Node.js environments
  let ipAddress: string | undefined
  const xForwardedFor = request.headers.get('x-forwarded-for')
  if (xForwardedFor) {
    // x-forwarded-for can be a comma-separated list of IPs, the first one is the client's
    ipAddress = xForwardedFor.split(',')[0].trim()
  }
  if (!ipAddress) {
    ipAddress = 'unknown' // Fallback if no IP is found
  }
  const userAgent = request.headers.get('user-agent') || 'unknown'

  try {
    // Validate session security
    const securityCheck = await SessionSecurity.validateRequest(ipAddress, userAgent, userId)
    if (!securityCheck.valid) {
      console.warn(`Security check failed for user ${userId}: ${securityCheck.reason}`)
      
      // Log security failure
      await SecurityAudit.logAccess({
        userId,
        action: 'login',
        securityLevel: SecurityLevel.PERSONAL,
        ipAddress,
        userAgent,
        success: false,
        failureReason: securityCheck.reason
      })

      // For suspicious activity, redirect to re-authentication
      if (securityCheck.reason === 'Too many failed attempts') {
        const lockoutUrl = new URL('/login', request.url)
        lockoutUrl.searchParams.set('error', 'account_locked')
        return NextResponse.redirect(lockoutUrl)
      }
    }

    // Check if route requires subscription
    if (subscriptionRoutes.some(route => pathname.startsWith(route))) {
      const userService = new UserService()
      const hasAccess = await userService.hasActiveAccess(userId)

      if (!hasAccess) {
        // Redirect to pricing page if no active subscription or trial
        const pricingUrl = new URL('/pricing', request.url)
        pricingUrl.searchParams.set('reason', 'subscription_required')
        return NextResponse.redirect(pricingUrl)
      }
    }

    // Log successful access for protected routes
    if (protectedRoutes.some(route => pathname.startsWith(route))) {
      // Don't await to avoid slowing down requests
      SecurityAudit.logAccess({
        userId,
        action: 'login',
        securityLevel: SecurityLevel.PERSONAL,
        ipAddress,
        userAgent,
        dataAccessed: [pathname]
      }).catch(error => {
        console.error('Failed to log access:', error)
      })
    }

    // Add security headers
    const securityHeaders = new Headers(response.headers)
    securityHeaders.set('X-Frame-Options', 'DENY')
    securityHeaders.set('X-Content-Type-Options', 'nosniff')
    securityHeaders.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    securityHeaders.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
    
    // For health data routes, add extra security
    if (pathname.includes('/profile') || pathname.includes('/health')) {
      securityHeaders.set('Cache-Control', 'no-store, no-cache, must-revalidate')
      securityHeaders.set('Pragma', 'no-cache')
    }

    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: securityHeaders
    })

  } catch (error) {
    console.error('Middleware error:', error)
    
    // Log middleware error
    await SecurityAudit.logAccess({
      userId,
      action: 'login',
      securityLevel: SecurityLevel.PERSONAL,
      ipAddress,
      userAgent,
      success: false,
      failureReason: `Middleware error: ${error instanceof Error ? error.message : 'Unknown'}`
    })

    // On error, redirect to login for safety
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('error', 'middleware_error')
    return NextResponse.redirect(loginUrl)
  }
}

export const config = {
  /*
   * Match all request paths except for the ones starting with:
   * - _next/static (static files)
   * - _next/image (image optimization files)
   * - favicon.ico (favicon file)
   * - public folder
   */
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}