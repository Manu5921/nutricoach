import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Token de désabonnement requis' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Find user by unsubscribe token
    const { data: preferences, error } = await supabase
      .from('email_preferences')
      .select(`
        *,
        user_profiles!inner(email, full_name)
      `)
      .eq('unsubscribe_token', token)
      .single();

    if (error || !preferences) {
      return NextResponse.json(
        { error: 'Token de désabonnement invalide ou expiré' },
        { status: 404 }
      );
    }

    // Return unsubscribe page data
    return NextResponse.json({
      user: {
        email: preferences.user_profiles.email,
        fullName: preferences.user_profiles.full_name
      },
      preferences: {
        newsletter_subscribed: preferences.newsletter_subscribed,
        recipe_recommendations_subscribed: preferences.recipe_recommendations_subscribed,
        health_tips_subscribed: preferences.health_tips_subscribed,
        product_updates_subscribed: preferences.product_updates_subscribed,
        promotional_emails_subscribed: preferences.promotional_emails_subscribed
      },
      token
    });

  } catch (error) {
    console.error('Unsubscribe GET error:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { token, action, preferences } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: 'Token de désabonnement requis' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Find user by unsubscribe token
    const { data: userPreferences, error: findError } = await supabase
      .from('email_preferences')
      .select(`
        *,
        user_profiles!inner(id, email, full_name)
      `)
      .eq('unsubscribe_token', token)
      .single();

    if (findError || !userPreferences) {
      return NextResponse.json(
        { error: 'Token de désabonnement invalide ou expiré' },
        { status: 404 }
      );
    }

    const userId = userPreferences.user_profiles.id;
    const userEmail = userPreferences.user_profiles.email;
    const userAgent = request.headers.get('user-agent') || '';
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || '';

    if (action === 'unsubscribe_all') {
      // Unsubscribe from all emails
      const { error: updateError } = await supabase
        .from('email_preferences')
        .update({
          newsletter_subscribed: false,
          recipe_recommendations_subscribed: false,
          health_tips_subscribed: false,
          product_updates_subscribed: false,
          promotional_emails_subscribed: false,
          updated_at: new Date().toISOString()
        })
        .eq('unsubscribe_token', token);

      if (updateError) {
        console.error('Error unsubscribing user:', updateError);
        return NextResponse.json(
          { error: 'Erreur lors du désabonnement' },
          { status: 500 }
        );
      }

      // Log audit event
      await supabase.rpc('log_audit_event', {
        p_user_id: userId,
        p_user_email: userEmail,
        p_action: 'UNSUBSCRIBE_ALL',
        p_details: 'Utilisateur désabonné de tous les emails via lien de désabonnement',
        p_ip_address: ipAddress,
        p_user_agent: userAgent,
        p_legal_basis: 'Article 21 RGPD - Droit d\'opposition',
        p_data_category: 'email_preferences'
      });

      // Log consent changes
      const emailTypes = [
        'newsletter', 
        'recipe_recommendations', 
        'health_tips', 
        'product_updates', 
        'promotional_emails'
      ];

      for (const emailType of emailTypes) {
        await supabase.rpc('log_consent_change', {
          p_user_id: userId,
          p_consent_type: emailType,
          p_consent_status: false,
          p_consent_method: 'unsubscribe_link',
          p_ip_address: ipAddress,
          p_user_agent: userAgent,
          p_legal_basis: 'Article 21 RGPD - Droit d\'opposition'
        });
      }

      return NextResponse.json({
        success: true,
        message: 'Vous avez été désabonné de tous les emails NutriCoach'
      });

    } else if (action === 'update_preferences' && preferences) {
      // Update specific preferences
      const allowedFields = [
        'newsletter_subscribed',
        'recipe_recommendations_subscribed',
        'health_tips_subscribed',
        'product_updates_subscribed',
        'promotional_emails_subscribed'
      ];

      const filteredPreferences = Object.keys(preferences)
        .filter(key => allowedFields.includes(key))
        .reduce((obj, key) => {
          obj[key] = preferences[key];
          return obj;
        }, {});

      if (Object.keys(filteredPreferences).length === 0) {
        return NextResponse.json(
          { error: 'Aucune préférence valide fournie' },
          { status: 400 }
        );
      }

      const { error: updateError } = await supabase
        .from('email_preferences')
        .update({
          ...filteredPreferences,
          updated_at: new Date().toISOString()
        })
        .eq('unsubscribe_token', token);

      if (updateError) {
        console.error('Error updating preferences:', updateError);
        return NextResponse.json(
          { error: 'Erreur lors de la mise à jour des préférences' },
          { status: 500 }
        );
      }

      // Log consent changes
      for (const [field, value] of Object.entries(filteredPreferences)) {
        const consentType = field.replace('_subscribed', '');
        await supabase.rpc('log_consent_change', {
          p_user_id: userId,
          p_consent_type: consentType,
          p_consent_status: value,
          p_consent_method: 'unsubscribe_page',
          p_ip_address: ipAddress,
          p_user_agent: userAgent,
          p_legal_basis: value 
            ? 'Article 6.1.a RGPD - Consentement'
            : 'Article 21 RGPD - Droit d\'opposition'
        });
      }

      // Log audit event
      await supabase.rpc('log_audit_event', {
        p_user_id: userId,
        p_user_email: userEmail,
        p_action: 'UPDATE_EMAIL_PREFERENCES',
        p_details: 'Préférences email mises à jour via page de désabonnement',
        p_ip_address: ipAddress,
        p_user_agent: userAgent,
        p_legal_basis: 'Article 6.1.a RGPD - Consentement',
        p_data_category: 'email_preferences',
        p_metadata: filteredPreferences
      });

      return NextResponse.json({
        success: true,
        message: 'Vos préférences email ont été mises à jour'
      });

    } else {
      return NextResponse.json(
        { error: 'Action invalide' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Unsubscribe POST error:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}