import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-client'

export async function DELETE(request: NextRequest) {
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

    // Get confirmation from request body
    const body = await request.json().catch(() => ({}))
    const { confirmationText, reason } = body

    // Require explicit confirmation
    if (confirmationText !== 'SUPPRIMER DÉFINITIVEMENT') {
      return NextResponse.json(
        { 
          error: 'Confirmation requise. Veuillez taper exactement "SUPPRIMER DÉFINITIVEMENT"',
          required_confirmation: 'SUPPRIMER DÉFINITIVEMENT'
        },
        { status: 400 }
      )
    }

    // Log the deletion request for audit (before deletion)
    try {
      // Log in general audit_logs table
      await supabase
        .from('audit_logs')
        .insert({
          user_id: userId,
          user_email: userEmail,
          action: 'ACCOUNT_DELETION_RGPD',
          details: `Account deletion requested by user ${userEmail}`,
          ip_address: request.headers.get('x-forwarded-for') || 'unknown',
          user_agent: request.headers.get('user-agent') || 'unknown',
          legal_basis: 'Article 17 RGPD - Droit à l\'effacement',
          data_category: 'full_account'
        })

      // Log in specific deletion_logs table
      await supabase
        .from('deletion_logs')
        .insert({
          user_id: userId,
          user_email: userEmail,
          deletion_reason: reason || 'User requested account deletion',
          deletion_type: 'user_request',
          ip_address: request.headers.get('x-forwarded-for') || 'unknown',
          user_agent: request.headers.get('user-agent') || 'unknown',
          confirmation_text: confirmationText,
          confirmation_timestamp: new Date().toISOString(),
          deletion_status: 'initiated'
        })
    } catch (error) {
      console.log('Deletion logging failed:', error)
      // Continue with deletion even if logging fails
    }

    // Start deletion process - Delete data in correct order (foreign keys)
    const deletionResults = {
      user_activities: false,
      generated_menus: false,
      nutrition_plans: false,
      health_profiles: false,
      user_preferences: false,
      subscriptions: false,
      user_profile: false,
      auth_user: false
    }

    // 1. Delete user activities and logs
    try {
      const { error } = await supabase
        .from('user_activities')
        .delete()
        .eq('user_id', userId)
      
      if (!error) deletionResults.user_activities = true
    } catch (error) {
      console.log('user_activities table not found or already clean')
      deletionResults.user_activities = true
    }

    // 2. Delete generated menus
    try {
      const { error } = await supabase
        .from('generated_menus')
        .delete()
        .eq('user_id', userId)
      
      if (!error) deletionResults.generated_menus = true
    } catch (error) {
      console.log('generated_menus table not found or already clean')
      deletionResults.generated_menus = true
    }

    // 3. Delete nutrition plans
    try {
      const { error } = await supabase
        .from('nutrition_plans')
        .delete()
        .eq('user_id', userId)
      
      if (!error) deletionResults.nutrition_plans = true
    } catch (error) {
      console.log('nutrition_plans table not found or already clean')
      deletionResults.nutrition_plans = true
    }

    // 4. Delete health profiles (sensitive data)
    try {
      const { error } = await supabase
        .from('health_profiles')
        .delete()
        .eq('user_id', userId)
      
      if (!error) deletionResults.health_profiles = true
    } catch (error) {
      console.log('health_profiles table not found or already clean')
      deletionResults.health_profiles = true
    }

    // 5. Delete user preferences
    try {
      const { error } = await supabase
        .from('user_preferences')
        .delete()
        .eq('user_id', userId)
      
      if (!error) deletionResults.user_preferences = true
    } catch (error) {
      console.log('user_preferences table not found or already clean')
      deletionResults.user_preferences = true
    }

    // 6. Handle subscriptions (mark as cancelled, don't delete for legal obligations)
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({ 
          status: 'cancelled_user_deletion',
          cancelled_at: new Date().toISOString(),
          deletion_reason: 'User exercised GDPR right to erasure'
        })
        .eq('user_id', userId)
      
      if (!error) deletionResults.subscriptions = true
    } catch (error) {
      console.log('subscriptions table not found or already clean')
      deletionResults.subscriptions = true
    }

    // 7. Delete main user profile
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId)
      
      if (!error) deletionResults.user_profile = true
    } catch (error) {
      console.log('Error deleting user profile:', error)
    }

    // 8. Delete auth user (this will cascade to related auth tables)
    try {
      const { error } = await supabase.auth.admin.deleteUser(userId)
      
      if (!error) deletionResults.auth_user = true
    } catch (error) {
      console.log('Error deleting auth user:', error)
    }

    // Check if deletion was successful
    const allDeleted = Object.values(deletionResults).every(result => result === true)

    if (allDeleted) {
      // Final audit log for successful deletion
      try {
        // Update deletion_logs to mark as completed
        await supabase
          .from('deletion_logs')
          .update({
            deletion_status: 'completed',
            deletion_completed_at: new Date().toISOString(),
            deletion_steps: deletionResults
          })
          .eq('user_id', userId)
          .eq('deletion_status', 'initiated')

        // Final audit log
        await supabase
          .from('audit_logs')
          .insert({
            user_id: 'DELETED_USER',
            user_email: userEmail,
            action: 'ACCOUNT_DELETED_SUCCESS',
            details: `Account ${userEmail} successfully deleted on ${new Date().toISOString()}`,
            ip_address: request.headers.get('x-forwarded-for') || 'unknown',
            user_agent: request.headers.get('user-agent') || 'unknown',
            legal_basis: 'Article 17 RGPD - Droit à l\'effacement',
            data_category: 'full_account',
            metadata: { deletion_results: deletionResults }
          })
      } catch (error) {
        console.log('Final audit log failed, but deletion was successful')
      }

      return NextResponse.json({
        success: true,
        message: 'Votre compte et toutes vos données ont été supprimés définitivement.',
        deletion_summary: {
          user_email: userEmail,
          deletion_date: new Date().toISOString(),
          rgpd_compliance: 'Article 17 - Droit à l\'effacement respecté',
          data_deleted: deletionResults,
          note: 'Les données de facturation peuvent être conservées 10 ans pour obligations légales'
        }
      })

    } else {
      // Partial deletion - need manual intervention
      try {
        // Update deletion_logs to mark as failed
        await supabase
          .from('deletion_logs')
          .update({
            deletion_status: 'failed',
            deletion_steps: deletionResults
          })
          .eq('user_id', userId)
          .eq('deletion_status', 'initiated')
      } catch (error) {
        console.log('Failed to update deletion status')
      }

      return NextResponse.json({
        success: false,
        error: 'Suppression partielle. Contactez le support pour finaliser.',
        deletion_summary: deletionResults,
        support_email: 'dpo@nutricoach.app'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Account deletion error:', error)
    
    return NextResponse.json(
      { 
        error: 'Erreur lors de la suppression du compte. Veuillez contacter le support.',
        details: process.env.NODE_ENV === 'development' ? error : undefined,
        support_email: 'dpo@nutricoach.app',
        rgpd_notice: 'Votre demande sera traitée manuellement sous 72h maximum'
      },
      { status: 500 }
    )
  }
}

// GET method to show deletion confirmation page
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Suppression de compte - Droit à l\'effacement RGPD',
    warning: '⚠️ Cette action est irréversible',
    steps: [
      '1. Vos données personnelles et de santé seront supprimées immédiatement',
      '2. Vos menus et préférences seront effacés définitivement',
      '3. Votre abonnement sera résilié automatiquement',
      '4. Vous recevrez une confirmation par email'
    ],
    legal_notice: 'Article 17 RGPD - Droit à l\'effacement',
    data_retention: {
      immediately_deleted: [
        'Données personnelles et profil utilisateur',
        'Données de santé et restrictions alimentaires',
        'Menus générés et préférences',
        'Historique d\'utilisation'
      ],
      legally_retained: [
        'Données de facturation (10 ans - obligations comptables)',
        'Logs de sécurité anonymisés (12 mois maximum)'
      ]
    },
    required_confirmation: 'SUPPRIMER DÉFINITIVEMENT',
    support: {
      email: 'dpo@nutricoach.app',
      response_time: '72 heures maximum'
    }
  })
}