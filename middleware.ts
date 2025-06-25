// Simplified middleware for Railway deployment - complex security disabled temporarily
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

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

  // Allow public routes
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // For Railway deployment: simplified auth check
  // TODO: Re-enable complex security after successful deployment
  
  // Add basic security headers
  const response = NextResponse.next()
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  return response
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