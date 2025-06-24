/**
 * GET/PUT/DELETE /api/users/[userId]
 * User profile management endpoints using Next.js 15 App Router
 */

import { NextRequest } from 'next/server'
import { 
  UserService,
  UserUpdateSchema,
  type ApiResponse,
  type UserProfile,
} from '@nutricoach/core-nutrition'
import { 
  withApiHandler,
  validateRequestBody,
  createApiResponse,
  requireAuth,
  parseRouteParams,
  handleOptions,
} from '../../../../lib/api-helpers'

export async function OPTIONS() {
  return handleOptions()
}

export const GET = withApiHandler<UserProfile>(
  async (request: NextRequest, { params }) => {
    const { userId } = parseRouteParams(params, ['userId'])
    const { user, supabase } = await requireAuth(request)
    
    // Users can only access their own profile or public profiles
    if (userId !== user.id) {
      throw new Error('Access denied')
    }
    
    // Create user service
    const userService = new UserService(supabase)
    
    // Get user profile
    const result = await userService.getUserById(userId)
    
    if (result.error) {
      throw new Error(result.error.message)
    }
    
    if (!result.data) {
      throw new Error('User not found')
    }
    
    return createApiResponse(result.data, {
      status: 200,
      meta: {
        action: 'get_user',
        userId,
      },
    })
  }
)

export const PUT = withApiHandler<UserProfile>(
  async (request: NextRequest, { params }) => {
    const { userId } = parseRouteParams(params, ['userId'])
    const { user, supabase } = await requireAuth(request)
    
    // Users can only update their own profile
    if (userId !== user.id) {
      throw new Error('Access denied')
    }
    
    // Validate request body
    const updateData = await validateRequestBody(request, UserUpdateSchema)
    
    // Create user service
    const userService = new UserService(supabase)
    
    // Update user profile
    const result = await userService.updateUser(userId, updateData)
    
    if (result.error) {
      throw new Error(result.error.message)
    }
    
    return createApiResponse(result.data, {
      status: 200,
      meta: {
        action: 'update_user',
        userId,
        updatedFields: Object.keys(updateData),
      },
    })
  }
)

export const DELETE = withApiHandler<void>(
  async (request: NextRequest, { params }) => {
    const { userId } = parseRouteParams(params, ['userId'])
    const { user, supabase } = await requireAuth(request)
    
    // Users can only delete their own profile
    if (userId !== user.id) {
      throw new Error('Access denied')
    }
    
    // Create user service
    const userService = new UserService(supabase)
    
    // Delete user profile
    const result = await userService.deleteUser(userId)
    
    if (result.error) {
      throw new Error(result.error.message)
    }
    
    return createApiResponse(undefined, {
      status: 200,
      meta: {
        action: 'delete_user',
        userId,
      },
    })
  }
)