-- =============================================
-- NutriCoach Email Marketing System - Database Schema
-- =============================================
-- Comprehensive email marketing automation system
-- Supports campaigns, sequences, analytics, and RGPD compliance
-- Target: 40%+ engagement rates for French nutrition market

-- =============================================
-- 1. EMAIL PREFERENCES & SETTINGS
-- =============================================

-- User email preferences and subscription management
create table public.email_preferences (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid not null references public.user_profiles(id) on delete cascade,
    
    -- Subscription preferences
    newsletter_subscribed boolean default true,
    recipe_recommendations_subscribed boolean default true,
    health_tips_subscribed boolean default true,
    product_updates_subscribed boolean default false,
    promotional_emails_subscribed boolean default false,
    
    -- Frequency preferences
    email_frequency text default 'weekly' check (email_frequency in ('daily', 'weekly', 'bi_weekly', 'monthly')),
    best_time_to_send integer default 10 check (best_time_to_send between 0 and 23), -- Hour of day (0-23)
    timezone text default 'Europe/Paris',
    
    -- Content preferences based on nutrition goals
    preferred_meal_types text[], -- ['breakfast', 'lunch', 'dinner', 'snack']
    preferred_recipe_difficulty text[], -- ['easy', 'medium', 'hard']
    content_language text default 'fr' check (content_language in ('fr', 'en')),
    
    -- Engagement tracking
    total_emails_sent integer default 0,
    total_emails_opened integer default 0,
    total_clicks integer default 0,
    last_engagement_at timestamptz,
    engagement_score numeric(3,2) default 0.0 check (engagement_score between 0 and 1), -- 0-1 engagement score
    
    -- RGPD compliance
    consent_given_at timestamptz default now(),
    consent_ip_address inet,
    consent_user_agent text,
    double_opt_in_confirmed boolean default false,
    double_opt_in_confirmed_at timestamptz,
    unsubscribe_token text unique default encode(gen_random_bytes(32), 'base64'),
    
    -- Timestamps
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null
);

-- Enable RLS
alter table public.email_preferences enable row level security;

-- RLS Policies
create policy "Users can view their own email preferences"
    on public.email_preferences for select
    using ( user_id = (select auth.uid()) );

create policy "Users can update their own email preferences"
    on public.email_preferences for update
    using ( user_id = (select auth.uid()) );

create policy "Users can insert their own email preferences"
    on public.email_preferences for insert
    to authenticated
    with check ( user_id = (select auth.uid()) );

-- =============================================
-- 2. EMAIL CAMPAIGNS
-- =============================================

-- Email campaigns and newsletters
create table public.email_campaigns (
    id uuid primary key default uuid_generate_v4(),
    
    -- Campaign details
    name text not null,
    description text,
    type text not null check (type in ('newsletter', 'promotional', 'educational', 'transactional', 'sequence')),
    status text default 'draft' check (status in ('draft', 'scheduled', 'sending', 'sent', 'paused', 'cancelled')),
    
    -- Content
    subject_line text not null,
    subject_line_variants text[], -- For A/B testing
    preheader text,
    html_content text not null,
    text_content text,
    
    -- Targeting
    target_segments text[], -- ['all_users', 'trial_users', 'premium_users', 'inactive_users']
    target_dietary_preferences text[], -- Target specific dietary preferences
    target_health_conditions text[], -- Target specific health conditions
    exclude_segments text[], -- Segments to exclude
    
    -- Scheduling
    scheduled_at timestamptz,
    send_immediately boolean default false,
    timezone text default 'Europe/Paris',
    
    -- A/B Testing
    ab_test_enabled boolean default false,
    ab_test_split_percentage integer default 50 check (ab_test_split_percentage between 10 and 90),
    ab_test_winner_metric text check (ab_test_winner_metric in ('open_rate', 'click_rate', 'conversion_rate')),
    ab_test_duration_hours integer default 24,
    ab_test_winner_selected boolean default false,
    ab_test_winning_variant text,
    
    -- Analytics
    recipients_count integer default 0,
    delivered_count integer default 0,
    opened_count integer default 0,
    clicked_count integer default 0,
    unsubscribed_count integer default 0,
    bounced_count integer default 0,
    complained_count integer default 0,
    
    -- Calculated metrics
    delivery_rate numeric(5,2) generated always as (
        case when recipients_count > 0 then (delivered_count::numeric / recipients_count * 100) else 0 end
    ) stored,
    open_rate numeric(5,2) generated always as (
        case when delivered_count > 0 then (opened_count::numeric / delivered_count * 100) else 0 end
    ) stored,
    click_rate numeric(5,2) generated always as (
        case when delivered_count > 0 then (clicked_count::numeric / delivered_count * 100) else 0 end
    ) stored,
    
    -- Metadata
    created_by uuid references public.user_profiles(id),
    campaign_tags text[], -- For organization and filtering
    
    -- Timestamps
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null,
    sent_at timestamptz
);

