import crypto from 'crypto'
import { SecurityLevel, SecurityAuditLog } from './types'
import { createServerComponentClient } from '@/lib/supabase'

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!
const ALGORITHM = 'aes-256-gcm'

/**
 * Encryption utilities for sensitive health data
 */
export class DataEncryption {
  private static getKey(): Buffer {
    if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 32) {
      throw new Error('ENCRYPTION_KEY must be exactly 32 characters')
    }
    return Buffer.from(ENCRYPTION_KEY, 'utf8')
  }

  static encrypt(text: string): string {
    try {
      const key = this.getKey()
      const iv = crypto.randomBytes(16)
      const cipher = crypto.createCipher(ALGORITHM, key)
      
      let encrypted = cipher.update(text, 'utf8', 'hex')
      encrypted += cipher.final('hex')
      
      const authTag = cipher.getAuthTag()
      
      return JSON.stringify({
        encrypted,
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex')
      })
    } catch (error) {
      console.error('Encryption failed:', error)
      throw new Error('Failed to encrypt sensitive data')
    }
  }

  static decrypt(encryptedData: string): string {
    try {
      const key = this.getKey()
      const { encrypted, iv, authTag } = JSON.parse(encryptedData)
      
      const decipher = crypto.createDecipher(ALGORITHM, key)
      decipher.setAuthTag(Buffer.from(authTag, 'hex'))
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8')
      decrypted += decipher.final('utf8')
      
      return decrypted
    } catch (error) {
      console.error('Decryption failed:', error)
      throw new Error('Failed to decrypt sensitive data')
    }
  }

  static encryptObject<T>(obj: T): string {
    return this.encrypt(JSON.stringify(obj))
  }

  static decryptObject<T>(encryptedData: string): T {
    const decrypted = this.decrypt(encryptedData)
    return JSON.parse(decrypted)
  }
}

/**
 * Security audit logging
 */
export class SecurityAudit {
  static async logAccess({
    userId,
    action,
    securityLevel,
    dataAccessed,
    ipAddress,
    userAgent,
    success = true,
    failureReason
  }: {
    userId: string
    action: SecurityAuditLog['action']
    securityLevel: SecurityLevel
    dataAccessed?: string[]
    ipAddress: string
    userAgent: string
    success?: boolean
    failureReason?: string
  }) {
    const supabase = createServerComponentClient()
    
    try {
      const auditLog: Omit<SecurityAuditLog, 'id'> = {
        user_id: userId,
        action,
        security_level: securityLevel,
        data_accessed: dataAccessed,
        ip_address: ipAddress,
        user_agent: userAgent,
        timestamp: new Date().toISOString(),
        success,
        failure_reason: failureReason
      }

      const { error } = await supabase
        .from('security_audit_logs')
        .insert(auditLog)

      if (error) {
        console.error('Failed to log security audit:', error)
      }
    } catch (error) {
      console.error('Security audit logging failed:', error)
    }
  }

  static async getAuditLogs(userId: string, limit = 50): Promise<SecurityAuditLog[]> {
    const supabase = createServerComponentClient()
    
    const { data, error } = await supabase
      .from('security_audit_logs')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Failed to fetch audit logs:', error)
      return []
    }

    return data || []
  }
}

/**
 * Data access control based on security levels
 */
export class AccessControl {
  private static readonly SECURITY_MATRIX = {
    [SecurityLevel.PUBLIC]: ['full_name', 'avatar_url', 'dietary_restrictions', 'cuisine_preferences'],
    [SecurityLevel.PERSONAL]: ['email', 'cooking_skill_level', 'meal_prep_time', 'marketing_consent'],
    [SecurityLevel.SENSITIVE]: ['health_profile', 'age_range', 'activity_level'],
    [SecurityLevel.CRITICAL]: ['medical_conditions', 'medications', 'bmr_estimate', 'stripe_customer_id']
  }

