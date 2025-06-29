'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase-client' // Changed import path
import { loadStripe } from '@stripe/stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

function PricingPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  
  const [isLoading, setIsLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  // Check for URL parameters
  const canceled = searchParams.get('canceled')
  const reason = searchParams.get('reason')

  useEffect(() => {
    // Get current user
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user || null)
    }
    getUser()
  }, [])

  const handleSubscribe = async () => {
    if (!user) {
      router.push('/login?redirect=/pricing')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Create checkout session
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session')
      }

      // Redirect to Stripe Checkout
      const stripe = await stripePromise
      if (stripe) {
        const { error } = await stripe.redirectToCheckout({
          sessionId: data.sessionId
        })
        
        if (error) {
          throw new Error(error.message)
        }
      }
    } catch (err) {
      console.error('Subscription error:', err)
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            Nutrition Anti-Inflammatoire Personnalisée
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Transformez votre alimentation avec des recettes IA personnalisées, 
            des conseils nutritionnels adaptatifs et un suivi complet de votre bien-être.
          </p>
        </div>

        {/* Alerts */}
        {canceled && (
          <div className="max-w-md mx-auto mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800 text-center">
              Paiement annulé. Vous pouvez reprendre votre abonnement à tout moment.
            </p>
          </div>
        )}

        {reason === 'subscription_required' && (
          <div className="max-w-md mx-auto mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800 text-center">
              Un abonnement est requis pour accéder à cette fonctionnalité.
            </p>
          </div>
        )}

        {error && (
          <div className="max-w-md mx-auto mb-8 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-center">{error}</p>
          </div>
        )}

        {/* Pricing Card */}
        <div className="max-w-lg mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl p-8 border-2 border-green-200 relative overflow-hidden">
            {/* Popular badge */}
            <div className="absolute top-0 right-0 bg-gradient-to-r from-green-500 to-blue-500 text-white px-4 py-1 rounded-bl-lg text-sm font-semibold">
              Populaire
            </div>

            <div className="text-center">
              <h3 className="text-3xl font-bold mb-2 text-gray-900">Plan Premium</h3>
              <div className="text-5xl font-bold text-green-600 mb-2">6,99€</div>
              <div className="text-gray-500 mb-6">par mois</div>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-8">
                <p className="text-green-700 font-semibold">🚀 Accès immédiat</p>
                <p className="text-green-600 text-sm">Aucun engagement • Résiliation facile</p>
              </div>

              <div className="space-y-4 mb-8 text-left">
                <div className="flex items-start gap-3">
                  <span className="text-green-500 text-xl">✓</span>
                  <div>
                    <span className="font-semibold">Base complète recettes anti-inflammatoires</span>
                    <p className="text-gray-600 text-sm">Plus de 500 recettes validées par des nutritionnistes</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <span className="text-green-500 text-xl">✓</span>
                  <div>
                    <span className="font-semibold">Génération menus IA personnalisés</span>
                    <p className="text-gray-600 text-sm">Adaptés à vos restrictions et objectifs santé</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <span className="text-green-500 text-xl">✓</span>
                  <div>
                    <span className="font-semibold">Conseils nutritionnels adaptatifs</span>
                    <p className="text-gray-600 text-sm">IA qui apprend de vos préférences et résultats</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <span className="text-green-500 text-xl">✓</span>
                  <div>
                    <span className="font-semibold">Export PDF professionnel</span>
                    <p className="text-gray-600 text-sm">Listes de courses et plannings prêts à imprimer</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <span className="text-green-500 text-xl">✓</span>
                  <div>
                    <span className="font-semibold">Support prioritaire</span>
                    <p className="text-gray-600 text-sm">Assistance personnalisée et conseils d'experts</p>
                  </div>
                </div>
              </div>
              
              <button 
                onClick={handleSubscribe}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 px-6 rounded-xl text-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Chargement...
                  </span>
                ) : (
                  'Commencer maintenant - 6,99€/mois'
                )}
              </button>
              
              <div className="text-sm text-gray-500 mt-4 space-y-1">
                <p>• Pas de frais cachés</p>
                <p>• Données sécurisées et chiffrées</p>
                <p>• Conforme RGPD</p>
              </div>
            </div>
          </div>
        </div>

        {/* Trust indicators */}
        <div className="mt-16 text-center">
          <h3 className="text-2xl font-bold mb-8 text-gray-900">Pourquoi choisir NutriCoach ?</h3>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <div className="text-3xl mb-4">🧠</div>
              <h4 className="font-bold mb-2">IA Nutritionnelle Avancée</h4>
              <p className="text-gray-600 text-sm">
                Algorithmes de pointe analysant vos besoins nutritionnels personnels
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <div className="text-3xl mb-4">🩺</div>
              <h4 className="font-bold mb-2">Validé Scientifiquement</h4>
              <p className="text-gray-600 text-sm">
                Recettes basées sur la recherche en nutrition anti-inflammatoire
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <div className="text-3xl mb-4">🔒</div>
              <h4 className="font-bold mb-2">Sécurité Maximale</h4>
              <p className="text-gray-600 text-sm">
                Chiffrement niveau médical pour protéger vos données de santé
              </p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16 max-w-2xl mx-auto">
          <h3 className="text-2xl font-bold mb-8 text-center text-gray-900">Questions Fréquentes</h3>
          
          <div className="space-y-4">
            <details className="bg-white rounded-lg shadow-md">
              <summary className="p-4 font-semibold cursor-pointer hover:bg-gray-50">
                Puis-je annuler à tout moment ?
              </summary>
              <div className="p-4 pt-0 text-gray-600">
                Oui, vous pouvez annuler votre abonnement à tout moment depuis votre dashboard. 
                Aucun frais d'annulation.
              </div>
            </details>
            
            <details className="bg-white rounded-lg shadow-md">
              <summary className="p-4 font-semibold cursor-pointer hover:bg-gray-50">
                Comment sont calculés les 6,99€ par mois ?
              </summary>
              <div className="p-4 pt-0 text-gray-600">
                Prix fixe de 6,99€/mois pour un accès complet à toutes les fonctionnalités. 
                Facturation mensuelle simple et transparente.
              </div>
            </details>
            
            <details className="bg-white rounded-lg shadow-md">
              <summary className="p-4 font-semibold cursor-pointer hover:bg-gray-50">
                Mes données de santé sont-elles sécurisées ?
              </summary>
              <div className="p-4 pt-0 text-gray-600">
                Nous utilisons un chiffrement AES-256 de niveau bancaire et respectons 
                strictement le RGPD pour protéger vos informations personnelles.
              </div>
            </details>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PricingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    }>
      <PricingPageContent />
    </Suspense>
  )
}