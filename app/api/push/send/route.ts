import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'

// Configure web-push only if keys are available
if (process.env.NEXT_PUBLIC_VAPID_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:contact@nutricoach.app',
    process.env.NEXT_PUBLIC_VAPID_KEY,
    process.env.VAPID_PRIVATE_KEY
  )
}

// API endpoint for sending push notifications
export async function POST(request: NextRequest) {
  try {
    // Check if VAPID keys are configured
    if (!process.env.NEXT_PUBLIC_VAPID_KEY || !process.env.VAPID_PRIVATE_KEY) {
      return NextResponse.json({ error: 'Push notifications not configured' }, { status: 503 })
    }

    const { 
      subscriptions, 
      title, 
      body, 
      icon, 
      badge, 
      tag, 
      data,
      segmentation 
    } = await request.json()
    
    // Validate required fields
    if (!title || !body) {
      return NextResponse.json({ error: 'Title and body are required' }, { status: 400 })
    }
    
    // Get target subscriptions based on segmentation
    const targetSubscriptions = segmentation 
      ? await getSegmentedSubscriptions(segmentation)
      : subscriptions || []
    
    if (targetSubscriptions.length === 0) {
      return NextResponse.json({ error: 'No target subscriptions found' }, { status: 400 })
    }
    
    // Send notifications
    const results = await sendNotifications(targetSubscriptions, {
      title,
      body,
      icon: icon || '/icons/notification-icon.png',
      badge: badge || '/icons/badge.png',
      tag: tag || 'general',
      data: data || {}
    })
    
    // Track notification campaign
    await trackNotificationCampaign({
      title,
      body,
      targetCount: targetSubscriptions.length,
      successCount: results.successful,
      failureCount: results.failed
    })
    
    return NextResponse.json({
      success: true,
      sent: results.successful,
      failed: results.failed,
      total: targetSubscriptions.length
    })
    
  } catch (error) {
    console.error('Push notification sending error:', error)
    return NextResponse.json({ error: 'Failed to send notifications' }, { status: 500 })
  }
}

// Send notifications to multiple subscriptions
async function sendNotifications(subscriptions: any[], payload: any) {
  let successful = 0
  let failed = 0
  
  const promises = subscriptions.map(async (subscription) => {
    try {
      await webpush.sendNotification(
        subscription,
        JSON.stringify(payload),
        {
          TTL: 60 * 60 * 24, // 24 hours
          urgency: 'normal'
        }
      )
      successful++
    } catch (error) {
      console.error('Failed to send notification:', error)
      failed++
      
      // Remove invalid subscriptions
      if (error.statusCode === 410 || error.statusCode === 404) {
        await removeInvalidSubscription(subscription)
      }
    }
  })
  
  await Promise.allSettled(promises)
  
  return { successful, failed }
}

// Get subscriptions based on segmentation criteria
async function getSegmentedSubscriptions(segmentation: any) {
  // TODO: Implement segmentation logic with database
  // This would filter subscriptions based on user behavior, preferences, etc.
  
  console.log('Getting segmented subscriptions for:', segmentation)
  
  /* 
  // Example segmentation queries:
  const { createClient } = require('@supabase/supabase-js')
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)
  
  let query = supabase
    .from('push_subscriptions')
    .select('*')
    .eq('is_active', true)
  
  // Apply segmentation filters
  if (segmentation.userType) {
    query = query.eq('user_type', segmentation.userType)
  }
  
  if (segmentation.subscriptionStatus) {
    query = query.eq('subscription_status', segmentation.subscriptionStatus)
  }
  
  if (segmentation.lastActiveAfter) {
    query = query.gte('last_active', segmentation.lastActiveAfter)
  }
  
  if (segmentation.trialEnding) {
    const threeDaysFromNow = new Date()
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)
    query = query.lte('trial_end_date', threeDaysFromNow.toISOString())
  }
  
  const { data, error } = await query
  
  return data || []
  */
  
  // Mock data for development
  return []
}

// Remove invalid subscription from database
async function removeInvalidSubscription(subscription: any) {
  // TODO: Remove from database
  console.log('Removing invalid subscription:', subscription.endpoint)
  
  /* 
  const { createClient } = require('@supabase/supabase-js')
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)
  
  const { error } = await supabase
    .from('push_subscriptions')
    .update({ is_active: false })
    .eq('endpoint', subscription.endpoint)
  */
}

// Track notification campaign metrics
async function trackNotificationCampaign(campaign: any) {
  console.log('Tracking notification campaign:', campaign)
  
  // TODO: Store campaign metrics for analysis
  /* 
  const { createClient } = require('@supabase/supabase-js')
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)
  
  const { error } = await supabase
    .from('notification_campaigns')
    .insert({
      title: campaign.title,
      body: campaign.body,
      target_count: campaign.targetCount,
      success_count: campaign.successCount,
      failure_count: campaign.failureCount,
      sent_at: new Date().toISOString()
    })
  */
}