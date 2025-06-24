/**
 * Universal Session Management Service
 * Handles authentication, authorization, and session state
 * Extensible for multiple project types and auth providers
 */

export interface SessionConfig {
  providers: {
    oauth?: OAuthProvider[];
    local?: LocalAuthProvider;
    magic?: MagicLinkProvider;
    biometric?: BiometricProvider;
  };
  security: {
    tokenExpiry: number; // milliseconds
    refreshThreshold: number; // milliseconds before expiry to refresh
    maxSessions: number; // max concurrent sessions per user
    requireMFA?: boolean;
    passwordStrength?: PasswordStrengthConfig;
    rateLimit?: RateLimitConfig;
  };
  storage: {
    type: 'memory' | 'redis' | 'database' | 'custom';
    options?: Record<string, any>;
  };
  events?: {
    onLogin?: (session: UserSession) => void;
    onLogout?: (sessionId: string) => void;
    onExpire?: (sessionId: string) => void;
    onRefresh?: (session: UserSession) => void;
  };
}

export interface UserSession {
  id: string;
  userId: string;
  userAgent?: string;
  ipAddress?: string;
  provider: AuthProvider;
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date;
  createdAt: Date;
  lastAccessedAt: Date;
  metadata?: Record<string, any>;
  permissions: string[];
  roles: string[];
  mfaVerified?: boolean;
  deviceFingerprint?: string;
}

export interface AuthProvider {
  type: 'local' | 'oauth' | 'magic' | 'biometric';
  name: string;
  config?: Record<string, any>;
}

export interface LoginCredentials {
  provider: string;
  email?: string;
  password?: string;
  token?: string; // OAuth token
  biometricData?: string; // Biometric signature
  deviceInfo?: DeviceInfo;
  mfaCode?: string;
}

export interface DeviceInfo {
  userAgent: string;
  ipAddress: string;
  fingerprint?: string;
  location?: {
    country?: string;
    city?: string;
    timezone?: string;
  };
}

export interface LoginResult {
  success: boolean;
  session?: UserSession;
  error?: string;
  requiresMFA?: boolean;
  mfaOptions?: string[];
  tempToken?: string; // For MFA flow
}

export interface OAuthProvider {
  name: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope?: string[];
  authorizeUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  enabled: boolean;
}

export interface LocalAuthProvider {
  enabled: boolean;
  allowRegistration: boolean;
  requireEmailVerification: boolean;
  hashAlgorithm: 'bcrypt' | 'argon2' | 'scrypt';
  hashRounds?: number;
}

export interface MagicLinkProvider {
  enabled: boolean;
  tokenExpiry: number; // milliseconds
  emailTemplate?: string;
}

export interface BiometricProvider {
  enabled: boolean;
  supportedTypes: ('fingerprint' | 'face' | 'voice')[];
  fallbackToPassword: boolean;
}

export interface PasswordStrengthConfig {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSymbols: boolean;
  bannedPasswords?: string[];
}

export interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
  blockDurationMs: number;
}

export interface SessionStorage {
  get(sessionId: string): Promise<UserSession | null>;
  set(session: UserSession): Promise<void>;
  delete(sessionId: string): Promise<void>;
  update(sessionId: string, updates: Partial<UserSession>): Promise<void>;
  getUserSessions(userId: string): Promise<UserSession[]>;
  cleanup(): Promise<number>; // Returns number of cleaned sessions
}

export interface UserPermissions {
  userId: string;
  permissions: string[];
  roles: string[];
  context?: string; // 'nutrition', 'economics', etc.
  expiresAt?: Date;
}

/**
 * In-memory session storage implementation
 */
class MemorySessionStorage implements SessionStorage {
  private sessions = new Map<string, UserSession>();
  private userSessions = new Map<string, Set<string>>();

  async get(sessionId: string): Promise<UserSession | null> {
    return this.sessions.get(sessionId) || null;
  }

  async set(session: UserSession): Promise<void> {
    this.sessions.set(session.id, session);
    
    if (!this.userSessions.has(session.userId)) {
      this.userSessions.set(session.userId, new Set());
    }
    this.userSessions.get(session.userId)!.add(session.id);
  }

