/**
 * User Service
 * Handles user profile management and operations
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { 
  Database, 
  ServiceResponse, 
  User,
  UserProfile,
  PaginatedResponse,
} from '../../types'
import type {
  UserUpdate,
  UserSearch,
} from '../../validators'
import {
  UserUpdateSchema,
  UserSearchSchema,
  validateUserAge,
  validateUserBMI,
} from '../../validators'
import { 
  createLogger,
  AuthenticationError,
  ValidationErrorClass,
  NotFoundError,
  formatServiceError,
  safeAsync,
} from '../../utils'

const logger = createLogger('user-service')

export class UserService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Get user profile by ID
   */
  async getUserById(userId: string): Promise<ServiceResponse<UserProfile | null>> {
    return safeAsync(async () => {
      logger.debug('Getting user by ID', { userId })

      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          logger.warn('User not found', { userId })
          return null
        }
        logger.error('Failed to get user', error, { userId })
        throw new Error(`Failed to get user: ${error.message}`)
      }

      const userProfile = this.enrichUserProfile(data)
      
      logger.debug('User retrieved successfully', { userId })
      return userProfile
    })
  }

  /**
   * Get user profile by email
   */
  async getUserByEmail(email: string): Promise<ServiceResponse<UserProfile | null>> {
    return safeAsync(async () => {
      logger.debug('Getting user by email', { email })

      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          logger.warn('User not found', { email })
          return null
        }
        logger.error('Failed to get user by email', error, { email })
        throw new Error(`Failed to get user: ${error.message}`)
      }

      const userProfile = this.enrichUserProfile(data)
      
      logger.debug('User retrieved successfully', { email })
      return userProfile
    })
  }

  /**
   * Update user profile
   */
  async updateUser(userId: string, updates: UserUpdate): Promise<ServiceResponse<UserProfile>> {
    return safeAsync(async () => {
      // Validate input data
      const validationResult = UserUpdateSchema.safeParse(updates)
      if (!validationResult.success) {
        throw new ValidationErrorClass(
          'Invalid user update data',
          'user_update_data',
          { errors: validationResult.error.errors }
        )
      }

      const updateData = {
        ...validationResult.data,
        updated_at: new Date().toISOString(),
      }

      logger.info('Updating user profile', { userId, updates: Object.keys(updates) })

      // Check if user exists
      const existingUser = await this.getUserById(userId)
      if (!existingUser.data) {
        throw new NotFoundError('User not found')
      }

      const { data, error } = await this.supabase
        .from('users')
        .update(updateData)
        .eq('id', userId)
        .select('*')
        .single()

      if (error) {
        logger.error('Failed to update user', error, { userId })
        throw new Error(`Failed to update user: ${error.message}`)
      }

      const userProfile = this.enrichUserProfile(data)
      
      logger.info('User profile updated successfully', { userId })
      return userProfile
    })
  }

  /**
   * Delete user profile
   */
  async deleteUser(userId: string): Promise<ServiceResponse<void>> {
    return safeAsync(async () => {
      logger.info('Deleting user', { userId })

      // Check if user exists
      const existingUser = await this.getUserById(userId)
      if (!existingUser.data) {
        throw new NotFoundError('User not found')
      }

      const { error } = await this.supabase
        .from('users')
        .delete()
        .eq('id', userId)

      if (error) {
        logger.error('Failed to delete user', error, { userId })
        throw new Error(`Failed to delete user: ${error.message}`)
      }

      logger.info('User deleted successfully', { userId })
    })
  }

  /**
   * Search and list users with pagination
   */
  async searchUsers(searchParams: UserSearch): Promise<ServiceResponse<PaginatedResponse<UserProfile>>> {
    return safeAsync(async () => {
      // Validate search parameters
      const validationResult = UserSearchSchema.safeParse(searchParams)
      if (!validationResult.success) {
        throw new ValidationErrorClass(
          'Invalid search parameters',
          'search_params',
          { errors: validationResult.error.errors }
        )
      }

      const {
        page = 1,
        limit = 20,
        sortBy = 'created_at',
        sortOrder = 'desc',
        query,
        activity_level,
        gender,
        age_min,
        age_max,
      } = validationResult.data

      logger.debug('Searching users', { 
        page, 
        limit, 
        sortBy, 
        sortOrder,
        hasQuery: !!query,
        filters: { activity_level, gender, age_min, age_max }
      })

      // Build query
      let queryBuilder = this.supabase
        .from('users')
        .select('*', { count: 'exact' })

      // Apply filters
      if (query) {
        queryBuilder = queryBuilder.or(
          `full_name.ilike.%${query}%,email.ilike.%${query}%`
        )
      }

      if (activity_level) {
        queryBuilder = queryBuilder.eq('activity_level', activity_level)
      }

      if (gender) {
        queryBuilder = queryBuilder.eq('gender', gender)
      }

      // Age filtering requires calculation
      if (age_min || age_max) {
        const currentYear = new Date().getFullYear()
        
        if (age_max) {
          const minBirthYear = currentYear - age_max - 1
          queryBuilder = queryBuilder.gte('date_of_birth', `${minBirthYear}-01-01`)
        }
        
        if (age_min) {
          const maxBirthYear = currentYear - age_min
          queryBuilder = queryBuilder.lte('date_of_birth', `${maxBirthYear}-12-31`)
        }
      }

      // Apply sorting
      const isAscending = sortOrder === 'asc'
      queryBuilder = queryBuilder.order(sortBy, { ascending: isAscending })

      // Apply pagination
      const from = (page - 1) * limit
      const to = from + limit - 1
      queryBuilder = queryBuilder.range(from, to)

      const { data, error, count } = await queryBuilder

      if (error) {
        logger.error('Failed to search users', error, { searchParams })
        throw new Error(`Failed to search users: ${error.message}`)
      }

      // Enrich user profiles
      const enrichedUsers = data.map(user => this.enrichUserProfile(user))

      const totalPages = Math.ceil((count || 0) / limit)
      const hasNext = page < totalPages
      const hasPrev = page > 1

      const result: PaginatedResponse<UserProfile> = {
        data: enrichedUsers,
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages,
          hasNext,
          hasPrev,
        },
      }

      logger.debug('User search completed', { 
        page, 
        limit, 
        total: count, 
        resultsCount: data.length 
      })

      return result
    })
  }

  /**
   * Get user's nutrition goals
   */
  async getUserNutritionGoals(userId: string): Promise<ServiceResponse<any | null>> {
    return safeAsync(async () => {
      logger.debug('Getting user nutrition goals', { userId })

      const { data, error } = await this.supabase
        .from('nutrition_goals')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          logger.debug('No nutrition goals found for user', { userId })
          return null
        }
        logger.error('Failed to get nutrition goals', error, { userId })
        throw new Error(`Failed to get nutrition goals: ${error.message}`)
      }

      logger.debug('Nutrition goals retrieved', { userId })
      return data
    })
  }

  /**
   * Calculate and update user's nutrition goals based on profile
   */
  async calculateNutritionGoals(userId: string): Promise<ServiceResponse<any>> {
    return safeAsync(async () => {
      logger.info('Calculating nutrition goals', { userId })

      // Get user profile
      const userResult = await this.getUserById(userId)
      if (!userResult.data) {
        throw new NotFoundError('User not found')
      }

      const user = userResult.data

      // Validate required data for calculation
      if (!user.weight_kg || !user.height_cm || !user.date_of_birth || !user.gender || !user.activity_level) {
        throw new ValidationErrorClass(
          'Insufficient user data for nutrition goal calculation',
          'missing_data',
          { 
            missing: {
              weight: !user.weight_kg,
              height: !user.height_cm,
              dateOfBirth: !user.date_of_birth,
              gender: !user.gender,
              activityLevel: !user.activity_level,
            }
          }
        )
      }

      // Calculate BMR using Mifflin-St Jeor Equation
      const age = user.age!
      let bmr: number

      if (user.gender === 'male') {
        bmr = (10 * user.weight_kg) + (6.25 * user.height_cm) - (5 * age) + 5
      } else {
        bmr = (10 * user.weight_kg) + (6.25 * user.height_cm) - (5 * age) - 161
      }

      // Calculate TDEE based on activity level
      const activityMultipliers = {
        sedentary: 1.2,
        light: 1.375,
        moderate: 1.55,
        active: 1.725,
        very_active: 1.9,
      }

      const tdee = bmr * activityMultipliers[user.activity_level]

      // Calculate macros (general healthy recommendations)
      const proteinCaloriesPerKg = 1.6 // grams per kg body weight
      const proteinGrams = user.weight_kg * proteinCaloriesPerKg
      const proteinCalories = proteinGrams * 4

      const fatPercentage = 0.25 // 25% of total calories
      const fatCalories = tdee * fatPercentage
      const fatGrams = fatCalories / 9

      const carbCalories = tdee - proteinCalories - fatCalories
      const carbGrams = carbCalories / 4

      const nutritionGoals = {
        user_id: userId,
        daily_calories: Math.round(tdee),
        daily_protein_g: Math.round(proteinGrams),
        daily_carbs_g: Math.round(carbGrams),
        daily_fat_g: Math.round(fatGrams),
        daily_fiber_g: Math.round(user.weight_kg * 0.4), // 0.4g per kg
        daily_sugar_g: Math.round(tdee * 0.1 / 4), // 10% of calories
        daily_sodium_mg: 2300, // Standard recommendation
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      // Upsert nutrition goals
      const { data, error } = await this.supabase
        .from('nutrition_goals')
        .upsert(nutritionGoals, {
          onConflict: 'user_id',
        })
        .select('*')
        .single()

      if (error) {
        logger.error('Failed to save nutrition goals', error, { userId })
        throw new Error(`Failed to save nutrition goals: ${error.message}`)
      }

      logger.info('Nutrition goals calculated and saved', { 
        userId,
        bmr: Math.round(bmr),
        tdee: Math.round(tdee),
        calories: nutritionGoals.daily_calories,
      })

      return data
    })
  }

  /**
   * Check if email exists
   */
  async checkEmailExists(email: string): Promise<ServiceResponse<boolean>> {
    return safeAsync(async () => {
      const { data, error } = await this.supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .limit(1)

      if (error) {
        logger.error('Failed to check email existence', error, { email })
        throw new Error(`Failed to check email: ${error.message}`)
      }

      return data.length > 0
    })
  }

  /**
   * Get user statistics
   */
  async getUserStats(userId: string): Promise<ServiceResponse<any>> {
    return safeAsync(async () => {
      logger.debug('Getting user statistics', { userId })

      // Get counts for user's data
      const [recipesResult, mealLogsResult] = await Promise.all([
        this.supabase
          .from('recipes')
          .select('id', { count: 'exact' })
          .eq('user_id', userId),
        this.supabase
          .from('meal_logs')
          .select('id', { count: 'exact' })
          .eq('user_id', userId),
      ])

      const stats = {
        totalRecipes: recipesResult.count || 0,
        totalMealLogs: mealLogsResult.count || 0,
        memberSince: null as string | null,
      }

      // Get member since date
      const userResult = await this.getUserById(userId)
      if (userResult.data) {
        stats.memberSince = userResult.data.created_at
      }

      logger.debug('User statistics retrieved', { userId, stats })
      return stats
    })
  }

  /**
   * Enrich user profile with calculated fields
   */
  private enrichUserProfile(user: User): UserProfile {
    const enriched: UserProfile = { ...user }

    // Calculate age
    if (user.date_of_birth) {
      const ageValidation = validateUserAge(user.date_of_birth)
      if (ageValidation.success) {
        const birthDate = new Date(user.date_of_birth)
        const today = new Date()
        let age = today.getFullYear() - birthDate.getFullYear()
        const monthDiff = today.getMonth() - birthDate.getMonth()
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--
        }
        
        enriched.age = age
      }
    }

    // Calculate BMI
    if (user.weight_kg && user.height_cm) {
      const bmiValidation = validateUserBMI(user.weight_kg, user.height_cm)
      if (bmiValidation.success) {
        const heightInMeters = user.height_cm / 100
        enriched.bmi = Number((user.weight_kg / (heightInMeters * heightInMeters)).toFixed(1))
      }
    }

    // Calculate BMR and TDEE
    if (enriched.age && user.weight_kg && user.height_cm && user.gender) {
      let bmr: number

      if (user.gender === 'male') {
        bmr = (10 * user.weight_kg) + (6.25 * user.height_cm) - (5 * enriched.age) + 5
      } else {
        bmr = (10 * user.weight_kg) + (6.25 * user.height_cm) - (5 * enriched.age) - 161
      }

      enriched.bmr = Math.round(bmr)

      if (user.activity_level) {
        const activityMultipliers = {
          sedentary: 1.2,
          light: 1.375,
          moderate: 1.55,
          active: 1.725,
          very_active: 1.9,
        }

        enriched.tdee = Math.round(bmr * activityMultipliers[user.activity_level])
      }
    }

    return enriched
  }
}