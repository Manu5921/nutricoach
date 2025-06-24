# 💳 STRIPE INTEGRATION - NUTRICOACH

## 🎯 MODÈLE ÉCONOMIQUE SIMPLIFIÉ

### 💰 **Pricing Strategy**
```bash
# Abonnement unique
Plan Premium: 6,99€/mois
- Accès complet base recettes anti-inflammatoires
- Génération menus personnalisés illimités  
- Conseils IA nutritionnels
- Export PDF/partage
- Support prioritaire

# Pas de freemium = conversion focus immédiate
```

### 🔒 **Paywall Complet**
```javascript
// Strategy: Trial 7 jours puis paywall strict
const PRICING = {
  trial_days: 7,
  monthly_price: 6.99,
  currency: 'EUR',
  stripe_price_id: 'price_nutricoach_monthly'
};

// Après 7 jours: Accès bloqué sans abonnement
```

---

## 🛠️ SETUP STRIPE TECHNIQUE

### 📦 **Installation & Config**
```bash
# Stripe SDK
pnpm add stripe @stripe/stripe-js

# Webhook handling
pnpm add micro stripe-webhook

# UI components
pnpm add @radix-ui/react-dialog
pnpm add @radix-ui/react-alert-dialog
```

### 🔧 **Variables Environnement**
```bash
# .env.local
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Price IDs
STRIPE_PRICE_MONTHLY=price_1234567890
STRIPE_PRICE_YEARLY=price_0987654321  # Future

# URLs
STRIPE_SUCCESS_URL=https://nutricoach.app/dashboard
STRIPE_CANCEL_URL=https://nutricoach.app/pricing
```

---

## 🏗️ ARCHITECTURE ABONNEMENTS

### 📊 **Database Schema Supabase**
```sql
-- Users table extension
ALTER TABLE users ADD COLUMN IF NOT EXISTS
  stripe_customer_id VARCHAR(255),
  subscription_status VARCHAR(50) DEFAULT 'inactive',
  subscription_id VARCHAR(255),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',
  created_at TIMESTAMPTZ DEFAULT NOW();

-- Subscriptions tracking
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  stripe_subscription_id VARCHAR(255) UNIQUE NOT NULL,
  stripe_customer_id VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL, -- active, canceled, past_due, etc.
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Usage tracking pour analytics
CREATE TABLE usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  event_type VARCHAR(100) NOT NULL, -- menu_generated, recipe_viewed, etc.
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB
);
```

### 🔐 **Middleware Paywall**
```typescript
// middleware/subscription.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

export async function subscriptionMiddleware(req: NextRequest) {
  const supabase = createMiddlewareClient({ req, res });
  
  // Check auth
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.redirect(new URL('/login', req.url));
  }
  
  // Check subscription status
  const { data: user } = await supabase
    .from('users')
    .select('subscription_status, trial_ends_at')
    .eq('id', session.user.id)
    .single();
  
  const now = new Date();
  const trialEnded = user?.trial_ends_at && new Date(user.trial_ends_at) < now;
  const hasActiveSubscription = user?.subscription_status === 'active';
  
  // Block access if trial ended and no subscription
  if (trialEnded && !hasActiveSubscription) {
    return NextResponse.redirect(new URL('/pricing', req.url));
  }
  
  return NextResponse.next();
}

// Apply to protected routes
export const config = {
  matcher: ['/dashboard/:path*', '/recipes/:path*', '/menu/:path*']
};
```

---

## 💳 STRIPE CHECKOUT FLOW

### 🛒 **Checkout Session API**
```typescript
// app/api/stripe/checkout/route.ts
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();
    
    // Get or create Stripe customer
    const { data: user } = await supabase
      .from('users')
      .select('stripe_customer_id, email')
      .eq('id', userId)
      .single();
    
    let customerId = user.stripe_customer_id;
    
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { user_id: userId }
      });
      
      customerId = customer.id;
      
      // Save customer ID
      await supabase
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('id', userId);
    }
    
    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{
        price: process.env.STRIPE_PRICE_MONTHLY,
        quantity: 1
      }],
      success_url: `${process.env.NEXT_PUBLIC_URL}/dashboard?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/pricing?canceled=true`,
      metadata: { user_id: userId }
    });
    
    return Response.json({ sessionId: session.id });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return Response.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}
```

