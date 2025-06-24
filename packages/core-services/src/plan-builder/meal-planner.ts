/**
 * Universal Meal Planner
 * Extensible meal planning system for various dietary approaches
 */

export interface NutritionInfo {
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber: number;
  sugar?: number;
  sodium?: number;
  [key: string]: number | undefined;
}

export interface Recipe {
  id: string;
  name: string;
  description?: string;
  servings: number;
  prepTime: number; // minutes
  cookTime: number; // minutes
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  ingredients: RecipeIngredient[];
  instructions: string[];
  nutrition: NutritionInfo;
  mealTypes: MealType[];
  cuisineType?: string;
  dietaryTags?: string[]; // 'vegetarian', 'vegan', 'gluten-free', etc.
}

export interface RecipeIngredient {
  id: string;
  name: string;
  amount: number;
  unit: string;
  nutrition: NutritionInfo;
  alternatives?: string[]; // Alternative ingredients
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'pre_workout' | 'post_workout';

export interface MealSlot {
  type: MealType;
  targetCalories: number;
  targetMacros: Partial<NutritionInfo>;
  timeOfDay?: string; // e.g., "08:00"
  preferences?: string[];
  restrictions?: string[];
}

export interface DailyMealPlan {
  date: string;
  totalNutrition: NutritionInfo;
  meals: {
    [K in MealType]?: {
      recipes: Recipe[];
      totalNutrition: NutritionInfo;
      adjustments?: { [recipeId: string]: number }; // Serving adjustments
    };
  };
  hydrationTarget: number;
  notes?: string;
}

export interface WeeklyMealPlan {
  weekStartDate: string;
  days: DailyMealPlan[];
  shoppingList: ShoppingListItem[];
  nutritionSummary: {
    daily: NutritionInfo;
    weekly: NutritionInfo;
  };
  adherenceScore?: number; // 0-100
}

export interface ShoppingListItem {
  ingredient: string;
  amount: number;
  unit: string;
  category: string; // 'protein', 'produce', 'dairy', etc.
  recipeIds: string[];
  optional?: boolean;
}

export interface MealPlanConstraints {
  maxPrepTime?: number; // minutes per day
  maxCookTime?: number; // minutes per day
  budgetPerDay?: number;
  varietyScore?: number; // 0-100, higher = more variety
  difficultyPreference?: 'easy' | 'medium' | 'hard' | 'mixed';
  cuisinePreferences?: string[];
  excludedIngredients?: string[];
  requiredIngredients?: string[];
  mealTimings?: { [K in MealType]?: string };
}

export interface MealPlanningOptions {
  targetNutrition: NutritionInfo;
  constraints?: MealPlanConstraints;
  mealDistribution?: { [K in MealType]?: number }; // Percentage of daily calories
  preferences?: {
    proteins?: string[];
    vegetables?: string[];
    grains?: string[];
    cookingMethods?: string[];
  };
  adaptations?: {
    leftoverUtilization?: boolean;
    batchCooking?: boolean;
    seasonalIngredients?: boolean;
  };
}

/**
 * Default meal distributions
 */
export const MEAL_DISTRIBUTIONS = {
  standard: {
    breakfast: 0.25,
    lunch: 0.35,
    dinner: 0.35,
    snack: 0.05,
  },
  athlete: {
    breakfast: 0.20,
    lunch: 0.25,
    dinner: 0.30,
    snack: 0.10,
    pre_workout: 0.10,
    post_workout: 0.05,
  },
  intermittent_fasting: {
    lunch: 0.40,
    dinner: 0.50,
    snack: 0.10,
  },
  frequent_meals: {
    breakfast: 0.20,
    lunch: 0.25,
    dinner: 0.25,
    snack: 0.30, // Distributed across multiple small meals
  },
};

/**
 * Meal Planner Class
 */
export class MealPlanner {
  private recipes: Map<string, Recipe> = new Map();
  private nutritionTolerance = 0.15; // 15% tolerance for nutrition matching

  constructor(recipes: Recipe[] = []) {
    recipes.forEach(recipe => this.addRecipe(recipe));
  }

