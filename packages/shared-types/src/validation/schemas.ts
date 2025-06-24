/**
 * Zod validation schemas for all types
 */

import { z } from 'zod';

/**
 * Common validation schemas
 */
export const BaseEntitySchema = z.object({
  id: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const TimestampedEntitySchema = z.object({
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const PaginationQuerySchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).optional(),
});

export const SearchQuerySchema = z.object({
  q: z.string().optional(),
  filters: z.record(z.any()).optional(),
  sort: z.array(z.object({
    field: z.string(),
    direction: z.enum(['asc', 'desc']),
  })).optional(),
});

export const DateRangeSchema = z.object({
  from: z.string().datetime(),
  to: z.string().datetime(),
});

export const NumericRangeSchema = z.object({
  min: z.number().optional(),
  max: z.number().optional(),
});

export const AddressSchema = z.object({
  street1: z.string().min(1),
  street2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().optional(),
  postalCode: z.string().min(1),
  country: z.string().min(2).max(2),
  formatted: z.string().optional(),
});

export const ContactInfoSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
  website: z.string().url().optional(),
  socialMedia: z.record(z.string()).optional(),
});

export const FileInfoSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  originalName: z.string().min(1),
  mimeType: z.string().min(1),
  size: z.number().int().min(0),
  url: z.string().url(),
  thumbnailUrl: z.string().url().optional(),
  alt: z.string().optional(),
  description: z.string().optional(),
  uploadedAt: z.string().datetime(),
  uploadedBy: z.string().uuid().optional(),
});

export const ImageInfoSchema = FileInfoSchema.extend({
  dimensions: z.object({
    width: z.number().int().min(1),
    height: z.number().int().min(1),
  }),
  variants: z.object({
    thumbnail: z.string().url().optional(),
    small: z.string().url().optional(),
    medium: z.string().url().optional(),
    large: z.string().url().optional(),
  }).optional(),
});

/**
 * User validation schemas
 */
export const AuthCredentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  rememberMe: z.boolean().optional(),
});

export const SignupDataSchema = AuthCredentialsSchema.extend({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_-]+$/).optional(),
  dateOfBirth: z.string().date().optional(),
  termsAccepted: z.boolean().refine(val => val === true, {
    message: "Terms must be accepted",
  }),
  privacyPolicyAccepted: z.boolean().refine(val => val === true, {
    message: "Privacy policy must be accepted",
  }),
  marketingOptIn: z.boolean().optional(),
});

export const UserPreferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'auto']),
  language: z.string().min(2).max(5),
  timezone: z.string(),
  dateFormat: z.string(),
  timeFormat: z.enum(['12h', '24h']),
  currency: z.string().length(3),
  units: z.enum(['metric', 'imperial']),
  dashboard: z.object({
    defaultView: z.enum(['overview', 'nutrition', 'goals', 'progress']),
    chartTypes: z.array(z.string()),
    showTips: z.boolean(),
    compactMode: z.boolean(),
  }),
  nutrition: z.object({
    defaultServingUnit: z.enum(['metric', 'imperial']),
    showCalories: z.boolean(),
    showMacros: z.boolean(),
    showMicros: z.boolean(),
    trackWater: z.boolean(),
    trackSupplements: z.boolean(),
    mealReminders: z.boolean(),
    nutritionLabels: z.enum(['simple', 'detailed']),
  }),
  recipes: z.object({
    difficulty: z.enum(['any', 'easy', 'medium', 'hard']),
    maxPrepTime: z.number().int().min(1).optional(),
    preferredCuisines: z.array(z.string()),
    hideAllergens: z.boolean(),
    showNutritionInfo: z.boolean(),
  }),
  social: z.object({
    shareProgress: z.boolean(),
    allowMessages: z.boolean(),
    showActivity: z.boolean(),
    friendRequests: z.enum(['anyone', 'friends_of_friends', 'none']),
  }),
  data: z.object({
    exportFormat: z.enum(['json', 'csv', 'pdf']),
    backupFrequency: z.enum(['weekly', 'monthly', 'never']),
    dataRetention: z.number().int().min(1),
  }),
});

export const NotificationPreferencesSchema = z.object({
  email: z.object({
    enabled: z.boolean(),
    frequency: z.enum(['immediate', 'daily', 'weekly', 'never']),
    quietHours: z.object({
      enabled: z.boolean(),
      start: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
      end: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
    }).optional(),
    marketing: z.boolean(),
    productUpdates: z.boolean(),
    security: z.boolean(),
  }),
  push: z.object({
    enabled: z.boolean(),
    frequency: z.enum(['immediate', 'daily', 'weekly', 'never']),
    quietHours: z.object({
      enabled: z.boolean(),
      start: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
      end: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
    }).optional(),
    sound: z.boolean(),
    vibration: z.boolean(),
  }),
  sms: z.object({
    enabled: z.boolean(),
    frequency: z.enum(['immediate', 'daily', 'weekly', 'never']),
    quietHours: z.object({
      enabled: z.boolean(),
      start: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
      end: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
    }).optional(),
    urgentOnly: z.boolean(),
  }),
  inApp: z.object({
    enabled: z.boolean(),
    frequency: z.enum(['immediate', 'daily', 'weekly', 'never']),
    quietHours: z.object({
      enabled: z.boolean(),
      start: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
      end: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
    }).optional(),
  }),
});

