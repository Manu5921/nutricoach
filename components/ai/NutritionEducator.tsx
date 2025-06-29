'use client'

import { useState, useEffect } from 'react'
import { UserProfile } from '@/lib/auth/types'

interface NutritionInsight {
  id: string
  title: string
  content: string
  insight_type: 'daily_tip' | 'myth_busting' | 'biomarker_education' | 'seasonal_nutrition' | 'personalized_advice'
  confidence_level: number // 0-1
  scientific_backing: 'preliminary' | 'moderate' | 'strong'
  sources: string[]
  personalization_score: number // 0-100 how relevant to user
  complexity_level: 'beginner' | 'intermediate' | 'advanced'
  tags: string[]
}

interface EducationalContent {
  question: string
  answer: string
  related_topics: string[]
  scientific_references: string[]
  practical_tips: string[]
  myth_status?: 'myth' | 'fact' | 'partially_true'
}

interface NutritionQA {
  question: string
  category: 'macronutrients' | 'micronutrients' | 'supplements' | 'meal_timing' | 'food_safety' | 'special_diets'
  difficulty: 'basic' | 'intermediate' | 'advanced'
  answer: string
  explanation: string
  practical_application: string
  common_misconceptions?: string[]
  scientific_consensus: string
}

interface NutritionEducatorProps {
  userProfile: UserProfile
}

const DAILY_TIPS: NutritionInsight[] = [
  {
    id: 'tip_1',
    title: 'La synergie des antioxydants',
    content: 'Les antioxydants travaillent mieux ensemble qu\'individuellement. Consommez une variété de fruits et légumes colorés pour maximiser leurs bienfaits. Les anthocyanes (bleu/violet), les caroténoïdes (orange/rouge) et les polyphénols (vert) se complètent parfaitement.',
    insight_type: 'daily_tip',
    confidence_level: 0.9,
    scientific_backing: 'strong',
    sources: ['Liu, R.H. (2013). Health-promoting components of fruits and vegetables in the diet'],
    personalization_score: 85,
    complexity_level: 'intermediate',
    tags: ['antioxydants', 'fruits', 'légumes', 'synergie']
  },
  {
    id: 'tip_2',
    title: 'Le timing optimal des protéines',
    content: 'Répartir votre apport protéique sur 3-4 repas optimise la synthèse protéique musculaire. Visez 20-30g de protéines par repas plutôt qu\'un gros apport en une fois.',
    insight_type: 'daily_tip',
    confidence_level: 0.85,
    scientific_backing: 'strong',
    sources: ['Areta, J.L. (2013). Timing and distribution of protein ingestion'],
    personalization_score: 75,
    complexity_level: 'beginner',
    tags: ['protéines', 'timing', 'muscles', 'répartition']
  }
]

const MYTH_BUSTING: EducationalContent[] = [
  {
    question: 'Les glucides le soir font-ils grossir ?',
    answer: 'Non, l\'heure de consommation des glucides n\'affecte pas directement la prise de poids. C\'est le bilan énergétique total qui compte.',
    related_topics: ['métabolisme', 'timing des repas', 'perte de poids'],
    scientific_references: [
      'Sofer, S. (2011). Greater weight loss with carbohydrate intake at dinner',
      'Kant, A.K. (2015). Evening eating and its relation to self-reported body weight'
    ],
    practical_tips: [
      'Concentrez-vous sur la qualité et la quantité totale',
      'Privilégiez les glucides complexes',
      'Adaptez selon votre activité physique'
    ],
    myth_status: 'myth'
  },
  {
    question: 'Faut-il éviter complètement le gluten ?',
    answer: 'Seules les personnes avec maladie cœliaque ou sensibilité avérée doivent éviter le gluten. Pour les autres, les céréales complètes avec gluten apportent des bénéfices nutritionnels.',
    related_topics: ['gluten', 'maladie cœliaque', 'céréales complètes'],
    scientific_references: [
      'Lebwohl, B. (2018). Long term gluten consumption in adults',
      'Niland, B. (2018). Health effects of a gluten-free diet'
    ],
    practical_tips: [
      'Consultez un professionnel avant d\'éliminer le gluten',
      'Si vous éliminez le gluten, assurez-vous d\'avoir des sources alternatives de fibres',
      'Attention aux produits transformés sans gluten souvent plus riches en sucre'
    ],
    myth_status: 'partially_true'
  }
]

