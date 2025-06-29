'use client'

import { useState, useEffect } from 'react'
import { trackBusinessEvents } from '@/components/analytics/GoogleAnalytics'

interface BusinessMetrics {
  mrr: {
    current: number
    previousMonth: number
    growth: number
  }
  customers: {
    total: number
    active: number
    trial: number
    churn: number
  }
  cac: {
    value: number
    trend: number
  }
  ltv: {
    value: number
    ltvCacRatio: number
  }
  conversionFunnel: {
    visitors: number
    signups: number
    trials: number
    paid: number
    conversionRate: number
  }
  churnAnalysis: {
    rate: number
    prediction: number
    avgDaysToChurn: number
  }
}

interface CohortData {
  cohort: string
  size: number
  retention: {
    week1: number
    week4: number
    week12: number
    week24: number
  }
}

export default function BusinessDashboard() {
  const [metrics, setMetrics] = useState<BusinessMetrics | null>(null)
  const [cohorts, setCohorts] = useState<CohortData[]>([])
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchBusinessMetrics()
    fetchCohortData()
    
    // Track dashboard access
    trackBusinessEvents.featureUsed('business_dashboard')
  }, [timeRange])

  const fetchBusinessMetrics = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/analytics/business-metrics?timeRange=${timeRange}`)
      if (!response.ok) {
        throw new Error('Failed to fetch business metrics')
      }
      const data = await response.json()
      setMetrics(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const fetchCohortData = async () => {
    try {
      const response = await fetch(`/api/analytics/cohorts?timeRange=${timeRange}`)
      if (!response.ok) {
        throw new Error('Failed to fetch cohort data')
      }
      const data = await response.json()
      setCohorts(data)
    } catch (err) {
      console.error('Failed to fetch cohort data:', err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-6 w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-64 bg-gray-200 rounded-lg"></div>
              <div className="h-64 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h2 className="text-xl font-bold text-red-800 mb-2">Erreur de chargement</h2>
            <p className="text-red-600">{error}</p>
            <button 
              onClick={() => fetchBusinessMetrics()}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Réessayer
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!metrics) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <p className="text-gray-500">Aucune donnée disponible</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">📊 Business Intelligence</h1>
          <div className="flex gap-2">
            {(['7d', '30d', '90d', '1y'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  timeRange === range
                    ? 'bg-green-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* MRR */}
          <MetricCard
            title="MRR (Revenus Récurrents)"
            value={`${metrics.mrr.current.toLocaleString('fr-FR')} €`}
            change={metrics.mrr.growth}
            changeLabel={`vs mois précédent`}
            icon="💰"
            color="green"
          />

          {/* Customers */}
          <MetricCard
            title="Clients Actifs"
            value={metrics.customers.active.toString()}
            change={((metrics.customers.active - metrics.customers.total + metrics.customers.active) / (metrics.customers.total - metrics.customers.active)) * 100}
            changeLabel="nouveaux clients"
            icon="👥"
            color="blue"
          />

          {/* CAC */}
          <MetricCard
            title="Coût d'Acquisition (CAC)"
            value={`${metrics.cac.value.toFixed(2)} €`}
            change={metrics.cac.trend}
            changeLabel="vs période précédente"
            icon="🎯"
            color="orange"
          />

          {/* LTV/CAC Ratio */}
          <MetricCard
            title="Ratio LTV/CAC"
            value={metrics.ltv.ltvCacRatio.toFixed(1)}
            change={0} // Calculate from historical data
            changeLabel="(objectif: >3.0)"
            icon="📈"
            color="purple"
          />
        </div>

        {/* Charts and Detailed Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Conversion Funnel */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">🔄 Funnel de Conversion</h3>
            <ConversionFunnel data={metrics.conversionFunnel} />
          </div>

          {/* Churn Analysis */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">⚠️ Analyse du Churn</h3>
            <ChurnAnalysis data={metrics.churnAnalysis} />
          </div>
        </div>

        {/* Cohort Analysis */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">👥 Analyse de Cohortes</h3>
          <CohortTable cohorts={cohorts} />
        </div>

        {/* AI Insights */}
        <AIInsights metrics={metrics} />
      </div>
    </div>
  )
}

// Metric Card Component
function MetricCard({ 
  title, 
  value, 
  change, 
  changeLabel, 
  icon, 
  color 
}: {
  title: string
  value: string
  change: number
  changeLabel: string
  icon: string
  color: 'green' | 'blue' | 'orange' | 'purple'
}) {
  const colorClasses = {
    green: 'bg-green-50 border-green-200',
    blue: 'bg-blue-50 border-blue-200',
    orange: 'bg-orange-50 border-orange-200',
    purple: 'bg-purple-50 border-purple-200'
  }

  const changeColor = change >= 0 ? 'text-green-600' : 'text-red-600'
  const changeIcon = change >= 0 ? '↗️' : '↘️'

  return (
    <div className={`p-6 rounded-lg border ${colorClasses[color]}`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-700">{title}</h3>
        <span className="text-2xl">{icon}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
      <p className={`text-sm ${changeColor}`}>
        {changeIcon} {Math.abs(change).toFixed(1)}% {changeLabel}
      </p>
    </div>
  )
}

// Conversion Funnel Component
function ConversionFunnel({ data }: { data: BusinessMetrics['conversionFunnel'] }) {
  const steps = [
    { name: 'Visiteurs', value: data.visitors, percent: 100 },
    { name: 'Inscriptions', value: data.signups, percent: (data.signups / data.visitors) * 100 },
    { name: 'Essais', value: data.trials, percent: (data.trials / data.visitors) * 100 },
    { name: 'Payants', value: data.paid, percent: (data.paid / data.visitors) * 100 }
  ]

  return (
    <div className="space-y-4">
      {steps.map((step, index) => (
        <div key={step.name} className="relative">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">{step.name}</span>
            <span className="text-sm text-gray-500">
              {step.value.toLocaleString()} ({step.percent.toFixed(1)}%)
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-green-600 h-3 rounded-full transition-all duration-500" 
              style={{ width: `${step.percent}%` }}
            ></div>
          </div>
          {index < steps.length - 1 && (
            <div className="flex justify-center mt-2">
              <span className="text-xs text-gray-400">
                {((steps[index + 1].value / step.value) * 100).toFixed(1)}% conversion
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// Churn Analysis Component
function ChurnAnalysis({ data }: { data: BusinessMetrics['churnAnalysis'] }) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center p-4 bg-red-50 rounded-lg">
        <div>
          <p className="text-sm text-red-800">Taux de Churn Mensuel</p>
          <p className="text-2xl font-bold text-red-900">{data.rate.toFixed(1)}%</p>
        </div>
        <span className="text-3xl">⚠️</span>
      </div>
      
      <div className="flex justify-between items-center p-4 bg-yellow-50 rounded-lg">
        <div>
          <p className="text-sm text-yellow-800">Prédiction Churn (30j)</p>
          <p className="text-2xl font-bold text-yellow-900">{data.prediction.toFixed(1)}%</p>
        </div>
        <span className="text-3xl">🔮</span>
      </div>
      
      <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
        <div>
          <p className="text-sm text-blue-800">Durée Moyenne avant Churn</p>
          <p className="text-2xl font-bold text-blue-900">{data.avgDaysToChurn} jours</p>
        </div>
        <span className="text-3xl">⏱️</span>
      </div>
    </div>
  )
}

// Cohort Table Component
function CohortTable({ cohorts }: { cohorts: CohortData[] }) {
  if (!cohorts.length) {
    return (
      <div className="text-center text-gray-500 py-8">
        Données de cohortes non disponibles
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Cohorte</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Taille</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Semaine 1</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Semaine 4</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Semaine 12</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Semaine 24</th>
          </tr>
        </thead>
        <tbody>
          {cohorts.map((cohort) => (
            <tr key={cohort.cohort} className="border-b border-gray-100">
              <td className="py-3 px-4 text-sm text-gray-900">{cohort.cohort}</td>
              <td className="py-3 px-4 text-sm text-gray-900">{cohort.size}</td>
              <td className="py-3 px-4">
                <RetentionCell value={cohort.retention.week1} />
              </td>
              <td className="py-3 px-4">
                <RetentionCell value={cohort.retention.week4} />
              </td>
              <td className="py-3 px-4">
                <RetentionCell value={cohort.retention.week12} />
              </td>
              <td className="py-3 px-4">
                <RetentionCell value={cohort.retention.week24} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Retention Cell Component
function RetentionCell({ value }: { value: number }) {
  const getColor = (retention: number) => {
    if (retention >= 80) return 'bg-green-100 text-green-800'
    if (retention >= 60) return 'bg-yellow-100 text-yellow-800'
    if (retention >= 40) return 'bg-orange-100 text-orange-800'
    return 'bg-red-100 text-red-800'
  }

  return (
    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getColor(value)}`}>
      {value.toFixed(1)}%
    </span>
  )
}

