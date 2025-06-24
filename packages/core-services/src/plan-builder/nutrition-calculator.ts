/**
 * Universal Nutrition Calculator
 * Extensible for different dietary approaches and calculation methods
 */

export interface PersonalMetrics {
  age: number;
  gender: 'male' | 'female' | 'other';
  weight: number; // in kg
  height: number; // in cm
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  bodyFatPercentage?: number; // optional, for more accurate calculations
}

export interface NutritionGoals {
  goalType: 'weight_loss' | 'weight_gain' | 'maintenance' | 'muscle_gain' | 'endurance';
  targetWeightChange?: number; // kg per week (positive for gain, negative for loss)
  dietaryApproach?: 'standard' | 'keto' | 'low_carb' | 'high_protein' | 'mediterranean' | 'vegan' | 'custom';
  restrictions?: string[]; // allergies, intolerances, etc.
  preferences?: string[]; // dietary preferences
}

export interface MacroTargets {
  calories: number;
  protein: number; // grams
  carbohydrates: number; // grams
  fat: number; // grams
  fiber: number; // grams
  sugar?: number; // grams
  sodium?: number; // mg
}

export interface MicroTargets {
  vitamins?: Record<string, number>;
  minerals?: Record<string, number>;
  [key: string]: any;
}

export interface NutritionTargets {
  macros: MacroTargets;
  micros?: MicroTargets;
  hydration: number; // liters per day
  timing?: {
    mealsPerDay: number;
    preworkout?: Partial<MacroTargets>;
    postworkout?: Partial<MacroTargets>;
  };
}

export interface CalculationMethod {
  name: string;
  formula: (metrics: PersonalMetrics) => number; // BMR calculation
  activityMultipliers: Record<PersonalMetrics['activityLevel'], number>;
}

/**
 * Calculation methods for BMR
 */
export const BMR_METHODS: Record<string, CalculationMethod> = {
  mifflinStJeor: {
    name: 'Mifflin-St Jeor',
    formula: (metrics) => {
      const { weight, height, age, gender } = metrics;
      const base = 10 * weight + 6.25 * height - 5 * age;
      return gender === 'male' ? base + 5 : base - 161;
    },
    activityMultipliers: {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9,
    },
  },
  harrisBenedict: {
    name: 'Harris-Benedict',
    formula: (metrics) => {
      const { weight, height, age, gender } = metrics;
      if (gender === 'male') {
        return 88.362 + 13.397 * weight + 4.799 * height - 5.677 * age;
      } else {
        return 447.593 + 9.247 * weight + 3.098 * height - 4.330 * age;
      }
    },
    activityMultipliers: {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9,
    },
  },
  katchMcArdle: {
    name: 'Katch-McArdle',
    formula: (metrics) => {
      if (!metrics.bodyFatPercentage) {
        throw new Error('Body fat percentage required for Katch-McArdle formula');
      }
      const leanBodyMass = metrics.weight * (1 - metrics.bodyFatPercentage / 100);
      return 370 + 21.6 * leanBodyMass;
    },
    activityMultipliers: {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9,
    },
  },
};

/**
 * Macro distribution presets
 */
export const MACRO_PRESETS: Record<string, { protein: number; carbs: number; fat: number }> = {
  standard: { protein: 0.25, carbs: 0.45, fat: 0.30 },
  high_protein: { protein: 0.35, carbs: 0.35, fat: 0.30 },
  low_carb: { protein: 0.30, carbs: 0.20, fat: 0.50 },
  keto: { protein: 0.25, carbs: 0.05, fat: 0.70 },
  mediterranean: { protein: 0.20, carbs: 0.45, fat: 0.35 },
  endurance: { protein: 0.15, carbs: 0.60, fat: 0.25 },
};

/**
 * Main Nutrition Calculator Class
 */
export class NutritionCalculator {
  private method: CalculationMethod;

  constructor(method: keyof typeof BMR_METHODS = 'mifflinStJeor') {
    this.method = BMR_METHODS[method];
    if (!this.method) {
      throw new Error(`Unknown calculation method: ${method}`);
    }
  }

  /**
   * Calculate Basal Metabolic Rate (BMR)
   */
  calculateBMR(metrics: PersonalMetrics): number {
    return Math.round(this.method.formula(metrics));
  }

  /**
   * Calculate Total Daily Energy Expenditure (TDEE)
   */
  calculateTDEE(metrics: PersonalMetrics): number {
    const bmr = this.calculateBMR(metrics);
    const multiplier = this.method.activityMultipliers[metrics.activityLevel];
    return Math.round(bmr * multiplier);
  }

