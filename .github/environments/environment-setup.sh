#!/bin/bash

# 🔧 GitHub Environments Setup Script for NutriCoach
# Automates the creation and configuration of GitHub environments with security controls

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REPO_OWNER="${GITHUB_REPOSITORY_OWNER:-nutricoach}"
REPO_NAME="${GITHUB_REPOSITORY_NAME:-nutricoach}"
GITHUB_TOKEN="${GITHUB_TOKEN:-}"

# Functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if GitHub CLI is installed
    if ! command -v gh &> /dev/null; then
        error "GitHub CLI (gh) is not installed. Please install it first."
        exit 1
    fi
    
    # Check if user is logged in to GitHub CLI
    if ! gh auth status &> /dev/null; then
        error "Please authenticate with GitHub CLI first: gh auth login"
        exit 1
    fi
    
    # Check if we can access the repository
    if ! gh repo view "${REPO_OWNER}/${REPO_NAME}" &> /dev/null; then
        error "Cannot access repository ${REPO_OWNER}/${REPO_NAME}. Please check permissions."
        exit 1
    fi
    
    success "Prerequisites check passed"
}

create_teams() {
    log "Creating GitHub teams..."
    
    # Define teams
    teams=(
        "devops-team:DevOps Team:Infrastructure and deployment management"
        "database-admin-team:Database Admin Team:Database operations and migrations"
        "security-team:Security Team:Security reviews and compliance"
        "senior-developers:Senior Developers:Code and architecture reviews"
        "senior-devops-team:Senior DevOps Team:Senior DevOps approval authority"
    )
    
    for team_info in "${teams[@]}"; do
        IFS=':' read -r team_slug team_name team_description <<< "$team_info"
        
        log "Creating team: $team_name"
        
        # Create team (this might fail if team already exists, which is fine)
        gh api \
            --method POST \
            -H "Accept: application/vnd.github+json" \
            "/orgs/${REPO_OWNER}/teams" \
            --field name="$team_name" \
            --field description="$team_description" \
            --field privacy="closed" \
            2>/dev/null || warning "Team $team_name may already exist"
        
        success "Team $team_name configured"
    done
}

create_environment() {
    local env_name=$1
    local description=$2
    local wait_timer=$3
    local required_reviewers=$4
    local reviewer_teams=$5
    local deployment_branches=$6
    
    log "Creating environment: $env_name"
    
    # Create environment
    gh api \
        --method PUT \
        -H "Accept: application/vnd.github+json" \
        "/repos/${REPO_OWNER}/${REPO_NAME}/environments/${env_name}" \
        --field wait_timer="$wait_timer" \
        --field prevent_self_review=true
    
    # Set protection rules if reviewers are required
    if [ "$required_reviewers" -gt 0 ]; then
        # Parse reviewer teams
        IFS=',' read -ra teams_array <<< "$reviewer_teams"
        teams_json="["
        for i in "${!teams_array[@]}"; do
            if [ $i -gt 0 ]; then
                teams_json+=","
            fi
            teams_json+="{\"type\":\"Team\",\"id\":\"${teams_array[$i]}\"}"
        done
        teams_json+="]"
        
        # Set protection rules
        gh api \
            --method PUT \
            -H "Accept: application/vnd.github+json" \
            "/repos/${REPO_OWNER}/${REPO_NAME}/environments/${env_name}" \
            --field wait_timer="$wait_timer" \
            --field prevent_self_review=true \
            --field reviewers="$teams_json"
    fi
    
    # Set deployment branch policy
    if [ -n "$deployment_branches" ]; then
        if [ "$deployment_branches" = "protected" ]; then
            gh api \
                --method PUT \
                -H "Accept: application/vnd.github+json" \
                "/repos/${REPO_OWNER}/${REPO_NAME}/environments/${env_name}" \
                --field deployment_branch_policy='{"protected_branches":true,"custom_branch_policies":false}'
        else
            # Custom branches
            IFS=',' read -ra branches_array <<< "$deployment_branches"
            branches_json="["
            for i in "${!branches_array[@]}"; do
                if [ $i -gt 0 ]; then
                    branches_json+=","
                fi
                branches_json+="{\"name\":\"${branches_array[$i]}\"}"
            done
            branches_json+="]"
            
            gh api \
                --method PUT \
                -H "Accept: application/vnd.github+json" \
                "/repos/${REPO_OWNER}/${REPO_NAME}/environments/${env_name}" \
                --field deployment_branch_policy="{\"protected_branches\":false,\"custom_branch_policies\":true}" \
                --field deployment_branch_policy.custom_branch_policies="$branches_json"
        fi
    fi
    
    success "Environment $env_name created successfully"
}

