/**
 * Authentication Service
 * Handles user authentication using Supabase Auth
 * Based on Context7 research for Supabase TypeScript integration
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { 
  Database, 
  ServiceResponse, 
  AuthUser, 
  AuthSession,
} from '../../types'
import type {
  UserSignUp,
  UserSignIn,
  UserPasswordReset,
  UserPasswordUpdate,
} from '../../validators'
import {
  UserSignUpSchema,
  UserSignInSchema,
  UserPasswordResetSchema,
  UserPasswordUpdateSchema,
} from '../../validators'
import { 
  createLogger,
  AuthenticationError,
  ValidationErrorClass,
  NotFoundError,
  formatServiceError,
  safeAsync,
} from '../../utils'

const logger = createLogger('auth-service')

export class AuthService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Sign up a new user with email and password
   */
  async signUp(data: UserSignUp): Promise<ServiceResponse<{ user: AuthUser; needsVerification: boolean }>> {
    return safeAsync(async () => {
      // Validate input data
      const validationResult = UserSignUpSchema.safeParse(data)
      if (!validationResult.success) {
        throw new ValidationErrorClass(
          'Invalid signup data',
          'signup_data',
          { errors: validationResult.error.errors }
        )
      }

      const { email, password, full_name } = validationResult.data

      logger.info('User signup attempt', { email })

      // Sign up user with Supabase Auth
      const { data: authData, error: authError } = await this.supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name,
          },
        },
      })

      if (authError) {
        logger.error('Signup failed', authError, { email })
        throw new AuthenticationError(`Signup failed: ${authError.message}`)
      }

      if (!authData.user) {
        throw new AuthenticationError('No user data returned from signup')
      }

      // Create user profile in database
      const { error: profileError } = await this.supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: authData.user.email!,
          full_name,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })

      if (profileError) {
        logger.error('Failed to create user profile', profileError, { 
          userId: authData.user.id,
          email 
        })
        // Note: User is created in auth but profile creation failed
        // This should be handled by background job or retry mechanism
      }

      const needsVerification = !authData.user.email_confirmed_at

      logger.info('User signup successful', { 
        userId: authData.user.id,
        email,
        needsVerification
      })

      return {
        user: {
          id: authData.user.id,
          email: authData.user.email!,
          email_confirmed_at: authData.user.email_confirmed_at,
          last_sign_in_at: authData.user.last_sign_in_at,
          created_at: authData.user.created_at,
          updated_at: authData.user.updated_at,
        },
        needsVerification,
      }
    })
  }

  /**
   * Sign in user with email and password
   */
  async signIn(data: UserSignIn): Promise<ServiceResponse<{ user: AuthUser; session: AuthSession }>> {
    return safeAsync(async () => {
      // Validate input data
      const validationResult = UserSignInSchema.safeParse(data)
      if (!validationResult.success) {
        throw new ValidationErrorClass(
          'Invalid signin data',
          'signin_data',
          { errors: validationResult.error.errors }
        )
      }

      const { email, password } = validationResult.data

      logger.info('User signin attempt', { email })

      // Sign in with Supabase Auth
      const { data: authData, error: authError } = await this.supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        logger.warn('Signin failed', { email, error: authError.message })
        throw new AuthenticationError(`Invalid credentials`)
      }

      if (!authData.user || !authData.session) {
        throw new AuthenticationError('No user session created')
      }

      logger.info('User signin successful', { 
        userId: authData.user.id,
        email 
      })

      return {
        user: {
          id: authData.user.id,
          email: authData.user.email!,
          email_confirmed_at: authData.user.email_confirmed_at,
          last_sign_in_at: authData.user.last_sign_in_at,
          created_at: authData.user.created_at,
          updated_at: authData.user.updated_at,
        },
        session: {
          access_token: authData.session.access_token,
          refresh_token: authData.session.refresh_token,
          expires_in: authData.session.expires_in,
          token_type: authData.session.token_type,
          user: {
            id: authData.user.id,
            email: authData.user.email!,
            email_confirmed_at: authData.user.email_confirmed_at,
            last_sign_in_at: authData.user.last_sign_in_at,
            created_at: authData.user.created_at,
            updated_at: authData.user.updated_at,
          },
        },
      }
    })
  }

  /**
   * Sign out current user
   */
  async signOut(): Promise<ServiceResponse<void>> {
    return safeAsync(async () => {
      logger.info('User signout attempt')

      const { error } = await this.supabase.auth.signOut()

      if (error) {
        logger.error('Signout failed', error)
        throw new AuthenticationError(`Signout failed: ${error.message}`)
      }

      logger.info('User signout successful')
    })
  }

  /**
   * Get current user session
   */
  async getCurrentSession(): Promise<ServiceResponse<{ user: AuthUser; session: AuthSession } | null>> {
    return safeAsync(async () => {
      const { data: sessionData, error } = await this.supabase.auth.getSession()

      if (error) {
        logger.error('Failed to get current session', error)
        throw new AuthenticationError(`Session error: ${error.message}`)
      }

      if (!sessionData.session || !sessionData.session.user) {
        return null
      }

      const { user, session } = sessionData

      return {
        user: {
          id: user.id,
          email: user.email!,
          email_confirmed_at: user.email_confirmed_at,
          last_sign_in_at: user.last_sign_in_at,
          created_at: user.created_at,
          updated_at: user.updated_at,
        },
        session: {
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          expires_in: session.expires_in,
          token_type: session.token_type,
          user: {
            id: user.id,
            email: user.email!,
            email_confirmed_at: user.email_confirmed_at,
            last_sign_in_at: user.last_sign_in_at,
            created_at: user.created_at,
            updated_at: user.updated_at,
          },
        },
      }
    })
  }

  /**
   * Get current user (validates token)
   */
  async getCurrentUser(): Promise<ServiceResponse<AuthUser | null>> {
    return safeAsync(async () => {
      const { data: userData, error } = await this.supabase.auth.getUser()

      if (error) {
        logger.warn('Failed to get current user', { error: error.message })
        return null
      }

      if (!userData.user) {
        return null
      }

      return {
        id: userData.user.id,
        email: userData.user.email!,
        email_confirmed_at: userData.user.email_confirmed_at,
        last_sign_in_at: userData.user.last_sign_in_at,
        created_at: userData.user.created_at,
        updated_at: userData.user.updated_at,
      }
    })
  }

  /**
   * Send password reset email
   */
  async resetPassword(data: UserPasswordReset): Promise<ServiceResponse<void>> {
    return safeAsync(async () => {
      // Validate input data
      const validationResult = UserPasswordResetSchema.safeParse(data)
      if (!validationResult.success) {
        throw new ValidationErrorClass(
          'Invalid password reset data',
          'password_reset_data',
          { errors: validationResult.error.errors }
        )
      }

      const { email } = validationResult.data

      logger.info('Password reset requested', { email })

      const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password`,
      })

      if (error) {
        logger.error('Password reset failed', error, { email })
        throw new AuthenticationError(`Password reset failed: ${error.message}`)
      }

      logger.info('Password reset email sent', { email })
    })
  }

  /**
   * Update user password
   */
  async updatePassword(data: UserPasswordUpdate): Promise<ServiceResponse<void>> {
    return safeAsync(async () => {
      // Validate input data
      const validationResult = UserPasswordUpdateSchema.safeParse(data)
      if (!validationResult.success) {
        throw new ValidationErrorClass(
          'Invalid password update data',
          'password_update_data',
          { errors: validationResult.error.errors }
        )
      }

      const { new_password } = validationResult.data

      logger.info('Password update attempt')

      const { error } = await this.supabase.auth.updateUser({
        password: new_password,
      })

      if (error) {
        logger.error('Password update failed', error)
        throw new AuthenticationError(`Password update failed: ${error.message}`)
      }

      logger.info('Password update successful')
    })
  }

  /**
   * Resend email verification
   */
  async resendVerification(email: string): Promise<ServiceResponse<void>> {
    return safeAsync(async () => {
      logger.info('Email verification resend requested', { email })

      const { error } = await this.supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/verify`,
        },
      })

      if (error) {
        logger.error('Email verification resend failed', error, { email })
        throw new AuthenticationError(`Email verification resend failed: ${error.message}`)
      }

      logger.info('Email verification resent', { email })
    })
  }

  /**
   * Sign in with OAuth provider
   */
  async signInWithOAuth(
    provider: 'google' | 'github' | 'apple',
    redirectTo?: string
  ): Promise<ServiceResponse<{ url: string }>> {
    return safeAsync(async () => {
      logger.info('OAuth signin attempt', { provider })

      const { data, error } = await this.supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectTo || `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
        },
      })

      if (error) {
        logger.error('OAuth signin failed', error, { provider })
        throw new AuthenticationError(`OAuth signin failed: ${error.message}`)
      }

      if (!data.url) {
        throw new AuthenticationError('No OAuth URL returned')
      }

      logger.info('OAuth signin URL generated', { provider })

      return { url: data.url }
    })
  }

  /**
   * Refresh current session
   */
  async refreshSession(): Promise<ServiceResponse<{ user: AuthUser; session: AuthSession }>> {
    return safeAsync(async () => {
      logger.debug('Session refresh attempt')

      const { data, error } = await this.supabase.auth.refreshSession()

      if (error) {
        logger.error('Session refresh failed', error)
        throw new AuthenticationError(`Session refresh failed: ${error.message}`)
      }

      if (!data.session || !data.user) {
        throw new AuthenticationError('No session data returned from refresh')
      }

      logger.debug('Session refresh successful')

      return {
        user: {
          id: data.user.id,
          email: data.user.email!,
          email_confirmed_at: data.user.email_confirmed_at,
          last_sign_in_at: data.user.last_sign_in_at,
          created_at: data.user.created_at,
          updated_at: data.user.updated_at,
        },
        session: {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_in: data.session.expires_in,
          token_type: data.session.token_type,
          user: {
            id: data.user.id,
            email: data.user.email!,
            email_confirmed_at: data.user.email_confirmed_at,
            last_sign_in_at: data.user.last_sign_in_at,
            created_at: data.user.created_at,
            updated_at: data.user.updated_at,
          },
        },
      }
    })
  }

  /**
   * Validate if user has valid session
   */
  async validateSession(): Promise<ServiceResponse<boolean>> {
    return safeAsync(async () => {
      const sessionResult = await this.getCurrentSession()
      return sessionResult.data !== null
    })
  }
}