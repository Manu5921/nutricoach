import { NextRequest, NextResponse } from 'next/server'

// API endpoint to receive Stripe events and forward to Google Analytics
export async function POST(request: NextRequest) {
  try {
    const analyticsData = await request.json()
    
    // Validate the analytics data
    if (!analyticsData.event_type || !analyticsData.timestamp) {
      return NextResponse.json({ error: 'Invalid analytics data' }, { status: 400 })
    }

    // Forward to Google Analytics via server-side tracking
    await forwardToGoogleAnalytics(analyticsData)
    
    // Store in our database for business intelligence
    await storeAnalyticsData(analyticsData)
    
    return NextResponse.json({ 
      success: true, 
      event_tracked: analyticsData.event_type 
    })
    
  } catch (error) {
    console.error('Analytics tracking error:', error)
    return NextResponse.json({ error: 'Failed to track analytics' }, { status: 500 })
  }
}

// Forward analytics data to Google Analytics using Measurement Protocol
async function forwardToGoogleAnalytics(data: any) {
  try {
    const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID
    const GA_API_SECRET = process.env.GA_API_SECRET
    
    if (!GA_MEASUREMENT_ID || !GA_API_SECRET) {
      console.log('GA credentials not configured, skipping server-side tracking')
      return
    }

    // Map our analytics data to GA4 Measurement Protocol format
    const gaEvent = mapToGoogleAnalyticsEvent(data)
    
    const response = await fetch(
      `https://www.google-analytics.com/mp/collect?measurement_id=${GA_MEASUREMENT_ID}&api_secret=${GA_API_SECRET}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: data.user_id || 'anonymous', // Use user_id as client_id
          events: [gaEvent]
        })
      }
    )

    if (!response.ok) {
      throw new Error(`GA API error: ${response.status}`)
    }

    console.log('Event successfully sent to Google Analytics:', data.event_type)
    
  } catch (error) {
    console.error('Failed to send event to Google Analytics:', error)
  }
}

// Map our analytics data to Google Analytics 4 event format
function mapToGoogleAnalyticsEvent(data: any) {
  const baseEvent = {
    name: data.event_type,
    params: {
      timestamp_micros: new Date(data.timestamp).getTime() * 1000,
      event_category: 'ecommerce',
      currency: data.currency || 'EUR'
    }
  }

  // Add specific parameters based on event type
  switch (data.event_type) {
    case 'subscription_purchased':
      return {
        ...baseEvent,
        name: 'purchase',
        params: {
          ...baseEvent.params,
          transaction_id: data.transaction_id,
          value: data.value,
          currency: data.currency,
          items: [{
            item_id: `subscription_${data.subscription_type}`,
            item_name: `NutriCoach ${data.subscription_type}`,
            category: 'subscription',
            price: data.value,
            quantity: 1
          }]
        }
      }

    case 'subscription_started':
      return {
        ...baseEvent,
        name: 'begin_checkout',
        params: {
          ...baseEvent.params,
          subscription_type: data.subscription_type,
          trial_end: data.trial_end
        }
      }

    case 'subscription_cancelled':
      return {
        ...baseEvent,
        name: 'refund',
        params: {
          ...baseEvent.params,
          subscription_type: data.subscription_type,
          cancellation_reason: data.cancellation_reason
        }
      }

    case 'payment_failed':
      return {
        ...baseEvent,
        name: 'payment_failed',
        params: {
          ...baseEvent.params,
          value: data.amount,
          currency: data.currency,
          subscription_id: data.subscription_id
        }
      }

    case 'trial_ending_soon':
      return {
        ...baseEvent,
        name: 'trial_ending_soon',
        params: {
          ...baseEvent.params,
          trial_end: data.trial_end,
          subscription_id: data.subscription_id
        }
      }

    default:
      return baseEvent
  }
}

// Store analytics data in our database for business intelligence
async function storeAnalyticsData(data: any) {
  try {
    // TODO: Implement database storage when Supabase is fully configured
    // For now, just log the data
    console.log('Analytics data to store:', JSON.stringify(data, null, 2))
    
    // Example of what the database insertion would look like:
    /*
    const { createClient } = require('@supabase/supabase-js')
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)
    
    const { error } = await supabase
      .from('analytics_events')
      .insert({
        event_type: data.event_type,
        user_id: data.user_id,
        event_data: data,
        created_at: new Date().toISOString()
      })
    
    if (error) {
      console.error('Failed to store analytics data:', error)
    }
    */
    
  } catch (error) {
    console.error('Failed to store analytics data:', error)
  }
}