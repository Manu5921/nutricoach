'use client'

import { useState } from 'react'
import { useABTest } from '@/components/ab-testing/ABTestProvider'
import { trackBusinessEvents } from '@/components/analytics/GoogleAnalytics'

interface FAQItem {
  id: number
  question: string
  answer: string
  category: 'payment' | 'security' | 'results' | 'usage'
  icon: string
  priority: number
}

const faqData: FAQItem[] = [
  {
    id: 1,
    question: "Puis-je annuler à tout moment ?",
    answer: "Oui, absolument ! Vous pouvez annuler votre abonnement à tout moment depuis votre tableau de bord. Aucun engagement, aucun frais de résiliation. Votre accès reste actif jusqu'à la fin de votre période de facturation actuelle.",
    category: 'payment',
    icon: '🔓',
    priority: 1
  },
  {
    id: 2,
    question: "D'où viennent les données nutritionnelles ?",
    answer: "Nous utilisons la base de données nutritionnelles USDA (United States Department of Agriculture) combinée aux dernières recherches scientifiques sur la nutrition anti-inflammatoire. Toutes nos recommandations sont validées par notre équipe de nutritionnistes diplômés.",
    category: 'security',
    icon: '🔬',
    priority: 2
  },
  {
    id: 3,
    question: "Mes données personnelles sont-elles sécurisées ?",
    answer: "La sécurité de vos données est notre priorité absolue. Nous utilisons un chiffrement de niveau bancaire (AES-256), sommes conformes RGPD, et vos données de santé ne sont jamais partagées avec des tiers. Hébergement sécurisé en Europe.",
    category: 'security',
    icon: '🛡️',
    priority: 3
  },
  {
    id: 4,
    question: "Combien de temps pour voir des résultats ?",
    answer: "La plupart de nos utilisateurs rapportent une amélioration de leur énergie et digestion dès 2-3 semaines. Pour les marqueurs inflammatoires (analyses sanguines), comptez 6-8 semaines. Les résultats dépendent de votre engagement et de votre situation de départ.",
    category: 'results',
    icon: '⏱️',
    priority: 4
  },
  {
    id: 5,
    question: "Comment l'IA personnalise-t-elle mes menus ?",
    answer: "Notre IA analyse vos préférences alimentaires, restrictions, objectifs de santé, réactions aux aliments et résultats pour créer des menus uniques. Plus vous utilisez l'app, plus elle s'adapte à vos besoins spécifiques.",
    category: 'usage',
    icon: '🤖',
    priority: 5
  },
  {
    id: 6,
    question: "Y a-t-il une période d'essai gratuite ?",
    answer: "Nous ne proposons pas d'essai gratuit classique, mais nous offrons une garantie satisfait ou remboursé de 30 jours. Si vous n'êtes pas satisfait dans les 30 premiers jours, nous vous remboursons intégralement, sans questions.",
    category: 'payment',
    icon: '💰',
    priority: 6
  },
  {
    id: 7,
    question: "L'app fonctionne-t-elle avec mes pathologies ?",
    answer: "Notre approche anti-inflammatoire bénéficie à de nombreuses conditions : arthrite, diabète type 2, syndrome métabolique, fatigue chronique, troubles digestifs. Cependant, consultez toujours votre médecin avant tout changement alimentaire majeur.",
    category: 'results',
    icon: '🏥',
    priority: 7
  },
  {
    id: 8,
    question: "Puis-je exporter mes menus et listes de courses ?",
    answer: "Oui ! Vous pouvez exporter vos menus hebdomadaires et listes de courses en PDF. Vous pouvez aussi partager vos recettes préférées avec vos proches et synchroniser avec votre calendrier.",
    category: 'usage',
    icon: '📋',
    priority: 8
  }
]

const categoryIcons = {
  payment: '💳',
  security: '🔒',
  results: '📈',
  usage: '🔧'
}

const categoryColors = {
  payment: 'from-green-500 to-green-600',
  security: 'from-blue-500 to-blue-600',
  results: 'from-purple-500 to-purple-600',
  usage: 'from-orange-500 to-orange-600'
}