  /**
   * Add recipe to the planner
   */
  addRecipe(recipe: Recipe): void {
    this.recipes.set(recipe.id, recipe);
  }

  /**
   * Remove recipe from the planner
   */
  removeRecipe(id: string): void {
    this.recipes.delete(id);
  }

  /**
   * Get all recipes
   */
  getRecipes(): Recipe[] {
    return Array.from(this.recipes.values());
  }

  /**
   * Find recipes by criteria
   */
  findRecipes(criteria: {
    mealType?: MealType;
    maxPrepTime?: number;
    maxCookTime?: number;
    difficulty?: 'easy' | 'medium' | 'hard';
    tags?: string[];
    excludeTags?: string[];
    calorieRange?: [number, number];
    proteinRange?: [number, number];
    cuisineType?: string;
  }): Recipe[] {
    return this.getRecipes().filter(recipe => {
      if (criteria.mealType && !recipe.mealTypes.includes(criteria.mealType)) {
        return false;
      }

      if (criteria.maxPrepTime && recipe.prepTime > criteria.maxPrepTime) {
        return false;
      }

      if (criteria.maxCookTime && recipe.cookTime > criteria.maxCookTime) {
        return false;
      }

      if (criteria.difficulty && recipe.difficulty !== criteria.difficulty) {
        return false;
      }

      if (criteria.tags && !criteria.tags.some(tag => recipe.tags.includes(tag))) {
        return false;
      }

      if (criteria.excludeTags && criteria.excludeTags.some(tag => recipe.tags.includes(tag))) {
        return false;
      }

      if (criteria.calorieRange) {
        const [min, max] = criteria.calorieRange;
        if (recipe.nutrition.calories < min || recipe.nutrition.calories > max) {
          return false;
        }
      }

      if (criteria.proteinRange) {
        const [min, max] = criteria.proteinRange;
        if (recipe.nutrition.protein < min || recipe.nutrition.protein > max) {
          return false;
        }
      }

      if (criteria.cuisineType && recipe.cuisineType !== criteria.cuisineType) {
        return false;
      }

      return true;
    });
  }

  /**
   * Create daily meal plan
   */
  createDailyMealPlan(
    date: string,
    options: MealPlanningOptions
  ): DailyMealPlan {
    const distribution = options.mealDistribution || MEAL_DISTRIBUTIONS.standard;
    const mealSlots = this.createMealSlots(options.targetNutrition, distribution);
    
    const dailyPlan: DailyMealPlan = {
      date,
      totalNutrition: { calories: 0, protein: 0, carbohydrates: 0, fat: 0, fiber: 0 },
      meals: {},
      hydrationTarget: 2.5, // Default 2.5L
    };

    // Fill each meal slot
    for (const slot of mealSlots) {
      const mealRecipes = this.selectRecipesForMeal(slot, options);
      if (mealRecipes.length > 0) {
        const mealNutrition = this.calculateMealNutrition(mealRecipes);
        dailyPlan.meals[slot.type] = {
          recipes: mealRecipes,
          totalNutrition: mealNutrition,
        };
        
        // Update total nutrition
        this.addNutrition(dailyPlan.totalNutrition, mealNutrition);
      }
    }

    return dailyPlan;
  }

  /**
   * Create weekly meal plan
   */
  createWeeklyMealPlan(
    weekStartDate: string,
    options: MealPlanningOptions
  ): WeeklyMealPlan {
    const days: DailyMealPlan[] = [];
    const startDate = new Date(weekStartDate);

    // Create daily plans for 7 days
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      const dateString = currentDate.toISOString().split('T')[0];
      
      const dailyPlan = this.createDailyMealPlan(dateString, options);
      days.push(dailyPlan);
    }

    // Calculate nutrition summary
    const weeklyNutrition = this.calculateWeeklyNutrition(days);
    const dailyAverage = this.calculateDailyAverage(weeklyNutrition);

    // Generate shopping list
    const shoppingList = this.generateShoppingList(days);

