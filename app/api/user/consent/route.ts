import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-client'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Get the authenticated user (optional for cookie consent)
    const { data: { session } } = await supabase.auth.getSession()
    
    const body = await request.json()
    const { 
      consentType, 
      consentStatus, 
      consentMethod = 'cookie_banner',
      privacyPolicyVersion = '1.0' 
    } = body

    // Validate input
    if (!consentType || typeof consentStatus !== 'boolean') {
      return NextResponse.json(
        { error: 'consentType et consentStatus sont requis' },
        { status: 400 }
      )
    }

    const validConsentTypes = [
      'cookies_analytics', 
      'cookies_marketing', 
      'cookies_preferences',
      'health_data_processing', 
      'newsletter', 
      'data_sharing'
    ]

    if (!validConsentTypes.includes(consentType)) {
      return NextResponse.json(
        { error: 'Type de consentement invalide' },
        { status: 400 }
      )
    }

    // If user is authenticated, log consent in database
    if (session?.user) {
      try {
        // Log consent change
        await supabase
          .from('consent_logs')
          .insert({
            user_id: session.user.id,
            consent_type: consentType,
            consent_status: consentStatus,
            consent_method: consentMethod,
            ip_address: request.headers.get('x-forwarded-for') || 'unknown',
            user_agent: request.headers.get('user-agent') || 'unknown',
            legal_basis: 'Article 6.1.a RGPD - Consentement',
            privacy_policy_version: privacyPolicyVersion
          })

        // Log in general audit log
        await supabase
          .from('audit_logs')
          .insert({
            user_id: session.user.id,
            user_email: session.user.email,
            action: `CONSENT_${consentStatus ? 'GRANTED' : 'WITHDRAWN'}`,
            details: `User ${consentStatus ? 'granted' : 'withdrew'} consent for ${consentType}`,
            ip_address: request.headers.get('x-forwarded-for') || 'unknown',
            user_agent: request.headers.get('user-agent') || 'unknown',
            legal_basis: 'Article 7 RGPD - Gestion du consentement',
            data_category: 'consent_data',
            metadata: {
              consent_type: consentType,
              consent_method: consentMethod,
              privacy_policy_version: privacyPolicyVersion
            }
          })

      } catch (error) {
        console.log('Consent logging failed:', error)
        // Continue even if logging fails
      }
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: `Consentement ${consentStatus ? 'accordé' : 'retiré'} pour ${consentType}`,
      consent: {
        type: consentType,
        status: consentStatus,
        timestamp: new Date().toISOString(),
        method: consentMethod
      }
    })

  } catch (error) {
    console.error('Consent processing error:', error)
    return NextResponse.json(
      { 
        error: 'Erreur lors du traitement du consentement',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    )
  }
}

// GET method to retrieve user's consent history
export async function GET(request: NextRequest) {
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

    // Get user's consent history
    const { data: consentHistory, error } = await supabase
      .from('consent_logs')
      .select('*')
      .eq('user_id', session.user.id)
      .order('consent_given_at', { ascending: false })

    if (error) {
      throw error
    }

    // Get current consent status for each type
    const currentConsents: Record<string, any> = {}
    
    // Process consent history to get latest status for each type
    if (consentHistory) {
      const consentTypes = ['cookies_analytics', 'cookies_marketing', 'cookies_preferences', 'health_data_processing', 'newsletter', 'data_sharing']
      
      for (const type of consentTypes) {
        const latestConsent = consentHistory.find(log => log.consent_type === type)
        if (latestConsent) {
          currentConsents[type] = {
            status: latestConsent.consent_status,
            granted_at: latestConsent.consent_given_at,
            method: latestConsent.consent_method,
            privacy_policy_version: latestConsent.privacy_policy_version
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      current_consents: currentConsents,
      consent_history: consentHistory?.slice(0, 20), // Last 20 consent changes
      rgpd_info: {
        your_rights: {
          withdraw: "Vous pouvez retirer votre consentement à tout moment",
          access: "Vous pouvez consulter l'historique de vos consentements",
          rectification: "Vous pouvez modifier vos préférences à tout moment"
        },
        legal_basis: "Article 7 RGPD - Conditions applicables au consentement",
        contact: "dpo@nutricoach.app pour toute question sur vos consentements"
      }
    })

  } catch (error) {
    console.error('Consent retrieval error:', error)
    return NextResponse.json(
      { 
        error: 'Erreur lors de la récupération des consentements',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    )
  }
}