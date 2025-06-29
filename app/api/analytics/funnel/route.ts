import { NextRequest, NextResponse } from 'next/server'

// API endpoint for conversion funnel analysis
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('timeRange') || '30d'
    const source = searchParams.get('source') // Optional traffic source filter
    
    // Get funnel data based on parameters
    const funnelData = await getFunnelAnalysis(timeRange, source)
    
    return NextResponse.json(funnelData)
    
  } catch (error) {
    console.error('Funnel analysis API error:', error)
    return NextResponse.json({ error: 'Failed to fetch funnel analysis' }, { status: 500 })
  }
}

// Calculate detailed conversion funnel analysis
async function getFunnelAnalysis(timeRange: string, source?: string) {
  const { startDate, endDate } = getDateRange(timeRange)
  
  // Fetch funnel data from various sources
  const [
    trafficData,
    engagementData,
    conversionData,
    sourceBreakdown
  ] = await Promise.all([
    getTrafficData(startDate, endDate, source),
    getEngagementData(startDate, endDate, source),
    getConversionData(startDate, endDate, source),
    getSourceBreakdown(startDate, endDate)
  ])
  
  // Calculate funnel steps and conversion rates
  const funnelSteps = calculateFunnelSteps(trafficData, engagementData, conversionData)
  const dropoffAnalysis = calculateDropoffAnalysis(funnelSteps)
  const optimizationOpportunities = identifyOptimizationOpportunities(funnelSteps, dropoffAnalysis)
  
  return {
    overview: funnelSteps,
    dropoffAnalysis,
    sourceBreakdown,
    optimizationOpportunities,
    timeRange,
    source: source || 'all'
  }
}

// Helper function to get date range
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

// Get traffic data
async function getTrafficData(startDate: Date, endDate: Date, source?: string) {
  // TODO: Integrate with Google Analytics API or database
  // Mock data for now
  return {
    totalVisitors: 12543,
    uniqueVisitors: 8932,
    pageViews: 45623,
    sessions: 15432,
    avgSessionDuration: 342,
    bounceRate: 0.34,
    topPages: [
      { page: '/', visitors: 8932, conversions: 245 },
      { page: '/pricing', visitors: 3421, conversions: 189 },
      { page: '/features', visitors: 2156, conversions: 87 },
      { page: '/signup', visitors: 1876, conversions: 456 }
    ]
  }
}

// Get engagement data
async function getEngagementData(startDate: Date, endDate: Date, source?: string) {
  // Mock engagement metrics
  return {
    signupFormViews: 3456,
    signupAttempts: 1234,
    signupCompletions: 892,
    emailVerifications: 856,
    firstLogin: 789,
    profileCompletions: 645,
    featureActivations: 456,
    trialStarted: 234,
    trialCompleted: 89
  }
}

// Get conversion data
async function getConversionData(startDate: Date, endDate: Date, source?: string) {
  // Mock conversion metrics
  return {
    checkoutInitiated: 156,
    paymentInfo: 134,
    subscriptionPurchased: 89,
    subscriptionActive: 87,
    customerRetained: 76
  }
}

// Get traffic source breakdown
async function getSourceBreakdown(startDate: Date, endDate: Date) {
  // Mock source breakdown
  return [
    {
      source: 'organic_search',
      visitors: 4523,
      conversions: 34,
      conversionRate: 0.75,
      revenue: 850
    },
    {
      source: 'paid_search',
      visitors: 2134,
      conversions: 28,
      conversionRate: 1.31,
      revenue: 700
    },
    {
      source: 'social_media',
      visitors: 1876,
      conversions: 15,
      conversionRate: 0.80,
      revenue: 375
    },
    {
      source: 'direct',
      visitors: 1567,
      conversions: 18,
      conversionRate: 1.15,
      revenue: 450
    },
    {
      source: 'email',
      visitors: 1234,
      conversions: 12,
      conversionRate: 0.97,
      revenue: 300
    },
    {
      source: 'referral',
      visitors: 987,
      conversions: 8,
      conversionRate: 0.81,
      revenue: 200
    }
  ]
}

