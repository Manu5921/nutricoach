// Email Template Components
export { default as EmailLayout } from './EmailLayout';
export { default as WelcomeEmail } from './WelcomeEmail';
export { default as OnboardingEmail } from './OnboardingEmail';
export { default as NewsletterEmail } from './NewsletterEmail';
export { default as ReminderEmail } from './ReminderEmail';

// Email Template Types
export interface EmailUser {
  fullName?: string;
  email: string;
}

export interface BaseEmailProps {
  user: EmailUser;
  unsubscribeUrl?: string;
  webviewUrl?: string;
}

// Email Template Variants for A/B Testing
export const EMAIL_VARIANTS = {
  welcome: {
    subject_lines: [
      "Bienvenue chez NutriCoach ! 🌱 Votre transformation commence maintenant",
      "🎉 Votre coach nutrition IA vous attend - Commençons !",
      "Bonjour {{firstName}} ! Prêt à révolutionner votre alimentation ?"
    ],
    cta_buttons: [
      "Commencer mon parcours",
      "Découvrir NutriCoach",
      "Générer mon premier menu"
    ]
  },
  onboarding: {
    subject_lines: [
      "Jour {{stepNumber}} : {{stepTitle}} - Continuez votre parcours",
      "{{emoji}} Étape {{stepNumber}} : {{stepTitle}}",
      "Votre progression NutriCoach - Étape {{stepNumber}}"
    ]
  },
  newsletter: {
    subject_lines: [
      "Newsletter NutriCoach - Semaine {{week}} : Nouvelles recettes anti-inflammatoires",
      "🌿 Votre dose hebdomadaire de nutrition et bien-être",
      "Cette semaine chez NutriCoach : Recettes, conseils et progrès"
    ]
  },
  reminder: {
    subject_lines: {
      inactive_7_days: [
        "On vous a manqué ! 🌱 Reprenez votre parcours nutrition",
        "{{firstName}}, votre transformation nutrition vous attend !",
        "7 jours sans vous... Comment allez-vous ?"
      ],
      trial_ending: [
        "⏳ Votre essai se termine bientôt - Ne perdez pas vos progrès !",
        "{{firstName}}, ne laissez pas vos progrès s'arrêter !",
        "Derniers jours d'essai : Continuez avec Premium ?"
      ]
    }
  }
};

// Email Personalization Helpers
export const personalizeContent = (template: string, variables: Record<string, any>): string => {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return variables[key] || match;
  });
};

export const getOptimalSendTime = (timezone: string = 'Europe/Paris'): Date => {
  const now = new Date();
  const optimal = new Date(now);
  
  // Set to 10 AM in user's timezone (optimal open rate time for French market)
  optimal.setHours(10, 0, 0, 0);
  
  // If it's past 10 AM today, schedule for tomorrow
  if (now > optimal) {
    optimal.setDate(optimal.getDate() + 1);
  }
  
  return optimal;
};

// Email Analytics Event Types
export const EMAIL_EVENTS = {
  SENT: 'sent',
  DELIVERED: 'delivered',
  OPENED: 'opened',
  CLICKED: 'clicked',
  BOUNCED: 'bounced',
  UNSUBSCRIBED: 'unsubscribed',
  COMPLAINED: 'complained'
} as const;

export type EmailEventType = typeof EMAIL_EVENTS[keyof typeof EMAIL_EVENTS];

// Email Sequence Types
export const SEQUENCE_TYPES = {
  WELCOME: 'welcome',
  ONBOARDING: 'onboarding',
  ENGAGEMENT: 'engagement',
  TRIAL_CONVERSION: 'trial_conversion',
  RETENTION: 'retention',
  WINBACK: 'winback'
} as const;

export type SequenceType = typeof SEQUENCE_TYPES[keyof typeof SEQUENCE_TYPES];

// Trigger Events
export const TRIGGER_EVENTS = {
  USER_SIGNUP: 'user_signup',
  SUBSCRIPTION_START: 'subscription_start',
  PROFILE_COMPLETE: 'profile_complete',
  FIRST_MENU_GENERATED: 'first_menu_generated',
  INACTIVITY_7_DAYS: 'inactivity_7_days',
  INACTIVITY_14_DAYS: 'inactivity_14_days',
  TRIAL_ENDING: 'trial_ending',
  SUBSCRIPTION_CANCELLED: 'subscription_cancelled'
} as const;

export type TriggerEvent = typeof TRIGGER_EVENTS[keyof typeof TRIGGER_EVENTS];

// Default Email Configurations
export const DEFAULT_EMAIL_CONFIG = {
  from: {
    name: 'NutriCoach',
    email: 'noreply@nutricoach.app'
  },
  replyTo: 'support@nutricoach.app',
  timezone: 'Europe/Paris',
  language: 'fr',
  unsubscribeFooter: true,
  trackOpens: true,
  trackClicks: true
};

// Email Template Registry
export const EMAIL_TEMPLATES = {
  WELCOME: 'welcome',
  ONBOARDING_STEP_1: 'onboarding_step_1',
  ONBOARDING_STEP_2: 'onboarding_step_2',
  ONBOARDING_STEP_3: 'onboarding_step_3',
  ONBOARDING_STEP_4: 'onboarding_step_4',
  ONBOARDING_STEP_5: 'onboarding_step_5',
  NEWSLETTER_WEEKLY: 'newsletter_weekly',
  REMINDER_INACTIVE_7D: 'reminder_inactive_7d',
  REMINDER_INACTIVE_14D: 'reminder_inactive_14d',
  REMINDER_PROFILE_INCOMPLETE: 'reminder_profile_incomplete',
  REMINDER_TRIAL_ENDING: 'reminder_trial_ending',
  REMINDER_MENU_SUGGESTION: 'reminder_menu_suggestion',
  REMINDER_WEEKLY_CHECKIN: 'reminder_weekly_checkin'
} as const;

export type EmailTemplate = typeof EMAIL_TEMPLATES[keyof typeof EMAIL_TEMPLATES];