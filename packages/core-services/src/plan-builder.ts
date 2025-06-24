import { z } from 'zod';
import type { 
  NutritionGoals, 
  MealPlan, 
  Recipe, 
  UserProfile,
  MacronutrientProfile
} from '@nutricoach/shared-types';
import { calculateMacros, formatNutrition } from '@nutricoach/utils';

// Schémas de validation
const PlanConstraintsSchema = z.object({
  calories: z.object({
    min: z.number().positive(),
    max: z.number().positive(),
    target: z.number().positive(),
  }),
  macros: z.object({
    protein: z.number().min(0).max(100), // % des calories
    carbs: z.number().min(0).max(100),
    fat: z.number().min(0).max(100),
  }),
  restrictions: z.array(z.string()).default([]),
  preferences: z.array(z.string()).default([]),
  antiInflammatory: z.boolean().default(true),
});

type PlanConstraints = z.infer<typeof PlanConstraintsSchema>;

// Types pour la génération de plans
interface MealPlanOptions {
  duration: number; // jours
  mealsPerDay: number;
  includeSnacks: boolean;
  budget?: {
    min: number;
    max: number;
  };
  difficulty?: 'easy' | 'medium' | 'hard';
}

interface NutritionCalculation {
  totalCalories: number;
  macros: MacronutrientProfile;
  micronutrients: Record<string, number>;
  antiInflammatoryScore: number;
  diversityScore: number;
}

// Service principal de génération de plans
export class PlanBuilderService {
  private recipes: Recipe[] = [];
  private userProfiles: Map<string, UserProfile> = new Map();

  constructor() {
    // Initialisation avec des recettes par défaut
    this.loadDefaultRecipes();
  }

