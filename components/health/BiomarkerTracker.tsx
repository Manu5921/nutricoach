'use client'

import { useState, useEffect } from 'react'
import { HealthBiomarkers, BiomarkerEntry, UserProfile } from '@/lib/auth/types'
import { createClient } from '@/lib/supabase-client'

interface BiomarkerTrackerProps {
  userProfile: UserProfile
  onBiomarkersUpdate?: (biomarkers: HealthBiomarkers) => void
}

interface BiomarkerReference {
  biomarker: string
  unit: string
  optimal_range: { min: number; max: number }
  reference_range: { min: number; max: number }
  description: string
  health_impact: string
  nutrition_factors: string[]
}

const BIOMARKER_REFERENCES: BiomarkerReference[] = [
  {
    biomarker: 'crp_level',
    unit: 'mg/L',
    optimal_range: { min: 0, max: 1.0 },
    reference_range: { min: 0, max: 3.0 },
    description: 'Protéine C-réactive - Marqueur d\'inflammation',
    health_impact: 'Niveaux élevés associés aux maladies cardiovasculaires et inflammation chronique',
    nutrition_factors: ['Aliments anti-inflammatoires', 'Oméga-3', 'Antioxydants', 'Réduction du sucre']
  },
  {
    biomarker: 'cholesterol_total',
    unit: 'mg/dL',
    optimal_range: { min: 150, max: 200 },
    reference_range: { min: 0, max: 240 },
    description: 'Cholestérol total',
    health_impact: 'Facteur de risque cardiovasculaire majeur',
    nutrition_factors: ['Fibres solubles', 'Phytostérols', 'Réduction graisses saturées', 'Oméga-3']
  },
  {
    biomarker: 'cholesterol_ldl',
    unit: 'mg/dL',
    optimal_range: { min: 0, max: 100 },
    reference_range: { min: 0, max: 130 },
    description: 'Cholestérol LDL (mauvais cholestérol)',
    health_impact: 'Principal facteur de risque d\'athérosclérose',
    nutrition_factors: ['Avoine', 'Légumineuses', 'Noix', 'Huile d\'olive']
  },
  {
    biomarker: 'cholesterol_hdl',
    unit: 'mg/dL',
    optimal_range: { min: 60, max: 100 },
    reference_range: { min: 40, max: 100 },
    description: 'Cholestérol HDL (bon cholestérol)',
    health_impact: 'Protecteur cardiovasculaire - plus élevé est mieux',
    nutrition_factors: ['Exercice', 'Oméga-3', 'Huile d\'olive', 'Poissons gras']
  },
  {
    biomarker: 'glucose_fasting',
    unit: 'mg/dL',
    optimal_range: { min: 70, max: 99 },
    reference_range: { min: 70, max: 125 },
    description: 'Glucose à jeun',
    health_impact: 'Indicateur de la régulation glycémique et risque diabétique',
    nutrition_factors: ['Index glycémique bas', 'Fibres', 'Cannelle', 'Chrome']
  },
  {
    biomarker: 'hba1c',
    unit: '%',
    optimal_range: { min: 4.0, max: 5.6 },
    reference_range: { min: 4.0, max: 6.4 },
    description: 'Hémoglobine glyquée (HbA1c)',
    health_impact: 'Contrôle glycémique sur 2-3 mois',
    nutrition_factors: ['Régime méditerranéen', 'Légumes non-féculents', 'Protéines maigres']
  },
  {
    biomarker: 'vitamin_d',
    unit: 'ng/mL',
    optimal_range: { min: 30, max: 80 },
    reference_range: { min: 20, max: 100 },
    description: 'Vitamine D (25-hydroxyvitamine D)',
    health_impact: 'Santé osseuse, immunitaire et cardiovasculaire',
    nutrition_factors: ['Poissons gras', 'Œufs', 'Champignons', 'Aliments enrichis']
  },
  {
    biomarker: 'iron_serum',
    unit: 'mcg/dL',
    optimal_range: { min: 60, max: 150 },
    reference_range: { min: 50, max: 170 },
    description: 'Fer sérique',
    health_impact: 'Transport d\'oxygène et fonction énergétique',
    nutrition_factors: ['Viandes rouges', 'Épinards', 'Légumineuses', 'Vitamine C pour absorption']
  }
]