  /**
   * Calculate target calories based on goals
   */
  calculateTargetCalories(metrics: PersonalMetrics, goals: NutritionGoals): number {
    const tdee = this.calculateTDEE(metrics);
    const { goalType, targetWeightChange = 0 } = goals;

    let adjustment = 0;

    switch (goalType) {
      case 'weight_loss':
        // 1 kg fat = ~7700 calories, so per week: kg * 7700 / 7 days
        adjustment = -(Math.abs(targetWeightChange) * 7700) / 7;
        break;
      case 'weight_gain':
        adjustment = (Math.abs(targetWeightChange) * 7700) / 7;
        break;
      case 'muscle_gain':
        adjustment = 200; // Conservative surplus for lean gains
        break;
      case 'maintenance':
      default:
        adjustment = 0;
        break;
    }

    return Math.round(tdee + adjustment);
  }

  /**
   * Calculate macro targets
   */
  calculateMacroTargets(
    metrics: PersonalMetrics,
    goals: NutritionGoals,
    customDistribution?: { protein: number; carbs: number; fat: number }
  ): MacroTargets {
    const targetCalories = this.calculateTargetCalories(metrics, goals);
    const distribution = customDistribution || 
      MACRO_PRESETS[goals.dietaryApproach || 'standard'] || 
      MACRO_PRESETS.standard;

    const proteinCalories = targetCalories * distribution.protein;
    const carbCalories = targetCalories * distribution.carbs;
    const fatCalories = targetCalories * distribution.fat;

    const protein = Math.round(proteinCalories / 4); // 4 cal/g
    const carbohydrates = Math.round(carbCalories / 4); // 4 cal/g
    const fat = Math.round(fatCalories / 9); // 9 cal/g

    // Calculate fiber based on total calories (14g per 1000 calories is recommended)
    const fiber = Math.round((targetCalories / 1000) * 14);

    return {
      calories: targetCalories,
      protein,
      carbohydrates,
      fat,
      fiber,
      sugar: Math.round(targetCalories * 0.1 / 4), // Max 10% of calories from added sugar
      sodium: 2300, // mg, general recommendation
    };
  }

  /**
   * Calculate complete nutrition targets
   */
  calculateNutritionTargets(
    metrics: PersonalMetrics,
    goals: NutritionGoals,
    customDistribution?: { protein: number; carbs: number; fat: number }
  ): NutritionTargets {
    const macros = this.calculateMacroTargets(metrics, goals, customDistribution);
    
    // Basic hydration calculation: 35ml per kg body weight
    const hydration = Math.round((metrics.weight * 35) / 1000 * 10) / 10; // Round to 1 decimal

    return {
      macros,
      hydration,
      timing: {
        mealsPerDay: 3,
        preworkout: {
          carbohydrates: Math.round(macros.carbohydrates * 0.15),
          protein: Math.round(macros.protein * 0.1),
        },
        postworkout: {
          protein: Math.round(macros.protein * 0.25),
          carbohydrates: Math.round(macros.carbohydrates * 0.2),
        },
      },
    };
  }

  /**
   * Validate metrics
   */
  validateMetrics(metrics: PersonalMetrics): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (metrics.age < 13 || metrics.age > 120) {
      errors.push('Age must be between 13 and 120 years');
    }

    if (metrics.weight < 20 || metrics.weight > 500) {
      errors.push('Weight must be between 20 and 500 kg');
    }

    if (metrics.height < 100 || metrics.height > 250) {
      errors.push('Height must be between 100 and 250 cm');
    }

    if (metrics.bodyFatPercentage !== undefined) {
      if (metrics.bodyFatPercentage < 3 || metrics.bodyFatPercentage > 50) {
        errors.push('Body fat percentage must be between 3% and 50%');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get method information
   */
  getMethodInfo(): { name: string; requiresBodyFat: boolean } {
    return {
      name: this.method.name,
      requiresBodyFat: this.method.name === 'Katch-McArdle',
    };
  }
}

/**
 * Factory functions for different calculation approaches
 */
export const createNutritionCalculator = (method?: keyof typeof BMR_METHODS) =>
  new NutritionCalculator(method);

export const createPrecisionCalculator = () => new NutritionCalculator('katchMcArdle');
export const createStandardCalculator = () => new NutritionCalculator('mifflinStJeor');

/**
 * Quick calculation utilities
 */
export const quickCalculations = {
  bmi: (weight: number, height: number) => 
    Math.round((weight / Math.pow(height / 100, 2)) * 10) / 10,
  
  bodyFatFromBMI: (bmi: number, age: number, gender: 'male' | 'female') => {
    // Approximate body fat from BMI (Deurenberg formula)
    const genderFactor = gender === 'male' ? 1 : 0;
    return Math.round((1.2 * bmi + 0.23 * age - 5.4 - 10.8 * genderFactor) * 10) / 10;
  },
  
  idealWeight: (height: number, gender: 'male' | 'female') => {
    // Robinson formula
    const baseHeight = 152.4; // 5 feet in cm
    const heightDiff = height - baseHeight;
    const baseWeight = gender === 'male' ? 52 : 49;
    const perCm = gender === 'male' ? 1.9 : 1.7;
    return Math.round(baseWeight + (heightDiff * perCm / 2.54));
  },
};