// Calculate funnel steps with conversion rates
function calculateFunnelSteps(trafficData: any, engagementData: any, conversionData: any) {
  const steps = [
    {
      step: 'Visiteurs',
      count: trafficData.totalVisitors,
      percentage: 100,
      conversionRate: 100
    },
    {
      step: 'Pages vues',
      count: trafficData.pageViews,
      percentage: (trafficData.pageViews / trafficData.totalVisitors) * 100,
      conversionRate: (trafficData.pageViews / trafficData.totalVisitors) * 100
    },
    {
      step: 'Formulaire inscription vu',
      count: engagementData.signupFormViews,
      percentage: (engagementData.signupFormViews / trafficData.totalVisitors) * 100,
      conversionRate: (engagementData.signupFormViews / trafficData.pageViews) * 100
    },
    {
      step: 'Tentative inscription',
      count: engagementData.signupAttempts,
      percentage: (engagementData.signupAttempts / trafficData.totalVisitors) * 100,
      conversionRate: (engagementData.signupAttempts / engagementData.signupFormViews) * 100
    },
    {
      step: 'Inscription complétée',
      count: engagementData.signupCompletions,
      percentage: (engagementData.signupCompletions / trafficData.totalVisitors) * 100,
      conversionRate: (engagementData.signupCompletions / engagementData.signupAttempts) * 100
    },
    {
      step: 'Email vérifié',
      count: engagementData.emailVerifications,
      percentage: (engagementData.emailVerifications / trafficData.totalVisitors) * 100,
      conversionRate: (engagementData.emailVerifications / engagementData.signupCompletions) * 100
    },
    {
      step: 'Première connexion',
      count: engagementData.firstLogin,
      percentage: (engagementData.firstLogin / trafficData.totalVisitors) * 100,
      conversionRate: (engagementData.firstLogin / engagementData.emailVerifications) * 100
    },
    {
      step: 'Profil complété',
      count: engagementData.profileCompletions,
      percentage: (engagementData.profileCompletions / trafficData.totalVisitors) * 100,
      conversionRate: (engagementData.profileCompletions / engagementData.firstLogin) * 100
    },
    {
      step: 'Fonctionnalité utilisée',
      count: engagementData.featureActivations,
      percentage: (engagementData.featureActivations / trafficData.totalVisitors) * 100,
      conversionRate: (engagementData.featureActivations / engagementData.profileCompletions) * 100
    },
    {
      step: 'Essai démarré',
      count: engagementData.trialStarted,
      percentage: (engagementData.trialStarted / trafficData.totalVisitors) * 100,
      conversionRate: (engagementData.trialStarted / engagementData.featureActivations) * 100
    },
    {
      step: 'Checkout initié',
      count: conversionData.checkoutInitiated,
      percentage: (conversionData.checkoutInitiated / trafficData.totalVisitors) * 100,
      conversionRate: (conversionData.checkoutInitiated / engagementData.trialStarted) * 100
    },
    {
      step: 'Infos paiement',
      count: conversionData.paymentInfo,
      percentage: (conversionData.paymentInfo / trafficData.totalVisitors) * 100,
      conversionRate: (conversionData.paymentInfo / conversionData.checkoutInitiated) * 100
    },
    {
      step: 'Abonnement acheté',
      count: conversionData.subscriptionPurchased,
      percentage: (conversionData.subscriptionPurchased / trafficData.totalVisitors) * 100,
      conversionRate: (conversionData.subscriptionPurchased / conversionData.paymentInfo) * 100
    },
    {
      step: 'Client actif',
      count: conversionData.subscriptionActive,
      percentage: (conversionData.subscriptionActive / trafficData.totalVisitors) * 100,
      conversionRate: (conversionData.subscriptionActive / conversionData.subscriptionPurchased) * 100
    },
    {
      step: 'Client fidélisé (30j)',
      count: conversionData.customerRetained,
      percentage: (conversionData.customerRetained / trafficData.totalVisitors) * 100,
      conversionRate: (conversionData.customerRetained / conversionData.subscriptionActive) * 100
    }
  ]
  
  return steps
}

// Calculate dropoff analysis
function calculateDropoffAnalysis(steps: any[]) {
  const dropoffs = []
  
  for (let i = 1; i < steps.length; i++) {
    const currentStep = steps[i]
    const previousStep = steps[i - 1]
    
    const dropoffCount = previousStep.count - currentStep.count
    const dropoffPercentage = (dropoffCount / previousStep.count) * 100
    
    dropoffs.push({
      from: previousStep.step,
      to: currentStep.step,
      dropoffCount,
      dropoffPercentage,
      severity: getDropoffSeverity(dropoffPercentage)
    })
  }
  
  return dropoffs
}

// Determine dropoff severity
function getDropoffSeverity(dropoffPercentage: number): 'low' | 'medium' | 'high' | 'critical' {
  if (dropoffPercentage < 10) return 'low'
  if (dropoffPercentage < 25) return 'medium'
  if (dropoffPercentage < 50) return 'high'
  return 'critical'
}

