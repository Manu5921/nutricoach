import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-client';
import { emailService } from '@/lib/email/service';

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
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const campaignId = searchParams.get('campaign_id');
    const sequenceId = searchParams.get('sequence_id');
    const type = searchParams.get('type') || 'overview';

    // Default to last 30 days if no dates provided
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    switch (type) {
      case 'overview':
        return await getOverviewAnalytics(supabase, start, end);
      
      case 'campaign':
        if (!campaignId) {
          return NextResponse.json(
            { error: 'campaign_id requis pour les analytics de campagne' },
            { status: 400 }
          );
        }
        return await getCampaignAnalytics(supabase, campaignId, start, end);
      
      case 'sequence':
        if (!sequenceId) {
          return NextResponse.json(
            { error: 'sequence_id requis pour les analytics de séquence' },
            { status: 400 }
          );
        }
        return await getSequenceAnalytics(supabase, sequenceId, start, end);
      
      case 'engagement':
        return await getEngagementAnalytics(supabase, start, end);
      
      case 'performance':
        return await getPerformanceAnalytics(supabase, start, end);
      
      default:
        return NextResponse.json(
          { error: 'Type d\'analytics non supporté' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Email analytics error:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

async function getOverviewAnalytics(supabase: any, startDate: Date, endDate: Date) {
  try {
    // Get basic email statistics
    const analytics = await emailService.getEmailAnalytics(startDate, endDate);

    // Get campaign count and status breakdown
    const { data: campaignStats } = await supabase
      .from('email_campaigns')
      .select('status')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    const campaignsByStatus = campaignStats?.reduce((acc: any, campaign: any) => {
      acc[campaign.status] = (acc[campaign.status] || 0) + 1;
      return acc;
    }, {}) || {};

    // Get active sequences count
    const { count: activeSequences } = await supabase
      .from('email_sequences')
      .select('id', { count: 'exact' })
      .eq('status', 'active');

    // Get subscriber statistics
    const { data: subscriberStats } = await supabase
      .from('email_preferences')
      .select(`
        newsletter_subscribed,
        recipe_recommendations_subscribed,
        health_tips_subscribed,
        created_at
      `)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    const newSubscribers = subscriberStats?.length || 0;
    const activeSubscribers = subscriberStats?.filter((s: any) => 
      s.newsletter_subscribed || s.recipe_recommendations_subscribed || s.health_tips_subscribed
    ).length || 0;

    // Calculate rates
    const deliveryRate = analytics.sent > 0 ? (analytics.delivered / analytics.sent * 100) : 0;
    const openRate = analytics.delivered > 0 ? (analytics.opened / analytics.delivered * 100) : 0;
    const clickRate = analytics.delivered > 0 ? (analytics.clicked / analytics.delivered * 100) : 0;
    const unsubscribeRate = analytics.delivered > 0 ? (analytics.unsubscribed / analytics.delivered * 100) : 0;

    return NextResponse.json({
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      },
      overview: {
        emails_sent: analytics.sent,
        emails_delivered: analytics.delivered,
        emails_opened: analytics.opened,
        emails_clicked: analytics.clicked,
        emails_bounced: analytics.bounced,
        emails_unsubscribed: analytics.unsubscribed,
        delivery_rate: Math.round(deliveryRate * 100) / 100,
        open_rate: Math.round(openRate * 100) / 100,
        click_rate: Math.round(clickRate * 100) / 100,
        unsubscribe_rate: Math.round(unsubscribeRate * 100) / 100
      },
      campaigns: {
        total: Object.values(campaignsByStatus).reduce((a: any, b: any) => a + b, 0),
        by_status: campaignsByStatus
      },
      sequences: {
        active: activeSequences
      },
      subscribers: {
        new: newSubscribers,
        active: activeSubscribers
      }
    });

  } catch (error) {
    console.error('Error getting overview analytics:', error);
    throw error;
  }
}

async function getCampaignAnalytics(supabase: any, campaignId: string, startDate: Date, endDate: Date) {
  try {
    // Get campaign details
    const { data: campaign } = await supabase
      .from('email_campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campagne non trouvée' },
        { status: 404 }
      );
    }

    // Get campaign analytics
    const analytics = await emailService.getEmailAnalytics(startDate, endDate, { campaignId });

    // Get detailed events
    const { data: events } = await supabase
      .from('email_events')
      .select('event_type, created_at, clicked_url')
      .eq('campaign_id', campaignId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: true });

    // Process events by day
    const eventsByDay = events?.reduce((acc: any, event: any) => {
      const day = event.created_at.split('T')[0];
      if (!acc[day]) {
        acc[day] = { sent: 0, delivered: 0, opened: 0, clicked: 0, bounced: 0, unsubscribed: 0 };
      }
      acc[day][event.event_type]++;
      return acc;
    }, {}) || {};

    // Get top clicked URLs
    const clickedUrls = events?.filter((e: any) => e.event_type === 'clicked' && e.clicked_url)
      .reduce((acc: any, event: any) => {
        acc[event.clicked_url] = (acc[event.clicked_url] || 0) + 1;
        return acc;
      }, {}) || {};

    const topUrls = Object.entries(clickedUrls)
      .sort(([,a]: any, [,b]: any) => b - a)
      .slice(0, 10)
      .map(([url, clicks]) => ({ url, clicks }));

    return NextResponse.json({
      campaign,
      analytics,
      timeline: eventsByDay,
      top_clicked_urls: topUrls
    });

  } catch (error) {
    console.error('Error getting campaign analytics:', error);
    throw error;
  }
}

