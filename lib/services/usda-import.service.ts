/**
 * USDA FoodData Central Import Service
 * 
 * Service d'intégration avec l'API USDA FoodData Central pour l'import
 * automatisé d'ingrédients nutritionnels dans NutriCoach.
 * 
 * @author Content & Data Specialist Agent
 * @version 1.0.0
 * @see https://fdc.nal.usda.gov/api-guide.html
 */

import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/supabase/types'

// =============================================
// TYPES ET INTERFACES USDA
// =============================================

interface USDANutrient {
  id: number
  name: string
  unitName: string
}

interface USDAFoodNutrient {
  nutrient: USDANutrient
  amount: number
}

interface USDAFoodMeasure {
  disseminationText: string
  gramWeight: number
  id: number
  modifier: string
  rank: number
}

interface USDAFoodItem {
  fdcId: number
  description: string
  dataType: 'Foundation' | 'SR Legacy' | 'Survey (FNDDS)' | 'Branded'
  publicationDate: string
  foodCategory?: {
    id: number
    code: string
    description: string
  }
  foodNutrients: USDAFoodNutrient[]
  foodMeasures?: USDAFoodMeasure[]
  scientificName?: string
  commonNames?: string
  additionalDescriptions?: string
  allHighlightFields?: string
  score?: number
}

interface USDASearchResponse {
  totalHits: number
  currentPage: number
  totalPages: number
  foods: USDAFoodItem[]
}

interface USDASearchParams {
  query: string
  dataType?: string[]
  pageSize?: number
  pageNumber?: number
  sortBy?: 'dataType.keyword' | 'lowercaseDescription.keyword' | 'fdcId' | 'publishedDate'
  sortOrder?: 'asc' | 'desc'
}

// Types pour mapping nutritionnel
interface NutrientMapping {
  usdaNutrientId: number
  supabaseColumn: string
  conversionFactor?: number // Pour conversions d'unités si nécessaire
  isRequired?: boolean
}

interface ImportResult {
  success: boolean
  fdcId?: number
  ingredientId?: string
  message: string
  nutritionDataCompleteness?: number
}

interface BulkImportResult {
  totalProcessed: number
  successful: number
  failed: number
  results: ImportResult[]
  processingTimeMs: number
}

// =============================================
// SERVICE PRINCIPAL USDA IMPORT
// =============================================

export class USDAImportService {
  private readonly API_BASE_URL = 'https://api.nal.usda.gov/fdc/v1'
  private readonly API_KEY: string
  private readonly supabase: ReturnType<typeof createClient<Database>>
  private readonly RATE_LIMIT_DELAY = 100 // ms entre requêtes API