    return {
      weekStartDate,
      days,
      shoppingList,
      nutritionSummary: {
        daily: dailyAverage,
        weekly: weeklyNutrition,
      },
      adherenceScore: this.calculateAdherenceScore(days, options.targetNutrition),
    };
  }

  /**
   * Create meal slots based on distribution
   */
  private createMealSlots(
    targetNutrition: NutritionInfo,
    distribution: { [K in MealType]?: number }
  ): MealSlot[] {
    const slots: MealSlot[] = [];

    Object.entries(distribution).forEach(([mealType, percentage]) => {
      const targetCalories = Math.round(targetNutrition.calories * percentage);
      const targetMacros = {
        protein: Math.round(targetNutrition.protein * percentage),
        carbohydrates: Math.round(targetNutrition.carbohydrates * percentage),
        fat: Math.round(targetNutrition.fat * percentage),
        fiber: Math.round(targetNutrition.fiber * percentage),
      };

      slots.push({
        type: mealType as MealType,
        targetCalories,
        targetMacros,
      });
    });

    return slots;
  }

  /**
   * Select recipes for a meal slot
   */
  private selectRecipesForMeal(
    slot: MealSlot,
    options: MealPlanningOptions
  ): Recipe[] {
    const candidates = this.findRecipes({
      mealType: slot.type,
      maxPrepTime: options.constraints?.maxPrepTime,
      maxCookTime: options.constraints?.maxCookTime,
      difficulty: options.constraints?.difficultyPreference,
      calorieRange: [
        slot.targetCalories * (1 - this.nutritionTolerance),
        slot.targetCalories * (1 + this.nutritionTolerance),
      ],
    });

    if (candidates.length === 0) {
      return [];
    }

    // Score recipes based on how well they match the target
    const scoredRecipes = candidates.map(recipe => ({
      recipe,
      score: this.scoreRecipeForSlot(recipe, slot),
    }));

    // Sort by score and return the best match
    scoredRecipes.sort((a, b) => b.score - a.score);
    return [scoredRecipes[0].recipe];
  }

  /**
   * Score a recipe for how well it matches a meal slot
   */
  private scoreRecipeForSlot(recipe: Recipe, slot: MealSlot): number {
    let score = 0;

    // Calorie matching (40% of score)
    const calorieDeviation = Math.abs(recipe.nutrition.calories - slot.targetCalories) / slot.targetCalories;
    score += (1 - calorieDeviation) * 40;

    // Protein matching (20% of score)
    const proteinTarget = slot.targetMacros.protein || 0;
    const proteinDeviation = proteinTarget > 0 ? Math.abs(recipe.nutrition.protein - proteinTarget) / proteinTarget : 0;
    score += (1 - proteinDeviation) * 20;

    // Meal type suitability (30% of score)
    if (recipe.mealTypes.includes(slot.type)) {
      score += 30;
    }

    // Difficulty bonus (10% of score)
    if (recipe.difficulty === 'easy') {
      score += 10;
    } else if (recipe.difficulty === 'medium') {
      score += 5;
    }

    return Math.max(0, score);
  }

  /**
   * Calculate nutrition for a meal
   */
  private calculateMealNutrition(recipes: Recipe[]): NutritionInfo {
    return recipes.reduce(
      (total, recipe) => {
        this.addNutrition(total, recipe.nutrition);
        return total;
      },
      { calories: 0, protein: 0, carbohydrates: 0, fat: 0, fiber: 0 }
    );
  }

  /**
   * Add nutrition values
   */
  private addNutrition(target: NutritionInfo, source: NutritionInfo): void {
    target.calories += source.calories;
    target.protein += source.protein;
    target.carbohydrates += source.carbohydrates;
    target.fat += source.fat;
    target.fiber += source.fiber;
    if (source.sugar) target.sugar = (target.sugar || 0) + source.sugar;
    if (source.sodium) target.sodium = (target.sodium || 0) + source.sodium;
  }

