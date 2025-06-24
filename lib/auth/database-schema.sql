-- NutriCoach Authentication & User Management Schema
-- Enhanced security for health data with encryption

-- Enable RLS (Row Level Security)
ALTER DATABASE postgres SET row_security = on;

-- Create custom types
CREATE TYPE subscription_status AS ENUM ('inactive', 'active', 'canceled', 'past_due', 'trialing');
CREATE TYPE privacy_level AS ENUM ('basic', 'enhanced', 'maximum');
CREATE TYPE security_level AS ENUM ('public', 'personal', 'sensitive', 'critical');
CREATE TYPE audit_action AS ENUM ('login', 'logout', 'profile_update', 'health_data_access', 'data_export', 'account_deletion', 'subscription_change');

-- Users table with enhanced security
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    
    -- Subscription information
    stripe_customer_id TEXT UNIQUE,
    subscription_status subscription_status DEFAULT 'inactive',
    subscription_id TEXT,
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    trial_ends_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',
    
    -- Health profile (encrypted)
    health_profile_encrypted TEXT, -- Encrypted JSON blob
    
    -- User preferences (non-sensitive)
    dietary_restrictions TEXT[] DEFAULT '{}',
    cuisine_preferences TEXT[] DEFAULT '{}',
    cooking_skill_level TEXT CHECK (cooking_skill_level IN ('beginner', 'intermediate', 'advanced')),
    meal_prep_time TEXT CHECK (meal_prep_time IN ('quick', 'medium', 'elaborate')),
    
    -- Privacy & consent
    data_retention_consent BOOLEAN DEFAULT false,
    marketing_consent BOOLEAN DEFAULT false,
    privacy_level privacy_level DEFAULT 'basic',
    
    -- Security tracking
    failed_login_attempts INTEGER DEFAULT 0,
    last_failed_login TIMESTAMPTZ,
    account_locked_until TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login_at TIMESTAMPTZ,
    email_verified_at TIMESTAMPTZ,
    
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Security audit logs
CREATE TABLE security_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    action audit_action NOT NULL,
    security_level security_level NOT NULL,
    data_accessed TEXT[], -- Fields that were accessed
    ip_address INET NOT NULL,
    user_agent TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    success BOOLEAN DEFAULT true,
    failure_reason TEXT,
    session_id TEXT,
    
    -- Index for efficient querying
    INDEX idx_audit_user_timestamp (user_id, timestamp DESC),
    INDEX idx_audit_action_timestamp (action, timestamp DESC)
);

-- Subscriptions tracking
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    stripe_subscription_id TEXT UNIQUE NOT NULL,
    stripe_customer_id TEXT NOT NULL,
    status subscription_status NOT NULL,
    current_period_start TIMESTAMPTZ NOT NULL,
    current_period_end TIMESTAMPTZ NOT NULL,
    cancel_at_period_end BOOLEAN DEFAULT false,
    canceled_at TIMESTAMPTZ,
    trial_start TIMESTAMPTZ,
    trial_end TIMESTAMPTZ,
    
    -- Pricing information
    amount_cents INTEGER NOT NULL,
    currency TEXT DEFAULT 'EUR',
    interval_type TEXT DEFAULT 'month',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Usage events for analytics
CREATE TABLE usage_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}',
    session_id TEXT,
    
    -- Partitioning by month for performance
    INDEX idx_usage_user_timestamp (user_id, timestamp DESC),
    INDEX idx_usage_event_timestamp (event_type, timestamp DESC)
);

-- User sessions for enhanced security
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_token TEXT UNIQUE NOT NULL,
    refresh_token TEXT UNIQUE,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    last_accessed TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    
    INDEX idx_sessions_token (session_token),
    INDEX idx_sessions_user_active (user_id, is_active, expires_at)
);

-- Data retention policies
CREATE TABLE data_retention_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    data_type TEXT NOT NULL, -- 'health_profile', 'usage_events', 'audit_logs'
    retention_period INTERVAL NOT NULL,
    last_cleanup TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security Policies

-- Users can only see their own data
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY users_own_data ON users FOR ALL USING (auth.uid() = id);

-- Audit logs - users can only see their own
ALTER TABLE security_audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY audit_own_data ON security_audit_logs FOR SELECT USING (auth.uid() = user_id);

