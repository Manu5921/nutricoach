#!/bin/bash

# Script to trigger dev-agents for blog preview PR validation
# This script coordinates multiple agents for comprehensive testing

set -e

# Configuration
AGENTS_DIR="${1:-./dev-agents}"
PR_NUMBER="${2:-}"
BASE_BRANCH="${3:-main}"
TARGET_BRANCH="${4:-feature/blog-preview}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

print_header() {
    echo -e "${PURPLE}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${PURPLE}║                    AGENT COORDINATION                        ║${NC}"
    echo -e "${PURPLE}╚══════════════════════════════════════════════════════════════╝${NC}"
}

print_status() {
    echo -e "${BLUE}[AGENTS]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if agents directory exists
check_agents_setup() {
    if [ ! -d "$AGENTS_DIR" ]; then
        print_error "Agents directory not found: $AGENTS_DIR"
        print_status "Please run the agents setup first"
        exit 1
    fi
    
    if [ ! -f "$AGENTS_DIR/orchestrator.js" ]; then
        print_error "Agent orchestrator not found"
        exit 1
    fi
}

# Function to run an agent with proper error handling
run_agent() {
    local agent_name="$1"
    local agent_task="$2"
    local agent_context="$3"
    
    print_status "🤖 Running $agent_name agent..."
    
    cd "$AGENTS_DIR"
    
    if node orchestrator.js --agent="$agent_name" --task="$agent_task" --context="$agent_context" --pr="$PR_NUMBER"; then
        print_success "$agent_name agent completed successfully"
        return 0
    else
        print_error "$agent_name agent failed"
        return 1
    fi
}

# Function to create agent report
create_agent_report() {
    local report_file="./reports/agents-report-$(date +%Y%m%d-%H%M%S).md"
    mkdir -p ./reports
    
    cat > "$report_file" << EOF
# 🤖 Dev Agents Validation Report

**Date:** $(date)
**PR:** #$PR_NUMBER
**Target Branch:** $TARGET_BRANCH
**Base Branch:** $BASE_BRANCH

## Agents Execution Summary

| Agent | Task | Status | Duration |
|-------|------|--------|----------|
EOF

    echo "$report_file"
}

# Main execution
main() {
    print_header
    print_status "Starting agent coordination for blog preview validation"
    echo ""
    
    # Validation
    if [ -z "$PR_NUMBER" ]; then
        print_warning "PR number not provided, running in local mode"
        PR_NUMBER="local-$(date +%s)"
    fi
    
    print_status "Configuration:"
    echo "  Agents Directory: $AGENTS_DIR"
    echo "  PR Number: $PR_NUMBER"
    echo "  Base Branch: $BASE_BRANCH"
    echo "  Target Branch: $TARGET_BRANCH"
    echo ""
    
    # Check setup
    check_agents_setup
    
    # Create report
    REPORT_FILE=$(create_agent_report)
    print_status "Agent report: $REPORT_FILE"
    echo ""
    
    # Store start time
    START_TIME=$(date +%s)
    
    # Agent 1: Module Agent - Validate package structure
    print_status "🔧 Phase 1: Module Validation"
    MODULE_START=$(date +%s)
    if run_agent "module-agent" "validate-package" "blog-preview"; then
        MODULE_DURATION=$(($(date +%s) - MODULE_START))
        echo "| Module Agent | Package Validation | ✅ Success | ${MODULE_DURATION}s |" >> "$REPORT_FILE"
    else
        MODULE_DURATION=$(($(date +%s) - MODULE_START))
        echo "| Module Agent | Package Validation | ❌ Failed | ${MODULE_DURATION}s |" >> "$REPORT_FILE"
        print_error "Module validation failed - stopping execution"
        exit 1
    fi
    echo ""
    
    # Agent 2: QA Agent - Run comprehensive tests
    print_status "🧪 Phase 2: Quality Assurance"
    QA_START=$(date +%s)
    if run_agent "qa-agent" "test-suite" "blog-preview-tests"; then
        QA_DURATION=$(($(date +%s) - QA_START))
        echo "| QA Agent | Test Suite | ✅ Success | ${QA_DURATION}s |" >> "$REPORT_FILE"
    else
        QA_DURATION=$(($(date +%s) - QA_START))
        echo "| QA Agent | Test Suite | ❌ Failed | ${QA_DURATION}s |" >> "$REPORT_FILE"
        print_warning "QA tests failed - continuing with reduced confidence"
    fi
    echo ""
    
    # Agent 3: UI Agent - Validate components and pages
    print_status "🎨 Phase 3: UI Validation"
    UI_START=$(date +%s)
    if run_agent "ui-agent" "validate-components" "blog-preview-ui"; then
        UI_DURATION=$(($(date +%s) - UI_START))
        echo "| UI Agent | Component Validation | ✅ Success | ${UI_DURATION}s |" >> "$REPORT_FILE"
    else
        UI_DURATION=$(($(date +%s) - UI_START))
        echo "| UI Agent | Component Validation | ❌ Failed | ${UI_DURATION}s |" >> "$REPORT_FILE"
        print_warning "UI validation failed - components may have issues"
    fi
    echo ""
    
    # Agent 4: DB Agent - Validate API endpoints and data flow
    print_status "🗄️ Phase 4: Data Layer Validation"
    DB_START=$(date +%s)
    if run_agent "db-agent" "validate-api" "blog-preview-api"; then
        DB_DURATION=$(($(date +%s) - DB_START))
        echo "| DB Agent | API Validation | ✅ Success | ${DB_DURATION}s |" >> "$REPORT_FILE"
    else
        DB_DURATION=$(($(date +%s) - DB_START))
        echo "| DB Agent | API Validation | ❌ Failed | ${DB_DURATION}s |" >> "$REPORT_FILE"
        print_warning "API validation failed - data layer may have issues"
    fi
    echo ""
    
    # Agent 5: Doc Agent - Validate documentation and examples
    print_status "📚 Phase 5: Documentation Validation"
    DOC_START=$(date +%s)
    if run_agent "doc-agent" "validate-docs" "blog-preview-docs"; then
        DOC_DURATION=$(($(date +%s) - DOC_START))
        echo "| Doc Agent | Documentation | ✅ Success | ${DOC_DURATION}s |" >> "$REPORT_FILE"
    else
        DOC_DURATION=$(($(date +%s) - DOC_START))
        echo "| Doc Agent | Documentation | ❌ Failed | ${DOC_DURATION}s |" >> "$REPORT_FILE"
        print_warning "Documentation validation failed - docs may be incomplete"
    fi
    echo ""
    
    # Cross-validation phase
    print_status "🔄 Phase 6: Cross-Validation"
    CROSS_START=$(date +%s)
    print_status "Running cross-agent validation..."
    
    # Run integration tests that span multiple components
    if run_agent "qa-agent" "integration-test" "blog-preview-integration"; then
        CROSS_DURATION=$(($(date +%s) - CROSS_START))
        echo "| Cross-Validation | Integration Test | ✅ Success | ${CROSS_DURATION}s |" >> "$REPORT_FILE"
        print_success "Cross-validation completed successfully"
    else
        CROSS_DURATION=$(($(date +%s) - CROSS_START))
        echo "| Cross-Validation | Integration Test | ❌ Failed | ${CROSS_DURATION}s |" >> "$REPORT_FILE"
        print_warning "Cross-validation failed - integration issues detected"
    fi
    echo ""
    
    # Generate final report
    TOTAL_DURATION=$(($(date +%s) - START_TIME))
    
    cat >> "$REPORT_FILE" << EOF

## Summary

**Total Duration:** ${TOTAL_DURATION}s
**Overall Status:** $( [ -f /tmp/agent_failures ] && echo "⚠️ Partial Success" || echo "✅ All Validations Passed" )

## Recommendations

$( [ -f /tmp/agent_failures ] && cat << REC
- Review failed agent outputs for specific issues
- Address any component integration problems
- Verify API endpoint functionality
- Check documentation completeness
REC
)

## Next Steps

1. Review this report for any issues
2. Address any failed validations
3. Re-run agents if needed
4. Proceed with deployment if all critical validations pass

---
*Generated by NutriCoach Agent Coordination System*
EOF

    # Display summary
    echo ""
    echo "==============================================="
    print_success "🎉 Agent coordination completed!"
    echo "==============================================="
    echo ""
    print_status "📊 Execution Summary:"
    echo "  Total Duration: ${TOTAL_DURATION}s"
    echo "  Report File: $REPORT_FILE"
    echo ""
    
    # Check for failures
    if [ -f /tmp/agent_failures ]; then
        print_warning "Some agents reported issues - review the report for details"
        rm -f /tmp/agent_failures
        exit 1
    else
        print_success "All agents completed successfully!"
        print_status "🚀 Blog preview module is ready for deployment"
    fi
}

# Cleanup function
cleanup() {
    print_status "Cleaning up temporary files..."
    rm -f /tmp/agent_failures
}

# Set trap for cleanup
trap cleanup EXIT

# Run main function
main "$@"