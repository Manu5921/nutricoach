import { NextRequest, NextResponse } from 'next/server'

// API endpoint for business metrics (MRR, CAC, LTV, etc.)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('timeRange') || '30d'
    
    // Get business metrics based on time range
    const metrics = await getBusinessMetrics(timeRange)
    
    return NextResponse.json(metrics)
    
  } catch (error) {
    console.error('Business metrics API error:', error)
    return NextResponse.json({ error: 'Failed to fetch business metrics' }, { status: 500 })
  }
}

// Calculate business metrics from various data sources
async function getBusinessMetrics(timeRange: string) {
  // Get date range
  const { startDate, endDate } = getDateRange(timeRange)
  
  // Fetch data from multiple sources
  const [
    subscriptionData,
    userEngagementData,
    marketingData,
    churnData
  ] = await Promise.all([
    getSubscriptionMetrics(startDate, endDate),
    getUserEngagementMetrics(startDate, endDate),
    getMarketingMetrics(startDate, endDate),
    getChurnMetrics(startDate, endDate)
  ])

  // Calculate derived metrics
  const mrr = calculateMRR(subscriptionData)
  const cac = calculateCAC(marketingData, subscriptionData)
  const ltv = calculateLTV(subscriptionData, churnData)
  const conversionFunnel = calculateConversionFunnel(userEngagementData, subscriptionData)
  const churnAnalysis = calculateChurnAnalysis(churnData)

  return {
    mrr,
    customers: {
      total: subscriptionData.totalCustomers,
      active: subscriptionData.activeCustomers,
      trial: subscriptionData.trialCustomers,
      churn: churnData.churnedCustomers
    },
    cac,
    ltv,
    conversionFunnel,
    churnAnalysis
  }
}

// Helper function to get date range based on timeRange parameter
function getDateRange(timeRange: string) {
  const endDate = new Date()
  const startDate = new Date()
  
  switch (timeRange) {
    case '7d':
      startDate.setDate(endDate.getDate() - 7)
      break
    case '30d':
      startDate.setDate(endDate.getDate() - 30)
      break
    case '90d':
      startDate.setDate(endDate.getDate() - 90)
      break
    case '1y':
      startDate.setFullYear(endDate.getFullYear() - 1)
      break
    default:
      startDate.setDate(endDate.getDate() - 30)
  }
  
  return { startDate, endDate }
}

// Fetch subscription metrics from database
async function getSubscriptionMetrics(startDate: Date, endDate: Date) {
  // TODO: Replace with actual database queries when Supabase is fully configured
  // For now, return mock data with realistic values
  
  // Mock data simulating real subscription metrics
  const mockData = {
    totalCustomers: 1245,
    activeCustomers: 1098,
    trialCustomers: 147,
    newCustomers: 89,
    subscriptions: [
      { type: 'basic', count: 456, mrr: 4560 },
      { type: 'premium', count: 387, mrr: 9675 },
      { type: 'family', count: 255, mrr: 10200 }
    ],
    previousMonthMrr: 23150,
    currentMrr: 24435
  }

  /* 
  // Example of actual database query structure:
  const { createClient } = require('@supabase/supabase-js')
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)
  
  const { data, error } = await supabase
    .from('subscriptions')
    .select(`
      *,
      users!inner(created_at, status)
    `)
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
    .eq('status', 'active')
  */

  return mockData
}

// Fetch user engagement metrics
async function getUserEngagementMetrics(startDate: Date, endDate: Date) {
  // Mock engagement data
  return {
    visitors: 12543,
    signups: 892,
    activations: 456,
    pageViews: 45623,
    avgSessionDuration: 342, // seconds
    bounceRate: 0.34
  }
}

// Fetch marketing metrics
async function getMarketingMetrics(startDate: Date, endDate: Date) {
  // Mock marketing data
  return {
    adSpend: 3450, // EUR
    leads: 1245,
    qualifiedLeads: 456,
    conversions: 89,
    channels: [
      { name: 'Google Ads', spend: 1500, conversions: 45 },
      { name: 'Facebook Ads', spend: 1200, conversions: 32 },
      { name: 'Content Marketing', spend: 750, conversions: 12 }
    ]
  }
}

// Fetch churn metrics
async function getChurnMetrics(startDate: Date, endDate: Date) {
  // Mock churn data
  return {
    churnedCustomers: 78,
    totalCustomers: 1245,
    avgLifetimeMonths: 14.5,
    churnReasons: [
      { reason: 'price', count: 23 },
      { reason: 'lack_of_use', count: 19 },
      { reason: 'competitor', count: 15 },
      { reason: 'feature_request', count: 12 },
      { reason: 'other', count: 9 }
    ]
  }
}

// Calculate Monthly Recurring Revenue (MRR)
function calculateMRR(subscriptionData: any) {
  const currentMrr = subscriptionData.currentMrr
  const previousMrr = subscriptionData.previousMonthMrr
  const growth = ((currentMrr - previousMrr) / previousMrr) * 100

  return {
    current: currentMrr,
    previousMonth: previousMrr,
    growth: growth
  }
}

// Calculate Customer Acquisition Cost (CAC)
function calculateCAC(marketingData: any, subscriptionData: any) {
  const totalSpend = marketingData.adSpend
  const newCustomers = subscriptionData.newCustomers
  const cac = newCustomers > 0 ? totalSpend / newCustomers : 0
  
  // Calculate trend (mock previous period)
  const previousPeriodCAC = 35.5 // Mock previous CAC
  const trend = ((cac - previousPeriodCAC) / previousPeriodCAC) * 100

  return {
    value: cac,
    trend: trend
  }
}

// Calculate Lifetime Value (LTV)
function calculateLTV(subscriptionData: any, churnData: any) {
  const avgMrr = subscriptionData.currentMrr / subscriptionData.activeCustomers
  const avgLifetimeMonths = churnData.avgLifetimeMonths
  const ltv = avgMrr * avgLifetimeMonths
  
  const cac = 38.76 // From CAC calculation
  const ltvCacRatio = ltv / cac

  return {
    value: ltv,
    ltvCacRatio: ltvCacRatio
  }
}

// Calculate conversion funnel metrics
function calculateConversionFunnel(engagementData: any, subscriptionData: any) {
  const visitors = engagementData.visitors
  const signups = engagementData.signups
  const trials = subscriptionData.trialCustomers
  const paid = subscriptionData.newCustomers
  
  const conversionRate = (paid / visitors) * 100

  return {
    visitors,
    signups,
    trials,
    paid,
    conversionRate
  }
}

// Calculate churn analysis
function calculateChurnAnalysis(churnData: any) {
  const churnRate = (churnData.churnedCustomers / churnData.totalCustomers) * 100
  
  // AI-powered churn prediction (mock)
  const prediction = churnRate * 1.15 // Predict 15% increase based on trends
  
  // Average days to churn
  const avgDaysToChurn = churnData.avgLifetimeMonths * 30 * 0.7 // 70% of lifetime

  return {
    rate: churnRate,
    prediction: prediction,
    avgDaysToChurn: Math.round(avgDaysToChurn)
  }
}