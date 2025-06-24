#!/bin/bash

# NutriCoach - Complete Security Audit Script
# Comprehensive security assessment and validation
# Usage: ./scripts/security/security-audit.sh [environment] [--comprehensive]

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
LOG_FILE="$PROJECT_ROOT/logs/security-audit-$(date +%Y%m%d-%H%M%S).log"

# Configuration
ENVIRONMENT="${1:-staging}"
COMPREHENSIVE="${2:-false}"
if [[ "${2:-}" == "--comprehensive" ]]; then
    COMPREHENSIVE="true"
fi

# Audit configuration
AUDIT_TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S UTC')
AUDIT_ID="SA-$(date +%Y%m%d-%H%M%S)"

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
        "AUDIT") echo -e "${CYAN}📋 $message${NC}" ;;
    esac
}

# Function to create audit report header
create_audit_report() {
    local report_file="$PROJECT_ROOT/logs/security-audit-report-$AUDIT_ID.md"
    
    cat > "$report_file" << EOF
# 🔒 NutriCoach Security Audit Report

**Audit ID**: $AUDIT_ID  
**Timestamp**: $AUDIT_TIMESTAMP  
**Environment**: $ENVIRONMENT  
**Scope**: $([ "$COMPREHENSIVE" = "true" ] && echo "Comprehensive" || echo "Standard")  
**Auditor**: Security Agent (Automated)  

---

## 📊 Executive Summary

This automated security audit assesses the current security posture of the NutriCoach platform, focusing on:

- 🔐 Secret Management & Validation
- 🌐 GitHub Environments Configuration
- 🛡️ Security Controls & Policies
- 📋 Compliance Readiness
- 🚨 Vulnerability Assessment
- 📈 Security Metrics & KPIs

---

## 🔍 Audit Findings

EOF
    
    echo "$report_file"
}

# Function to audit secret management
audit_secret_management() {
    local report_file="$1"
    
    print_status "AUDIT" "Auditing secret management..."
    
    {
        echo "### 🔐 Secret Management Audit"
        echo ""
        echo "**Scope**: Environment secrets, validation, and rotation policies"
        echo ""
    } >> "$report_file"
    
    # Test secret validation script
    if [ -f "$SCRIPT_DIR/validate-secrets.sh" ]; then
        print_status "INFO" "Running secret validation for $ENVIRONMENT..."
        
        if "$SCRIPT_DIR/validate-secrets.sh" "$ENVIRONMENT" >/dev/null 2>&1; then
            echo "- ✅ **Secret Validation**: All secrets validated successfully" >> "$report_file"
            print_status "SUCCESS" "Secret validation passed"
        else
            echo "- ❌ **Secret Validation**: Validation failed - review required" >> "$report_file"
            print_status "ERROR" "Secret validation failed"
        fi
    else
        echo "- ⚠️ **Secret Validation**: Validation script not found" >> "$report_file"
        print_status "WARNING" "Secret validation script not found"
    fi
    
    # Check secret rotation utilities
    if [ -f "$SCRIPT_DIR/secret-rotation.sh" ]; then
        echo "- ✅ **Secret Rotation**: Rotation utilities available" >> "$report_file"
        print_status "SUCCESS" "Secret rotation utilities available"
    else
        echo "- ❌ **Secret Rotation**: Rotation utilities missing" >> "$report_file"
        print_status "ERROR" "Secret rotation utilities missing"
    fi
    
    # Check secret masking
    if [ -f "$SCRIPT_DIR/secret-masking.sh" ]; then
        echo "- ✅ **Secret Masking**: Masking utilities available" >> "$report_file"
        print_status "SUCCESS" "Secret masking utilities available"
    else
        echo "- ❌ **Secret Masking**: Masking utilities missing" >> "$report_file"
        print_status "ERROR" "Secret masking utilities missing"
    fi
    
    echo "" >> "$report_file"
    log "INFO" "Secret management audit completed"
}

