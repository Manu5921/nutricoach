import { NextRequest, NextResponse } from 'next/server'

// API endpoint for cohort analysis
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('timeRange') || '30d'
    
    // Get cohort data based on time range
    const cohorts = await getCohortAnalysis(timeRange)
    
    return NextResponse.json(cohorts)
    
  } catch (error) {
    console.error('Cohort analysis API error:', error)
    return NextResponse.json({ error: 'Failed to fetch cohort analysis' }, { status: 500 })
  }
}

// Calculate cohort retention analysis
async function getCohortAnalysis(timeRange: string) {
  // Get cohort periods based on time range
  const cohortPeriods = getCohortPeriods(timeRange)
  
  // Calculate retention for each cohort
  const cohorts = []
  
  for (const period of cohortPeriods) {
    const cohortData = await calculateCohortRetention(period)
    cohorts.push(cohortData)
  }
  
  return cohorts
}

// Generate cohort periods based on time range
function getCohortPeriods(timeRange: string) {
  const periods = []
  const endDate = new Date()
  let periodsToAnalyze = 6 // Default to 6 periods
  
  switch (timeRange) {
    case '7d':
      periodsToAnalyze = 4
      break
    case '30d':
      periodsToAnalyze = 6
      break
    case '90d':
      periodsToAnalyze = 12
      break
    case '1y':
      periodsToAnalyze = 24
      break
  }
  
  for (let i = 0; i < periodsToAnalyze; i++) {
    const periodStart = new Date(endDate)
    periodStart.setMonth(endDate.getMonth() - i - 1)
    
    const periodEnd = new Date(endDate)
    periodEnd.setMonth(endDate.getMonth() - i)
    
    periods.push({
      label: formatCohortPeriod(periodStart),
      startDate: periodStart,
      endDate: periodEnd
    })
  }
  
  return periods.reverse() // Show oldest first
}

// Format cohort period label
function formatCohortPeriod(date: Date): string {
  return date.toLocaleDateString('fr-FR', { 
    year: 'numeric', 
    month: 'short' 
  })
}

// Calculate retention metrics for a specific cohort
async function calculateCohortRetention(period: any) {
  // TODO: Replace with actual database queries when Supabase is fully configured
  // For now, return mock data with realistic retention patterns
  
  const mockRetentionData = generateMockRetentionData(period.label)
  
  /* 
  // Example of actual database query structure:
  const { createClient } = require('@supabase/supabase-js')
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)
  
  // Get initial cohort size (users who signed up in this period)
  const { data: cohortUsers, error: cohortError } = await supabase
    .from('users')
    .select('id, created_at')
    .gte('created_at', period.startDate.toISOString())
    .lt('created_at', period.endDate.toISOString())
  
  const cohortSize = cohortUsers?.length || 0
  
  // Calculate retention for each time period
  const retentionMetrics = {}
  const checkPeriods = [7, 30, 90, 180] // days
  
  for (const days of checkPeriods) {
    const checkDate = new Date(period.endDate)
    checkDate.setDate(checkDate.getDate() + days)
    
    // Count users who were still active at this point
    const { data: activeUsers, error: activeError } = await supabase
      .from('user_activity')
      .select('user_id')
      .in('user_id', cohortUsers.map(u => u.id))
      .gte('last_active', checkDate.toISOString())
      .eq('status', 'active')
    
    const retainedCount = activeUsers?.length || 0
    const retentionRate = cohortSize > 0 ? (retainedCount / cohortSize) * 100 : 0
    
    retentionMetrics[`week${Math.floor(days / 7)}`] = retentionRate
  }
  */
  
  return {
    cohort: period.label,
    size: mockRetentionData.size,
    retention: mockRetentionData.retention
  }
}

// Generate realistic mock retention data
function generateMockRetentionData(cohortLabel: string) {
  // Simulate realistic retention patterns that decay over time
  const baseSize = Math.floor(Math.random() * 200) + 50 // 50-250 users per cohort
  
  // Typical SaaS retention patterns
  const week1Retention = 0.85 + (Math.random() * 0.1) // 85-95%
  const week4Retention = week1Retention * (0.7 + Math.random() * 0.15) // 70-85% of week1
  const week12Retention = week4Retention * (0.8 + Math.random() * 0.15) // 80-95% of week4  
  const week24Retention = week12Retention * (0.85 + Math.random() * 0.1) // 85-95% of week12
  
  return {
    size: baseSize,
    retention: {
      week1: week1Retention * 100,
      week4: week4Retention * 100,
      week12: week12Retention * 100,
      week24: week24Retention * 100
    }
  }
}