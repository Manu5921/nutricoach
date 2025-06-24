/**
 * @file session-service.test.ts
 * @description Comprehensive tests for SessionService
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createSessionService } from '../session-management/session-service';
import type { 
  SessionConfig, 
  AuthProvider, 
  SessionData, 
  LoginCredentials 
} from '../../shared-types/src/user/types';

// Mock auth providers
const mockLocalAuthProvider: AuthProvider = {
  id: 'local',
  name: 'Local Authentication',
  type: 'local',
  authenticate: vi.fn(),
  validateCredentials: vi.fn(),
  refreshToken: vi.fn(),
  revokeToken: vi.fn(),
  isAvailable: vi.fn().mockReturnValue(true),
};

const mockOAuthProvider: AuthProvider = {
  id: 'oauth',
  name: 'OAuth Provider',
  type: 'oauth',
  authenticate: vi.fn(),
  validateCredentials: vi.fn(),
  refreshToken: vi.fn(),
  revokeToken: vi.fn(),
  isAvailable: vi.fn().mockReturnValue(true),
};

describe('SessionService', () => {
  let service: ReturnType<typeof createSessionService>;
  
  const config: SessionConfig = {
    providers: {
      local: mockLocalAuthProvider,
      oauth: mockOAuthProvider,
    },
    security: {
      tokenExpiry: 24 * 60 * 60 * 1000, // 24 hours
      refreshTokenExpiry: 7 * 24 * 60 * 60 * 1000, // 7 days
      maxSessions: 5,
      requireMFA: false,
      passwordStrength: {
        minLength: 8,
        requireUppercase: true,
        requireNumbers: true,
        requireSymbols: false,
      },
    },
    rateLimiting: {
      enabled: true,
      maxAttempts: 5,
      windowMs: 15 * 60 * 1000, // 15 minutes
      blockDuration: 30 * 60 * 1000, // 30 minutes
    },
    analytics: {
      enabled: true,
      trackLoginAttempts: true,
      trackDeviceInfo: true,
      trackSessionDuration: true,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    service = createSessionService(config);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Service Creation', () => {
    it('should create service with valid configuration', () => {
      expect(service).toBeDefined();
      expect(typeof service.authenticate).toBe('function');
      expect(typeof service.validateSession).toBe('function');
      expect(typeof service.refreshSession).toBe('function');
      expect(typeof service.logout).toBe('function');
    });

    it('should throw error with invalid configuration', () => {
      expect(() => {
        createSessionService({
          providers: {},
          security: {
            tokenExpiry: -1,
            refreshTokenExpiry: 1000,
            maxSessions: 0,
          },
        });
      }).toThrow();
    });
  });

  describe('Authentication', () => {
    const validCredentials: LoginCredentials = {
      email: 'user@example.com',
      password: 'SecurePass123',
      provider: 'local',
    };

    const mockUser = {
      id: 'user-123',
      email: 'user@example.com',
      role: 'user',
      permissions: ['read', 'write'],
    };

    beforeEach(() => {
      mockLocalAuthProvider.authenticate = vi.fn().mockResolvedValue({
        success: true,
        user: mockUser,
        tokens: {
          accessToken: 'access-token-123',
          refreshToken: 'refresh-token-123',
        },
      });
    });

    it('should authenticate user successfully', async () => {
      const result = await service.authenticate(validCredentials);
      
      expect(result.success).toBe(true);
      expect(result.user).toEqual(mockUser);
      expect(result.sessionId).toBeDefined();
      expect(result.tokens?.accessToken).toBeDefined();
      expect(mockLocalAuthProvider.authenticate).toHaveBeenCalledWith(validCredentials);
    });

    it('should handle authentication failure', async () => {
      mockLocalAuthProvider.authenticate = vi.fn().mockResolvedValue({
        success: false,
        error: 'Invalid credentials',
      });

      const result = await service.authenticate(validCredentials);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid credentials');
      expect(result.user).toBeUndefined();
    });

    it('should apply rate limiting to failed attempts', async () => {
      mockLocalAuthProvider.authenticate = vi.fn().mockResolvedValue({
        success: false,
        error: 'Invalid credentials',
      });

      // Make multiple failed attempts
      for (let i = 0; i < 6; i++) {
        await service.authenticate(validCredentials);
      }

      const result = await service.authenticate(validCredentials);
      expect(result.success).toBe(false);
      expect(result.error).toContain('rate limit');
    });

    it('should enforce password strength requirements', async () => {
      const weakCredentials: LoginCredentials = {
        email: 'user@example.com',
        password: 'weak',
        provider: 'local',
      };

      const result = await service.authenticate(weakCredentials);
      expect(result.success).toBe(false);
      expect(result.error).toContain('password strength');
    });

    it('should handle OAuth authentication', async () => {
      const oauthCredentials: LoginCredentials = {
        email: 'user@example.com',
        oauthCode: 'oauth-code-123',
        provider: 'oauth',
      };

      mockOAuthProvider.authenticate = vi.fn().mockResolvedValue({
        success: true,
        user: mockUser,
        tokens: {
          accessToken: 'oauth-access-token',
          refreshToken: 'oauth-refresh-token',
        },
      });

      const result = await service.authenticate(oauthCredentials);
      
      expect(result.success).toBe(true);
      expect(result.user).toEqual(mockUser);
      expect(mockOAuthProvider.authenticate).toHaveBeenCalledWith(oauthCredentials);
    });
  });

  describe('Session Management', () => {
    let sessionId: string;
    let sessionData: SessionData;

    beforeEach(async () => {
      const mockUser = {
        id: 'user-123',
        email: 'user@example.com',
        role: 'user',
        permissions: ['read', 'write'],
      };

      mockLocalAuthProvider.authenticate = vi.fn().mockResolvedValue({
        success: true,
        user: mockUser,
        tokens: {
          accessToken: 'access-token-123',
          refreshToken: 'refresh-token-123',
        },
      });

      const authResult = await service.authenticate({
        email: 'user@example.com',
        password: 'SecurePass123',
        provider: 'local',
      });

      sessionId = authResult.sessionId!;
      sessionData = authResult.sessionData!;
    });

    it('should validate active session', async () => {
      const result = await service.validateSession(sessionId);
      
      expect(result.valid).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.sessionData).toBeDefined();
    });

    it('should invalidate expired session', async () => {
      // Create service with very short expiry
      const shortExpiryService = createSessionService({
        ...config,
        security: {
          ...config.security,
          tokenExpiry: 1, // 1ms
        },
      });

      const authResult = await shortExpiryService.authenticate({
        email: 'user@example.com',
        password: 'SecurePass123',
        provider: 'local',
      });

      // Wait for expiry
      await new Promise(resolve => setTimeout(resolve, 10));

      const result = await shortExpiryService.validateSession(authResult.sessionId!);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('expired');
    });

    it('should refresh session tokens', async () => {
      mockLocalAuthProvider.refreshToken = vi.fn().mockResolvedValue({
        success: true,
        tokens: {
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token',
        },
      });

      const result = await service.refreshSession(sessionId);
      
      expect(result.success).toBe(true);
      expect(result.tokens?.accessToken).toBe('new-access-token');
      expect(mockLocalAuthProvider.refreshToken).toHaveBeenCalled();
    });

    it('should handle refresh token failure', async () => {
      mockLocalAuthProvider.refreshToken = vi.fn().mockResolvedValue({
        success: false,
        error: 'Invalid refresh token',
      });

      const result = await service.refreshSession(sessionId);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid refresh token');
    });

    it('should logout and invalidate session', async () => {
      const result = await service.logout(sessionId);
      
      expect(result.success).toBe(true);
      
      // Session should be invalid after logout
      const validation = await service.validateSession(sessionId);
      expect(validation.valid).toBe(false);
    });

    it('should enforce maximum session limit', async () => {
      const credentials = {
        email: 'user@example.com',
        password: 'SecurePass123',
        provider: 'local',
      };

      // Create multiple sessions
      const sessions = [];
      for (let i = 0; i < config.security.maxSessions + 1; i++) {
        const result = await service.authenticate(credentials);
        sessions.push(result.sessionId);
      }

      // First session should be automatically invalidated
      const firstSessionValidation = await service.validateSession(sessions[0]!);
      expect(firstSessionValidation.valid).toBe(false);
    });
  });

  describe('Multi-Factor Authentication', () => {
    beforeEach(() => {
      service = createSessionService({
        ...config,
        security: {
          ...config.security,
          requireMFA: true,
        },
      });
    });

    it('should require MFA for authentication', async () => {
      mockLocalAuthProvider.authenticate = vi.fn().mockResolvedValue({
        success: true,
        requireMFA: true,
        mfaToken: 'mfa-token-123',
      });

      const result = await service.authenticate({
        email: 'user@example.com',
        password: 'SecurePass123',
        provider: 'local',
      });

      expect(result.success).toBe(false);
      expect(result.requireMFA).toBe(true);
      expect(result.mfaToken).toBe('mfa-token-123');
    });

    it('should verify MFA token', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'user@example.com',
        role: 'user',
        permissions: ['read', 'write'],
      };

      const result = await service.verifyMFA({
        mfaToken: 'mfa-token-123',
        mfaCode: '123456',
        provider: 'local',
      });

      expect(result.success).toBe(true);
      expect(result.user).toEqual(mockUser);
    });

    it('should handle invalid MFA code', async () => {
      const result = await service.verifyMFA({
        mfaToken: 'mfa-token-123',
        mfaCode: 'invalid',
        provider: 'local',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('MFA');
    });
  });

  describe('Device Management', () => {
    it('should track device information', async () => {
      const credentials = {
        email: 'user@example.com',
        password: 'SecurePass123',
        provider: 'local',
        deviceInfo: {
          userAgent: 'Mozilla/5.0 (Test Browser)',
          ip: '192.168.1.100',
          fingerprint: 'device-fingerprint-123',
        },
      };

      mockLocalAuthProvider.authenticate = vi.fn().mockResolvedValue({
        success: true,
        user: {
          id: 'user-123',
          email: 'user@example.com',
          role: 'user',
          permissions: ['read', 'write'],
        },
        tokens: {
          accessToken: 'access-token-123',
          refreshToken: 'refresh-token-123',
        },
      });

      const result = await service.authenticate(credentials);
      
      expect(result.success).toBe(true);
      expect(result.sessionData?.deviceInfo).toEqual(credentials.deviceInfo);
    });

    it('should detect suspicious device activity', async () => {
      // First login from trusted device
      await service.authenticate({
        email: 'user@example.com',
        password: 'SecurePass123',
        provider: 'local',
        deviceInfo: {
          userAgent: 'Mozilla/5.0 (Trusted Device)',
          ip: '192.168.1.100',
          fingerprint: 'trusted-device',
        },
      });

      // Second login from suspicious device
      const result = await service.authenticate({
        email: 'user@example.com',
        password: 'SecurePass123',
        provider: 'local',
        deviceInfo: {
          userAgent: 'Mozilla/5.0 (Unknown Device)',
          ip: '10.0.0.1',
          fingerprint: 'suspicious-device',
        },
      });

      expect(result.requireVerification).toBe(true);
      expect(result.verificationMethod).toBe('email');
    });
  });

  describe('Analytics and Monitoring', () => {
    it('should track login analytics', async () => {
      await service.authenticate({
        email: 'user@example.com',
        password: 'SecurePass123',
        provider: 'local',
      });

      const analytics = service.getAnalytics();
      expect(analytics.totalLogins).toBe(1);
      expect(analytics.successfulLogins).toBe(1);
      expect(analytics.failedLogins).toBe(0);
    });

    it('should track session duration', async () => {
      const authResult = await service.authenticate({
        email: 'user@example.com',
        password: 'SecurePass123',
        provider: 'local',
      });

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 100));

      await service.logout(authResult.sessionId!);

      const analytics = service.getAnalytics();
      expect(analytics.averageSessionDuration).toBeGreaterThan(0);
    });

    it('should provide security insights', async () => {
      // Simulate multiple failed attempts
      for (let i = 0; i < 3; i++) {
        await service.authenticate({
          email: 'user@example.com',
          password: 'wrong-password',
          provider: 'local',
        });
      }

      const insights = service.getSecurityInsights();
      expect(insights.suspiciousActivity).toHaveLength(1);
      expect(insights.suspiciousActivity[0].type).toBe('multiple_failed_logins');
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle concurrent authentication requests', async () => {
      const credentials = {
        email: 'user@example.com',
        password: 'SecurePass123',
        provider: 'local',
      };

      mockLocalAuthProvider.authenticate = vi.fn().mockResolvedValue({
        success: true,
        user: {
          id: 'user-123',
          email: 'user@example.com',
          role: 'user',
          permissions: ['read', 'write'],
        },
        tokens: {
          accessToken: 'access-token-123',
          refreshToken: 'refresh-token-123',
        },
      });

      const promises = Array.from({ length: 10 }, () => 
        service.authenticate(credentials)
      );

      const results = await Promise.all(promises);
      expect(results.every(r => r.success)).toBe(true);
    });

    it('should efficiently manage session storage', async () => {
      const startTime = Date.now();
      
      // Create many sessions
      for (let i = 0; i < 100; i++) {
        await service.authenticate({
          email: `user${i}@example.com`,
          password: 'SecurePass123',
          provider: 'local',
        });
      }

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(2000); // Should complete within 2 seconds
    });
  });
});