# Function to audit GitHub environments
audit_github_environments() {
    local report_file="$1"
    
    print_status "AUDIT" "Auditing GitHub environments configuration..."
    
    {
        echo "### 🌐 GitHub Environments Audit"
        echo ""
        echo "**Scope**: Environment isolation, protection rules, and access controls"
        echo ""
    } >> "$report_file"
    
    # Check environment configuration files
    local env_configs=("staging.yml" "production.yml" "staging-db.yml" "production-db.yml")
    local missing_configs=()
    
    for config in "${env_configs[@]}"; do
        if [ -f "$PROJECT_ROOT/.github/environments/$config" ]; then
            echo "- ✅ **Environment Config**: $config present" >> "$report_file"
            print_status "SUCCESS" "Environment config found: $config"
        else
            echo "- ❌ **Environment Config**: $config missing" >> "$report_file"
            missing_configs+=("$config")
            print_status "ERROR" "Environment config missing: $config"
        fi
    done
    
    # Check environment setup script
    if [ -f "$PROJECT_ROOT/.github/environments/environment-setup.sh" ]; then
        echo "- ✅ **Setup Automation**: Environment setup script available" >> "$report_file"
        print_status "SUCCESS" "Environment setup automation available"
    else
        echo "- ❌ **Setup Automation**: Environment setup script missing" >> "$report_file"
        print_status "ERROR" "Environment setup automation missing"
    fi
    
    # Summary
    if [ ${#missing_configs[@]} -eq 0 ]; then
        echo "- 🎉 **Overall Status**: All environment configurations present" >> "$report_file"
    else
        echo "- ⚠️ **Overall Status**: ${#missing_configs[@]} configuration(s) missing" >> "$report_file"
    fi
    
    echo "" >> "$report_file"
    log "INFO" "GitHub environments audit completed"
}

# Function to audit security workflows
audit_security_workflows() {
    local report_file="$1"
    
    print_status "AUDIT" "Auditing security workflows..."
    
    {
        echo "### 🔄 Security Workflows Audit"
        echo ""
        echo "**Scope**: GitHub Actions security workflows and automation"
        echo ""
    } >> "$report_file"
    
    # Check security workflow
    if [ -f "$PROJECT_ROOT/.github/workflows/security-checks.yml" ]; then
        echo "- ✅ **Security Workflow**: Comprehensive security checks workflow present" >> "$report_file"
        print_status "SUCCESS" "Security checks workflow found"
        
        # Check for key security jobs
        local security_jobs=("secret-detection" "dependency-scan" "code-analysis" "infrastructure-security")
        for job in "${security_jobs[@]}"; do
            if grep -q "$job:" "$PROJECT_ROOT/.github/workflows/security-checks.yml"; then
                echo "  - ✅ **Job**: $job configured" >> "$report_file"
            else
                echo "  - ⚠️ **Job**: $job not found" >> "$report_file"
            fi
        done
    else
        echo "- ❌ **Security Workflow**: Security checks workflow missing" >> "$report_file"
        print_status "ERROR" "Security checks workflow missing"
    fi
    
    # Check existing CI/CD workflows
    if [ -f "$PROJECT_ROOT/.github/workflows/ci.yml" ]; then
        echo "- ✅ **CI Pipeline**: CI workflow present" >> "$report_file"
    else
        echo "- ⚠️ **CI Pipeline**: CI workflow not found" >> "$report_file"
    fi
    
    if [ -f "$PROJECT_ROOT/.github/workflows/deploy.yml" ]; then
        echo "- ✅ **Deployment**: Deployment workflow present" >> "$report_file"
    else
        echo "- ⚠️ **Deployment**: Deployment workflow not found" >> "$report_file"
    fi
    
    echo "" >> "$report_file"
    log "INFO" "Security workflows audit completed"
}

# Function to audit code security
audit_code_security() {
    local report_file="$1"
    
    print_status "AUDIT" "Auditing code security..."
    
    {
        echo "### 💻 Code Security Audit"
        echo ""
        echo "**Scope**: Source code security patterns and vulnerabilities"
        echo ""
    } >> "$report_file"
    
    # Check for security-related dependencies
    if [ -f "$PROJECT_ROOT/package.json" ]; then
        echo "- ✅ **Package Definition**: package.json present" >> "$report_file"
        
        # Check for security-related packages
        local security_packages=("@sentry" "helmet" "express-rate-limit")
        for package in "${security_packages[@]}"; do
            if grep -q "$package" "$PROJECT_ROOT/package.json"; then
                echo "  - ✅ **Security Package**: $package found" >> "$report_file"
            else
                echo "  - ℹ️ **Security Package**: $package not found (optional)" >> "$report_file"
            fi
        done
    else
        echo "- ⚠️ **Package Definition**: package.json not found" >> "$report_file"
    fi
    
    # Check for security configuration files
    local security_files=(".eslintrc" "next.config.js" "middleware.ts")
    for file in "${security_files[@]}"; do
        if find "$PROJECT_ROOT" -name "$file" -type f | head -1 | read; then
            echo "- ✅ **Security Config**: $file present" >> "$report_file"
        else
            echo "- ℹ️ **Security Config**: $file not found" >> "$report_file"
        fi
    done
    
    # Basic code pattern checks
    local suspicious_patterns=0
    
    # Check for potential hardcoded secrets
    if find "$PROJECT_ROOT" -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | \
       xargs grep -l "password\s*=\s*['\"].*['\"]" 2>/dev/null | head -1 | read; then
        echo "- ⚠️ **Code Pattern**: Potential hardcoded passwords detected" >> "$report_file"
        suspicious_patterns=$((suspicious_patterns + 1))
    fi
    
    # Check for console.log statements (potential info disclosure)
    local console_logs
    console_logs=$(find "$PROJECT_ROOT/apps" "$PROJECT_ROOT/packages" -name "*.ts" -o -name "*.tsx" 2>/dev/null | \
                   xargs grep -c "console\.log" 2>/dev/null | \
                   awk -F: '{sum += $2} END {print sum}' || echo "0")
    
    if [ "${console_logs:-0}" -gt 10 ]; then
        echo "- ⚠️ **Code Pattern**: High number of console.log statements ($console_logs)" >> "$report_file"
        suspicious_patterns=$((suspicious_patterns + 1))
    else
        echo "- ✅ **Code Pattern**: Reasonable console.log usage ($console_logs)" >> "$report_file"
    fi
    
    # Summary
    if [ "$suspicious_patterns" -eq 0 ]; then
        echo "- 🎉 **Code Security**: No obvious security issues detected" >> "$report_file"
    else
        echo "- ⚠️ **Code Security**: $suspicious_patterns potential issue(s) detected" >> "$report_file"
    fi
    
    echo "" >> "$report_file"
    log "INFO" "Code security audit completed"
}

# Function to audit documentation
audit_documentation() {
    local report_file="$1"
    
    print_status "AUDIT" "Auditing security documentation..."
    
    {
        echo "### 📚 Documentation Audit"
        echo ""
        echo "**Scope**: Security documentation completeness and quality"
        echo ""
    } >> "$report_file"
    
    # Check for security guide
    if [ -f "$PROJECT_ROOT/docs/SECURITY-GUIDE.md" ]; then
        echo "- ✅ **Security Guide**: Comprehensive security guide present" >> "$report_file"
        print_status "SUCCESS" "Security guide found"
        
        # Check guide completeness
        local guide_sections=("Secret Management" "GitHub Environments" "Security Workflows" "Incident Response")
        for section in "${guide_sections[@]}"; do
            if grep -q "$section" "$PROJECT_ROOT/docs/SECURITY-GUIDE.md"; then
                echo "  - ✅ **Section**: $section documented" >> "$report_file"
            else
                echo "  - ⚠️ **Section**: $section missing" >> "$report_file"
            fi
        done
    else
        echo "- ❌ **Security Guide**: Security documentation missing" >> "$report_file"
        print_status "ERROR" "Security guide missing"
    fi
    
    # Check for CI/CD documentation
    if [ -f "$PROJECT_ROOT/docs/CI-CD-GUIDE.md" ]; then
        echo "- ✅ **CI/CD Guide**: Deployment documentation present" >> "$report_file"
    else
        echo "- ⚠️ **CI/CD Guide**: CI/CD documentation missing" >> "$report_file"
    fi
    
    # Check for environment setup documentation
    if [ -f "$PROJECT_ROOT/.github/environments/README.md" ]; then
        echo "- ✅ **Environment Docs**: Environment setup documentation present" >> "$report_file"
    else
        echo "- ⚠️ **Environment Docs**: Environment documentation missing" >> "$report_file"
    fi
    
    echo "" >> "$report_file"
    log "INFO" "Documentation audit completed"
}

# Function to run comprehensive security tests
run_comprehensive_tests() {
    local report_file="$1"
    
    if [ "$COMPREHENSIVE" != "true" ]; then
        return 0
    fi
    
    print_status "AUDIT" "Running comprehensive security tests..."
    
    {
        echo "### 🧪 Comprehensive Security Tests"
        echo ""
        echo "**Scope**: In-depth security testing and validation"
        echo ""
    } >> "$report_file"
    
    # Test secret validation with dry run
    if [ -f "$SCRIPT_DIR/validate-secrets.sh" ]; then
        print_status "INFO" "Testing secret validation script..."
        if timeout 30 "$SCRIPT_DIR/validate-secrets.sh" "$ENVIRONMENT" >/dev/null 2>&1; then
            echo "- ✅ **Secret Validation Test**: Script execution successful" >> "$report_file"
        else
            echo "- ⚠️ **Secret Validation Test**: Script execution issues detected" >> "$report_file"
        fi
    fi
    
    # Test secret masking
    if [ -f "$SCRIPT_DIR/secret-masking.sh" ]; then
        print_status "INFO" "Testing secret masking utility..."
        echo "test-secret-123" | "$SCRIPT_DIR/secret-masking.sh" >/dev/null 2>&1
        if [ $? -eq 0 ]; then
            echo "- ✅ **Secret Masking Test**: Masking utility functional" >> "$report_file"
        else
            echo "- ⚠️ **Secret Masking Test**: Masking utility issues detected" >> "$report_file"
        fi
    fi
    
    # Test secret rotation (dry run)
    if [ -f "$SCRIPT_DIR/secret-rotation.sh" ]; then
        print_status "INFO" "Testing secret rotation utility..."
        if DRY_RUN=true "$SCRIPT_DIR/secret-rotation.sh" "$ENVIRONMENT" jwt >/dev/null 2>&1; then
            echo "- ✅ **Secret Rotation Test**: Rotation utility functional" >> "$report_file"
        else
            echo "- ⚠️ **Secret Rotation Test**: Rotation utility issues detected" >> "$report_file"
        fi
    fi
    
    # Check file permissions
    print_status "INFO" "Checking script permissions..."
    local script_files=("$SCRIPT_DIR/validate-secrets.sh" "$SCRIPT_DIR/secret-masking.sh" "$SCRIPT_DIR/secret-rotation.sh")
    local permission_issues=0
    
    for script in "${script_files[@]}"; do
        if [ -f "$script" ]; then
            if [ -x "$script" ]; then
                echo "- ✅ **Permissions**: $(basename "$script") is executable" >> "$report_file"
            else
                echo "- ❌ **Permissions**: $(basename "$script") is not executable" >> "$report_file"
                permission_issues=$((permission_issues + 1))
            fi
        fi
    done
    
    if [ "$permission_issues" -eq 0 ]; then
        echo "- 🎉 **File Permissions**: All scripts have correct permissions" >> "$report_file"
    else
        echo "- ⚠️ **File Permissions**: $permission_issues permission issue(s) detected" >> "$report_file"
    fi
    
    echo "" >> "$report_file"
    log "INFO" "Comprehensive security tests completed"
}

# Function to calculate security score
calculate_security_score() {
    local report_file="$1"
    
    print_status "AUDIT" "Calculating security score..."
    
    local total_checks=0
    local passed_checks=0
    
    # Count checks from the report
    total_checks=$(grep -c "^- [✅❌⚠️]" "$report_file" || echo "0")
    passed_checks=$(grep -c "^- ✅" "$report_file" || echo "0")
    
    local score=0
    if [ "$total_checks" -gt 0 ]; then
        score=$(( (passed_checks * 100) / total_checks ))
    fi
    
    {
        echo "## 📊 Security Score"
        echo ""
        echo "**Overall Security Score**: $score/100"
        echo ""
        echo "- **Total Checks**: $total_checks"
        echo "- **Passed**: $passed_checks"
        echo "- **Failed/Warning**: $((total_checks - passed_checks))"
        echo ""
        
        if [ "$score" -ge 90 ]; then
            echo "🟢 **Rating**: Excellent Security Posture"
        elif [ "$score" -ge 80 ]; then
            echo "🟡 **Rating**: Good Security Posture"
        elif [ "$score" -ge 70 ]; then
            echo "🟠 **Rating**: Adequate Security Posture"
        else
            echo "🔴 **Rating**: Security Improvements Required"
        fi
        echo ""
    } >> "$report_file"
    
    print_status "SUCCESS" "Security score calculated: $score/100"
    log "INFO" "Security score: $score/100 ($passed_checks/$total_checks checks passed)"
}

# Function to generate recommendations
generate_recommendations() {
    local report_file="$1"
    
    {
        echo "## 💡 Recommendations"
        echo ""
        echo "Based on the audit findings, the following recommendations are provided:"
        echo ""
        
        # High priority recommendations
        echo "### 🔴 High Priority"
        echo ""
        if grep -q "❌" "$report_file"; then
            echo "1. **Address Critical Issues**: Resolve all items marked with ❌"
            echo "2. **Complete Missing Components**: Implement missing security components"
            echo "3. **Fix Configuration Issues**: Correct any configuration problems"
        else
            echo "- No high-priority issues detected ✅"
        fi
        echo ""
        
        # Medium priority recommendations
        echo "### 🟡 Medium Priority"
        echo ""
        if grep -q "⚠️" "$report_file"; then
            echo "1. **Review Warnings**: Investigate and address warning items"
            echo "2. **Enhance Security Controls**: Strengthen existing security measures"
            echo "3. **Update Documentation**: Ensure all documentation is current"
        else
            echo "- No medium-priority issues detected ✅"
        fi
        echo ""
        
        # General recommendations
        echo "### 🔵 General Security Best Practices"
        echo ""
        echo "1. **Regular Audits**: Schedule monthly security audits"
        echo "2. **Secret Rotation**: Implement quarterly secret rotation"
        echo "3. **Team Training**: Conduct security awareness training"
        echo "4. **Monitoring**: Set up continuous security monitoring"
        echo "5. **Incident Response**: Test incident response procedures"
        echo "6. **Compliance**: Maintain compliance with relevant regulations"
        echo ""
        
        # Next steps
        echo "### 📋 Next Steps"
        echo ""
        echo "1. **Immediate**: Address any critical security issues"
        echo "2. **This Week**: Review and implement high-priority recommendations"
        echo "3. **This Month**: Complete medium-priority improvements"
        echo "4. **Ongoing**: Establish regular security review processes"
        echo ""
    } >> "$report_file"
    
    print_status "SUCCESS" "Recommendations generated"
}

# Function to finalize audit report
finalize_audit_report() {
    local report_file="$1"
    
    {
        echo "---"
        echo ""
        echo "## 📝 Audit Information"
        echo ""
        echo "- **Audit ID**: $AUDIT_ID"
        echo "- **Timestamp**: $AUDIT_TIMESTAMP"
        echo "- **Environment**: $ENVIRONMENT"
        echo "- **Audit Type**: $([ "$COMPREHENSIVE" = "true" ] && echo "Comprehensive" || echo "Standard")"
        echo "- **Tool Version**: NutriCoach Security Agent v1.0"
        echo "- **Log File**: \`$LOG_FILE\`"
        echo ""
        echo "---"
        echo ""
        echo "*This report was generated automatically by the NutriCoach Security Agent.*  "
        echo "*For questions or support, contact the security team.*"
        echo ""
        echo "**Next Audit Recommended**: $(date -d '+1 month' '+%Y-%m-%d')"
    } >> "$report_file"
    
    print_status "SUCCESS" "Audit report finalized: $report_file"
    log "INFO" "Audit report saved to: $report_file"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [environment] [--comprehensive]"
    echo ""
    echo "Arguments:"
    echo "  environment      : Target environment (staging|production) [default: staging]"
    echo "  --comprehensive  : Run comprehensive security tests"
    echo ""
    echo "Examples:"
    echo "  $0                          # Standard audit for staging"
    echo "  $0 production               # Standard audit for production"
    echo "  $0 staging --comprehensive  # Comprehensive audit for staging"
    echo ""
    echo "Output:"
    echo "  - Detailed markdown report in logs/ directory"
    echo "  - Security score and recommendations"
    echo "  - Audit trail in log file"
    echo ""
    echo "NutriCoach Complete Security Audit Tool"
}

# Main audit execution
main() {
    # Check for help
    if [[ "${1:-}" == "-h" ]] || [[ "${1:-}" == "--help" ]]; then
        show_usage
        exit 0
    fi
    
    # Validate environment
    if [[ "$ENVIRONMENT" != "staging" ]] && [[ "$ENVIRONMENT" != "production" ]]; then
        print_status "ERROR" "Invalid environment: $ENVIRONMENT (must be 'staging' or 'production')"
        exit 1
    fi
    
    print_status "HEADER" "NutriCoach Security Audit"
    echo "Audit ID: $AUDIT_ID"
    echo "Environment: $ENVIRONMENT"
    echo "Comprehensive: $COMPREHENSIVE"
    echo "Timestamp: $AUDIT_TIMESTAMP"
    echo ""
    
    log "INFO" "Security audit started - ID: $AUDIT_ID, Environment: $ENVIRONMENT"
    
    # Create audit report
    local report_file
    report_file=$(create_audit_report)
    print_status "INFO" "Audit report: $report_file"
    
    # Run audit modules
    audit_secret_management "$report_file"
    audit_github_environments "$report_file"
    audit_security_workflows "$report_file"
    audit_code_security "$report_file"
    audit_documentation "$report_file"
    
    # Run comprehensive tests if requested
    if [ "$COMPREHENSIVE" = "true" ]; then
        run_comprehensive_tests "$report_file"
    fi
    
    # Calculate security score
    calculate_security_score "$report_file"
    
    # Generate recommendations
    generate_recommendations "$report_file"
    
    # Finalize report
    finalize_audit_report "$report_file"
    
    # Summary
    echo ""
    print_status "HEADER" "Security Audit Complete!"
    print_status "SUCCESS" "Audit ID: $AUDIT_ID"
    print_status "SUCCESS" "Report: $report_file"
    print_status "SUCCESS" "Log: $LOG_FILE"
    
    # Display key metrics
    local total_checks passed_checks score
    total_checks=$(grep -c "^- [✅❌⚠️]" "$report_file" || echo "0")
    passed_checks=$(grep -c "^- ✅" "$report_file" || echo "0")
    score=$(( passed_checks * 100 / total_checks ))
    
    echo ""
    echo "📊 Security Score: $score/100 ($passed_checks/$total_checks checks passed)"
    
    if [ "$score" -ge 90 ]; then
        print_status "SUCCESS" "Excellent security posture!"
    elif [ "$score" -ge 80 ]; then
        print_status "SUCCESS" "Good security posture"
    elif [ "$score" -ge 70 ]; then
        print_status "WARNING" "Adequate security posture - improvements recommended"
    else
        print_status "ERROR" "Security improvements required"
    fi
    
    log "INFO" "Security audit completed successfully - Score: $score/100"
    
    return 0
}

# Execute main function
main "$@"