  /**
   * Calculate weekly nutrition totals
   */
  private calculateWeeklyNutrition(days: DailyMealPlan[]): NutritionInfo {
    return days.reduce(
      (total, day) => {
        this.addNutrition(total, day.totalNutrition);
        return total;
      },
      { calories: 0, protein: 0, carbohydrates: 0, fat: 0, fiber: 0 }
    );
  }

  /**
   * Calculate daily average from weekly totals
   */
  private calculateDailyAverage(weeklyNutrition: NutritionInfo): NutritionInfo {
    return {
      calories: Math.round(weeklyNutrition.calories / 7),
      protein: Math.round(weeklyNutrition.protein / 7),
      carbohydrates: Math.round(weeklyNutrition.carbohydrates / 7),
      fat: Math.round(weeklyNutrition.fat / 7),
      fiber: Math.round(weeklyNutrition.fiber / 7),
    };
  }

  /**
   * Generate shopping list from meal plans
   */
  private generateShoppingList(days: DailyMealPlan[]): ShoppingListItem[] {
    const ingredientMap = new Map<string, { amount: number; unit: string; recipeIds: string[] }>();

    days.forEach(day => {
      Object.values(day.meals).forEach(meal => {
        meal?.recipes.forEach(recipe => {
          recipe.ingredients.forEach(ingredient => {
            const key = `${ingredient.name}-${ingredient.unit}`;
            const existing = ingredientMap.get(key);
            
            if (existing) {
              existing.amount += ingredient.amount;
              existing.recipeIds.push(recipe.id);
            } else {
              ingredientMap.set(key, {
                amount: ingredient.amount,
                unit: ingredient.unit,
                recipeIds: [recipe.id],
              });
            }
          });
        });
      });
    });

    return Array.from(ingredientMap.entries()).map(([key, data]) => ({
      ingredient: key.split('-')[0],
      amount: Math.round(data.amount * 10) / 10,
      unit: data.unit,
      category: this.categorizeIngredient(key.split('-')[0]),
      recipeIds: data.recipeIds,
    }));
  }

  /**
   * Categorize ingredients for shopping list
   */
  private categorizeIngredient(ingredient: string): string {
    // Simple categorization - can be enhanced with a proper mapping
    const meat = ['chicken', 'beef', 'pork', 'fish', 'turkey', 'lamb'];
    const produce = ['apple', 'banana', 'spinach', 'carrot', 'tomato', 'onion'];
    const dairy = ['milk', 'cheese', 'yogurt', 'butter', 'cream'];
    const grains = ['rice', 'bread', 'pasta', 'oats', 'quinoa'];
    
    const lowerIngredient = ingredient.toLowerCase();
    
    if (meat.some(m => lowerIngredient.includes(m))) return 'protein';
    if (produce.some(p => lowerIngredient.includes(p))) return 'produce';
    if (dairy.some(d => lowerIngredient.includes(d))) return 'dairy';
    if (grains.some(g => lowerIngredient.includes(g))) return 'grains';
    
    return 'other';
  }

  /**
   * Calculate adherence score
   */
  private calculateAdherenceScore(days: DailyMealPlan[], targetNutrition: NutritionInfo): number {
    const totalDays = days.length;
    let adherenceSum = 0;

    days.forEach(day => {
      const calorieDeviation = Math.abs(day.totalNutrition.calories - targetNutrition.calories) / targetNutrition.calories;
      const proteinDeviation = Math.abs(day.totalNutrition.protein - targetNutrition.protein) / targetNutrition.protein;
      const carbDeviation = Math.abs(day.totalNutrition.carbohydrates - targetNutrition.carbohydrates) / targetNutrition.carbohydrates;
      const fatDeviation = Math.abs(day.totalNutrition.fat - targetNutrition.fat) / targetNutrition.fat;

      const dayScore = Math.max(0, 100 - (calorieDeviation + proteinDeviation + carbDeviation + fatDeviation) * 25);
      adherenceSum += dayScore;
    });

    return Math.round(adherenceSum / totalDays);
  }
}

/**
 * Factory function
 */
export const createMealPlanner = (recipes: Recipe[] = []) => new MealPlanner(recipes);