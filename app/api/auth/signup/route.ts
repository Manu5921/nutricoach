import { NextRequest, NextResponse } from 'next/server'

// Simplified signup for Railway deployment
// TODO: Re-enable auth logic after successful deployment

export async function POST(request: NextRequest) {
  return NextResponse.json({ 
    message: "Signup endpoint deployed successfully",
    status: "ready_for_configuration" 
  })
}