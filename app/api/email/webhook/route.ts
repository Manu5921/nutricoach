import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/lib/email/service';

export async function POST(request: NextRequest) {
  try {
    // Verify webhook signature if configured
    const signature = request.headers.get('resend-signature');
    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
    
    if (webhookSecret && signature) {
      // TODO: Implement signature verification
      // This would verify the webhook is actually from Resend
    }

    const payload = await request.json();
    
    // Handle the webhook
    const result = await emailService.handleWebhook(payload);
    
    if (result.success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: 'Failed to process webhook' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Email webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}