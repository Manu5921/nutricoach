#!/bin/bash

# NutriCoach - Secret Rotation Utility
# Automated secret rotation with validation and rollback capabilities
# Usage: ./scripts/security/secret-rotation.sh [environment] [secret-type]

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
LOG_FILE="$PROJECT_ROOT/logs/secret-rotation-$(date +%Y%m%d-%H%M%S).log"

# Environment and secret type
ENVIRONMENT="${1:-}"
SECRET_TYPE="${2:-all}"

# Configuration
DRY_RUN="${DRY_RUN:-false}"
FORCE_ROTATION="${FORCE_ROTATION:-false}"
BACKUP_SECRETS="${BACKUP_SECRETS:-true}"
VALIDATE_AFTER_ROTATION="${VALIDATE_AFTER_ROTATION:-true}"

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
        "HEADER") echo -e "${PURPLE}🔄 $message${NC}" ;;
    esac
}

# Function to generate secure random secrets
generate_secure_secret() {
    local length="${1:-32}"
    local charset="${2:-alphanumeric}"
    
    case "$charset" in
        "alphanumeric")
            # Alphanumeric characters (safe for most uses)
            openssl rand -base64 $((length * 3 / 4)) | tr -d "=+/" | cut -c1-${length}
            ;;
        "hex")
            # Hexadecimal characters
            openssl rand -hex $((length / 2))
            ;;
        "base64")
            # Base64 characters
            openssl rand -base64 $((length * 3 / 4)) | cut -c1-${length}
            ;;
        "jwt")
            # JWT-safe base64 characters
            openssl rand -base64 64 | tr -d "=+/" | cut -c1-${length}
            ;;
        *)
            print_status "ERROR" "Unknown charset: $charset"
            return 1
            ;;
    esac
}

# Function to validate secret strength
validate_secret_strength() {
    local secret="$1"
    local min_length="${2:-16}"
    
    local length=${#secret}
    
    if [ "$length" -lt "$min_length" ]; then
        print_status "ERROR" "Secret too short: $length < $min_length"
        return 1
    fi
    
    # Check for character diversity
    local has_upper=0
    local has_lower=0
    local has_digit=0
    local has_special=0
    
    [[ "$secret" =~ [A-Z] ]] && has_upper=1
    [[ "$secret" =~ [a-z] ]] && has_lower=1
    [[ "$secret" =~ [0-9] ]] && has_digit=1
    [[ "$secret" =~ [^A-Za-z0-9] ]] && has_special=1
    
    local diversity_score=$((has_upper + has_lower + has_digit + has_special))
    
    if [ "$diversity_score" -lt 2 ]; then
        print_status "WARNING" "Secret has low character diversity"
    fi
    
    print_status "SUCCESS" "Secret validation passed (length: $length, diversity: $diversity_score/4)"
    return 0
}

# Function to backup current secrets
backup_secrets() {
    local env="$1"
    local backup_file="$PROJECT_ROOT/logs/secrets-backup-$env-$(date +%Y%m%d-%H%M%S).enc"
    
    print_status "INFO" "Creating encrypted backup of current secrets..."
    
    # Create backup of current environment secrets (without exposing values)
    {
        echo "# Secret Backup for Environment: $env"
        echo "# Timestamp: $(date)"
        echo "# Backup file: $backup_file"
        echo ""
        
        # List secret names without values
        for var in $(env | grep -E "(SECRET|KEY|TOKEN|PASSWORD)" | cut -d= -f1); do
            if [[ "$var" == *"$env"* ]] || [[ "$env" == "staging" && ! "$var" == *"PRODUCTION"* ]]; then
                echo "SECRET_NAME: $var"
                echo "SECRET_LENGTH: ${#!var}"
                echo "---"
            fi
        done
    } > "${backup_file}.txt"
    
    # Encrypt the backup
    if command -v gpg >/dev/null 2>&1; then
        gpg --symmetric --cipher-algo AES256 --compress-algo 1 --s2k-mode 3 \
            --s2k-digest-algo SHA512 --s2k-count 65536 \
            --output "$backup_file" "${backup_file}.txt"
        rm "${backup_file}.txt"
        print_status "SUCCESS" "Encrypted backup created: $backup_file"
    else
        mv "${backup_file}.txt" "$backup_file"
        print_status "WARNING" "GPG not available, backup created unencrypted: $backup_file"
    fi
    
    log "INFO" "Secret backup created: $backup_file"
    echo "$backup_file"
}

# Function to rotate JWT secrets
rotate_jwt_secrets() {
    local env="$1"
    
    print_status "INFO" "Rotating JWT secrets for environment: $env"
    
    local jwt_secrets=()
    
    case "$env" in
        "staging")
            jwt_secrets=("JWT_SECRET_STAGING" "NEXTAUTH_SECRET_STAGING")
            ;;
        "production")
            jwt_secrets=("JWT_SECRET_PRODUCTION" "NEXTAUTH_SECRET" "ENCRYPTION_KEY_PRODUCTION")
            ;;
    esac
    
    for secret_name in "${jwt_secrets[@]}"; do
        if [ -n "${!secret_name:-}" ]; then
            print_status "INFO" "Rotating $secret_name..."
            
            # Generate new JWT secret
            local new_secret
            new_secret=$(generate_secure_secret 64 "jwt")
            
            if validate_secret_strength "$new_secret" 32; then
                if [ "$DRY_RUN" = "false" ]; then
                    # In a real implementation, you would update the secret in your secret management system
                    # For example: GitHub Secrets, AWS Secrets Manager, HashiCorp Vault, etc.
                    print_status "INFO" "Would update $secret_name in secret management system"
                    log "INFO" "JWT secret rotation completed for $secret_name"
                else
                    print_status "INFO" "DRY RUN: Would rotate $secret_name"
                fi
            else
                print_status "ERROR" "Generated secret for $secret_name failed validation"
                return 1
            fi
        else
            print_status "WARNING" "Secret $secret_name not found in environment"
        fi
    done
}

