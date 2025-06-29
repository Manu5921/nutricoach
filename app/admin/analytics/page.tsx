'use client'

import { useState, useEffect } from 'react'
import { usePageTracking, useEngagementTracking } from '@/components/analytics/usePageTracking'
import BusinessDashboard from '@/components/admin/BusinessDashboard'
import { HeatmapVisualization } from '@/components/analytics/HeatmapTracker'
import PerformanceCorrelationAnalyzer from '@/components/analytics/PerformanceCorrelationAnalyzer'

interface AnalyticsTab {
  id: string
  name: string
  icon: string
  component: React.ComponentType<any>
}

export default function AnalyticsAdminPage() {
  const [activeTab, setActiveTab] = useState('business')
  const [isAuthorized, setIsAuthorized] = useState(false)

  // Track page and user engagement
  usePageTracking()
  useEngagementTracking()

  useEffect(() => {
    // Simple admin check (in real app, this would be more robust)
    const isAdmin = checkAdminAccess()
    setIsAuthorized(isAdmin)
  }, [])

  const checkAdminAccess = (): boolean => {
    // TODO: Implement proper admin authentication
    // For demo purposes, check for admin flag in localStorage
    const adminFlag = localStorage.getItem('nutricoach-admin-access')
    return adminFlag === 'true'
  }

  const tabs: AnalyticsTab[] = [
    {
      id: 'business',
      name: 'Business Intelligence',
      icon: '📊',
      component: BusinessDashboard
    },
    {
      id: 'heatmaps',
      name: 'Heatmaps & UX',
      icon: '🔥',
      component: HeatmapVisualization
    },
    {
      id: 'performance',
      name: 'Performance Correlation',
      icon: '⚡',
      component: PerformanceCorrelationAnalyzer
    },
    {
      id: 'ab-tests',
      name: 'A/B Tests',
      icon: '🧪',
      component: ABTestDashboard
    },
    {
      id: 'growth',
      name: 'Growth Automation',
      icon: '🚀',
      component: GrowthDashboard
    }
  ]

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Accès Administrateur Requis
          </h1>
          <p className="text-gray-600 mb-6">
            Cette section est réservée aux administrateurs. 
            Veuillez vous connecter avec un compte administrateur.
          </p>
          <button
            onClick={() => {
              // Demo: allow access for development
              localStorage.setItem('nutricoach-admin-access', 'true')
              setIsAuthorized(true)
            }}
            className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors"
          >
            Accès Demo (Développement)
          </button>
        </div>
      </div>
    )
  }

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || BusinessDashboard

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                🔍 Centre d'Analytics NutriCoach
              </h1>
              <p className="text-gray-600 mt-1">
                Tableau de bord complet pour l'analyse business et l'optimisation
              </p>
            </div>
            
            {/* Quick Stats */}
            <div className="hidden lg:flex gap-6">
              <QuickStat label="Visiteurs (24h)" value="1,234" trend="+12%" positive />
              <QuickStat label="Conversions" value="89" trend="+5%" positive />
              <QuickStat label="MRR" value="€24,435" trend="+8%" positive />
            </div>
          </div>
          
          {/* Navigation Tabs */}
          <div className="flex space-x-8 border-b border-gray-200">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ActiveComponent />
      </div>
    </div>
  )
}

// Quick Stat Component
function QuickStat({ label, value, trend, positive }: {
  label: string
  value: string
  trend: string
  positive: boolean
}) {
  return (
    <div className="text-center">
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-sm text-gray-600">{label}</div>
      <div className={`text-xs font-medium ${positive ? 'text-green-600' : 'text-red-600'}`}>
        {positive ? '↗️' : '↘️'} {trend}
      </div>
    </div>
  )
}