  async delete(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session) {
      this.sessions.delete(sessionId);
      this.userSessions.get(session.userId)?.delete(sessionId);
    }
  }

  async update(sessionId: string, updates: Partial<UserSession>): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session) {
      Object.assign(session, updates);
      this.sessions.set(sessionId, session);
    }
  }

  async getUserSessions(userId: string): Promise<UserSession[]> {
    const sessionIds = this.userSessions.get(userId) || new Set();
    const sessions: UserSession[] = [];
    
    for (const sessionId of sessionIds) {
      const session = this.sessions.get(sessionId);
      if (session) {
        sessions.push(session);
      }
    }
    
    return sessions;
  }

  async cleanup(): Promise<number> {
    const now = new Date();
    let cleanedCount = 0;
    
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.expiresAt < now) {
        await this.delete(sessionId);
        cleanedCount++;
      }
    }
    
    return cleanedCount;
  }
}

/**
 * Session Management Service
 */
export class SessionService {
  private config: SessionConfig;
  private storage: SessionStorage;
  private loginAttempts = new Map<string, { count: number; lastAttempt: Date }>();

  constructor(config: SessionConfig) {
    this.config = config;
    this.storage = this.createStorage();
    this.startCleanupInterval();
  }

  /**
   * Authenticate user and create session
   */
  async login(credentials: LoginCredentials, deviceInfo: DeviceInfo): Promise<LoginResult> {
    // Rate limiting check
    if (this.config.security.rateLimit) {
      const canAttempt = await this.checkRateLimit(credentials.email || credentials.token || 'unknown');
      if (!canAttempt) {
        return {
          success: false,
          error: 'Too many login attempts. Please try again later.',
        };
      }
    }

    try {
      // Authenticate based on provider
      const authResult = await this.authenticateUser(credentials);
      if (!authResult.success) {
        await this.recordFailedAttempt(credentials.email || credentials.token || 'unknown');
        return authResult;
      }

      const user = authResult.user!;

      // Check if MFA is required
      if (this.config.security.requireMFA && !credentials.mfaCode) {
        return {
          success: false,
          requiresMFA: true,
          mfaOptions: ['totp', 'sms'], // Configure based on user settings
          tempToken: this.generateTempToken(user.id),
        };
      }

      // Create session
      const session = await this.createSession(user, deviceInfo, credentials.provider);

      // Enforce max sessions limit
      await this.enforceSessionLimit(user.id);

      // Clear failed attempts
      this.clearFailedAttempts(credentials.email || credentials.token || 'unknown');

      // Trigger event
      this.config.events?.onLogin?.(session);

      return {
        success: true,
        session,
      };
    } catch (error) {
      await this.recordFailedAttempt(credentials.email || credentials.token || 'unknown');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed',
      };
    }
  }

  /**
   * Logout user and invalidate session
   */
  async logout(sessionId: string): Promise<boolean> {
    try {
      const session = await this.storage.get(sessionId);
      if (!session) {
        return false;
      }

      await this.storage.delete(sessionId);
      this.config.events?.onLogout?.(sessionId);
      
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Logout all sessions for a user
   */
  async logoutAll(userId: string): Promise<number> {
    try {
      const sessions = await this.storage.getUserSessions(userId);
      let loggedOutCount = 0;

      for (const session of sessions) {
        await this.storage.delete(session.id);
        this.config.events?.onLogout?.(session.id);
        loggedOutCount++;
      }

      return loggedOutCount;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Refresh session token
   */
  async refreshSession(sessionId: string): Promise<UserSession | null> {
    try {
      const session = await this.storage.get(sessionId);
      if (!session) {
        return null;
      }

      // Check if session is still valid
      if (session.expiresAt <= new Date()) {
        await this.storage.delete(sessionId);
        this.config.events?.onExpire?.(sessionId);
        return null;
      }

      // Update session
      const newExpiresAt = new Date(Date.now() + this.config.security.tokenExpiry);
      const updatedSession = {
        ...session,
        expiresAt: newExpiresAt,
        lastAccessedAt: new Date(),
        accessToken: this.generateAccessToken(session.userId),
      };

      await this.storage.update(sessionId, updatedSession);
      this.config.events?.onRefresh?.(updatedSession);

      return updatedSession;
    } catch (error) {
      return null;
    }
  }

  /**
   * Validate session and check permissions
   */
  async validateSession(sessionId: string, requiredPermissions?: string[]): Promise<UserSession | null> {
    try {
      const session = await this.storage.get(sessionId);
      if (!session) {
        return null;
      }

      // Check expiry
      if (session.expiresAt <= new Date()) {
        await this.storage.delete(sessionId);
        this.config.events?.onExpire?.(sessionId);
        return null;
      }

      // Check permissions if required
      if (requiredPermissions && requiredPermissions.length > 0) {
        const hasPermissions = requiredPermissions.every(permission =>
          session.permissions.includes(permission) ||
          this.hasRolePermission(session.roles, permission)
        );

        if (!hasPermissions) {
          return null;
        }
      }

      // Update last accessed time
      await this.storage.update(sessionId, { lastAccessedAt: new Date() });

      // Check if token needs refresh
      const timeUntilExpiry = session.expiresAt.getTime() - Date.now();
      if (timeUntilExpiry < this.config.security.refreshThreshold) {
        return this.refreshSession(sessionId);
      }

      return session;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get user sessions
   */
  async getUserSessions(userId: string): Promise<UserSession[]> {
    return this.storage.getUserSessions(userId);
  }

  /**
   * Update user permissions
   */
  async updatePermissions(userId: string, permissions: UserPermissions): Promise<boolean> {
    try {
      const sessions = await this.storage.getUserSessions(userId);
      
      for (const session of sessions) {
        await this.storage.update(session.id, {
          permissions: permissions.permissions,
          roles: permissions.roles,
        });
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Revoke session
   */
  async revokeSession(sessionId: string): Promise<boolean> {
    return this.logout(sessionId);
  }

  /**
   * Get session analytics
   */
  async getSessionAnalytics(userId?: string) {
    const sessions = userId 
      ? await this.storage.getUserSessions(userId)
      : await this.getAllSessions();

    const now = new Date();
    const activeSessions = sessions.filter(s => s.expiresAt > now);
    const expiredSessions = sessions.filter(s => s.expiresAt <= now);

    return {
      total: sessions.length,
      active: activeSession.length,
      expired: expiredSessions.length,
      byProvider: this.groupByProvider(sessions),
      byDevice: this.groupByDevice(sessions),
      averageSessionDuration: this.calculateAverageSessionDuration(sessions),
    };
  }

  /**
   * Private methods
   */
  private async authenticateUser(credentials: LoginCredentials): Promise<{ success: boolean; user?: any; error?: string }> {
    switch (credentials.provider) {
      case 'local':
        return this.authenticateLocal(credentials);
      case 'oauth':
        return this.authenticateOAuth(credentials);
      case 'magic':
        return this.authenticateMagicLink(credentials);
      case 'biometric':
        return this.authenticateBiometric(credentials);
      default:
        return { success: false, error: 'Unsupported authentication provider' };
    }
  }

  private async authenticateLocal(credentials: LoginCredentials): Promise<{ success: boolean; user?: any; error?: string }> {
    if (!this.config.providers.local?.enabled) {
      return { success: false, error: 'Local authentication not enabled' };
    }

    // In a real implementation, this would validate against a user database
    // For now, we'll mock the response
    if (!credentials.email || !credentials.password) {
      return { success: false, error: 'Email and password required' };
    }

    // Mock user validation (replace with actual database lookup)
    const user = await this.validateUserCredentials(credentials.email, credentials.password);
    if (!user) {
      return { success: false, error: 'Invalid credentials' };
    }

    return { success: true, user };
  }

  private async authenticateOAuth(credentials: LoginCredentials): Promise<{ success: boolean; user?: any; error?: string }> {
    // OAuth token validation logic here
    // This would typically involve validating the token with the OAuth provider
    if (!credentials.token) {
      return { success: false, error: 'OAuth token required' };
    }

    // Mock OAuth validation
    const user = await this.validateOAuthToken(credentials.token);
    if (!user) {
      return { success: false, error: 'Invalid OAuth token' };
    }

    return { success: true, user };
  }

  private async authenticateMagicLink(credentials: LoginCredentials): Promise<{ success: boolean; user?: any; error?: string }> {
    if (!this.config.providers.magic?.enabled) {
      return { success: false, error: 'Magic link authentication not enabled' };
    }

    // Magic link validation logic
    if (!credentials.token) {
      return { success: false, error: 'Magic link token required' };
    }

    const user = await this.validateMagicLinkToken(credentials.token);
    if (!user) {
      return { success: false, error: 'Invalid or expired magic link' };
    }

    return { success: true, user };
  }

  private async authenticateBiometric(credentials: LoginCredentials): Promise<{ success: boolean; user?: any; error?: string }> {
    if (!this.config.providers.biometric?.enabled) {
      return { success: false, error: 'Biometric authentication not enabled' };
    }

    // Biometric validation logic
    if (!credentials.biometricData) {
      return { success: false, error: 'Biometric data required' };
    }

    const user = await this.validateBiometricData(credentials.biometricData);
    if (!user) {
      return { success: false, error: 'Biometric authentication failed' };
    }

    return { success: true, user };
  }

  private async createSession(user: any, deviceInfo: DeviceInfo, provider: string): Promise<UserSession> {
    const sessionId = this.generateSessionId();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.config.security.tokenExpiry);

    const session: UserSession = {
      id: sessionId,
      userId: user.id,
      userAgent: deviceInfo.userAgent,
      ipAddress: deviceInfo.ipAddress,
      provider: { type: 'local', name: provider }, // Adjust based on actual provider
      accessToken: this.generateAccessToken(user.id),
      refreshToken: this.generateRefreshToken(user.id),
      expiresAt,
      createdAt: now,
      lastAccessedAt: now,
      metadata: {
        location: deviceInfo.location,
        fingerprint: deviceInfo.fingerprint,
      },
      permissions: user.permissions || [],
      roles: user.roles || [],
      deviceFingerprint: deviceInfo.fingerprint,
    };

    await this.storage.set(session);
    return session;
  }

  private async enforceSessionLimit(userId: string): Promise<void> {
    const sessions = await this.storage.getUserSessions(userId);
    const activeSessions = sessions.filter(s => s.expiresAt > new Date());

    if (activeSessions.length > this.config.security.maxSessions) {
      // Sort by last accessed and remove oldest sessions
      activeSessions.sort((a, b) => a.lastAccessedAt.getTime() - b.lastAccessedAt.getTime());
      
      const sessionsToRemove = activeSessions.slice(0, activeSessions.length - this.config.security.maxSessions);
      for (const session of sessionsToRemove) {
        await this.storage.delete(session.id);
        this.config.events?.onLogout?.(session.id);
      }
    }
  }

  private async checkRateLimit(identifier: string): Promise<boolean> {
    if (!this.config.security.rateLimit) {
      return true;
    }

    const now = new Date();
    const windowStart = new Date(now.getTime() - this.config.security.rateLimit.windowMs);
    
    const attempts = this.loginAttempts.get(identifier);
    if (!attempts) {
      return true;
    }

    if (attempts.lastAttempt < windowStart) {
      this.loginAttempts.delete(identifier);
      return true;
    }

    return attempts.count < this.config.security.rateLimit.maxAttempts;
  }

  private async recordFailedAttempt(identifier: string): Promise<void> {
    const now = new Date();
    const existing = this.loginAttempts.get(identifier);
    
    if (existing) {
      existing.count++;
      existing.lastAttempt = now;
    } else {
      this.loginAttempts.set(identifier, { count: 1, lastAttempt: now });
    }
  }

  private clearFailedAttempts(identifier: string): void {
    this.loginAttempts.delete(identifier);
  }

  private hasRolePermission(roles: string[], permission: string): boolean {
    // Role-based permission logic
    // This would typically involve checking role definitions
    const rolePermissions: Record<string, string[]> = {
      admin: ['*'], // Admin has all permissions
      moderator: ['read', 'write', 'moderate'],
      user: ['read'],
    };

    return roles.some(role => {
      const permissions = rolePermissions[role] || [];
      return permissions.includes('*') || permissions.includes(permission);
    });
  }

  private createStorage(): SessionStorage {
    switch (this.config.storage.type) {
      case 'memory':
      default:
        return new MemorySessionStorage();
      // Add other storage implementations here
    }
  }

  private startCleanupInterval(): void {
    // Clean up expired sessions every hour
    setInterval(async () => {
      try {
        const cleanedCount = await this.storage.cleanup();
        console.log(`Cleaned up ${cleanedCount} expired sessions`);
      } catch (error) {
        console.error('Session cleanup failed:', error);
      }
    }, 3600000); // 1 hour
  }

  private generateSessionId(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
  }

  private generateAccessToken(userId: string): string {
    // In production, use proper JWT signing
    return `at_${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
  }

  private generateRefreshToken(userId: string): string {
    return `rt_${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
  }

  private generateTempToken(userId: string): string {
    return `temp_${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
  }

  // Mock validation methods (replace with actual implementations)
  private async validateUserCredentials(email: string, password: string): Promise<any> {
    // Mock user validation
    if (email === 'test@example.com' && password === 'password123') {
      return {
        id: 'user_123',
        email,
        permissions: ['read', 'write'],
        roles: ['user'],
      };
    }
    return null;
  }

  private async validateOAuthToken(token: string): Promise<any> {
    // Mock OAuth validation
    return {
      id: 'oauth_user_456',
      email: 'oauth@example.com',
      permissions: ['read'],
      roles: ['user'],
    };
  }

  private async validateMagicLinkToken(token: string): Promise<any> {
    // Mock magic link validation
    return {
      id: 'magic_user_789',
      email: 'magic@example.com',
      permissions: ['read'],
      roles: ['user'],
    };
  }

  private async validateBiometricData(data: string): Promise<any> {
    // Mock biometric validation
    return {
      id: 'bio_user_101',
      email: 'bio@example.com',
      permissions: ['read'],
      roles: ['user'],
    };
  }

  private async getAllSessions(): Promise<UserSession[]> {
    // Implementation would depend on storage type
    return [];
  }

  private groupByProvider(sessions: UserSession[]): Record<string, number> {
    return sessions.reduce((acc, session) => {
      const provider = session.provider.name;
      acc[provider] = (acc[provider] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private groupByDevice(sessions: UserSession[]): Record<string, number> {
    return sessions.reduce((acc, session) => {
      const device = this.extractDeviceType(session.userAgent || '');
      acc[device] = (acc[device] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private extractDeviceType(userAgent: string): string {
    if (userAgent.includes('Mobile')) return 'Mobile';
    if (userAgent.includes('Tablet')) return 'Tablet';
    return 'Desktop';
  }

  private calculateAverageSessionDuration(sessions: UserSession[]): number {
    if (sessions.length === 0) return 0;
    
    const durations = sessions.map(session => {
      const endTime = session.expiresAt.getTime();
      const startTime = session.createdAt.getTime();
      return endTime - startTime;
    });

    return durations.reduce((sum, duration) => sum + duration, 0) / durations.length;
  }
}

/**
 * Factory functions
 */
export const createSessionService = (config: SessionConfig): SessionService => {
  return new SessionService(config);
};

export const createNutritionSessionService = (baseConfig: Partial<SessionConfig>): SessionService => {
  const config: SessionConfig = {
    providers: {
      local: { enabled: true, allowRegistration: true, requireEmailVerification: true, hashAlgorithm: 'bcrypt' },
      oauth: [
        {
          name: 'google',
          clientId: process.env.GOOGLE_CLIENT_ID || '',
          clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
          redirectUri: process.env.GOOGLE_REDIRECT_URI || '',
          authorizeUrl: 'https://accounts.google.com/o/oauth2/auth',
          tokenUrl: 'https://oauth2.googleapis.com/token',
          userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
          enabled: true,
        },
      ],
    },
    security: {
      tokenExpiry: 24 * 60 * 60 * 1000, // 24 hours
      refreshThreshold: 2 * 60 * 60 * 1000, // 2 hours
      maxSessions: 5,
      passwordStrength: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSymbols: false,
      },
      rateLimit: {
        maxAttempts: 5,
        windowMs: 15 * 60 * 1000, // 15 minutes
        blockDurationMs: 30 * 60 * 1000, // 30 minutes
      },
    },
    storage: {
      type: 'memory',
    },
    ...baseConfig,
  };

  return new SessionService(config);
};