-- Enable RLS
alter table public.email_campaigns enable row level security;

-- RLS Policies - Only admins can manage campaigns
create policy "Admins can manage email campaigns"
    on public.email_campaigns for all
    using ( 
        exists (
            select 1 from public.user_profiles
            where id = (select auth.uid())
            and (metadata->>'is_admin')::boolean = true
        )
    );

-- =============================================
-- 3. EMAIL SEQUENCES (AUTOMATION)
-- =============================================

-- Automated email sequences (drip campaigns)
create table public.email_sequences (
    id uuid primary key default uuid_generate_v4(),
    
    -- Sequence details
    name text not null,
    description text,
    type text not null check (type in ('welcome', 'onboarding', 'engagement', 'trial_conversion', 'retention', 'winback')),
    status text default 'active' check (status in ('active', 'paused', 'archived')),
    
    -- Trigger conditions
    trigger_event text not null check (trigger_event in ('user_signup', 'subscription_start', 'profile_complete', 'first_menu_generated', 'inactivity_7_days', 'inactivity_14_days', 'trial_ending', 'subscription_cancelled')),
    trigger_delay_hours integer default 0 check (trigger_delay_hours >= 0), -- Delay before starting sequence
    
    -- Targeting
    target_segments text[], -- Who should receive this sequence
    exclude_segments text[], -- Who should be excluded
    
    -- Analytics
    total_subscribers integer default 0,
    total_emails_sent integer default 0,
    total_completions integer default 0, -- Users who completed full sequence
    
    -- Metadata
    created_by uuid references public.user_profiles(id),
    
    -- Timestamps
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null
);

-- Enable RLS
alter table public.email_sequences enable row level security;

-- RLS Policies - Only admins can manage sequences
create policy "Admins can manage email sequences"
    on public.email_sequences for all
    using ( 
        exists (
            select 1 from public.user_profiles
            where id = (select auth.uid())
            and (metadata->>'is_admin')::boolean = true
        )
    );

-- =============================================
-- 4. EMAIL SEQUENCE STEPS
-- =============================================

-- Individual emails within sequences
create table public.email_sequence_steps (
    id uuid primary key default uuid_generate_v4(),
    sequence_id uuid not null references public.email_sequences(id) on delete cascade,
    
    -- Step details
    step_number integer not null,
    name text not null,
    description text,
    
    -- Timing
    delay_days integer not null check (delay_days >= 0), -- Days after previous step (or trigger)
    delay_hours integer default 0 check (delay_hours between 0 and 23), -- Additional hours
    send_time_hour integer default 10 check (send_time_hour between 0 and 23), -- Preferred send hour
    
    -- Content
    subject_line text not null,
    subject_line_variants text[], -- For A/B testing
    preheader text,
    html_content text not null,
    text_content text,
    
    -- Personalization
    use_dynamic_content boolean default true,
    dynamic_recipe_count integer default 3, -- Number of recipes to include
    dynamic_content_filters jsonb, -- Filters for dynamic content selection
    
    -- Analytics
    sent_count integer default 0,
    delivered_count integer default 0,
    opened_count integer default 0,
    clicked_count integer default 0,
    
    -- Calculated metrics
    open_rate numeric(5,2) generated always as (
        case when delivered_count > 0 then (opened_count::numeric / delivered_count * 100) else 0 end
    ) stored,
    click_rate numeric(5,2) generated always as (
        case when delivered_count > 0 then (clicked_count::numeric / delivered_count * 100) else 0 end
    ) stored,
    
    -- Timestamps
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null,
    
    -- Constraints
    unique(sequence_id, step_number)
);