async function getSequenceAnalytics(supabase: any, sequenceId: string, startDate: Date, endDate: Date) {
  try {
    // Get sequence details with steps
    const { data: sequence } = await supabase
      .from('email_sequences')
      .select(`
        *,
        email_sequence_steps(*)
      `)
      .eq('id', sequenceId)
      .single();

    if (!sequence) {
      return NextResponse.json(
        { error: 'Séquence non trouvée' },
        { status: 404 }
      );
    }

    // Get sequence analytics
    const analytics = await emailService.getEmailAnalytics(startDate, endDate, { sequenceId });

    // Get step-by-step analytics
    const stepAnalytics = [];
    for (const step of sequence.email_sequence_steps) {
      const stepEvents = await emailService.getEmailAnalytics(startDate, endDate, { 
        sequenceId,
        stepId: step.id 
      });
      stepAnalytics.push({
        step_number: step.step_number,
        step_name: step.name,
        ...stepEvents
      });
    }

    // Get subscription statistics
    const { data: subscriptions } = await supabase
      .from('user_sequence_subscriptions')
      .select('status, current_step, created_at, completed_at')
      .eq('sequence_id', sequenceId);

    const subscriptionStats = subscriptions?.reduce((acc: any, sub: any) => {
      acc[sub.status] = (acc[sub.status] || 0) + 1;
      return acc;
    }, {}) || {};

    const completionRate = subscriptions?.length > 0 
      ? (subscriptionStats.completed || 0) / subscriptions.length * 100 
      : 0;

    return NextResponse.json({
      sequence,
      analytics,
      step_analytics: stepAnalytics,
      subscriptions: {
        total: subscriptions?.length || 0,
        by_status: subscriptionStats,
        completion_rate: Math.round(completionRate * 100) / 100
      }
    });

  } catch (error) {
    console.error('Error getting sequence analytics:', error);
    throw error;
  }
}

