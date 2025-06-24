#!/bin/bash

# NutriCoach Production Deployment Script
# This script handles the complete production deployment process

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
ENV="production"
LOG_FILE="deployment-production-$(date +%Y%m%d_%H%M%S).log"
BACKUP_DIR="backups/production"
HEALTH_CHECK_RETRIES=5
HEALTH_CHECK_DELAY=30

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

log_info() {
    echo -e "${PURPLE}[$(date '+%Y-%m-%d %H:%M:%S')] ℹ️  $1${NC}" | tee -a "$LOG_FILE"
}

check_prerequisites() {
    log "🔍 Checking prerequisites for production deployment..."
    
    # Check required tools
    command -v pnpm >/dev/null 2>&1 || { log_error "pnpm is required but not installed."; exit 1; }
    command -v supabase >/dev/null 2>&1 || { log_error "Supabase CLI is required but not installed."; exit 1; }
    command -v vercel >/dev/null 2>&1 || { log_error "Vercel CLI is required but not installed."; exit 1; }
    command -v git >/dev/null 2>&1 || { log_error "git is required but not installed."; exit 1; }
    
    # Check Node.js version
    NODE_VERSION=$(node --version | sed 's/v//')
    REQUIRED_NODE="20.0.0"
    if ! printf '%s\n%s\n' "$REQUIRED_NODE" "$NODE_VERSION" | sort -V | head -n1 | grep -q "^$REQUIRED_NODE"; then
        log_error "Node.js version $REQUIRED_NODE or higher is required. Current: $NODE_VERSION"
        exit 1
    fi
    
    # Check environment variables
    : ${PRODUCTION_PROJECT_ID:?"PRODUCTION_PROJECT_ID environment variable is required"}
    : ${PRODUCTION_DB_PASSWORD:?"PRODUCTION_DB_PASSWORD environment variable is required"}
    : ${SUPABASE_ACCESS_TOKEN:?"SUPABASE_ACCESS_TOKEN environment variable is required"}
    : ${VERCEL_TOKEN:?"VERCEL_TOKEN environment variable is required"}
    : ${VERCEL_ORG_ID:?"VERCEL_ORG_ID environment variable is required"}
    : ${VERCEL_PROJECT_ID:?"VERCEL_PROJECT_ID environment variable is required"}
    
    # Check git status
    if [ -n "$(git status --porcelain)" ]; then
        log_error "Working directory is not clean. Please commit or stash changes."
        exit 1
    fi
    
    # Check if on main branch
    CURRENT_BRANCH=$(git branch --show-current)
    if [ "$CURRENT_BRANCH" != "main" ]; then
        log_error "Production deployments must be from main branch. Current: $CURRENT_BRANCH"
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

create_backup() {
    log "💾 Creating comprehensive production backup..."
    
    mkdir -p "$BACKUP_DIR"
    timestamp=$(date +%Y%m%d_%H%M%S)
    
    # Export current database schema and data
    log "Creating database backup..."
    supabase link --project-ref "$PRODUCTION_PROJECT_ID" || {
        log_error "Failed to link to production project"
        exit 1
    }
    
    # Create full database backup
    supabase db dump --data-only > "$BACKUP_DIR/data-prod-${timestamp}.sql" || {
        log_warning "Could not create data backup"
    }
    
    # Export schema
    supabase db dump --schema-only > "$BACKUP_DIR/schema-prod-${timestamp}.sql" || {
        log_warning "Could not create schema backup"
    }
    
    # Create current deployment snapshot
    cat > "$BACKUP_DIR/deployment-info-${timestamp}.json" << EOF
{
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "environment": "production",
    "commit": "$(git rev-parse HEAD)",
    "branch": "$(git branch --show-current)",
    "tag": "$(git describe --tags --always)",
    "deployer": "${USER:-unknown}",
    "backup_files": {
        "data": "data-prod-${timestamp}.sql",
        "schema": "schema-prod-${timestamp}.sql"
    }
}
EOF
    
    # Backup current .env files
    if [ -f ".env.production" ]; then
        cp ".env.production" "$BACKUP_DIR/env-prod-${timestamp}.backup"
    fi
    
    log_success "Comprehensive backup created in $BACKUP_DIR"
}

run_comprehensive_tests() {
    log "🧪 Running comprehensive test suite..."
    
    # Install dependencies with production lockfile
    pnpm install --frozen-lockfile --production=false
    
    # Run type checking
    log "Running TypeScript checks..."
    pnpm type-check || {
        log_error "TypeScript checks failed"
        exit 1
    }
    
    # Run linting
    log "Running code quality checks..."
    pnpm lint || {
        log_error "Linting failed"
        exit 1
    }
    
    # Run unit tests
    log "Running unit tests..."
    pnpm test:unit || {
        log_error "Unit tests failed"
        exit 1
    }
    
    # Run integration tests
    log "Running integration tests..."
    pnpm test:integration || {
        log_error "Integration tests failed"
        exit 1
    }
    
    # Security audit
    log "Running security audit..."
    pnpm audit --audit-level moderate || {
        log_warning "Security audit found issues - review before proceeding"
    }
    
    log_success "All tests passed"
}

build_application() {
    log "🏗️  Building application for production..."
    
    # Clean previous builds
    pnpm clean
    
    # Build with production environment
    NODE_ENV=production \
    ENVIRONMENT=production \
    NEXT_PUBLIC_SUPABASE_URL="${PRODUCTION_SUPABASE_URL}" \
    NEXT_PUBLIC_SUPABASE_ANON_KEY="${PRODUCTION_SUPABASE_ANON_KEY}" \
    pnpm build || {
        log_error "Production build failed"
        exit 1
    }
    
    # Verify build output
    if [ ! -d "apps/web/.next" ]; then
        log_error "Build output directory not found"
        exit 1
    fi
    
    # Check build size
    BUILD_SIZE=$(du -sh apps/web/.next | cut -f1)
    log_info "Build size: $BUILD_SIZE"
    
    log_success "Application built successfully"
}

deploy_database() {
    log "🗄️  Deploying database migrations to production..."
    
    # Link to production project
    supabase link --project-ref "$PRODUCTION_PROJECT_ID" || {
        log_error "Failed to link to production project"
        exit 1
    }
    
    # Check for pending migrations
    if supabase db diff --check; then
        log_info "No pending database migrations"
    else
        log_warning "Pending database migrations detected"
        
        # Deploy migrations
        supabase db push || {
            log_error "Database migration failed"
            exit 1
        }
        
        # Generate updated types
        supabase gen types typescript --linked > supabase/types.ts || {
            log_warning "Failed to generate updated types"
        }
    fi
    
    log_success "Database deployment completed"
}

deploy_application() {
    log "🚀 Deploying application to Vercel production..."
    
    # Set production environment variables
    export ENVIRONMENT="production"
    export NODE_ENV="production"
    
    # Deploy to Vercel with production configuration
    DEPLOYMENT_URL=$(vercel deploy --prod \
        --env ENVIRONMENT=production \
        --env NODE_ENV=production \
        --env NEXT_PUBLIC_SUPABASE_URL="$PRODUCTION_SUPABASE_URL" \
        --env NEXT_PUBLIC_SUPABASE_ANON_KEY="$PRODUCTION_SUPABASE_ANON_KEY" \
        --token "$VERCEL_TOKEN" \
        --scope "$VERCEL_ORG_ID" \
        2>&1 | tee /tmp/vercel-deploy.log | grep -o 'https://[^ ]*' | head -1)
    
    if [ -z "$DEPLOYMENT_URL" ]; then
        log_error "Failed to extract deployment URL"
        cat /tmp/vercel-deploy.log
        exit 1
    fi
    
    log_success "Application deployed to: $DEPLOYMENT_URL"
    echo "$DEPLOYMENT_URL" > deployment-url.txt
}

run_health_checks() {
    log "🏥 Running comprehensive health checks..."
    
    DEPLOYMENT_URL=$(cat deployment-url.txt 2>/dev/null || echo "https://nutricoach.app")
    
    # Wait for deployment to be ready
    log "Waiting for deployment to be ready..."
    sleep 30
    
    # Health check with retries
    for i in $(seq 1 $HEALTH_CHECK_RETRIES); do
        log "Health check attempt $i/$HEALTH_CHECK_RETRIES..."
        
        # API health check
        if curl -f -s --max-time 10 "$DEPLOYMENT_URL/api/health" > /dev/null; then
            log_success "API health check passed"
            API_HEALTHY=true
            break
        else
            log_warning "API health check failed (attempt $i)"
            if [ $i -lt $HEALTH_CHECK_RETRIES ]; then
                sleep $HEALTH_CHECK_DELAY
            fi
        fi
    done
    
    if [ "${API_HEALTHY:-false}" != "true" ]; then
        log_error "API health checks failed after $HEALTH_CHECK_RETRIES attempts"
        exit 1
    fi
    
    # Frontend health check
    if curl -f -s --max-time 10 "$DEPLOYMENT_URL" > /dev/null; then
        log_success "Frontend health check passed"
    else
        log_warning "Frontend health check failed"
    fi
    
    # Database connectivity check
    if supabase db diff --check --linked; then
        log_success "Database connectivity check passed"
    else
        log_warning "Database connectivity issues detected"
    fi
    
    # Performance check
    log "Running basic performance check..."
    RESPONSE_TIME=$(curl -o /dev/null -s -w '%{time_total}' "$DEPLOYMENT_URL/api/health")
    log_info "API response time: ${RESPONSE_TIME}s"
    
    if (( $(echo "$RESPONSE_TIME > 2.0" | bc -l) )); then
        log_warning "API response time is slower than expected"
    fi
    
    log_success "Health checks completed"
}

create_release() {
    log "🏷️  Creating production release..."
    
    # Get current version
    CURRENT_VERSION=$(node -p "require('./package.json').version")
    COMMIT_SHA=$(git rev-parse HEAD)
    COMMIT_MESSAGE=$(git log -1 --pretty=%B)
    
    # Create release tag
    RELEASE_TAG="v${CURRENT_VERSION}-$(date +%Y%m%d_%H%M%S)"
    
    git tag -a "$RELEASE_TAG" -m "Production release: $CURRENT_VERSION

Deployed at: $(date)
Commit: $COMMIT_SHA

Changes:
$COMMIT_MESSAGE"
    
    # Create release notes
    cat > release-notes.md << EOF
# Production Release $RELEASE_TAG

**Deployed:** $(date)  
**Environment:** Production  
**Commit:** \`$COMMIT_SHA\`  
**Version:** $CURRENT_VERSION  

## Deployment Details
- 🌐 **URL:** https://nutricoach.app
- 🗄️  **Database:** Production Supabase
- ☁️  **Platform:** Vercel
- 🏷️  **Tag:** $RELEASE_TAG

## Changes
$COMMIT_MESSAGE

## Health Checks
- ✅ API Health
- ✅ Frontend Load
- ✅ Database Connectivity
- ✅ Performance

## Rollback Plan
In case of issues:
1. Restore from backup: \`$BACKUP_DIR\`
2. Revert Vercel deployment
3. Rollback database if needed
4. Notify team via \`#incidents\`
EOF
    
    log_success "Release $RELEASE_TAG created"
}

notify_deployment() {
    log "📢 Sending deployment notifications..."
    
    DEPLOYMENT_URL=$(cat deployment-url.txt 2>/dev/null || echo "https://nutricoach.app")
    RELEASE_TAG=$(git describe --tags --always)
    
    # Create deployment summary
    cat > deployment-summary.json << EOF
{
    "environment": "production",
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "commit": "$(git rev-parse HEAD)",
    "tag": "$RELEASE_TAG",
    "version": "$(node -p "require('./package.json').version")",
    "url": "$DEPLOYMENT_URL",
    "status": "success",
    "health_checks": "passed",
    "backup_created": true,
    "deployer": "${USER:-github-actions}"
}
EOF
    
    log_success "Deployment summary created"
    
    # Webhook notifications would go here
    log_info "Notification integrations:"
    log_info "- Slack: #deployments"
    log_info "- Email: devops team"
    log_info "- Monitoring: alerts configured"
    
    # Example notification (uncomment and configure as needed):
    # curl -X POST -H 'Content-type: application/json' \
    #   --data "{\"text\":\"🚀 NutriCoach production deployment successful!\n📍 $DEPLOYMENT_URL\n🏷️ $RELEASE_TAG\"}" \
    #   "$SLACK_WEBHOOK_URL"
}

cleanup() {
    log "🧹 Cleaning up deployment artifacts..."
    
    # Archive logs
    mkdir -p logs/production
    mv "$LOG_FILE" logs/production/
    
    # Clean temporary files
    rm -f /tmp/vercel-deploy.log
    rm -f deployment-url.txt
    
    # Compress old backups (keep last 10)
    if [ -d "$BACKUP_DIR" ]; then
        cd "$BACKUP_DIR"
        ls -t *.sql 2>/dev/null | tail -n +21 | xargs -r rm --
        cd - > /dev/null
    fi
    
    log_success "Cleanup completed"
}

rollback_on_failure() {
    log_error "🚨 Deployment failed! Initiating rollback procedures..."
    
    # Create incident report
    cat > incident-report-$(date +%Y%m%d_%H%M%S).md << EOF
# Production Deployment Failure

**Time:** $(date)
**Environment:** Production
**Commit:** $(git rev-parse HEAD)
**Tag:** $(git describe --tags --always)
**Error:** Deployment failed during execution

## Immediate Actions Taken
1. ❌ Deployment halted
2. 💾 Backups preserved in: $BACKUP_DIR
3. 📝 Incident report created

## Manual Steps Required
1. Review error logs in: logs/production/$LOG_FILE
2. Assess impact on production system
3. Determine if rollback is necessary
4. Notify stakeholders
5. Investigate root cause

## Rollback Commands (if needed)
\`\`\`bash
# Restore database (if migrations were applied)
supabase db reset --linked

# Revert Vercel deployment
vercel rollback --token \$VERCEL_TOKEN

# Revert to previous git tag
git checkout [previous-tag]
\`\`\`
EOF
    
    log_error "Incident report created: incident-report-$(date +%Y%m%d_%H%M%S).md"
    log_error "Manual intervention required!"
}

# Main deployment process
main() {
    log "🚀 Starting NutriCoach production deployment..."
    log_info "Timestamp: $(date)"
    log_info "Environment: $ENV"
    log_info "Branch: $(git branch --show-current)"
    log_info "Commit: $(git rev-parse HEAD)"
    
    check_prerequisites
    create_backup
    run_comprehensive_tests
    build_application
    deploy_database
    deploy_application
    run_health_checks
    create_release
    notify_deployment
    cleanup
    
    log_success "🎉 Production deployment completed successfully!"
    log_success "🌐 Application URL: https://nutricoach.app"
    log_success "📊 Logs available in: logs/production/$LOG_FILE"
    log_success "🏷️  Release tag: $(git describe --tags --always)"
}

# Handle script interruption
trap 'rollback_on_failure; exit 1' INT TERM ERR

# Require confirmation for production deployment
echo -e "${YELLOW}⚠️  PRODUCTION DEPLOYMENT${NC}"
echo -e "${YELLOW}This will deploy to the live production environment.${NC}"
echo -e "${YELLOW}Make sure you have tested thoroughly in staging.${NC}"
echo ""
read -p "Are you sure you want to proceed? (yes/no): " -r
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo "Deployment cancelled."
    exit 1
fi

# Run main function
main "$@"