-- Enable RLS
alter table public.email_sequence_steps enable row level security;

-- RLS Policies - Inherit from sequences
create policy "Admins can manage sequence steps"
    on public.email_sequence_steps for all
    using ( 
        exists (
            select 1 from public.user_profiles
            where id = (select auth.uid())
            and (metadata->>'is_admin')::boolean = true
        )
    );

-- =============================================
-- 5. EMAIL QUEUE & DELIVERY
-- =============================================

-- Queue for scheduled and sequence emails
create table public.email_queue (
    id uuid primary key default uuid_generate_v4(),
    
    -- Recipient
    user_id uuid not null references public.user_profiles(id) on delete cascade,
    recipient_email text not null,
    
    -- Email details
    campaign_id uuid references public.email_campaigns(id),
    sequence_id uuid references public.email_sequences(id),
    sequence_step_id uuid references public.email_sequence_steps(id),
    
    -- Content (resolved/personalized)
    subject_line text not null,
    html_content text not null,
    text_content text,
    
    -- Scheduling
    scheduled_at timestamptz not null,
    priority integer default 5 check (priority between 1 and 10), -- 1 = highest priority
    
    -- Processing status
    status text default 'queued' check (status in ('queued', 'processing', 'sent', 'failed', 'cancelled')),
    provider_message_id text, -- ID from email service provider
    
    -- Delivery tracking
    sent_at timestamptz,
    delivered_at timestamptz,
    opened_at timestamptz,
    first_click_at timestamptz,
    
    -- Error handling
    error_message text,
    retry_count integer default 0,
    max_retry_count integer default 3,
    next_retry_at timestamptz,
    
    -- Timestamps
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null
);

-- Enable RLS
alter table public.email_queue enable row level security;

-- RLS Policies - System managed
create policy "Only system can manage email queue"
    on public.email_queue for all
    using ( false ); -- Only service role access

-- =============================================
-- 6. EMAIL ANALYTICS & EVENTS
-- =============================================

-- Detailed email event tracking
create table public.email_events (
    id uuid primary key default uuid_generate_v4(),
    
    -- Email reference
    queue_id uuid references public.email_queue(id) on delete cascade,
    campaign_id uuid references public.email_campaigns(id),
    sequence_id uuid references public.email_sequences(id),
    sequence_step_id uuid references public.email_sequence_steps(id),
    
    -- User context
    user_id uuid references public.user_profiles(id) on delete cascade,
    recipient_email text not null,
    
    -- Event details
    event_type text not null check (event_type in ('sent', 'delivered', 'bounced', 'opened', 'clicked', 'unsubscribed', 'complained', 'deferred')),
    event_data jsonb, -- Additional event-specific data
    
    -- Click tracking
    clicked_url text, -- URL that was clicked
    click_position integer, -- Position of link in email
    
    -- Technical details
    user_agent text,
    ip_address inet,
    client_info jsonb, -- Email client information
    
    -- Provider data
    provider_event_id text,
    provider_timestamp timestamptz,
    
    -- Timestamp
    created_at timestamptz default now() not null
);

-- Enable RLS
alter table public.email_events enable row level security;

-- RLS Policies
create policy "Users can view their own email events"
    on public.email_events for select
    using ( user_id = (select auth.uid()) );

create policy "Admins can view all email events"
    on public.email_events for select
    using ( 
        exists (
            select 1 from public.user_profiles
            where id = (select auth.uid())
            and (metadata->>'is_admin')::boolean = true
        )
    );

-- =============================================
-- 7. USER SEQUENCE SUBSCRIPTIONS
-- =============================================

