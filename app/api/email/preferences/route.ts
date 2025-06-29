import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-client';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    // Get user email preferences
    const { data: preferences, error } = await supabase
      .from('email_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // Not found is OK
      console.error('Error fetching email preferences:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des préférences' },
        { status: 500 }
      );
    }

    // If no preferences exist, create default ones
    if (!preferences) {
      const { data: newPreferences, error: createError } = await supabase
        .from('email_preferences')
        .insert({
          user_id: user.id,
          newsletter_subscribed: true,
          recipe_recommendations_subscribed: true,
          health_tips_subscribed: true,
          product_updates_subscribed: false,
          promotional_emails_subscribed: false,
          email_frequency: 'weekly',
          best_time_to_send: 10,
          timezone: 'Europe/Paris',
          content_language: 'fr'
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating email preferences:', createError);
        return NextResponse.json(
          { error: 'Erreur lors de la création des préférences' },
          { status: 500 }
        );
      }

      return NextResponse.json(newPreferences);
    }

    return NextResponse.json(preferences);

  } catch (error) {
    console.error('Email preferences API error:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const updates = await request.json();

    // Validate allowed fields
    const allowedFields = [
      'newsletter_subscribed',
      'recipe_recommendations_subscribed',
      'health_tips_subscribed',
      'product_updates_subscribed',
      'promotional_emails_subscribed',
      'email_frequency',
      'best_time_to_send',
      'timezone',
      'preferred_meal_types',
      'preferred_recipe_difficulty',
      'content_language'
    ];

    const filteredUpdates = Object.keys(updates)
      .filter(key => allowedFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = updates[key];
        return obj;
      }, {});

    if (Object.keys(filteredUpdates).length === 0) {
      return NextResponse.json(
        { error: 'Aucune mise à jour valide fournie' },
        { status: 400 }
      );
    }

    // Validate email frequency
    if (filteredUpdates.email_frequency && 
        !['daily', 'weekly', 'bi_weekly', 'monthly'].includes(filteredUpdates.email_frequency)) {
      return NextResponse.json(
        { error: 'Fréquence d\'email invalide' },
        { status: 400 }
      );
    }

    // Validate best time to send
    if (filteredUpdates.best_time_to_send !== undefined && 
        (filteredUpdates.best_time_to_send < 0 || filteredUpdates.best_time_to_send > 23)) {
      return NextResponse.json(
        { error: 'Heure d\'envoi invalide (0-23)' },
        { status: 400 }
      );
    }

    // Update email preferences
    const { data: updatedPreferences, error } = await supabase
      .from('email_preferences')
      .update({
        ...filteredUpdates,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating email preferences:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour des préférences' },
        { status: 500 }
      );
    }

    // Log consent change if subscription preferences changed
    const subscriptionFields = [
      'newsletter_subscribed',
      'recipe_recommendations_subscribed', 
      'health_tips_subscribed',
      'product_updates_subscribed',
      'promotional_emails_subscribed'
    ];

    const subscriptionUpdates = Object.keys(filteredUpdates)
      .filter(key => subscriptionFields.includes(key));

    if (subscriptionUpdates.length > 0) {
      const userAgent = request.headers.get('user-agent') || '';
      const ipAddress = request.headers.get('x-forwarded-for') || 
                       request.headers.get('x-real-ip') || '';

      for (const field of subscriptionUpdates) {
        await supabase.rpc('log_consent_change', {
          p_user_id: user.id,
          p_consent_type: field.replace('_subscribed', ''),
          p_consent_status: filteredUpdates[field],
          p_consent_method: 'profile_settings',
          p_ip_address: ipAddress,
          p_user_agent: userAgent,
          p_legal_basis: 'Article 6.1.a RGPD - Consentement'
        });
      }
    }

    return NextResponse.json(updatedPreferences);

  } catch (error) {
    console.error('Email preferences update API error:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}