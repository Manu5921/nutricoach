/**
 * Universal User Profile Service
 * Extensible user management for various application types
 */

export interface BaseUserProfile {
  id: string;
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  dateOfBirth?: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  lastLoginAt?: string;
  preferences: UserPreferences;
  metadata: Record<string, any>;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
  notifications: NotificationPreferences;
  privacy: PrivacyPreferences;
  [key: string]: any; // Extended preferences for specific domains
}

export interface NotificationPreferences {
  email: {
    marketing: boolean;
    productUpdates: boolean;
    reminders: boolean;
    reports: boolean;
  };
  push: {
    enabled: boolean;
    reminders: boolean;
    achievements: boolean;
    social: boolean;
  };
  inApp: {
    enabled: boolean;
    popups: boolean;
    banners: boolean;
  };
}

export interface PrivacyPreferences {
  profileVisibility: 'public' | 'friends' | 'private';
  dataSharing: boolean;
  analyticsOptOut: boolean;
  marketingOptOut: boolean;
}

// Nutrition-specific profile extensions
export interface NutritionUserProfile extends BaseUserProfile {
  nutritionData: {
    goals: {
      targetWeight?: number;
      goalType: 'weight_loss' | 'weight_gain' | 'maintenance' | 'muscle_gain';
      activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
      targetDate?: string;
    };
    metrics: {
      weight: number;
      height: number;
      bodyFatPercentage?: number;
      muscleMassPercentage?: number;
    };
    restrictions: string[];
    allergies: string[];
    dietaryPreferences: string[];
  };
}

// Economics-specific profile extensions
export interface EconomicsUserProfile extends BaseUserProfile {
  economicsData: {
    portfolio: {
      riskTolerance: 'low' | 'medium' | 'high';
      investmentHorizon: 'short' | 'medium' | 'long';
      monthlyInvestment?: number;
      sectors: string[];
    };
    goals: {
      targetAmount?: number;
      purpose: string;
      deadline?: string;
    };
    experience: 'beginner' | 'intermediate' | 'advanced';
  };
}

export interface ProfileValidation {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
}

export interface ProfileUpdate {
  [key: string]: any;
}

export interface ProfileServiceConfig {
  validationRules?: ValidationRules;
  defaultPreferences?: Partial<UserPreferences>;
  profileFields?: {
    required: string[];
    optional: string[];
    computed: string[];
  };
}

export interface ValidationRules {
  email?: RegExp;
  username?: {
    minLength: number;
    maxLength: number;
    pattern?: RegExp;
  };
  password?: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
  };
  customRules?: Record<string, (value: any) => boolean>;
}

/**
 * Generic Profile Service
 */
export class ProfileService<T extends BaseUserProfile = BaseUserProfile> {
  protected config: ProfileServiceConfig;
  protected validationRules: ValidationRules;

