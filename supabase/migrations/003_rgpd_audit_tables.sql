-- =============================================
-- NutriCoach RGPD Compliance - Audit Tables
-- =============================================
-- RGPD compliance requires audit trails for data operations
-- These tables track user actions and data operations for compliance

-- =============================================
-- 1. AUDIT LOGS TABLE
-- =============================================

-- General audit log for tracking user actions and system events
create table public.audit_logs (
    id uuid primary key default uuid_generate_v4(),
    
    -- User information
    user_id uuid, -- May be null for system events or after user deletion
    user_email text, -- Store email for reference even after user deletion
    
    -- Action details
    action text not null, -- 'DATA_EXPORT_RGPD', 'ACCOUNT_DELETION_RGPD', 'PROFILE_UPDATE', etc.
    details text, -- Human-readable description of the action
    
    -- Technical context
    ip_address inet, -- Client IP address
    user_agent text, -- Browser/client information
    
    -- Request metadata
    request_method text, -- 'GET', 'POST', 'DELETE', etc.
    request_path text, -- API endpoint path
    
    -- Additional context (flexible JSON field)
    metadata jsonb, -- For additional structured data
    
    -- RGPD compliance fields
    legal_basis text, -- 'Article 15 RGPD', 'Article 17 RGPD', etc.
    data_category text, -- 'personal_data', 'health_data', 'usage_data'
    
    -- Timestamps
    created_at timestamptz default now() not null
);

-- Enable RLS for audit logs
alter table public.audit_logs enable row level security;

-- RLS Policies - Only system can write, admins can read
create policy "Only system can insert audit logs"
    on public.audit_logs for insert
    with check ( false ); -- Only through service role

create policy "Admins can view all audit logs"
    on public.audit_logs for select
    using ( 
        exists (
            select 1 from public.user_profiles
            where id = (select auth.uid())
            and (metadata->>'is_admin')::boolean = true
        )
    );

-- Users can view their own audit logs
create policy "Users can view their own audit logs"
    on public.audit_logs for select
    using ( user_id = (select auth.uid()) );

-- =============================================
-- 2. DELETION LOGS TABLE
-- =============================================

-- Specific table for tracking account deletions (RGPD Article 17)
create table public.deletion_logs (
    id uuid primary key default uuid_generate_v4(),
    
    -- User information (preserved after deletion)
    user_id uuid not null, -- Original user ID
    user_email text not null, -- Email preserved for compliance
    
    -- Deletion details
    deletion_reason text, -- User-provided reason
    deletion_type text not null check (deletion_type in ('user_request', 'admin_action', 'system_cleanup')),
    
    -- Technical context
    ip_address inet,
    user_agent text,
    
    -- Confirmation details
    confirmation_text text, -- What the user typed to confirm
    confirmation_timestamp timestamptz,
    
    -- Deletion process tracking
    deletion_status text not null default 'initiated' check (deletion_status in ('initiated', 'in_progress', 'completed', 'failed')),
    deletion_steps jsonb, -- Track which data categories were deleted
    
    -- Compliance information
    legal_basis text default 'Article 17 RGPD - Droit à l''effacement',
    retention_exceptions jsonb, -- Data retained for legal obligations
    
    -- Timestamps
    deletion_requested_at timestamptz default now() not null,
    deletion_completed_at timestamptz,
    created_at timestamptz default now() not null
);

-- Enable RLS for deletion logs
alter table public.deletion_logs enable row level security;

-- RLS Policies - Only system can write, strict read permissions
create policy "Only system can insert deletion logs"
    on public.deletion_logs for insert
    with check ( false ); -- Only through service role

create policy "Admins can view all deletion logs"
    on public.deletion_logs for select
    using ( 
        exists (
            select 1 from public.user_profiles
            where id = (select auth.uid())
            and (metadata->>'is_admin')::boolean = true
        )
    );

-- =============================================
-- 3. DATA EXPORT LOGS TABLE
-- =============================================

-- Track data export requests (RGPD Article 20)
create table public.data_export_logs (
    id uuid primary key default uuid_generate_v4(),
    
    -- User information
    user_id uuid not null references public.user_profiles(id) on delete cascade,
    user_email text not null,
    
    -- Export details
    export_type text not null check (export_type in ('full_export', 'partial_export', 'health_data_only')),
    data_categories text[] not null, -- ['profile', 'health_data', 'menus', 'activity_logs']
    
    -- Technical details
    export_format text default 'json' check (export_format in ('json', 'csv', 'xml')),
    file_size_bytes bigint,
    export_duration_ms integer,
    
    -- Request context
    ip_address inet,
    user_agent text,
    
    -- Compliance information
    legal_basis text default 'Article 20 RGPD - Droit à la portabilité',
    
    -- Timestamps
    requested_at timestamptz default now() not null,
    completed_at timestamptz,
    created_at timestamptz default now() not null
);

-- Enable RLS for export logs
alter table public.data_export_logs enable row level security;

-- RLS Policies
create policy "Users can view their own export logs"
    on public.data_export_logs for select
    using ( user_id = (select auth.uid()) );

create policy "System can insert export logs"
    on public.data_export_logs for insert
    to authenticated
    with check ( user_id = (select auth.uid()) );

-- =============================================
-- 4. CONSENT LOGS TABLE
-- =============================================

