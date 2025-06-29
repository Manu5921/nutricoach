import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-client'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Get the authenticated user
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    
    if (authError || !session?.user) {
      return NextResponse.json(
        { error: 'Non autorisé. Veuillez vous connecter.' },
        { status: 401 }
      )
    }

    const userId = session.user.id
    const userEmail = session.user.email

    // Fetch all user data from different tables
    const exportData = {
      export_info: {
        user_id: userId,
        email: userEmail,
        export_date: new Date().toISOString(),
        export_type: 'RGPD_DATA_EXPORT',
        compliance: 'Article 20 RGPD - Droit à la portabilité'
      },
      user_profile: {},
      user_preferences: {},
      health_data: {},
      nutrition_plans: [],
      generated_menus: [],
      subscription_data: {},
      activity_logs: [],
      analytics_data: {}
    }

    // Get user profile data
    const { data: profileData, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (profileData && !profileError) {
      exportData.user_profile = {
        id: profileData.id,
        email: profileData.email,
        full_name: profileData.full_name,
        created_at: profileData.created_at,
        updated_at: profileData.updated_at,
        subscription_status: profileData.subscription_status,
        subscription_tier: profileData.subscription_tier
      }
    }

    // Get user preferences (if table exists)
    try {
      const { data: preferencesData } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)

      if (preferencesData) {
        exportData.user_preferences = preferencesData
      }
    } catch (error) {
      console.log('user_preferences table not found, skipping...')
    }

    // Get health data (if table exists)
    try {
      const { data: healthData } = await supabase
        .from('health_profiles')
        .select('*')
        .eq('user_id', userId)

      if (healthData) {
        exportData.health_data = {
          notice: "Données de santé - Catégorie spéciale selon Article 9 RGPD",
          data: healthData,
          legal_basis: "Consentement explicite (Art. 6.1.a et 9.2.a RGPD)",
          retention_period: "Durée d'abonnement + 3 ans"
        }
      }
    } catch (error) {
      console.log('health_profiles table not found, skipping...')
    }

    // Get nutrition plans (if table exists)
    try {
      const { data: nutritionPlans } = await supabase
        .from('nutrition_plans')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (nutritionPlans) {
        exportData.nutrition_plans = nutritionPlans
      }
    } catch (error) {
      console.log('nutrition_plans table not found, skipping...')
    }

    // Get generated menus (if table exists)
    try {
      const { data: menusData } = await supabase
        .from('generated_menus')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50) // Limit to last 50 menus

      if (menusData) {
        exportData.generated_menus = menusData
      }
    } catch (error) {
      console.log('generated_menus table not found, skipping...')
    }

    // Get subscription data (if table exists)
    try {
      const { data: subscriptionData } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)

      if (subscriptionData && subscriptionData.length > 0) {
        exportData.subscription_data = {
          notice: "Données de facturation conservées 10 ans (obligations légales)",
          current_subscription: subscriptionData[0],
          legal_basis: "Art. 6.1.c RGPD - Obligations légales",
          retention_period: "10 ans après dernière transaction"
        }
      }
    } catch (error) {
      console.log('subscriptions table not found, skipping...')
    }

    // Get activity logs (if table exists)
    try {
      const { data: activityData } = await supabase
        .from('user_activities')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100) // Last 100 activities

      if (activityData) {
        exportData.activity_logs = {
          notice: "Logs d'activité conservés 12 mois maximum",
          data: activityData,
          legal_basis: "Art. 6.1.f RGPD - Intérêt légitime (sécurité)",
          retention_period: "12 mois maximum"
        }
      }
    } catch (error) {
      console.log('user_activities table not found, skipping...')
    }

    // Add analytics data info (stored in localStorage/cookies)
    exportData.analytics_data = {
      notice: "Données analytiques stockées localement (cookies/localStorage)",
      cookie_preferences: "Voir localStorage: nutricoach-cookie-settings",
      google_analytics: "Soumis au consentement cookies",
      retention_period: "13 mois maximum (recommandation CNIL)"
    }

    // Add RGPD compliance information
    exportData.rgpd_compliance = {
      legal_framework: "Règlement Général sur la Protection des Données (RGPD)",
      your_rights: {
        access: "Art. 15 - Droit d'accès (cette export)",
        rectification: "Art. 16 - Droit de rectification",
        erasure: "Art. 17 - Droit à l'effacement",
        restriction: "Art. 18 - Droit à la limitation",
        portability: "Art. 20 - Droit à la portabilité",
        objection: "Art. 21 - Droit d'opposition"
      },
      data_controller: {
        name: "NutriCoach SAS",
        email: "dpo@nutricoach.app",
        legal_email: "legal@nutricoach.app"
      },
      supervisory_authority: {
        name: "CNIL (Commission Nationale de l'Informatique et des Libertés)",
        website: "https://www.cnil.fr",
        phone: "01 53 73 22 22"
      }
    }

    // Log the export request for audit trail
    try {
      // Log in audit_logs table
      await supabase
        .from('audit_logs')
        .insert({
          user_id: userId,
          user_email: userEmail,
          action: 'DATA_EXPORT_RGPD',
          details: `User ${userEmail} exported their personal data`,
          ip_address: request.headers.get('x-forwarded-for') || 'unknown',
          user_agent: request.headers.get('user-agent') || 'unknown',
          legal_basis: 'Article 20 RGPD - Droit à la portabilité',
          data_category: 'full_export'
        })

      // Log in specific data_export_logs table
      await supabase
        .from('data_export_logs')
        .insert({
          user_id: userId,
          user_email: userEmail,
          export_type: 'full_export',
          data_categories: ['profile', 'health_data', 'menus', 'preferences', 'activity_logs'],
          export_format: 'json',
          ip_address: request.headers.get('x-forwarded-for') || 'unknown',
          user_agent: request.headers.get('user-agent') || 'unknown',
          completed_at: new Date().toISOString()
        })
    } catch (error) {
      console.log('Audit logging failed:', error)
      // Continue with export even if logging fails
    }

    // Return the export data as JSON
    return NextResponse.json(exportData, {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="nutricoach-data-export-${userId}-${new Date().toISOString().split('T')[0]}.json"`
      }
    })

  } catch (error) {
    console.error('Export data error:', error)
    return NextResponse.json(
      { 
        error: 'Erreur lors de l\'export des données. Veuillez contacter le support.',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    )
  }
}