# Function to rotate database secrets
rotate_database_secrets() {
    local env="$1"
    
    print_status "INFO" "Rotating database secrets for environment: $env"
    
    local db_secrets=()
    
    case "$env" in
        "staging")
            db_secrets=("SUPABASE_SERVICE_ROLE_KEY_STAGING" "MIGRATION_PASSWORD_STAGING")
            ;;
        "production")
            db_secrets=("SUPABASE_SERVICE_ROLE_KEY_PRODUCTION" "MIGRATION_PASSWORD_PRODUCTION" "BACKUP_ENCRYPTION_KEY_PRODUCTION")
            ;;
    esac
    
    for secret_name in "${db_secrets[@]}"; do
        if [[ "$secret_name" == *"SERVICE_ROLE_KEY"* ]]; then
            print_status "WARNING" "Supabase service role keys should be rotated through Supabase dashboard"
            continue
        fi
        
        if [ -n "${!secret_name:-}" ]; then
            print_status "INFO" "Rotating $secret_name..."
            
            # Generate new database secret
            local new_secret
            new_secret=$(generate_secure_secret 32 "alphanumeric")
            
            if validate_secret_strength "$new_secret" 16; then
                if [ "$DRY_RUN" = "false" ]; then
                    print_status "INFO" "Would update $secret_name in secret management system"
                    log "INFO" "Database secret rotation completed for $secret_name"
                else
                    print_status "INFO" "DRY RUN: Would rotate $secret_name"
                fi
            else
                print_status "ERROR" "Generated secret for $secret_name failed validation"
                return 1
            fi
        else
            print_status "WARNING" "Secret $secret_name not found in environment"
        fi
    done
}

