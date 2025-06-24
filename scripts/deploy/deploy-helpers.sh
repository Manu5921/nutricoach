#!/bin/bash

# NutriCoach Deployment Helper Functions
# Shared utilities for deployment scripts

# Colors for output
export RED='\033[0;31m'
export GREEN='\033[0;32m'
export YELLOW='\033[1;33m'
export BLUE='\033[0;34m'
export PURPLE='\033[0;35m'
export NC='\033[0m' # No Color

# Logging functions
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a "${LOG_FILE:-deployment.log}"
}

log_success() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] ✅ $1${NC}" | tee -a "${LOG_FILE:-deployment.log}"
}

log_warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] ⚠️  $1${NC}" | tee -a "${LOG_FILE:-deployment.log}"
}

log_error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ❌ $1${NC}" | tee -a "${LOG_FILE:-deployment.log}"
}

log_info() {
    echo -e "${PURPLE}[$(date '+%Y-%m-%d %H:%M:%S')] ℹ️  $1${NC}" | tee -a "${LOG_FILE:-deployment.log}"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check Node.js version
check_node_version() {
    local required_version="${1:-20.0.0}"
    
    if ! command_exists node; then
        log_error "Node.js is not installed"
        return 1
    fi
    
    local current_version=$(node --version | sed 's/v//')
    
    if ! printf '%s\n%s\n' "$required_version" "$current_version" | sort -V | head -n1 | grep -q "^$required_version"; then
        log_error "Node.js version $required_version or higher is required. Current: $current_version"
        return 1
    fi
    
    log_success "Node.js version check passed: $current_version"
    return 0
}

# Check environment variables
check_env_vars() {
    local vars=("$@")
    local missing=()
    
    for var in "${vars[@]}"; do
        if [[ -z "${!var}" ]]; then
            missing+=("$var")
        fi
    done
    
    if [[ ${#missing[@]} -ne 0 ]]; then
        log_error "Missing required environment variables:"
        printf '  - %s\n' "${missing[@]}"
        return 1
    fi
    
    log_success "Environment variables check passed"
    return 0
}

# Check git status
check_git_status() {
    if [[ -n "$(git status --porcelain)" ]]; then
        log_error "Working directory is not clean. Please commit or stash changes."
        git status --short
        return 1
    fi
    
    log_success "Git working directory is clean"
    return 0
}

# Check git branch
check_git_branch() {
    local required_branch="$1"
    local current_branch=$(git branch --show-current)
    
    if [[ "$current_branch" != "$required_branch" ]]; then
        log_error "Must be on '$required_branch' branch. Current: $current_branch"
        return 1
    fi
    
    log_success "Git branch check passed: $current_branch"
    return 0
}

# Health check function
health_check() {
    local url="$1"
    local retries="${2:-5}"
    local delay="${3:-10}"
    
    log "Running health check on $url"
    
    for i in $(seq 1 "$retries"); do
        log "Health check attempt $i/$retries..."
        
        if curl -f -s --max-time 10 "$url" > /dev/null; then
            log_success "Health check passed"
            return 0
        else
            log_warning "Health check failed (attempt $i)"
            if [[ $i -lt $retries ]]; then
                sleep "$delay"
            fi
        fi
    done
    
    log_error "Health check failed after $retries attempts"
    return 1
}

# Create backup
create_db_backup() {
    local env="$1"
    local project_id="$2"
    local backup_dir="${3:-backups/$env}"
    
    log "Creating database backup for $env environment..."
    
    mkdir -p "$backup_dir"
    local timestamp=$(date +%Y%m%d_%H%M%S)
    
    # Link to project
    supabase link --project-ref "$project_id" || {
        log_error "Failed to link to $env project"
        return 1
    }
    
    # Create data backup
    if supabase db dump --data-only > "$backup_dir/data-${env}-${timestamp}.sql"; then
        log_success "Data backup created: data-${env}-${timestamp}.sql"
    else
        log_warning "Could not create data backup"
    fi
    
    # Create schema backup
    if supabase db dump --schema-only > "$backup_dir/schema-${env}-${timestamp}.sql"; then
        log_success "Schema backup created: schema-${env}-${timestamp}.sql"
    else
        log_warning "Could not create schema backup"
    fi
    
    # Create backup metadata
    cat > "$backup_dir/backup-info-${timestamp}.json" << EOF
{
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "environment": "$env",
    "project_id": "$project_id",
    "commit": "$(git rev-parse HEAD)",
    "branch": "$(git branch --show-current)",
    "files": {
        "data": "data-${env}-${timestamp}.sql",
        "schema": "schema-${env}-${timestamp}.sql"
    }
}
EOF
    
    log_success "Backup completed for $env environment"
    return 0
}

# Deploy to Vercel
deploy_to_vercel() {
    local env="$1"
    local env_vars="$2"
    
    log "Deploying to Vercel ($env environment)..."
    
    local deploy_args="--token $VERCEL_TOKEN --scope $VERCEL_ORG_ID"
    
    if [[ "$env" == "production" ]]; then
        deploy_args="$deploy_args --prod"
    fi
    
    # Add environment variables
    if [[ -n "$env_vars" ]]; then
        deploy_args="$deploy_args $env_vars"
    fi
    
    # Deploy and capture URL
    local deployment_output
    deployment_output=$(vercel deploy $deploy_args 2>&1)
    local exit_code=$?
    
    if [[ $exit_code -eq 0 ]]; then
        local deployment_url=$(echo "$deployment_output" | grep -o 'https://[^ ]*' | head -1)
        echo "$deployment_url" > "deployment-url-${env}.txt"
        log_success "Deployment successful: $deployment_url"
        return 0
    else
        log_error "Deployment failed:"
        echo "$deployment_output"
        return 1
    fi
}

# Run tests
run_test_suite() {
    local test_type="${1:-all}"
    
    log "Running test suite: $test_type"
    
    case "$test_type" in
        "unit")
            pnpm test:unit || return 1
            ;;
        "integration")
            pnpm test:integration || return 1
            ;;
        "e2e")
            pnpm test:e2e || return 1
            ;;
        "all")
            pnpm test:unit || return 1
            pnpm test:integration || return 1
            # E2E tests are optional for faster deployments
            if [[ "${SKIP_E2E:-false}" != "true" ]]; then
                pnpm test:e2e || return 1
            fi
            ;;
        *)
            log_error "Unknown test type: $test_type"
            return 1
            ;;
    esac
    
    log_success "Test suite completed: $test_type"
    return 0
}