export default function BiomarkerTracker({ userProfile, onBiomarkersUpdate }: BiomarkerTrackerProps) {
  const [biomarkers, setBiomarkers] = useState<HealthBiomarkers>(
    userProfile.health_profile?.health_biomarkers || {}
  )
  const [selectedBiomarker, setSelectedBiomarker] = useState<string>('')
  const [newValue, setNewValue] = useState<string>('')
  const [entryDate, setEntryDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [correlationInsights, setCorrelationInsights] = useState<any[]>([])
  
  const supabase = createClient()

  useEffect(() => {
    loadBiomarkerHistory()
    analyzeNutritionCorrelations()
  }, [userProfile.id])

  const loadBiomarkerHistory = async () => {
    try {
      // In a real implementation, this would load from encrypted health data
      // For now, we'll simulate with the current biomarkers
      console.log('📊 Loading biomarker history for user:', userProfile.id)
    } catch (error) {
      console.error('Error loading biomarker history:', error)
    }
  }

  const analyzeNutritionCorrelations = async () => {
    try {
      // Simulate correlation analysis between biomarkers and nutrition patterns
      const insights = [
        {
          biomarker: 'crp_level',
          correlation: 'Forte corrélation négative avec la consommation d\'oméga-3',
          strength: 0.75,
          recommendation: 'Augmenter les poissons gras et noix dans votre alimentation'
        },
        {
          biomarker: 'cholesterol_ldl',
          correlation: 'Amélioration observée avec régime méditerranéen',
          strength: 0.68,
          recommendation: 'Continuer les fibres solubles et huile d\'olive'
        }
      ]
      setCorrelationInsights(insights)
    } catch (error) {
      console.error('Error analyzing correlations:', error)
    }
  }

  const addBiomarkerEntry = async () => {
    if (!selectedBiomarker || !newValue || !entryDate) {
      alert('Veuillez remplir tous les champs')
      return
    }

    setLoading(true)
    try {
      const value = parseFloat(newValue)
      const reference = BIOMARKER_REFERENCES.find(r => r.biomarker === selectedBiomarker)
      
      if (!reference) {
        throw new Error('Biomarqueur non reconnu')
      }

      // Determine status based on ranges
      let status: 'low' | 'normal' | 'high' | 'critical' = 'normal'
      if (value < reference.reference_range.min) {
        status = 'low'
      } else if (value > reference.reference_range.max) {
        status = value > reference.reference_range.max * 1.5 ? 'critical' : 'high'
      } else if (value >= reference.optimal_range.min && value <= reference.optimal_range.max) {
        status = 'normal'
      }

      const newEntry: BiomarkerEntry = {
        date: entryDate,
        biomarker: selectedBiomarker,
        value,
        unit: reference.unit,
        reference_range: reference.reference_range,
        status
      }

      // Update biomarkers object
      const updatedBiomarkers = {
        ...biomarkers,
        [selectedBiomarker]: value,
        biomarker_history: [
          ...(biomarkers.biomarker_history || []),
          newEntry
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
        last_lab_date: entryDate
      }

      setBiomarkers(updatedBiomarkers)
      onBiomarkersUpdate?.(updatedBiomarkers)

      // Reset form
      setSelectedBiomarker('')
      setNewValue('')
      setShowAddForm(false)
      
      // Re-analyze correlations with new data
      analyzeNutritionCorrelations()

    } catch (error) {
      console.error('Error adding biomarker entry:', error)
      alert('Erreur lors de l\'ajout du biomarqueur')
    } finally {
      setLoading(false)
    }
  }

  const getBiomarkerStatus = (biomarker: string, value: number): { status: string; color: string; message: string } => {
    const reference = BIOMARKER_REFERENCES.find(r => r.biomarker === biomarker)
    if (!reference) return { status: 'unknown', color: 'gray', message: 'Référence non disponible' }

    if (value < reference.reference_range.min) {
      return { status: 'low', color: 'blue', message: 'Bas' }
    } else if (value > reference.reference_range.max) {
      return { status: 'high', color: 'red', message: 'Élevé' }
    } else if (value >= reference.optimal_range.min && value <= reference.optimal_range.max) {
      return { status: 'optimal', color: 'green', message: 'Optimal' }
    } else {
      return { status: 'normal', color: 'yellow', message: 'Normal' }
    }
  }

  const getBiomarkerTrend = (biomarker: string): 'improving' | 'stable' | 'declining' | 'unknown' => {
    const history = biomarkers.biomarker_history?.filter(entry => entry.biomarker === biomarker) || []
    if (history.length < 2) return 'unknown'

    const recent = history.slice(0, 2)
    const latest = recent[0].value
    const previous = recent[1].value

    const change = ((latest - previous) / previous) * 100

    // For biomarkers where lower is better (CRP, LDL cholesterol, glucose)
    const lowerIsBetter = ['crp_level', 'cholesterol_ldl', 'glucose_fasting', 'hba1c']
    
    if (Math.abs(change) < 5) return 'stable'
    
    if (lowerIsBetter.includes(biomarker)) {
      return change < 0 ? 'improving' : 'declining'
    } else {
      return change > 0 ? 'improving' : 'declining'
    }
  }

  const renderBiomarkerCard = (biomarker: string, value: number) => {
    const reference = BIOMARKER_REFERENCES.find(r => r.biomarker === biomarker)
    if (!reference) return null

    const status = getBiomarkerStatus(biomarker, value)
    const trend = getBiomarkerTrend(biomarker)

    const trendIcons = {
      improving: '📈',
      stable: '➡️',
      declining: '📉',
      unknown: '❓'
    }

    const trendColors = {
      improving: 'text-green-600',
      stable: 'text-gray-600',
      declining: 'text-red-600',
      unknown: 'text-gray-400'
    }

    return (
      <div key={biomarker} className="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-semibold text-gray-900">{reference.description}</h3>
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-2xl font-bold">{value}</span>
              <span className="text-sm text-gray-500">{reference.unit}</span>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-${status.color}-100 text-${status.color}-800`}>
                {status.message}
              </span>
            </div>
          </div>
          <div className={`text-2xl ${trendColors[trend]}`}>
            {trendIcons[trend]}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Optimal:</span>
            <span>{reference.optimal_range.min}-{reference.optimal_range.max} {reference.unit}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Référence:</span>
            <span>{reference.reference_range.min}-{reference.reference_range.max} {reference.unit}</span>
          </div>
        </div>

        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
          <h4 className="text-sm font-medium text-blue-900 mb-1">Facteurs nutritionnels</h4>
          <div className="flex flex-wrap gap-1">
            {reference.nutrition_factors.map((factor, index) => (
              <span key={index} className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                {factor}
              </span>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Suivi des Biomarqueurs</h2>
          <p className="text-gray-600">Surveillez vos marqueurs de santé et leurs corrélations nutritionnelles</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium"
        >
          + Ajouter résultat
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-4">Nouveau résultat de laboratoire</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Biomarqueur
              </label>
              <select
                value={selectedBiomarker}
                onChange={(e) => setSelectedBiomarker(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
              >
                <option value="">Sélectionner...</option>
                {BIOMARKER_REFERENCES.map((ref) => (
                  <option key={ref.biomarker} value={ref.biomarker}>
                    {ref.description}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valeur
              </label>
              <input
                type="number"
                step="0.01"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder="Ex: 2.5"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date
              </label>
              <input
                type="date"
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-3 mt-4">
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
            >
              Annuler
            </button>
            <button
              onClick={addBiomarkerEntry}
              disabled={loading}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50"
            >
              {loading ? 'Ajout...' : 'Ajouter'}
            </button>
          </div>
        </div>
      )}

      {/* Current Biomarkers */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Biomarqueurs actuels</h3>
        {Object.keys(biomarkers).length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">🔬</div>
            <p>Aucun biomarqueur enregistré</p>
            <p className="text-sm">Ajoutez vos résultats de laboratoire pour commencer le suivi</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(biomarkers)
              .filter(([key]) => typeof biomarkers[key as keyof HealthBiomarkers] === 'number')
              .map(([biomarker, value]) => renderBiomarkerCard(biomarker, value as number))
            }
          </div>
        )}
      </div>

      {/* Correlation Insights */}
      {correlationInsights.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Insights de corrélation nutrition-santé</h3>
          <div className="space-y-3">
            {correlationInsights.map((insight, index) => (
              <div key={index} className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-start space-x-3">
                  <div className="text-2xl">💡</div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{insight.correlation}</h4>
                    <p className="text-sm text-gray-600 mt-1">{insight.recommendation}</p>
                    <div className="flex items-center mt-2">
                      <span className="text-xs text-gray-500">Force de corrélation:</span>
                      <div className="ml-2 flex-1 bg-gray-200 rounded-full h-2 max-w-24">
                        <div 
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${insight.strength * 100}%` }}
                        />
                      </div>
                      <span className="ml-2 text-xs font-medium">{Math.round(insight.strength * 100)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Health Recommendations */}
      <div className="bg-yellow-50 rounded-lg p-6 border border-yellow-200">
        <h3 className="text-lg font-semibold text-yellow-900 mb-3">⚕️ Recommandations personnalisées</h3>
        <div className="space-y-2 text-sm text-yellow-800">
          <p>• Planifiez vos prochaines analyses dans 3-6 mois pour suivre l'évolution</p>
          <p>• Les changements nutritionnels peuvent prendre 8-12 semaines pour affecter les biomarqueurs</p>
          <p>• Consultez votre médecin pour l'interprétation clinique de vos résultats</p>
          <p>• L'exercice régulier améliore significativement la plupart des biomarqueurs</p>
        </div>
      </div>
    </div>
  )
}