### 🎨 **Pricing Page Component**
```typescript
// app/pricing/page.tsx
'use client';

import { loadStripe } from '@stripe/stripe-js';
import { Button } from '@/components/ui/button';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function PricingPage() {
  const handleSubscribe = async () => {
    const stripe = await stripePromise;
    
    // Get current user
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login');
      return;
    }
    
    // Create checkout session
    const response = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: session.user.id })
    });
    
    const { sessionId } = await response.json();
    
    // Redirect to Stripe Checkout
    const { error } = await stripe!.redirectToCheckout({ sessionId });
    if (error) console.error('Stripe redirect error:', error);
  };
  
  return (
    <div className="pricing-container max-w-4xl mx-auto py-16 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">
          Nutrition Anti-Inflammatoire Personnalisée
        </h1>
        <p className="text-xl text-gray-600">
          Recettes + conseils IA pour une alimentation saine optimisée
        </p>
      </div>
      
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md mx-auto border-2 border-green-200">
        <div className="text-center">
          <h3 className="text-2xl font-bold mb-2">Plan Premium</h3>
          <div className="text-4xl font-bold text-green-600 mb-1">6,99€</div>
          <div className="text-gray-500 mb-6">par mois</div>
          
          <div className="space-y-4 mb-8 text-left">
            <div className="flex items-center gap-3">
              <span className="text-green-500">✓</span>
              <span>Base complète recettes anti-inflammatoires</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-green-500">✓</span>
              <span>Génération menus personnalisés illimités</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-green-500">✓</span>
              <span>Conseils IA nutritionnels adaptatifs</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-green-500">✓</span>
              <span>Export PDF et partage</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-green-500">✓</span>
              <span>Support prioritaire</span>
            </div>
          </div>
          
          <Button 
            onClick={handleSubscribe}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-lg font-semibold"
          >
            Commencer maintenant
          </Button>
          
          <div className="text-sm text-gray-500 mt-4">
            Essai gratuit 7 jours • Résiliation facile
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## 🔔 WEBHOOKS STRIPE

### 🎣 **Webhook Handler**
```typescript
// app/api/stripe/webhook/route.ts
import { headers } from 'next/headers';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  const body = await req.text();
  const sig = headers().get('stripe-signature')!;
  
  let event: Stripe.Event;
  
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return Response.json({ error: 'Invalid signature' }, { status: 400 });
  }
  
  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      await handleSubscriptionChange(event.data.object as Stripe.Subscription);
      break;
      
    case 'customer.subscription.deleted':
      await handleSubscriptionCanceled(event.data.object as Stripe.Subscription);
      break;
      
    case 'invoice.payment_succeeded':
      await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
      break;
      
    case 'invoice.payment_failed':
      await handlePaymentFailed(event.data.object as Stripe.Invoice);
      break;
  }
  
  return Response.json({ received: true });
}

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  
  // Get user by customer ID
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();
  
  if (!user) return;
  
  // Update subscription status
  await supabase
    .from('users')
    .update({
      subscription_status: subscription.status,
      subscription_id: subscription.id,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString()
    })
    .eq('id', user.id);
  
  // Update subscriptions table
  await supabase
    .from('subscriptions')
    .upsert({
      user_id: user.id,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: customerId,
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end
    });
}
```

---

## 📊 ANALYTICS & MÉTRIQUES

### 💰 **Revenue Tracking**
```typescript
// utils/analytics.ts
export class RevenueAnalytics {
  static async trackSubscription(userId: string, amount: number) {
    // PostHog revenue event
    posthog.capture('subscription_started', {
      user_id: userId,
      revenue: amount,
      currency: 'EUR',
      plan: 'premium_monthly'
    });
    
    // Internal analytics
    await supabase
      .from('usage_events')
      .insert({
        user_id: userId,
        event_type: 'subscription_started',
        metadata: { amount, currency: 'EUR' }
      });
  }
  
  static async trackChurn(userId: string, reason?: string) {
    posthog.capture('subscription_canceled', {
      user_id: userId,
      churn_reason: reason
    });
  }
  
  static async calculateMRR(): Promise<number> {
    const { data: activeSubscriptions } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('status', 'active');
    
    return (activeSubscriptions?.length || 0) * 6.99;
  }
}
```

### 📈 **Dashboard Metrics**
```typescript
// Key metrics pour dashboard admin
const metrics = {
  mrr: await RevenueAnalytics.calculateMRR(),
  active_subscribers: await getActiveSubscribers(),
  churn_rate: await getChurnRate(),
  trial_conversion: await getTrialConversionRate(),
  avg_session_duration: await getAvgSessionDuration()
};
```

---

## 🎯 STRATÉGIE LANCEMENT

### 🚀 **Phase 1** *(Semaine 1-2)*
- [ ] Setup Stripe complet + webhooks
- [ ] Paywall middleware fonctionnel
- [ ] Trial 7 jours opérationnel
- [ ] Pricing page optimisée

### 💰 **Phase 2** *(Semaine 3-4)*
- [ ] Analytics revenue tracking
- [ ] Dashboard admin métriques
- [ ] Email automation (welcome, payment failed, etc.)
- [ ] Support customer Stripe Portal

### 📊 **Objectifs Q1**
```
🎯 100 abonnés = 699€ MRR
🎯 Churn rate <10%/mois
🎯 Trial conversion >15%
🎯 Customer satisfaction >4.2/5
```

**Revenue potentiel Année 1 :** 500 abonnés × 6,99€ = **3,495€ MRR** = **41,940€ ARR** 🚀