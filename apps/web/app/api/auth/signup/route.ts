/**
 * POST /api/auth/signup
 * User registration endpoint using Next.js 15 App Router
 */

import { NextRequest } from 'next/server'
import { 
  AuthService,
  UserSignUpSchema,
  type ApiResponse,
  type AuthUser,
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

export const POST = withApiHandler<{ user: AuthUser; needsVerification: boolean }>(
  async (request: NextRequest) => {
    // Validate request body
    const signupData = await validateRequestBody(request, UserSignUpSchema)
    
    // Create auth service
    const supabase = await createServerSupabaseClient()
    const authService = new AuthService(supabase)
    
    // Sign up user
    const result = await authService.signUp(signupData)
    
    if (result.error) {
      throw new Error(result.error.message)
    }
    
    return createApiResponse(result.data, {
      status: 201,
      meta: {
        action: 'signup',
        needsVerification: result.data?.needsVerification,
      },
    })
  }
)