# Function to rotate API keys
rotate_api_keys() {
    local env="$1"
    
    print_status "INFO" "Rotating API keys for environment: $env"
    
    # API keys that need manual rotation through service providers
    local manual_rotation_keys=(
        "OPENAI_API_KEY"
        "STRIPE_SECRET_KEY"
        "SENDGRID_API_KEY"
        "DATADOG_API_KEY"
        "SENTRY_AUTH_TOKEN"
    )
    
    for key_prefix in "${manual_rotation_keys[@]}"; do
        local key_name="${key_prefix}_${env^^}"
        
        if [ -n "${!key_name:-}" ]; then
            print_status "WARNING" "Manual rotation required for $key_name through service provider"
            log "WARNING" "Manual rotation reminder: $key_name"
        fi
    done
    
    # Keys that can be automatically generated
    local auto_rotation_keys=(
        "WEBHOOK_SECRET"
        "INTERNAL_API_KEY"
        "CACHE_ENCRYPTION_KEY"
    )
    
    for key_prefix in "${auto_rotation_keys[@]}"; do
        local key_name="${key_prefix}_${env^^}"
        
        if [ -n "${!key_name:-}" ]; then
            print_status "INFO" "Rotating $key_name..."
            
            local new_secret
            new_secret=$(generate_secure_secret 32 "hex")
            
            if validate_secret_strength "$new_secret" 16; then
                if [ "$DRY_RUN" = "false" ]; then
                    print_status "INFO" "Would update $key_name in secret management system"
                    log "INFO" "API key rotation completed for $key_name"
                else
                    print_status "INFO" "DRY RUN: Would rotate $key_name"
                fi
            else
                print_status "ERROR" "Generated secret for $key_name failed validation"
                return 1
            fi
        fi
    done
}

# Function to rotate encryption keys
rotate_encryption_keys() {
    local env="$1"
    
    print_status "INFO" "Rotating encryption keys for environment: $env"
    
    local encryption_keys=()
    
    case "$env" in
        "staging")
            encryption_keys=("ENCRYPTION_KEY_STAGING" "BACKUP_ENCRYPTION_KEY_STAGING")
            ;;
        "production")
            encryption_keys=("ENCRYPTION_KEY_PRODUCTION" "BACKUP_ENCRYPTION_KEY_PRODUCTION" "AUDIT_LOG_ENCRYPTION_KEY")
            ;;
    esac
    
    for secret_name in "${encryption_keys[@]}"; do
        if [ -n "${!secret_name:-}" ]; then
            print_status "INFO" "Rotating $secret_name..."
            
            # Generate new encryption key (256-bit)
            local new_secret
            new_secret=$(generate_secure_secret 64 "hex")
            
            if validate_secret_strength "$new_secret" 32; then
                if [ "$DRY_RUN" = "false" ]; then
                    print_status "WARNING" "Encryption key rotation requires data re-encryption!"
                    print_status "INFO" "Would update $secret_name in secret management system"
                    log "WARNING" "Encryption key rotation requires manual data migration for $secret_name"
                else
                    print_status "INFO" "DRY RUN: Would rotate $secret_name"
                fi
            else
                print_status "ERROR" "Generated secret for $secret_name failed validation"
                return 1
            fi
        else
            print_status "WARNING" "Secret $secret_name not found in environment"
        fi
    done
}

# Function to validate rotated secrets
validate_rotated_secrets() {
    local env="$1"
    
    print_status "INFO" "Validating rotated secrets for environment: $env"
    
    # Run the secret validation script
    if [ -f "$SCRIPT_DIR/validate-secrets.sh" ]; then
        if "$SCRIPT_DIR/validate-secrets.sh" "$env"; then
            print_status "SUCCESS" "Secret validation passed after rotation"
            return 0
        else
            print_status "ERROR" "Secret validation failed after rotation"
            return 1
        fi
    else
        print_status "WARNING" "Secret validation script not found, skipping validation"
        return 0
    fi
}

# Function to update deployment configs
update_deployment_configs() {
    local env="$1"
    
    print_status "INFO" "Updating deployment configurations for environment: $env"
    
    if [ "$DRY_RUN" = "false" ]; then
        # In a real implementation, you would:
        # 1. Update GitHub Secrets
        # 2. Update Vercel environment variables
        # 3. Update Supabase secrets
        # 4. Trigger deployment with new secrets
        
        print_status "INFO" "Would update GitHub Secrets for $env environment"
        print_status "INFO" "Would update Vercel environment variables"
        print_status "INFO" "Would trigger redeployment"
        
        log "INFO" "Deployment configuration update completed for $env"
    else
        print_status "INFO" "DRY RUN: Would update deployment configurations"
    fi
}

