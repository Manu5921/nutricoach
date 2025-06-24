/**
 * GET/POST /api/users/[userId]/nutrition-goals
 * User nutrition goals endpoints using Next.js 15 App Router
 */

import { NextRequest } from 'next/server'
import { 
  UserService,
  type ApiResponse,
} from '@nutricoach/core-nutrition'
import { 
  withApiHandler,
  createApiResponse,
  requireAuth,
  parseRouteParams,
  handleOptions,
} from '../../../../../lib/api-helpers'

export async function OPTIONS() {
  return handleOptions()
}

export const GET = withApiHandler<any>(
  async (request: NextRequest, { params }) => {
    const { userId } = parseRouteParams(params, ['userId'])
    const { user, supabase } = await requireAuth(request)
    
    // Users can only access their own nutrition goals
    if (userId !== user.id) {
      throw new Error('Access denied')
    }
    
    // Create user service
    const userService = new UserService(supabase)
    
    // Get nutrition goals
    const result = await userService.getUserNutritionGoals(userId)
    
    if (result.error) {
      throw new Error(result.error.message)
    }
    
    return createApiResponse(result.data, {
      status: 200,
      meta: {
        action: 'get_nutrition_goals',
        userId,
        hasGoals: result.data !== null,
      },
    })
  }
)

export const POST = withApiHandler<any>(
  async (request: NextRequest, { params }) => {
    const { userId } = parseRouteParams(params, ['userId'])
    const { user, supabase } = await requireAuth(request)
    
    // Users can only calculate their own nutrition goals
    if (userId !== user.id) {
      throw new Error('Access denied')
    }
    
    // Create user service
    const userService = new UserService(supabase)
    
    // Calculate and save nutrition goals
    const result = await userService.calculateNutritionGoals(userId)
    
    if (result.error) {
      throw new Error(result.error.message)
    }
    
    return createApiResponse(result.data, {
      status: 201,
      meta: {
        action: 'calculate_nutrition_goals',
        userId,
      },
    })
  }
)