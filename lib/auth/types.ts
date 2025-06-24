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
  cuisine_preferences?: string[]
  cooking_skill_level?: 'beginner' | 'intermediate' | 'advanced'
  meal_prep_time?: 'quick' | 'medium' | 'elaborate'
  
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