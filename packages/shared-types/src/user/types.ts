/**
 * User-related types and interfaces
 */

import { 
  BaseEntity, 
  ContactInfo, 
  Address, 
  BasePreferences, 
  NotificationPreferences, 
  PrivacyPreferences,
  ImageInfo 
} from '../common/base.js';
import { PersonalMetrics, NutritionGoals, DailyNutritionTargets } from '../nutrition/types.js';

/**
 * Base user profile
 */
export interface BaseUser extends BaseEntity {
  email: string;
  emailVerified: boolean;
  username?: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  avatar?: ImageInfo;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  phone?: string;
  phoneVerified: boolean;
  address?: Address;
  contactInfo?: ContactInfo;
  locale: string;
  timezone: string;
  lastLoginAt?: string;
  lastActiveAt?: string;
  accountStatus: UserAccountStatus;
  roles: UserRole[];
  permissions: string[];
  preferences: UserPreferences;
  privacySettings: PrivacyPreferences;
  notificationSettings: NotificationPreferences;
  twoFactorEnabled: boolean;
  emailOptOut: boolean;
  termsAcceptedAt?: string;
  privacyPolicyAcceptedAt?: string;
}

export type UserAccountStatus = 
  | 'active'
  | 'inactive'
  | 'suspended'
  | 'banned'
  | 'pending_verification'
  | 'deleted';

export type UserRole = 
  | 'user'
  | 'premium'
  | 'coach'
  | 'nutritionist'
  | 'admin'
  | 'moderator'
  | 'content_creator';

/**
 * User preferences extending base preferences
 */
export interface UserPreferences extends BasePreferences {
  dashboard: {
    defaultView: 'overview' | 'nutrition' | 'goals' | 'progress';
    chartTypes: string[];
    showTips: boolean;
    compactMode: boolean;
  };
  nutrition: {
    defaultServingUnit: 'metric' | 'imperial';
    showCalories: boolean;
    showMacros: boolean;
    showMicros: boolean;
    trackWater: boolean;
    trackSupplements: boolean;
    mealReminders: boolean;
    nutritionLabels: 'simple' | 'detailed';
  };
  recipes: {
    difficulty: 'any' | 'easy' | 'medium' | 'hard';
    maxPrepTime?: number;
    preferredCuisines: string[];
    hideAllergens: boolean;
    showNutritionInfo: boolean;
  };
  social: {
    shareProgress: boolean;
    allowMessages: boolean;
    showActivity: boolean;
    friendRequests: 'anyone' | 'friends_of_friends' | 'none';
  };
  data: {
    exportFormat: 'json' | 'csv' | 'pdf';
    backupFrequency: 'weekly' | 'monthly' | 'never';
    dataRetention: number; // days
  };
}

/**
 * Nutrition-specific user profile
 */
export interface NutritionUser extends BaseUser {
  nutritionProfile: {
    metrics: PersonalMetrics;
    goals: NutritionGoals;
    targets: DailyNutritionTargets;
    restrictions: {
      allergies: string[];
      intolerances: string[];
      dietary: string[]; // vegetarian, vegan, etc.
      medical: string[]; // diabetes, hypertension, etc.
    };
    supplements: string[];
    medications: string[];
    healthConditions: string[];
    fitnessLevel: FitnessLevel;
    certifications?: string[]; // for coaches/nutritionists
  };
  trackingHistory: {
    startDate: string;
    currentStreak: number;
    longestStreak: number;
    totalDays: number;
    averageAdherence: number;
  };
}

export type FitnessLevel = 
  | 'beginner'
  | 'intermediate' 
  | 'advanced'
  | 'athlete'
  | 'professional';

/**
 * User authentication types
 */
export interface AuthCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface SignupData extends AuthCredentials {
  firstName?: string;
  lastName?: string;
  username?: string;
  dateOfBirth?: string;
  termsAccepted: boolean;
  privacyPolicyAccepted: boolean;
  marketingOptIn?: boolean;
}

export interface AuthUser {
  id: string;
  email: string;
  emailVerified: boolean;
  roles: UserRole[];
  permissions: string[];
  sessionId: string;
  expiresAt: string;
  refreshToken?: string;
}

export interface PasswordResetRequest {
  email: string;
  token: string;
  expiresAt: string;
  usedAt?: string;
}

export interface EmailVerificationRequest {
  email: string;
  token: string;
  expiresAt: string;
  verifiedAt?: string;
}

/**
 * User relationships and social features
 */
export interface UserRelationship extends BaseEntity {
  userId: string;
  relatedUserId: string;
  type: RelationshipType;
  status: RelationshipStatus;
  initiatedBy: string;
  acceptedAt?: string;
  blockedAt?: string;
  notes?: string;
}

export type RelationshipType = 
  | 'friend'
  | 'follower'
  | 'following'
  | 'coach'
  | 'client'
  | 'blocked';

export type RelationshipStatus = 
  | 'pending'
  | 'accepted'
  | 'declined'
  | 'blocked';

/**
 * User progress and achievements
 */
export interface UserProgress extends BaseEntity {
  userId: string;
  type: ProgressType;
  date: string;
  value: number;
  unit: string;
  notes?: string;
  images?: ImageInfo[];
  verified: boolean;
  dataSource: 'manual' | 'device' | 'app';
}

export type ProgressType = 
  | 'weight'
  | 'body_fat'
  | 'muscle_mass'
  | 'measurements'
  | 'fitness_test'
  | 'blood_work'
  | 'energy_level'
  | 'sleep_quality'
  | 'mood';

