import { createClient } from '@/lib/supabase-client';
import { 
  EmailTemplate, 
  SequenceType, 
  TriggerEvent, 
  EMAIL_TEMPLATES,
  SEQUENCE_TYPES,
  TRIGGER_EVENTS 
} from '@/components/email';

// Workflow Engine Types
interface EmailWorkflowStep {
  id: string;
  stepNumber: number;
  delayDays: number;
  delayHours?: number;
  template: EmailTemplate;
  conditions?: WorkflowCondition[];
  abTestVariants?: string[];
}

interface WorkflowCondition {
  type: 'user_segment' | 'profile_field' | 'engagement_score' | 'subscription_status';
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'not_contains';
  value: any;
}

interface EmailWorkflow {
  id: string;
  name: string;
  type: SequenceType;
  triggerEvent: TriggerEvent;
  isActive: boolean;
  targetSegments?: string[];
  excludeSegments?: string[];
  steps: EmailWorkflowStep[];
  metadata?: Record<string, any>;
}

// Predefined Email Workflows
export const EMAIL_WORKFLOWS: EmailWorkflow[] = [
  // Welcome Sequence
  {
    id: 'welcome-sequence',
    name: 'Séquence de bienvenue',
    type: SEQUENCE_TYPES.WELCOME,
    triggerEvent: TRIGGER_EVENTS.USER_SIGNUP,
    isActive: true,
    steps: [
      {
        id: 'welcome-immediate',
        stepNumber: 1,
        delayDays: 0,
        delayHours: 0,
        template: EMAIL_TEMPLATES.WELCOME
      }
    ]
  },

  // Onboarding Sequence (5 steps over 3 weeks)
  {
    id: 'onboarding-sequence',
    name: 'Parcours d\'intégration',
    type: SEQUENCE_TYPES.ONBOARDING,
    triggerEvent: TRIGGER_EVENTS.USER_SIGNUP,
    isActive: true,
    steps: [
      {
        id: 'onboarding-day-1',
        stepNumber: 1,
        delayDays: 1,
        template: EMAIL_TEMPLATES.ONBOARDING_STEP_1,
        conditions: [
          {
            type: 'profile_field',
            operator: 'less_than',
            value: 80 // Profile completeness percentage
          }
        ]
      },
      {
        id: 'onboarding-day-3',
        stepNumber: 2,
        delayDays: 3,
        template: EMAIL_TEMPLATES.ONBOARDING_STEP_2
      },
      {
        id: 'onboarding-day-7',
        stepNumber: 3,
        delayDays: 7,
        template: EMAIL_TEMPLATES.ONBOARDING_STEP_3
      },
      {
        id: 'onboarding-day-14',
        stepNumber: 4,
        delayDays: 14,
        template: EMAIL_TEMPLATES.ONBOARDING_STEP_4
      },
      {
        id: 'onboarding-day-21',
        stepNumber: 5,
        delayDays: 21,
        template: EMAIL_TEMPLATES.ONBOARDING_STEP_5
      }
    ]
  },

  // Engagement Recovery Sequence
  {
    id: 'engagement-recovery-7d',
    name: 'Réactivation - 7 jours d\'inactivité',
    type: SEQUENCE_TYPES.ENGAGEMENT,
    triggerEvent: TRIGGER_EVENTS.INACTIVITY_7_DAYS,
    isActive: true,
    targetSegments: ['all_users'],
    excludeSegments: ['highly_engaged'],
    steps: [
      {
        id: 'inactive-7d-reminder',
        stepNumber: 1,
        delayDays: 0,
        template: EMAIL_TEMPLATES.REMINDER_INACTIVE_7D,
        abTestVariants: ['variant_a', 'variant_b']
      }
    ]
  },

  {
    id: 'engagement-recovery-14d',
    name: 'Réactivation - 14 jours d\'inactivité',
    type: SEQUENCE_TYPES.ENGAGEMENT,
    triggerEvent: TRIGGER_EVENTS.INACTIVITY_14_DAYS,
    isActive: true,
    targetSegments: ['all_users'],
    excludeSegments: ['highly_engaged'],
    steps: [
      {
        id: 'inactive-14d-reminder',
        stepNumber: 1,
        delayDays: 0,
        template: EMAIL_TEMPLATES.REMINDER_INACTIVE_14D
      },
      {
        id: 'inactive-14d-survey',
        stepNumber: 2,
        delayDays: 3,
        template: EMAIL_TEMPLATES.REMINDER_WEEKLY_CHECKIN,
        conditions: [
          {
            type: 'engagement_score',
            operator: 'less_than',
            value: 0.3
          }
        ]
      }
    ]
  },

  // Trial Conversion Sequence
  {
    id: 'trial-conversion',
    name: 'Conversion d\'essai',
    type: SEQUENCE_TYPES.TRIAL_CONVERSION,
    triggerEvent: TRIGGER_EVENTS.TRIAL_ENDING,
    isActive: true,
    targetSegments: ['trial_users'],
    steps: [
      {
        id: 'trial-ending-3d',
        stepNumber: 1,
        delayDays: 0,
        template: EMAIL_TEMPLATES.REMINDER_TRIAL_ENDING
      },
      {
        id: 'trial-ending-1d',
        stepNumber: 2,
        delayDays: 2,
        template: EMAIL_TEMPLATES.REMINDER_TRIAL_ENDING,
        abTestVariants: ['urgent_variant', 'benefit_variant']
      }
    ]
  },

  // Retention Sequence
  {
    id: 'retention-weekly',
    name: 'Rétention hebdomadaire',
    type: SEQUENCE_TYPES.RETENTION,
    triggerEvent: TRIGGER_EVENTS.SUBSCRIPTION_START,
    isActive: true,
    targetSegments: ['premium_users'],
    steps: [
      {
        id: 'weekly-checkin',
        stepNumber: 1,
        delayDays: 7,
        template: EMAIL_TEMPLATES.REMINDER_WEEKLY_CHECKIN
      }
    ]
  }
];

