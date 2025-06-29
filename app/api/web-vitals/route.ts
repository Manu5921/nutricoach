import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const metrics = await request.json()
    
    // Log metrics in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Web Vitals API]', metrics)
    }
    
    // In production, you might want to:
    // - Store metrics in a database
    // - Send to monitoring services like DataDog, New Relic, etc.
    // - Send to analytics platforms
    
    // Example: Basic logging to console for now (replace with your analytics solution)
    if (process.env.NODE_ENV === 'production') {
      console.log(`[Web Vitals] ${metrics.name}: ${metrics.value}ms at ${metrics.url}`)
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error processing web vitals:', error)
    return NextResponse.json(
      { error: 'Failed to process web vitals' },
      { status: 500 }
    )
  }
}