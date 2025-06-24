/**
 * POST /api/auth/signout
 * User sign out endpoint using Next.js 15 App Router
 */

import { NextRequest } from 'next/server'
import { 
  AuthService,
  type ApiResponse,
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

export const POST = withApiHandler<void>(
  async (request: NextRequest) => {
    // Create auth service
    const supabase = await createServerSupabaseClient()
    const authService = new AuthService(supabase)
    
    // Sign out user
    const result = await authService.signOut()
    
    if (result.error) {
      throw new Error(result.error.message)
    }
    
    return createApiResponse(undefined, {
      status: 200,
      meta: {
        action: 'signout',
      },
    })
  }
)