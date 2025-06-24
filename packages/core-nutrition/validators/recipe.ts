/**
 * Recipe Validation Schemas
 * Comprehensive Zod schemas for recipe data with nutrition validation
 */

import { z } from 'zod'

// Common validation patterns
const recipeNameSchema = z
  .string()
  .min(1, { message: 'Recipe name is required' })
  .max(100, { message: 'Recipe name must be less than 100 characters' })
  .trim()

const ingredientNameSchema = z
  .string()
  .min(1, { message: 'Ingredient name is required' })
  .max(100, { message: 'Ingredient name must be less than 100 characters' })
  .trim()

const urlSchema = z
  .string()
  .url({ message: 'Please enter a valid URL' })
  .max(500, { message: 'URL must be less than 500 characters' })
  .optional()

const instructionSchema = z
  .string()
  .min(1, { message: 'Instruction cannot be empty' })
  .max(1000, { message: 'Instruction must be less than 1000 characters' })
  .trim()

// Enum schemas
export const MealTypeSchema = z.enum(['breakfast', 'lunch', 'dinner', 'snack', 'dessert'], {
  errorMap: () => ({ message: 'Please select a valid meal type' })
})

export const DifficultyLevelSchema = z.enum(['easy', 'medium', 'hard'], {
  errorMap: () => ({ message: 'Please select a valid difficulty level' })
})

export const UnitSchema = z.enum([
  // Weight
  'g', 'kg', 'oz', 'lb',
  // Volume
  'ml', 'l', 'tsp', 'tbsp', 'cup', 'fl oz', 'pt', 'qt', 'gal',
  // Count
  'piece', 'pieces', 'item', 'items', 'whole', 'slice', 'slices',
  // Special
  'pinch', 'dash', 'handful', 'clove', 'cloves', 'bunch', 'sprig', 'can', 'bottle'
], {
  errorMap: () => ({ message: 'Please select a valid unit' })
})

// Ingredient schema with nutrition validation
export const RecipeIngredientSchema = z.object({
  name: ingredientNameSchema,
  amount: z
    .number()
    .min(0.01, { message: 'Amount must be greater than 0' })
    .max(10000, { message: 'Amount must be less than 10,000' })
    .refine(val => val % 0.01 === 0, { message: 'Amount can have at most 2 decimal places' }),
  unit: UnitSchema,
  notes: z
    .string()
    .max(200, { message: 'Notes must be less than 200 characters' })
    .trim()
    .optional(),
  // Optional nutrition data for calculation
  caloriesPerUnit: z.number().min(0).max(1000).optional(),
  proteinGPerUnit: z.number().min(0).max(100).optional(),
  carbsGPerUnit: z.number().min(0).max(100).optional(),
  fatGPerUnit: z.number().min(0).max(100).optional()
})

// Time validation schemas
const timeSchema = z
  .number()
  .int({ message: 'Time must be a whole number' })
  .min(1, { message: 'Time must be at least 1 minute' })
  .max(1440, { message: 'Time must be less than 24 hours (1440 minutes)' })

// Nutrition validation schemas
const nutritionValueSchema = z
  .number()
  .min(0, { message: 'Nutrition values cannot be negative' })
  .max(10000, { message: 'Nutrition value seems unreasonably high' })
  .refine(val => val % 0.1 === 0, { message: 'Nutrition values can have at most 1 decimal place' })

const servingsSchema = z
  .number()
  .int({ message: 'Servings must be a whole number' })
  .min(1, { message: 'Must serve at least 1 person' })
  .max(50, { message: 'Cannot serve more than 50 people' })

// Rating validation
const ratingSchema = z
  .number()
  .min(1, { message: 'Rating must be between 1 and 5' })
  .max(5, { message: 'Rating must be between 1 and 5' })
  .refine(val => val % 0.5 === 0, { message: 'Rating must be in 0.5 increments' })