-- Track which users are subscribed to which sequences
create table public.user_sequence_subscriptions (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid not null references public.user_profiles(id) on delete cascade,
    sequence_id uuid not null references public.email_sequences(id) on delete cascade,
    
    -- Subscription details
    subscribed_at timestamptz default now() not null,
    triggered_by text not null, -- What triggered this subscription
    
    -- Progress tracking
    current_step integer default 0, -- 0 = not started, N = completed step N
    last_email_sent_at timestamptz,
    next_email_scheduled_at timestamptz,
    
    -- Completion status
    status text default 'active' check (status in ('active', 'paused', 'completed', 'unsubscribed')),
    completed_at timestamptz,
    unsubscribed_at timestamptz,
    unsubscribe_reason text,
    
    -- Analytics
    emails_sent integer default 0,
    emails_opened integer default 0,
    emails_clicked integer default 0,
    
    -- Timestamps
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null,
    
    -- Constraints
    unique(user_id, sequence_id)
);

-- Enable RLS
alter table public.user_sequence_subscriptions enable row level security;

-- RLS Policies
create policy "Users can view their own sequence subscriptions"
    on public.user_sequence_subscriptions for select
    using ( user_id = (select auth.uid()) );

create policy "System can manage sequence subscriptions"
    on public.user_sequence_subscriptions for all
    to authenticated
    using ( user_id = (select auth.uid()) or 
        exists (
            select 1 from public.user_profiles
            where id = (select auth.uid())
            and (metadata->>'is_admin')::boolean = true
        )
    );

-- =============================================
-- 8. EMAIL TEMPLATES
-- =============================================

-- Reusable email templates
create table public.email_templates (
    id uuid primary key default uuid_generate_v4(),
    
    -- Template details
    name text not null,
    description text,
    category text not null check (category in ('welcome', 'newsletter', 'promotional', 'transactional', 'reminder')),
    
    -- Content
    subject_line text not null,
    html_content text not null,
    text_content text,
    
    -- Template variables
    required_variables text[], -- ['user_name', 'recipe_count', etc.]
    sample_data jsonb, -- Sample data for preview
    
    -- Status
    is_active boolean default true,
    version integer default 1,
    
    -- Metadata
    created_by uuid references public.user_profiles(id),
    
    -- Timestamps
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null
);

-- Enable RLS
alter table public.email_templates enable row level security;

-- RLS Policies
create policy "Admins can manage email templates"
    on public.email_templates for all
    using ( 
        exists (
            select 1 from public.user_profiles
            where id = (select auth.uid())
            and (metadata->>'is_admin')::boolean = true
        )
    );

-- Anyone can view active templates for preview
create policy "Anyone can view active templates"
    on public.email_templates for select
    using ( is_active = true );

-- =============================================
-- 9. PERFORMANCE INDEXES
-- =============================================

-- Email preferences indexes
create index idx_email_preferences_user_id on public.email_preferences(user_id);
create index idx_email_preferences_engagement on public.email_preferences(engagement_score desc, last_engagement_at desc);
create index idx_email_preferences_subscriptions on public.email_preferences(newsletter_subscribed, recipe_recommendations_subscribed);

-- Email campaigns indexes
create index idx_email_campaigns_type_status on public.email_campaigns(type, status);
create index idx_email_campaigns_scheduled_at on public.email_campaigns(scheduled_at) where status = 'scheduled';
create index idx_email_campaigns_sent_at on public.email_campaigns(sent_at desc);
create index idx_email_campaigns_segments on public.email_campaigns using gin(target_segments);

-- Email sequences indexes
create index idx_email_sequences_trigger on public.email_sequences(trigger_event, status);
create index idx_email_sequences_status on public.email_sequences(status);

-- Email sequence steps indexes
create index idx_email_sequence_steps_sequence_id on public.email_sequence_steps(sequence_id, step_number);

-- Email queue indexes
create index idx_email_queue_scheduled on public.email_queue(scheduled_at, status) where status in ('queued', 'processing');
create index idx_email_queue_user_id on public.email_queue(user_id);
create index idx_email_queue_status on public.email_queue(status);
create index idx_email_queue_retry on public.email_queue(next_retry_at) where status = 'failed' and retry_count < max_retry_count;

