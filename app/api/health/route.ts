import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-client'

export async function GET(request: NextRequest) {
  try {
    // Check environment variables
    const envCheck = {
      supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabase_anon_key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      supabase_service_key: !!process.env.SUPABASE_SERVICE_ROLE_KEY
    }

    // Test Supabase connection
    let supabaseStatus = 'unknown'
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('user_profiles')
        .select('count')
        .limit(1)
      
      if (error) {
        supabaseStatus = `error: ${error.message}`
      } else {
        supabaseStatus = 'connected'
      }
    } catch (err: any) {
      supabaseStatus = `failed: ${err.message}`
    }

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: {
        node_env: process.env.NODE_ENV,
        base_url: process.env.NEXT_PUBLIC_BASE_URL,
        ...envCheck
      },
      supabase: {
        status: supabaseStatus,
        url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 
          `${process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 20)}...` : 
          'not_configured'
      },
      auth: {
        routes_active: true,
        callback_configured: true
      }
    })

  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}