export default function FAQSection() {
  const [openItems, setOpenItems] = useState<number[]>([1]) // First item open by default
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  
  // A/B test for FAQ order
  const { variant: faqOrderVariant, trackConversion } = useABTest('faq_order')

  const toggleItem = (id: number) => {
    setOpenItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    )
    
    // Track FAQ interaction
    const faqItem = faqData.find(item => item.id === id)
    if (faqItem) {
      trackBusinessEvents.featureUsed('faq_question_opened', undefined, {
        question_category: faqItem.category,
        question_id: id,
        faq_order_variant: faqOrderVariant
      })
      
      // Track as conversion if payment-related question
      if (faqItem.category === 'payment') {
        trackConversion('faq_payment_interaction', 1)
      }
    }
  }

  // Create priority mapping based on A/B test variant
  const getPriorityForVariant = (item: FAQItem) => {
    if (faqOrderVariant === 'control') {
      // Control: security first
      if (item.category === 'security') return item.priority - 10
      if (item.category === 'payment') return item.priority + 5
    } else {
      // Variant: payment first  
      if (item.category === 'payment') return item.priority - 10
      if (item.category === 'security') return item.priority + 5
    }
    return item.priority
  }

  const filteredFAQs = selectedCategory === 'all' 
    ? faqData.sort((a, b) => getPriorityForVariant(a) - getPriorityForVariant(b))
    : faqData.filter(item => item.category === selectedCategory).sort((a, b) => a.priority - b.priority)

  const categories = [
    { key: 'all', label: 'Toutes les questions', icon: '❓' },
    { key: 'payment', label: 'Paiement & Abonnement', icon: categoryIcons.payment },
    { key: 'security', label: 'Sécurité & Confidentialité', icon: categoryIcons.security },
    { key: 'results', label: 'Résultats & Efficacité', icon: categoryIcons.results },
    { key: 'usage', label: 'Utilisation & Fonctionnalités', icon: categoryIcons.usage }
  ]

  return (
    <section className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Questions fréquentes
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Toutes les réponses à vos questions sur NutriCoach. 
            Besoin d'aide supplémentaire ? Notre équipe est là pour vous.
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {categories.map(category => (
            <button
              key={category.key}
              onClick={() => setSelectedCategory(category.key)}
              className={`px-6 py-3 rounded-full text-sm font-semibold transition-all duration-200 transform hover:scale-105 ${
                selectedCategory === category.key
                  ? 'bg-gradient-to-r from-green-600 to-blue-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span className="mr-2">{category.icon}</span>
              {category.label}
            </button>
          ))}
        </div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {filteredFAQs.map((item, index) => (
            <div
              key={item.id}
              className={`bg-white border-2 rounded-xl shadow-sm transition-all duration-300 hover:shadow-md ${
                openItems.includes(item.id) 
                  ? 'border-green-200 shadow-lg' 
                  : 'border-gray-200'
              }`}
              style={{ 
                animationDelay: `${index * 0.1}s`,
                animation: selectedCategory !== 'all' ? 'fadeInUp 0.5s ease-out forwards' : 'none'
              }}
            >
              <button
                onClick={() => toggleItem(item.id)}
                className="w-full px-6 py-5 text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 rounded-xl"
              >
                <div className="flex items-center space-x-4 flex-1">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${categoryColors[item.category]} flex items-center justify-center text-white text-lg flex-shrink-0`}>
                    {item.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 pr-4">
                    {item.question}
                  </h3>
                </div>
                <div className={`text-2xl transition-transform duration-300 flex-shrink-0 ${
                  openItems.includes(item.id) ? 'rotate-45' : ''
                }`}>
                  <span className="text-green-600">+</span>
                </div>
              </button>
              
              <div className={`overflow-hidden transition-all duration-300 ${
                openItems.includes(item.id) ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
              }`}>
                <div className="px-6 pb-6 pt-2">
                  <div className="ml-14">
                    <p className="text-gray-700 leading-relaxed">
                      {item.answer}
                    </p>
                    
                    {/* Special CTAs for payment-related questions */}
                    {item.category === 'payment' && (
                      <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
                        <p className="text-sm text-green-800 font-semibold">
                          ✨ Prêt à commencer ? Rejoignez plus de 10 000 utilisateurs satisfaits !
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Contact Support */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-8 border border-green-200">
            <div className="text-4xl mb-4">💬</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Vous ne trouvez pas votre réponse ?
            </h3>
            <p className="text-gray-600 mb-6">
              Notre équipe d'experts en nutrition est disponible 7j/7 pour vous accompagner
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="mailto:support@nutricoach.fr"
                className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105"
              >
                📧 Contactez-nous
              </a>
              <a 
                href="/help"
                className="border-2 border-green-600 text-green-600 hover:bg-green-600 hover:text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200"
              >
                📚 Centre d'aide
              </a>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </section>
  )
}