-- Email events indexes
create index idx_email_events_queue_id on public.email_events(queue_id);
create index idx_email_events_user_id on public.email_events(user_id);
create index idx_email_events_type on public.email_events(event_type);
create index idx_email_events_created_at on public.email_events(created_at desc);
create index idx_email_events_campaign_analytics on public.email_events(campaign_id, event_type) where campaign_id is not null;

-- User sequence subscriptions indexes
create index idx_user_sequence_subscriptions_user_id on public.user_sequence_subscriptions(user_id);
create index idx_user_sequence_subscriptions_sequence_id on public.user_sequence_subscriptions(sequence_id);
create index idx_user_sequence_subscriptions_status on public.user_sequence_subscriptions(status);
create index idx_user_sequence_subscriptions_next_email on public.user_sequence_subscriptions(next_email_scheduled_at) where status = 'active';

-- Email templates indexes
create index idx_email_templates_category on public.email_templates(category, is_active);

-- =============================================
-- 10. HELPER FUNCTIONS
-- =============================================

-- Function to calculate user engagement score
create or replace function calculate_engagement_score(p_user_id uuid)
returns numeric as $$
declare
    total_sent integer;
    total_opened integer;
    total_clicked integer;
    recent_activity_days integer;
    engagement_score numeric;
begin
    -- Get email statistics for the user
    select 
        coalesce(ep.total_emails_sent, 0),
        coalesce(ep.total_emails_opened, 0),
        coalesce(ep.total_clicks, 0),
        coalesce(extract(days from now() - ep.last_engagement_at), 999)
    into total_sent, total_opened, total_clicked, recent_activity_days
    from public.email_preferences ep
    where ep.user_id = p_user_id;
    
    -- Calculate base engagement score
    if total_sent = 0 then
        engagement_score := 0.0;
    else
        -- Base score from open and click rates
        engagement_score := (total_opened * 0.3 + total_clicked * 0.7) / total_sent;
        
        -- Apply recency penalty
        if recent_activity_days > 30 then
            engagement_score := engagement_score * 0.5;
        elsif recent_activity_days > 14 then
            engagement_score := engagement_score * 0.8;
        end if;
    end if;
    
    -- Cap at 1.0
    engagement_score := least(engagement_score, 1.0);
    
    -- Update the score in email_preferences
    update public.email_preferences
    set engagement_score = engagement_score
    where user_id = p_user_id;
    
    return engagement_score;
end;
$$ language plpgsql security definer;

-- Function to get user segments for targeting
create or replace function get_user_segments(p_user_id uuid)
returns text[] as $$
declare
    segments text[] := '{}';
    user_profile record;
    email_prefs record;
    days_since_signup integer;
    engagement_score numeric;
begin
    -- Get user profile and email preferences
    select up.*, ep.engagement_score, ep.last_engagement_at
    into user_profile, engagement_score
    from public.user_profiles up
    left join public.email_preferences ep on up.id = ep.user_id
    where up.id = p_user_id;
    
    if not found then
        return segments;
    end if;
    
    -- Calculate days since signup
    days_since_signup := extract(days from now() - user_profile.created_at);
    
    -- Basic segments
    segments := segments || 'all_users';
    
    -- Subscription-based segments (placeholder for when subscriptions are implemented)
    -- segments := segments || 'free_users'; -- or 'premium_users'
    
    -- Activity-based segments
    if days_since_signup <= 7 then
        segments := segments || 'new_users';
    elsif days_since_signup <= 30 then
        segments := segments || 'recent_users';
    else
        segments := segments || 'established_users';
    end if;
    
    -- Engagement-based segments
    if engagement_score >= 0.7 then
        segments := segments || 'highly_engaged';
    elsif engagement_score >= 0.3 then
        segments := segments || 'moderately_engaged';
    else
        segments := segments || 'low_engaged';
    end if;
    
    -- Inactivity segments
    if user_profile.last_engagement_at is not null then
        if extract(days from now() - user_profile.last_engagement_at) > 14 then
            segments := segments || 'inactive_users';
        end if;
        if extract(days from now() - user_profile.last_engagement_at) > 30 then
            segments := segments || 'very_inactive_users';
        end if;
    end if;
    
    -- Health goal segments
    if user_profile.primary_goal is not null then
        segments := segments || ('goal_' || user_profile.primary_goal);
    end if;
    
    -- Dietary preference segments
    if user_profile.dietary_preferences is not null then
        segments := segments || (
            select array_agg('diet_' || unnest)
            from unnest(user_profile.dietary_preferences)
        );
    end if;
    
    return segments;