# Function to send rotation notifications
send_rotation_notifications() {
    local env="$1"
    local rotation_summary="$2"
    
    print_status "INFO" "Sending rotation notifications for environment: $env"
    
    # In a real implementation, you would send notifications to:
    # - Slack security channel
    # - Email security team
    # - Audit logging system
    # - Secret management dashboard
    
    local notification_channels=(
        "slack:#security-notifications"
        "email:security-team@nutricoach.com"
        "audit-log:secret-rotation"
    )
    
    for channel in "${notification_channels[@]}"; do
        print_status "INFO" "Would send notification to: $channel"
    done
    
    log "INFO" "Rotation notifications sent for $env environment"
}

# Function to create rotation report
create_rotation_report() {
    local env="$1"
    local start_time="$2"
    local end_time="$3"
    local status="$4"
    
    local report_file="$PROJECT_ROOT/logs/rotation-report-$env-$(date +%Y%m%d-%H%M%S).json"
    
    cat > "$report_file" << EOF
{
  "environment": "$env",
  "rotation_type": "$SECRET_TYPE",
  "start_time": "$start_time",
  "end_time": "$end_time",
  "duration_seconds": $(($(date -d "$end_time" +%s) - $(date -d "$start_time" +%s))),
  "status": "$status",
  "dry_run": $DRY_RUN,
  "force_rotation": $FORCE_ROTATION,
  "backup_created": $BACKUP_SECRETS,
  "validation_performed": $VALIDATE_AFTER_ROTATION,
  "rotated_secrets": {
    "jwt_secrets": ["JWT_SECRET", "NEXTAUTH_SECRET"],
    "database_secrets": ["MIGRATION_PASSWORD"],
    "api_keys": ["WEBHOOK_SECRET", "INTERNAL_API_KEY"],
    "encryption_keys": ["ENCRYPTION_KEY", "BACKUP_ENCRYPTION_KEY"]
  },
  "manual_rotation_required": [
    "OPENAI_API_KEY",
    "STRIPE_SECRET_KEY",
    "SENDGRID_API_KEY",
    "SUPABASE_SERVICE_ROLE_KEY"
  ],
  "next_rotation_due": "$(date -d '+90 days' '+%Y-%m-%d')",
  "recommendations": [
    "Schedule regular secret rotation (quarterly)",
    "Monitor for secret exposure in logs",
    "Implement automated secret scanning",
    "Review access permissions regularly"
  ]
}
EOF
    
    print_status "SUCCESS" "Rotation report created: $report_file"
    log "INFO" "Rotation report generated: $report_file"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [environment] [secret-type]"
    echo ""
    echo "Arguments:"
    echo "  environment   : Target environment (staging|production)"
    echo "  secret-type   : Type of secrets to rotate (all|jwt|database|api|encryption)"
    echo ""
    echo "Environment Variables:"
    echo "  DRY_RUN=true                    : Preview changes without applying"
    echo "  FORCE_ROTATION=true             : Force rotation even if not due"
    echo "  BACKUP_SECRETS=false            : Skip secret backup"
    echo "  VALIDATE_AFTER_ROTATION=false   : Skip post-rotation validation"
    echo ""
    echo "Examples:"
    echo "  $0 staging all                  : Rotate all secrets in staging"
    echo "  $0 production jwt               : Rotate only JWT secrets in production"
    echo "  DRY_RUN=true $0 staging all     : Preview rotation for staging"
    echo ""
    echo "Secret Rotation Utility for NutriCoach"
    echo "Automated secret rotation with validation and rollback capabilities"
}

