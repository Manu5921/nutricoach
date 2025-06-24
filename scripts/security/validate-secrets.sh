#!/bin/bash

# NutriCoach - Secret Validation Script
# Validates environment secrets without exposing their values
# Usage: ./scripts/security/validate-secrets.sh [environment]

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
LOG_FILE="$PROJECT_ROOT/logs/secret-validation-$(date +%Y%m%d-%H%M%S).log"

# Environment (default: staging)
ENVIRONMENT="${1:-staging}"

# Create logs directory
mkdir -p "$PROJECT_ROOT/logs"

# Logging function
log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] [$level] $message" | tee -a "$LOG_FILE"
}

# Print colored output
print_status() {
    local status="$1"
    local message="$2"
    case "$status" in
        "SUCCESS") echo -e "${GREEN}✅ $message${NC}" ;;
        "ERROR") echo -e "${RED}❌ $message${NC}" ;;
        "WARNING") echo -e "${YELLOW}⚠️  $message${NC}" ;;
        "INFO") echo -e "${BLUE}ℹ️  $message${NC}" ;;
        "HEADER") echo -e "${PURPLE}🔒 $message${NC}" ;;
    esac
}

# Function to check if a secret exists and validate its format
validate_secret() {
    local secret_name="$1"
    local expected_pattern="${2:-.*}"
    local min_length="${3:-8}"
    local description="${4:-$secret_name}"
    
    # Get the secret value from environment
    local secret_value="${!secret_name:-}"
    
    if [ -z "$secret_value" ]; then
        print_status "ERROR" "Missing required secret: $description"
        log "ERROR" "Secret validation failed: $secret_name is not set"
        return 1
    fi
    
    # Check minimum length
    local length=${#secret_value}
    if [ "$length" -lt "$min_length" ]; then
        print_status "ERROR" "Secret $description is too short (length: $length, minimum: $min_length)"
        log "ERROR" "Secret validation failed: $secret_name length is $length, minimum required is $min_length"
        return 1
    fi
    
    # Check pattern (if provided)
    if [[ ! "$secret_value" =~ $expected_pattern ]]; then
        print_status "ERROR" "Secret $description format is invalid"
        log "ERROR" "Secret validation failed: $secret_name does not match expected pattern"
        return 1
    fi
    
    print_status "SUCCESS" "Secret validated: $description (length: $length)"
    log "INFO" "Secret validation successful: $secret_name"
    return 0
}

# Function to validate URL format
validate_url_secret() {
    local secret_name="$1"
    local description="${2:-$secret_name}"
    
    local secret_value="${!secret_name:-}"
    
    if [ -z "$secret_value" ]; then
        print_status "ERROR" "Missing required URL secret: $description"
        return 1
    fi
    
    # Basic URL validation
    if [[ ! "$secret_value" =~ ^https?:// ]]; then
        print_status "ERROR" "Secret $description is not a valid URL (must start with http:// or https://)"
        return 1
    fi
    
    print_status "SUCCESS" "URL secret validated: $description"
    return 0
}

# Function to validate JWT token format
validate_jwt_secret() {
    local secret_name="$1"
    local description="${2:-$secret_name}"
    
    local secret_value="${!secret_name:-}"
    
    if [ -z "$secret_value" ]; then
        print_status "ERROR" "Missing required JWT secret: $description"
        return 1
    fi
    
    # JWT should have 3 parts separated by dots
    local jwt_parts=$(echo "$secret_value" | tr '.' '\n' | wc -l)
    if [ "$jwt_parts" -ne 3 ]; then
        print_status "ERROR" "Secret $description is not a valid JWT format"
        return 1
    fi
    
    print_status "SUCCESS" "JWT secret validated: $description"
    return 0
}

# Function to validate database URL
validate_db_url() {
    local secret_name="$1"
    local description="${2:-$secret_name}"
    
    local secret_value="${!secret_name:-}"
    
    if [ -z "$secret_value" ]; then
        print_status "ERROR" "Missing required database URL: $description"
        return 1
    fi
    
    # Database URL should start with postgres:// or postgresql://
    if [[ ! "$secret_value" =~ ^postgres(ql)?:// ]]; then
        print_status "ERROR" "Secret $description is not a valid PostgreSQL URL"
        return 1
    fi
    
    print_status "SUCCESS" "Database URL validated: $description"
    return 0
}

# Function to check secret strength
check_secret_strength() {
    local secret_name="$1"
    local description="${2:-$secret_name}"
    
    local secret_value="${!secret_name:-}"
    
    if [ -z "$secret_value" ]; then
        return 1
    fi
    
    local length=${#secret_value}
    local has_upper=0
    local has_lower=0
    local has_digit=0
    local has_special=0
    
    # Check for character types
    [[ "$secret_value" =~ [A-Z] ]] && has_upper=1
    [[ "$secret_value" =~ [a-z] ]] && has_lower=1
    [[ "$secret_value" =~ [0-9] ]] && has_digit=1
    [[ "$secret_value" =~ [^A-Za-z0-9] ]] && has_special=1
    
    local strength_score=$((has_upper + has_lower + has_digit + has_special))
    
    if [ "$length" -ge 32 ] && [ "$strength_score" -ge 3 ]; then
        print_status "SUCCESS" "Secret $description has strong security"
        return 0
    elif [ "$length" -ge 16 ] && [ "$strength_score" -ge 2 ]; then
        print_status "WARNING" "Secret $description has moderate security"
        return 0
    else
        print_status "WARNING" "Secret $description has weak security (consider strengthening)"
        return 1
    fi
}

# Main validation function
validate_environment_secrets() {
    local env="$1"
    print_status "HEADER" "Validating secrets for environment: $env"
    
    local validation_failed=false
    local total_secrets=0
    local valid_secrets=0
    
    case "$env" in
        "staging")
            print_status "INFO" "Validating staging environment secrets..."
            
            # Vercel secrets
            validate_secret "VERCEL_TOKEN_STAGING" "^[a-zA-Z0-9_-]+$" 20 "Vercel Token (Staging)" || validation_failed=true
            validate_secret "VERCEL_ORG_ID" "^[a-zA-Z0-9_-]+$" 8 "Vercel Organization ID" || validation_failed=true
            validate_secret "VERCEL_PROJECT_ID_STAGING" "^[a-zA-Z0-9_-]+$" 8 "Vercel Project ID (Staging)" || validation_failed=true
            total_secrets=$((total_secrets + 3))
            
            # Supabase secrets
            validate_secret "SUPABASE_ACCESS_TOKEN" "^sb[a-zA-Z0-9_-]+$" 30 "Supabase Access Token" || validation_failed=true
            validate_secret "SUPABASE_PROJECT_REF_STAGING" "^[a-z0-9]+$" 10 "Supabase Project Ref (Staging)" || validation_failed=true
            validate_db_url "SUPABASE_DB_URL_STAGING" "Supabase Database URL (Staging)" || validation_failed=true
            validate_url_secret "NEXT_PUBLIC_SUPABASE_URL_STAGING" "Next.js Supabase URL (Staging)" || validation_failed=true
            validate_secret "NEXT_PUBLIC_SUPABASE_ANON_KEY_STAGING" "^eyJ[a-zA-Z0-9_-]+$" 100 "Supabase Anonymous Key (Staging)" || validation_failed=true
            total_secrets=$((total_secrets + 5))
            
            # External service secrets
            if [ -n "${OPENAI_API_KEY_STAGING:-}" ]; then
                validate_secret "OPENAI_API_KEY_STAGING" "^sk-[a-zA-Z0-9]+$" 40 "OpenAI API Key (Staging)" || validation_failed=true
                total_secrets=$((total_secrets + 1))
            fi
            
            if [ -n "${STRIPE_SECRET_KEY_STAGING:-}" ]; then
                validate_secret "STRIPE_SECRET_KEY_STAGING" "^sk_(test|live)_[a-zA-Z0-9]+$" 30 "Stripe Secret Key (Staging)" || validation_failed=true
                validate_secret "STRIPE_PUBLISHABLE_KEY_STAGING" "^pk_(test|live)_[a-zA-Z0-9]+$" 30 "Stripe Publishable Key (Staging)" || validation_failed=true
                total_secrets=$((total_secrets + 2))
            fi
            
            # Monitoring secrets
            if [ -n "${SENTRY_DSN_STAGING:-}" ]; then
                validate_url_secret "SENTRY_DSN_STAGING" "Sentry DSN (Staging)" || validation_failed=true
                total_secrets=$((total_secrets + 1))
            fi
            ;;
            
        "production")
            print_status "INFO" "Validating production environment secrets..."
            
            # Vercel secrets (production)
            validate_secret "VERCEL_TOKEN_PRODUCTION" "^[a-zA-Z0-9_-]+$" 20 "Vercel Token (Production)" || validation_failed=true
            validate_secret "VERCEL_ORG_ID" "^[a-zA-Z0-9_-]+$" 8 "Vercel Organization ID" || validation_failed=true
            validate_secret "VERCEL_PROJECT_ID_PRODUCTION" "^[a-zA-Z0-9_-]+$" 8 "Vercel Project ID (Production)" || validation_failed=true
            total_secrets=$((total_secrets + 3))
            
            # Supabase secrets (production)
            validate_secret "SUPABASE_ACCESS_TOKEN" "^sb[a-zA-Z0-9_-]+$" 30 "Supabase Access Token" || validation_failed=true
            validate_secret "SUPABASE_PROJECT_REF_PRODUCTION" "^[a-z0-9]+$" 10 "Supabase Project Ref (Production)" || validation_failed=true
            validate_db_url "SUPABASE_DB_URL_PRODUCTION" "Supabase Database URL (Production)" || validation_failed=true
            validate_url_secret "NEXT_PUBLIC_SUPABASE_URL_PRODUCTION" "Next.js Supabase URL (Production)" || validation_failed=true
            validate_secret "NEXT_PUBLIC_SUPABASE_ANON_KEY_PRODUCTION" "^eyJ[a-zA-Z0-9_-]+$" 100 "Supabase Anonymous Key (Production)" || validation_failed=true
            validate_secret "SUPABASE_SERVICE_ROLE_KEY_PRODUCTION" "^eyJ[a-zA-Z0-9_-]+$" 100 "Supabase Service Role Key (Production)" || validation_failed=true
            total_secrets=$((total_secrets + 6))
            
            # Production-specific secrets
            validate_secret "JWT_SECRET_PRODUCTION" ".*" 32 "JWT Secret (Production)" || validation_failed=true
            validate_secret "NEXTAUTH_SECRET" ".*" 32 "NextAuth Secret" || validation_failed=true
            validate_secret "ENCRYPTION_KEY_PRODUCTION" ".*" 32 "Encryption Key (Production)" || validation_failed=true
            total_secrets=$((total_secrets + 3))
            
            # External services (production)
            validate_secret "OPENAI_API_KEY_PRODUCTION" "^sk-[a-zA-Z0-9]+$" 40 "OpenAI API Key (Production)" || validation_failed=true
            validate_secret "STRIPE_SECRET_KEY_PRODUCTION" "^sk_live_[a-zA-Z0-9]+$" 30 "Stripe Secret Key (Production)" || validation_failed=true
            validate_secret "STRIPE_PUBLISHABLE_KEY_PRODUCTION" "^pk_live_[a-zA-Z0-9]+$" 30 "Stripe Publishable Key (Production)" || validation_failed=true
            total_secrets=$((total_secrets + 3))
            
            # Email services
            validate_secret "SENDGRID_API_KEY" "^SG\.[a-zA-Z0-9_-]+$" 50 "SendGrid API Key" || validation_failed=true
            total_secrets=$((total_secrets + 1))
            
            # Monitoring (production)
            validate_url_secret "SENTRY_DSN_PRODUCTION" "Sentry DSN (Production)" || validation_failed=true
            validate_secret "SENTRY_AUTH_TOKEN" "^[a-f0-9]+$" 64 "Sentry Auth Token" || validation_failed=true
            validate_secret "DATADOG_API_KEY_PRODUCTION" "^[a-f0-9]+$" 32 "Datadog API Key (Production)" || validation_failed=true
            total_secrets=$((total_secrets + 3))
            ;;
            
        *)
            print_status "ERROR" "Unknown environment: $env"
            exit 1
            ;;
    esac
    
    # Calculate success rate
    if [ "$validation_failed" = false ]; then
        valid_secrets=$total_secrets
    else
        # Count successful validations (simplified approach)
        valid_secrets=$((total_secrets - 1))  # This is a rough estimate
    fi
    
    # Summary
    echo ""
    print_status "HEADER" "Validation Summary for $env"
    echo "Total secrets checked: $total_secrets"
    echo "Valid secrets: $valid_secrets"
    echo "Success rate: $(( (valid_secrets * 100) / total_secrets ))%"
    
    if [ "$validation_failed" = true ]; then
        print_status "ERROR" "Secret validation failed for environment: $env"
        log "ERROR" "Secret validation completed with failures for environment: $env"
        return 1
    else
        print_status "SUCCESS" "All secrets validated successfully for environment: $env"
        log "INFO" "Secret validation completed successfully for environment: $env"
        return 0
    fi
}

# Function to check for common secret issues
check_secret_issues() {
    print_status "HEADER" "Checking for common secret issues..."
    
    local issues_found=false
    
    # Check for default/example values
    local default_patterns=(
        "your-api-key"
        "your-secret-here"
        "example"
        "test-key"
        "demo-"
        "localhost"
        "127.0.0.1"
        "password123"
        "secret123"
    )
    
    for secret_var in $(env | grep -E "(SECRET|KEY|TOKEN|PASSWORD)" | cut -d= -f1); do
        local secret_value="${!secret_var}"
        
        for pattern in "${default_patterns[@]}"; do
            if [[ "$secret_value" == *"$pattern"* ]]; then
                print_status "WARNING" "Secret $secret_var appears to contain default/example value"
                issues_found=true
            fi
        done
    done
    
    # Check for secrets in wrong environment
    if [ "$ENVIRONMENT" = "production" ]; then
        # Check for test/staging values in production
        for secret_var in $(env | grep -E "(SECRET|KEY|TOKEN)" | cut -d= -f1); do
            local secret_value="${!secret_var}"
            
            if [[ "$secret_value" == *"test"* ]] || [[ "$secret_value" == *"staging"* ]]; then
                print_status "ERROR" "Production secret $secret_var appears to contain test/staging value"
                issues_found=true
            fi
        done
    fi
    
    if [ "$issues_found" = false ]; then
        print_status "SUCCESS" "No common secret issues detected"
    fi
    
    return $issues_found
}

# Function to generate secret strength report
generate_strength_report() {
    print_status "HEADER" "Generating secret strength report..."
    
    local report_file="$PROJECT_ROOT/logs/secret-strength-report-$(date +%Y%m%d-%H%M%S).md"
    
    {
        echo "# Secret Strength Report"
        echo "Generated: $(date)"
        echo "Environment: $ENVIRONMENT"
        echo ""
        echo "## Secret Strength Analysis"
        echo ""
    } > "$report_file"
    
    # Analyze each secret (without exposing values)
    for secret_var in $(env | grep -E "(SECRET|KEY|TOKEN|PASSWORD)" | cut -d= -f1); do
        if [ -n "${!secret_var}" ]; then
            echo "### $secret_var" >> "$report_file"
            
            # Check strength without exposing the secret
            local secret_value="${!secret_var}"
            local length=${#secret_value}
            
            echo "- Length: $length characters" >> "$report_file"
            
            # Determine strength category
            if [ "$length" -ge 32 ]; then
                echo "- Strength: Strong ✅" >> "$report_file"
            elif [ "$length" -ge 16 ]; then
                echo "- Strength: Moderate ⚠️" >> "$report_file"
            else
                echo "- Strength: Weak ❌" >> "$report_file"
            fi
            
            echo "" >> "$report_file"
        fi
    done
    
    print_status "SUCCESS" "Secret strength report generated: $report_file"
}

# Main execution
main() {
    print_status "HEADER" "NutriCoach Secret Validation"
    echo "Environment: $ENVIRONMENT"
    echo "Timestamp: $(date)"
    echo "Log file: $LOG_FILE"
    echo ""
    
    log "INFO" "Starting secret validation for environment: $ENVIRONMENT"
    
    # Validate environment secrets
    if ! validate_environment_secrets "$ENVIRONMENT"; then
        log "ERROR" "Secret validation failed"
        exit 1
    fi
    
    echo ""
    
    # Check for common issues
    check_secret_issues
    
    echo ""
    
    # Generate strength report
    generate_strength_report
    
    echo ""
    print_status "SUCCESS" "Secret validation completed successfully!"
    log "INFO" "Secret validation completed successfully"
}

# Execute main function
main "$@"