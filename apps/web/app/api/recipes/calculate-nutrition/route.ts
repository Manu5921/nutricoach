/**
 * POST /api/recipes/calculate-nutrition
 * Recipe nutrition calculation endpoint using Next.js 15 App Router
 */

import { NextRequest } from 'next/server'
import { 
  RecipeService,
  NutritionCalculationSchema,
  type ApiResponse,
  type NutritionInfo,
} from '@nutricoach/core-nutrition'
import { 
  withApiHandler,
  validateRequestBody,
  createApiResponse,
  handleOptions,
} from '../../../../lib/api-helpers'
import { createServerSupabaseClient } from '../../../../lib/supabase'

export async function OPTIONS() {
  return handleOptions()
}

export const POST = withApiHandler<{
  per_serving: NutritionInfo;
  per_100g?: NutritionInfo;
}>(
  async (request: NextRequest) => {
    // Validate request body
    const calculationData = await validateRequestBody(request, NutritionCalculationSchema)
    
    // Create recipe service (no auth required for nutrition calculations)
    const supabase = await createServerSupabaseClient()
    const recipeService = new RecipeService(supabase)
    
    // Calculate nutrition
    const result = await recipeService.calculateNutrition(calculationData)
    
    if (result.error) {
      throw new Error(result.error.message)
    }
    
    return createApiResponse(result.data, {
      status: 200,
      meta: {
        action: 'calculate_nutrition',
        ingredientCount: calculationData.ingredients.length,
        servings: calculationData.servings,
        calculatedPer100g: !!result.data?.per_100g,
      },
    })
  }
)