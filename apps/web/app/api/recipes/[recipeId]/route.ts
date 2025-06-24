/**
 * GET/PUT/DELETE /api/recipes/[recipeId]
 * Individual recipe management endpoints using Next.js 15 App Router
 */

import { NextRequest } from 'next/server'
import { 
  RecipeService,
  RecipeUpdateSchema,
  type ApiResponse,
  type RecipeWithDetails,
} from '@nutricoach/core-nutrition'
import { 
  withApiHandler,
  validateRequestBody,
  createApiResponse,
  requireAuth,
  parseRouteParams,
  handleOptions,
} from '../../../../lib/api-helpers'
import { createServerSupabaseClient, getCurrentUser } from '../../../../lib/supabase'

export async function OPTIONS() {
  return handleOptions()
}

export const GET = withApiHandler<RecipeWithDetails>(
  async (request: NextRequest, { params }) => {
    const { recipeId } = parseRouteParams(params, ['recipeId'])
    
    // Get current user (optional for public recipes)
    const user = await getCurrentUser()
    const supabase = await createServerSupabaseClient()
    
    // Create recipe service
    const recipeService = new RecipeService(supabase)
    
    // Get recipe
    const result = await recipeService.getRecipeById(recipeId, user?.id)
    
    if (result.error) {
      throw new Error(result.error.message)
    }
    
    if (!result.data) {
      throw new Error('Recipe not found')
    }
    
    return createApiResponse(result.data, {
      status: 200,
      meta: {
        action: 'get_recipe',
        recipeId,
        isPublic: result.data.is_public,
        userId: user?.id,
      },
    })
  }
)

export const PUT = withApiHandler<RecipeWithDetails>(
  async (request: NextRequest, { params }) => {
    const { recipeId } = parseRouteParams(params, ['recipeId'])
    const { user, supabase } = await requireAuth(request)
    
    // Validate request body
    const updateData = await validateRequestBody(request, RecipeUpdateSchema)
    
    // Create recipe service
    const recipeService = new RecipeService(supabase)
    
    // Update recipe
    const result = await recipeService.updateRecipe(recipeId, updateData, user.id)
    
    if (result.error) {
      throw new Error(result.error.message)
    }
    
    return createApiResponse(result.data, {
      status: 200,
      meta: {
        action: 'update_recipe',
        recipeId,
        userId: user.id,
        updatedFields: Object.keys(updateData),
      },
    })
  }
)

export const DELETE = withApiHandler<void>(
  async (request: NextRequest, { params }) => {
    const { recipeId } = parseRouteParams(params, ['recipeId'])
    const { user, supabase } = await requireAuth(request)
    
    // Create recipe service
    const recipeService = new RecipeService(supabase)
    
    // Delete recipe
    const result = await recipeService.deleteRecipe(recipeId, user.id)
    
    if (result.error) {
      throw new Error(result.error.message)
    }
    
    return createApiResponse(undefined, {
      status: 200,
      meta: {
        action: 'delete_recipe',
        recipeId,
        userId: user.id,
      },
    })
  }
)