// Core recipe schema
export const RecipeSchema = z.object({
  title: recipeNameSchema,
  description: z
    .string()
    .max(500, { message: 'Description must be less than 500 characters' })
    .trim()
    .optional(),
  imageUrl: urlSchema,
  ingredients: z
    .array(RecipeIngredientSchema)
    .min(1, { message: 'Recipe must have at least one ingredient' })
    .max(50, { message: 'Recipe cannot have more than 50 ingredients' })
    .refine(ingredients => {
      // Check for duplicate ingredient names
      const names = ingredients.map(ing => ing.name.toLowerCase())
      return new Set(names).size === names.length
    }, { message: 'Ingredients must be unique' }),
  instructions: z
    .array(instructionSchema)
    .min(1, { message: 'Recipe must have at least one instruction' })
    .max(30, { message: 'Recipe cannot have more than 30 instructions' }),
  prepTimeMinutes: timeSchema.optional(),
  cookTimeMinutes: timeSchema.optional(),
  servings: servingsSchema,
  cuisineType: z
    .string()
    .max(50, { message: 'Cuisine type must be less than 50 characters' })
    .trim()
    .optional(),
  mealType: MealTypeSchema.optional(),
  dietaryTags: z
    .array(z.string().min(1).max(30).trim())
    .max(10, { message: 'Maximum 10 dietary tags allowed' })
    .refine(tags => new Set(tags).size === tags.length, {
      message: 'Dietary tags must be unique'
    })
    .optional(),
  difficultyLevel: DifficultyLevelSchema.optional(),
  isPublic: z.boolean().default(true),
  // Nutrition information (optional, can be calculated)
  caloriesPerServing: nutritionValueSchema.optional(),
  proteinG: nutritionValueSchema.optional(),
  carbsG: nutritionValueSchema.optional(),
  fatG: nutritionValueSchema.optional(),
  fiberG: nutritionValueSchema.optional(),
  sugarG: nutritionValueSchema.optional(),
  sodiumMg: nutritionValueSchema.optional()
}).refine(data => {
  // Total time validation
  if (data.prepTimeMinutes && data.cookTimeMinutes) {
    return (data.prepTimeMinutes + data.cookTimeMinutes) <= 1440
  }
  return true
}, {
  message: 'Total preparation and cooking time cannot exceed 24 hours',
  path: ['cookTimeMinutes']
}).refine(data => {
  // Nutrition consistency validation
  const hasNutrition = data.caloriesPerServing || data.proteinG || data.carbsG || data.fatG
  if (hasNutrition) {
    // If any nutrition is provided, calories should be reasonable
    const proteinCals = (data.proteinG || 0) * 4
    const carbsCals = (data.carbsG || 0) * 4
    const fatCals = (data.fatG || 0) * 9
    const calculatedCals = proteinCals + carbsCals + fatCals
    
    if (data.caloriesPerServing && calculatedCals > 0) {
      const difference = Math.abs(data.caloriesPerServing - calculatedCals)
      const percentDiff = (difference / data.caloriesPerServing) * 100
      return percentDiff <= 20 // Allow 20% margin of error
    }
  }
  return true
}, {
  message: 'Calorie count does not match the sum of macronutrients (protein, carbs, fat)',
  path: ['caloriesPerServing']
})

// Recipe creation schema (stricter validation)
export const RecipeCreateSchema = RecipeSchema.extend({
  title: recipeNameSchema,
  ingredients: z
    .array(RecipeIngredientSchema)
    .min(2, { message: 'Recipe must have at least two ingredients' }),
  instructions: z
    .array(instructionSchema)
    .min(2, { message: 'Recipe must have at least two instructions' })
})

// Recipe update schema (all fields optional except id)
export const RecipeUpdateSchema = RecipeSchema.partial()

// Recipe search and filter schemas
export const RecipeSearchSchema = z.object({
  query: z.string().max(100).optional(),
  cuisineType: z.string().max(50).optional(),
  mealType: MealTypeSchema.optional(),
  dietaryTags: z.array(z.string().max(30)).max(5).optional(),
  maxPrepTime: timeSchema.optional(),
  maxCookTime: timeSchema.optional(),
  difficulty: DifficultyLevelSchema.optional(),
  minRating: ratingSchema.optional(),
  maxCalories: nutritionValueSchema.optional(),
  minProtein: nutritionValueSchema.optional(),
  isPublic: z.boolean().optional(),
  userId: z.string().uuid().optional(),
  hasImage: z.boolean().optional(),
  ingredientCount: z.object({
    min: z.number().int().min(1).optional(),
    max: z.number().int().max(50).optional()
  }).optional()
}).refine(data => {
  if (data.ingredientCount?.min && data.ingredientCount?.max) {
    return data.ingredientCount.min <= data.ingredientCount.max
  }
  return true
}, {
  message: 'Minimum ingredient count cannot be greater than maximum',
  path: ['ingredientCount', 'max']
})

