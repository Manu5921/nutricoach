import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-client';

// GET /api/email/campaigns - List campaigns
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

    // Check if user is admin
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('metadata')
      .eq('id', user.id)
      .single();

    if (!profile?.metadata?.is_admin) {
      return NextResponse.json(
        { error: 'Accès admin requis' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const type = searchParams.get('type');

    let query = supabase
      .from('email_campaigns')
      .select(`
        *,
        user_profiles!created_by(full_name, email)
      `)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    if (type) {
      query = query.eq('type', type);
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    
    const { data: campaigns, error, count } = await query
      .range(from, to)
      .select('*', { count: 'exact' });

    if (error) {
      console.error('Error fetching campaigns:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des campagnes' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      campaigns,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error) {
    console.error('Campaigns GET error:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

// POST /api/email/campaigns - Create campaign
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('metadata')
      .eq('id', user.id)
      .single();

    if (!profile?.metadata?.is_admin) {
      return NextResponse.json(
        { error: 'Accès admin requis' },
        { status: 403 }
      );
    }

    const campaignData = await request.json();

    // Validate required fields
    const requiredFields = ['name', 'type', 'subject_line', 'html_content'];
    for (const field of requiredFields) {
      if (!campaignData[field]) {
        return NextResponse.json(
          { error: `Champ requis manquant: ${field}` },
          { status: 400 }
        );
      }
    }

    // Validate type
    const validTypes = ['newsletter', 'promotional', 'educational', 'transactional', 'sequence'];
    if (!validTypes.includes(campaignData.type)) {
      return NextResponse.json(
        { error: 'Type de campagne invalide' },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ['draft', 'scheduled', 'sending', 'sent', 'paused', 'cancelled'];
    if (campaignData.status && !validStatuses.includes(campaignData.status)) {
      return NextResponse.json(
        { error: 'Statut de campagne invalide' },
        { status: 400 }
      );
    }

    // Create campaign
    const { data: campaign, error } = await supabase
      .from('email_campaigns')
      .insert({
        name: campaignData.name,
        description: campaignData.description,
        type: campaignData.type,
        status: campaignData.status || 'draft',
        subject_line: campaignData.subject_line,
        subject_line_variants: campaignData.subject_line_variants,
        preheader: campaignData.preheader,
        html_content: campaignData.html_content,
        text_content: campaignData.text_content,
        target_segments: campaignData.target_segments,
        target_dietary_preferences: campaignData.target_dietary_preferences,
        target_health_conditions: campaignData.target_health_conditions,
        exclude_segments: campaignData.exclude_segments,
        scheduled_at: campaignData.scheduled_at,
        send_immediately: campaignData.send_immediately || false,
        timezone: campaignData.timezone || 'Europe/Paris',
        ab_test_enabled: campaignData.ab_test_enabled || false,
        ab_test_split_percentage: campaignData.ab_test_split_percentage || 50,
        ab_test_winner_metric: campaignData.ab_test_winner_metric || 'open_rate',
        ab_test_duration_hours: campaignData.ab_test_duration_hours || 24,
        campaign_tags: campaignData.campaign_tags,
        created_by: user.id
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating campaign:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la création de la campagne' },
        { status: 500 }
      );
    }

    return NextResponse.json(campaign, { status: 201 });

  } catch (error) {
    console.error('Campaigns POST error:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}