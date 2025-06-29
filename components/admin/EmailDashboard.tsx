'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-client';

interface Campaign {
  id: string;
  name: string;
  type: string;
  status: string;
  subject_line: string;
  recipients_count: number;
  delivered_count: number;
  opened_count: number;
  clicked_count: number;
  open_rate: number;
  click_rate: number;
  created_at: string;
  sent_at: string | null;
  scheduled_at: string | null;
}

interface Analytics {
  overview: {
    emails_sent: number;
    emails_delivered: number;
    emails_opened: number;
    emails_clicked: number;
    delivery_rate: number;
    open_rate: number;
    click_rate: number;
    unsubscribe_rate: number;
  };
  campaigns: {
    total: number;
    by_status: Record<string, number>;
  };
  subscribers: {
    new: number;
    active: number;
  };
}

export default function EmailDashboard() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'campaigns' | 'analytics'>('overview');

  const supabase = createClient();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchCampaigns(),
        fetchAnalytics()
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const fetchCampaigns = async () => {
    const response = await fetch('/api/email/campaigns?limit=10');
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erreur lors du chargement des campagnes');
    }
    const data = await response.json();
    setCampaigns(data.campaigns);
  };

  const fetchAnalytics = async () => {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    
    const response = await fetch(
      `/api/email/analytics?type=overview&start_date=${startDate.toISOString()}&end_date=${endDate.toISOString()}`
    );
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erreur lors du chargement des analytics');
    }
    const data = await response.json();
    setAnalytics(data);
  };

  const triggerScheduler = async () => {
    try {
      const response = await fetch('/api/email/scheduler', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SCHEDULER_TOKEN || 'default-scheduler-token'}`
        },
        body: JSON.stringify({ action: 'both' })
      });

      if (!response.ok) {
        throw new Error('Erreur lors du déclenchement du scheduler');
      }

      const result = await response.json();
      alert(`Scheduler exécuté: ${result.queue?.processed || 0} emails traités, ${result.workflows?.processedCount || 0} workflows traités`);
    } catch (err) {
      alert(`Erreur: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Brouillon' },
      scheduled: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Programmé' },
      sending: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'En cours' },
      sent: { bg: 'bg-green-100', text: 'text-green-800', label: 'Envoyé' },
      paused: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Pausé' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-800', label: 'Annulé' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const getTypeIcon = (type: string) => {
    const typeIcons = {
      newsletter: '📰',
      promotional: '🎯',
      educational: '📚',
      transactional: '📧',
      sequence: '🔄'
    };
    return typeIcons[type as keyof typeof typeIcons] || '📧';
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-300 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-300 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-300 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <h3 className="text-lg font-medium text-red-800">Erreur</h3>
          <p className="mt-1 text-sm text-red-700">{error}</p>
          <button
            onClick={fetchData}
            className="mt-3 bg-red-600 text-white px-4 py-2 rounded-md text-sm hover:bg-red-700"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          📧 Dashboard Email Marketing
        </h1>
        <div className="flex space-x-3">
          <button
            onClick={triggerScheduler}
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 font-medium"
          >
            ⚡ Déclencher Scheduler
          </button>
          <button
            onClick={fetchData}
            className="bg-green-600 text-white px-4 py-2 rounded-md text-sm hover:bg-green-700 font-medium"
          >
            🔄 Actualiser
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'overview', label: 'Vue d\'ensemble', icon: '📊' },
            { key: 'campaigns', label: 'Campagnes', icon: '📋' },
            { key: 'analytics', label: 'Analytics', icon: '📈' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`
                py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                ${activeTab === tab.key
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && analytics && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <span className="text-green-600 text-xl">📧</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Emails envoyés</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {analytics.overview.emails_sent.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <span className="text-blue-600 text-xl">📬</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Taux d'ouverture</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {analytics.overview.open_rate.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <span className="text-purple-600 text-xl">👆</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Taux de clic</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {analytics.overview.click_rate.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <span className="text-orange-600 text-xl">👥</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Abonnés actifs</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {analytics.subscribers.active.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Campaign Status Overview */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              État des campagnes (30 derniers jours)
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              {Object.entries(analytics.campaigns.by_status).map(([status, count]) => (
                <div key={status} className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{count}</div>
                  <div className="text-sm text-gray-500 capitalize">{status}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Campaigns Tab */}
      {activeTab === 'campaigns' && (
        <div className="space-y-6">
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Campagnes récentes
              </h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Campagne
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Destinataires
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Taux d'ouverture
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Taux de clic
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {campaigns.map((campaign) => (
                    <tr key={campaign.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {campaign.name}
                          </div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {campaign.subject_line}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="flex items-center text-sm text-gray-900">
                          {getTypeIcon(campaign.type)} {campaign.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(campaign.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {campaign.recipients_count?.toLocaleString() || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {campaign.open_rate ? `${campaign.open_rate.toFixed(1)}%` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {campaign.click_rate ? `${campaign.click_rate.toFixed(1)}%` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {campaign.sent_at 
                          ? new Date(campaign.sent_at).toLocaleDateString('fr-FR')
                          : campaign.scheduled_at
                          ? `Programmé ${new Date(campaign.scheduled_at).toLocaleDateString('fr-FR')}`
                          : new Date(campaign.created_at).toLocaleDateString('fr-FR')
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {campaigns.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">Aucune campagne trouvée</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && analytics && (
        <div className="space-y-6">
          {/* Performance Chart Placeholder */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Performance des emails (30 derniers jours)
            </h3>
            <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <p className="text-gray-500 mb-2">📊 Graphique de performance</p>
                <p className="text-sm text-gray-400">
                  Intégration future avec Chart.js ou Recharts
                </p>
              </div>
            </div>
          </div>

          {/* Detailed Analytics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">
                Métriques détaillées
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Taux de livraison</span>
                  <span className="font-semibold">{analytics.overview.delivery_rate.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Taux d'ouverture</span>
                  <span className="font-semibold">{analytics.overview.open_rate.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Taux de clic</span>
                  <span className="font-semibold">{analytics.overview.click_rate.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Taux de désabonnement</span>
                  <span className="font-semibold">{analytics.overview.unsubscribe_rate.toFixed(1)}%</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">
                Croissance des abonnés
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Nouveaux abonnés</span>
                  <span className="font-semibold text-green-600">+{analytics.subscribers.new}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Abonnés actifs</span>
                  <span className="font-semibold">{analytics.subscribers.active.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total campagnes</span>
                  <span className="font-semibold">{analytics.campaigns.total}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}