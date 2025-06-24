/**
 * Plan Builder Module
 * Comprehensive meal planning and nutrition calculation services
 */

export {
  NutritionCalculator,
  createNutritionCalculator,
  createPrecisionCalculator,
  createStandardCalculator,
  BMR_METHODS,
  MACRO_PRESETS,
  quickCalculations,
  type PersonalMetrics,
  type NutritionGoals,
  type MacroTargets,
  type MicroTargets,
  type NutritionTargets,
  type CalculationMethod,
} from './nutrition-calculator.js';

export {
  MealPlanner,
  createMealPlanner,
  MEAL_DISTRIBUTIONS,
  type Recipe,
  type RecipeIngredient,
  type MealType,
  type MealSlot,
  type DailyMealPlan,
  type WeeklyMealPlan,
  type ShoppingListItem,
  type MealPlanConstraints,
  type MealPlanningOptions,
  type NutritionInfo,
} from './meal-planner.js';