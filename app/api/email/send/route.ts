import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-client';
import { emailService } from '@/lib/email/service';

export async function POST(request: NextRequest) {
  try {
    const { 
      type, 
      recipient, 
      templateData = {},
      options = {} 
    } = await request.json();

    if (!type || !recipient?.email) {
      return NextResponse.json(
        { error: 'Type et email du destinataire requis' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Verify user is authenticated for non-system emails
    const { data: { user } } = await supabase.auth.getUser();
    
    // System emails can be sent without authentication (webhooks, etc.)
    const systemEmailTypes = ['welcome', 'onboarding', 'newsletter', 'reminder'];
    
    if (!systemEmailTypes.includes(type) && !user) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    let result;

    switch (type) {
      case 'welcome':
        result = await emailService.sendWelcomeEmail(
          recipient,
          templateData.confirmEmailUrl,
          options
        );
        break;

      case 'onboarding':
        if (!templateData.stepNumber || templateData.stepNumber < 1 || templateData.stepNumber > 5) {
          return NextResponse.json(
            { error: 'stepNumber doit être entre 1 et 5' },
            { status: 400 }
          );
        }
        result = await emailService.sendOnboardingEmail(
          recipient,
          templateData.stepNumber,
          options
        );
        break;

      case 'newsletter':
        if (!templateData.week || !templateData.year || !templateData.featuredRecipes) {
          return NextResponse.json(
            { error: 'Données de newsletter manquantes (week, year, featuredRecipes)' },
            { status: 400 }
          );
        }
        result = await emailService.sendNewsletterEmail(
          recipient,
          templateData,
          options
        );
        break;

      case 'reminder':
        if (!templateData.reminderType) {
          return NextResponse.json(
            { error: 'reminderType requis' },
            { status: 400 }
          );
        }
        result = await emailService.sendReminderEmail(
          recipient,
          templateData.reminderType,
          templateData.personalizedData,
          options
        );
        break;

      default:
        return NextResponse.json(
          { error: 'Type d\'email non supporté' },
          { status: 400 }
        );
    }

    if (result.success) {
      return NextResponse.json({
        success: true,
        messageId: result.messageId
      });
    } else {
      return NextResponse.json(
        { error: result.error || 'Erreur lors de l\'envoi de l\'email' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Email send API error:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}