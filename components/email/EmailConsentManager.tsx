'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-client';

interface EmailPreferences {
  newsletter_subscribed: boolean;
  recipe_recommendations_subscribed: boolean;
  health_tips_subscribed: boolean;
  product_updates_subscribed: boolean;
  promotional_emails_subscribed: boolean;
  email_frequency: 'daily' | 'weekly' | 'bi_weekly' | 'monthly';
  best_time_to_send: number;
  timezone: string;
  preferred_meal_types: string[];
  preferred_recipe_difficulty: string[];
  content_language: string;
  engagement_score: number;
  total_emails_sent: number;
  total_emails_opened: number;
  total_clicks: number;
  last_engagement_at: string | null;
  double_opt_in_confirmed: boolean;
}

interface EmailConsentManagerProps {
  className?: string;
}

export default function EmailConsentManager({ className = '' }: EmailConsentManagerProps) {
  const [preferences, setPreferences] = useState<EmailPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const response = await fetch('/api/email/preferences');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors du chargement');
      }

      const data = await response.json();
      setPreferences(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  const updatePreferences = async (updates: Partial<EmailPreferences>) => {
    try {
      setSaving(true);
      setError(null);
      setMessage(null);

      const response = await fetch('/api/email/preferences', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la mise à jour');
      }

      const updatedPreferences = await response.json();
      setPreferences(updatedPreferences);
      setMessage('Préférences mises à jour avec succès');
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  const handleSubscriptionChange = (key: keyof EmailPreferences, value: boolean) => {
    if (!preferences) return;
    
    const updates = { [key]: value };
    setPreferences({ ...preferences, [key]: value });
    updatePreferences(updates);
  };

  const handleFrequencyChange = (frequency: 'daily' | 'weekly' | 'bi_weekly' | 'monthly') => {
    if (!preferences) return;
    
    setPreferences({ ...preferences, email_frequency: frequency });
    updatePreferences({ email_frequency: frequency });
  };

  const handleTimeChange = (hour: number) => {
    if (!preferences) return;
    
    setPreferences({ ...preferences, best_time_to_send: hour });
    updatePreferences({ best_time_to_send: hour });
  };

  const handleArrayFieldChange = (field: 'preferred_meal_types' | 'preferred_recipe_difficulty', value: string, checked: boolean) => {
    if (!preferences) return;

    const currentArray = preferences[field] || [];
    const newArray = checked 
      ? [...currentArray, value]
      : currentArray.filter(item => item !== value);

    setPreferences({ ...preferences, [field]: newArray });
    updatePreferences({ [field]: newArray });
  };

  if (loading) {
    return (
      <div className={`${className} animate-pulse`}>
        <div className="space-y-4">
          <div className="h-4 bg-gray-300 rounded w-1/4"></div>
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 bg-gray-300 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className={`${className} text-center py-8`}>
        <p className="text-gray-500">Impossible de charger les préférences email</p>
        <button
          onClick={fetchPreferences}
          className="mt-2 text-green-600 hover:text-green-500 font-medium"
        >
          Réessayer
        </button>
      </div>
    );
  }

  const emailTypeLabels = {
    newsletter_subscribed: 'Newsletter hebdomadaire',
    recipe_recommendations_subscribed: 'Recommandations de recettes',
    health_tips_subscribed: 'Conseils santé et nutrition',
    product_updates_subscribed: 'Mises à jour du produit',
    promotional_emails_subscribed: 'Offres promotionnelles'
  };

  const emailTypeDescriptions = {
    newsletter_subscribed: 'Recevez notre newsletter avec les nouvelles recettes et conseils nutrition',
    recipe_recommendations_subscribed: 'Recommandations personnalisées de recettes anti-inflammatoires',
    health_tips_subscribed: 'Conseils d\'experts en nutrition et bien-être',
    product_updates_subscribed: 'Nouvelles fonctionnalités et améliorations de NutriCoach',
    promotional_emails_subscribed: 'Offres spéciales et promotions'
  };

  const frequencyLabels = {
    daily: 'Quotidien',
    weekly: 'Hebdomadaire',
    bi_weekly: 'Tous les 15 jours',
    monthly: 'Mensuel'
  };

  const mealTypes = [
    { value: 'breakfast', label: 'Petit-déjeuner' },
    { value: 'lunch', label: 'Déjeuner' },
    { value: 'dinner', label: 'Dîner' },
    { value: 'snack', label: 'Collation' }
  ];

  const recipeDifficulties = [
    { value: 'easy', label: 'Facile' },
    { value: 'medium', label: 'Modéré' },
    { value: 'hard', label: 'Difficile' }
  ];

  const timeOptions = Array.from({ length: 24 }, (_, i) => ({
    value: i,
    label: `${i.toString().padStart(2, '0')}:00`
  }));

  return (
    <div className={className}>
      {/* Messages */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {message && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
          <p className="text-green-800 text-sm">{message}</p>
        </div>
      )}

      {/* Double Opt-in Status */}
      {!preferences.double_opt_in_confirmed && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-yellow-400 text-lg">⚠️</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Confirmation d'email requise
              </h3>
              <p className="mt-1 text-sm text-yellow-700">
                Veuillez confirmer votre adresse email pour recevoir nos communications. 
                Vérifiez votre boîte de réception et cliquez sur le lien de confirmation.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Engagement Statistics */}
      <div className="mb-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          📊 Vos statistiques d'engagement
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {preferences.total_emails_sent}
            </div>
            <div className="text-sm text-gray-600">Emails envoyés</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {preferences.total_emails_opened}
            </div>
            <div className="text-sm text-gray-600">Emails ouverts</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {preferences.total_clicks}
            </div>
            <div className="text-sm text-gray-600">Clics</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {Math.round(preferences.engagement_score * 100)}%
            </div>
            <div className="text-sm text-gray-600">Score d'engagement</div>
          </div>
        </div>
        {preferences.last_engagement_at && (
          <p className="mt-3 text-sm text-gray-600 text-center">
            Dernière interaction : {new Date(preferences.last_engagement_at).toLocaleDateString('fr-FR')}
          </p>
        )}
      </div>

      {/* Email Subscriptions */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          📧 Abonnements aux emails
        </h3>
        <div className="space-y-4">
          {Object.entries(emailTypeLabels).map(([key, label]) => (
            <div key={key} className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id={key}
                  type="checkbox"
                  checked={preferences[key as keyof EmailPreferences] as boolean}
                  onChange={(e) => handleSubscriptionChange(key as keyof EmailPreferences, e.target.checked)}
                  disabled={saving}
                  className="focus:ring-green-500 h-4 w-4 text-green-600 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor={key} className="font-medium text-gray-900">
                  {label}
                </label>
                <p className="text-gray-500">
                  {emailTypeDescriptions[key as keyof typeof emailTypeDescriptions]}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Email Frequency */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          ⏰ Fréquence des emails
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {Object.entries(frequencyLabels).map(([value, label]) => (
            <button
              key={value}
              onClick={() => handleFrequencyChange(value as any)}
              disabled={saving}
              className={`
                p-3 text-sm font-medium rounded-md border
                ${preferences.email_frequency === value
                  ? 'bg-green-600 text-white border-green-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }
                ${saving ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Best Time to Send */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          🕐 Heure préférée de réception
        </h3>
        <select
          value={preferences.best_time_to_send}
          onChange={(e) => handleTimeChange(parseInt(e.target.value))}
          disabled={saving}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md"
        >
          {timeOptions.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <p className="mt-1 text-sm text-gray-500">
          Heure à laquelle vous préférez recevoir nos emails (fuseau horaire : {preferences.timezone})
        </p>
      </div>

      {/* Content Preferences */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          🍽️ Préférences de contenu
        </h3>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Types de repas préférés
          </label>
          <div className="grid grid-cols-2 gap-2">
            {mealTypes.map(({ value, label }) => (
              <label key={value} className="flex items-center">
                <input
                  type="checkbox"
                  checked={(preferences.preferred_meal_types || []).includes(value)}
                  onChange={(e) => handleArrayFieldChange('preferred_meal_types', value, e.target.checked)}
                  disabled={saving}
                  className="focus:ring-green-500 h-4 w-4 text-green-600 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">{label}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Difficulté des recettes préférées
          </label>
          <div className="grid grid-cols-3 gap-2">
            {recipeDifficulties.map(({ value, label }) => (
              <label key={value} className="flex items-center">
                <input
                  type="checkbox"
                  checked={(preferences.preferred_recipe_difficulty || []).includes(value)}
                  onChange={(e) => handleArrayFieldChange('preferred_recipe_difficulty', value, e.target.checked)}
                  disabled={saving}
                  className="focus:ring-green-500 h-4 w-4 text-green-600 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">{label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* RGPD Information */}
      <div className="p-4 bg-blue-50 rounded-lg">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">
          🛡️ Protection de vos données
        </h3>
        <p className="text-xs text-blue-800 mb-2">
          Vos données sont traitées conformément au RGPD. Vous pouvez à tout moment :
        </p>
        <ul className="text-xs text-blue-800 space-y-1">
          <li>• Modifier vos préférences de communication</li>
          <li>• Vous désabonner de nos emails</li>
          <li>• Demander l'accès, la rectification ou la suppression de vos données</li>
          <li>• Exporter vos données personnelles</li>
        </ul>
        <div className="mt-3 space-x-4">
          <a 
            href="/privacy" 
            className="text-xs text-blue-600 hover:text-blue-500 underline"
          >
            Politique de confidentialité
          </a>
          <a 
            href="mailto:privacy@nutricoach.app" 
            className="text-xs text-blue-600 hover:text-blue-500 underline"
          >
            Contacter le DPO
          </a>
        </div>
      </div>

      {saving && (
        <div className="mt-4 text-center">
          <div className="inline-flex items-center text-sm text-gray-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 mr-2"></div>
            Sauvegarde en cours...
          </div>
        </div>
      )}
    </div>
  );
}