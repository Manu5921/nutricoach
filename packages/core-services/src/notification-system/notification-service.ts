/**
 * Universal Notification System
 * Supports email, push notifications, in-app notifications, SMS, webhooks
 * Extensible for multiple project types (nutrition, economics, etc.)
 */

export interface NotificationConfig {
  providers: {
    email?: EmailProvider;
    push?: PushProvider;
    sms?: SMSProvider;
    inApp?: InAppProvider;
    webhook?: WebhookProvider;
  };
  defaultTemplate?: string;
  rateLimiting?: {
    enabled: boolean;
    maxPerMinute: number;
    maxPerHour: number;
    maxPerDay: number;
  };
  encryption?: {
    enabled: boolean;
    key?: string;
  };
  analytics?: {
    enabled: boolean;
    trackDelivery?: boolean;
    trackClicks?: boolean;
    trackOpens?: boolean;
  };
}

export interface NotificationMessage {
  id?: string;
  type: NotificationType;
  recipient: string | string[]; // Support multiple recipients
  subject?: string;
  title?: string;
  body: string;
  data?: Record<string, any>;
  template?: string;
  templateData?: Record<string, any>;
  scheduledFor?: Date;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  channels: NotificationChannel[];
  metadata?: Record<string, any>;
  tags?: string[];
  campaign?: string;
  context?: 'nutrition' | 'economics' | 'health' | 'system' | 'marketing';
  retryConfig?: {
    maxAttempts: number;
    backoffMs: number;
  };
}

export type NotificationType = 
  | 'welcome'
  | 'meal_reminder'
  | 'goal_achieved'
  | 'weekly_summary'
  | 'system_alert'
  | 'marketing'
  | 'reminder'
  | 'report_ready'
  | 'data_export'
  | 'subscription_update'
  | 'custom';

export type NotificationChannel = 'email' | 'push' | 'sms' | 'in_app' | 'webhook';

export interface NotificationResult {
  success: boolean;
  messageId?: string;
  channel: NotificationChannel;
  error?: string;
  timestamp: Date;
  deliveryTime?: number; // milliseconds
  recipient?: string;
  retryAttempt?: number;
}

export interface EmailProvider {
  send(message: EmailMessage): Promise<NotificationResult>;
  validateAddress?(email: string): boolean;
  getDeliveryStatus?(messageId: string): Promise<DeliveryStatus>;
}

export interface PushProvider {
  send(message: PushMessage): Promise<NotificationResult>;
  subscribe?(endpoint: string, keys: any): Promise<string>;
  unsubscribe?(token: string): Promise<boolean>;
}

export interface SMSProvider {
  send(message: SMSMessage): Promise<NotificationResult>;
  validatePhoneNumber?(phone: string): boolean;
}

export interface InAppProvider {
  send(message: InAppMessage): Promise<NotificationResult>;
  markAsRead?(messageId: string, userId: string): Promise<boolean>;
  getUnreadCount?(userId: string): Promise<number>;
}

export interface WebhookProvider {
  send(message: WebhookMessage): Promise<NotificationResult>;
  validateUrl?(url: string): boolean;
}

export interface EmailMessage {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  cc?: string[];
  bcc?: string[];
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    contentType?: string;
    cid?: string; // Content-ID for inline images
  }>;
  headers?: Record<string, string>;
  tags?: string[];
  trackingEnabled?: boolean;
}

export interface PushMessage {
  to: string | string[];
  title: string;
  body: string;
  data?: Record<string, any>;
  icon?: string;
  badge?: number;
  sound?: string;
  vibrate?: number[];
  requireInteraction?: boolean;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  image?: string;
  timestamp?: number;
  tag?: string;
}

export interface SMSMessage {
  to: string | string[];
  body: string;
  from?: string;
  mediaUrls?: string[];
}

export interface InAppMessage {
  userId: string | string[];
  title: string;
  body: string;
  type: 'info' | 'success' | 'warning' | 'error';
  actionUrl?: string;
  actionText?: string;
  data?: Record<string, any>;
  expiresAt?: Date;
  persistent?: boolean;
  imageUrl?: string;
}

