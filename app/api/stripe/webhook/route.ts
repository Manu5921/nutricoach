import { NextRequest, NextResponse } from 'next/server'

// Simplified webhook for Railway deployment
// TODO: Re-enable Stripe logic after successful deployment

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    // For now, just log the webhook for development
    if (process.env.NODE_ENV === 'development') {
      console.log('Stripe webhook received:', { body: body.substring(0, 100), signature })
    }

    // TODO: Implement full Stripe webhook logic after successful deployment
    // This is where we'll add the analytics tracking for Stripe events
    
    // Parse the event when Stripe is enabled
    try {
      const event = JSON.parse(body)
      
      // Track business events based on Stripe webhook type
      await trackStripeEventToAnalytics(event)
      
    } catch (parseError) {
      console.log('Webhook parse error (expected during development):', parseError)
    }
    
    return NextResponse.json({ 
      message: "Webhook endpoint deployed successfully",
      status: "ready_for_configuration",
      analytics_tracking: "enabled"
    })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

// Function to track Stripe events to analytics
async function trackStripeEventToAnalytics(event: any) {
  try {
    // Map Stripe events to analytics events
    const analyticsData = mapStripeEventToAnalytics(event)
    
    if (analyticsData) {
      // Send to our analytics API endpoint
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/analytics/stripe-events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(analyticsData)
      })
    }
  } catch (error) {
    console.error('Failed to track Stripe event to analytics:', error)
  }
}

// Map Stripe webhook events to business analytics events
function mapStripeEventToAnalytics(event: any) {
  const { type, data } = event
  const customer = data?.object?.customer
  const amount = data?.object?.amount_total || data?.object?.amount
  const currency = data?.object?.currency || 'eur'
  
  switch (type) {
    case 'checkout.session.completed':
      return {
        event_type: 'subscription_purchased',
        user_id: customer,
        transaction_id: data.object.id,
        value: amount ? amount / 100 : 0, // Convert from cents
        currency: currency,
        subscription_type: getSubscriptionTypeFromAmount(amount),
        timestamp: new Date().toISOString()
      }
      
    case 'customer.subscription.created':
      return {
        event_type: 'subscription_started',
        user_id: customer,
        subscription_id: data.object.id,
        subscription_type: getSubscriptionTypeFromAmount(data.object.items?.data?.[0]?.price?.unit_amount),
        trial_end: data.object.trial_end,
        timestamp: new Date().toISOString()
      }
      
    case 'customer.subscription.deleted':
      return {
        event_type: 'subscription_cancelled',
        user_id: customer,
        subscription_id: data.object.id,
        cancellation_reason: data.object.cancellation_details?.reason,
        subscription_type: getSubscriptionTypeFromAmount(data.object.items?.data?.[0]?.price?.unit_amount),
        timestamp: new Date().toISOString()
      }
      
    case 'invoice.payment_failed':
      return {
        event_type: 'payment_failed',
        user_id: customer,
        subscription_id: data.object.subscription,
        amount: amount ? amount / 100 : 0,
        currency: currency,
        timestamp: new Date().toISOString()
      }
      
    case 'customer.subscription.trial_will_end':
      return {
        event_type: 'trial_ending_soon',
        user_id: customer,
        subscription_id: data.object.id,
        trial_end: data.object.trial_end,
        timestamp: new Date().toISOString()
      }
      
    default:
      return null
  }
}

// Helper function to determine subscription type from amount
function getSubscriptionTypeFromAmount(amount?: number): string {
  if (!amount) return 'unknown'
  
  const amountInEur = amount / 100
  
  // Define your pricing tiers here
  if (amountInEur <= 10) return 'basic'
  if (amountInEur <= 25) return 'premium'
  if (amountInEur <= 40) return 'family'
  
  return 'enterprise'
}