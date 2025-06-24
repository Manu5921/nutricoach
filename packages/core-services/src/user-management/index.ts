/**
 * User Management Module
 * Comprehensive user profile and preference management
 */

export {
  ProfileService,
  NutritionProfileService,
  EconomicsProfileService,
  createProfileService,
  createNutritionProfileService,
  createEconomicsProfileService,
  type BaseUserProfile,
  type NutritionUserProfile,
  type EconomicsUserProfile,
  type UserPreferences,
  type NotificationPreferences,
  type PrivacyPreferences,
  type ProfileValidation,
  type ValidationError,
  type ValidationWarning,
  type ProfileUpdate,
  type ProfileServiceConfig,
  type ValidationRules,
} from './profile-service.js';