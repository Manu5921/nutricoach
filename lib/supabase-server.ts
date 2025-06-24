import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// Server-side Supabase client for server components
export function createServerComponentClient() {
  const cookieStore = cookies()
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) { // Make the get function async
          // If cookieStore is a promise (because cookies() might be async in some contexts)
          // then we need to await it.
          // However, next/headers cookies() is typically synchronous.
          // This change is to satisfy TypeScript based on the error message.
          const store = cookieStore; // Assuming cookieStore is NOT a promise here based on next/headers doc
                                  // but the error implies it IS.
                                  // Let's try to await it if it IS a promise,
                                  // but this structure is weird if cookieStore is a promise.

          // The error "Property 'get' does not exist on type 'Promise<ReadonlyRequestCookies>'"
          // means `cookieStore` is seen as a Promise.
          return (await store).get(name)?.value;
        },
        // Assuming set and remove also need similar treatment if get does.
        // However, the error is specific to the 'get' line.
        // For now, only fixing the reported line.
        // If Supabase calls these, and they need to be async, Supabase client should handle it.
        // The functions provided to Supabase's cookie options can be async.
      },
    }
  )
}

// Middleware Supabase client
export function createMiddlewareClient(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  return { supabase, response }
}