// A/B Test Dashboard Component
function ABTestDashboard() {
  const [tests, setTests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Mock A/B test data
    setTimeout(() => {
      setTests([
        {
          id: 'testimonials_style',
          name: 'Style des Témoignages',
          status: 'active',
          traffic: 50,
          variants: {
            control: { name: 'Métriques', conversions: 45, visitors: 1200 },
            variant: { name: 'Émotionnel', conversions: 52, visitors: 1150 }
          },
          significance: 85,
          winner: 'variant'
        },
        {
          id: 'cta_color',
          name: 'Couleur du CTA',
          status: 'active',
          traffic: 50,
          variants: {
            control: { name: 'Vert', conversions: 89, visitors: 2100 },
            variant: { name: 'Bleu', conversions: 92, visitors: 2080 }
          },
          significance: 67,
          winner: null
        }
      ])
      setLoading(false)
    }, 1000)
  }, [])

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Tests A/B Actifs</h2>
        <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
          Nouveau Test
        </button>
      </div>

      <div className="grid gap-6">
        {tests.map((test) => (
          <div key={test.id} className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{test.name}</h3>
                <span className={`inline-block px-2 py-1 text-xs rounded ${
                  test.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {test.status === 'active' ? 'Actif' : 'Inactif'}
                </span>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">{test.significance}%</div>
                <div className="text-sm text-gray-600">Signification</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">
                  Control: {test.variants.control.name}
                </h4>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-blue-800">Conversions:</span>
                    <span className="font-medium text-blue-900">{test.variants.control.conversions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-800">Visiteurs:</span>
                    <span className="font-medium text-blue-900">{test.variants.control.visitors}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-800">Taux:</span>
                    <span className="font-medium text-blue-900">
                      {((test.variants.control.conversions / test.variants.control.visitors) * 100).toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>

              <div className={`p-4 rounded-lg ${
                test.winner === 'variant' ? 'bg-green-50' : 'bg-purple-50'
              }`}>
                <h4 className={`font-medium mb-2 ${
                  test.winner === 'variant' ? 'text-green-900' : 'text-purple-900'
                }`}>
                  Variant: {test.variants.variant.name}
                  {test.winner === 'variant' && <span className="ml-2">🏆</span>}
                </h4>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className={test.winner === 'variant' ? 'text-green-800' : 'text-purple-800'}>
                      Conversions:
                    </span>
                    <span className={`font-medium ${
                      test.winner === 'variant' ? 'text-green-900' : 'text-purple-900'
                    }`}>
                      {test.variants.variant.conversions}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={test.winner === 'variant' ? 'text-green-800' : 'text-purple-800'}>
                      Visiteurs:
                    </span>
                    <span className={`font-medium ${
                      test.winner === 'variant' ? 'text-green-900' : 'text-purple-900'
                    }`}>
                      {test.variants.variant.visitors}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={test.winner === 'variant' ? 'text-green-800' : 'text-purple-800'}>
                      Taux:
                    </span>
                    <span className={`font-medium ${
                      test.winner === 'variant' ? 'text-green-900' : 'text-purple-900'
                    }`}>
                      {((test.variants.variant.conversions / test.variants.variant.visitors) * 100).toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 flex justify-between items-center">
              <div className="text-sm text-gray-600">
                Amélioration: {test.winner === 'variant' ? '+' : ''}{(
                  ((test.variants.variant.conversions / test.variants.variant.visitors) - 
                   (test.variants.control.conversions / test.variants.control.visitors)) /
                  (test.variants.control.conversions / test.variants.control.visitors) * 100
                ).toFixed(1)}%
              </div>
              <div className="flex gap-2">
                <button className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200">
                  Détails
                </button>
                <button className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200">
                  Arrêter
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Growth Dashboard Component
function GrowthDashboard() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Automatisations de Croissance</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <GrowthMetricCard
          title="Exit Intent Popup"
          icon="⚠️"
          status="active"
          conversions={23}
          impressions={456}
          conversionRate={5.04}
        />
        <GrowthMetricCard
          title="Push Notifications"
          icon="🔔"
          status="active"
          conversions={67}
          impressions={1234}
          conversionRate={5.43}
        />
        <GrowthMetricCard
          title="Email Automation"
          icon="📧"
          status="paused"
          conversions={34}
          impressions={890}
          conversionRate={3.82}
        />
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Campagnes de Croissance Récentes
        </h3>
        <div className="space-y-4">
          {[
            { name: 'Welcome Onboarding', sent: 234, opened: 187, clicked: 45, date: '2024-01-15' },
            { name: 'Trial Ending Reminder', sent: 89, opened: 67, clicked: 23, date: '2024-01-14' },
            { name: 'Feature Announcement', sent: 456, opened: 234, clicked: 67, date: '2024-01-13' }
          ].map((campaign, index) => (
            <div key={index} className="flex justify-between items-center py-3 border-b border-gray-100 last:border-0">
              <div>
                <div className="font-medium text-gray-900">{campaign.name}</div>
                <div className="text-sm text-gray-600">{campaign.date}</div>
              </div>
              <div className="flex gap-6 text-sm">
                <div className="text-center">
                  <div className="font-medium text-gray-900">{campaign.sent}</div>
                  <div className="text-gray-600">Envoyés</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-blue-600">{campaign.opened}</div>
                  <div className="text-gray-600">Ouverts</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-green-600">{campaign.clicked}</div>
                  <div className="text-gray-600">Cliqués</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Growth Metric Card Component
function GrowthMetricCard({ title, icon, status, conversions, impressions, conversionRate }: {
  title: string
  icon: string
  status: 'active' | 'paused' | 'stopped'
  conversions: number
  impressions: number
  conversionRate: number
}) {
  const statusColors = {
    active: 'bg-green-100 text-green-800',
    paused: 'bg-yellow-100 text-yellow-800',
    stopped: 'bg-red-100 text-red-800'
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{icon}</span>
          <h3 className="font-semibold text-gray-900">{title}</h3>
        </div>
        <span className={`px-2 py-1 text-xs rounded-full ${statusColors[status]}`}>
          {status === 'active' ? 'Actif' : status === 'paused' ? 'Pausé' : 'Arrêté'}
        </span>
      </div>
      
      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="text-gray-600">Conversions</span>
          <span className="font-medium text-gray-900">{conversions}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Impressions</span>
          <span className="font-medium text-gray-900">{impressions}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Taux de conversion</span>
          <span className="font-medium text-green-600">{conversionRate}%</span>
        </div>
      </div>
    </div>
  )
}