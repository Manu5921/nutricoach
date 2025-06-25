import { NextRequest, NextResponse } from 'next/server'

// Simplified logout for Railway deployment
// TODO: Re-enable auth logic after successful deployment

export async function POST(request: NextRequest) {
  return NextResponse.json({ 
    message: "Logout endpoint deployed successfully",
    status: "ready_for_configuration" 
  })
}