-- Track consent for data processing (RGPD Article 7)
create table public.consent_logs (
    id uuid primary key default uuid_generate_v4(),
    
    -- User information
    user_id uuid references public.user_profiles(id) on delete cascade,
    
    -- Consent details
    consent_type text not null check (consent_type in ('cookies_analytics', 'cookies_marketing', 'health_data_processing', 'newsletter', 'data_sharing')),
    consent_status boolean not null, -- true = granted, false = withdrawn
    
    -- Consent context
    consent_method text not null check (consent_method in ('cookie_banner', 'profile_settings', 'signup_form', 'api_request')),
    ip_address inet,
    user_agent text,
    
    -- Legal basis and documentation
    legal_basis text not null,
    privacy_policy_version text, -- Version of privacy policy when consent was given
    
    -- Timestamps
    consent_given_at timestamptz default now() not null,
    created_at timestamptz default now() not null
);

-- Enable RLS for consent logs
alter table public.consent_logs enable row level security;

-- RLS Policies
create policy "Users can view their own consent logs"
    on public.consent_logs for select
    using ( user_id = (select auth.uid()) );

create policy "Users can insert their own consent logs"
    on public.consent_logs for insert
    to authenticated
    with check ( user_id = (select auth.uid()) );

-- =============================================
-- 5. INDEXES FOR PERFORMANCE
-- =============================================

-- Audit logs indexes
create index idx_audit_logs_user_id on public.audit_logs(user_id);
create index idx_audit_logs_action on public.audit_logs(action);
create index idx_audit_logs_created_at on public.audit_logs(created_at desc);
create index idx_audit_logs_user_email on public.audit_logs(user_email);

-- Deletion logs indexes
create index idx_deletion_logs_user_id on public.deletion_logs(user_id);
create index idx_deletion_logs_user_email on public.deletion_logs(user_email);
create index idx_deletion_logs_status on public.deletion_logs(deletion_status);
create index idx_deletion_logs_created_at on public.deletion_logs(created_at desc);

-- Export logs indexes
create index idx_data_export_logs_user_id on public.data_export_logs(user_id);
create index idx_data_export_logs_requested_at on public.data_export_logs(requested_at desc);

-- Consent logs indexes
create index idx_consent_logs_user_id on public.consent_logs(user_id);
create index idx_consent_logs_consent_type on public.consent_logs(consent_type);
create index idx_consent_logs_consent_given_at on public.consent_logs(consent_given_at desc);

-- =============================================
-- 6. HELPER FUNCTIONS
-- =============================================

-- Function to log audit events (to be called by API)
create or replace function log_audit_event(
    p_user_id uuid,
    p_user_email text,
    p_action text,
    p_details text,
    p_ip_address inet default null,
    p_user_agent text default null,
    p_legal_basis text default null,
    p_data_category text default null,
    p_metadata jsonb default null
)
returns uuid as $$
declare
    log_id uuid;
begin
    insert into public.audit_logs (
        user_id,
        user_email,
        action,
        details,
        ip_address,
        user_agent,
        legal_basis,
        data_category,
        metadata
    ) values (
        p_user_id,
        p_user_email,
        p_action,
        p_details,
        p_ip_address,
        p_user_agent,
        p_legal_basis,
        p_data_category,
        p_metadata
    )
    returning id into log_id;
    
    return log_id;
end;
$$ language plpgsql security definer;

-- Function to log consent changes
create or replace function log_consent_change(
    p_user_id uuid,
    p_consent_type text,
    p_consent_status boolean,
    p_consent_method text,
    p_ip_address inet default null,
    p_user_agent text default null,
    p_legal_basis text default null,
    p_privacy_policy_version text default '1.0'
)
returns uuid as $$
declare
    log_id uuid;
begin
    insert into public.consent_logs (
        user_id,
        consent_type,
        consent_status,
        consent_method,
        ip_address,
        user_agent,
        legal_basis,
        privacy_policy_version
    ) values (
        p_user_id,
        p_consent_type,
        p_consent_status,
        p_consent_method,
        p_ip_address,
        p_user_agent,
        p_legal_basis,
        p_privacy_policy_version
    )
    returning id into log_id;
    
    return log_id;
end;
$$ language plpgsql security definer;

-- Function to clean up old audit logs (data retention compliance)
create or replace function cleanup_old_audit_logs(retention_months integer default 12)
returns integer as $$
declare
    deleted_count integer;
begin
    delete from public.audit_logs 
    where created_at < now() - (retention_months || ' months')::interval
    and action not in ('ACCOUNT_DELETION_RGPD', 'DATA_EXPORT_RGPD'); -- Keep important RGPD logs longer
    
    get diagnostics deleted_count = row_count;
    return deleted_count;
end;
$$ language plpgsql security definer;

-- =============================================
-- 7. GRANT PERMISSIONS
-- =============================================

-- Grant permissions for authenticated users
grant select on public.audit_logs to authenticated;
grant select on public.deletion_logs to authenticated;
grant all on public.data_export_logs to authenticated;
grant all on public.consent_logs to authenticated;

-- Grant function permissions
grant execute on function log_audit_event to authenticated;
grant execute on function log_consent_change to authenticated;

-- Service role gets full access for system operations
grant all on all tables in schema public to service_role;
grant execute on all functions in schema public to service_role;

-- =============================================
-- COMPLIANCE NOTES
-- =============================================

-- These tables support RGPD compliance by:
-- 1. Tracking all data operations (Article 5.2 - Accountability)
-- 2. Logging consent changes (Article 7 - Consent)
-- 3. Recording data exports (Article 20 - Portability)
-- 4. Documenting deletions (Article 17 - Right to erasure)
-- 5. Maintaining audit trails for DPA requests

-- Data retention:
-- - Audit logs: 12 months (configurable via cleanup function)
-- - Deletion logs: Permanent (compliance requirement)
-- - Export logs: 3 years (legal requirement)
-- - Consent logs: Until consent is withdrawn + 3 years