// Workflow Engine Class
export class EmailWorkflowEngine {
  private supabase;

  constructor() {
    this.supabase = createClient();
  }

  /**
   * Trigger a workflow for a specific user
   */
  async triggerWorkflow(userId: string, triggerEvent: TriggerEvent, metadata?: Record<string, any>) {
    try {
      // Get user profile and segments
      const userSegments = await this.getUserSegments(userId);
      
      // Find matching workflows
      const matchingWorkflows = EMAIL_WORKFLOWS.filter(workflow => 
        workflow.triggerEvent === triggerEvent && 
        workflow.isActive &&
        this.isUserEligible(userSegments, workflow)
      );

      const subscriptionsCreated: string[] = [];

      for (const workflow of matchingWorkflows) {
        // Check if user is already subscribed to this workflow
        const existingSubscription = await this.supabase
          .from('user_sequence_subscriptions')
          .select('id')
          .eq('user_id', userId)
          .eq('sequence_id', workflow.id)
          .single();

        if (!existingSubscription.data) {
          // Create workflow sequence in database if not exists
          await this.ensureSequenceExists(workflow);

          // Subscribe user to workflow
          const { data: subscription, error } = await this.supabase
            .from('user_sequence_subscriptions')
            .insert({
              user_id: userId,
              sequence_id: workflow.id,
              triggered_by: triggerEvent,
              next_email_scheduled_at: this.calculateNextEmailTime(workflow.steps[0]),
              status: 'active'
            })
            .select()
            .single();

          if (error) {
            console.error('Error creating workflow subscription:', error);
            continue;
          }

          subscriptionsCreated.push(subscription.id);

          // Schedule first step immediately if delayDays is 0
          if (workflow.steps[0].delayDays === 0) {
            await this.scheduleEmailStep(userId, workflow, workflow.steps[0]);
          }
        }
      }

      return { success: true, subscriptionsCreated };
    } catch (error) {
      console.error('Error triggering workflow:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Process scheduled workflow emails
   */
  async processScheduledWorkflows() {
    try {
      // Get subscriptions that need their next email
      const { data: subscriptions, error } = await this.supabase
        .from('user_sequence_subscriptions')
        .select(`
          *,
          email_sequences!inner(*)
        `)
        .eq('status', 'active')
        .not('next_email_scheduled_at', 'is', null)
        .lte('next_email_scheduled_at', new Date().toISOString());

      if (error) {
        console.error('Error fetching scheduled subscriptions:', error);
        return { success: false, error: error.message };
      }

      let processedCount = 0;

      for (const subscription of subscriptions || []) {
        await this.processSubscriptionStep(subscription);
        processedCount++;
      }

      return { success: true, processedCount };
    } catch (error) {
      console.error('Error processing scheduled workflows:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Calculate user engagement score
   */
  async calculateEngagementScore(userId: string): Promise<number> {
    try {
      const { data, error } = await this.supabase
        .rpc('calculate_engagement_score', { p_user_id: userId });

      if (error) {
        console.error('Error calculating engagement score:', error);
        return 0;
      }

      return data || 0;
    } catch (error) {
      console.error('Error calculating engagement score:', error);
      return 0;
    }
  }

  /**
   * Get user segments for targeting
   */
  async getUserSegments(userId: string): Promise<string[]> {
    try {
      const { data, error } = await this.supabase
        .rpc('get_user_segments', { p_user_id: userId });

      if (error) {
        console.error('Error getting user segments:', error);
        return ['all_users'];
      }

      return data || ['all_users'];
    } catch (error) {
      console.error('Error getting user segments:', error);
      return ['all_users'];
    }
  }

  /**
   * Check if user is eligible for workflow
   */
  private isUserEligible(userSegments: string[], workflow: EmailWorkflow): boolean {
    // Check target segments
    if (workflow.targetSegments && workflow.targetSegments.length > 0) {
      const hasTargetSegment = workflow.targetSegments.some(segment => 
        userSegments.includes(segment)
      );
      if (!hasTargetSegment) return false;
    }

    // Check exclude segments
    if (workflow.excludeSegments && workflow.excludeSegments.length > 0) {
      const hasExcludeSegment = workflow.excludeSegments.some(segment => 
        userSegments.includes(segment)
      );
      if (hasExcludeSegment) return false;
    }

    return true;
  }

  /**
   * Ensure workflow sequence exists in database
   */
  private async ensureSequenceExists(workflow: EmailWorkflow) {
    const { data: existing } = await this.supabase
      .from('email_sequences')
      .select('id')
      .eq('id', workflow.id)
      .single();

    if (!existing) {
      // Create sequence
      await this.supabase
        .from('email_sequences')
        .insert({
          id: workflow.id,
          name: workflow.name,
          type: workflow.type,
          trigger_event: workflow.triggerEvent,
          status: workflow.isActive ? 'active' : 'paused',
          target_segments: workflow.targetSegments,
          exclude_segments: workflow.excludeSegments
        });

      // Create sequence steps
      for (const step of workflow.steps) {
        await this.supabase
          .from('email_sequence_steps')
          .insert({
            id: step.id,
            sequence_id: workflow.id,
            step_number: step.stepNumber,
            name: `Step ${step.stepNumber}`,
            delay_days: step.delayDays,
            delay_hours: step.delayHours || 0,
            subject_line: this.getTemplateSubject(step.template),
            html_content: this.getTemplateContent(step.template),
            text_content: this.getTemplateTextContent(step.template)
          });
      }
    }
  }

  /**
   * Schedule an email step
   */
  private async scheduleEmailStep(userId: string, workflow: EmailWorkflow, step: EmailWorkflowStep) {
    // Get user email
    const { data: user } = await this.supabase
      .from('user_profiles')
      .select('email, full_name')
      .eq('id', userId)
      .single();

    if (!user) return;

    // Calculate scheduled time
    const scheduledAt = this.calculateNextEmailTime(step);

    // Add to email queue
    await this.supabase
      .from('email_queue')
      .insert({
        user_id: userId,
        recipient_email: user.email,
        sequence_id: workflow.id,
        sequence_step_id: step.id,
        subject_line: await this.personalizeSubject(step.template, user),
        html_content: await this.personalizeContent(step.template, user),
        text_content: await this.personalizeTextContent(step.template, user),
        scheduled_at: scheduledAt.toISOString(),
        priority: 3 // Medium priority for sequence emails
      });
  }

  /**
   * Process a single subscription step
   */
  private async processSubscriptionStep(subscription: any) {
    const workflow = EMAIL_WORKFLOWS.find(w => w.id === subscription.sequence_id);
    if (!workflow) return;

    const nextStepNumber = subscription.current_step + 1;
    const nextStep = workflow.steps.find(s => s.stepNumber === nextStepNumber);

    if (nextStep) {
      // Check step conditions
      if (await this.checkStepConditions(subscription.user_id, nextStep)) {
        await this.scheduleEmailStep(subscription.user_id, workflow, nextStep);

        // Update subscription progress
        const nextNextStep = workflow.steps.find(s => s.stepNumber === nextStepNumber + 1);
        await this.supabase
          .from('user_sequence_subscriptions')
          .update({
            current_step: nextStepNumber,
            last_email_sent_at: new Date().toISOString(),
            next_email_scheduled_at: nextNextStep 
              ? this.calculateNextEmailTime(nextNextStep, nextStepNumber).toISOString()
              : null,
            emails_sent: subscription.emails_sent + 1
          })
          .eq('id', subscription.id);
      }
    } else {
      // No more steps, complete the sequence
      await this.supabase
        .from('user_sequence_subscriptions')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', subscription.id);
    }
  }

  /**
   * Check if step conditions are met
   */
  private async checkStepConditions(userId: string, step: EmailWorkflowStep): Promise<boolean> {
    if (!step.conditions || step.conditions.length === 0) {
      return true;
    }

    for (const condition of step.conditions) {
      const conditionMet = await this.evaluateCondition(userId, condition);
      if (!conditionMet) {
        return false;
      }
    }

    return true;
  }

  /**
   * Evaluate a single condition
   */
  private async evaluateCondition(userId: string, condition: WorkflowCondition): Promise<boolean> {
    switch (condition.type) {
      case 'user_segment':
        const segments = await this.getUserSegments(userId);
        return this.evaluateOperator(segments, condition.operator, condition.value);

      case 'engagement_score':
        const score = await this.calculateEngagementScore(userId);
        return this.evaluateOperator(score, condition.operator, condition.value);

      case 'profile_field':
        // This would check profile completeness or other fields
        const { data: profile } = await this.supabase
          .from('user_profiles')
          .select('*')
          .eq('id', userId)
          .single();
        
        if (profile) {
          // Calculate profile completeness
          const completeness = this.calculateProfileCompleteness(profile);
          return this.evaluateOperator(completeness, condition.operator, condition.value);
        }
        return false;

      default:
        return true;
    }
  }

  /**
   * Evaluate operator conditions
   */
  private evaluateOperator(value: any, operator: string, targetValue: any): boolean {
    switch (operator) {
      case 'equals':
        return value === targetValue;
      case 'not_equals':
        return value !== targetValue;
      case 'greater_than':
        return value > targetValue;
      case 'less_than':
        return value < targetValue;
      case 'contains':
        return Array.isArray(value) ? value.includes(targetValue) : String(value).includes(targetValue);
      case 'not_contains':
        return Array.isArray(value) ? !value.includes(targetValue) : !String(value).includes(targetValue);
      default:
        return true;
    }
  }

  /**
   * Calculate profile completeness percentage
   */
  private calculateProfileCompleteness(profile: any): number {
    const requiredFields = [
      'full_name', 'age', 'gender', 'height_cm', 'weight_kg', 
      'activity_level', 'primary_goal', 'dietary_preferences'
    ];
    
    const completedFields = requiredFields.filter(field => 
      profile[field] && 
      (Array.isArray(profile[field]) ? profile[field].length > 0 : true)
    );
    
    return Math.round((completedFields.length / requiredFields.length) * 100);
  }

  /**
   * Calculate next email time based on step configuration
   */
  private calculateNextEmailTime(step: EmailWorkflowStep, fromStepNumber?: number): Date {
    const now = new Date();
    const scheduledTime = new Date(now);
    
    scheduledTime.setDate(scheduledTime.getDate() + step.delayDays);
    scheduledTime.setHours(10, 0, 0, 0); // 10 AM optimal send time
    
    if (step.delayHours) {
      scheduledTime.setHours(scheduledTime.getHours() + step.delayHours);
    }
    
    return scheduledTime;
  }

  /**
   * Template content helpers (these would interface with your template system)
   */
  private getTemplateSubject(template: EmailTemplate): string {
    // This would return the appropriate subject line for the template
    const subjects = {
      [EMAIL_TEMPLATES.WELCOME]: "Bienvenue chez NutriCoach ! 🌱",
      [EMAIL_TEMPLATES.ONBOARDING_STEP_1]: "Jour 1 : Complétez votre profil nutritionnel",
      [EMAIL_TEMPLATES.ONBOARDING_STEP_2]: "Jour 3 : Générez votre premier menu IA",
      [EMAIL_TEMPLATES.ONBOARDING_STEP_3]: "Jour 7 : Explorez vos recettes personnalisées",
      [EMAIL_TEMPLATES.ONBOARDING_STEP_4]: "Jour 14 : Optimisez vos résultats",
      [EMAIL_TEMPLATES.ONBOARDING_STEP_5]: "Jour 21 : Passez au niveau supérieur",
      [EMAIL_TEMPLATES.REMINDER_INACTIVE_7D]: "On vous a manqué ! 🌱 Reprenez votre parcours nutrition",
      [EMAIL_TEMPLATES.REMINDER_INACTIVE_14D]: "⚠️ Votre transformation nutrition est en pause",
      [EMAIL_TEMPLATES.REMINDER_TRIAL_ENDING]: "⏳ Votre essai se termine bientôt"
    };
    
    return subjects[template] || "NutriCoach";
  }

  private getTemplateContent(template: EmailTemplate): string {
    // This would return the HTML content for the template
    return `<p>Template content for ${template}</p>`;
  }

  private getTemplateTextContent(template: EmailTemplate): string {
    // This would return the text content for the template
    return `Template text content for ${template}`;
  }

  private async personalizeSubject(template: EmailTemplate, user: any): Promise<string> {
    const baseSubject = this.getTemplateSubject(template);
    const firstName = user.full_name?.split(' ')[0] || '';
    
    return baseSubject.replace('{{firstName}}', firstName);
  }

  private async personalizeContent(template: EmailTemplate, user: any): Promise<string> {
    // This would personalize the HTML content
    return this.getTemplateContent(template);
  }

  private async personalizeTextContent(template: EmailTemplate, user: any): Promise<string> {
    // This would personalize the text content
    return this.getTemplateTextContent(template);
  }
}

// Export singleton instance
export const emailWorkflowEngine = new EmailWorkflowEngine();