  // Générer un plan alimentaire personnalisé
  async generateMealPlan(
    userId: string,
    options: MealPlanOptions,
    constraints?: Partial<PlanConstraints>
  ): Promise<MealPlan> {
    const userProfile = this.getUserProfile(userId);
    const finalConstraints = this.buildConstraints(userProfile, constraints);
    
    console.log(`🍽️ Génération plan pour ${userId}:`, { options, constraints: finalConstraints });

    // Sélectionner les recettes appropriées
    const suitableRecipes = this.filterRecipesByConstraints(finalConstraints);
    
    // Générer les repas pour chaque jour
    const days = [];
    for (let day = 1; day <= options.duration; day++) {
      const dayMeals = await this.generateDayMeals(
        suitableRecipes,
        options.mealsPerDay,
        finalConstraints,
        options.includeSnacks
      );
      
      days.push({
        day,
        meals: dayMeals,
        nutrition: this.calculateDayNutrition(dayMeals),
      });
    }

    // Calculer la nutrition totale du plan
    const totalNutrition = this.calculatePlanNutrition(days);
    
    // Optimiser le plan (réorganiser si nécessaire)
    const optimizedDays = this.optimizePlan(days, finalConstraints);

    return {
      id: `plan_${userId}_${Date.now()}`,
      userId,
      title: `Plan nutritionnel ${options.duration} jours`,
      description: this.generatePlanDescription(finalConstraints, totalNutrition),
      duration: options.duration,
      days: optimizedDays,
      nutrition: totalNutrition,
      constraints: finalConstraints,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  // Construire les contraintes à partir du profil utilisateur
  private buildConstraints(
    userProfile: UserProfile,
    customConstraints?: Partial<PlanConstraints>
  ): PlanConstraints {
    const baseConstraints: PlanConstraints = {
      calories: {
        min: userProfile.nutritionGoals.calories * 0.9,
        max: userProfile.nutritionGoals.calories * 1.1,
        target: userProfile.nutritionGoals.calories,
      },
      macros: {
        protein: userProfile.nutritionGoals.macros.protein,
        carbs: userProfile.nutritionGoals.macros.carbs,
        fat: userProfile.nutritionGoals.macros.fat,
      },
      restrictions: userProfile.restrictions || [],
      preferences: userProfile.preferences || [],
      antiInflammatory: true,
    };

    return PlanConstraintsSchema.parse({ ...baseConstraints, ...customConstraints });
  }

  // Filtrer les recettes selon les contraintes
  private filterRecipesByConstraints(constraints: PlanConstraints): Recipe[] {
    return this.recipes.filter(recipe => {
      // Vérifier les restrictions alimentaires
      const hasRestrictions = constraints.restrictions.some(restriction =>
        recipe.tags.includes(restriction)
      );
      if (hasRestrictions) return false;

      // Vérifier les préférences
      const matchesPreferences = constraints.preferences.length === 0 ||
        constraints.preferences.some(pref => recipe.tags.includes(pref));
      if (!matchesPreferences) return false;

      // Vérifier le score anti-inflammatoire
      if (constraints.antiInflammatory && recipe.antiInflammatoryScore < 7) {
        return false;
      }

      return true;
    });
  }

  // Générer les repas pour une journée
  private async generateDayMeals(
    availableRecipes: Recipe[],
    mealsPerDay: number,
    constraints: PlanConstraints,
    includeSnacks: boolean
  ): Promise<Array<{ type: string; recipe: Recipe; portion: number }>> {
    const mealTypes = ['breakfast', 'lunch', 'dinner'];
    if (mealsPerDay > 3) mealTypes.push('snack');
    if (includeSnacks) mealTypes.push('snack-morning', 'snack-afternoon');

    const dayMeals = [];
    const caloriesPerMeal = constraints.calories.target / mealTypes.length;

    for (const mealType of mealTypes.slice(0, mealsPerDay)) {
      // Filtrer par type de repas
      const mealRecipes = availableRecipes.filter(recipe => 
        recipe.mealTypes.includes(mealType) || recipe.mealTypes.includes('any')
      );

      if (mealRecipes.length === 0) continue;

      // Sélectionner une recette aléatoirement (avec pondération)
      const selectedRecipe = this.selectWeightedRecipe(mealRecipes);
      
      // Calculer la portion pour atteindre les calories cibles
      const targetCalories = mealType.includes('snack') ? caloriesPerMeal * 0.5 : caloriesPerMeal;
      const portion = Math.max(0.5, targetCalories / selectedRecipe.nutrition.calories);

      dayMeals.push({
        type: mealType,
        recipe: selectedRecipe,
        portion: Math.round(portion * 10) / 10, // Arrondir à 1 décimale
      });
    }

    return dayMeals;
  }

  // Sélection pondérée des recettes (favorise les mieux notées)
  private selectWeightedRecipe(recipes: Recipe[]): Recipe {
    const weights = recipes.map(recipe => {
      let weight = recipe.rating || 3;
      weight += recipe.antiInflammatoryScore / 2;
      weight += recipe.popularityScore || 1;
      return weight;
    });

    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    const randomValue = Math.random() * totalWeight;

    let currentWeight = 0;
    for (let i = 0; i < recipes.length; i++) {
      currentWeight += weights[i];
      if (randomValue <= currentWeight) {
        return recipes[i];
      }
    }

    return recipes[recipes.length - 1]; // Fallback
  }

  // Calculer la nutrition d'une journée
  private calculateDayNutrition(meals: Array<{ recipe: Recipe; portion: number }>): NutritionCalculation {
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    let antiInflammatoryScore = 0;
    const micronutrients: Record<string, number> = {};

    meals.forEach(({ recipe, portion }) => {
      const nutrition = recipe.nutrition;
      totalCalories += nutrition.calories * portion;
      totalProtein += nutrition.protein * portion;
      totalCarbs += nutrition.carbs * portion;
      totalFat += nutrition.fat * portion;
      antiInflammatoryScore += recipe.antiInflammatoryScore * portion;

      // Micronutriments
      Object.entries(recipe.micronutrients || {}).forEach(([key, value]) => {
        micronutrients[key] = (micronutrients[key] || 0) + value * portion;
      });
    });

    return {
      totalCalories: Math.round(totalCalories),
      macros: {
        protein: Math.round(totalProtein),
        carbs: Math.round(totalCarbs),
        fat: Math.round(totalFat),
      },
      micronutrients,
      antiInflammatoryScore: Math.round(antiInflammatoryScore / meals.length),
      diversityScore: this.calculateDiversityScore(meals.map(m => m.recipe)),
    };
  }

  // Calculer la nutrition totale du plan
  private calculatePlanNutrition(days: any[]): NutritionCalculation {
    const totalDays = days.length;
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    let avgAntiInflammatory = 0;
    let avgDiversity = 0;
    const micronutrients: Record<string, number> = {};

    days.forEach(day => {
      const nutrition = day.nutrition;
      totalCalories += nutrition.totalCalories;
      totalProtein += nutrition.macros.protein;
      totalCarbs += nutrition.macros.carbs;
      totalFat += nutrition.macros.fat;
      avgAntiInflammatory += nutrition.antiInflammatoryScore;
      avgDiversity += nutrition.diversityScore;

      Object.entries(nutrition.micronutrients).forEach(([key, value]) => {
        micronutrients[key] = (micronutrients[key] || 0) + value;
      });
    });

    return {
      totalCalories: Math.round(totalCalories / totalDays),
      macros: {
        protein: Math.round(totalProtein / totalDays),
        carbs: Math.round(totalCarbs / totalDays),
        fat: Math.round(totalFat / totalDays),
      },
      micronutrients: Object.fromEntries(
        Object.entries(micronutrients).map(([key, value]) => [key, Math.round(value / totalDays)])
      ),
      antiInflammatoryScore: Math.round(avgAntiInflammatory / totalDays),
      diversityScore: Math.round(avgDiversity / totalDays),
    };
  }

  // Optimiser le plan (réorganiser si nécessaire)
  private optimizePlan(days: any[], constraints: PlanConstraints): any[] {
    // Vérifier si le plan respecte les contraintes
    days.forEach(day => {
      const nutrition = day.nutrition;
      
      // Si les calories sont trop éloignées de la cible, ajuster
      if (nutrition.totalCalories < constraints.calories.min || 
          nutrition.totalCalories > constraints.calories.max) {
        console.warn(`⚠️ Jour ${day.day}: Calories ${nutrition.totalCalories} hors cible`);
        // TODO: Réajuster les portions ou recettes
      }
    });

    return days;
  }

  // Calculer le score de diversité
  private calculateDiversityScore(recipes: Recipe[]): number {
    const uniqueIngredients = new Set();
    const uniqueCuisines = new Set();
    
    recipes.forEach(recipe => {
      recipe.ingredients.forEach(ing => uniqueIngredients.add(ing.name));
      if (recipe.cuisine) uniqueCuisines.add(recipe.cuisine);
    });

    return Math.min(10, uniqueIngredients.size + uniqueCuisines.size * 2);
  }

  // Générer une description du plan
  private generatePlanDescription(constraints: PlanConstraints, nutrition: NutritionCalculation): string {
    const features = [];
    
    if (constraints.antiInflammatory) features.push('anti-inflammatoire');
    if (constraints.restrictions.length > 0) features.push(`sans ${constraints.restrictions.join(', ')}`);
    if (constraints.preferences.length > 0) features.push(constraints.preferences.join(', '));
    
    return `Plan nutritionnel ${features.join(', ')} - ${nutrition.totalCalories} cal/jour`;
  }

  // Helpers pour la gestion des données
  private getUserProfile(userId: string): UserProfile {
    return this.userProfiles.get(userId) || this.getDefaultProfile();
  }

  private getDefaultProfile(): UserProfile {
    return {
      id: 'default',
      nutritionGoals: {
        calories: 2000,
        macros: { protein: 25, carbs: 45, fat: 30 },
      },
      restrictions: [],
      preferences: [],
    } as UserProfile;
  }

  private loadDefaultRecipes(): void {
    // Charger les recettes par défaut
    // TODO: Intégrer avec la base de données
    console.log('📚 Chargement des recettes par défaut...');
  }

  // API publique pour la gestion des recettes
  async loadRecipes(recipes: Recipe[]): Promise<void> {
    this.recipes = recipes;
    console.log(`📚 ${recipes.length} recettes chargées`);
  }

  async addUserProfile(profile: UserProfile): Promise<void> {
    this.userProfiles.set(profile.id, profile);
    console.log(`👤 Profil utilisateur ${profile.id} ajouté`);
  }
}

// Instance globale
export const planBuilder = new PlanBuilderService();

// Helper functions
export function validatePlanConstraints(constraints: unknown): PlanConstraints {
  return PlanConstraintsSchema.parse(constraints);
}

export function calculateMealCalories(
  recipe: Recipe, 
  portion: number
): number {
  return Math.round(recipe.nutrition.calories * portion);
}

export function adjustPortionForCalories(
  recipe: Recipe,
  targetCalories: number
): number {
  const basePortion = targetCalories / recipe.nutrition.calories;
  return Math.max(0.25, Math.min(3, Math.round(basePortion * 4) / 4)); // Portions par quart
}

// Types d'export
export type { 
  PlanConstraints, 
  MealPlanOptions, 
  NutritionCalculation 
};