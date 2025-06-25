import { NextRequest, NextResponse } from 'next/server'

// Simplified login for Railway deployment
// TODO: Re-enable auth logic after successful deployment

export async function POST(request: NextRequest) {
  return NextResponse.json({ 
    message: "Login endpoint deployed successfully",
    status: "ready_for_configuration" 
  })
}