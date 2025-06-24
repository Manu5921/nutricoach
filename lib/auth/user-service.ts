import { createServerComponentClient } from '@/lib/supabase'
import { UserProfile, EncryptedHealthProfile, SecurityLevel } from './types'
import { DataEncryption, SecurityAudit, AccessControl, HealthDataSecurity } from './security'

export class UserService {
  private supabase = createServerComponentClient()

  /**
   * Get user profile with appropriate security filtering
   */
  async getUserProfile(
    userId: string, 
    requestedSecurityLevel: SecurityLevel = SecurityLevel.PERSONAL,
    auditInfo: { ipAddress: string; userAgent: string }
  ): Promise<UserProfile | null> {
    try {
      // Log data access for audit trail
      await SecurityAudit.logAccess({
        userId,
        action: 'profile_update',
        securityLevel: requestedSecurityLevel,
        dataAccessed: ['user_profile'],
        ...auditInfo
      })

      const { data: user, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error || !user) {
        throw new Error('User not found')
      }

      // Decrypt health profile if requested and authorized
      let healthProfile = undefined
      if (requestedSecurityLevel >= SecurityLevel.SENSITIVE && user.health_profile_encrypted) {
        try {
          healthProfile = HealthDataSecurity.decryptHealthProfile(user.health_profile_encrypted)
          
          // Log sensitive data access
          await SecurityAudit.logAccess({
            userId,
            action: 'health_data_access',
            securityLevel: SecurityLevel.SENSITIVE,
            dataAccessed: ['health_profile'],
            ...auditInfo
          })
        } catch (error) {
          console.error('Failed to decrypt health profile:', error)
          // Continue without health profile rather than failing entirely
        }
      }

      const fullProfile: UserProfile = {
        ...user,
        health_profile: healthProfile
      }

      // Filter data based on security level
      return AccessControl.filterUserData(fullProfile, requestedSecurityLevel) as UserProfile
    } catch (error) {
      console.error('Error fetching user profile:', error)
      
      await SecurityAudit.logAccess({
        userId,
        action: 'profile_update',
        securityLevel: requestedSecurityLevel,
        success: false,
        failureReason: error instanceof Error ? error.message : 'Unknown error',
        ...auditInfo
      })
      
      throw error
    }
  }

  /**
   * Update user profile with security validation
   */
  async updateUserProfile(
    userId: string,
    updates: Partial<UserProfile>,
    auditInfo: { ipAddress: string; userAgent: string }
  ): Promise<UserProfile> {
    try {
      // Separate health profile from other updates
      const { health_profile, ...generalUpdates } = updates
      
      // Encrypt health profile if provided
      let encryptedHealthProfile: string | undefined
      if (health_profile) {
        encryptedHealthProfile = HealthDataSecurity.encryptHealthProfile(health_profile)
        
        // Log sensitive data update
        await SecurityAudit.logAccess({
          userId,
          action: 'health_data_access',
          securityLevel: SecurityLevel.SENSITIVE,
          dataAccessed: ['health_profile'],
          ...auditInfo
        })
      }

      // Prepare database updates
      const dbUpdates: any = {
        ...generalUpdates,
        updated_at: new Date().toISOString()
      }

      if (encryptedHealthProfile) {
        dbUpdates.health_profile_encrypted = encryptedHealthProfile
      }

      // Update in database
      const { data: updatedUser, error } = await this.supabase
        .from('users')
        .update(dbUpdates)
        .eq('id', userId)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to update user: ${error.message}`)
      }

      // Log successful update
      await SecurityAudit.logAccess({
        userId,
        action: 'profile_update',
        securityLevel: SecurityLevel.PERSONAL,
        dataAccessed: Object.keys(updates),
        ...auditInfo
      })

      // Return updated profile
      return this.getUserProfile(userId, SecurityLevel.SENSITIVE, auditInfo)
    } catch (error) {
      console.error('Error updating user profile:', error)
      
      await SecurityAudit.logAccess({
        userId,
        action: 'profile_update',
        securityLevel: SecurityLevel.PERSONAL,
        success: false,
        failureReason: error instanceof Error ? error.message : 'Unknown error',
        ...auditInfo
      })
      
      throw error
    }
  }

  /**
   * Create new user with security defaults
   */
  async createUser(
    userInfo: {
      email: string
      fullName?: string
      avatarUrl?: string
    },
    auditInfo: { ipAddress: string; userAgent: string }
  ): Promise<UserProfile> {
    try {
      const userId = crypto.randomUUID()
      
      const newUser = {
        id: userId,
        email: userInfo.email,
        full_name: userInfo.fullName,
        avatar_url: userInfo.avatarUrl,
        subscription_status: 'inactive' as const,
        trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        data_retention_consent: false,
        marketing_consent: false,
        privacy_level: 'basic' as const,
        dietary_restrictions: [],
        cuisine_preferences: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data: createdUser, error } = await this.supabase
        .from('users')
        .insert(newUser)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to create user: ${error.message}`)
      }

      // Log user creation
      await SecurityAudit.logAccess({
        userId,
        action: 'profile_update',
        securityLevel: SecurityLevel.PERSONAL,
        dataAccessed: ['user_creation'],
        ...auditInfo
      })

