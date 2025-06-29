'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

interface UnsubscribeData {
  user: {
    email: string;
    fullName?: string;
  };
  preferences: {
    newsletter_subscribed: boolean;
    recipe_recommendations_subscribed: boolean;
    health_tips_subscribed: boolean;
    product_updates_subscribed: boolean;
    promotional_emails_subscribed: boolean;
  };
  token: string;
}

export default function UnsubscribePage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [data, setData] = useState<UnsubscribeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (token) {
      fetchUnsubscribeData();
    } else {
      setError('Token de désabonnement manquant');
      setLoading(false);
    }
  }, [token]);

  const fetchUnsubscribeData = async () => {
    try {
      const response = await fetch(`/api/email/unsubscribe?token=${encodeURIComponent(token!)}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors du chargement');
      }

      const unsubData = await response.json();
      setData(unsubData);
      setPreferences(unsubData.preferences);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  const handleUnsubscribeAll = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/email/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token,
          action: 'unsubscribe_all'
        })
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors du désabonnement');
      }

      setMessage(result.message);
      // Update all preferences to false
      setPreferences(Object.keys(preferences).reduce((acc, key) => {
        acc[key] = false;
        return acc;
      }, {} as Record<string, boolean>));

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du désabonnement');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePreferences = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/email/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token,
          action: 'update_preferences',
          preferences
        })
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de la mise à jour');
      }

      setMessage(result.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  const handlePreferenceChange = (key: string, value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Erreur</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <a
            href="/"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
          >
            Retour à l'accueil
          </a>
        </div>
      </div>
    );
  }

  if (message) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
          <div className="text-green-500 text-5xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Succès</h1>
          <p className="text-gray-600 mb-6">{message}</p>
          <a
            href="/"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
          >
            Retour à l'accueil
          </a>
        </div>
      </div>
    );
  }

  if (!data) return null;

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

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          {/* Header */}
          <div className="bg-green-600 px-6 py-4">
            <h1 className="text-2xl font-bold text-white">
              Gestion des préférences email
            </h1>
            <p className="text-green-100 mt-1">
              Gérez vos abonnements aux emails NutriCoach
            </p>
          </div>

          <div className="px-6 py-8">
            {/* User Info */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Compte
              </h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium text-gray-900">{data.user.email}</p>
                {data.user.fullName && (
                  <>
                    <p className="text-sm text-gray-600 mt-2">Nom</p>
                    <p className="font-medium text-gray-900">{data.user.fullName}</p>
                  </>
                )}
              </div>
            </div>

            {/* Email Preferences */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Préférences d'abonnement
              </h2>
              <p className="text-gray-600 mb-6">
                Choisissez les types d'emails que vous souhaitez recevoir de NutriCoach.
              </p>

              <div className="space-y-4">
                {Object.entries(emailTypeLabels).map(([key, label]) => (
                  <div key={key} className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id={key}
                        type="checkbox"
                        checked={preferences[key] || false}
                        onChange={(e) => handlePreferenceChange(key, e.target.checked)}
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

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleUpdatePreferences}
                className="flex-1 bg-green-600 text-white px-6 py-3 rounded-md font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                Mettre à jour mes préférences
              </button>
              
              <button
                onClick={handleUnsubscribeAll}
                className="flex-1 bg-red-600 text-white px-6 py-3 rounded-md font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                Me désabonner de tous les emails
              </button>
            </div>

            {/* RGPD Notice */}
            <div className="mt-8 p-4 bg-blue-50 rounded-lg">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">
                🛡️ Vos droits RGPD
              </h3>
              <p className="text-xs text-blue-800 mb-2">
                Conformément au Règlement Général sur la Protection des Données (RGPD), 
                vous disposez de droits sur vos données personnelles :
              </p>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• <strong>Droit d'accès</strong> : Vous pouvez demander l'accès à vos données</li>
                <li>• <strong>Droit de rectification</strong> : Vous pouvez corriger vos données</li>
                <li>• <strong>Droit à l'effacement</strong> : Vous pouvez demander la suppression de vos données</li>
                <li>• <strong>Droit d'opposition</strong> : Vous pouvez vous opposer au traitement</li>
                <li>• <strong>Droit à la portabilité</strong> : Vous pouvez récupérer vos données</li>
              </ul>
              <p className="text-xs text-blue-800 mt-2">
                Pour exercer ces droits, contactez-nous à{' '}
                <a 
                  href="mailto:privacy@nutricoach.app" 
                  className="underline hover:text-blue-600"
                >
                  privacy@nutricoach.app
                </a>
              </p>
            </div>

            {/* Footer Links */}
            <div className="mt-8 pt-6 border-t border-gray-200 text-center">
              <div className="space-x-6 text-sm">
                <a 
                  href="/privacy" 
                  className="text-green-600 hover:text-green-500"
                >
                  Politique de confidentialité
                </a>
                <a 
                  href="/terms" 
                  className="text-green-600 hover:text-green-500"
                >
                  Conditions d'utilisation
                </a>
                <a 
                  href="/contact" 
                  className="text-green-600 hover:text-green-500"
                >
                  Nous contacter
                </a>
              </div>
              
              <p className="mt-4 text-xs text-gray-500">
                © 2024 NutriCoach. Tous droits réservés.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}