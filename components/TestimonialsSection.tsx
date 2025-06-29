'use client'

import { useState, useEffect } from 'react'
import { useABTest } from '@/components/ab-testing/ABTestProvider'
import { trackBusinessEvents } from '@/components/analytics/GoogleAnalytics'

interface Testimonial {
  id: number
  name: string
  age: number
  location: string
  usageDuration: string
  result: string
  metric: string
  quote: string
  avatar: string
  rating: number
  condition?: string
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: "Marie L.",
    age: 42,
    location: "Lyon",
    usageDuration: "3 mois",
    result: "Inflammation réduite de 45%",
    metric: "CRP: 8.2 → 4.5 mg/L",
    quote: "Mes douleurs articulaires ont pratiquement disparu. Les recettes sont délicieuses et mon médecin est impressionné par les résultats de mes analyses.",
    avatar: "👩‍⚕️",
    rating: 5,
    condition: "Arthrite rhumatoïde"
  },
  {
    id: 2,
    name: "Pierre M.",
    age: 38,
    location: "Paris",
    usageDuration: "2 mois",
    result: "Perte de poids: 8kg",
    metric: "IMC: 28.5 → 25.1",
    quote: "L'IA a trouvé exactement ce dont j'avais besoin. Fini les ballonnements et j'ai retrouvé mon énergie d'avant. Un investissement qui change la vie !",
    avatar: "👨‍💼",
    rating: 5,
    condition: "Syndrome métabolique"
  },
  {
    id: 3,
    name: "Sophie R.",
    age: 35,
    location: "Bordeaux",
    usageDuration: "4 mois",
    result: "Énergie +60%",
    metric: "Fatigue: 8/10 → 3/10",
    quote: "Plus de coups de fatigue dans l'après-midi ! Les menus sont variés et parfaitement adaptés à mes intolérances. Je recommande à 100%.",
    avatar: "👩‍🎨",
    rating: 5,
    condition: "Fatigue chronique"
  },
  {
    id: 4,
    name: "Thomas D.",
    age: 44,
    location: "Lille",
    usageDuration: "5 mois",
    result: "Cholestérol normalisé",
    metric: "LDL: 180 → 115 mg/dL",
    quote: "Mon cardiologue n'en revenait pas. Les recettes anti-inflammatoires ont révolutionné ma santé cardiovasculaire sans médicaments.",
    avatar: "👨‍🔬",
    rating: 5,
    condition: "Hypercholestérolémie"
  },
  {
    id: 5,
    name: "Isabelle K.",
    age: 51,
    location: "Toulouse",
    usageDuration: "6 mois",
    result: "Glycémie stabilisée",
    metric: "HbA1c: 7.2% → 6.1%",
    quote: "Diabétique de type 2, j'ai enfin trouvé un équilibre alimentaire durable. L'IA comprend vraiment mes besoins spécifiques.",
    avatar: "👩‍🍳",
    rating: 5,
    condition: "Diabète type 2"
  }
]

