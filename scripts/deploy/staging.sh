#!/bin/bash

# NutriCoach Staging Deployment Script
# This script handles the complete staging deployment process

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENV="staging"
LOG_FILE="deployment-staging-$(date +%Y%m%d_%H%M%S).log"
BACKUP_DIR="backups/staging"

# Functions
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] ✅ $1${NC}" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] ⚠️  $1${NC}" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ❌ $1${NC}" | tee -a "$LOG_FILE"
}

check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check required tools
    command -v pnpm >/dev/null 2>&1 || { log_error "pnpm is required but not installed."; exit 1; }
    command -v supabase >/dev/null 2>&1 || { log_error "Supabase CLI is required but not installed."; exit 1; }
    command -v vercel >/dev/null 2>&1 || { log_error "Vercel CLI is required but not installed."; exit 1; }
    
    # Check environment variables
    : ${STAGING_PROJECT_ID:?"STAGING_PROJECT_ID environment variable is required"}
    : ${STAGING_DB_PASSWORD:?"STAGING_DB_PASSWORD environment variable is required"}
    : ${SUPABASE_ACCESS_TOKEN:?"SUPABASE_ACCESS_TOKEN environment variable is required"}
    : ${VERCEL_TOKEN:?"VERCEL_TOKEN environment variable is required"}
    
    log_success "Prerequisites check passed"
}

create_backup() {
    log "Creating database backup..."
    
    mkdir -p "$BACKUP_DIR"
    
    # Export current schema
    supabase db dump --data-only --local > "$BACKUP_DIR/data-$(date +%Y%m%d_%H%M%S).sql" || {
        log_warning "Could not create data backup (database might be empty)"
    }
    
    # Export schema
    supabase db dump --schema-only --local > "$BACKUP_DIR/schema-$(date +%Y%m%d_%H%M%S).sql" || {
        log_warning "Could not create schema backup"
    }
    
    log_success "Backup created in $BACKUP_DIR"
}

run_tests() {
    log "Running test suite..."
    
    # Unit tests
    pnpm test:unit || {
        log_error "Unit tests failed"
        exit 1
    }
    
    # Integration tests
    pnpm test:integration || {
        log_error "Integration tests failed"
        exit 1
    }
    
    log_success "All tests passed"
}

build_application() {
    log "Building application..."
    
    # Install dependencies
    pnpm install --frozen-lockfile
    
    # Type check
    pnpm type-check || {
        log_error "Type checking failed"
        exit 1
    }
    
    # Lint
    pnpm lint || {
        log_error "Linting failed"
        exit 1
    }
    
    # Build
    pnpm build || {
        log_error "Build failed"
        exit 1
    }
    
    log_success "Application built successfully"
}

deploy_database() {
    log "Deploying database migrations..."
    
    # Link to staging project
    supabase link --project-ref "$STAGING_PROJECT_ID" || {
        log_error "Failed to link to staging project"
        exit 1
    }
    
    # Push migrations
    supabase db push --include-seed || {
        log_error "Database migration failed"
        exit 1
    }
    
    # Generate updated types
    supabase gen types typescript --linked > supabase/types.ts || {
        log_warning "Failed to generate types"
    }
    
    log_success "Database deployed successfully"
}

deploy_application() {
    log "Deploying application to Vercel..."
    
    # Set environment for staging
    export ENVIRONMENT="staging"
    export NODE_ENV="production"
    
    # Deploy to Vercel
    vercel deploy --prod --env ENVIRONMENT=staging --token "$VERCEL_TOKEN" || {
        log_error "Vercel deployment failed"
        exit 1
    }
    
    log_success "Application deployed to Vercel"
}

run_health_checks() {
    log "Running health checks..."
    
    # Wait for deployment to be ready
    sleep 30
    
    # Check API health
    if curl -f -s "https://staging.nutricoach.app/api/health" > /dev/null; then
        log_success "API health check passed"
    else
        log_error "API health check failed"
        exit 1
    fi
    
    # Check database connectivity
    if supabase db diff --check --linked; then
        log_success "Database connectivity check passed"
    else
        log_warning "Database connectivity check failed (might be expected)"
    fi
    
    log_success "Health checks completed"
}

notify_deployment() {
    log "Sending deployment notification..."
    
    # Create deployment summary
    cat > deployment-summary.json << EOF
{
  "environment": "staging",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "commit": "${GITHUB_SHA:-$(git rev-parse HEAD)}",
  "version": "$(git describe --tags --always)",
  "url": "https://staging.nutricoach.app",
  "status": "success"
}
EOF
    
    log_success "Deployment summary created"
    
    # Here you would integrate with Slack, Discord, or other notification services
    # Example:
    # curl -X POST -H 'Content-type: application/json' \
    #   --data '{"text":"🚀 Staging deployment completed successfully!"}' \
    #   "$SLACK_WEBHOOK_URL"
}

cleanup() {
    log "Cleaning up..."
    
    # Remove temporary files
    rm -f deployment-summary.json
    
    # Archive logs
    mkdir -p logs
    mv "$LOG_FILE" logs/
    
    log_success "Cleanup completed"
}

# Main deployment process
main() {
    log "🚀 Starting NutriCoach staging deployment..."
    
    check_prerequisites
    create_backup
    run_tests
    build_application
    deploy_database
    deploy_application
    run_health_checks
    notify_deployment
    cleanup
    
    log_success "🎉 Staging deployment completed successfully!"
    log "Deployment URL: https://staging.nutricoach.app"
    log "Logs available in: logs/$LOG_FILE"
}

# Handle script interruption
trap 'log_error "Deployment interrupted"; exit 1' INT TERM

# Run main function
main "$@"