const NUTRITION_QA: NutritionQA[] = [
  {
    question: 'Quelle est la différence entre les oméga-3 ALA, EPA et DHA ?',
    category: 'macronutrients',
    difficulty: 'intermediate',
    answer: 'L\'ALA est d\'origine végétale, EPA et DHA sont principalement d\'origine marine. L\'EPA est anti-inflammatoire, le DHA est crucial pour le cerveau.',
    explanation: 'L\'acide alpha-linolénique (ALA) des graines de lin et noix peut être converti en EPA et DHA, mais avec un taux de conversion très faible (moins de 10%). Les poissons gras fournissent directement EPA et DHA.',
    practical_application: 'Consommez 2-3 portions de poissons gras par semaine ET des sources végétales d\'ALA quotidiennement.',
    common_misconceptions: [
      'Les graines de lin suffisent pour les besoins en oméga-3',
      'Tous les oméga-3 sont équivalents'
    ],
    scientific_consensus: 'EPA et DHA marins sont plus efficaces que la conversion d\'ALA'
  },
  {
    question: 'Comment optimiser l\'absorption du fer ?',
    category: 'micronutrients',
    difficulty: 'intermediate',
    answer: 'Associez le fer avec de la vitamine C, évitez le thé/café pendant les repas, et séparez des sources de calcium.',
    explanation: 'Le fer héminique (viande) est mieux absorbé que le fer non-héminique (végétal). La vitamine C peut multiplier l\'absorption par 3-4.',
    practical_application: 'Ajoutez du jus de citron sur vos épinards, mangez des fruits riches en vitamine C avec vos légumineuses.',
    common_misconceptions: [
      'Le fer végétal est inutile',
      'Les suppléments de fer sont toujours nécessaires'
    ],
    scientific_consensus: 'La biodisponibilité du fer dépend fortement des associations alimentaires'
  }
]