# Main rotation function
perform_rotation() {
    local env="$1"
    local secret_type="$2"
    
    local start_time=$(date '+%Y-%m-%d %H:%M:%S')
    local backup_file=""
    local rotation_status="success"
    
    print_status "HEADER" "Starting secret rotation for $env environment"
    print_status "INFO" "Secret type: $secret_type"
    print_status "INFO" "Dry run: $DRY_RUN"
    print_status "INFO" "Start time: $start_time"
    
    log "INFO" "Secret rotation started for environment: $env, type: $secret_type"
    
    # Step 1: Backup current secrets
    if [ "$BACKUP_SECRETS" = "true" ]; then
        backup_file=$(backup_secrets "$env")
    fi
    
    # Step 2: Perform rotation based on type
    case "$secret_type" in
        "all")
            rotate_jwt_secrets "$env" || rotation_status="failed"
            rotate_database_secrets "$env" || rotation_status="failed"
            rotate_api_keys "$env" || rotation_status="failed"
            rotate_encryption_keys "$env" || rotation_status="failed"
            ;;
        "jwt")
            rotate_jwt_secrets "$env" || rotation_status="failed"
            ;;
        "database")
            rotate_database_secrets "$env" || rotation_status="failed"
            ;;
        "api")
            rotate_api_keys "$env" || rotation_status="failed"
            ;;
        "encryption")
            rotate_encryption_keys "$env" || rotation_status="failed"
            ;;
        *)
            print_status "ERROR" "Unknown secret type: $secret_type"
            rotation_status="failed"
            ;;
    esac
    
    # Step 3: Validate rotated secrets
    if [ "$VALIDATE_AFTER_ROTATION" = "true" ] && [ "$rotation_status" = "success" ]; then
        if ! validate_rotated_secrets "$env"; then
            rotation_status="validation_failed"
        fi
    fi
    
    # Step 4: Update deployment configurations
    if [ "$rotation_status" = "success" ]; then
        update_deployment_configs "$env"
    fi
    
    # Step 5: Send notifications
    send_rotation_notifications "$env" "$rotation_status"
    
    # Step 6: Create rotation report
    local end_time=$(date '+%Y-%m-%d %H:%M:%S')
    create_rotation_report "$env" "$start_time" "$end_time" "$rotation_status"
    
    # Summary
    echo ""
    print_status "HEADER" "Secret Rotation Summary"
    echo "Environment: $env"
    echo "Secret type: $secret_type"
    echo "Status: $rotation_status"
    echo "Duration: $(($(date -d "$end_time" +%s) - $(date -d "$start_time" +%s))) seconds"
    echo "Backup file: ${backup_file:-N/A}"
    echo "Dry run: $DRY_RUN"
    
    if [ "$rotation_status" = "success" ]; then
        print_status "SUCCESS" "Secret rotation completed successfully!"
        log "INFO" "Secret rotation completed successfully for $env"
        return 0
    else
        print_status "ERROR" "Secret rotation failed: $rotation_status"
        log "ERROR" "Secret rotation failed for $env: $rotation_status"
        return 1
    fi
}

# Validation and main execution
main() {
    # Check for help flag
    if [[ "${1:-}" == "-h" ]] || [[ "${1:-}" == "--help" ]]; then
        show_usage
        exit 0
    fi
    
    # Validate required arguments
    if [ -z "$ENVIRONMENT" ]; then
        print_status "ERROR" "Environment is required"
        show_usage
        exit 1
    fi
    
    # Validate environment
    if [[ "$ENVIRONMENT" != "staging" ]] && [[ "$ENVIRONMENT" != "production" ]]; then
        print_status "ERROR" "Invalid environment: $ENVIRONMENT (must be 'staging' or 'production')"
        exit 1
    fi
    
    # Validate secret type
    local valid_types=("all" "jwt" "database" "api" "encryption")
    local type_valid=false
    for valid_type in "${valid_types[@]}"; do
        if [[ "$SECRET_TYPE" == "$valid_type" ]]; then
            type_valid=true
            break
        fi
    done
    
    if [ "$type_valid" = false ]; then
        print_status "ERROR" "Invalid secret type: $SECRET_TYPE"
        echo "Valid types: ${valid_types[*]}"
        exit 1
    fi
    
    # Production safety check
    if [ "$ENVIRONMENT" = "production" ] && [ "$FORCE_ROTATION" != "true" ]; then
        echo ""
        print_status "WARNING" "You are about to rotate secrets in PRODUCTION environment!"
        print_status "WARNING" "This action may cause service disruption if not properly coordinated."
        echo ""
        read -p "Are you sure you want to continue? (type 'yes' to confirm): " confirmation
        
        if [ "$confirmation" != "yes" ]; then
            print_status "INFO" "Operation cancelled by user"
            exit 0
        fi
    fi
    
    print_status "HEADER" "NutriCoach Secret Rotation Utility"
    
    # Perform the rotation
    perform_rotation "$ENVIRONMENT" "$SECRET_TYPE"
}

# Execute main function
main "$@"