# Security checks
run_security_checks() {
    log "Running security checks..."
    
    # Audit dependencies
    if ! pnpm audit --audit-level moderate; then
        log_warning "Security vulnerabilities found in dependencies"
    fi
    
    # Check for secrets (basic check)
    if grep -r -i "password\|secret\|key\|token" --include="*.env*" . 2>/dev/null | grep -v ".env.example"; then
        log_warning "Potential secrets found in files. Please review."
    fi
    
    log_success "Security checks completed"
    return 0
}

# Cleanup function
cleanup_deployment() {
    local env="$1"
    
    log "Cleaning up deployment artifacts..."
    
    # Clean temporary files
    rm -f "/tmp/vercel-deploy-${env}.log"
    rm -f "deployment-url-${env}.txt"
    
    # Archive logs
    local log_dir="logs/${env}"
    mkdir -p "$log_dir"
    
    if [[ -n "${LOG_FILE:-}" && -f "$LOG_FILE" ]]; then
        mv "$LOG_FILE" "$log_dir/"
    fi
    
    log_success "Cleanup completed"
}

# Rollback function
rollback_deployment() {
    local env="$1"
    local reason="${2:-Manual rollback requested}"
    
    log_error "🚨 Initiating rollback for $env environment"
    log_error "Reason: $reason"
    
    # Create incident report
    local incident_file="incident-${env}-$(date +%Y%m%d_%H%M%S).md"
    
    cat > "$incident_file" << EOF
# Deployment Rollback - $env

**Time:** $(date)
**Environment:** $env
**Commit:** $(git rev-parse HEAD)
**Branch:** $(git branch --show-current)
**Reason:** $reason

## Actions Taken
1. ❌ Deployment halted
2. 📝 Incident report created

## Manual Steps Required
1. Review error logs
2. Assess system impact
3. Execute rollback if necessary
4. Notify stakeholders
5. Investigate root cause

## Rollback Commands
\`\`\`bash
# Revert Vercel deployment
vercel rollback --token \$VERCEL_TOKEN

# Revert database (if needed)
# supabase db reset --linked

# Revert to previous commit
git checkout [previous-commit]
\`\`\`
EOF
    
    log_error "Incident report created: $incident_file"
    log_error "Manual intervention required!"
    
    return 1
}

# Notification function
send_notification() {
    local type="$1"      # success, failure, warning
    local message="$2"
    local channel="${3:-#deployments}"
    
    local webhook_url=""
    case "$type" in
        "success")
            webhook_url="${SLACK_WEBHOOK_URL:-}"
            ;;
        "failure"|"error")
            webhook_url="${SLACK_WEBHOOK_URL:-}"
            ;;
        "security")
            webhook_url="${SECURITY_SLACK_WEBHOOK_URL:-}"
            ;;
    esac
    
    if [[ -n "$webhook_url" ]]; then
        local emoji=""
        case "$type" in
            "success") emoji="✅" ;;
            "failure"|"error") emoji="❌" ;;
            "warning") emoji="⚠️" ;;
            "security") emoji="🚨" ;;
        esac
        
        local payload=$(cat << EOF
{
    "channel": "$channel",
    "text": "$emoji $message",
    "username": "NutriCoach Deploy Bot"
}
EOF
        )
        
        curl -X POST -H 'Content-type: application/json' \
             --data "$payload" \
             "$webhook_url" >/dev/null 2>&1 || true
    fi
}

# Progress indicator
show_progress() {
    local current="$1"
    local total="$2"
    local task="$3"
    
    local percent=$((current * 100 / total))
    local filled=$((current * 40 / total))
    local empty=$((40 - filled))
    
    printf "\r${BLUE}Progress: ["
    printf "%*s" $filled | tr ' ' '='
    printf "%*s" $empty | tr ' ' '-'
    printf "] %d%% - %s${NC}" $percent "$task"
    
    if [[ $current -eq $total ]]; then
        echo
    fi
}

# Export functions for use in other scripts
export -f log log_success log_warning log_error log_info
export -f command_exists check_node_version check_env_vars
export -f check_git_status check_git_branch health_check
export -f create_db_backup deploy_to_vercel run_test_suite
export -f run_security_checks cleanup_deployment rollback_deployment
export -f send_notification show_progress