end;
$$ language plpgsql security definer;

-- Function to schedule sequence emails
create or replace function schedule_sequence_emails()
returns integer as $$
declare
    scheduled_count integer := 0;
    subscription record;
    next_step record;
    scheduled_time timestamptz;
begin
    -- Process active sequence subscriptions that need their next email
    for subscription in
        select uss.*, es.name as sequence_name
        from public.user_sequence_subscriptions uss
        join public.email_sequences es on uss.sequence_id = es.id
        where uss.status = 'active'
        and uss.next_email_scheduled_at <= now()
        and es.status = 'active'
    loop
        -- Get the next step for this subscription
        select * into next_step
        from public.email_sequence_steps
        where sequence_id = subscription.sequence_id
        and step_number = subscription.current_step + 1
        order by step_number
        limit 1;
        
        if found then
            -- Calculate scheduled time (next day at preferred hour)
            scheduled_time := date_trunc('day', now() + interval '1 day') + 
                            (next_step.send_time_hour || ' hours')::interval;
            
            -- Add to email queue
            insert into public.email_queue (
                user_id,
                recipient_email,
                sequence_id,
                sequence_step_id,
                subject_line,
                html_content,
                text_content,
                scheduled_at,
                priority
            )
            select 
                subscription.user_id,
                up.email,
                subscription.sequence_id,
                next_step.id,
                next_step.subject_line,
                next_step.html_content,
                next_step.text_content,
                scheduled_time,
                3 -- Medium priority for sequence emails
            from public.user_profiles up
            where up.id = subscription.user_id;
            
            -- Update subscription progress
            update public.user_sequence_subscriptions
            set 
                current_step = next_step.step_number,
                last_email_sent_at = now(),
                next_email_scheduled_at = case 
                    when next_step.step_number = (
                        select max(step_number) 
                        from public.email_sequence_steps 
                        where sequence_id = subscription.sequence_id
                    ) then null -- Last step
                    else scheduled_time + (
                        select (delay_days || ' days ' || delay_hours || ' hours')::interval
                        from public.email_sequence_steps
                        where sequence_id = subscription.sequence_id
                        and step_number = next_step.step_number + 1
                    )
                end,
                emails_sent = emails_sent + 1,
                updated_at = now()
            where id = subscription.id;
            
            scheduled_count := scheduled_count + 1;
        else
            -- No more steps, mark sequence as completed
            update public.user_sequence_subscriptions
            set 
                status = 'completed',
                completed_at = now(),
                updated_at = now()
            where id = subscription.id;
        end if;
    end loop;
    
    return scheduled_count;
end;
$$ language plpgsql security definer;

-- Function to trigger sequence subscription based on events
create or replace function trigger_sequence_subscription(
    p_user_id uuid,
    p_trigger_event text
)
returns integer as $$
declare
    subscriptions_created integer := 0;
    sequence_record record;
    user_segments text[];
    should_subscribe boolean;
