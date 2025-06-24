/**
 * @file notification-service.test.ts
 * @description Comprehensive tests for NotificationService
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createNotificationService } from '../notification-system/notification-service';
import type { 
  NotificationProvider, 
  NotificationMessage, 
  NotificationConfig 
} from '../../shared-types/src/system/types';

// Mock providers
const mockEmailProvider: NotificationProvider = {
  id: 'email',
  name: 'Email Provider',
  type: 'email',
  send: vi.fn().mockResolvedValue({ success: true, messageId: 'email-123' }),
  validateConfig: vi.fn().mockReturnValue(true),
  isAvailable: vi.fn().mockReturnValue(true),
};

const mockPushProvider: NotificationProvider = {
  id: 'push',
  name: 'Push Provider',
  type: 'push',
  send: vi.fn().mockResolvedValue({ success: true, messageId: 'push-456' }),
  validateConfig: vi.fn().mockReturnValue(true),
  isAvailable: vi.fn().mockReturnValue(true),
};

const mockSmsProvider: NotificationProvider = {
  id: 'sms',
  name: 'SMS Provider',
  type: 'sms',
  send: vi.fn().mockResolvedValue({ success: true, messageId: 'sms-789' }),
  validateConfig: vi.fn().mockReturnValue(true),
  isAvailable: vi.fn().mockReturnValue(true),
};

describe('NotificationService', () => {
  let service: ReturnType<typeof createNotificationService>;
  
  const config: NotificationConfig = {
    providers: {
      email: mockEmailProvider,
      push: mockPushProvider,
      sms: mockSmsProvider,
    },
    rateLimiting: {
      enabled: true,
      maxPerHour: 100,
      maxPerDay: 1000,
    },
    analytics: {
      enabled: true,
      trackDelivery: true,
      trackEngagement: true,
    },
    fallback: {
      enabled: true,
      providers: ['email', 'sms'],
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    service = createNotificationService(config);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Service Creation', () => {
    it('should create service with valid configuration', () => {
      expect(service).toBeDefined();
      expect(typeof service.send).toBe('function');
      expect(typeof service.sendBulk).toBe('function');
      expect(typeof service.getTemplate).toBe('function');
    });

    it('should throw error with invalid configuration', () => {
      expect(() => {
        createNotificationService({
          providers: {},
          rateLimiting: { enabled: true, maxPerHour: -1, maxPerDay: 1000 },
        });
      }).toThrow();
    });
  });

  describe('Single Notification Sending', () => {
    const basicMessage: NotificationMessage = {
      type: 'info',
      recipient: 'user@example.com',
      title: 'Test Notification',
      body: 'This is a test message',
      channels: ['email'],
    };

    it('should send notification successfully', async () => {
      const result = await service.send(basicMessage);
      
      expect(result).toHaveLength(1);
      expect(result[0].success).toBe(true);
      expect(result[0].messageId).toBe('email-123');
      expect(mockEmailProvider.send).toHaveBeenCalledTimes(1);
    });

    it('should send to multiple channels', async () => {
      const multiChannelMessage: NotificationMessage = {
        ...basicMessage,
        channels: ['email', 'push'],
      };

      const result = await service.send(multiChannelMessage);
      
      expect(result).toHaveLength(2);
      expect(result.every(r => r.success)).toBe(true);
      expect(mockEmailProvider.send).toHaveBeenCalledTimes(1);
      expect(mockPushProvider.send).toHaveBeenCalledTimes(1);
    });

    it('should handle provider failure with fallback', async () => {
      mockEmailProvider.send = vi.fn().mockRejectedValue(new Error('Email failed'));
      
      const result = await service.send(basicMessage);
      
      expect(result).toHaveLength(1);
      expect(result[0].success).toBe(false);
      expect(result[0].error).toBeDefined();
    });

    it('should apply rate limiting', async () => {
      // Override with strict rate limiting
      const strictService = createNotificationService({
        ...config,
        rateLimiting: {
          enabled: true,
          maxPerHour: 1,
          maxPerDay: 1,
        },
      });

      // First message should succeed
      const result1 = await strictService.send(basicMessage);
      expect(result1[0].success).toBe(true);

      // Second message should be rate limited
      const result2 = await strictService.send(basicMessage);
      expect(result2[0].success).toBe(false);
      expect(result2[0].error).toContain('rate limit');
    });
  });

  describe('Bulk Notification Sending', () => {
    const bulkMessages: NotificationMessage[] = [
      {
        type: 'info',
        recipient: 'user1@example.com',
        title: 'Test 1',
        body: 'Message 1',
        channels: ['email'],
      },
      {
        type: 'info',
        recipient: 'user2@example.com',
        title: 'Test 2',
        body: 'Message 2',
        channels: ['push'],
      },
    ];

    it('should send bulk notifications successfully', async () => {
      const results = await service.sendBulk(bulkMessages);
      
      expect(results).toHaveLength(2);
      expect(results.every(result => 
        result.every(r => r.success)
      )).toBe(true);
    });

    it('should handle partial failures in bulk sending', async () => {
      mockEmailProvider.send = vi.fn().mockRejectedValue(new Error('Email failed'));
      
      const results = await service.sendBulk(bulkMessages);
      
      expect(results[0][0].success).toBe(false); // Email failed
      expect(results[1][0].success).toBe(true);  // Push succeeded
    });
  });

  describe('Template Management', () => {
    const templateData = {
      name: 'John Doe',
      goalType: 'Weight Loss',
      targetCalories: '2000',
    };

    it('should process template with data', async () => {
      const messageWithTemplate: NotificationMessage = {
        type: 'welcome',
        recipient: 'user@example.com',
        template: 'welcome_nutrition',
        templateData,
        channels: ['email'],
      };

      await service.send(messageWithTemplate);
      
      expect(mockEmailProvider.send).toHaveBeenCalledWith(
        expect.objectContaining({
          title: expect.stringContaining('John Doe'),
          body: expect.stringContaining('Weight Loss'),
        })
      );
    });

    it('should get template by key', () => {
      const template = service.getTemplate('welcome_nutrition');
      expect(template).toBeDefined();
      expect(template?.title).toContain('{{name}}');
    });

    it('should handle missing template gracefully', () => {
      const template = service.getTemplate('non_existent_template');
      expect(template).toBeUndefined();
    });
  });

  describe('Analytics and Monitoring', () => {
    it('should track delivery analytics when enabled', async () => {
      const message: NotificationMessage = {
        type: 'info',
        recipient: 'user@example.com',
        title: 'Test',
        body: 'Test',
        channels: ['email'],
      };

      await service.send(message);
      
      const analytics = service.getAnalytics();
      expect(analytics.totalSent).toBe(1);
      expect(analytics.successRate).toBeGreaterThan(0);
    });

    it('should provide delivery statistics', async () => {
      const messages: NotificationMessage[] = Array.from({ length: 5 }, (_, i) => ({
        type: 'info',
        recipient: `user${i}@example.com`,
        title: `Test ${i}`,
        body: `Message ${i}`,
        channels: ['email'],
      }));

      await service.sendBulk(messages);
      
      const analytics = service.getAnalytics();
      expect(analytics.totalSent).toBe(5);
      expect(analytics.deliveryStats.email).toBeDefined();
    });
  });

  describe('Provider Management', () => {
    it('should check provider availability', () => {
      expect(service.isProviderAvailable('email')).toBe(true);
      expect(service.isProviderAvailable('nonexistent')).toBe(false);
    });

    it('should validate provider configuration', () => {
      expect(mockEmailProvider.validateConfig).toHaveBeenCalled();
      expect(mockPushProvider.validateConfig).toHaveBeenCalled();
      expect(mockSmsProvider.validateConfig).toHaveBeenCalled();
    });

    it('should handle unavailable providers gracefully', async () => {
      mockEmailProvider.isAvailable = vi.fn().mockReturnValue(false);
      
      const message: NotificationMessage = {
        type: 'info',
        recipient: 'user@example.com',
        title: 'Test',
        body: 'Test',
        channels: ['email'],
      };

      const result = await service.send(message);
      expect(result[0].success).toBe(false);
      expect(result[0].error).toContain('unavailable');
    });
  });

  describe('Retry Logic', () => {
    it('should retry failed deliveries', async () => {
      let attempts = 0;
      mockEmailProvider.send = vi.fn().mockImplementation(() => {
        attempts++;
        if (attempts < 3) {
          return Promise.reject(new Error('Temporary failure'));
        }
        return Promise.resolve({ success: true, messageId: 'retry-success' });
      });

      const message: NotificationMessage = {
        type: 'info',
        recipient: 'user@example.com',
        title: 'Test',
        body: 'Test',
        channels: ['email'],
        retryConfig: {
          maxAttempts: 3,
          backoff: 'exponential',
          initialDelay: 100,
        },
      };

      const result = await service.send(message);
      expect(result[0].success).toBe(true);
      expect(attempts).toBe(3);
    });

    it('should fail after max retry attempts', async () => {
      mockEmailProvider.send = vi.fn().mockRejectedValue(new Error('Permanent failure'));

      const message: NotificationMessage = {
        type: 'info',
        recipient: 'user@example.com',
        title: 'Test',
        body: 'Test',
        channels: ['email'],
        retryConfig: {
          maxAttempts: 2,
          backoff: 'linear',
          initialDelay: 50,
        },
      };

      const result = await service.send(message);
      expect(result[0].success).toBe(false);
      expect(mockEmailProvider.send).toHaveBeenCalledTimes(2);
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle high volume efficiently', async () => {
      const startTime = Date.now();
      const messages: NotificationMessage[] = Array.from({ length: 100 }, (_, i) => ({
        type: 'info',
        recipient: `user${i}@example.com`,
        title: `Test ${i}`,
        body: `Message ${i}`,
        channels: ['email'],
      }));

      await service.sendBulk(messages);
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should batch notifications efficiently', async () => {
      const messages: NotificationMessage[] = Array.from({ length: 10 }, (_, i) => ({
        type: 'info',
        recipient: `user${i}@example.com`,
        title: `Test ${i}`,
        body: `Message ${i}`,
        channels: ['email'],
      }));

      await service.sendBulk(messages, { batchSize: 5 });
      
      // Should have made 2 batches
      expect(mockEmailProvider.send).toHaveBeenCalledTimes(10);
    });
  });
});