export default function NutritionEducator({ userProfile }: NutritionEducatorProps) {
  const [selectedTab, setSelectedTab] = useState<'insights' | 'qa' | 'myths' | 'personalized'>('insights')
  const [personalizedInsights, setPersonalizedInsights] = useState<NutritionInsight[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [userQuestion, setUserQuestion] = useState<string>('')
  const [aiResponse, setAiResponse] = useState<string>('')
  const [isGeneratingResponse, setIsGeneratingResponse] = useState(false)

  useEffect(() => {
    generatePersonalizedInsights()
  }, [userProfile])

  const generatePersonalizedInsights = async () => {
    try {
      // Simulate AI-generated personalized insights based on user profile
      const insights: NutritionInsight[] = []

      // Based on health goals
      if (userProfile.health_profile?.health_goals?.includes('inflammation_reduction')) {
        insights.push({
          id: 'personal_1',
          title: 'Votre plan anti-inflammatoire personnalisé',
          content: 'Avec votre objectif de réduction d\'inflammation, privilégiez les poissons gras 3x/semaine, le curcuma avec poivre noir, et les baies riches en anthocyanes. Évitez les aliments ultra-transformés qui peuvent augmenter l\'inflammation.',
          insight_type: 'personalized_advice',
          confidence_level: 0.8,
          scientific_backing: 'strong',
          sources: ['Calder, P.C. (2017). Omega-3 fatty acids and inflammatory processes'],
          personalization_score: 95,
          complexity_level: 'intermediate',
          tags: ['anti-inflammatoire', 'personnalisé', 'oméga-3']
        })
      }

      // Based on biomarkers
      if (userProfile.health_profile?.health_biomarkers?.crp_level && 
          userProfile.health_profile.health_biomarkers.crp_level > 3) {
        insights.push({
          id: 'personal_2',
          title: 'Stratégie nutritionnelle pour votre CRP élevée',
          content: 'Votre niveau de CRP indique une inflammation. Intégrez quotidiennement: curcuma + poivre noir, thé vert, poissons gras, et réduisez les sucres ajoutés. Ces changements peuvent réduire la CRP de 20-40% en 8-12 semaines.',
          insight_type: 'biomarker_education',
          confidence_level: 0.85,
          scientific_backing: 'strong',
          sources: ['Chrysohoou, C. (2004). Adherence to Mediterranean diet attenuates inflammation'],
          personalization_score: 98,
          complexity_level: 'advanced',
          tags: ['CRP', 'inflammation', 'biomarqueurs']
        })
      }

      // Seasonal insights
      const currentMonth = new Date().getMonth()
      if (currentMonth >= 9 || currentMonth <= 2) { // Automne/Hiver
        insights.push({
          id: 'seasonal_1',
          title: 'Nutrition d\'automne/hiver adaptée',
          content: 'Renforcez votre immunité avec les légumes racines riches en bêta-carotène, les agrumes pour la vitamine C, et n\'oubliez pas la vitamine D (supplémentation souvent nécessaire en France l\'hiver).',
          insight_type: 'seasonal_nutrition',
          confidence_level: 0.9,
          scientific_backing: 'strong',
          sources: ['Martineau, A.R. (2017). Vitamin D supplementation to prevent infections'],
          personalization_score: 80,
          complexity_level: 'beginner',
          tags: ['saisonnier', 'immunité', 'vitamine D']
        })
      }

      setPersonalizedInsights(insights)
    } catch (error) {
      console.error('Error generating personalized insights:', error)
    }
  }

  const handleUserQuestion = async () => {
    if (!userQuestion.trim()) return

    setIsGeneratingResponse(true)
    try {
      // Simulate AI response generation
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Generate contextual response based on question
      let response = ''
      
      if (userQuestion.toLowerCase().includes('protéine')) {
        response = `Excellente question sur les protéines ! Basé sur votre profil, voici mes recommandations personnalisées:

**Vos besoins estimés:** ${userProfile.health_profile?.caloric_needs ? Math.round(userProfile.health_profile.caloric_needs * 0.15 / 4) : '80-100'}g de protéines par jour

**Sources optimales pour vous:**
• Poissons gras (saumon, sardines) - 2-3x/semaine pour les oméga-3
• Légumineuses (lentilles, pois chiches) - riches en fibres et magnésium
• Œufs - protéines complètes et choline pour le cerveau
• Tofu/tempeh si vous êtes végétarien(ne)

**Timing optimal:** Répartissez sur 3-4 repas, avec 20-25g par repas pour optimiser la synthèse protéique.

*Références scientifiques:* Moore et al. (2012) - Muscle protein synthesis rates`
      } else if (userQuestion.toLowerCase().includes('inflammation')) {
        response = `Parfait ! L'alimentation anti-inflammatoire est votre super-pouvoir nutritionnel:

**Votre profil anti-inflammatoire personnalisé:**
• **Champions anti-inflammatoires:** Curcuma + poivre noir, poissons gras, baies, légumes verts feuillus
• **À modérer:** Sucres ajoutés, aliments ultra-transformés, excès d'oméga-6
• **Votre score cible:** Viser un ratio oméga-3/oméga-6 de 1:4 maximum

**Plan d'action 30 jours:**
1. Semaine 1-2: Ajoutez 1 portion de poissons gras
2. Semaine 3-4: Intégrez curcuma + gingembre quotidiennement
3. Semaine 5+: Mesurez l'évolution (énergie, douleurs articulaires)

*Note personnalisée:* ${userProfile.health_profile?.health_biomarkers?.crp_level ? 'Avec votre CRP actuelle, ces changements pourraient la réduire de 20-40%' : 'Ces stratégies sont préventives et optimisent votre santé à long terme'}`
      } else {
        response = `Merci pour votre question "${userQuestion}". 

Basé sur votre profil nutritionnel et vos objectifs de santé, voici une réponse personnalisée:

**Contexte important pour vous:**
${userProfile.health_profile?.health_goals?.length ? `• Vos objectifs: ${userProfile.health_profile.health_goals.join(', ')}` : '• Profil de santé général'}
${userProfile.dietary_preferences?.length ? `• Vos préférences: ${userProfile.dietary_preferences.join(', ')}` : ''}

**Recommandations scientifiques:**
• Approche basée sur les preuves scientifiques
• Adaptation à votre style de vie français
• Focus sur les aliments entiers et minimalement transformés

**Prochaines étapes:**
1. Intégrez graduellement les changements
2. Observez les réactions de votre corps
3. Ajustez selon vos sensations

*Voulez-vous approfondir un aspect particulier ?*`
      }

      setAiResponse(response)
    } catch (error) {
      console.error('Error generating AI response:', error)
      setAiResponse('Désolé, une erreur est survenue. Veuillez réessayer.')
    } finally {
      setIsGeneratingResponse(false)
    }
  }

  const filteredInsights = personalizedInsights.filter(insight => {
    const matchesCategory = selectedCategory === 'all' || insight.tags.includes(selectedCategory)
    const matchesSearch = searchQuery === '' || 
      insight.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      insight.content.toLowerCase().includes(searchQuery.toLowerCase())
    
    return matchesCategory && matchesSearch
  })

  const filteredMythBusting = MYTH_BUSTING.filter(myth =>
    searchQuery === '' || 
    myth.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    myth.answer.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredQA = NUTRITION_QA.filter(qa =>
    searchQuery === '' ||
    qa.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    qa.answer.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const renderInsightCard = (insight: NutritionInsight) => {
    const typeIcons = {
      'daily_tip': '💡',
      'myth_busting': '🔍',
      'biomarker_education': '🔬',
      'seasonal_nutrition': '🌱',
      'personalized_advice': '👤'
    }

    const complexityColors = {
      'beginner': 'bg-green-100 text-green-800',
      'intermediate': 'bg-yellow-100 text-yellow-800',
      'advanced': 'bg-red-100 text-red-800'
    }

    const scientificColors = {
      'preliminary': 'bg-gray-100 text-gray-800',
      'moderate': 'bg-blue-100 text-blue-800',
      'strong': 'bg-purple-100 text-purple-800'
    }

    return (
      <div key={insight.id} className="bg-white rounded-lg border p-6 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">{typeIcons[insight.insight_type]}</span>
            <h3 className="font-semibold text-gray-900">{insight.title}</h3>
          </div>
          <div className="flex space-x-2">
            <span className={`px-2 py-1 text-xs rounded-full ${complexityColors[insight.complexity_level]}`}>
              {insight.complexity_level}
            </span>
            <span className={`px-2 py-1 text-xs rounded-full ${scientificColors[insight.scientific_backing]}`}>
              {insight.scientific_backing}
            </span>
          </div>
        </div>

        <p className="text-gray-700 mb-4 leading-relaxed">{insight.content}</p>

        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-1">
            {insight.tags.map((tag, index) => (
              <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                {tag}
              </span>
            ))}
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <span>Pertinence: {insight.personalization_score}%</span>
          </div>
        </div>

        {insight.sources.length > 0 && (
          <details className="mt-4">
            <summary className="text-sm text-blue-600 cursor-pointer hover:text-blue-800">
              Références scientifiques
            </summary>
            <ul className="mt-2 text-xs text-gray-600 space-y-1">
              {insight.sources.map((source, index) => (
                <li key={index}>• {source}</li>
              ))}
            </ul>
          </details>
        )}
      </div>
    )
  }

  const renderMythCard = (myth: EducationalContent) => {
    const statusIcons = {
      'myth': '❌',
      'fact': '✅',
      'partially_true': '⚠️'
    }

    const statusColors = {
      'myth': 'bg-red-100 text-red-800',
      'fact': 'bg-green-100 text-green-800',
      'partially_true': 'bg-yellow-100 text-yellow-800'
    }

    return (
      <div key={myth.question} className="bg-white rounded-lg border p-6 hover:shadow-md transition-shadow">
        <div className="flex items-start space-x-3 mb-4">
          <span className="text-2xl">{statusIcons[myth.myth_status || 'fact']}</span>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-2">{myth.question}</h3>
            {myth.myth_status && (
              <span className={`inline-block px-2 py-1 text-xs rounded-full ${statusColors[myth.myth_status]} mb-3`}>
                {myth.myth_status === 'myth' ? 'MYTHE' : myth.myth_status === 'fact' ? 'VRAI' : 'PARTIELLEMENT VRAI'}
              </span>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Réponse scientifique:</h4>
            <p className="text-gray-700">{myth.answer}</p>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-2">Conseils pratiques:</h4>
            <ul className="space-y-1">
              {myth.practical_tips.map((tip, index) => (
                <li key={index} className="text-gray-700 text-sm">• {tip}</li>
              ))}
            </ul>
          </div>

          <details>
            <summary className="text-sm text-blue-600 cursor-pointer hover:text-blue-800">
              Références scientifiques
            </summary>
            <ul className="mt-2 text-xs text-gray-600 space-y-1">
              {myth.scientific_references.map((ref, index) => (
                <li key={index}>• {ref}</li>
              ))}
            </ul>
          </details>
        </div>
      </div>
    )
  }

  const renderQACard = (qa: NutritionQA) => {
    const categoryIcons = {
      'macronutrients': '🥩',
      'micronutrients': '💊',
      'supplements': '🧪',
      'meal_timing': '⏰',
      'food_safety': '🛡️',
      'special_diets': '🌱'
    }

    const difficultyColors = {
      'basic': 'bg-green-100 text-green-800',
      'intermediate': 'bg-yellow-100 text-yellow-800',
      'advanced': 'bg-red-100 text-red-800'
    }

    return (
      <div key={qa.question} className="bg-white rounded-lg border p-6 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">{categoryIcons[qa.category]}</span>
            <h3 className="font-semibold text-gray-900">{qa.question}</h3>
          </div>
          <span className={`px-2 py-1 text-xs rounded-full ${difficultyColors[qa.difficulty]}`}>
            {qa.difficulty}
          </span>
        </div>

        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Réponse rapide:</h4>
            <p className="text-gray-700">{qa.answer}</p>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-2">Explication détaillée:</h4>
            <p className="text-gray-700 text-sm">{qa.explanation}</p>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-2">Application pratique:</h4>
            <p className="text-gray-700 text-sm">{qa.practical_application}</p>
          </div>

          {qa.common_misconceptions && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Idées reçues courantes:</h4>
              <ul className="space-y-1">
                {qa.common_misconceptions.map((misconception, index) => (
                  <li key={index} className="text-red-600 text-sm">❌ {misconception}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="bg-blue-50 rounded-lg p-3">
            <h4 className="font-medium text-blue-900 mb-1">Consensus scientifique:</h4>
            <p className="text-blue-800 text-sm">{qa.scientific_consensus}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Éducation Nutritionnelle IA</h2>
        <p className="text-gray-600">Insights personnalisés, Q&A et démystification des idées reçues</p>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'insights', label: 'Insights personnalisés', icon: '🎯' },
            { id: 'qa', label: 'Questions/Réponses', icon: '❓' },
            { id: 'myths', label: 'Démystification', icon: '🔍' },
            { id: 'personalized', label: 'Assistant IA', icon: '🤖' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                selectedTab === tab.id
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
          />
        </div>
        {selectedTab === 'insights' && (
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
          >
            <option value="all">Toutes les catégories</option>
            <option value="anti-inflammatoire">Anti-inflammatoire</option>
            <option value="protéines">Protéines</option>
            <option value="saisonnier">Nutrition saisonnière</option>
            <option value="biomarqueurs">Biomarqueurs</option>
          </select>
        )}
      </div>

      {/* Content */}
      <div className="space-y-6">
        {selectedTab === 'insights' && (
          <div>
            <h3 className="text-lg font-semibold mb-4">
              Insights personnalisés ({filteredInsights.length})
            </h3>
            {filteredInsights.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">🎯</div>
                <p>Aucun insight trouvé</p>
                <p className="text-sm">Essayez de modifier vos filtres de recherche</p>
              </div>
            ) : (
              <div className="grid gap-6">
                {filteredInsights.map(renderInsightCard)}
              </div>
            )}
          </div>
        )}

        {selectedTab === 'qa' && (
          <div>
            <h3 className="text-lg font-semibold mb-4">
              Questions/Réponses ({filteredQA.length})
            </h3>
            <div className="grid gap-6">
              {filteredQA.map(renderQACard)}
            </div>
          </div>
        )}

        {selectedTab === 'myths' && (
          <div>
            <h3 className="text-lg font-semibold mb-4">
              Démystification ({filteredMythBusting.length})
            </h3>
            <div className="grid gap-6">
              {filteredMythBusting.map(renderMythCard)}
            </div>
          </div>
        )}

        {selectedTab === 'personalized' && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Assistant Nutrition IA</h3>
            <div className="bg-white rounded-lg border p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Posez votre question nutritionnelle
                  </label>
                  <textarea
                    value={userQuestion}
                    onChange={(e) => setUserQuestion(e.target.value)}
                    placeholder="Ex: Comment optimiser mon apport en protéines ? Quels aliments anti-inflammatoires me recommandez-vous ?"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <button
                  onClick={handleUserQuestion}
                  disabled={isGeneratingResponse || !userQuestion.trim()}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium"
                >
                  {isGeneratingResponse ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Génération...</span>
                    </div>
                  ) : (
                    '🤖 Obtenir une réponse personnalisée'
                  )}
                </button>
              </div>

              {aiResponse && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-900 mb-3">🤖 Réponse personnalisée</h4>
                  <div className="text-blue-800 text-sm whitespace-pre-line leading-relaxed">
                    {aiResponse}
                  </div>
                </div>
              )}

              <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <h4 className="font-medium text-yellow-900 mb-2">⚠️ Disclaimer médical</h4>
                <p className="text-yellow-800 text-sm">
                  Ces conseils sont à titre informatif et éducatif. Consultez toujours un professionnel de santé 
                  pour des conseils médicaux personnalisés, surtout si vous avez des conditions médicales spécifiques.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}