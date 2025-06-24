/**
 * Notification System Module
 * Multi-channel notification service (email, push, SMS, in-app)
 */

export {
  NotificationService,
  createNotificationService,
  type NotificationChannel,
  type BaseNotification,
  type EmailNotification,
  type PushNotification,
  type SMSNotification,
  type InAppNotification,
  type NotificationRecipient,
  type NotificationPreferences,
  type NotificationTemplate,
  type NotificationRule,
  type NotificationStats,
  type NotificationServiceConfig,
  type EmailAttachment,
} from './notification-service.js';