async function getEngagementAnalytics(supabase: any, startDate: Date, endDate: Date) {
  try {
    // Get user engagement statistics
    const { data: engagementData } = await supabase
      .from('email_preferences')
      .select(`
        engagement_score,
        last_engagement_at,
        total_emails_sent,
        total_emails_opened,
        total_clicks,
        created_at
      `);

    // Segment users by engagement score
    const engagementSegments = {
      highly_engaged: 0,
      moderately_engaged: 0,
      low_engaged: 0,
      inactive: 0
    };

    const totalUsers = engagementData?.length || 0;
    
    engagementData?.forEach((user: any) => {
      if (user.engagement_score >= 0.7) {
        engagementSegments.highly_engaged++;
      } else if (user.engagement_score >= 0.3) {
        engagementSegments.moderately_engaged++;
      } else if (user.engagement_score > 0) {
        engagementSegments.low_engaged++;
      } else {
        engagementSegments.inactive++;
      }
    });

    // Calculate average engagement metrics
    const avgEngagementScore = totalUsers > 0 
      ? engagementData.reduce((sum: number, user: any) => sum + (user.engagement_score || 0), 0) / totalUsers 
      : 0;

    const totalEmailsSent = engagementData?.reduce((sum: number, user: any) => sum + (user.total_emails_sent || 0), 0) || 0;
    const totalEmailsOpened = engagementData?.reduce((sum: number, user: any) => sum + (user.total_emails_opened || 0), 0) || 0;
    const totalClicks = engagementData?.reduce((sum: number, user: any) => sum + (user.total_clicks || 0), 0) || 0;

    const avgOpenRate = totalEmailsSent > 0 ? (totalEmailsOpened / totalEmailsSent * 100) : 0;
    const avgClickRate = totalEmailsSent > 0 ? (totalClicks / totalEmailsSent * 100) : 0;

    return NextResponse.json({
      engagement_segments: engagementSegments,
      engagement_percentages: {
        highly_engaged: totalUsers > 0 ? Math.round(engagementSegments.highly_engaged / totalUsers * 100) : 0,
        moderately_engaged: totalUsers > 0 ? Math.round(engagementSegments.moderately_engaged / totalUsers * 100) : 0,
        low_engaged: totalUsers > 0 ? Math.round(engagementSegments.low_engaged / totalUsers * 100) : 0,
        inactive: totalUsers > 0 ? Math.round(engagementSegments.inactive / totalUsers * 100) : 0
      },
      average_metrics: {
        engagement_score: Math.round(avgEngagementScore * 1000) / 1000,
        open_rate: Math.round(avgOpenRate * 100) / 100,
        click_rate: Math.round(avgClickRate * 100) / 100
      },
      total_users: totalUsers
    });

  } catch (error) {
    console.error('Error getting engagement analytics:', error);
    throw error;
  }
}

async function getPerformanceAnalytics(supabase: any, startDate: Date, endDate: Date) {
  try {
    // Get performance by email type
    const { data: campaigns } = await supabase
      .from('email_campaigns')
      .select('type, open_rate, click_rate, delivery_rate')
      .gte('sent_at', startDate.toISOString())
      .lte('sent_at', endDate.toISOString())
      .not('sent_at', 'is', null);

    const performanceByType = campaigns?.reduce((acc: any, campaign: any) => {
      if (!acc[campaign.type]) {
        acc[campaign.type] = {
          count: 0,
          total_open_rate: 0,
          total_click_rate: 0,
          total_delivery_rate: 0
        };
      }
      acc[campaign.type].count++;
      acc[campaign.type].total_open_rate += campaign.open_rate || 0;
      acc[campaign.type].total_click_rate += campaign.click_rate || 0;
      acc[campaign.type].total_delivery_rate += campaign.delivery_rate || 0;
      return acc;
    }, {}) || {};

    // Calculate averages
    Object.keys(performanceByType).forEach(type => {
      const data = performanceByType[type];
      data.avg_open_rate = data.count > 0 ? Math.round(data.total_open_rate / data.count * 100) / 100 : 0;
      data.avg_click_rate = data.count > 0 ? Math.round(data.total_click_rate / data.count * 100) / 100 : 0;
      data.avg_delivery_rate = data.count > 0 ? Math.round(data.total_delivery_rate / data.count * 100) / 100 : 0;
      delete data.total_open_rate;
      delete data.total_click_rate;
      delete data.total_delivery_rate;
    });

    // Get best performing campaigns
    const { data: topCampaigns } = await supabase
      .from('email_campaigns')
      .select('name, type, open_rate, click_rate, delivery_rate, sent_at')
      .gte('sent_at', startDate.toISOString())
      .lte('sent_at', endDate.toISOString())
      .not('sent_at', 'is', null)
      .order('open_rate', { ascending: false })
      .limit(10);

    return NextResponse.json({
      performance_by_type: performanceByType,
      top_campaigns: topCampaigns || []
    });

  } catch (error) {
    console.error('Error getting performance analytics:', error);
    throw error;
  }
}