export const PrivacyPreferencesSchema = z.object({
  profileVisibility: z.enum(['public', 'friends', 'private']),
  searchable: z.boolean(),
  showActivity: z.boolean(),
  showStats: z.boolean(),
  dataSharing: z.boolean(),
  analyticsOptOut: z.boolean(),
  marketingOptOut: z.boolean(),
});

/**
 * Nutrition validation schemas
 */
export const NutritionInfoSchema = z.object({
  calories: z.number().min(0),
  protein: z.number().min(0),
  carbohydrates: z.number().min(0),
  fat: z.number().min(0),
  fiber: z.number().min(0),
  sugar: z.number().min(0).optional(),
  sodium: z.number().min(0).optional(),
  cholesterol: z.number().min(0).optional(),
  saturatedFat: z.number().min(0).optional(),
  transFat: z.number().min(0).optional(),
  unsaturatedFat: z.number().min(0).optional(),
  potassium: z.number().min(0).optional(),
  calcium: z.number().min(0).optional(),
  iron: z.number().min(0).optional(),
  vitaminA: z.number().min(0).optional(),
  vitaminC: z.number().min(0).optional(),
  vitaminD: z.number().min(0).optional(),
  vitaminE: z.number().min(0).optional(),
  vitaminK: z.number().min(0).optional(),
  thiamine: z.number().min(0).optional(),
  riboflavin: z.number().min(0).optional(),
  niacin: z.number().min(0).optional(),
  vitaminB6: z.number().min(0).optional(),
  folate: z.number().min(0).optional(),
  vitaminB12: z.number().min(0).optional(),
  biotin: z.number().min(0).optional(),
  pantothenicAcid: z.number().min(0).optional(),
  phosphorus: z.number().min(0).optional(),
  magnesium: z.number().min(0).optional(),
  zinc: z.number().min(0).optional(),
  selenium: z.number().min(0).optional(),
  copper: z.number().min(0).optional(),
  manganese: z.number().min(0).optional(),
  chromium: z.number().min(0).optional(),
  molybdenum: z.number().min(0).optional(),
  iodine: z.number().min(0).optional(),
});

export const PersonalMetricsSchema = z.object({
  age: z.number().int().min(13).max(120),
  gender: z.enum(['male', 'female', 'other']),
  weight: z.number().min(20).max(500),
  height: z.number().min(100).max(250),
  activityLevel: z.enum(['sedentary', 'light', 'moderate', 'active', 'very_active']),
  bodyFatPercentage: z.number().min(3).max(50).optional(),
  muscleMassPercentage: z.number().min(20).max(70).optional(),
  metabolicRate: z.number().min(800).max(5000).optional(),
});

export const NutritionGoalsSchema = z.object({
  goalType: z.enum(['weight_loss', 'weight_gain', 'maintenance', 'muscle_gain', 'fat_loss', 'endurance', 'strength', 'health']),
  targetWeight: z.number().min(20).max(500).optional(),
  targetWeightChange: z.number().min(-2).max(2).optional(),
  targetDate: z.string().date().optional(),
  targetBodyFat: z.number().min(3).max(50).optional(),
  activityLevel: z.enum(['sedentary', 'light', 'moderate', 'active', 'very_active']),
  dietaryApproach: z.enum(['standard', 'keto', 'low_carb', 'high_protein', 'mediterranean', 'paleo', 'vegan', 'vegetarian', 'intermittent_fasting', 'custom']).optional(),
  calorieCycling: z.boolean().optional(),
  restrictions: z.array(z.string()),
  allergies: z.array(z.string()),
  preferences: z.array(z.string()),
});

export const MacroTargetsSchema = z.object({
  calories: z.number().min(800).max(5000),
  protein: z.number().min(20).max(300),
  carbohydrates: z.number().min(20).max(600),
  fat: z.number().min(20).max(200),
  fiber: z.number().min(10).max(100),
  distribution: z.object({
    protein: z.number().min(0.1).max(0.5),
    carbohydrates: z.number().min(0.1).max(0.7),
    fat: z.number().min(0.15).max(0.7),
  }).refine(data => {
    const total = data.protein + data.carbohydrates + data.fat;
    return Math.abs(total - 1) < 0.01;
  }, {
    message: "Macro distribution must sum to 1 (100%)",
  }),
});

