/**
 * GET /api/auth/me
 * Get current user information endpoint using Next.js 15 App Router
 */

import { NextRequest } from 'next/server'
import { 
  AuthService,
  type ApiResponse,
  type AuthUser,
} from '@nutricoach/core-nutrition'
import { 
  withApiHandler,
  createApiResponse,
  handleOptions,
} from '../../../../lib/api-helpers'
import { createServerSupabaseClient } from '../../../../lib/supabase'

export async function OPTIONS() {
  return handleOptions()
}

export const GET = withApiHandler<AuthUser | null>(
  async (request: NextRequest) => {
    // Create auth service
    const supabase = await createServerSupabaseClient()
    const authService = new AuthService(supabase)
    
    // Get current user
    const result = await authService.getCurrentUser()
    
    if (result.error) {
      throw new Error(result.error.message)
    }
    
    return createApiResponse(result.data, {
      status: 200,
      meta: {
        action: 'get_current_user',
        authenticated: result.data !== null,
      },
    })
  }
)