export interface WebhookMessage {
  url: string;
  method?: 'POST' | 'PUT' | 'PATCH';
  headers?: Record<string, string>;
  payload: Record<string, any>;
  timeout?: number;
  retries?: number;
}

export interface DeliveryStatus {
  messageId: string;
  status: 'pending' | 'delivered' | 'failed' | 'bounced' | 'complained';
  timestamp: Date;
  details?: string;
}

export interface NotificationAnalytics {
  messageId: string;
  channel: NotificationChannel;
  sent: boolean;
  delivered?: boolean;
  opened?: boolean;
  clicked?: boolean;
  bounced?: boolean;
  complained?: boolean;
  unsubscribed?: boolean;
  timestamp: Date;
  metadata?: Record<string, any>;
}

/**
 * Advanced Notification Service
 */
export class NotificationService {
  private config: NotificationConfig;
  private templates = new Map<string, NotificationTemplate>();
  private rateLimiter = new Map<string, number[]>();
  private analytics: NotificationAnalytics[] = [];
  private retryQueue = new Map<string, { message: NotificationMessage; attempts: number }>();

  constructor(config: NotificationConfig) {
    this.config = config;
    this.initializeRateLimiterCleanup();
  }

  /**
   * Send notification through specified channels with retry logic
   */
  async send(message: NotificationMessage): Promise<NotificationResult[]> {
    const messageId = message.id || this.generateMessageId();
    message.id = messageId;

    // Validate recipients
    const validationResult = this.validateMessage(message);
    if (!validationResult.valid) {
      return [{
        success: false,
        channel: 'email',
        error: validationResult.error,
        timestamp: new Date(),
        messageId,
      }];
    }

    // Rate limiting check
    if (this.config.rateLimiting?.enabled) {
      const recipients = Array.isArray(message.recipient) ? message.recipient : [message.recipient];
      const rateLimitResults = recipients.map(recipient => this.checkRateLimit(recipient));
      
      if (rateLimitResults.some(result => !result)) {
        return [{
          success: false,
          channel: 'email',
          error: 'Rate limit exceeded for one or more recipients',
          timestamp: new Date(),
          messageId,
        }];
      }
    }

    const results: NotificationResult[] = [];

    // Process template if specified
    let processedMessage = message;
    if (message.template && message.templateData) {
      try {
        processedMessage = await this.processTemplate(message);
      } catch (error) {
        return [{
          success: false,
          channel: 'email',
          error: `Template processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          timestamp: new Date(),
          messageId,
        }];
      }
    }

    // Handle multiple recipients
    const recipients = Array.isArray(message.recipient) ? message.recipient : [message.recipient];

    // Send through each channel for each recipient
    for (const recipient of recipients) {
      const recipientMessage = { ...processedMessage, recipient };
      
      for (const channel of message.channels) {
        const startTime = Date.now();
        
        try {
          const result = await this.sendToChannelWithRetry(recipientMessage, channel);
          result.deliveryTime = Date.now() - startTime;
          result.messageId = messageId;
          result.recipient = recipient;
          results.push(result);

          // Track analytics
          if (this.config.analytics?.enabled) {
            this.trackAnalytics({
              messageId,
              channel,
              sent: result.success,
              delivered: result.success,
              timestamp: new Date(),
              metadata: { recipient, priority: message.priority, type: message.type },
            });
          }
        } catch (error) {
          const result: NotificationResult = {
            success: false,
            channel,
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date(),
            deliveryTime: Date.now() - startTime,
            messageId,
            recipient,
          };
          results.push(result);

          // Track failed analytics
          if (this.config.analytics?.enabled) {
            this.trackAnalytics({
              messageId,
              channel,
              sent: false,
              timestamp: new Date(),
              metadata: { recipient, error: result.error },
            });
          }
        }
      }
    }

    // Update rate limiting
    if (this.config.rateLimiting?.enabled) {
      recipients.forEach(recipient => this.updateRateLimit(recipient));
    }

    return results;
  }

  /**
   * Send with retry logic
   */
  private async sendToChannelWithRetry(
    message: NotificationMessage,
    channel: NotificationChannel,
    attempt: number = 1
  ): Promise<NotificationResult> {
    try {
      const result = await this.sendToChannel(message, channel);
      result.retryAttempt = attempt;
      return result;
    } catch (error) {
      const maxAttempts = message.retryConfig?.maxAttempts || 3;
      
      if (attempt < maxAttempts) {
        const backoffMs = message.retryConfig?.backoffMs || 1000;
        const delay = backoffMs * Math.pow(2, attempt - 1); // Exponential backoff
        
        await this.delay(delay);
        return this.sendToChannelWithRetry(message, channel, attempt + 1);
      }
      
      throw error;
    }
  }

  /**
   * Send bulk notifications efficiently
   */
  async sendBulk(messages: NotificationMessage[]): Promise<NotificationResult[]> {
    const batchSize = 10; // Process in batches to avoid overwhelming
    const results: NotificationResult[] = [];

    for (let i = 0; i < messages.length; i += batchSize) {
      const batch = messages.slice(i, i + batchSize);
      const batchPromises = batch.map(message => this.send(message));
      const batchResults = await Promise.all(batchPromises);
      
      results.push(...batchResults.flat());
      
      // Small delay between batches
      if (i + batchSize < messages.length) {
        await this.delay(100);
      }
    }

    return results;
  }

  /**
   * Schedule notification for later sending
   */
  async schedule(message: NotificationMessage): Promise<string> {
    const messageId = this.generateMessageId();
    message.id = messageId;
    
    if (message.scheduledFor) {
      const delay = message.scheduledFor.getTime() - Date.now();
      if (delay > 0) {
        setTimeout(() => {
          this.send(message);
        }, delay);
      } else {
        // Send immediately if scheduled time has passed
        await this.send(message);
      }
    }

    return messageId;
  }

  /**
   * Cancel scheduled notification
   */
  cancelScheduled(messageId: string): boolean {
    // In production, this would interact with a job queue
    // For now, we'll just remove from retry queue if present
    return this.retryQueue.delete(messageId);
  }

  /**
   * Get notification analytics
   */
  getAnalytics(filters?: {
    dateRange?: { start: Date; end: Date };
    channels?: NotificationChannel[];
    messageTypes?: NotificationType[];
  }): NotificationAnalytics[] {
    let filtered = this.analytics;

    if (filters?.dateRange) {
      filtered = filtered.filter(
        a => a.timestamp >= filters.dateRange!.start && a.timestamp <= filters.dateRange!.end
      );
    }

    if (filters?.channels) {
      filtered = filtered.filter(a => filters.channels!.includes(a.channel));
    }

    if (filters?.messageTypes) {
      filtered = filtered.filter(a => 
        a.metadata?.type && filters.messageTypes!.includes(a.metadata.type as NotificationType)
      );
    }

    return filtered;
  }

  /**
   * Get analytics summary
   */
  getAnalyticsSummary(filters?: Parameters<typeof this.getAnalytics>[0]) {
    const analytics = this.getAnalytics(filters);
    
    const summary = {
      total: analytics.length,
      sent: analytics.filter(a => a.sent).length,
      delivered: analytics.filter(a => a.delivered).length,
      opened: analytics.filter(a => a.opened).length,
      clicked: analytics.filter(a => a.clicked).length,
      bounced: analytics.filter(a => a.bounced).length,
      complained: analytics.filter(a => a.complained).length,
      byChannel: {} as Record<NotificationChannel, number>,
      deliveryRate: 0,
      openRate: 0,
      clickRate: 0,
    };

    // Calculate rates
    summary.deliveryRate = summary.sent > 0 ? summary.delivered / summary.sent : 0;
    summary.openRate = summary.delivered > 0 ? summary.opened / summary.delivered : 0;
    summary.clickRate = summary.opened > 0 ? summary.clicked / summary.opened : 0;

    // Group by channel
    analytics.forEach(a => {
      summary.byChannel[a.channel] = (summary.byChannel[a.channel] || 0) + 1;
    });

    return summary;
  }

  /**
   * Add notification template
   */
  addTemplate(name: string, template: NotificationTemplate): void {
    this.templates.set(name, template);
  }

  /**
   * Get notification template
   */
  getTemplate(name: string): NotificationTemplate | undefined {
    return this.templates.get(name);
  }

  /**
   * Get all templates
   */
  getTemplates(): NotificationTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Validate notification message
   */
  private validateMessage(message: NotificationMessage): { valid: boolean; error?: string } {
    if (!message.recipient || (Array.isArray(message.recipient) && message.recipient.length === 0)) {
      return { valid: false, error: 'Recipient is required' };
    }

    if (!message.body?.trim()) {
      return { valid: false, error: 'Message body is required' };
    }

    if (!message.channels || message.channels.length === 0) {
      return { valid: false, error: 'At least one channel is required' };
    }

    // Validate recipients based on channel
    const recipients = Array.isArray(message.recipient) ? message.recipient : [message.recipient];
    
    for (const channel of message.channels) {
      for (const recipient of recipients) {
        if (channel === 'email' && !this.isValidEmail(recipient)) {
          return { valid: false, error: `Invalid email address: ${recipient}` };
        }
        
        if (channel === 'sms' && !this.isValidPhoneNumber(recipient)) {
          return { valid: false, error: `Invalid phone number: ${recipient}` };
        }
      }
    }

    return { valid: true };
  }

  /**
   * Send to specific channel
   */
  private async sendToChannel(
    message: NotificationMessage,
    channel: NotificationChannel
  ): Promise<NotificationResult> {
    switch (channel) {
      case 'email':
        if (!this.config.providers.email) {
          throw new Error('Email provider not configured');
        }
        return this.sendEmail(message);

      case 'push':
        if (!this.config.providers.push) {
          throw new Error('Push provider not configured');
        }
        return this.sendPush(message);

      case 'sms':
        if (!this.config.providers.sms) {
          throw new Error('SMS provider not configured');
        }
        return this.sendSMS(message);

      case 'in_app':
        if (!this.config.providers.inApp) {
          throw new Error('In-app provider not configured');
        }
        return this.sendInApp(message);

      case 'webhook':
        if (!this.config.providers.webhook) {
          throw new Error('Webhook provider not configured');
        }
        return this.sendWebhook(message);

      default:
        throw new Error(`Unsupported channel: ${channel}`);
    }
  }

  /**
   * Send email notification
   */
  private async sendEmail(message: NotificationMessage): Promise<NotificationResult> {
    const emailMessage: EmailMessage = {
      to: message.recipient,
      subject: message.subject || message.title || 'Notification',
      html: message.body,
      text: this.stripHtmlTags(message.body),
      tags: message.tags,
      trackingEnabled: this.config.analytics?.enabled,
    };

    return this.config.providers.email!.send(emailMessage);
  }

  /**
   * Send push notification
   */
  private async sendPush(message: NotificationMessage): Promise<NotificationResult> {
    const pushMessage: PushMessage = {
      to: message.recipient,
      title: message.title || 'Notification',
      body: this.stripHtmlTags(message.body),
      data: message.data,
      timestamp: Date.now(),
      tag: message.campaign,
    };

    return this.config.providers.push!.send(pushMessage);
  }

  /**
   * Send SMS notification
   */
  private async sendSMS(message: NotificationMessage): Promise<NotificationResult> {
    const smsMessage: SMSMessage = {
      to: message.recipient,
      body: this.stripHtmlTags(message.body),
    };

    return this.config.providers.sms!.send(smsMessage);
  }

  /**
   * Send in-app notification
   */
  private async sendInApp(message: NotificationMessage): Promise<NotificationResult> {
    const inAppMessage: InAppMessage = {
      userId: message.recipient,
      title: message.title || 'Notification',
      body: message.body,
      type: this.mapPriorityToType(message.priority),
      data: message.data,
      persistent: message.priority === 'urgent' || message.priority === 'high',
    };

    return this.config.providers.inApp!.send(inAppMessage);
  }

  /**
   * Send webhook notification
   */
  private async sendWebhook(message: NotificationMessage): Promise<NotificationResult> {
    if (!message.data?.webhookUrl) {
      throw new Error('Webhook URL not provided in message data');
    }

    const webhookMessage: WebhookMessage = {
      url: message.data.webhookUrl,
      method: message.data.method || 'POST',
      headers: message.data.headers || { 'Content-Type': 'application/json' },
      payload: {
        id: message.id,
        type: message.type,
        title: message.title,
        body: message.body,
        timestamp: new Date().toISOString(),
        data: message.data,
        metadata: message.metadata,
      },
      timeout: message.data.timeout || 30000,
    };

    return this.config.providers.webhook!.send(webhookMessage);
  }

  /**
   * Process template with data
   */
  private async processTemplate(message: NotificationMessage): Promise<NotificationMessage> {
    const template = this.templates.get(message.template!);
    if (!template) {
      throw new Error(`Template not found: ${message.template}`);
    }

    const processedBody = this.interpolateTemplate(template.body, message.templateData!);
    const processedTitle = template.title 
      ? this.interpolateTemplate(template.title, message.templateData!)
      : message.title;
    const processedSubject = template.subject
      ? this.interpolateTemplate(template.subject, message.templateData!)
      : message.subject;

    return {
      ...message,
      body: processedBody,
      title: processedTitle,
      subject: processedSubject,
    };
  }

  /**
   * Advanced template interpolation with helper functions
   */
  private interpolateTemplate(template: string, data: Record<string, any>): string {
    return template.replace(/\{\{([^}]+)\}\}/g, (match, expression) => {
      const trimmed = expression.trim();
      
      // Handle simple variables
      if (data[trimmed] !== undefined) {
        return String(data[trimmed]);
      }
      
      // Handle helper functions
      if (trimmed.includes('formatDate(')) {
        const dateMatch = trimmed.match(/formatDate\(([^)]+)\)/);
        if (dateMatch && data[dateMatch[1]]) {
          return new Date(data[dateMatch[1]]).toLocaleDateString();
        }
      }
      
      if (trimmed.includes('formatNumber(')) {
        const numberMatch = trimmed.match(/formatNumber\(([^)]+)\)/);
        if (numberMatch && data[numberMatch[1]]) {
          return Number(data[numberMatch[1]]).toLocaleString();
        }
      }
      
      if (trimmed.includes('upper(')) {
        const upperMatch = trimmed.match(/upper\(([^)]+)\)/);
        if (upperMatch && data[upperMatch[1]]) {
          return String(data[upperMatch[1]]).toUpperCase();
        }
      }
      
      if (trimmed.includes('lower(')) {
        const lowerMatch = trimmed.match(/lower\(([^)]+)\)/);
        if (lowerMatch && data[lowerMatch[1]]) {
          return String(data[lowerMatch[1]]).toLowerCase();
        }
      }

      return match; // Return original if no match found
    });
  }

  /**
   * Track analytics
   */
  private trackAnalytics(analytics: NotificationAnalytics): void {
    this.analytics.push(analytics);
    
    // Keep only last 10,000 entries to prevent memory issues
    if (this.analytics.length > 10000) {
      this.analytics = this.analytics.slice(-10000);
    }
  }

  /**
   * Utility functions
   */
  private stripHtmlTags(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
  }

  private mapPriorityToType(priority: string): 'info' | 'success' | 'warning' | 'error' {
    switch (priority) {
      case 'urgent': return 'error';
      case 'high': return 'warning';
      case 'normal': return 'info';
      case 'low': default: return 'info';
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidPhoneNumber(phone: string): boolean {
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    return phoneRegex.test(phone);
  }

  private checkRateLimit(recipient: string): boolean {
    const now = Date.now();
    const limits = this.rateLimiter.get(recipient) || [];
    
    // Clean old entries
    const oneDayAgo = now - 86400000;
    const oneHourAgo = now - 3600000;
    const oneMinuteAgo = now - 60000;
    
    const filteredLimits = limits.filter(timestamp => timestamp > oneDayAgo);
    this.rateLimiter.set(recipient, filteredLimits);

    // Check limits
    const dailyCount = filteredLimits.length;
    const hourlyCount = filteredLimits.filter(timestamp => timestamp > oneHourAgo).length;
    const minutelyCount = filteredLimits.filter(timestamp => timestamp > oneMinuteAgo).length;

    const { maxPerDay = 100, maxPerHour = 50, maxPerMinute = 5 } = this.config.rateLimiting!;

    return dailyCount < maxPerDay && hourlyCount < maxPerHour && minutelyCount < maxPerMinute;
  }

  private updateRateLimit(recipient: string): void {
    const now = Date.now();
    const limits = this.rateLimiter.get(recipient) || [];
    limits.push(now);
    this.rateLimiter.set(recipient, limits);
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private initializeRateLimiterCleanup(): void {
    // Clean up rate limiter every hour
    setInterval(() => {
      const now = Date.now();
      const oneDayAgo = now - 86400000;
      
      for (const [recipient, timestamps] of this.rateLimiter.entries()) {
        const filtered = timestamps.filter(timestamp => timestamp > oneDayAgo);
        if (filtered.length === 0) {
          this.rateLimiter.delete(recipient);
        } else {
          this.rateLimiter.set(recipient, filtered);
        }
      }
    }, 3600000); // 1 hour
  }
}

export interface NotificationTemplate {
  name: string;
  title?: string;
  subject?: string;
  body: string;
  channels: NotificationChannel[];
  variables: string[];
  description?: string;
  category?: string;
  context?: 'nutrition' | 'economics' | 'health' | 'system' | 'marketing';
  previewData?: Record<string, any>;
}

/**
 * Pre-defined notification templates for various project types
 */
export const UNIVERSAL_TEMPLATES: Record<string, NotificationTemplate> = {
  // Nutrition templates
  welcome_nutrition: {
    name: 'welcome_nutrition',
    subject: 'Welcome to NutriCoach!',
    title: 'Welcome to NutriCoach!',
    body: `
      <h2>Hello {{name}}!</h2>
      <p>Welcome to NutriCoach. We're excited to help you achieve your nutrition goals.</p>
      <p>Your journey to better health starts now!</p>
      <p>Current goal: {{goalType}} - Target: {{targetCalories}} calories/day</p>
    `,
    channels: ['email', 'in_app'],
    variables: ['name', 'goalType', 'targetCalories'],
    category: 'onboarding',
    context: 'nutrition',
    previewData: { name: 'John', goalType: 'Weight Loss', targetCalories: '2000' },
  },
  
  meal_reminder: {
    name: 'meal_reminder',
    title: 'Time for {{mealType}}!',
    body: `
      <p>Don't forget to log your {{mealType}}.</p>
      <p>Staying consistent with tracking helps you reach your goals faster.</p>
      {{#if suggestedMeal}}<p>Suggested: {{suggestedMeal}}</p>{{/if}}
    `,
    channels: ['push', 'in_app'],
    variables: ['mealType', 'suggestedMeal'],
    category: 'reminder',
    context: 'nutrition',
  },

  // Economics templates  
  welcome_economics: {
    name: 'welcome_economics',
    subject: 'Welcome to EconoTracker!',
    title: 'Welcome to EconoTracker!',
    body: `
      <h2>Hello {{name}}!</h2>
      <p>Welcome to EconoTracker. We're here to help you make informed financial decisions.</p>
      <p>Start tracking your portfolio performance and market insights today!</p>
    `,
    channels: ['email', 'in_app'],
    variables: ['name'],
    category: 'onboarding',
    context: 'economics',
  },
  
  market_alert: {
    name: 'market_alert',
    title: '📈 Market Alert: {{symbol}}',
    body: `
      <p><strong>{{symbol}}</strong> has {{direction}} by {{changePercent}}%</p>
      <p>Current price: ${{currentPrice}}</p>
      <p>{{#if recommendation}}Recommendation: {{recommendation}}{{/if}}</p>
    `,
    channels: ['push', 'email', 'in_app'],
    variables: ['symbol', 'direction', 'changePercent', 'currentPrice', 'recommendation'],
    category: 'alert',
    context: 'economics',
  },

  // Universal templates
  system_maintenance: {
    name: 'system_maintenance',
    subject: 'Scheduled Maintenance Notification',
    title: 'System Maintenance',
    body: `
      <h2>Scheduled Maintenance</h2>
      <p>We'll be performing system maintenance on {{date}} from {{startTime}} to {{endTime}}.</p>
      <p>During this time, the service may be temporarily unavailable.</p>
      <p>We apologize for any inconvenience.</p>
    `,
    channels: ['email', 'in_app'],
    variables: ['date', 'startTime', 'endTime'],
    category: 'system',
    context: 'system',
  },

  data_export_ready: {
    name: 'data_export_ready',
    subject: 'Your Data Export is Ready',
    title: 'Data Export Complete',
    body: `
      <h2>Your data export is ready!</h2>
      <p>Export type: {{exportType}}</p>
      <p>Date range: {{dateRange}}</p>
      <p>Download your data using the link below (expires in 24 hours):</p>
      <p><a href="{{downloadUrl}}">Download Now</a></p>
    `,
    channels: ['email', 'in_app'],
    variables: ['exportType', 'dateRange', 'downloadUrl'],
    category: 'data',
    context: 'system',
  },
};

/**
 * Template manager for organizing templates by context
 */
export class TemplateManager {
  private templates = new Map<string, NotificationTemplate>();

  constructor() {
    // Load default templates
    Object.values(UNIVERSAL_TEMPLATES).forEach(template => {
      this.addTemplate(template);
    });
  }

  addTemplate(template: NotificationTemplate): void {
    this.templates.set(template.name, template);
  }

  getTemplate(name: string): NotificationTemplate | undefined {
    return this.templates.get(name);
  }

  getTemplatesByContext(context: string): NotificationTemplate[] {
    return Array.from(this.templates.values()).filter(t => t.context === context);
  }

  getTemplatesByCategory(category: string): NotificationTemplate[] {
    return Array.from(this.templates.values()).filter(t => t.category === category);
  }

  getAllTemplates(): NotificationTemplate[] {
    return Array.from(this.templates.values());
  }

  removeTemplate(name: string): boolean {
    return this.templates.delete(name);
  }

  validateTemplate(template: NotificationTemplate): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!template.name) errors.push('Template name is required');
    if (!template.body) errors.push('Template body is required');
    if (!template.channels || template.channels.length === 0) {
      errors.push('At least one channel is required');
    }

    // Validate variables are used in template
    if (template.variables) {
      const bodyVariables = template.body.match(/\{\{([^}]+)\}\}/g) || [];
      const titleVariables = template.title?.match(/\{\{([^}]+)\}\}/g) || [];
      const subjectVariables = template.subject?.match(/\{\{([^}]+)\}\}/g) || [];
      
      const usedVariables = [
        ...bodyVariables,
        ...titleVariables,
        ...subjectVariables,
      ].map(v => v.replace(/\{\{|\}\}/g, '').trim());

      const unusedVariables = template.variables.filter(v => !usedVariables.includes(v));
      if (unusedVariables.length > 0) {
        errors.push(`Unused variables: ${unusedVariables.join(', ')}`);
      }
    }

    return { valid: errors.length === 0, errors };
  }
}

/**
 * Factory function to create notification service with templates
 */
export const createNotificationService = (config: NotificationConfig): NotificationService => {
  const service = new NotificationService(config);
  const templateManager = new TemplateManager();
  
  // Add all templates to service
  templateManager.getAllTemplates().forEach(template => {
    service.addTemplate(template.name, template);
  });

  return service;
};

/**
 * Factory functions for specific contexts
 */
export const createNutritionNotificationService = (config: NotificationConfig): NotificationService => {
  const service = createNotificationService(config);
  const templateManager = new TemplateManager();
  
  // Add only nutrition-specific templates
  templateManager.getTemplatesByContext('nutrition').forEach(template => {
    service.addTemplate(template.name, template);
  });

  return service;
};

export const createEconomicsNotificationService = (config: NotificationConfig): NotificationService => {
  const service = createNotificationService(config);
  const templateManager = new TemplateManager();
  
  // Add only economics-specific templates
  templateManager.getTemplatesByContext('economics').forEach(template => {
    service.addTemplate(template.name, template);
  });

  return service;
};