  // Mapping des nutriments USDA vers colonnes Supabase
  private readonly NUTRIENT_MAPPING: NutrientMapping[] = [
    // Macronutriments
    { usdaNutrientId: 1008, supabaseColumn: 'calories_per_100g', isRequired: true }, // Energy (kcal)
    { usdaNutrientId: 1003, supabaseColumn: 'protein_g_per_100g', isRequired: true }, // Protein
    { usdaNutrientId: 1005, supabaseColumn: 'carbs_g_per_100g', isRequired: true }, // Carbohydrate
    { usdaNutrientId: 1004, supabaseColumn: 'fat_g_per_100g', isRequired: true }, // Total lipid (fat)
    { usdaNutrientId: 1079, supabaseColumn: 'fiber_g_per_100g' }, // Fiber
    { usdaNutrientId: 2000, supabaseColumn: 'sugar_g_per_100g' }, // Total sugars
    { usdaNutrientId: 1093, supabaseColumn: 'sodium_mg_per_100g' }, // Sodium
    
    // Vitamines
    { usdaNutrientId: 1162, supabaseColumn: 'vitamin_c_mg_per_100g' }, // Vitamin C
    { usdaNutrientId: 1114, supabaseColumn: 'vitamin_d_mcg_per_100g' }, // Vitamin D (D2 + D3)
    { usdaNutrientId: 1109, supabaseColumn: 'vitamin_e_mg_per_100g' }, // Vitamin E (alpha-tocopherol)
    { usdaNutrientId: 1106, supabaseColumn: 'vitamin_a_mcg_per_100g' }, // Vitamin A, RAE
    { usdaNutrientId: 1185, supabaseColumn: 'vitamin_k_mcg_per_100g' }, // Vitamin K (phylloquinone)
    { usdaNutrientId: 1177, supabaseColumn: 'folate_mcg_per_100g' }, // Folate, total
    { usdaNutrientId: 1178, supabaseColumn: 'vitamin_b12_mcg_per_100g' }, // Vitamin B-12
    { usdaNutrientId: 1175, supabaseColumn: 'vitamin_b6_mg_per_100g' }, // Vitamin B-6
    { usdaNutrientId: 1165, supabaseColumn: 'thiamin_mg_per_100g' }, // Thiamin
    { usdaNutrientId: 1166, supabaseColumn: 'riboflavin_mg_per_100g' }, // Riboflavin
    { usdaNutrientId: 1167, supabaseColumn: 'niacin_mg_per_100g' }, // Niacin
    
    // Minéraux
    { usdaNutrientId: 1087, supabaseColumn: 'calcium_mg_per_100g' }, // Calcium
    { usdaNutrientId: 1089, supabaseColumn: 'iron_mg_per_100g' }, // Iron
    { usdaNutrientId: 1090, supabaseColumn: 'magnesium_mg_per_100g' }, // Magnesium
    { usdaNutrientId: 1092, supabaseColumn: 'potassium_mg_per_100g' }, // Potassium
    { usdaNutrientId: 1095, supabaseColumn: 'zinc_mg_per_100g' }, // Zinc
    { usdaNutrientId: 1091, supabaseColumn: 'phosphorus_mg_per_100g' }, // Phosphorus
    { usdaNutrientId: 1098, supabaseColumn: 'copper_mg_per_100g' }, // Copper
    { usdaNutrientId: 1101, supabaseColumn: 'manganese_mg_per_100g' }, // Manganese
    { usdaNutrientId: 1103, supabaseColumn: 'selenium_mcg_per_100g' }, // Selenium
    
    // Acides gras
    { usdaNutrientId: 1258, supabaseColumn: 'saturated_fat_g_per_100g' }, // Fatty acids, total saturated
    { usdaNutrientId: 1292, supabaseColumn: 'monounsaturated_fat_g_per_100g' }, // Fatty acids, total monounsaturated
    { usdaNutrientId: 1293, supabaseColumn: 'polyunsaturated_fat_g_per_100g' }, // Fatty acids, total polyunsaturated
    { usdaNutrientId: 1257, supabaseColumn: 'trans_fat_g_per_100g' }, // Fatty acids, total trans
    { usdaNutrientId: 1253, supabaseColumn: 'cholesterol_mg_per_100g' }, // Cholesterol
    { usdaNutrientId: 1404, supabaseColumn: 'omega3_g_per_100g' }, // Fatty acids, total omega-3
    { usdaNutrientId: 1409, supabaseColumn: 'omega6_g_per_100g' }, // Fatty acids, total omega-6
    
    // Composition
    { usdaNutrientId: 1051, supabaseColumn: 'water_g_per_100g' }, // Water
    { usdaNutrientId: 1007, supabaseColumn: 'ash_g_per_100g' }, // Ash
  ]

  // Groupes alimentaires USDA vers catégories NutriCoach
  private readonly FOOD_GROUP_MAPPING: Record<string, string> = {
    'Vegetables and Vegetable Products': 'vegetables',
    'Fruits and Fruit Juices': 'fruits',
    'Cereal Grains and Pasta': 'grains',
    'Legumes and Legume Products': 'legumes',
    'Nut and Seed Products': 'nuts_seeds',
    'Poultry Products': 'proteins',
    'Beef Products': 'proteins',
    'Pork Products': 'proteins',
    'Lamb, Veal, and Game Products': 'proteins',
    'Finfish and Shellfish Products': 'proteins',
    'Dairy and Egg Products': 'dairy',
    'Fats and Oils': 'fats_oils',
    'Spices and Herbs': 'herbs_spices',
    'Beverages': 'beverages',
    'Soups, Sauces, and Gravies': 'other',
    'Sausages and Luncheon Meats': 'proteins',
    'Breakfast Cereals': 'grains',
    'Fast Foods': 'other',
    'Meals, Entrees, and Side Dishes': 'other',
    'Snacks': 'other'
  }