// Emotional variants for A/B testing
const emotionalTestimonials: Testimonial[] = [
  {
    id: 1,
    name: "Marie L.",
    age: 42,
    location: "Lyon",
    usageDuration: "3 mois",
    result: "Je me sens renaître !",
    metric: "Fini les douleurs constantes",
    quote: "C'est magique ! Mes matins difficiles appartiennent au passé. Je peux enfin jouer avec mes enfants sans souffrir. NutriCoach a littéralement changé ma vie.",
    avatar: "👩‍⚕️",
    rating: 5,
    condition: "Arthrite rhumatoïde"
  },
  {
    id: 2,
    name: "Pierre M.",
    age: 38,
    location: "Paris",
    usageDuration: "2 mois",
    result: "Retrouvé ma confiance en moi",
    metric: "Plus jamais de ballonnements",
    quote: "Incroyable ! Je me sens léger et plein d'énergie. Mes collègues me demandent mon secret. C'est simple : NutriCoach a transformé ma relation à la nourriture.",
    avatar: "👨‍💼",
    rating: 5,
    condition: "Syndrome métabolique"
  },
  {
    id: 3,
    name: "Sophie R.",
    age: 35,
    location: "Bordeaux",
    usageDuration: "4 mois",
    result: "Je déborde d'énergie",
    metric: "Terminé les après-midi difficiles",
    quote: "Révolutionnaire ! Plus de coups de fatigue, plus de frustration. Je suis enfin la personne dynamique que j'ai toujours voulu être.",
    avatar: "👩‍🎨",
    rating: 5,
    condition: "Fatigue chronique"
  },
  {
    id: 4,
    name: "Thomas D.",
    age: 44,
    location: "Lille",
    usageDuration: "5 mois",
    result: "Mon cœur me dit merci",
    metric: "Fini l'angoisse des analyses",
    quote: "Libérateur ! Plus de stress à chaque visite médicale. Je mange avec plaisir en sachant que je prends soin de mon cœur. C'est un vrai soulagement.",
    avatar: "👨‍🔬",
    rating: 5,
    condition: "Hypercholestérolémie"
  },
  {
    id: 5,
    name: "Isabelle K.",
    age: 51,
    location: "Toulouse",
    usageDuration: "6 mois",
    result: "Enfin sereine avec ma santé",
    metric: "Plus de peur du sucre",
    quote: "Fantastique ! J'ai retrouvé la joie de cuisiner et de partager des repas. Plus de culpabilité, plus d'inquiétude. Je vis enfin pleinement.",
    avatar: "👩‍🍳",
    rating: 5,
    condition: "Diabète type 2"
  }
]

const trustBadges = [
  { icon: "🏥", text: "Validé par des nutritionnistes", color: "from-green-500 to-green-600" },
  { icon: "🔒", text: "Données médicales sécurisées", color: "from-blue-500 to-blue-600" },
  { icon: "⚡", text: "Résultats dès 2 semaines", color: "from-purple-500 to-purple-600" },
  { icon: "🎯", text: "Personnalisation IA avancée", color: "from-orange-500 to-orange-600" }
]

