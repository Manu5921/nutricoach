import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { createServerComponentClient } from '@/lib/supabase'
import { SecurityAudit } from '@/lib/auth/security'
import { SecurityLevel } from '@/lib/auth/types'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  const body = await request.text()
  const headersList = headers()
  const sig = headersList.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    )
  }

  const supabase = createServerComponentClient()

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionChange(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionCanceled(event.data.object as Stripe.Subscription)
        break

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice)
        break

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice)
        break

      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook handler error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }

  async function handleSubscriptionChange(subscription: Stripe.Subscription) {
    const customerId = subscription.customer as string
    const userId = subscription.metadata.user_id

    if (!userId) {
      console.error('No user_id in subscription metadata')
      return
    }

    // Update user subscription status
    const { error: userError } = await supabase
      .from('users')
      .update({
        subscription_status: subscription.status,
        subscription_id: subscription.id,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (userError) {
      console.error('Error updating user subscription:', userError)
      return
    }

    // Upsert subscription record
    const { error: subscriptionError } = await supabase
      .from('subscriptions')
      .upsert({
        user_id: userId,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: customerId,
        status: subscription.status as any,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
        trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
        trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
        amount_cents: 699, // 6.99€
        currency: 'EUR',
        interval_type: 'month'
      })

    if (subscriptionError) {
      console.error('Error upserting subscription:', subscriptionError)
      return
    }

    // Log subscription change
    await SecurityAudit.logAccess({
      userId,
      action: 'subscription_change' as any,
      securityLevel: SecurityLevel.PERSONAL,
      ipAddress: 'stripe-webhook',
      userAgent: 'stripe-webhook',
      dataAccessed: ['subscription_status']
    })

    console.log(`Subscription ${subscription.status} for user ${userId}`)
  }

  async function handleSubscriptionCanceled(subscription: Stripe.Subscription) {
    const userId = subscription.metadata.user_id

    if (!userId) {
      console.error('No user_id in subscription metadata')
      return
    }

    // Update user status
    await supabase
      .from('users')
      .update({
        subscription_status: 'canceled',
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    // Update subscription record
    await supabase
      .from('subscriptions')
      .update({
        status: 'canceled',
        canceled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscription.id)

    // Log cancellation
    await SecurityAudit.logAccess({
      userId,
      action: 'subscription_change' as any,
      securityLevel: SecurityLevel.PERSONAL,
      ipAddress: 'stripe-webhook',
      userAgent: 'stripe-webhook',
      dataAccessed: ['subscription_canceled']
    })

    console.log(`Subscription canceled for user ${userId}`)
  }

  async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
    const subscriptionId = invoice.subscription as string
    
    if (!subscriptionId) return

    // Get subscription to find user
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    const userId = subscription.metadata.user_id

    if (!userId) return

    // Log successful payment
    await SecurityAudit.logAccess({
      userId,
      action: 'subscription_change' as any,
      securityLevel: SecurityLevel.PERSONAL,
      ipAddress: 'stripe-webhook',
      userAgent: 'stripe-webhook',
      dataAccessed: ['payment_succeeded']
    })

    // Track usage event
    await supabase
      .from('usage_events')
      .insert({
        user_id: userId,
        event_type: 'payment_succeeded',
        metadata: {
          invoice_id: invoice.id,
          amount_paid: invoice.amount_paid,
          currency: invoice.currency
        }
      })

    console.log(`Payment succeeded for user ${userId}: €${invoice.amount_paid / 100}`)
  }

  async function handlePaymentFailed(invoice: Stripe.Invoice) {
    const subscriptionId = invoice.subscription as string
    
    if (!subscriptionId) return

    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    const userId = subscription.metadata.user_id

    if (!userId) return

    // Log failed payment
    await SecurityAudit.logAccess({
      userId,
      action: 'subscription_change' as any,
      securityLevel: SecurityLevel.PERSONAL,
      ipAddress: 'stripe-webhook',
      userAgent: 'stripe-webhook',
      success: false,
      failureReason: 'payment_failed',
      dataAccessed: ['payment_failed']
    })

    // Track usage event
    await supabase
      .from('usage_events')
      .insert({
        user_id: userId,
        event_type: 'payment_failed',
        metadata: {
          invoice_id: invoice.id,
          amount_due: invoice.amount_due,
          currency: invoice.currency,
          failure_reason: invoice.last_finalization_error?.message
        }
      })

    console.log(`Payment failed for user ${userId}`)
  }

  async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    const userId = session.metadata?.user_id

    if (!userId) {
      console.error('No user_id in checkout session metadata')
      return
    }

    // Update user with customer ID if not already set
    if (session.customer) {
      await supabase
        .from('users')
        .update({
          stripe_customer_id: session.customer as string,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
    }

    // Log successful checkout
    await SecurityAudit.logAccess({
      userId,
      action: 'subscription_change' as any,
      securityLevel: SecurityLevel.PERSONAL,
      ipAddress: 'stripe-webhook',
      userAgent: 'stripe-webhook',
      dataAccessed: ['checkout_completed']
    })

    // Track usage event
    await supabase
      .from('usage_events')
      .insert({
        user_id: userId,
        event_type: 'checkout_completed',
        metadata: {
          session_id: session.id,
          amount_total: session.amount_total,
          currency: session.currency
        }
      })

    console.log(`Checkout completed for user ${userId}`)
  }
}