// Identify optimization opportunities
function identifyOptimizationOpportunities(steps: any[], dropoffs: any[]) {
  const opportunities = []
  
  // Find the biggest dropoff points
  const criticalDropoffs = dropoffs
    .filter(d => d.severity === 'critical' || d.severity === 'high')
    .sort((a, b) => b.dropoffPercentage - a.dropoffPercentage)
    .slice(0, 3)
  
  for (const dropoff of criticalDropoffs) {
    opportunities.push({
      priority: dropoff.severity === 'critical' ? 'high' : 'medium',
      area: dropoff.to,
      issue: `${dropoff.dropoffPercentage.toFixed(1)}% des utilisateurs abandonnent entre "${dropoff.from}" et "${dropoff.to}"`,
      suggestions: getOptimizationSuggestions(dropoff.to),
      potentialImpact: calculatePotentialImpact(dropoff)
    })
  }
  
  // Add conversion rate opportunities
  const lowConversionSteps = steps.filter(s => s.conversionRate < 50 && s.step !== 'Visiteurs')
  for (const step of lowConversionSteps.slice(0, 2)) {
    opportunities.push({
      priority: 'medium',
      area: step.step,
      issue: `Taux de conversion faible: ${step.conversionRate.toFixed(1)}%`,
      suggestions: getOptimizationSuggestions(step.step),
      potentialImpact: calculateConversionImpact(step)
    })
  }
  
  return opportunities
}

// Get optimization suggestions based on funnel step
function getOptimizationSuggestions(stepName: string): string[] {
  const suggestions: { [key: string]: string[] } = {
    'Pages vues': [
      'Améliorer la vitesse de chargement des pages',
      'Optimiser le contenu pour réduire le taux de rebond',
      'Ajouter des CTA plus visibles'
    ],
    'Formulaire inscription vu': [
      'Améliorer le placement du formulaire d\'inscription',
      'Ajouter des témoignages près du formulaire',
      'Simplifier le design du formulaire'
    ],
    'Tentative inscription': [
      'Réduire le nombre de champs du formulaire',
      'Améliorer la validation en temps réel',
      'Ajouter l\'inscription sociale (Google, Facebook)'
    ],
    'Inscription complétée': [
      'Améliorer les messages d\'erreur',
      'Optimiser la validation côté client',
      'Ajouter un indicateur de progression'
    ],
    'Email vérifié': [
      'Améliorer l\'email de vérification',
      'Réduire le délai d\'envoi de l\'email',
      'Ajouter un rappel automatique'
    ],
    'Première connexion': [
      'Simplifier le processus de connexion',
      'Améliorer l\'onboarding initial',
      'Envoyer un email de bienvenue'
    ],
    'Profil complété': [
      'Gamifier la complétion du profil',
      'Expliquer les bénéfices de chaque information',
      'Rendre optionnels certains champs'
    ],
    'Fonctionnalité utilisée': [
      'Améliorer le tutoriel produit',
      'Ajouter des tooltips explicatifs',
      'Créer des tâches guidées'
    ],
    'Essai démarré': [
      'Simplifier l\'accès aux fonctionnalités premium',
      'Ajouter une démonstration interactive',
      'Personnaliser l\'expérience d\'essai'
    ],
    'Checkout initié': [
      'Optimiser la page de tarification',
      'Ajouter des garanties (remboursement)',
      'Montrer la valeur du produit'
    ],
    'Infos paiement': [
      'Simplifier le formulaire de paiement',
      'Ajouter plus d\'options de paiement',
      'Rassurer sur la sécurité'
    ],
    'Abonnement acheté': [
      'Optimiser le processus de paiement',
      'Réduire les frictions techniques',
      'Améliorer la gestion des erreurs'
    ]
  }
  
  return suggestions[stepName] || ['Analyser plus en détail cette étape', 'Faire des tests A/B', 'Collecter du feedback utilisateur']
}

// Calculate potential impact of fixing a dropoff
function calculatePotentialImpact(dropoff: any): string {
  const improvementPotential = dropoff.dropoffPercentage * 0.3 // Assume 30% improvement possible
  return `Réduction de ${improvementPotential.toFixed(1)}% du dropoff pourrait augmenter les conversions de ${(improvementPotential * 0.1).toFixed(1)}%`
}

// Calculate potential impact of improving conversion rate
function calculateConversionImpact(step: any): string {
  const currentRate = step.conversionRate
  const targetRate = Math.min(currentRate * 1.5, 85) // 50% improvement, capped at 85%
  const improvement = targetRate - currentRate
  return `Amélioration de ${improvement.toFixed(1)} points de pourcentage possible`
}