export const RecipeIngredientSchema = z.object({
  id: z.string().uuid(),
  foodId: z.string().uuid(),
  name: z.string().min(1),
  amount: z.number().min(0),
  unit: z.string().min(1),
  preparation: z.string().optional(),
  optional: z.boolean(),
  alternatives: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

export const RecipeInstructionSchema = z.object({
  step: z.number().int().min(1),
  instruction: z.string().min(1),
  duration: z.number().int().min(0).optional(),
  temperature: z.number().int().min(0).max(300).optional(),
  equipment: z.array(z.string()).optional(),
  tips: z.string().optional(),
  images: z.array(ImageInfoSchema).optional(),
});

export const RecipeSchema = BaseEntitySchema.extend({
  name: z.string().min(1).max(200),
  description: z.string().min(1),
  summary: z.string().max(500).optional(),
  author: z.string().min(1),
  servings: z.number().int().min(1).max(20),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  prepTime: z.number().int().min(0).max(300),
  cookTime: z.number().int().min(0).max(600),
  totalTime: z.number().int().min(0).max(900),
  cuisine: z.string().min(1),
  mealTypes: z.array(z.enum(['breakfast', 'lunch', 'dinner', 'snack', 'pre_workout', 'post_workout', 'morning_snack', 'afternoon_snack', 'evening_snack'])),
  dietaryTags: z.array(z.string()),
  ingredients: z.array(RecipeIngredientSchema).min(1),
  instructions: z.array(RecipeInstructionSchema).min(1),
  nutrition: NutritionInfoSchema,
  images: z.array(ImageInfoSchema),
  rating: z.number().min(0).max(5).optional(),
  reviewCount: z.number().int().min(0).optional(),
  featured: z.boolean(),
  verified: z.boolean(),
  tags: z.array(z.string()),
  categories: z.array(z.string()),
});

/**
 * API validation schemas
 */
export const ApiResponseSchema = <T extends z.ZodType>(dataSchema: T) => z.object({
  success: z.boolean(),
  data: dataSchema.optional(),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.any()).optional(),
    field: z.string().optional(),
    timestamp: z.string().datetime(),
    traceId: z.string().optional(),
    validationErrors: z.array(z.object({
      field: z.string(),
      code: z.string(),
      message: z.string(),
      value: z.any().optional(),
    })).optional(),
  }).optional(),
  meta: z.object({
    requestId: z.string(),
    timestamp: z.string().datetime(),
    version: z.string(),
    pagination: z.object({
      page: z.number().int().min(1),
      limit: z.number().int().min(1).max(100),
      total: z.number().int().min(0),
      totalPages: z.number().int().min(0),
      hasNext: z.boolean(),
      hasPrevious: z.boolean(),
    }).optional(),
    filters: z.record(z.any()).optional(),
    sort: z.array(z.object({
      field: z.string(),
      direction: z.enum(['asc', 'desc']),
    })).optional(),
    cache: z.object({
      cached: z.boolean(),
      cacheKey: z.string().optional(),
      ttl: z.number().optional(),
      createdAt: z.string().datetime().optional(),
    }).optional(),
  }).optional(),
});

export const ApiQueryParamsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).optional(),
  q: z.string().optional(),
  search: z.string().optional(),
  sort: z.string().optional(),
  sortBy: z.string().optional(),
  sortDir: z.enum(['asc', 'desc']).optional(),
  orderBy: z.string().optional(),
  filter: z.string().optional(),
  filters: z.record(z.any()).optional(),
  fields: z.string().optional(),
  include: z.string().optional(),
  exclude: z.string().optional(),
  cache: z.coerce.boolean().optional(),
  refresh: z.coerce.boolean().optional(),
  format: z.enum(['json', 'csv', 'xml']).optional(),
  locale: z.string().optional(),
  timezone: z.string().optional(),
});

/**
 * Schema validation utilities
 */
export const createPaginatedResponseSchema = <T extends z.ZodType>(itemSchema: T) =>
  z.object({
    data: z.array(itemSchema),
    meta: z.object({
      pagination: z.object({
        page: z.number().int().min(1),
        limit: z.number().int().min(1).max(100),
        total: z.number().int().min(0),
        totalPages: z.number().int().min(0),
        hasNext: z.boolean(),
        hasPrevious: z.boolean(),
      }),
    }),
  });

export const createFilterSchema = <T extends z.ZodType>(baseSchema: T) =>
  baseSchema.partial().extend({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    sort: z.string().optional(),
    search: z.string().optional(),
  });

/**
 * Validation helper functions
 */
export const validateEmail = (email: string): boolean => {
  return z.string().email().safeParse(email).success;
};

export const validatePassword = (password: string): boolean => {
  return z.string().min(8).max(128).safeParse(password).success;
};

export const validateUuid = (uuid: string): boolean => {
  return z.string().uuid().safeParse(uuid).success;
};

export const validateUrl = (url: string): boolean => {
  return z.string().url().safeParse(url).success;
};

export const validatePhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phone);
};

export const validatePostalCode = (postalCode: string, country: string): boolean => {
  const patterns: Record<string, RegExp> = {
    US: /^\d{5}(-\d{4})?$/,
    CA: /^[A-Za-z]\d[A-Za-z] \d[A-Za-z]\d$/,
    UK: /^[A-Z]{1,2}\d[A-Z\d]? \d[A-Z]{2}$/,
    FR: /^\d{5}$/,
    DE: /^\d{5}$/,
    // Add more patterns as needed
  };
  
  const pattern = patterns[country.toUpperCase()];
  return pattern ? pattern.test(postalCode) : true; // Default to true for unknown countries
};