/**
 * Authentication Validation Schemas
 * Comprehensive Zod schemas for user authentication flows
 */

import { z } from 'zod'

// Common validation patterns
const emailSchema = z
  .string()
  .email({ message: 'Please enter a valid email address' })
  .min(1, { message: 'Email is required' })
  .max(255, { message: 'Email must be less than 255 characters' })
  .toLowerCase()
  .trim()

const passwordSchema = z
  .string()
  .min(8, { message: 'Password must be at least 8 characters long' })
  .max(128, { message: 'Password must be less than 128 characters' })
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
  })

const nameSchema = z
  .string()
  .min(1, { message: 'Name is required' })
  .max(50, { message: 'Name must be less than 50 characters' })
  .regex(/^[a-zA-Z\s'-]+$/, { message: 'Name can only contain letters, spaces, hyphens, and apostrophes' })
  .trim()

// Authentication request schemas
export const SigninSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, { message: 'Password is required' })
})

export const SignupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string().min(1, { message: 'Password confirmation is required' }),
  firstName: nameSchema.optional(),
  lastName: nameSchema.optional(),
  acceptedTerms: z.boolean().refine(val => val === true, {
    message: 'You must accept the terms and conditions'
  })
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
})

export const ForgotPasswordSchema = z.object({
  email: emailSchema
})

export const ResetPasswordSchema = z.object({
  token: z.string().min(1, { message: 'Reset token is required' }),
  password: passwordSchema,
  confirmPassword: z.string().min(1, { message: 'Password confirmation is required' })
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
})

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, { message: 'Current password is required' }),
  newPassword: passwordSchema,
  confirmNewPassword: z.string().min(1, { message: 'Password confirmation is required' })
}).refine(data => data.newPassword === data.confirmNewPassword, {
  message: 'New passwords do not match',
  path: ['confirmNewPassword']
}).refine(data => data.currentPassword !== data.newPassword, {
  message: 'New password must be different from current password',
  path: ['newPassword']
})

export const UpdateEmailSchema = z.object({
  newEmail: emailSchema,
  password: z.string().min(1, { message: 'Password is required for email change' })
})

export const VerifyEmailSchema = z.object({
  token: z.string().min(1, { message: 'Verification token is required' })
})

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, { message: 'Refresh token is required' })
})

// OAuth schemas
export const OAuthProviderSchema = z.enum(['google', 'facebook', 'apple', 'github'], {
  errorMap: () => ({ message: 'Invalid OAuth provider' })
})

export const OAuthCallbackSchema = z.object({
  provider: OAuthProviderSchema,
  code: z.string().min(1, { message: 'Authorization code is required' }),
  state: z.string().optional(),
  redirectUrl: z.string().url().optional()
})

// Session validation
export const SessionSchema = z.object({
  userId: z.string().uuid({ message: 'Invalid user ID format' }),
  email: emailSchema,
  emailConfirmed: z.boolean(),
  role: z.enum(['user', 'admin', 'moderator']).default('user'),
  createdAt: z.string().datetime(),
  expiresAt: z.string().datetime(),
  lastActiveAt: z.string().datetime()
})

// Type exports
export type SigninRequest = z.infer<typeof SigninSchema>
export type SignupRequest = z.infer<typeof SignupSchema>
export type ForgotPasswordRequest = z.infer<typeof ForgotPasswordSchema>
export type ResetPasswordRequest = z.infer<typeof ResetPasswordSchema>
export type ChangePasswordRequest = z.infer<typeof ChangePasswordSchema>
export type UpdateEmailRequest = z.infer<typeof UpdateEmailSchema>
export type VerifyEmailRequest = z.infer<typeof VerifyEmailSchema>
export type RefreshTokenRequest = z.infer<typeof RefreshTokenSchema>
export type OAuthCallbackRequest = z.infer<typeof OAuthCallbackSchema>
export type SessionData = z.infer<typeof SessionSchema>
export type OAuthProvider = z.infer<typeof OAuthProviderSchema>

// Validation helpers
export const validateSignin = (data: unknown) => SigninSchema.safeParse(data)
export const validateSignup = (data: unknown) => SignupSchema.safeParse(data)
export const validateForgotPassword = (data: unknown) => ForgotPasswordSchema.safeParse(data)
export const validateResetPassword = (data: unknown) => ResetPasswordSchema.safeParse(data)
export const validateChangePassword = (data: unknown) => ChangePasswordSchema.safeParse(data)
export const validateUpdateEmail = (data: unknown) => UpdateEmailSchema.safeParse(data)
export const validateVerifyEmail = (data: unknown) => VerifyEmailSchema.safeParse(data)
export const validateRefreshToken = (data: unknown) => RefreshTokenSchema.safeParse(data)
export const validateOAuthCallback = (data: unknown) => OAuthCallbackSchema.safeParse(data)
export const validateSession = (data: unknown) => SessionSchema.safeParse(data)

// Password strength checker
export const checkPasswordStrength = (password: string): {
  score: number
  feedback: string[]
  isStrong: boolean
} => {
  const feedback: string[] = []
  let score = 0

  // Length check
  if (password.length >= 8) score += 1
  else feedback.push('Use at least 8 characters')

  if (password.length >= 12) score += 1
  else feedback.push('Consider using 12+ characters for better security')

  // Character variety checks
  if (/[a-z]/.test(password)) score += 1
  else feedback.push('Include lowercase letters')

  if (/[A-Z]/.test(password)) score += 1
  else feedback.push('Include uppercase letters')

  if (/\d/.test(password)) score += 1
  else feedback.push('Include numbers')

  if (/[@$!%*?&]/.test(password)) score += 1
  else feedback.push('Include special characters (@$!%*?&)')

  // Common patterns check
  if (!/(.)\1{2,}/.test(password)) score += 1
  else feedback.push('Avoid repeating characters')

  if (!/123|abc|qwe|password|admin/.test(password.toLowerCase())) score += 1
  else feedback.push('Avoid common patterns like "123" or "password"')

  return {
    score,
    feedback,
    isStrong: score >= 6
  }
}