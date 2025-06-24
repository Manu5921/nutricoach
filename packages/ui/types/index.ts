import { type VariantProps } from "class-variance-authority"
import { type ComponentPropsWithoutRef, type ElementRef } from "react"

/**
 * Base component props that all UI components extend
 */
export interface BaseComponentProps {
  /** Additional CSS classes */
  className?: string
  /** Data attributes for testing */
  "data-testid"?: string
}

/**
 * Health-specific color variants for our nutrition app
 */
export type HealthColorVariant = 
  | "primary"      // Green - main brand color
  | "secondary"    // Orange - energy, warmth
  | "tertiary"     // Blue - trust, hydration
  | "success"      // Achievement, goals
  | "warning"      // Caution, moderation
  | "error"        // Issues, problems
  | "neutral"      // Default, balanced

/**
 * Size variants used across components
 */
export type SizeVariant = "xs" | "sm" | "md" | "lg" | "xl"

/**
 * Component variant types for buttons, cards, etc.
 */
export type ComponentVariant = "default" | "ghost" | "outline" | "subtle"

/**
 * Nutrition-specific types
 */
export interface NutritionValue {
  amount: number
  unit: string
  dailyValue?: number
}

export interface InflammationScore {
  value: number
  level: "anti-inflammatory" | "neutral" | "pro-inflammatory"
  color: HealthColorVariant
}

export interface MacroNutrients {
  protein: NutritionValue
  carbs: NutritionValue
  fat: NutritionValue
  fiber: NutritionValue
  calories: NutritionValue
}

/**
 * Animation and interaction types
 */
export type AnimationDuration = "fast" | "normal" | "slow"
export type AnimationEasing = "linear" | "ease-in" | "ease-out" | "ease-in-out" | "bounce"

/**
 * Form-related types
 */
export interface FormFieldProps extends BaseComponentProps {
  label?: string
  description?: string
  error?: string
  required?: boolean
  disabled?: boolean
}

/**
 * Icon types
 */
export interface IconProps extends BaseComponentProps {
  size?: SizeVariant | number
  color?: HealthColorVariant
  strokeWidth?: number
}

/**
 * Layout and spacing types
 */
export type SpacingValue = 
  | "none" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl"
  | number
  | string

export type AlignmentValue = "start" | "center" | "end" | "stretch"
export type JustifyValue = "start" | "center" | "end" | "between" | "around" | "evenly"

/**
 * Responsive breakpoint types
 */
export type Breakpoint = "xs" | "sm" | "md" | "lg" | "xl" | "2xl"

export interface ResponsiveValue<T> {
  default?: T
  xs?: T
  sm?: T
  md?: T
  lg?: T
  xl?: T
  "2xl"?: T
}

/**
 * Theme and appearance types
 */
export type ThemeMode = "light" | "dark" | "system"

export interface ThemeConfig {
  mode: ThemeMode
  primaryColor: HealthColorVariant
  borderRadius: "none" | "sm" | "md" | "lg" | "xl"
  density: "compact" | "normal" | "comfortable"
}

/**
 * Accessibility types
 */
export interface AccessibilityProps {
  "aria-label"?: string
  "aria-labelledby"?: string
  "aria-describedby"?: string
  "aria-expanded"?: boolean
  "aria-hidden"?: boolean
  role?: string
}

/**
 * Loading and async state types
 */
export interface AsyncState<T = any> {
  data?: T
  loading: boolean
  error?: string | Error
}

/**
 * Component ref types for better type safety
 */
export type ComponentRef<T extends keyof JSX.IntrinsicElements> = ElementRef<T>
export type ComponentProps<T extends keyof JSX.IntrinsicElements> = 
  ComponentPropsWithoutRef<T>

/**
 * Food and recipe related types
 */
export interface FoodItem {
  id: string
  name: string
  calories: number
  macros: MacroNutrients
  inflammationScore: InflammationScore
  allergens?: string[]
  category: FoodCategory
}

export type FoodCategory = 
  | "vegetables"
  | "fruits" 
  | "proteins"
  | "grains"
  | "dairy"
  | "fats"
  | "herbs-spices"
  | "beverages"

export interface Recipe {
  id: string
  name: string
  description: string
  ingredients: RecipeIngredient[]
  instructions: string[]
  nutrition: MacroNutrients
  inflammationScore: InflammationScore
  prepTime: number
  cookTime: number
  servings: number
  difficulty: "easy" | "medium" | "hard"
  tags: string[]
  image?: string
}

export interface RecipeIngredient {
  foodId: string
  amount: number
  unit: string
  preparation?: string
}

/**
 * User and health profile types
 */
export interface UserProfile {
  id: string
  name: string
  email: string
  avatar?: string
  healthGoals: HealthGoal[]
  dietaryRestrictions: string[]
  preferences: UserPreferences
}

export interface HealthGoal {
  id: string
  type: "weight-loss" | "muscle-gain" | "inflammation-reduction" | "energy-boost"
  target: number
  current: number
  unit: string
  deadline?: Date
}

export interface UserPreferences {
  notifications: boolean
  theme: ThemeMode
  units: "metric" | "imperial"
  language: string
}

/**
 * Utility types for component variants
 */
export type ExtractVariantProps<T> = T extends (...args: any[]) => any 
  ? VariantProps<T> 
  : never

/**
 * Generic callback types
 */
export type VoidCallback = () => void
export type ValueCallback<T> = (value: T) => void
export type ChangeHandler<T> = (value: T) => void

/**
 * Component state types
 */
export type ComponentState = "idle" | "loading" | "success" | "error"

/**
 * Export all for easy importing
 */
export type {
  VariantProps
}