export interface UserAchievement extends BaseEntity {
  userId: string;
  achievementId: string;
  unlockedAt: string;
  progress: number; // 0-100
  notified: boolean;
}

export interface Achievement extends BaseEntity {
  name: string;
  description: string;
  category: AchievementCategory;
  criteria: {
    type: string;
    value: number;
    period?: string;
  };
  points: number;
  badge: ImageInfo;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  hidden: boolean;
}

export type AchievementCategory = 
  | 'nutrition'
  | 'fitness'
  | 'consistency'
  | 'goals'
  | 'social'
  | 'learning'
  | 'special';

/**
 * User subscription and billing
 */
export interface UserSubscription extends BaseEntity {
  userId: string;
  planId: string;
  status: SubscriptionStatus;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  canceledAt?: string;
  trialStart?: string;
  trialEnd?: string;
  metadata: Record<string, any>;
}

export type SubscriptionStatus = 
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'canceled'
  | 'unpaid'
  | 'incomplete'
  | 'incomplete_expired';

export interface SubscriptionPlan extends BaseEntity {
  name: string;
  description: string;
  price: {
    amount: number;
    currency: string;
    interval: 'month' | 'year';
  };
  features: string[];
  limits: {
    recipes?: number;
    mealPlans?: number;
    trackedMetrics?: number;
    storage?: number; // GB
  };
  trialDays?: number;
  popular: boolean;
  active: boolean;
}

/**
 * User sessions and security
 */
export interface UserSession extends BaseEntity {
  userId: string;
  sessionId: string;
  deviceInfo: {
    userAgent: string;
    ip: string;
    device?: string;
    browser?: string;
    os?: string;
    location?: {
      country?: string;
      city?: string;
    };
  };
  expiresAt: string;
  lastAccessedAt: string;
  revoked: boolean;
  revokedAt?: string;
  revokedReason?: string;
}

export interface SecurityEvent extends BaseEntity {
  userId: string;
  type: SecurityEventType;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  metadata: {
    ip?: string;
    userAgent?: string;
    location?: string;
    [key: string]: any;
  };
  resolved: boolean;
  resolvedAt?: string;
}

export type SecurityEventType = 
  | 'login_success'
  | 'login_failure'
  | 'password_change'
  | 'password_reset'
  | 'email_change'
  | 'two_factor_enabled'
  | 'two_factor_disabled'
  | 'suspicious_activity'
  | 'account_locked'
  | 'account_unlocked'
  | 'data_export'
  | 'account_deletion';

/**
 * User search and filtering
 */
export interface UserSearchFilters {
  roles?: UserRole[];
  accountStatus?: UserAccountStatus[];
  verified?: boolean;
  subscription?: {
    status?: SubscriptionStatus[];
    planId?: string;
  };
  location?: {
    country?: string;
    state?: string;
    city?: string;
  };
  joinedAfter?: string;
  joinedBefore?: string;
  lastActiveAfter?: string;
  lastActiveBefore?: string;
  nutritionGoals?: string[];
  fitnessLevel?: FitnessLevel[];
}

/**
 * User statistics and analytics
 */
export interface UserStats {
  totalUsers: number;
  activeUsers: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  newUsers: {
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
  userRetention: {
    day1: number; // percentage
    day7: number;
    day30: number;
  };
  subscriptions: {
    total: number;
    active: number;
    trialing: number;
    churned: number;
  };
  engagement: {
    averageSessionDuration: number; // seconds
    averagePagesPerSession: number;
    bounceRate: number; // percentage
  };
}

/**
 * User data export types
 */
export interface UserDataExport {
  requestId: string;
  userId: string;
  requestedAt: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  completedAt?: string;
  downloadUrl?: string;
  expiresAt?: string;
  format: 'json' | 'csv' | 'pdf';
  includedData: string[];
  fileSize?: number;
  error?: string;
}

/**
 * GDPR and privacy compliance
 */
export interface DataProcessingConsent {
  userId: string;
  purpose: string;
  consentGiven: boolean;
  consentDate: string;
  withdrawnDate?: string;
  legalBasis: 'consent' | 'contract' | 'legal_obligation' | 'vital_interests' | 'public_task' | 'legitimate_interests';
  dataCategories: string[];
  retentionPeriod?: string;
}

export interface DataDeletionRequest {
  userId: string;
  requestedAt: string;
  reason?: string;
  status: 'pending' | 'processing' | 'completed' | 'denied';
  processedAt?: string;
  processedBy?: string;
  notes?: string;
  gracePeriod?: string;
}

/**
 * User utility types
 */
export type PublicUserProfile = Pick<BaseUser, 
  | 'id' 
  | 'username' 
  | 'displayName' 
  | 'avatar' 
  | 'createdAt'
> & {
  stats?: {
    recipesShared: number;
    mealPlansCreated: number;
    followersCount: number;
    followingCount: number;
  };
};

export type UserSummary = Pick<BaseUser, 
  | 'id' 
  | 'email' 
  | 'firstName' 
  | 'lastName' 
  | 'displayName' 
  | 'avatar' 
  | 'accountStatus' 
  | 'roles' 
  | 'createdAt' 
  | 'lastActiveAt'
>;

export type SafeUser = Omit<BaseUser, 
  | 'email' 
  | 'phone' 
  | 'address' 
  | 'contactInfo' 
  | 'notificationSettings' 
  | 'privacySettings'
>;