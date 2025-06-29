'use client'

import { Suspense, useState, useEffect } from 'react'
import Link from 'next/link'

function CookiePolicyContent() {
  const [cookieSettings, setCookieSettings] = useState({
    essential: true, // Always true, cannot be disabled
    analytics: false,
    marketing: false,
    preferences: false
  })

  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  useEffect(() => {
    // Load existing cookie preferences
    const savedSettings = localStorage.getItem('nutricoach-cookie-settings')
    if (savedSettings) {
      setCookieSettings(JSON.parse(savedSettings))
    }
  }, [])

  const saveCookieSettings = () => {
    localStorage.setItem('nutricoach-cookie-settings', JSON.stringify(cookieSettings))
    localStorage.setItem('nutricoach-cookie-consent', 'true')
    localStorage.setItem('nutricoach-cookie-consent-date', new Date().toISOString())
    setIsSettingsOpen(false)
    
    // Show success message
    alert('Vos préférences de cookies ont été enregistrées.')
  }

  const handleToggle = (category: string) => {
    if (category === 'essential') return // Cannot disable essential cookies
    
    setCookieSettings(prev => ({
      ...prev,
      [category]: !prev[category as keyof typeof prev]
    }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            Politique des Cookies
          </h1>
          <p className="text-lg text-gray-600">
            NutriCoach - Gestion transparente de vos données de navigation
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
          </p>
        </div>

        {/* Cookie Settings Panel */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8 border-2 border-green-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">🍪 Gérer mes préférences cookies</h2>
            <button
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              {isSettingsOpen ? 'Fermer' : 'Configurer'}
            </button>
          </div>

          {isSettingsOpen && (
            <div className="space-y-4">
              {/* Essential Cookies */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold text-gray-900">🔒 Cookies essentiels</h3>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-600 mr-2">Toujours actifs</span>
                    <div className="w-12 h-6 bg-green-500 rounded-full flex items-center justify-end px-1">
                      <div className="w-4 h-4 bg-white rounded-full"></div>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  Nécessaires au fonctionnement de base du site (connexion, panier, sécurité)
                </p>
              </div>

              {/* Analytics Cookies */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold text-gray-900">📊 Cookies analytiques</h3>
                  <button
                    onClick={() => handleToggle('analytics')}
                    className={`w-12 h-6 rounded-full flex items-center px-1 transition-colors ${
                      cookieSettings.analytics ? 'bg-green-500 justify-end' : 'bg-gray-300 justify-start'
                    }`}
                  >
                    <div className="w-4 h-4 bg-white rounded-full"></div>
                  </button>
                </div>
                <p className="text-sm text-gray-600">
                  Nous aident à comprendre comment vous utilisez le site pour l'améliorer
                </p>
              </div>

              {/* Marketing Cookies */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold text-gray-900">🎯 Cookies marketing</h3>
                  <button
                    onClick={() => handleToggle('marketing')}
                    className={`w-12 h-6 rounded-full flex items-center px-1 transition-colors ${
                      cookieSettings.marketing ? 'bg-green-500 justify-end' : 'bg-gray-300 justify-start'
                    }`}
                  >
                    <div className="w-4 h-4 bg-white rounded-full"></div>
                  </button>
                </div>
                <p className="text-sm text-gray-600">
                  Permettent de personnaliser les publicités et mesurer leur efficacité
                </p>
              </div>

              {/* Preferences Cookies */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold text-gray-900">⚙️ Cookies de préférences</h3>
                  <button
                    onClick={() => handleToggle('preferences')}
                    className={`w-12 h-6 rounded-full flex items-center px-1 transition-colors ${
                      cookieSettings.preferences ? 'bg-green-500 justify-end' : 'bg-gray-300 justify-start'
                    }`}
                  >
                    <div className="w-4 h-4 bg-white rounded-full"></div>
                  </button>
                </div>
                <p className="text-sm text-gray-600">
                  Mémorisent vos préférences (langue, région, paramètres d'affichage)
                </p>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={saveCookieSettings}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Enregistrer mes préférences
                </button>
                <button
                  onClick={() => {
                    setCookieSettings({ essential: true, analytics: false, marketing: false, preferences: false })
                  }}
                  className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Refuser tout
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 space-y-12">
          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-gray-900">1. Qu'est-ce qu'un cookie ?</h2>
            <div className="prose prose-gray max-w-none">
              <p className="mb-4">
                Un cookie est un petit fichier texte stocké sur votre ordinateur ou appareil mobile 
                lors de votre visite sur NutriCoach. Les cookies nous permettent de reconnaître votre 
                navigateur et de capturer certaines informations.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 my-4">
                <p className="text-blue-800 font-semibold">ℹ️ Transparence totale</p>
                <p className="text-blue-700 text-sm mt-1">
                  Nous respectons votre vie privée et vous donnons le contrôle total sur les cookies 
                  utilisés sur notre site avec un consentement granulaire. Vous pouvez modifier vos préférences à tout moment.
                </p>
              </div>
            </div>
          </section>

          {/* Types de cookies */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-gray-900">2. Types de cookies utilisés</h2>
            
            <div className="space-y-6">
              {/* Cookies essentiels */}
              <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                <h3 className="text-xl font-semibold mb-3 text-green-800">🔒 Cookies essentiels (obligatoires)</h3>
                <p className="text-green-700 mb-3">
                  Ces cookies sont indispensables au fonctionnement du site et ne peuvent pas être désactivés.
                </p>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-green-300">
                        <th className="text-left p-2 font-semibold">Nom du cookie</th>
                        <th className="text-left p-2 font-semibold">Finalité</th>
                        <th className="text-left p-2 font-semibold">Durée</th>
                      </tr>
                    </thead>
                    <tbody className="text-green-700">
                      <tr className="border-b border-green-200">
                        <td className="p-2 font-mono">supabase-auth-token</td>
                        <td className="p-2">Authentification utilisateur</td>
                        <td className="p-2">Session</td>
                      </tr>
                      <tr className="border-b border-green-200">
                        <td className="p-2 font-mono">nutricoach-session</td>
                        <td className="p-2">Maintien de la session</td>
                        <td className="p-2">7 jours</td>
                      </tr>
                      <tr className="border-b border-green-200">
                        <td className="p-2 font-mono">csrf-token</td>
                        <td className="p-2">Protection contre les attaques CSRF</td>
                        <td className="p-2">Session</td>
                      </tr>
                      <tr className="border-b border-green-200">
                        <td className="p-2 font-mono">stripe-session</td>
                        <td className="p-2">Sécurisation des paiements</td>
                        <td className="p-2">30 minutes</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Cookies analytiques */}
              <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                <h3 className="text-xl font-semibold mb-3 text-blue-800">📊 Cookies analytiques (optionnels)</h3>
                <p className="text-blue-700 mb-3">
                  Ces cookies nous aident à comprendre comment vous utilisez notre site pour l'améliorer.
                </p>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-blue-300">
                        <th className="text-left p-2 font-semibold">Nom du cookie</th>
                        <th className="text-left p-2 font-semibold">Finalité</th>
                        <th className="text-left p-2 font-semibold">Durée</th>
                      </tr>
                    </thead>
                    <tbody className="text-blue-700">
                      <tr className="border-b border-blue-200">
                        <td className="p-2 font-mono">_ga</td>
                        <td className="p-2">Google Analytics - Identification des utilisateurs</td>
                        <td className="p-2">2 ans</td>
                      </tr>
                      <tr className="border-b border-blue-200">
                        <td className="p-2 font-mono">_ga_*</td>
                        <td className="p-2">Google Analytics - Statistiques de session</td>
                        <td className="p-2">2 ans</td>
                      </tr>
                      <tr className="border-b border-blue-200">
                        <td className="p-2 font-mono">_gid</td>
                        <td className="p-2">Google Analytics - Identification des utilisateurs</td>
                        <td className="p-2">24 heures</td>
                      </tr>
                      <tr className="border-b border-blue-200">
                        <td className="p-2 font-mono">nutricoach-analytics</td>
                        <td className="p-2">Statistiques d'usage internes</td>
                        <td className="p-2">1 an</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Cookies marketing */}
              <div className="border border-purple-200 rounded-lg p-4 bg-purple-50">
                <h3 className="text-xl font-semibold mb-3 text-purple-800">🎯 Cookies marketing (optionnels)</h3>
                <p className="text-purple-700 mb-3">
                  Ces cookies permettent de personnaliser les publicités et mesurer leur efficacité.
                </p>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-purple-300">
                        <th className="text-left p-2 font-semibold">Nom du cookie</th>
                        <th className="text-left p-2 font-semibold">Finalité</th>
                        <th className="text-left p-2 font-semibold">Durée</th>
                      </tr>
                    </thead>
                    <tbody className="text-purple-700">
                      <tr className="border-b border-purple-200">
                        <td className="p-2 font-mono">_fbp</td>
                        <td className="p-2">Facebook Pixel - Tracking des conversions</td>
                        <td className="p-2">3 mois</td>
                      </tr>
                      <tr className="border-b border-purple-200">
                        <td className="p-2 font-mono">_gcl_au</td>
                        <td className="p-2">Google Ads - Attribution des conversions</td>
                        <td className="p-2">3 mois</td>
                      </tr>
                      <tr className="border-b border-purple-200">
                        <td className="p-2 font-mono">utm_source</td>
                        <td className="p-2">Tracking des campagnes marketing</td>
                        <td className="p-2">30 jours</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Cookies de préférences */}
              <div className="border border-orange-200 rounded-lg p-4 bg-orange-50">
                <h3 className="text-xl font-semibold mb-3 text-orange-800">⚙️ Cookies de préférences (optionnels)</h3>
                <p className="text-orange-700 mb-3">
                  Ces cookies mémorisent vos préférences pour améliorer votre expérience.
                </p>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-orange-300">
                        <th className="text-left p-2 font-semibold">Nom du cookie</th>
                        <th className="text-left p-2 font-semibold">Finalité</th>
                        <th className="text-left p-2 font-semibold">Durée</th>
                      </tr>
                    </thead>
                    <tbody className="text-orange-700">
                      <tr className="border-b border-orange-200">
                        <td className="p-2 font-mono">language</td>
                        <td className="p-2">Mémorisation de la langue choisie</td>
                        <td className="p-2">1 an</td>
                      </tr>
                      <tr className="border-b border-orange-200">
                        <td className="p-2 font-mono">theme</td>
                        <td className="p-2">Préférences d'affichage (mode sombre/clair)</td>
                        <td className="p-2">1 an</td>
                      </tr>
                      <tr className="border-b border-orange-200">
                        <td className="p-2 font-mono">timezone</td>
                        <td className="p-2">Fuseau horaire de l'utilisateur</td>
                        <td className="p-2">1 an</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>

          {/* Durée de conservation */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-gray-900">3. Durée de conservation</h2>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-yellow-800 font-semibold">⏰ Conformité CNIL</p>
              <p className="text-yellow-700 text-sm mt-1">
                Nous respectons la recommandation de la CNIL de 13 mois maximum pour les cookies de mesure d'audience.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">🔒 Cookies essentiels</h4>
                <p className="text-gray-700 text-sm">
                  <strong>Durée :</strong> Session ou 7 jours maximum<br />
                  <strong>Suppression :</strong> Automatique à la fermeture du navigateur ou expiration
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">📊 Cookies analytiques</h4>
                <p className="text-gray-700 text-sm">
                  <strong>Durée :</strong> 13 mois maximum (recommandation CNIL)<br />
                  <strong>Suppression :</strong> Automatique ou via vos préférences
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">🎯 Cookies marketing</h4>
                <p className="text-gray-700 text-sm">
                  <strong>Durée :</strong> 3 mois maximum<br />
                  <strong>Suppression :</strong> Automatique ou désactivation possible
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">⚙️ Cookies de préférences</h4>
                <p className="text-gray-700 text-sm">
                  <strong>Durée :</strong> 1 an maximum<br />
                  <strong>Suppression :</strong> Gestion via vos paramètres de compte
                </p>
              </div>
            </div>
          </section>

          {/* Vos droits */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-gray-900">4. Vos droits et options</h2>
            
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-800 mb-2">✅ Consentement libre et éclairé</h4>
                <p className="text-green-700 text-sm">
                  Vous avez donné votre consentement libre, spécifique et éclairé pour les cookies non-essentiels. 
                  Vous pouvez le retirer à tout moment.
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-2">🔧 Paramétrage de votre navigateur</h4>
                <p className="text-blue-700 text-sm mb-2">
                  Vous pouvez configurer votre navigateur pour :
                </p>
                <ul className="text-blue-700 text-sm space-y-1">
                  <li>• Refuser tous les cookies</li>
                  <li>• Être alerté avant l'acceptation d'un cookie</li>
                  <li>• Supprimer les cookies existants</li>
                  <li>• Configurer des exceptions par site</li>
                </ul>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h4 className="font-semibold text-purple-800 mb-2">🌐 Guides par navigateur</h4>
                <div className="grid md:grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-purple-700">
                      <strong>Chrome :</strong> Paramètres → Confidentialité → Cookies
                    </p>
                    <p className="text-purple-700">
                      <strong>Firefox :</strong> Paramètres → Vie privée → Cookies
                    </p>
                  </div>
                  <div>
                    <p className="text-purple-700">
                      <strong>Safari :</strong> Préférences → Confidentialité → Cookies
                    </p>
                    <p className="text-purple-700">
                      <strong>Edge :</strong> Paramètres → Confidentialité → Cookies
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h4 className="font-semibold text-orange-800 mb-2">🚫 Outils de blocage</h4>
                <p className="text-orange-700 text-sm">
                  Vous pouvez utiliser des outils comme uBlock Origin, Ghostery ou les paramètres 
                  "Ne pas me suivre" de votre navigateur pour bloquer certains cookies.
                </p>
              </div>
            </div>
          </section>

          {/* Services tiers */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-gray-900">5. Services tiers et cookies</h2>
            
            <div className="space-y-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">📊 Google Analytics</h4>
                <p className="text-gray-700 text-sm mb-2">
                  Nous utilisons Google Analytics pour analyser l'utilisation de notre site.
                </p>
                <p className="text-gray-700 text-sm">
                  <strong>Opt-out :</strong> <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Extension de désactivation Google Analytics</a>
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">💳 Stripe</h4>
                <p className="text-gray-700 text-sm mb-2">
                  Nos paiements sont sécurisés par Stripe qui utilise ses propres cookies.
                </p>
                <p className="text-gray-700 text-sm">
                  <strong>Politique :</strong> <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Politique de confidentialité Stripe</a>
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">🎯 Publicité personnalisée</h4>
                <p className="text-gray-700 text-sm mb-2">
                  Si vous avez activé les cookies marketing, vous pouvez vous désinscrire :
                </p>
                <p className="text-gray-700 text-sm">
                  <strong>Opt-out :</strong> <a href="https://www.youronlinechoices.com/fr/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Your Online Choices</a>
                </p>
              </div>
            </div>
          </section>

          {/* Impact du refus */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-gray-900">6. Impact du refus des cookies</h2>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-yellow-800 font-semibold">⚠️ Fonctionnalités affectées</p>
              <p className="text-yellow-700 text-sm mt-1">
                Le refus de certains cookies peut limiter certaines fonctionnalités de NutriCoach.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                <h4 className="font-semibold text-red-800 mb-2">❌ Refus des cookies essentiels</h4>
                <ul className="text-red-700 text-sm space-y-1">
                  <li>• Impossibilité de se connecter</li>
                  <li>• Perte de session fréquente</li>
                  <li>• Problèmes de sécurité</li>
                  <li>• Dysfonctionnements majeurs</li>
                </ul>
              </div>

              <div className="border border-orange-200 rounded-lg p-4 bg-orange-50">
                <h4 className="font-semibold text-orange-800 mb-2">⚠️ Refus des cookies de préférences</h4>
                <ul className="text-orange-700 text-sm space-y-1">
                  <li>• Réinitialisation des paramètres</li>
                  <li>• Perte de la langue choisie</li>
                  <li>• Expérience moins personnalisée</li>
                  <li>• Paramètres à reconfigurer</li>
                </ul>
              </div>

              <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                <h4 className="font-semibold text-blue-800 mb-2">📊 Refus des cookies analytiques</h4>
                <ul className="text-blue-700 text-sm space-y-1">
                  <li>• Pas d'impact sur les fonctionnalités</li>
                  <li>• Amélioration du service ralentie</li>
                  <li>• Statistiques moins précises</li>
                  <li>• Développement moins ciblé</li>
                </ul>
              </div>

              <div className="border border-purple-200 rounded-lg p-4 bg-purple-50">
                <h4 className="font-semibold text-purple-800 mb-2">🎯 Refus des cookies marketing</h4>
                <ul className="text-purple-700 text-sm space-y-1">
                  <li>• Pas d'impact sur les fonctionnalités</li>
                  <li>• Publicités moins pertinentes</li>
                  <li>• Offres moins personnalisées</li>
                  <li>• Mesure ROI impossible</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-gray-900">7. Contact</h2>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">📧 Questions sur les cookies</h4>
              <div className="text-gray-700 text-sm space-y-1">
                <p><strong>Email :</strong> cookies@nutricoach.app</p>
                <p><strong>DPO :</strong> dpo@nutricoach.app</p>
                <p><strong>Support :</strong> support@nutricoach.app</p>
                <p><strong>Réponse :</strong> Sous 48 heures maximum</p>
              </div>
            </div>
          </section>
        </div>

        {/* Footer navigation */}
        <div className="mt-12 text-center">
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <Link href="/privacy" className="text-blue-600 hover:underline">
              Politique de confidentialité
            </Link>
            <Link href="/terms" className="text-blue-600 hover:underline">
              Conditions générales
            </Link>
            <Link href="/legal" className="text-blue-600 hover:underline">
              Mentions légales
            </Link>
            <Link href="/dashboard" className="text-green-600 hover:underline font-semibold">
              Retour au Dashboard
            </Link>
          </div>
          <p className="text-xs text-gray-500 mt-4">
            Conformité RGPD et recommandations CNIL - Gestion transparente de vos cookies
          </p>
        </div>
      </div>
    </div>
  )
}

export default function CookiePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement de la politique cookies...</p>
        </div>
      </div>
    }>
      <CookiePolicyContent />
    </Suspense>
  )
}