create_environments() {
    log "Creating GitHub environments..."
    
    # Staging Environment
    create_environment \
        "staging" \
        "Development testing and validation environment" \
        5 \
        0 \
        "" \
        "develop,feature/*,hotfix/*"
    
    # Production Environment
    create_environment \
        "production" \
        "Production environment serving live users with maximum security" \
        30 \
        2 \
        "devops-team,senior-developers" \
        "protected"
    
    # Staging Database Environment
    create_environment \
        "staging-db" \
        "Database schema and migration testing environment" \
        2 \
        0 \
        "" \
        "develop,feature/*,migration/*,schema/*"
    
    # Production Database Environment
    create_environment \
        "production-db" \
        "Ultra-secure production database environment with mandatory approvals" \
        60 \
        3 \
        "database-admin-team,security-team,senior-devops-team" \
        "protected"
}

setup_branch_protection() {
    log "Setting up branch protection rules..."
    
    # Main branch protection
    gh api \
        --method PUT \
        -H "Accept: application/vnd.github+json" \
        "/repos/${REPO_OWNER}/${REPO_NAME}/branches/main/protection" \
        --field required_status_checks='{"strict":true,"contexts":["security-checks","code-quality","tests"]}' \
        --field enforce_admins=true \
        --field required_pull_request_reviews='{"dismiss_stale_reviews":true,"require_code_owner_reviews":true,"required_approving_review_count":2}' \
        --field restrictions=null \
        2>/dev/null || warning "Main branch may not exist yet"
    
    # Develop branch protection
    gh api \
        --method PUT \
        -H "Accept: application/vnd.github+json" \
        "/repos/${REPO_OWNER}/${REPO_NAME}/branches/develop/protection" \
        --field required_status_checks='{"strict":true,"contexts":["security-checks","tests"]}' \
        --field enforce_admins=false \
        --field required_pull_request_reviews='{"dismiss_stale_reviews":false,"require_code_owner_reviews":false,"required_approving_review_count":1}' \
        --field restrictions=null \
        2>/dev/null || warning "Develop branch may not exist yet"
    
    success "Branch protection rules configured"
}