export const RecipeSortSchema = z.object({
  field: z.enum([
    'created_at', 'updated_at', 'title', 'rating_average', 'likes_count',
    'prep_time_minutes', 'cook_time_minutes', 'calories_per_serving'
  ], {
    errorMap: () => ({ message: 'Invalid sort field' })
  }),
  direction: z.enum(['asc', 'desc'], {
    errorMap: () => ({ message: 'Sort direction must be asc or desc' })
  }).default('desc')
})

// Nutrition calculation schemas
export const NutritionCalculationSchema = z.object({
  ingredients: z.array(z.object({
    name: ingredientNameSchema,
    amount: z.number().min(0.01),
    unit: UnitSchema
  })).min(1),
  servings: servingsSchema.optional().default(1)
})

// Recipe rating schema
export const RecipeRatingSchema = z.object({
  rating: ratingSchema,
  review: z
    .string()
    .max(1000, { message: 'Review must be less than 1000 characters' })
    .trim()
    .optional()
})

// Bulk recipe import schema
export const RecipeBulkImportSchema = z.object({
  recipes: z.array(RecipeCreateSchema).min(1).max(20),
  overwriteExisting: z.boolean().default(false),
  validateNutrition: z.boolean().default(true)
})

// Recipe nutrition validation function
export const validateRecipeNutrition = (
  ingredients: z.infer<typeof RecipeIngredientSchema>[],
  servings: number
): {
  isValid: boolean
  warnings: string[]
  estimatedCalories?: number
} => {
  const warnings: string[] = []
  let estimatedCalories = 0

  // Check if ingredients have nutrition data
  const ingredientsWithNutrition = ingredients.filter(ing => ing.caloriesPerUnit)
  
  if (ingredientsWithNutrition.length === 0) {
    warnings.push('No nutrition data available for ingredients')
  } else if (ingredientsWithNutrition.length < ingredients.length / 2) {
    warnings.push('Missing nutrition data for many ingredients')
  }

  // Calculate estimated calories if possible
  if (ingredientsWithNutrition.length > 0) {
    estimatedCalories = ingredientsWithNutrition.reduce((total, ing) => {
      return total + (ing.caloriesPerUnit! * ing.amount)
    }, 0) / servings
  }

  // Validate reasonable calorie range per serving
  if (estimatedCalories > 0) {
    if (estimatedCalories < 10) {
      warnings.push('Recipe seems very low in calories')
    } else if (estimatedCalories > 2000) {
      warnings.push('Recipe seems very high in calories per serving')
    }
  }

  return {
    isValid: warnings.length === 0,
    warnings,
    estimatedCalories: estimatedCalories > 0 ? Math.round(estimatedCalories) : undefined
  }
}

// Helper function to generate recipe slug
export const generateRecipeSlug = (title: string): string => {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
    .substring(0, 60) // Limit length
}

// Type exports
export type Recipe = z.infer<typeof RecipeSchema>
export type RecipeCreate = z.infer<typeof RecipeCreateSchema>
export type RecipeUpdate = z.infer<typeof RecipeUpdateSchema>
export type RecipeIngredient = z.infer<typeof RecipeIngredientSchema>
export type RecipeSearch = z.infer<typeof RecipeSearchSchema>
export type RecipeSort = z.infer<typeof RecipeSortSchema>
export type NutritionCalculation = z.infer<typeof NutritionCalculationSchema>
export type RecipeRating = z.infer<typeof RecipeRatingSchema>
export type RecipeBulkImport = z.infer<typeof RecipeBulkImportSchema>
export type MealType = z.infer<typeof MealTypeSchema>
export type DifficultyLevel = z.infer<typeof DifficultyLevelSchema>
export type Unit = z.infer<typeof UnitSchema>

// Validation helpers
export const validateRecipe = (data: unknown) => RecipeSchema.safeParse(data)
export const validateRecipeCreate = (data: unknown) => RecipeCreateSchema.safeParse(data)
export const validateRecipeUpdate = (data: unknown) => RecipeUpdateSchema.safeParse(data)
export const validateRecipeSearch = (data: unknown) => RecipeSearchSchema.safeParse(data)
export const validateRecipeSort = (data: unknown) => RecipeSortSchema.safeParse(data)
export const validateNutritionCalculation = (data: unknown) => NutritionCalculationSchema.safeParse(data)
export const validateRecipeRating = (data: unknown) => RecipeRatingSchema.safeParse(data)
export const validateRecipeBulkImport = (data: unknown) => RecipeBulkImportSchema.safeParse(data)