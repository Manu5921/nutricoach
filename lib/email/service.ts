import { Resend } from 'resend';
import { createClient } from '@/lib/supabase-client';
import { 
  WelcomeEmail,
  OnboardingEmail,
  NewsletterEmail,
  ReminderEmail,
  EmailUser,
  EMAIL_TEMPLATES,
  EMAIL_EVENTS,
  EmailEventType
} from '@/components/email';
import { render } from '@react-email/render';

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

interface EmailSendOptions {
  from?: string;
  replyTo?: string;
  tags?: string[];
  headers?: Record<string, string>;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

interface EmailQueueItem {
  id: string;
  user_id: string;
  recipient_email: string;
  subject_line: string;
  html_content: string;
  text_content?: string;
  campaign_id?: string;
  sequence_id?: string;
  sequence_step_id?: string;
  scheduled_at: string;
  priority: number;
  status: string;
}

interface EmailAnalytics {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  unsubscribed: number;
  complained: number;
}

export class EmailService {
  private supabase;
  private baseUrl: string;

  constructor() {
    this.supabase = createClient();
    this.baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://nutricoach.app';
  }

  /**
   * Send Welcome Email
   */
  async sendWelcomeEmail(
    user: EmailUser, 
    confirmEmailUrl?: string,
    options: EmailSendOptions = {}
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const unsubscribeUrl = await this.generateUnsubscribeUrl(user.email);
      const webviewUrl = `${this.baseUrl}/email/welcome/${encodeURIComponent(user.email)}`;

      const emailHtml = render(WelcomeEmail({
        user,
        confirmEmailUrl,
        unsubscribeUrl,
        webviewUrl
      }));

      const result = await resend.emails.send({
        from: options.from || 'NutriCoach <noreply@nutricoach.app>',
        to: user.email,
        subject: `Bienvenue chez NutriCoach ! 🌱`,
        html: emailHtml,
        replyTo: options.replyTo || 'support@nutricoach.app',
        tags: [...(options.tags || []), 'welcome', 'onboarding'],
        headers: {
          'X-Email-Type': 'welcome',
          'X-Priority': 'high',
          ...options.headers
        }
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

      // Track email event
      await this.trackEmailEvent(
        user.email,
        EMAIL_EVENTS.SENT,
        { template: EMAIL_TEMPLATES.WELCOME, messageId: result.data?.id }
      );

      return { success: true, messageId: result.data?.id };
    } catch (error) {
      console.error('Error sending welcome email:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send Onboarding Email
   */
  async sendOnboardingEmail(
    user: EmailUser,
    stepNumber: 1 | 2 | 3 | 4 | 5,
    options: EmailSendOptions = {}
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const unsubscribeUrl = await this.generateUnsubscribeUrl(user.email);
      const webviewUrl = `${this.baseUrl}/email/onboarding/${stepNumber}/${encodeURIComponent(user.email)}`;

      const emailHtml = render(OnboardingEmail({
        user,
        stepNumber,
        unsubscribeUrl,
        webviewUrl
      }));

      const stepTitles = {
        1: "Complétez votre profil nutritionnel",
        2: "Générez votre premier menu IA", 
        3: "Explorez vos recettes personnalisées",
        4: "Optimisez vos résultats",
        5: "Passez au niveau supérieur"
      };

      const result = await resend.emails.send({
        from: options.from || 'NutriCoach <noreply@nutricoach.app>',
        to: user.email,
        subject: `Jour ${stepNumber === 1 ? '1' : stepNumber === 2 ? '3' : stepNumber === 3 ? '7' : stepNumber === 4 ? '14' : '21'} : ${stepTitles[stepNumber]}`,
        html: emailHtml,
        replyTo: options.replyTo || 'support@nutricoach.app',
        tags: [...(options.tags || []), 'onboarding', `step-${stepNumber}`],
        headers: {
          'X-Email-Type': 'onboarding',
          'X-Onboarding-Step': stepNumber.toString(),
          ...options.headers
        }
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

      // Track email event
      await this.trackEmailEvent(
        user.email,
        EMAIL_EVENTS.SENT,
        { 
          template: `onboarding_step_${stepNumber}`,
          stepNumber,
          messageId: result.data?.id 
        }
      );

      return { success: true, messageId: result.data?.id };
    } catch (error) {
      console.error('Error sending onboarding email:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send Newsletter Email
   */
  async sendNewsletterEmail(
    user: EmailUser,
    newsletterData: {
      week: number;
      year: number;
      featuredRecipes: any[];
      healthTips: any[];
      personalizedContent?: any;
    },
    options: EmailSendOptions = {}
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const unsubscribeUrl = await this.generateUnsubscribeUrl(user.email);
      const webviewUrl = `${this.baseUrl}/email/newsletter/${newsletterData.week}/${newsletterData.year}/${encodeURIComponent(user.email)}`;

      const emailHtml = render(NewsletterEmail({
        user,
        ...newsletterData,
        unsubscribeUrl,
        webviewUrl
      }));

      const result = await resend.emails.send({
        from: options.from || 'NutriCoach Newsletter <newsletter@nutricoach.app>',
        to: user.email,
        subject: `Newsletter NutriCoach - Semaine ${newsletterData.week} : Nouvelles recettes anti-inflammatoires`,
        html: emailHtml,
        replyTo: options.replyTo || 'support@nutricoach.app',
        tags: [...(options.tags || []), 'newsletter', `week-${newsletterData.week}`],
        headers: {
          'X-Email-Type': 'newsletter',
          'X-Newsletter-Week': newsletterData.week.toString(),
          'X-Newsletter-Year': newsletterData.year.toString(),
          ...options.headers
        }
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

      // Track email event
      await this.trackEmailEvent(
        user.email,
        EMAIL_EVENTS.SENT,
        { 
          template: EMAIL_TEMPLATES.NEWSLETTER_WEEKLY,
          week: newsletterData.week,
          year: newsletterData.year,
          messageId: result.data?.id 
        }
      );

      return { success: true, messageId: result.data?.id };
    } catch (error) {
      console.error('Error sending newsletter email:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send Reminder Email
   */
  async sendReminderEmail(
    user: EmailUser,
    reminderType: 'inactive_7_days' | 'inactive_14_days' | 'profile_incomplete' | 'trial_ending' | 'menu_suggestion' | 'weekly_checkin',
    personalizedData?: any,
    options: EmailSendOptions = {}
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const unsubscribeUrl = await this.generateUnsubscribeUrl(user.email);
      const webviewUrl = `${this.baseUrl}/email/reminder/${reminderType}/${encodeURIComponent(user.email)}`;

      const emailHtml = render(ReminderEmail({
        user,
        type: reminderType,
        personalizedData,
        unsubscribeUrl,
        webviewUrl
      }));

      const subjects = {
        inactive_7_days: "On vous a manqué ! 🌱 Reprenez votre parcours nutrition",
        inactive_14_days: "⚠️ Votre transformation nutrition est en pause",
        profile_incomplete: "🎯 Complétez votre profil pour de meilleures recommandations",
        trial_ending: "⏳ Votre essai se termine bientôt - Ne perdez pas vos progrès !",
        menu_suggestion: "🍽️ Votre menu personnalisé du jour vous attend !",
        weekly_checkin: "📊 Votre bilan nutrition de la semaine"
      };

      const result = await resend.emails.send({
        from: options.from || 'NutriCoach <noreply@nutricoach.app>',
        to: user.email,
        subject: subjects[reminderType],
        html: emailHtml,
        replyTo: options.replyTo || 'support@nutricoach.app',
        tags: [...(options.tags || []), 'reminder', reminderType],
        headers: {
          'X-Email-Type': 'reminder',
          'X-Reminder-Type': reminderType,
          ...options.headers
        }
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

      // Track email event
      await this.trackEmailEvent(
        user.email,
        EMAIL_EVENTS.SENT,
        { 
          template: `reminder_${reminderType}`,
          reminderType,
          messageId: result.data?.id 
        }
      );

      return { success: true, messageId: result.data?.id };
    } catch (error) {
      console.error('Error sending reminder email:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Process Email Queue
   */
  async processEmailQueue(batchSize: number = 50): Promise<{ success: boolean; processed: number; errors: any[] }> {
    try {
      // Get queued emails ready to send
      const { data: queuedEmails, error } = await this.supabase
        .from('email_queue')
        .select('*')
        .eq('status', 'queued')
        .lte('scheduled_at', new Date().toISOString())
        .order('priority', { ascending: false })
        .order('scheduled_at', { ascending: true })
        .limit(batchSize);

      if (error) {
        throw new Error(error.message);
      }

      const processed = [];
      const errors = [];

      for (const email of queuedEmails || []) {
        try {
          // Mark as processing
          await this.updateEmailStatus(email.id, 'processing');

          // Send email via Resend
          const result = await resend.emails.send({
            from: 'NutriCoach <noreply@nutricoach.app>',
            to: email.recipient_email,
            subject: email.subject_line,
            html: email.html_content,
            text: email.text_content || undefined,
            tags: this.getEmailTags(email),
            headers: {
              'X-Queue-ID': email.id,
              'X-User-ID': email.user_id
            }
          });

          if (result.error) {
            throw new Error(result.error.message);
          }

          // Mark as sent and update with provider message ID
          await this.updateEmailStatus(email.id, 'sent', {
            provider_message_id: result.data?.id,
            sent_at: new Date().toISOString()
          });

          // Track email event
          await this.trackEmailEvent(
            email.recipient_email,
            EMAIL_EVENTS.SENT,
            { 
              queueId: email.id,
              messageId: result.data?.id,
              campaignId: email.campaign_id,
              sequenceId: email.sequence_id,
              sequenceStepId: email.sequence_step_id
            }
          );

          processed.push(email.id);

        } catch (emailError) {
          console.error(`Error sending email ${email.id}:`, emailError);
          
          // Mark as failed and increment retry count
          await this.updateEmailStatus(email.id, 'failed', {
            error_message: emailError.message,
            retry_count: (email.retry_count || 0) + 1,
            next_retry_at: this.calculateNextRetry(email.retry_count || 0)
          });

          errors.push({
            emailId: email.id,
            error: emailError.message
          });
        }
      }

      return { success: true, processed: processed.length, errors };
    } catch (error) {
      console.error('Error processing email queue:', error);
      return { success: false, processed: 0, errors: [{ error: error.message }] };
    }
  }

  /**
   * Handle Email Webhooks from Resend
   */
  async handleWebhook(payload: any): Promise<{ success: boolean }> {
    try {
      const { type, data } = payload;

      if (!data?.email_id) {
        return { success: false };
      }

      // Find the email in our queue by provider message ID
      const { data: queueItem } = await this.supabase
        .from('email_queue')
        .select('*')
        .eq('provider_message_id', data.email_id)
        .single();

      if (!queueItem) {
        console.warn('Email not found in queue:', data.email_id);
        return { success: true }; // Don't fail for unknown emails
      }

      // Map Resend webhook events to our email events
      const eventMapping = {
        'email.delivered': EMAIL_EVENTS.DELIVERED,
        'email.opened': EMAIL_EVENTS.OPENED,
        'email.clicked': EMAIL_EVENTS.CLICKED,
        'email.bounced': EMAIL_EVENTS.BOUNCED,
        'email.complained': EMAIL_EVENTS.COMPLAINED
      };

      const eventType = eventMapping[type];
      if (!eventType) {
        return { success: true }; // Ignore unknown event types
      }

      // Track the event
      await this.trackEmailEvent(
        queueItem.recipient_email,
        eventType,
        {
          queueId: queueItem.id,
          messageId: data.email_id,
          campaignId: queueItem.campaign_id,
          sequenceId: queueItem.sequence_id,
          sequenceStepId: queueItem.sequence_step_id,
          webhookData: data
        }
      );

      // Update queue item status for certain events
      if (eventType === EMAIL_EVENTS.DELIVERED) {
        await this.updateEmailStatus(queueItem.id, 'sent', {
          delivered_at: new Date().toISOString()
        });
      } else if (eventType === EMAIL_EVENTS.OPENED && !queueItem.opened_at) {
        await this.updateEmailStatus(queueItem.id, 'sent', {
          opened_at: new Date().toISOString()
        });
      } else if (eventType === EMAIL_EVENTS.CLICKED && !queueItem.first_click_at) {
        await this.updateEmailStatus(queueItem.id, 'sent', {
          first_click_at: new Date().toISOString()
        });
      }

      return { success: true };
    } catch (error) {
      console.error('Error handling email webhook:', error);
      return { success: false };
    }
  }

  /**
   * Generate unsubscribe URL with token
   */
  private async generateUnsubscribeUrl(email: string): Promise<string> {
    // Get or create unsubscribe token
    const { data: preferences } = await this.supabase
      .from('email_preferences')
      .select('unsubscribe_token')
      .eq('user_id', (
        await this.supabase
          .from('user_profiles')
          .select('id')
          .eq('email', email)
          .single()
      ).data?.id)
      .single();

    const token = preferences?.unsubscribe_token || 'default-token';
    return `${this.baseUrl}/unsubscribe?token=${encodeURIComponent(token)}`;
  }

  /**
   * Track email event in database
   */
  private async trackEmailEvent(
    recipientEmail: string,
    eventType: EmailEventType,
    eventData: any = {}
  ): Promise<void> {
    try {
      // Get user ID from email
      const { data: user } = await this.supabase
        .from('user_profiles')
        .select('id')
        .eq('email', recipientEmail)
        .single();

      await this.supabase
        .from('email_events')
        .insert({
          queue_id: eventData.queueId,
          campaign_id: eventData.campaignId,
          sequence_id: eventData.sequenceId,
          sequence_step_id: eventData.sequenceStepId,
          user_id: user?.id,
          recipient_email: recipientEmail,
          event_type: eventType,
          event_data: eventData,
          provider_event_id: eventData.messageId,
          provider_timestamp: new Date().toISOString()
        });

      // Update email preferences statistics
      if (user?.id) {
        await this.updateEmailPreferencesStats(user.id, eventType);
      }
    } catch (error) {
      console.error('Error tracking email event:', error);
    }
  }

  /**
   * Update email preferences statistics
   */
  private async updateEmailPreferencesStats(userId: string, eventType: EmailEventType): Promise<void> {
    const incrementField = {
      [EMAIL_EVENTS.SENT]: 'total_emails_sent',
      [EMAIL_EVENTS.OPENED]: 'total_emails_opened',
      [EMAIL_EVENTS.CLICKED]: 'total_clicks'
    }[eventType];

    if (incrementField) {
      await this.supabase.rpc('increment_email_stat', {
        user_id: userId,
        stat_field: incrementField
      });

      // Update last engagement time for engagement events
      if (eventType === EMAIL_EVENTS.OPENED || eventType === EMAIL_EVENTS.CLICKED) {
        await this.supabase
          .from('email_preferences')
          .update({ last_engagement_at: new Date().toISOString() })
          .eq('user_id', userId);
      }
    }
  }

  /**
   * Update email queue item status
   */
  private async updateEmailStatus(
    emailId: string,
    status: string,
    additionalFields: Record<string, any> = {}
  ): Promise<void> {
    await this.supabase
      .from('email_queue')
      .update({
        status,
        updated_at: new Date().toISOString(),
        ...additionalFields
      })
      .eq('id', emailId);
  }

  /**
   * Calculate next retry time for failed emails
   */
  private calculateNextRetry(retryCount: number): string {
    // Exponential backoff: 1h, 4h, 24h
    const delays = [1, 4, 24]; // hours
    const delayHours = delays[Math.min(retryCount, delays.length - 1)];
    
    const nextRetry = new Date();
    nextRetry.setHours(nextRetry.getHours() + delayHours);
    
    return nextRetry.toISOString();
  }

  /**
   * Get email tags for categorization
   */
  private getEmailTags(email: EmailQueueItem): string[] {
    const tags = ['nutricoach'];
    
    if (email.campaign_id) {
      tags.push('campaign', `campaign-${email.campaign_id}`);
    }
    
    if (email.sequence_id) {
      tags.push('sequence', `sequence-${email.sequence_id}`);
    }
    
    tags.push(`priority-${email.priority}`);
    
    return tags;
  }

  /**
   * Get Email Analytics
   */
  async getEmailAnalytics(
    startDate: Date,
    endDate: Date,
    filters?: {
      campaignId?: string;
      sequenceId?: string;
      userId?: string;
    }
  ): Promise<EmailAnalytics> {
    try {
      let query = this.supabase
        .from('email_events')
        .select('event_type')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (filters?.campaignId) {
        query = query.eq('campaign_id', filters.campaignId);
      }
      if (filters?.sequenceId) {
        query = query.eq('sequence_id', filters.sequenceId);
      }
      if (filters?.userId) {
        query = query.eq('user_id', filters.userId);
      }

      const { data: events } = await query;

      const analytics: EmailAnalytics = {
        sent: 0,
        delivered: 0,
        opened: 0,
        clicked: 0,
        bounced: 0,
        unsubscribed: 0,
        complained: 0
      };

      events?.forEach(event => {
        switch (event.event_type) {
          case EMAIL_EVENTS.SENT:
            analytics.sent++;
            break;
          case EMAIL_EVENTS.DELIVERED:
            analytics.delivered++;
            break;
          case EMAIL_EVENTS.OPENED:
            analytics.opened++;
            break;
          case EMAIL_EVENTS.CLICKED:
            analytics.clicked++;
            break;
          case EMAIL_EVENTS.BOUNCED:
            analytics.bounced++;
            break;
          case EMAIL_EVENTS.UNSUBSCRIBED:
            analytics.unsubscribed++;
            break;
          case EMAIL_EVENTS.COMPLAINED:
            analytics.complained++;
            break;
        }
      });

      return analytics;
    } catch (error) {
      console.error('Error getting email analytics:', error);
      return {
        sent: 0,
        delivered: 0,
        opened: 0,
        clicked: 0,
        bounced: 0,
        unsubscribed: 0,
        complained: 0
      };
    }
  }
}

// Export singleton instance
export const emailService = new EmailService();