  constructor(config: ProfileServiceConfig = {}) {
    this.config = {
      defaultPreferences: {
        theme: 'light',
        language: 'en',
        timezone: 'UTC',
        notifications: {
          email: { marketing: false, productUpdates: true, reminders: true, reports: true },
          push: { enabled: true, reminders: true, achievements: true, social: false },
          inApp: { enabled: true, popups: true, banners: true },
        },
        privacy: {
          profileVisibility: 'private',
          dataSharing: false,
          analyticsOptOut: false,
          marketingOptOut: false,
        },
      },
      profileFields: {
        required: ['email'],
        optional: ['username', 'firstName', 'lastName', 'dateOfBirth'],
        computed: ['createdAt', 'updatedAt'],
      },
      ...config,
    };

    this.validationRules = {
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      username: {
        minLength: 3,
        maxLength: 50,
        pattern: /^[a-zA-Z0-9_-]+$/,
      },
      password: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: false,
      },
      ...config.validationRules,
    };
  }

  /**
   * Create new profile with defaults
   */
  createProfile(
    data: Partial<T>,
    overrides?: Partial<UserPreferences>
  ): Omit<T, 'id' | 'createdAt' | 'updatedAt'> {
    const now = new Date().toISOString();
    const preferences = {
      ...this.config.defaultPreferences,
      ...overrides,
    } as UserPreferences;

    return {
      ...data,
      isActive: true,
      preferences,
      metadata: {},
    } as Omit<T, 'id' | 'createdAt' | 'updatedAt'>;
  }

  /**
   * Validate profile data
   */
  validateProfile(profile: Partial<T>): ProfileValidation {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Required field validation
    this.config.profileFields?.required.forEach(field => {
      if (!profile[field as keyof T]) {
        errors.push({
          field,
          message: `${field} is required`,
          code: 'REQUIRED_FIELD',
        });
      }
    });

    // Email validation
    if (profile.email && !this.validationRules.email?.test(profile.email)) {
      errors.push({
        field: 'email',
        message: 'Invalid email format',
        code: 'INVALID_EMAIL',
      });
    }

    // Username validation
    if (profile.username) {
      const usernameRules = this.validationRules.username;
      if (usernameRules) {
        if (profile.username.length < usernameRules.minLength) {
          errors.push({
            field: 'username',
            message: `Username must be at least ${usernameRules.minLength} characters`,
            code: 'USERNAME_TOO_SHORT',
          });
        }
        if (profile.username.length > usernameRules.maxLength) {
          errors.push({
            field: 'username',
            message: `Username must be less than ${usernameRules.maxLength} characters`,
            code: 'USERNAME_TOO_LONG',
          });
        }
        if (usernameRules.pattern && !usernameRules.pattern.test(profile.username)) {
          errors.push({
            field: 'username',
            message: 'Username contains invalid characters',
            code: 'INVALID_USERNAME',
          });
        }
      }
    }

    // Date of birth validation
    if (profile.dateOfBirth) {
      const birthDate = new Date(profile.dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      
      if (age < 13) {
        errors.push({
          field: 'dateOfBirth',
          message: 'User must be at least 13 years old',
          code: 'UNDERAGE',
        });
      }
      
      if (age > 120) {
        warnings.push({
          field: 'dateOfBirth',
          message: 'Please verify the birth date',
          severity: 'medium',
        });
      }
    }

    // Custom validation rules
    if (this.validationRules.customRules) {
      Object.entries(this.validationRules.customRules).forEach(([field, validator]) => {
        const value = profile[field as keyof T];
        if (value && !validator(value)) {
          errors.push({
            field,
            message: `Invalid ${field}`,
            code: 'CUSTOM_VALIDATION_FAILED',
          });
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Update profile preferences
   */
  updatePreferences(
    currentPreferences: UserPreferences,
    updates: Partial<UserPreferences>
  ): UserPreferences {
    return {
      ...currentPreferences,
      ...updates,
      notifications: {
        ...currentPreferences.notifications,
        ...updates.notifications,
        email: {
          ...currentPreferences.notifications.email,
          ...updates.notifications?.email,
        },
        push: {
          ...currentPreferences.notifications.push,
          ...updates.notifications?.push,
        },
        inApp: {
          ...currentPreferences.notifications.inApp,
          ...updates.notifications?.inApp,
        },
      },
      privacy: {
        ...currentPreferences.privacy,
        ...updates.privacy,
      },
    };
  }

  /**
   * Sanitize profile data for public display
   */
  sanitizeForPublic(profile: T): Partial<T> {
    const { email, ...publicData } = profile;
    
    // Remove sensitive fields based on privacy settings
    if (profile.preferences.privacy.profileVisibility === 'private') {
      return {
        id: profile.id,
        username: profile.username,
        firstName: profile.firstName,
        avatarUrl: profile.avatarUrl,
      } as Partial<T>;
    }

    if (profile.preferences.privacy.profileVisibility === 'friends') {
      return {
        ...publicData,
        metadata: {},
      } as Partial<T>;
    }

    return publicData;
  }

  /**
   * Generate profile completeness score
   */
  calculateCompletenessScore(profile: T): {
    score: number;
    maxScore: number;
    missingFields: string[];
    suggestions: string[];
  } {
    let score = 0;
    const maxScore = this.config.profileFields!.required.length + this.config.profileFields!.optional.length;
    const missingFields: string[] = [];
    const suggestions: string[] = [];

    // Check required fields
    this.config.profileFields!.required.forEach(field => {
      if (profile[field as keyof T]) {
        score += 1;
      } else {
        missingFields.push(field);
      }
    });

    // Check optional fields
    this.config.profileFields!.optional.forEach(field => {
      if (profile[field as keyof T]) {
        score += 1;
      } else {
        suggestions.push(`Consider adding ${field} to complete your profile`);
      }
    });

    // Additional scoring for profile picture
    if (profile.avatarUrl) {
      score += 0.5;
    } else {
      suggestions.push('Add a profile picture');
    }

    return {
      score: Math.round((score / maxScore) * 100),
      maxScore: 100,
      missingFields,
      suggestions,
    };
  }

  /**
   * Export profile data (for GDPR compliance)
   */
  exportProfileData(profile: T): {
    profile: T;
    exportDate: string;
    format: string;
  } {
    return {
      profile,
      exportDate: new Date().toISOString(),
      format: 'JSON',
    };
  }

  /**
   * Anonymize profile data
   */
  anonymizeProfile(profile: T): Partial<T> {
    return {
      ...profile,
      email: 'anonymized@example.com',
      username: 'anonymous_user',
      firstName: undefined,
      lastName: undefined,
      avatarUrl: undefined,
      metadata: {},
    };
  }
}

/**
 * Specialized services for different domains
 */
export class NutritionProfileService extends ProfileService<NutritionUserProfile> {
  constructor(config?: ProfileServiceConfig) {
    super({
      ...config,
      profileFields: {
        required: ['email', 'nutritionData'],
        optional: ['username', 'firstName', 'lastName', 'dateOfBirth'],
        computed: ['createdAt', 'updatedAt'],
        ...config?.profileFields,
      },
    });
  }

  validateNutritionData(nutritionData: NutritionUserProfile['nutritionData']): ProfileValidation {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Weight validation
    if (nutritionData.metrics.weight < 30 || nutritionData.metrics.weight > 300) {
      errors.push({
        field: 'nutritionData.metrics.weight',
        message: 'Weight must be between 30 and 300 kg',
        code: 'INVALID_WEIGHT',
      });
    }

    // Height validation
    if (nutritionData.metrics.height < 100 || nutritionData.metrics.height > 250) {
      errors.push({
        field: 'nutritionData.metrics.height',
        message: 'Height must be between 100 and 250 cm',
        code: 'INVALID_HEIGHT',
      });
    }

    // Body fat percentage validation
    if (nutritionData.metrics.bodyFatPercentage !== undefined) {
      if (nutritionData.metrics.bodyFatPercentage < 3 || nutritionData.metrics.bodyFatPercentage > 50) {
        warnings.push({
          field: 'nutritionData.metrics.bodyFatPercentage',
          message: 'Body fat percentage seems unusual, please verify',
          severity: 'medium',
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }
}

export class EconomicsProfileService extends ProfileService<EconomicsUserProfile> {
  constructor(config?: ProfileServiceConfig) {
    super({
      ...config,
      profileFields: {
        required: ['email', 'economicsData'],
        optional: ['username', 'firstName', 'lastName', 'dateOfBirth'],
        computed: ['createdAt', 'updatedAt'],
        ...config?.profileFields,
      },
    });
  }

  validateEconomicsData(economicsData: EconomicsUserProfile['economicsData']): ProfileValidation {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Monthly investment validation
    if (economicsData.portfolio.monthlyInvestment !== undefined) {
      if (economicsData.portfolio.monthlyInvestment < 0) {
        errors.push({
          field: 'economicsData.portfolio.monthlyInvestment',
          message: 'Monthly investment cannot be negative',
          code: 'INVALID_INVESTMENT_AMOUNT',
        });
      }
    }

    // Risk tolerance vs investment horizon validation
    if (economicsData.portfolio.riskTolerance === 'high' && economicsData.portfolio.investmentHorizon === 'short') {
      warnings.push({
        field: 'economicsData.portfolio',
        message: 'High risk tolerance with short investment horizon may not be optimal',
        severity: 'medium',
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }
}

/**
 * Factory functions
 */
export const createProfileService = <T extends BaseUserProfile = BaseUserProfile>(
  config?: ProfileServiceConfig
) => new ProfileService<T>(config);

export const createNutritionProfileService = (config?: ProfileServiceConfig) =>
  new NutritionProfileService(config);

export const createEconomicsProfileService = (config?: ProfileServiceConfig) =>
  new EconomicsProfileService(config);