-- Subscriptions - users can only see their own
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY subscriptions_own_data ON subscriptions FOR ALL USING (auth.uid() = user_id);

-- Usage events - users can only see their own
ALTER TABLE usage_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY usage_own_data ON usage_events FOR ALL USING (auth.uid() = user_id);

-- Sessions - users can only see their own
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY sessions_own_data ON user_sessions FOR ALL USING (auth.uid() = user_id);

-- Functions for security

-- Function to update user's last login
CREATE OR REPLACE FUNCTION update_last_login()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE users 
    SET last_login_at = NOW(),
        failed_login_attempts = 0,
        account_locked_until = NULL
    WHERE id = NEW.user_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for successful logins
CREATE TRIGGER trigger_update_last_login
    AFTER INSERT ON security_audit_logs
    FOR EACH ROW
    WHEN (NEW.action = 'login' AND NEW.success = true)
    EXECUTE FUNCTION update_last_login();

-- Function to handle failed logins
CREATE OR REPLACE FUNCTION handle_failed_login(user_email TEXT)
RETURNS VOID AS $$
DECLARE
    user_record RECORD;
    lock_duration INTERVAL;
BEGIN
    SELECT * INTO user_record FROM users WHERE email = user_email;
    
    IF user_record.id IS NOT NULL THEN
        -- Increment failed attempts
        UPDATE users 
        SET failed_login_attempts = failed_login_attempts + 1,
            last_failed_login = NOW()
        WHERE id = user_record.id;
        
        -- Lock account after 5 failed attempts
        IF user_record.failed_login_attempts + 1 >= 5 THEN
            lock_duration := INTERVAL '30 minutes';
            UPDATE users 
            SET account_locked_until = NOW() + lock_duration
            WHERE id = user_record.id;
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if account is locked
CREATE OR REPLACE FUNCTION is_account_locked(user_email TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    user_record RECORD;
BEGIN
    SELECT account_locked_until INTO user_record 
    FROM users 
    WHERE email = user_email;
    
    IF user_record.account_locked_until IS NULL THEN
        RETURN false;
    END IF;
    
    RETURN user_record.account_locked_until > NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM user_sessions 
    WHERE expires_at < NOW() OR NOT is_active;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to encrypt sensitive data (placeholder - actual encryption in app)
CREATE OR REPLACE FUNCTION encrypt_health_data(data_json JSONB)
RETURNS TEXT AS $$
BEGIN
    -- This is a placeholder - actual encryption happens in the application layer
    -- We store the encrypted string here
    RETURN data_json::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Updated timestamp function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_stripe_customer ON users(stripe_customer_id);
CREATE INDEX idx_users_subscription_status ON users(subscription_status);
CREATE INDEX idx_users_trial_ends ON users(trial_ends_at) WHERE trial_ends_at IS NOT NULL;

-- Views for common queries

-- Active subscribers view
CREATE VIEW active_subscribers AS
SELECT 
    u.id,
    u.email,
    u.full_name,
    u.subscription_status,
    s.current_period_end,
    s.amount_cents,
    s.currency
FROM users u
JOIN subscriptions s ON u.id = s.user_id
WHERE u.subscription_status = 'active'
AND s.current_period_end > NOW();

-- User security summary view
CREATE VIEW user_security_summary AS
SELECT 
    u.id,
    u.email,
    u.privacy_level,
    u.failed_login_attempts,
    u.account_locked_until,
    u.last_login_at,
    COUNT(sal.id) as audit_log_count,
    MAX(sal.timestamp) as last_audit_entry
FROM users u
LEFT JOIN security_audit_logs sal ON u.id = sal.user_id
GROUP BY u.id, u.email, u.privacy_level, u.failed_login_attempts, u.account_locked_until, u.last_login_at;

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Comments for documentation
COMMENT ON TABLE users IS 'Main user table with enhanced security for health data';
COMMENT ON COLUMN users.health_profile_encrypted IS 'Encrypted JSON containing sensitive health information';
COMMENT ON TABLE security_audit_logs IS 'Comprehensive audit trail for security monitoring';
COMMENT ON TABLE subscriptions IS 'Stripe subscription tracking with billing information';
COMMENT ON TABLE usage_events IS 'User behavior analytics for product insights';
COMMENT ON TABLE user_sessions IS 'Active user sessions for enhanced security control';