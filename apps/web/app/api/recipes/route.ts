/**
 * GET/POST /api/recipes
 * Recipe listing and creation endpoints using Next.js 15 App Router
 */

import { NextRequest } from 'next/server'
import { 
  RecipeService,
  RecipeInsertSchema,
  RecipeSearchSchema,
  type ApiResponse,
  type RecipeWithDetails,
  type PaginatedResponse,
} from '@nutricoach/core-nutrition'
import { 
  withApiHandler,
  validateRequestBody,
  validateQueryParams,
  createApiResponse,
  requireAuth,
  handleOptions,
} from '../../../lib/api-helpers'

export async function OPTIONS() {
  return handleOptions()
}

export const GET = withApiHandler<PaginatedResponse<RecipeWithDetails>>(
  async (request: NextRequest) => {
    // Validate query parameters
    const searchParams = validateQueryParams(request, RecipeSearchSchema)
    
    // Create recipe service (no auth required for public recipes)
    const { supabase } = searchParams.user_id 
      ? await requireAuth(request)
      : { supabase: (await import('../../../lib/supabase')).createServerSupabaseClient() }
    
    const recipeService = new RecipeService(await supabase)
    
    // Search recipes
    const result = await recipeService.searchRecipes(searchParams)
    
    if (result.error) {
      throw new Error(result.error.message)
    }
    
    return createApiResponse(result.data, {
      status: 200,
      meta: {
        action: 'search_recipes',
        query: searchParams.query,
        page: searchParams.page,
        limit: searchParams.limit,
        total: result.data?.pagination.total,
      },
    })
  }
)

export const POST = withApiHandler<RecipeWithDetails>(
  async (request: NextRequest) => {
    const { user, supabase } = await requireAuth(request)
    
    // Validate request body
    const recipeData = await validateRequestBody(request, RecipeInsertSchema)
    
    // Ensure the recipe belongs to the authenticated user
    recipeData.user_id = user.id
    
    // Create recipe service
    const recipeService = new RecipeService(supabase)
    
    // Create recipe
    const result = await recipeService.createRecipe(recipeData)
    
    if (result.error) {
      throw new Error(result.error.message)
    }
    
    return createApiResponse(result.data, {
      status: 201,
      meta: {
        action: 'create_recipe',
        userId: user.id,
        recipeId: result.data?.id,
        isPublic: result.data?.is_public,
      },
    })
  }
)