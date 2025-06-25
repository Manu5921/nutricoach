import { NextRequest, NextResponse } from 'next/server'

// Simplified callback for Railway deployment
// TODO: Re-enable auth logic after successful deployment

export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    message: "Callback endpoint deployed successfully",
    status: "ready_for_configuration" 
  })
}