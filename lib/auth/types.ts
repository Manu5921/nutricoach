export interface UserProfile {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  
  // Subscription info
  stripe_customer_id?: string
  subscription_status: 'inactive' | 'active' | 'canceled' | 'past_due'
  subscription_id?: string
  current_period_start?: string
  current_period_end?: string
  trial_ends_at?: string
  
  // Health & Nutrition Profile (Encrypted)
  health_profile?: EncryptedHealthProfile
  
  // Preferences
  dietary_restrictions?: string[]
  dietary_preferences?: string[]
  cuisine_preferences?: string[]
  cooking_skill_level?: 'beginner' | 'intermediate' | 'advanced'
  meal_prep_time?: 'quick' | 'medium' | 'elaborate'
  
  // AI Learning Profile
  ai_learning_profile?: AILearningProfile
  
  // Nutrition Goals
  daily_calories_target?: number
  food_allergies?: string[]
  disliked_foods?: string[]
  
  // Privacy & Security
  data_retention_consent: boolean
  marketing_consent: boolean
  privacy_level: 'basic' | 'enhanced' | 'maximum'
  
  // Timestamps
  created_at: string
  updated_at: string
  last_login_at?: string
}

export interface EncryptedHealthProfile {
  // Sensitive medical data - encrypted at rest
  age_range?: '18-25' | '26-35' | '36-45' | '46-55' | '56-65' | '65+'
  biological_sex?: 'male' | 'female' | 'other' | 'prefer_not_to_say'
  activity_level?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'
  
  // Medical conditions (encrypted)
  allergies?: string[] // Encrypted list
  medical_conditions?: string[] // Encrypted list
  medications?: string[] // Encrypted list
  
  // Goals
  health_goals?: ('weight_loss' | 'muscle_gain' | 'maintenance' | 'energy' | 'inflammation_reduction')[]
  
  // Calculated fields (encrypted)
  bmr_estimate?: number // Encrypted
  caloric_needs?: number // Encrypted
  
  // Nutrition tracking
  macro_targets?: {
    protein_percent: number
    carb_percent: number
    fat_percent: number
  }
  
  // Anti-inflammatory focus
  inflammation_markers?: 'low' | 'moderate' | 'high'
  inflammation_triggers?: string[] // Encrypted
  
  // Health biomarkers
  health_biomarkers?: HealthBiomarkers
}

export interface HealthBiomarkers {
  // Lab results (encrypted)
  crp_level?: number // C-reactive protein (mg/L)
  cholesterol_total?: number // Total cholesterol (mg/dL)
  cholesterol_ldl?: number // LDL cholesterol (mg/dL)
  cholesterol_hdl?: number // HDL cholesterol (mg/dL)
  triglycerides?: number // Triglycerides (mg/dL)
  glucose_fasting?: number // Fasting glucose (mg/dL)
  hba1c?: number // HbA1c (%)
  vitamin_d?: number // Vitamin D (ng/mL)
  b12?: number // Vitamin B12 (pg/mL)
  iron_serum?: number // Serum iron (mcg/dL)
  ferritin?: number // Ferritin (ng/mL)
  
  // Biomarker trends
  biomarker_history?: BiomarkerEntry[]
  last_lab_date?: string
  next_lab_date?: string
}

export interface BiomarkerEntry {
  date: string
  biomarker: string
  value: number
  unit: string
  reference_range?: { min: number; max: number }
  status?: 'low' | 'normal' | 'high' | 'critical'
}

export interface AILearningProfile {
  // User interaction patterns
  meal_preferences_learned?: Record<string, number> // ingredient/recipe preferences with confidence scores
  dietary_compliance_score?: number // 0-100 adherence to dietary preferences
  seasonal_preferences?: Record<string, string[]> // season -> preferred ingredients
  
  // Learning metrics
  preference_confidence?: number // 0-1 how confident we are in learned preferences
  interaction_count?: number // total interactions for learning
  feedback_provided?: number // explicit feedback instances
  
  // Adaptation parameters
  learning_rate?: number // how quickly to adapt to new preferences
  stability_preference?: number // preference for consistent vs varied meals
  novelty_tolerance?: number // willingness to try new foods
  
  // Behavioral patterns
  meal_timing_patterns?: Record<string, number> // preferred meal times
  portion_size_adjustments?: Record<string, number> // learned portion preferences
  cooking_complexity_preference?: number // preferred difficulty level
  
  // Goal achievement tracking
  nutrition_goal_progress?: Record<string, GoalProgress>
  health_correlation_insights?: HealthCorrelationInsight[]
}

export interface GoalProgress {
  goal_type: string
  current_progress: number
  target_value: number
  success_rate: number // percentage of days meeting goal
  trend: 'improving' | 'stable' | 'declining'
  last_updated: string
}

export interface HealthCorrelationInsight {
  insight_type: 'biomarker_nutrition' | 'symptom_food' | 'energy_timing'
  description: string
  correlation_strength: number // -1 to 1
  confidence_level: number // 0-1
  recommendation?: string
  created_at: string
}

export interface AuthSession {
  user: UserProfile
  access_token: string
  refresh_token: string
  expires_at: number
}

export interface AuthError {
  code: string
  message: string
  details?: any
}

// Security levels for data access
export enum SecurityLevel {
  PUBLIC = 0,     // Name, avatar, public preferences
  PERSONAL = 1,   // Email, basic preferences
  SENSITIVE = 2,  // Health data, medical info
  CRITICAL = 3    // Payment info, highly sensitive medical data
}

// Audit log for security tracking
export interface SecurityAuditLog {
  id: string
  user_id: string
  action: 'login' | 'logout' | 'profile_update' | 'health_data_access' | 'data_export' | 'account_deletion'
  ip_address: string
  user_agent: string
  security_level: SecurityLevel
  data_accessed?: string[]
  timestamp: string
  success: boolean
  failure_reason?: string
}