  constructor(apiKey?: string, supabaseClient?: ReturnType<typeof createClient<Database>>) {
    this.API_KEY = apiKey || process.env.USDA_API_KEY || ''
    if (!this.API_KEY) {
      throw new Error('USDA API Key is required. Set USDA_API_KEY environment variable.')
    }

    this.supabase = supabaseClient || createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }

  // =============================================
  // MÉTHODES PUBLIQUES - API INTERFACE
  // =============================================

  /**
   * Recherche d'ingrédients dans la base USDA
   */
  async searchIngredients(params: USDASearchParams): Promise<USDASearchResponse> {
    try {
      const searchParams = new URLSearchParams({
        api_key: this.API_KEY,
        query: params.query,
        pageSize: (params.pageSize || 25).toString(),
        pageNumber: (params.pageNumber || 1).toString(),
        sortBy: params.sortBy || 'dataType.keyword',
        sortOrder: params.sortOrder || 'asc'
      })

      if (params.dataType?.length) {
        searchParams.append('dataType', params.dataType.join(','))
      }

      const response = await fetch(`${this.API_BASE_URL}/foods/search?${searchParams}`)
      
      if (!response.ok) {
        throw new Error(`USDA API Error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      
      // Log de l'activité
      await this.logActivity('search', {
        query: params.query,
        totalHits: data.totalHits,
        currentPage: data.currentPage
      })

      return data
    } catch (error) {
      console.error('Erreur recherche USDA:', error)
      throw error
    }
  }

  /**
   * Import d'un ingrédient par son FDC ID
   */
  async importByFdcId(fdcId: number, options: {
    overwrite?: boolean
    calculateAntiInflammatoryScore?: boolean
  } = {}): Promise<ImportResult> {
    try {
      // Vérifier si l'ingrédient existe déjà
      const { data: existingIngredient } = await this.supabase
        .from('ingredients')
        .select('id, name, usda_fdc_id')
        .eq('usda_fdc_id', fdcId.toString())
        .single()

      if (existingIngredient && !options.overwrite) {
        return {
          success: false,
          fdcId,
          ingredientId: existingIngredient.id,
          message: `Ingrédient déjà importé: ${existingIngredient.name}`
        }
      }

      // Récupérer les détails de l'aliment
      const foodDetails = await this.getFoodDetails(fdcId)
      if (!foodDetails) {
        return {
          success: false,
          fdcId,
          message: 'Aliment non trouvé dans USDA'
        }
      }

      // Mapper vers format Supabase
      const ingredientData = await this.mapUSDAToSupabase(foodDetails)
      
      // Calculer score anti-inflammatoire si demandé
      if (options.calculateAntiInflammatoryScore) {
        ingredientData.anti_inflammatory_score = this.calculateAntiInflammatoryScore(foodDetails)
      }

      // Insérer ou mettre à jour
      let result
      if (existingIngredient && options.overwrite) {
        const { data, error } = await this.supabase
          .from('ingredients')
          .update({
            ...ingredientData,
            last_sync_date: new Date().toISOString(),
            sync_status: 'synced'
          })
          .eq('id', existingIngredient.id)
          .select('id')
          .single()
        
        result = { data, error }
      } else {
        const { data, error } = await this.supabase
          .from('ingredients')
          .insert({
            ...ingredientData,
            last_sync_date: new Date().toISOString(),
            sync_status: 'synced',
            data_source: 'usda',
            verified: true
          })
          .select('id')
          .single()
        
        result = { data, error }
      }

      if (result.error) {
        console.error('Erreur insertion Supabase:', result.error)
        return {
          success: false,
          fdcId,
          message: `Erreur DB: ${result.error.message}`
        }
      }

      // Importer les conversions d'unités
      await this.importUnitConversions(fdcId, foodDetails.foodMeasures || [], result.data.id)

      // Calculer complétude des données
      const completeness = await this.calculateNutritionCompleteness(result.data.id)

      return {
        success: true,
        fdcId,
        ingredientId: result.data.id,
        message: `Import réussi: ${ingredientData.name}`,
        nutritionDataCompleteness: completeness
      }

    } catch (error) {
      console.error(`Erreur import FDC ${fdcId}:`, error)
      return {
        success: false,
        fdcId,
        message: `Erreur technique: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      }
    }
  }

  /**
   * Import en lot des ingrédients les plus populaires
   */
  async bulkImport(searchQuery: string, options: {
    maxItems?: number
    dataTypes?: string[]
    overwrite?: boolean
    calculateAntiInflammatoryScores?: boolean
  } = {}): Promise<BulkImportResult> {
    const startTime = Date.now()
    const results: ImportResult[] = []
    const maxItems = options.maxItems || 100

    try {
      // Créer log d'import
      const { data: importLog } = await this.supabase
        .from('usda_import_logs')
        .insert({
          import_type: 'bulk_import',
          search_query: searchQuery,
          food_groups: options.dataTypes || [],
          import_status: 'in_progress',
          total_processed: 0
        })
        .select('id')
        .single()

      // Rechercher les aliments
      const searchResults = await this.searchIngredients({
        query: searchQuery,
        dataType: options.dataTypes,
        pageSize: Math.min(maxItems, 200),
        sortBy: 'dataType.keyword' // Prioriser Foundation Foods
      })

      const foodsToProcess = searchResults.foods.slice(0, maxItems)
      let successful = 0
      let failed = 0

      // Traiter chaque aliment avec délai pour respecter rate limiting
      for (const food of foodsToProcess) {
        await new Promise(resolve => setTimeout(resolve, this.RATE_LIMIT_DELAY))
        
        const result = await this.importByFdcId(food.fdcId, {
          overwrite: options.overwrite,
          calculateAntiInflammatoryScore: options.calculateAntiInflammatoryScores
        })
        
        results.push(result)
        
        if (result.success) {
          successful++
        } else {
          failed++
        }

        // Log de progression
        if ((successful + failed) % 10 === 0) {
          console.log(`Progression: ${successful + failed}/${foodsToProcess.length} traités`)
        }
      }

      const processingTime = Date.now() - startTime

      // Mettre à jour le log d'import
      if (importLog) {
        await this.supabase
          .from('usda_import_logs')
          .update({
            import_status: 'completed',
            total_processed: foodsToProcess.length,
            successful_imports: successful,
            failed_imports: failed,
            processing_time_seconds: Math.round(processingTime / 1000),
            completed_at: new Date().toISOString()
          })
          .eq('id', importLog.id)
      }

      return {
        totalProcessed: foodsToProcess.length,
        successful,
        failed,
        results,
        processingTimeMs: processingTime
      }

    } catch (error) {
      console.error('Erreur bulk import:', error)
      throw error
    }
  }

  /**
   * Import des 100 ingrédients les plus populaires par catégorie
   */
  async importPopularIngredients(): Promise<BulkImportResult[]> {
    const categories = [
      { query: 'broccoli spinach kale carrots', dataTypes: ['Foundation'], category: 'vegetables' },
      { query: 'apple banana orange berries', dataTypes: ['Foundation'], category: 'fruits' },
      { query: 'salmon chicken beef turkey', dataTypes: ['Foundation'], category: 'proteins' },
      { query: 'quinoa rice oats wheat', dataTypes: ['Foundation'], category: 'grains' },
      { query: 'beans lentils chickpeas', dataTypes: ['Foundation'], category: 'legumes' },
      { query: 'almonds walnuts seeds', dataTypes: ['Foundation'], category: 'nuts_seeds' },
      { query: 'olive oil avocado', dataTypes: ['Foundation'], category: 'fats_oils' },
      { query: 'turmeric ginger garlic', dataTypes: ['Foundation'], category: 'herbs_spices' }
    ]

    const allResults: BulkImportResult[] = []

    for (const category of categories) {
      console.log(`Import catégorie: ${category.category}`)
      
      const result = await this.bulkImport(category.query, {
        maxItems: 15, // ~15 par catégorie pour arriver à ~120 total
        dataTypes: category.dataTypes,
        overwrite: false,
        calculateAntiInflammatoryScores: true
      })

      allResults.push(result)
      
      // Pause entre catégories
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    return allResults
  }

  // =============================================
  // MÉTHODES PRIVÉES - UTILITAIRES
  // =============================================

  /**
   * Récupère les détails complets d'un aliment USDA
   */
  private async getFoodDetails(fdcId: number): Promise<USDAFoodItem | null> {
    try {
      const response = await fetch(
        `${this.API_BASE_URL}/food/${fdcId}?api_key=${this.API_KEY}&nutrients=1008,1003,1005,1004,1079,2000,1093,1162,1114,1109,1106,1185,1177,1178,1175,1165,1166,1167,1087,1089,1090,1092,1095,1091,1098,1101,1103,1258,1292,1293,1257,1253,1404,1409,1051,1007`
      )

      if (!response.ok) {
        if (response.status === 404) return null
        throw new Error(`USDA API Error: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`Erreur récupération détails FDC ${fdcId}:`, error)
      return null
    }
  }

  /**
   * Mappe un aliment USDA vers le format Supabase
   */
  private async mapUSDAToSupabase(food: USDAFoodItem): Promise<any> {
    const ingredientData: any = {
      name: this.cleanDescription(food.description),
      usda_fdc_id: food.fdcId.toString(),
      usda_description: food.description,
      usda_data_type: food.dataType.toLowerCase().replace(/\s+/g, '_'),
      usda_publication_date: food.publicationDate,
      category: this.mapFoodCategory(food.foodCategory?.description),
      data_source: 'usda',
      verified: true
    }

    // Mapper les nutriments
    for (const mapping of this.NUTRIENT_MAPPING) {
      const nutrient = food.foodNutrients.find(fn => fn.nutrient.id === mapping.usdaNutrientId)
      if (nutrient) {
        let value = nutrient.amount
        if (mapping.conversionFactor) {
          value *= mapping.conversionFactor
        }
        ingredientData[mapping.supabaseColumn] = value
      }
    }

    // Groupe alimentaire USDA
    if (food.foodCategory) {
      ingredientData.usda_food_group = food.foodCategory.description
    }

    // Nom scientifique si disponible
    if (food.scientificName) {
      ingredientData.name_scientific = food.scientificName
    }

    return ingredientData
  }

  /**
   * Nettoie et normalise la description USDA
   */
  private cleanDescription(description: string): string {
    return description
      .replace(/,?\s*(raw|cooked|boiled|steamed)\s*/gi, '') // Retirer méthodes de cuisson
      .replace(/,?\s*(without\s+skin|with\s+skin)\s*/gi, '') // Retirer détails peau
      .replace(/\s+/g, ' ') // Normaliser espaces
      .trim()
      .toLowerCase()
      .replace(/^\w/, c => c.toUpperCase()) // Première lettre majuscule
  }

  /**
   * Mappe une catégorie USDA vers catégorie NutriCoach
   */
  private mapFoodCategory(usdaCategory?: string): string {
    if (!usdaCategory) return 'other'
    
    return this.FOOD_GROUP_MAPPING[usdaCategory] || 'other'
  }

  /**
   * Calcule un score anti-inflammatoire basique basé sur les nutriments
   */
  private calculateAntiInflammatoryScore(food: USDAFoodItem): number {
    let score = 0

    // Facteurs anti-inflammatoires positifs
    const vitaminC = food.foodNutrients.find(fn => fn.nutrient.id === 1162)?.amount || 0
    const vitaminE = food.foodNutrients.find(fn => fn.nutrient.id === 1109)?.amount || 0
    const omega3 = food.foodNutrients.find(fn => fn.nutrient.id === 1404)?.amount || 0
    const fiber = food.foodNutrients.find(fn => fn.nutrient.id === 1079)?.amount || 0

    // Facteurs pro-inflammatoires négatifs
    const saturatedFat = food.foodNutrients.find(fn => fn.nutrient.id === 1258)?.amount || 0
    const sodium = food.foodNutrients.find(fn => fn.nutrient.id === 1093)?.amount || 0
    const sugar = food.foodNutrients.find(fn => fn.nutrient.id === 2000)?.amount || 0

    // Calcul score simplifié (à améliorer avec recherche scientifique)
    score += Math.min(vitaminC / 10, 3) // Vitamine C bonus
    score += Math.min(vitaminE * 2, 2) // Vitamine E bonus
    score += Math.min(omega3 * 3, 3) // Oméga-3 bonus
    score += Math.min(fiber / 5, 2) // Fibres bonus

    score -= Math.min(saturatedFat / 5, 3) // Graisses saturées malus
    score -= Math.min(sodium / 1000, 2) // Sodium malus
    score -= Math.min(sugar / 10, 2) // Sucre malus

    // Bonus spéciaux par catégorie
    const category = this.mapFoodCategory(food.foodCategory?.description)
    if (category === 'vegetables' || category === 'fruits') score += 1
    if (category === 'herbs_spices') score += 2

    return Math.round(Math.max(-10, Math.min(10, score)))
  }

  /**
   * Importe les conversions d'unités USDA
   */
  private async importUnitConversions(fdcId: number, measures: USDAFoodMeasure[], ingredientId: string): Promise<void> {
    if (!measures.length) return

    const conversions = measures.map((measure, index) => ({
      ingredient_id: ingredientId,
      usda_fdc_id: fdcId.toString(),
      usda_unit: measure.disseminationText,
      usda_unit_description: measure.modifier || null,
      grams_per_unit: measure.gramWeight,
      conversion_source: 'usda_measures',
      is_primary_measure: index === 0 // Premier = mesure primaire
    }))

    const { error } = await this.supabase
      .from('usda_unit_conversions')
      .insert(conversions)

    if (error) {
      console.error(`Erreur import conversions FDC ${fdcId}:`, error)
    }
  }

  /**
   * Calcule le pourcentage de complétude des données nutritionnelles
   */
  private async calculateNutritionCompleteness(ingredientId: string): Promise<number> {
    const { data } = await this.supabase
      .rpc('calculate_nutrition_data_completeness', { ingredient_uuid: ingredientId })

    return data || 0
  }

  /**
   * Log des activités pour monitoring
   */
  private async logActivity(activity: string, details: any): Promise<void> {
    try {
      // Simple log en console pour development
      console.log(`USDA Activity: ${activity}`, details)
      
      // TODO: Implémenter logging en base si nécessaire
    } catch (error) {
      // Silently fail logging to not impact main functionality
    }
  }
}

// =============================================
// INSTANCE SINGLETON POUR USAGE GLOBAL
// =============================================

let usdaServiceInstance: USDAImportService | null = null

export function getUSDAImportService(): USDAImportService {
  if (!usdaServiceInstance) {
    usdaServiceInstance = new USDAImportService()
  }
  return usdaServiceInstance
}

// =============================================
// UTILITAIRES ET HELPERS
// =============================================

/**
 * Valide qu'un FDC ID est valide
 */
export function isValidFdcId(fdcId: number): boolean {
  return Number.isInteger(fdcId) && fdcId > 0
}

/**
 * Normalise une query de recherche USDA
 */
export function normalizeSearchQuery(query: string): string {
  return query
    .trim()
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Supprimer ponctuation
    .replace(/\s+/g, ' ') // Normaliser espaces
}

/**
 * Filtre les résultats USDA par qualité des données
 */
export function filterHighQualityFoods(foods: USDAFoodItem[]): USDAFoodItem[] {
  return foods.filter(food => {
    // Priorité aux Foundation Foods et SR Legacy
    if (food.dataType === 'Foundation' || food.dataType === 'SR Legacy') return true
    
    // Pour les autres, vérifier qu'ils ont des données nutritionnelles basiques
    const hasBasicNutrients = food.foodNutrients.some(fn => 
      [1008, 1003, 1005, 1004].includes(fn.nutrient.id) // Energy, Protein, Carbs, Fat
    )
    
    return hasBasicNutrients
  })
}

export default USDAImportService