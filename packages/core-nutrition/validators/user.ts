/**
 * User Profile Validation Schemas
 * Comprehensive Zod schemas for user data with business logic validation
 */

import { z } from 'zod'

// Common validation patterns
const phoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{1,14}$/, { message: 'Please enter a valid phone number' })
  .optional()

const nameSchema = z
  .string()
  .min(1, { message: 'Name is required' })
  .max(50, { message: 'Name must be less than 50 characters' })
  .regex(/^[a-zA-Z\s'-]+$/, { message: 'Name can only contain letters, spaces, hyphens, and apostrophes' })
  .trim()

const urlSchema = z
  .string()
  .url({ message: 'Please enter a valid URL' })
  .max(500, { message: 'URL must be less than 500 characters' })
  .optional()

// Enum schemas
export const GenderSchema = z.enum(['male', 'female', 'other'], {
  errorMap: () => ({ message: 'Please select a valid gender' })
})

export const ActivityLevelSchema = z.enum(['sedentary', 'light', 'moderate', 'active', 'very_active'], {
  errorMap: () => ({ message: 'Please select a valid activity level' })
})

export const GoalTypeSchema = z.enum(['lose_weight', 'maintain_weight', 'gain_weight', 'gain_muscle'], {
  errorMap: () => ({ message: 'Please select a valid goal type' })
})

// Date validation with business rules
const dateOfBirthSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Date must be in YYYY-MM-DD format' })
  .refine(dateStr => {
    const date = new Date(dateStr)
    const now = new Date()
    const age = now.getFullYear() - date.getFullYear()
    return age >= 13 && age <= 120
  }, { message: 'Age must be between 13 and 120 years' })
  .refine(dateStr => {
    const date = new Date(dateStr)
    return date <= new Date()
  }, { message: 'Date of birth cannot be in the future' })

// Physical measurements with validation
const heightSchema = z
  .number()
  .min(50, { message: 'Height must be at least 50 cm' })
  .max(300, { message: 'Height must be less than 300 cm' })
  .refine(val => val % 0.1 === 0, { message: 'Height can have at most 1 decimal place' })

const weightSchema = z
  .number()
  .min(20, { message: 'Weight must be at least 20 kg' })
  .max(500, { message: 'Weight must be less than 500 kg' })
  .refine(val => val % 0.1 === 0, { message: 'Weight can have at most 1 decimal place' })

// Arrays with business validation
const dietaryRestrictionsSchema = z
  .array(z.string().min(1).max(50))
  .max(10, { message: 'Maximum 10 dietary restrictions allowed' })
  .refine(arr => new Set(arr).size === arr.length, {
    message: 'Dietary restrictions must be unique'
  })
  .optional()

const allergiesSchema = z
  .array(z.string().min(1).max(50))
  .max(15, { message: 'Maximum 15 allergies allowed' })
  .refine(arr => new Set(arr).size === arr.length, {
    message: 'Allergies must be unique'
  })
  .optional()

const cuisinePreferencesSchema = z
  .array(z.string().min(1).max(30))
  .max(20, { message: 'Maximum 20 cuisine preferences allowed' })
  .refine(arr => new Set(arr).size === arr.length, {
    message: 'Cuisine preferences must be unique'
  })
  .optional()

// Core user profile schema
export const UserProfileSchema = z.object({
  firstName: nameSchema.optional(),
  lastName: nameSchema.optional(),
  dateOfBirth: dateOfBirthSchema.optional(),
  phone: phoneSchema,
  avatarUrl: urlSchema,
  heightCm: heightSchema.optional(),
  weightKg: weightSchema.optional(),
  gender: GenderSchema.optional(),
  activityLevel: ActivityLevelSchema.optional(),
  goalType: GoalTypeSchema.optional(),
  targetWeightKg: weightSchema.optional(),
  dietaryRestrictions: dietaryRestrictionsSchema,
  allergies: allergiesSchema,
  cuisinePreferences: cuisinePreferencesSchema,
  isProfilePublic: z.boolean().default(false)
}).refine(data => {
  // If goal type is weight-related, target weight should be provided
  if (data.goalType && ['lose_weight', 'gain_weight'].includes(data.goalType)) {
    return data.targetWeightKg !== undefined && data.weightKg !== undefined
  }
  return true
}, {
  message: 'Target weight is required for weight loss/gain goals',
  path: ['targetWeightKg']
}).refine(data => {
  // Target weight should be different from current weight for weight change goals
  if (data.goalType && data.weightKg && data.targetWeightKg) {
    if (data.goalType === 'lose_weight') {
      return data.targetWeightKg < data.weightKg
    }
    if (data.goalType === 'gain_weight') {
      return data.targetWeightKg > data.weightKg
    }
  }
  return true
}, {
  message: 'Target weight should align with your goal type',
  path: ['targetWeightKg']
}).refine(data => {
  // BMI safety check - warn about extreme values
  if (data.heightCm && data.weightKg) {
    const bmi = data.weightKg / Math.pow(data.heightCm / 100, 2)
    return bmi >= 12 && bmi <= 50 // Very permissive range for edge cases
  }
  return true
}, {
  message: 'The combination of height and weight results in an extreme BMI value',
  path: ['weightKg']
})

// Partial update schema (all fields optional)
export const UserUpdateSchema = UserProfileSchema.partial()

// Registration completion schema (requires basic info)
export const UserRegistrationCompleteSchema = UserProfileSchema.extend({
  firstName: nameSchema,
  lastName: nameSchema,
  dateOfBirth: dateOfBirthSchema,
  heightCm: heightSchema,
  weightKg: weightSchema,
  gender: GenderSchema,
  activityLevel: ActivityLevelSchema,
  goalType: GoalTypeSchema
})

// User search and filter schemas
export const UserSearchSchema = z.object({
  query: z.string().max(100).optional(),
  isPublic: z.boolean().optional(),
  goalType: GoalTypeSchema.optional(),
  activityLevel: ActivityLevelSchema.optional(),
  minAge: z.number().min(13).max(120).optional(),
  maxAge: z.number().min(13).max(120).optional(),
  gender: GenderSchema.optional()
}).refine(data => {
  if (data.minAge && data.maxAge) {
    return data.minAge <= data.maxAge
  }
  return true
}, {
  message: 'Minimum age cannot be greater than maximum age',
  path: ['maxAge']
})

export const UserSortSchema = z.object({
  field: z.enum(['created_at', 'updated_at', 'first_name', 'last_name'], {
    errorMap: () => ({ message: 'Invalid sort field' })
  }),
  direction: z.enum(['asc', 'desc'], {
    errorMap: () => ({ message: 'Sort direction must be asc or desc' })
  }).default('desc')
})

// Profile completeness validation
export const validateProfileCompleteness = (profile: Partial<z.infer<typeof UserProfileSchema>>) => {
  const requiredFields = [
    'firstName',
    'lastName',
    'dateOfBirth',
    'heightCm',
    'weightKg',
    'gender',
    'activityLevel',
    'goalType'
  ]

  const missingFields = requiredFields.filter(field => !profile[field as keyof typeof profile])
  const completeness = ((requiredFields.length - missingFields.length) / requiredFields.length) * 100

  return {
    isComplete: missingFields.length === 0,
    completeness: Math.round(completeness),
    missingFields
  }
}

// BMI calculation and validation
export const calculateBMI = (heightCm: number, weightKg: number): {
  bmi: number
  category: string
  isHealthy: boolean
} => {
  const bmi = weightKg / Math.pow(heightCm / 100, 2)
  
  let category: string
  let isHealthy: boolean

  if (bmi < 18.5) {
    category = 'Underweight'
    isHealthy = false
  } else if (bmi < 25) {
    category = 'Normal weight'
    isHealthy = true
  } else if (bmi < 30) {
    category = 'Overweight'
    isHealthy = false
  } else {
    category = 'Obese'
    isHealthy = false
  }

  return {
    bmi: Math.round(bmi * 10) / 10,
    category,
    isHealthy
  }
}

// BMR calculation (Mifflin-St Jeor Equation)
export const calculateBMR = (
  weightKg: number,
  heightCm: number,
  age: number,
  gender: 'male' | 'female'
): number => {
  const baseBMR = (10 * weightKg) + (6.25 * heightCm) - (5 * age)
  return gender === 'male' ? baseBMR + 5 : baseBMR - 161
}

// TDEE calculation
export const calculateTDEE = (bmr: number, activityLevel: z.infer<typeof ActivityLevelSchema>): number => {
  const multipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9
  }

  return bmr * multipliers[activityLevel]
}

// Type exports
export type UserProfile = z.infer<typeof UserProfileSchema>
export type UserUpdate = z.infer<typeof UserUpdateSchema>
export type UserRegistrationComplete = z.infer<typeof UserRegistrationCompleteSchema>
export type UserSearch = z.infer<typeof UserSearchSchema>
export type UserSort = z.infer<typeof UserSortSchema>
export type Gender = z.infer<typeof GenderSchema>
export type ActivityLevel = z.infer<typeof ActivityLevelSchema>
export type GoalType = z.infer<typeof GoalTypeSchema>

// Validation helpers
export const validateUserProfile = (data: unknown) => UserProfileSchema.safeParse(data)
export const validateUserUpdate = (data: unknown) => UserUpdateSchema.safeParse(data)
export const validateUserRegistrationComplete = (data: unknown) => UserRegistrationCompleteSchema.safeParse(data)
export const validateUserSearch = (data: unknown) => UserSearchSchema.safeParse(data)
export const validateUserSort = (data: unknown) => UserSortSchema.safeParse(data)