begin
    -- Get user segments for targeting
    user_segments := get_user_segments(p_user_id);
    
    -- Find sequences that should be triggered
    for sequence_record in
        select *
        from public.email_sequences
        where trigger_event = p_trigger_event
        and status = 'active'
    loop
        should_subscribe := true;
        
        -- Check if user matches target segments
        if sequence_record.target_segments is not null then
            should_subscribe := sequence_record.target_segments && user_segments;
        end if;
        
        -- Check if user should be excluded
        if should_subscribe and sequence_record.exclude_segments is not null then
            should_subscribe := not (sequence_record.exclude_segments && user_segments);
        end if;
        
        -- Check if user is already subscribed
        if should_subscribe then
            should_subscribe := not exists (
                select 1 from public.user_sequence_subscriptions
                where user_id = p_user_id
                and sequence_id = sequence_record.id
                and status in ('active', 'completed')
            );
        end if;
        
        -- Create subscription if all conditions are met
        if should_subscribe then
            insert into public.user_sequence_subscriptions (
                user_id,
                sequence_id,
                triggered_by,
                next_email_scheduled_at
            ) values (
                p_user_id,
                sequence_record.id,
                p_trigger_event,
                now() + (sequence_record.trigger_delay_hours || ' hours')::interval
            );
            
            subscriptions_created := subscriptions_created + 1;
        end if;
    end loop;
    
    return subscriptions_created;
end;
$$ language plpgsql security definer;

-- =============================================
-- 11. TRIGGERS
-- =============================================

-- Update timestamps
create trigger update_email_preferences_updated_at
    before update on public.email_preferences
    for each row execute function update_updated_at_column();

create trigger update_email_campaigns_updated_at
    before update on public.email_campaigns
    for each row execute function update_updated_at_column();

create trigger update_email_sequences_updated_at
    before update on public.email_sequences
    for each row execute function update_updated_at_column();

create trigger update_email_sequence_steps_updated_at
    before update on public.email_sequence_steps
    for each row execute function update_updated_at_column();

create trigger update_email_queue_updated_at
    before update on public.email_queue
    for each row execute function update_updated_at_column();

create trigger update_user_sequence_subscriptions_updated_at
    before update on public.user_sequence_subscriptions
    for each row execute function update_updated_at_column();

create trigger update_email_templates_updated_at
    before update on public.email_templates
    for each row execute function update_updated_at_column();

-- Auto-create email preferences when user profile is created
create or replace function create_default_email_preferences()
returns trigger as $$
begin
    insert into public.email_preferences (
        user_id,
        newsletter_subscribed,
        recipe_recommendations_subscribed,
        health_tips_subscribed,
        double_opt_in_confirmed
    ) values (
        new.id,
        true,
        true,
        true,
        false -- Will be confirmed via double opt-in email
    );
    
    -- Trigger welcome sequence
    perform trigger_sequence_subscription(new.id, 'user_signup');
    
    return new;
end;
$$ language plpgsql security definer;

create trigger create_email_preferences_on_user_creation
    after insert on public.user_profiles
    for each row execute function create_default_email_preferences();

-- =============================================
-- 12. PERMISSIONS
-- =============================================

-- Grant permissions
grant select, insert, update on public.email_preferences to authenticated;
grant select on public.email_campaigns to authenticated;
grant select on public.email_sequences to authenticated;
grant select on public.email_sequence_steps to authenticated;
grant select on all tables in schema public to authenticated;

-- Service role gets full access
grant all on all tables in schema public to service_role;
grant execute on all functions in schema public to service_role;

-- Grant function permissions
grant execute on function calculate_engagement_score to authenticated;
grant execute on function get_user_segments to authenticated;
grant execute on function trigger_sequence_subscription to service_role;
grant execute on function schedule_sequence_emails to service_role;

-- =============================================
-- NOTES FOR IMPLEMENTATION
-- =============================================

-- This schema supports:
-- 1. RGPD compliant email preferences with double opt-in
-- 2. Comprehensive campaign management with A/B testing
-- 3. Automated email sequences (drip campaigns)
-- 4. Advanced user segmentation and targeting
-- 5. Detailed analytics and event tracking
-- 6. Queue-based email delivery with retry logic
-- 7. Template management for reusable content
-- 8. French market focus with timezone support

-- Next steps:
-- 1. Install React Email and email service provider (Resend)
-- 2. Create email templates with French nutrition content
-- 3. Implement API endpoints for email management
-- 4. Build admin dashboard for campaign management
-- 5. Set up automated sequences for user journey