// AI Insights Component
function AIInsights({ metrics }: { metrics: BusinessMetrics }) {
  const insights = generateInsights(metrics)

  return (
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-lg border border-purple-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">🤖 Insights IA</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {insights.map((insight, index) => (
          <div key={index} className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-start gap-3">
              <span className="text-2xl">{insight.icon}</span>
              <div>
                <h4 className="font-medium text-gray-900 mb-1">{insight.title}</h4>
                <p className="text-sm text-gray-600">{insight.description}</p>
                {insight.action && (
                  <p className="text-sm text-purple-600 mt-2 font-medium">
                    💡 {insight.action}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Generate AI-powered insights
function generateInsights(metrics: BusinessMetrics) {
  const insights = []

  // MRR Growth Analysis
  if (metrics.mrr.growth > 20) {
    insights.push({
      icon: '🚀',
      title: 'Croissance Excellente',
      description: `MRR en croissance de ${metrics.mrr.growth.toFixed(1)}%`,
      action: 'Maintenez cette dynamique en doublant les efforts marketing'
    })
  } else if (metrics.mrr.growth < 0) {
    insights.push({
      icon: '⚠️',
      title: 'Alerte MRR',
      description: `MRR en baisse de ${Math.abs(metrics.mrr.growth).toFixed(1)}%`,
      action: 'Analysez les causes de churn et améliorez la rétention'
    })
  }

  // LTV/CAC Analysis
  if (metrics.ltv.ltvCacRatio < 3) {
    insights.push({
      icon: '📊',
      title: 'Ratio LTV/CAC Faible',
      description: `Ratio actuel: ${metrics.ltv.ltvCacRatio.toFixed(1)} (objectif: >3.0)`,
      action: 'Optimisez les coûts d\'acquisition ou augmentez la lifetime value'
    })
  } else if (metrics.ltv.ltvCacRatio > 5) {
    insights.push({
      icon: '💎',
      title: 'Excellent ROI',
      description: `Ratio LTV/CAC de ${metrics.ltv.ltvCacRatio.toFixed(1)}`,
      action: 'Considérez augmenter le budget marketing pour accélérer la croissance'
    })
  }

  // Conversion Funnel Analysis
  if (metrics.conversionFunnel.conversionRate < 2) {
    insights.push({
      icon: '🔄',
      title: 'Conversion Faible',
      description: `Taux de conversion: ${metrics.conversionFunnel.conversionRate.toFixed(1)}%`,
      action: 'Optimisez le funnel: CTA, prix, onboarding'
    })
  }

  // Churn Analysis
  if (metrics.churnAnalysis.rate > 10) {
    insights.push({
      icon: '🚨',
      title: 'Churn Élevé',
      description: `Taux de churn: ${metrics.churnAnalysis.rate.toFixed(1)}%`,
      action: 'Implémentez des campagnes de rétention ciblées'
    })
  }

  return insights
}