create_secrets_template() {
    log "Creating secrets template..."
    
    cat > secrets-template.md << 'EOF'
# 🔐 NutriCoach Secrets Configuration Template

This document provides a template for configuring GitHub repository secrets for each environment.

## Repository Secrets (Available to all environments)

### Shared Secrets
- `VERCEL_ORG_ID`: Vercel organization identifier
- `SUPABASE_ACCESS_TOKEN`: Supabase API access token
- `SLACK_WEBHOOK_URL`: Slack notifications webhook
- `PAGER_DUTY_SERVICE_KEY`: PagerDuty service key for critical alerts

## Environment-Specific Secrets

### Staging Environment Secrets
- `VERCEL_TOKEN_STAGING`: Vercel deployment token for staging
- `VERCEL_PROJECT_ID_STAGING`: Vercel project ID for staging
- `SUPABASE_PROJECT_REF_STAGING`: Supabase project reference for staging
- `SUPABASE_DB_URL_STAGING`: Staging database URL
- `SUPABASE_ANON_KEY_STAGING`: Staging anonymous key
- `SUPABASE_SERVICE_ROLE_KEY_STAGING`: Staging service role key
- `NEXTAUTH_SECRET_STAGING`: NextAuth secret for staging
- `NEXTAUTH_URL_STAGING`: NextAuth URL for staging
- `JWT_SECRET_STAGING`: JWT signing secret for staging
- `ENCRYPTION_KEY_STAGING`: Data encryption key for staging
- `OPENAI_API_KEY_STAGING`: OpenAI API key for staging
- `STRIPE_SECRET_KEY_STAGING`: Stripe secret key for staging
- `SENDGRID_API_KEY_STAGING`: SendGrid API key for staging
- `SENTRY_DSN_STAGING`: Sentry DSN for staging
- `DATADOG_API_KEY_STAGING`: Datadog API key for staging

### Production Environment Secrets
- `VERCEL_TOKEN_PRODUCTION`: Vercel deployment token for production
- `VERCEL_PROJECT_ID_PRODUCTION`: Vercel project ID for production
- `SUPABASE_PROJECT_REF_PRODUCTION`: Supabase project reference for production
- `SUPABASE_DB_URL_PRODUCTION`: Production database URL
- `SUPABASE_ANON_KEY_PRODUCTION`: Production anonymous key
- `SUPABASE_SERVICE_ROLE_KEY_PRODUCTION`: Production service role key
- `NEXTAUTH_SECRET_PRODUCTION`: NextAuth secret for production
- `NEXTAUTH_URL_PRODUCTION`: NextAuth URL for production
- `JWT_SECRET_PRODUCTION`: JWT signing secret for production
- `ENCRYPTION_KEY_PRODUCTION`: Data encryption key for production
- `OPENAI_API_KEY_PRODUCTION`: OpenAI API key for production
- `STRIPE_SECRET_KEY_PRODUCTION`: Stripe secret key for production
- `STRIPE_WEBHOOK_SECRET_PRODUCTION`: Stripe webhook secret for production
- `SENDGRID_API_KEY_PRODUCTION`: SendGrid API key for production
- `SENTRY_DSN_PRODUCTION`: Sentry DSN for production
- `DATADOG_API_KEY_PRODUCTION`: Datadog API key for production
- `NEW_RELIC_LICENSE_KEY`: New Relic license key
- `SECURITY_MONITORING_TOKEN`: Security monitoring token
- `AUDIT_LOG_TOKEN`: Audit logging token

### Database Environment Secrets
- `DATABASE_MIGRATION_TOKEN`: Database migration tool token
- `DATABASE_BACKUP_TOKEN_STAGING`: Staging database backup token
- `DATABASE_BACKUP_TOKEN_PRODUCTION`: Production database backup token
- `DATABASE_RESTORE_TOKEN_STAGING`: Staging database restore token
- `DATABASE_RESTORE_TOKEN_PRODUCTION`: Production database restore token
- `DATABASE_ENCRYPTION_KEY`: Database encryption key
- `DATABASE_MONITORING_TOKEN_STAGING`: Staging database monitoring token
- `DATABASE_MONITORING_TOKEN_PRODUCTION`: Production database monitoring token
- `DATABASE_ADMIN_TOKEN`: Database administration token
- `DATABASE_REPLICATION_TOKEN`: Database replication token
- `DATABASE_AUDIT_TOKEN`: Database audit logging token
- `COMPLIANCE_MONITORING_TOKEN`: Compliance monitoring token
- `SECURITY_SCANNER_TOKEN`: Security scanner token

### Additional Service Secrets
- `DATADOG_DATABASE_API_KEY`: Datadog database monitoring API key
- `NEW_RELIC_DATABASE_KEY`: New Relic database monitoring key
- `PAGER_DUTY_DATABASE_KEY`: PagerDuty database alerts service key

## Security Notes

1. **Never commit secrets to repository**
2. **Use different values for staging and production**
3. **Rotate secrets regularly (every 90 days minimum)**
4. **Use strong, randomly generated values**
5. **Monitor secret usage and access**
6. **Document secret rotation procedures**

## Setup Instructions

1. Go to repository Settings → Secrets and variables → Actions
2. Add Repository secrets (shared across all environments)
3. Go to repository Settings → Environments
4. For each environment, add the environment-specific secrets
5. Verify secrets are properly masked in workflow logs

EOF

    success "Secrets template created: secrets-template.md"
}

validate_setup() {
    log "Validating environment setup..."
    
    # Check if environments exist
    environments=("staging" "production" "staging-db" "production-db")
    
    for env in "${environments[@]}"; do
        if gh api "/repos/${REPO_OWNER}/${REPO_NAME}/environments/${env}" &> /dev/null; then
            success "Environment $env exists"
        else
            error "Environment $env not found"
        fi
    done
    
    success "Environment validation completed"
}

main() {
    echo "🔧 GitHub Environments Setup for NutriCoach"
    echo "============================================="
    
    check_prerequisites
    
    echo ""
    echo "This script will:"
    echo "1. Create GitHub teams"
    echo "2. Create GitHub environments with protection rules"
    echo "3. Set up branch protection rules"
    echo "4. Create secrets configuration template"
    echo "5. Validate the setup"
    echo ""
    
    read -p "Continue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Setup cancelled."
        exit 0
    fi
    
    create_teams
    echo ""
    
    create_environments
    echo ""
    
    setup_branch_protection
    echo ""
    
    create_secrets_template
    echo ""
    
    validate_setup
    echo ""
    
    success "🎉 GitHub environments setup completed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Review the secrets-template.md file"
    echo "2. Configure repository and environment secrets"
    echo "3. Assign team members to the created teams"
    echo "4. Test the deployment workflows"
    echo ""
    echo "For detailed information, see:"
    echo "- docs/SECURITY-GUIDE.md"
    echo "- .github/environments/*.yml"
}

# Run main function
main "$@"