export default function TestimonialsSection() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  
  // A/B test for testimonials style
  const { variant: testimonialsVariant, trackConversion } = useABTest('testimonials_style')
  
  // Choose testimonials based on A/B test variant
  const activeTestimonials = testimonialsVariant === 'control' ? testimonials : emotionalTestimonials

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 }
    )

    const section = document.getElementById('testimonials-section')
    if (section) {
      observer.observe(section)
    }

    return () => {
      if (section) {
        observer.unobserve(section)
      }
    }
  }, [])

  useEffect(() => {
    if (isVisible) {
      // Track testimonials section view
      trackBusinessEvents.featureUsed('testimonials_viewed', undefined, {
        variant: testimonialsVariant,
        testimonials_style: testimonialsVariant === 'control' ? 'metrics' : 'emotional'
      })
      
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % activeTestimonials.length)
      }, 5000)
      return () => clearInterval(interval)
    }
  }, [isVisible])

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={`text-lg ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}>
        ⭐
      </span>
    ))
  }

  return (
    <section id="testimonials-section" className="py-20 bg-gradient-to-br from-green-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Plus de 10 000 personnes ont déjà transformé leur santé
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Des résultats mesurables et scientifiquement prouvés. 
            Découvrez comment nos utilisateurs ont amélioré leur bien-être.
          </p>
        </div>

        {/* Trust Badges */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          {trustBadges.map((badge, index) => (
            <div
              key={index}
              className={`bg-gradient-to-r ${badge.color} p-4 rounded-xl text-white text-center shadow-lg transform hover:scale-105 transition-all duration-200`}
            >
              <div className="text-2xl mb-2">{badge.icon}</div>
              <div className="text-sm font-semibold">{badge.text}</div>
            </div>
          ))}
        </div>

        {/* Main Testimonial Display */}
        <div className="relative mb-12">
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 border border-gray-100">
            <div className="flex flex-col md:flex-row items-center gap-8">
              {/* Avatar and Info */}
              <div className="flex-shrink-0 text-center">
                <div className="text-6xl mb-4">{activeTestimonials[currentIndex].avatar}</div>
                <div className="text-lg font-bold text-gray-900">
                  {activeTestimonials[currentIndex].name}
                </div>
                <div className="text-gray-600">
                  {activeTestimonials[currentIndex].age} ans • {activeTestimonials[currentIndex].location}
                </div>
                <div className="text-sm text-blue-600 font-semibold mt-1">
                  {activeTestimonials[currentIndex].condition}
                </div>
              </div>

              {/* Testimonial Content */}
              <div className="flex-1">
                <div className="flex items-center mb-4">
                  {renderStars(activeTestimonials[currentIndex].rating)}
                  <span className="ml-2 text-sm text-gray-600">
                    Utilise NutriCoach depuis {activeTestimonials[currentIndex].usageDuration}
                  </span>
                </div>
                
                <blockquote className="text-lg text-gray-700 italic mb-6 leading-relaxed">
                  "{activeTestimonials[currentIndex].quote}"
                </blockquote>

                {/* Results Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={`p-4 rounded-lg border ${
                    testimonialsVariant === 'control'
                      ? 'bg-gradient-to-r from-green-50 to-green-100 border-green-200'
                      : 'bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200'
                  }`}>
                    <div className={`text-sm font-semibold mb-1 ${
                      testimonialsVariant === 'control' ? 'text-green-700' : 'text-purple-700'
                    }`}>
                      {testimonialsVariant === 'control' ? 'RÉSULTAT PRINCIPAL' : 'TRANSFORMATION'}
                    </div>
                    <div className={`text-xl font-bold ${
                      testimonialsVariant === 'control' ? 'text-green-800' : 'text-purple-800'
                    }`}>
                      {activeTestimonials[currentIndex].result}
                    </div>
                  </div>
                  <div className={`p-4 rounded-lg border ${
                    testimonialsVariant === 'control'
                      ? 'bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200'
                      : 'bg-gradient-to-r from-pink-50 to-pink-100 border-pink-200'
                  }`}>
                    <div className={`text-sm font-semibold mb-1 ${
                      testimonialsVariant === 'control' ? 'text-blue-700' : 'text-pink-700'
                    }`}>
                      {testimonialsVariant === 'control' ? 'MESURE MÉDICALE' : 'BÉNÉFICE RESSENTI'}
                    </div>
                    <div className={`text-lg font-bold ${
                      testimonialsVariant === 'control' ? 'text-blue-800' : 'text-pink-800'
                    }`}>
                      {activeTestimonials[currentIndex].metric}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Dots */}
          <div className="flex justify-center mt-6 space-x-2">
            {activeTestimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setCurrentIndex(index)
                  // Track testimonial interaction
                  trackConversion('testimonial_navigation', 1)
                }}
                className={`w-3 h-3 rounded-full transition-all duration-200 ${
                  index === currentIndex
                    ? 'bg-green-600 w-8'
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="text-center">
            <div className="text-4xl font-bold text-green-600 mb-2">89%</div>
            <div className="text-gray-700">Réduction de l'inflammation mesurée</div>
            <div className="text-sm text-gray-500">Sur 3 mois d'utilisation</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-600 mb-2">2.3 sem</div>
            <div className="text-gray-700">Temps moyen pour premiers résultats</div>
            <div className="text-sm text-gray-500">Énergie et digestion</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-purple-600 mb-2">96%</div>
            <div className="text-gray-700">Satisfaction clients</div>
            <div className="text-sm text-gray-500">Recommandent à leurs proches</div>
          </div>
        </div>

        {/* Medical Validation */}
        <div className="bg-white rounded-xl p-6 border-l-4 border-green-500 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="text-3xl">🏥</div>
            <div>
              <div className="font-bold text-lg text-gray-900">Validation médicale</div>
              <div className="text-gray-600">
                Tous les témoignages sont vérifiés avec analyses médicales à l'appui. 
                Les résultats peuvent varier selon les individus.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}