  static canAccess(requestedLevel: SecurityLevel, userLevel: SecurityLevel): boolean {
    return userLevel >= requestedLevel
  }

  static filterUserData<T extends Record<string, any>>(
    userData: T,
    maxSecurityLevel: SecurityLevel
  ): Partial<T> {
    const allowedFields = new Set<string>()
    
    // Add all fields up to the max security level
    for (let level = SecurityLevel.PUBLIC; level <= maxSecurityLevel; level++) {
      this.SECURITY_MATRIX[level]?.forEach(field => allowedFields.add(field))
    }

    const filtered: Partial<T> = {}
    Object.keys(userData).forEach(key => {
      if (allowedFields.has(key)) {
        filtered[key] = userData[key]
      }
    })

    return filtered
  }
}

/**
 * Session security manager
 */
export class SessionSecurity {
  private static readonly SESSION_TIMEOUT = 24 * 60 * 60 * 1000 // 24 hours
  private static readonly REFRESH_THRESHOLD = 2 * 60 * 60 * 1000 // 2 hours

  static isSessionValid(session: { expires_at: number }): boolean {
    return Date.now() < session.expires_at
  }

  static shouldRefreshSession(session: { expires_at: number }): boolean {
    const timeUntilExpiry = session.expires_at - Date.now()
    return timeUntilExpiry < this.REFRESH_THRESHOLD
  }

  static generateSecureToken(): string {
    return crypto.randomBytes(32).toString('hex')
  }

  static async validateRequest(
    ipAddress: string,
    userAgent: string,
    userId: string
  ): Promise<{ valid: boolean; reason?: string }> {
    // Basic rate limiting and anomaly detection
    const supabase = createServerComponentClient()
    
    // Check for suspicious activity in the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    
    const { data: recentLogs, error } = await supabase
      .from('security_audit_logs')
      .select('ip_address, user_agent, success')
      .eq('user_id', userId)
      .gte('timestamp', oneHourAgo)

    if (error) {
      return { valid: false, reason: 'Security check failed' }
    }

    // Check for too many failed attempts
    const failedAttempts = recentLogs?.filter(log => !log.success).length || 0
    if (failedAttempts > 5) {
      return { valid: false, reason: 'Too many failed attempts' }
    }

    // Check for suspicious IP/agent changes
    const recentSuccessful = recentLogs?.filter(log => log.success) || []
    if (recentSuccessful.length > 0) {
      const hasNewIP = !recentSuccessful.some(log => log.ip_address === ipAddress)
      const hasNewAgent = !recentSuccessful.some(log => log.user_agent === userAgent)
      
      if (hasNewIP && hasNewAgent) {
        // New device/location - could be suspicious but not blocking
        await SecurityAudit.logAccess({
          userId,
          action: 'login',
          securityLevel: SecurityLevel.PERSONAL,
          ipAddress,
          userAgent,
          success: true,
          failureReason: 'New device detected'
        })
      }
    }

    return { valid: true }
  }
}

/**
 * Health data specific encryption
 */
export class HealthDataSecurity {
  static encryptHealthProfile(profile: any): string {
    // Additional layer of encryption for health data
    const timestamp = Date.now()
    const dataWithTimestamp = {
      ...profile,
      encrypted_at: timestamp,
      data_version: '1.0'
    }
    
    return DataEncryption.encryptObject(dataWithTimestamp)
  }

  static decryptHealthProfile(encryptedProfile: string): any {
    try {
      const decrypted = DataEncryption.decryptObject(encryptedProfile)
      
      // Verify data integrity
      if (!decrypted.encrypted_at || !decrypted.data_version) {
        throw new Error('Invalid health data format')
      }
      
      // Remove metadata
      const { encrypted_at, data_version, ...profile } = decrypted
      return profile
    } catch (error) {
      console.error('Health data decryption failed:', error)
      throw new Error('Unable to access health profile')
    }
  }
}