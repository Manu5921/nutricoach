'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase-client' // Changed import path
// import { UserService } from '@/lib/auth/user-service' // Commented out for now
import { UserProfile } from '@/lib/auth/types' // Assuming UserProfile is client-safe

function DashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  // const userService = new UserService() // Commented out for now
  
  const [user, setUser] = useState<UserProfile | null>(null) // UserProfile might need adjustment if it contains server-only fields
  const [loading, setLoading] = useState(true)
  const [hasAccess, setHasAccess] = useState(false)
  const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(null)

  // Check for success parameter from Stripe
  const success = searchParams.get('success')
  const sessionId = searchParams.get('session_id')

  useEffect(() => {
    loadUserData()
  }, [])

  const loadUserData = async () => {
    try {
      // Get current session
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/login')
        return
      }

      // Get user profile with enhanced data
      // const userProfile = await userService.getUserProfile( // TODO: Refactor to server-side data fetching
      //   session.user.id,
      //   1, // SecurityLevel.PERSONAL
      //   {
      //     ipAddress: 'client-side',
      //     userAgent: navigator.userAgent
      //   }
      // )

      // if (!userProfile) {
      //   router.push('/login')
      //   return
      // }

      // setUser(userProfile) // TODO: Set user from server-fetched data

      // // Check access and trial status
      // const accessStatus = await userService.hasActiveAccess(session.user.id) // TODO: Refactor
      // setHasAccess(accessStatus) // TODO: Set from server-fetched data

      // // Calculate trial days left
      // if (userProfile.trial_ends_at && userProfile.subscription_status !== 'active') { // TODO: Use server-fetched data
      //   const trialEnd = new Date(userProfile.trial_ends_at)
      //   const now = new Date()
      //   const daysLeft = Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
      //   setTrialDaysLeft(daysLeft)
      // }

      // Fallback for now as userService calls are commented
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        // Simulating some user data - this is NOT a complete profile
        setUser({ id: authUser.id, email: authUser.email } as UserProfile);
        setHasAccess(true); // Assume access for now to render dashboard parts
      }


    } catch (error) {
      console.error('Error loading user data:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de votre dashboard...</p>
        </div>
      </div>
    )
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center bg-white p-8 rounded-lg shadow-lg">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold mb-4 text-gray-900">Abonnement Requis</h1>
          <p className="text-gray-600 mb-6">
            {trialDaysLeft === 0 
              ? "Votre période d'essai est terminée. Abonnez-vous pour continuer à profiter de NutriCoach."
              : "Un abonnement est requis pour accéder au dashboard."
            }
          </p>
          <button
            onClick={() => router.push('/pricing')}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold w-full"
          >
            Voir les tarifs
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-green-600">NutriCoach</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                Bonjour, {user?.full_name || user?.email}
              </div>
              <button
                onClick={handleLogout}
                className="text-gray-500 hover:text-gray-700 text-sm"
              >
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Success Message */}
      {success && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <span className="text-green-600 text-xl mr-2">✅</span>
              <p className="text-green-800">
                Félicitations ! Votre abonnement a été activé avec succès. 
                Bienvenue dans NutriCoach Premium !
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Trial Status */}
      {user?.subscription_status !== 'active' && trialDaysLeft !== null && trialDaysLeft > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-blue-600 text-xl mr-2">🎁</span>
                <p className="text-blue-800">
                  Essai gratuit - {trialDaysLeft} jour{trialDaysLeft > 1 ? 's' : ''} restant{trialDaysLeft > 1 ? 's' : ''}
                </p>
              </div>
              <button
                onClick={() => router.push('/pricing')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-semibold"
              >
                S'abonner maintenant
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="text-3xl mr-4">🍽️</div>
              <div>
                <p className="text-2xl font-bold text-gray-900">0</p>
                <p className="text-gray-600">Menus générés</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="text-3xl mr-4">📖</div>
              <div>
                <p className="text-2xl font-bold text-gray-900">500+</p>
                <p className="text-gray-600">Recettes disponibles</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="text-3xl mr-4">💡</div>
              <div>
                <p className="text-2xl font-bold text-gray-900">0</p>
                <p className="text-gray-600">Conseils reçus</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <button
            onClick={() => router.push('/menu/generate')}
            className="bg-white rounded-lg shadow p-6 text-left hover:shadow-md transition-shadow"
          >
            <div className="text-4xl mb-4">🍳</div>
            <h3 className="text-lg font-semibold mb-2">Générer un Menu</h3>
            <p className="text-gray-600 text-sm">
              Créez un menu personnalisé basé sur vos préférences et restrictions alimentaires
            </p>
            <span className="inline-block mt-4 text-green-600 font-semibold">
              Commencer →
            </span>
          </button>

          <button
            onClick={() => router.push('/recipes')}
            className="bg-white rounded-lg shadow p-6 text-left hover:shadow-md transition-shadow"
          >
            <div className="text-4xl mb-4">📚</div>
            <h3 className="text-lg font-semibold mb-2">Parcourir les Recettes</h3>
            <p className="text-gray-600 text-sm">
              Explorez notre base de recettes anti-inflammatoires validées par des nutritionnistes
            </p>
            <span className="inline-block mt-4 text-green-600 font-semibold">
              Explorer →
            </span>
          </button>

          <button
            onClick={() => router.push('/profile')}
            className="bg-white rounded-lg shadow p-6 text-left hover:shadow-md transition-shadow"
          >
            <div className="text-4xl mb-4">⚙️</div>
            <h3 className="text-lg font-semibold mb-2">Mon Profil</h3>
            <p className="text-gray-600 text-sm">
              Configurez vos préférences, restrictions alimentaires et objectifs santé
            </p>
            <span className="inline-block mt-4 text-green-600 font-semibold">
              Configurer →
            </span>
          </button>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Activité Récente</h2>
          </div>
          <div className="p-6">
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-4">📝</div>
              <p>Aucune activité récente</p>
              <p className="text-sm mt-2">
                Commencez par générer votre premier menu personnalisé !
              </p>
            </div>
          </div>
        </div>

        {/* Subscription Info */}
        <div className="mt-8 bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Mon Abonnement</h2>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">
                  {user?.subscription_status === 'active' ? 'Plan Premium' : 'Essai Gratuit'}
                </p>
                <p className="text-gray-600 text-sm">
                  {user?.subscription_status === 'active' 
                    ? `Renouvellement le ${user.current_period_end ? new Date(user.current_period_end).toLocaleDateString('fr-FR') : 'N/A'}`
                    : `Expire le ${user?.trial_ends_at ? new Date(user.trial_ends_at).toLocaleDateString('fr-FR') : 'N/A'}`
                  }
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold">
                  {user?.subscription_status === 'active' ? '6,99€/mois' : 'Gratuit'}
                </p>
                {user?.subscription_status === 'active' && (
                  <button className="text-gray-500 text-sm hover:text-gray-700">
                    Gérer l'abonnement
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Chargement...</p>
      </div>
    </div>}>
      <DashboardContent />
    </Suspense>
  )
}