      return createdUser as UserProfile
    } catch (error) {
      console.error('Error creating user:', error)
      throw error
    }
  }

  /**
   * Update health profile with enhanced security
   */
  async updateHealthProfile(
    userId: string,
    healthProfile: EncryptedHealthProfile,
    auditInfo: { ipAddress: string; userAgent: string }
  ): Promise<void> {
    try {
      // Encrypt the health profile
      const encryptedProfile = HealthDataSecurity.encryptHealthProfile(healthProfile)

      // Update in database
      const { error } = await this.supabase
        .from('users')
        .update({ 
          health_profile_encrypted: encryptedProfile,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (error) {
        throw new Error(`Failed to update health profile: ${error.message}`)
      }

      // Log sensitive data update
      await SecurityAudit.logAccess({
        userId,
        action: 'health_data_access',
        securityLevel: SecurityLevel.SENSITIVE,
        dataAccessed: Object.keys(healthProfile),
        ...auditInfo
      })
    } catch (error) {
      console.error('Error updating health profile:', error)
      
      await SecurityAudit.logAccess({
        userId,
        action: 'health_data_access',
        securityLevel: SecurityLevel.SENSITIVE,
        success: false,
        failureReason: error instanceof Error ? error.message : 'Unknown error',
        ...auditInfo
      })
      
      throw error
    }
  }

  /**
   * Get user subscription info
   */
  async getSubscriptionInfo(userId: string): Promise<{
    status: string
    currentPeriodEnd?: string
    trialEndsAt?: string
    stripeCustomerId?: string
  }> {
    const { data: user, error } = await this.supabase
      .from('users')
      .select('subscription_status, current_period_end, trial_ends_at, stripe_customer_id')
      .eq('id', userId)
      .single()

    if (error || !user) {
      throw new Error('User not found')
    }

    return {
      status: user.subscription_status,
      currentPeriodEnd: user.current_period_end,
      trialEndsAt: user.trial_ends_at,
      stripeCustomerId: user.stripe_customer_id
    }
  }

  /**
   * Update subscription status
   */
  async updateSubscriptionStatus(
    userId: string,
    subscriptionData: {
      status: string
      stripeCustomerId?: string
      subscriptionId?: string
      currentPeriodStart?: string
      currentPeriodEnd?: string
    },
    auditInfo: { ipAddress: string; userAgent: string }
  ): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('users')
        .update({
          subscription_status: subscriptionData.status,
          stripe_customer_id: subscriptionData.stripeCustomerId,
          subscription_id: subscriptionData.subscriptionId,
          current_period_start: subscriptionData.currentPeriodStart,
          current_period_end: subscriptionData.currentPeriodEnd,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (error) {
        throw new Error(`Failed to update subscription: ${error.message}`)
      }

      // Log subscription change
      await SecurityAudit.logAccess({
        userId,
        action: 'subscription_change' as any,
        securityLevel: SecurityLevel.PERSONAL,
        dataAccessed: ['subscription_status'],
        ...auditInfo
      })
    } catch (error) {
      console.error('Error updating subscription:', error)
      throw error
    }
  }

  /**
   * Check if user has active subscription or trial
   */
  async hasActiveAccess(userId: string): Promise<boolean> {
    const { data: user, error } = await this.supabase
      .from('users')
      .select('subscription_status, trial_ends_at, current_period_end')
      .eq('id', userId)
      .single()

    if (error || !user) {
      return false
    }

    const now = new Date()
    
    // Check if subscription is active
    if (user.subscription_status === 'active' && user.current_period_end) {
      return new Date(user.current_period_end) > now
    }

    // Check if trial is still valid
    if (user.trial_ends_at) {
      return new Date(user.trial_ends_at) > now
    }

    return false
  }

  /**
   * Delete user account with secure data cleanup
   */
  async deleteUserAccount(
    userId: string,
    auditInfo: { ipAddress: string; userAgent: string }
  ): Promise<void> {
    try {
      // Log account deletion
      await SecurityAudit.logAccess({
        userId,
        action: 'account_deletion',
        securityLevel: SecurityLevel.CRITICAL,
        dataAccessed: ['full_account'],
        ...auditInfo
      })

      // Delete user data (cascading deletes will handle related tables)
      const { error } = await this.supabase
        .from('users')
        .delete()
        .eq('id', userId)

      if (error) {
        throw new Error(`Failed to delete user: ${error.message}`)
      }
    } catch (error) {
      console.error('Error deleting user account:', error)
      throw error
    }
  }

  /**
   * Export user data for GDPR compliance
   */
  async exportUserData(
    userId: string,
    auditInfo: { ipAddress: string; userAgent: string }
  ): Promise<any> {
    try {
      // Log data export
      await SecurityAudit.logAccess({
        userId,
        action: 'data_export',
        securityLevel: SecurityLevel.CRITICAL,
        dataAccessed: ['full_account_export'],
        ...auditInfo
      })

      // Get full user profile
      const profile = await this.getUserProfile(userId, SecurityLevel.CRITICAL, auditInfo)
      
      // Get audit logs
      const auditLogs = await SecurityAudit.getAuditLogs(userId)
      
      // Get usage events
      const { data: usageEvents } = await this.supabase
        .from('usage_events')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })

      return {
        profile,
        auditLogs,
        usageEvents: usageEvents || [],
        exportedAt: new Date().toISOString()
      }
    } catch (error) {
      console.error('Error exporting user data:', error)
      throw error
    }
  }
}