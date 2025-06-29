'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client' // Changed import path
import Link from 'next/link'
import TestimonialsSection from '@/components/TestimonialsSection'
import FAQSection from '@/components/FAQSection'
import StickyCtaBanner from '@/components/StickyCtaBanner'
import { OptimizedImage, imageSizes, blurPlaceholders } from '@/components/ui/OptimizedImage'
import { StructuredData, schemaData } from '@/components/seo/StructuredData'

export default function HomePage() {
  const router = useRouter()
  const supabase = createClient()
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null)

  useEffect(() => {
    // Check if user is logged in
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setIsLoggedIn(!!session)
    }
    checkAuth()
  }, [])

  const handleGetStarted = () => {
    if (isLoggedIn) {
      router.push('/dashboard')
    } else {
      router.push('/signup')
    }
  }

  return (
    <>
      {/* Structured Data for SEO */}
      <StructuredData type="WebSite" data={schemaData.website} />
      <StructuredData type="Organization" data={schemaData.organization} />
      <StructuredData type="SoftwareApplication" data={schemaData.softwareApplication} />
      
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50 h-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
          <div className="flex justify-between items-center h-full">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                NutriCoach
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {isLoggedIn ? (
                <Link
                  href="/dashboard"
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Connexion
                  </Link>
                  <Link
                    href="/signup"
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                  >
                    Commencer - 6,99€
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Nutrition Anti-Inflammatoire
            <span className="block bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              Personnalisée par IA
            </span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            Transformez votre alimentation avec des recettes personnalisées, des conseils nutritionnels adaptatifs 
            et un suivi complet de votre bien-être. L'intelligence artificielle au service de votre santé.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <button
              onClick={handleGetStarted}
              className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              Commencer maintenant - 6,99€/mois
            </button>
            <Link
              href="/pricing"
              className="border-2 border-green-600 text-green-600 hover:bg-green-600 hover:text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-200"
            >
              Voir les tarifs
            </Link>
          </div>
          
          <div className="text-sm text-gray-500 space-x-4">
            <span>✅ Accès immédiat</span>
            <span>✅ Paiement sécurisé</span>
            <span>✅ Plus de 500 recettes</span>
          </div>
          
          {/* Hero Image */}
          <div className="mt-16 relative">
            <div className="w-full h-[675px] bg-gradient-to-br from-green-100 via-blue-50 to-purple-100 rounded-2xl shadow-2xl flex items-center justify-center">
              <div className="text-center p-8">
                <div className="text-6xl mb-4">🥗</div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Dashboard NutriCoach</h3>
                <p className="text-gray-600">Interface de nutrition personnalisée par IA</p>
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-2xl" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Pourquoi choisir NutriCoach ?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Une approche scientifique de la nutrition anti-inflammatoire, 
              personnalisée grâce à l'intelligence artificielle.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-8 rounded-2xl bg-gradient-to-br from-green-50 to-green-100 border border-green-200">
              <div className="mb-6 relative h-24 w-24 mx-auto bg-green-200 rounded-full flex items-center justify-center">
                <span className="text-3xl">🧠</span>
              </div>
              <h3 className="text-xl font-bold mb-4 text-gray-900">IA Nutritionnelle Avancée</h3>
              <p className="text-gray-600">
                Algorithmes de pointe qui analysent vos besoins nutritionnels, préférences et objectifs 
                pour créer des recommandations parfaitement adaptées.
              </p>
            </div>
            
            <div className="text-center p-8 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
              <div className="mb-6 relative h-24 w-24 mx-auto bg-blue-200 rounded-full flex items-center justify-center">
                <span className="text-3xl">🔬</span>
              </div>
              <h3 className="text-xl font-bold mb-4 text-gray-900">Validé Scientifiquement</h3>
              <p className="text-gray-600">
                Toutes nos recettes sont basées sur la recherche en nutrition anti-inflammatoire 
                et validées par des nutritionnistes experts.
              </p>
            </div>
            
            <div className="text-center p-8 rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200">
              <div className="mb-6 relative h-24 w-24 mx-auto bg-purple-200 rounded-full flex items-center justify-center">
                <span className="text-3xl">🛡️</span>
              </div>
              <h3 className="text-xl font-bold mb-4 text-gray-900">Sécurité Maximale</h3>
              <p className="text-gray-600">
                Chiffrement niveau médical pour protéger vos données de santé. 
                Conformité RGPD et respect total de votre vie privée.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Comment ça fonctionne ?
            </h2>
            <p className="text-xl text-gray-600">
              Trois étapes simples pour transformer votre alimentation
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-green-600 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-6">
                1
              </div>
              <h3 className="text-xl font-bold mb-4">Configurez votre profil</h3>
              <p className="text-gray-600">
                Renseignez vos préférences alimentaires, restrictions et objectifs de santé. 
                L'IA apprend à vous connaître.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-6">
                2
              </div>
              <h3 className="text-xl font-bold mb-4">Recevez vos menus</h3>
              <p className="text-gray-600">
                L'IA génère des menus personnalisés avec des recettes anti-inflammatoires 
                adaptées à vos besoins spécifiques.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-purple-600 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-6">
                3
              </div>
              <h3 className="text-xl font-bold mb-4">Suivez vos progrès</h3>
              <p className="text-gray-600">
                Trackez vos résultats, ajustez vos préférences et laissez l'IA 
                optimiser continuellement vos recommandations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Une approche révolutionnaire de la nutrition
              </h2>
              <div className="space-y-6">
                <div className="flex items-start">
                  <span className="text-green-600 text-2xl mr-4">🍽️</span>
                  <div>
                    <h3 className="font-bold text-lg mb-2">Plus de 500 recettes anti-inflammatoires</h3>
                    <p className="text-gray-600">
                      Base de données complète de recettes validées scientifiquement pour réduire l'inflammation.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <span className="text-blue-600 text-2xl mr-4">🎯</span>
                  <div>
                    <h3 className="font-bold text-lg mb-2">Personnalisation intelligente</h3>
                    <p className="text-gray-600">
                      L'IA s'adapte en temps réel à vos retours pour optimiser continuellement vos recommandations.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <span className="text-purple-600 text-2xl mr-4">📊</span>
                  <div>
                    <h3 className="font-bold text-lg mb-2">Suivi complet et analyses</h3>
                    <p className="text-gray-600">
                      Tableaux de bord détaillés pour suivre vos progrès et comprendre l'impact sur votre santé.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-green-100 to-blue-100 p-8 rounded-2xl">
              <div className="text-center">
                <div className="mb-6 relative h-32 w-full bg-gradient-to-r from-green-200 to-blue-200 rounded-lg flex items-center justify-center">
                  <span className="text-4xl">📱</span>
                </div>
                <h3 className="text-2xl font-bold mb-4">Interface intuitive</h3>
                <p className="text-gray-600 mb-6">
                  Design pensé pour être simple d'utilisation, même pour les débutants en nutrition.
                </p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-white p-3 rounded-lg">
                    <div className="font-semibold">Export PDF</div>
                    <div className="text-gray-600">Listes de courses</div>
                  </div>
                  <div className="bg-white p-3 rounded-lg">
                    <div className="font-semibold">Partage facile</div>
                    <div className="text-gray-600">Menus & recettes</div>
                  </div>
                  <div className="bg-white p-3 rounded-lg">
                    <div className="font-semibold">Notifications</div>
                    <div className="text-gray-600">Rappels & conseils</div>
                  </div>
                  <div className="bg-white p-3 rounded-lg">
                    <div className="font-semibold">Support 24/7</div>
                    <div className="text-gray-600">Aide experte</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <TestimonialsSection />

      {/* FAQ Section */}
      <FAQSection />

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-green-600 to-blue-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-white mb-6">
            Prêt à transformer votre alimentation ?
          </h2>
          <p className="text-xl text-green-100 mb-8">
            Rejoignez des milliers d'utilisateurs qui ont déjà amélioré leur santé 
            grâce à nos recommandations nutritionnelles personnalisées.
          </p>
          
          <button
            onClick={handleGetStarted}
            className="bg-white text-green-600 hover:bg-gray-100 px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            Commencer maintenant - 6,99€/mois
          </button>
          
          <p className="text-green-100 mt-4 text-sm">
            Paiement sécurisé • Résiliation facile • Support inclus
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4 bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
                NutriCoach
              </h3>
              <p className="text-gray-400">
                L'intelligence artificielle au service de votre nutrition et de votre bien-être.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Produit</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/pricing" className="hover:text-white">Tarifs</Link></li>
                <li><Link href="/features" className="hover:text-white">Fonctionnalités</Link></li>
                <li><Link href="/recipes" className="hover:text-white">Recettes</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/help" className="hover:text-white">Centre d'aide</Link></li>
                <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
                <li><Link href="/faq" className="hover:text-white">FAQ</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Légal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/privacy" className="hover:text-white">Confidentialité</Link></li>
                <li><Link href="/terms" className="hover:text-white">Conditions</Link></li>
                <li><Link href="/cookies" className="hover:text-white">Cookies</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 NutriCoach. Tous droits réservés.</p>
          </div>
        </div>
      </footer>

      {/* Sticky CTA Banner */}
      <StickyCtaBanner isLoggedIn={isLoggedIn} />
      </div>
    </>
  )
}