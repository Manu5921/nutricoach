/**
 * POST /api/auth/signin
 * User authentication endpoint using Next.js 15 App Router
 */

import { NextRequest } from 'next/server'
import { 
  AuthService,
  UserSignInSchema,
  type ApiResponse,
  type AuthUser,
  type AuthSession,
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

export const POST = withApiHandler<{ user: AuthUser; session: AuthSession }>(
  async (request: NextRequest) => {
    // Validate request body
    const signinData = await validateRequestBody(request, UserSignInSchema)
    
    // Create auth service
    const supabase = await createServerSupabaseClient()
    const authService = new AuthService(supabase)
    
    // Sign in user
    const result = await authService.signIn(signinData)
    
    if (result.error) {
      throw new Error(result.error.message)
    }
    
    return createApiResponse(result.data, {
      status: 200,
      meta: {
        action: 'signin',
        userId: result.data?.user.id,
      },
    })
  }
)