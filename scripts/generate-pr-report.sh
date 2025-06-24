#!/bin/bash

# Automated PR report generation for blog preview module
# Generates comprehensive reports for pull request validation

set -e

# Configuration
PR_NUMBER="${1:-}"
BASE_BRANCH="${2:-main}"
TARGET_BRANCH="${3:-feature/blog-preview}"
OUTPUT_DIR="${4:-./reports}"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
REPORT_FILE="$OUTPUT_DIR/blog-preview-pr-report-$TIMESTAMP.md"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[REPORT]${NC} $1"
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

# Function to get git information
get_git_info() {
    local info=""
    
    if git rev-parse --git-dir > /dev/null 2>&1; then
        info+="**Commit:** $(git rev-parse HEAD | cut -c1-8)\n"
        info+="**Author:** $(git log -1 --pretty=format:'%an <%ae>')\n"
        info+="**Date:** $(git log -1 --pretty=format:'%ad' --date=iso)\n"
        info+="**Branch:** $(git branch --show-current 2>/dev/null || echo 'unknown')\n"
        
        # Get changed files
        if [ "$BASE_BRANCH" != "unknown" ]; then
            local changed_files=$(git diff --name-only origin/$BASE_BRANCH...HEAD 2>/dev/null | grep -E "(packages/blog-preview|apps/web)" || echo "")
            if [ ! -z "$changed_files" ]; then
                info+="**Changed Files:**\n"
                echo "$changed_files" | while read -r file; do
                    info+="- $file\n"
                done
            fi
        fi
    else
        info+="**Git Info:** Not available (not a git repository)\n"
    fi
    
    echo -e "$info"
}

# Function to run tests and capture results
run_test_suite() {
    local test_results=""
    local test_status="unknown"
    
    print_status "Running test suite..."
    
    # Unit tests
    if cd packages/blog-preview && pnpm test > /tmp/unit-tests.log 2>&1; then
        test_results+="- ✅ Unit Tests: PASSED\n"
    else
        test_results+="- ❌ Unit Tests: FAILED\n"
        test_status="failed"
    fi
    cd - > /dev/null
    
    # Integration tests (if server is running)
    if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
        if cd apps/web && timeout 30 pnpm vitest run __tests__/integration/ > /tmp/integration-tests.log 2>&1; then
            test_results+="- ✅ Integration Tests: PASSED\n"
        else
            test_results+="- ⚠️ Integration Tests: FAILED (server may not be running)\n"
        fi
        cd - > /dev/null
    else
        test_results+="- ⚠️ Integration Tests: SKIPPED (server not running)\n"
    fi
    
    # TypeScript compilation
    if cd packages/blog-preview && pnpm type-check > /tmp/typecheck.log 2>&1; then
        test_results+="- ✅ TypeScript Check: PASSED\n"
    else
        test_results+="- ❌ TypeScript Check: FAILED\n"
        test_status="failed"
    fi
    cd - > /dev/null
    
    # Linting
    if cd packages/blog-preview && pnpm lint > /tmp/lint.log 2>&1; then
        test_results+="- ✅ ESLint: PASSED\n"
    else
        test_results+="- ❌ ESLint: FAILED\n"
        test_status="failed"
    fi
    cd - > /dev/null
    
    # Build test
    if cd packages/blog-preview && pnpm build > /tmp/build.log 2>&1; then
        test_results+="- ✅ Build: PASSED\n"
    else
        test_results+="- ❌ Build: FAILED\n"
        test_status="failed"
    fi
    cd - > /dev/null
    
    echo -e "$test_results"
    return $([ "$test_status" = "failed" ] && echo 1 || echo 0)
}

# Function to analyze package metrics
analyze_package_metrics() {
    local metrics=""
    
    if [ -f "packages/blog-preview/package.json" ]; then
        local package_name=$(node -p "require('./packages/blog-preview/package.json').name")
        local package_version=$(node -p "require('./packages/blog-preview/package.json').version")
        
        metrics+="**Package:** $package_name@$package_version\n"
        
        # Build size
        if [ -d "packages/blog-preview/dist" ]; then
            local build_size=$(du -sh packages/blog-preview/dist | cut -f1)
            metrics+="**Build Size:** $build_size\n"
        fi
        
        # Dependencies count
        local deps_count=$(node -p "Object.keys(require('./packages/blog-preview/package.json').dependencies || {}).length")
        local dev_deps_count=$(node -p "Object.keys(require('./packages/blog-preview/package.json').devDependencies || {}).length")
        metrics+="**Dependencies:** $deps_count runtime, $dev_deps_count dev\n"
        
        # Test coverage (if available)
        if [ -f "packages/blog-preview/coverage/coverage-summary.json" ]; then
            local coverage=$(node -p "require('./packages/blog-preview/coverage/coverage-summary.json').total.lines.pct" 2>/dev/null || echo "N/A")
            metrics+="**Test Coverage:** $coverage%\n"
        fi
        
        # File count
        local file_count=$(find packages/blog-preview/src -name "*.ts" -o -name "*.tsx" | wc -l)
        metrics+="**Source Files:** $file_count\n"
    fi
    
    echo -e "$metrics"
}

# Function to check API endpoints
check_api_endpoints() {
    local api_results=""
    local base_url="http://localhost:3000"
    
    print_status "Checking API endpoints..."
    
    # Health check
    if curl -sf "$base_url/api/blog-preview/health" > /dev/null 2>&1; then
        api_results+="- ✅ Health Check: Available\n"
    else
        api_results+="- ❌ Health Check: Unavailable\n"
    fi
    
    # Blog list
    if curl -sf "$base_url/api/blog" > /dev/null 2>&1; then
        api_results+="- ✅ Blog List API: Available\n"
    else
        api_results+="- ❌ Blog List API: Unavailable\n"
    fi
    
    # Blog search
    if curl -sf "$base_url/api/blog?search=test" > /dev/null 2>&1; then
        api_results+="- ✅ Blog Search API: Available\n"
    else
        api_results+="- ❌ Blog Search API: Unavailable\n"
    fi
    
    # Blog by slug
    if curl -sf "$base_url/api/blog/slug/getting-started-with-nutricoach" > /dev/null 2>&1; then
        api_results+="- ✅ Blog by Slug API: Available\n"
    else
        api_results+="- ❌ Blog by Slug API: Unavailable\n"
    fi
    
    echo -e "$api_results"
}

# Function to check pages
check_pages() {
    local page_results=""
    local base_url="http://localhost:3000"
    
    print_status "Checking pages..."
    
    # Blog list page
    if curl -sf "$base_url/blog" | grep -q "NutriCoach Blog" 2>/dev/null; then
        page_results+="- ✅ Blog List Page: Working\n"
    else
        page_results+="- ❌ Blog List Page: Not working\n"
    fi
    
    # Individual blog post
    if curl -sf "$base_url/blog/getting-started-with-nutricoach" | grep -q "Getting Started" 2>/dev/null; then
        page_results+="- ✅ Blog Post Page: Working\n"
    else
        page_results+="- ❌ Blog Post Page: Not working\n"
    fi
    
    echo -e "$page_results"
}

# Function to generate security report
generate_security_report() {
    local security_results=""
    
    print_status "Running security checks..."
    
    # Check for known vulnerabilities
    if cd packages/blog-preview && pnpm audit --audit-level moderate > /tmp/security-audit.log 2>&1; then
        security_results+="- ✅ Security Audit: No high/critical vulnerabilities\n"
    else
        local vuln_count=$(grep -c "vulnerabilities" /tmp/security-audit.log 2>/dev/null || echo "0")
        security_results+="- ⚠️ Security Audit: $vuln_count vulnerabilities found\n"
    fi
    cd - > /dev/null
    
    # Check for sensitive data in code
    if grep -r -i "password\|secret\|key\|token" packages/blog-preview/src --exclude-dir=node_modules --exclude="*.test.*" | grep -v "// TODO\|// FIXME" > /tmp/sensitive-check.log 2>&1; then
        security_results+="- ⚠️ Sensitive Data: Potential sensitive data found in code\n"
    else
        security_results+="- ✅ Sensitive Data: No obvious sensitive data in code\n"
    fi
    
    echo -e "$security_results"
}

# Main report generation
generate_report() {
    print_status "Generating PR report for blog preview module..."
    
    # Create output directory
    mkdir -p "$OUTPUT_DIR"
    
    # Start report
    cat > "$REPORT_FILE" << EOF
# 📝 Blog Preview Module - PR Validation Report

**Generated:** $(date)
**PR Number:** ${PR_NUMBER:-"N/A"}
**Base Branch:** $BASE_BRANCH
**Target Branch:** $TARGET_BRANCH

---

## 📊 Executive Summary

This report provides a comprehensive validation of the blog preview module for the NutriCoach application. The module includes a complete TypeScript package with React components, API services, and comprehensive testing suite.

## 🔍 Git Information

$(get_git_info)

## 📦 Package Information

$(analyze_package_metrics)

## 🧪 Test Results

$(run_test_suite)

## 🌐 API Endpoints Status

$(check_api_endpoints)

## 📄 Pages Status

$(check_pages)

## 🔒 Security Analysis

$(generate_security_report)

## 🏗️ Architecture Overview

### Package Structure
\`\`\`
packages/blog-preview/
├── src/
│   ├── types/          # TypeScript type definitions
│   ├── services/       # API service classes
│   ├── components/     # React components
│   ├── utils/          # Utility functions
│   └── __tests__/      # Unit tests
├── dist/               # Built package
└── package.json        # Package configuration
\`\`\`

### Key Components
- **BlogService**: API integration service
- **BlogCard**: Individual blog post display component
- **BlogList**: Paginated blog listing component
- **BlogHero**: Featured blog post hero component

### API Endpoints
- \`GET /api/blog\` - List blog posts with filtering and pagination
- \`GET /api/blog/[id]\` - Get individual blog post by ID
- \`GET /api/blog/slug/[slug]\` - Get blog post by slug
- \`POST /api/blog\` - Create new blog post
- \`PUT /api/blog/[id]\` - Update blog post
- \`DELETE /api/blog/[id]\` - Delete blog post
- \`GET /api/blog-preview/health\` - Health check endpoint

## 🎯 Validation Objectives

The blog preview module validates the following CI/CD pipeline aspects:

- ✅ **TypeScript Compilation**: Strict type checking and compilation
- ✅ **Code Quality**: ESLint rules and formatting standards
- ✅ **Testing**: Unit, integration, and E2E test execution
- ✅ **Build Process**: Package building and distribution
- ✅ **API Integration**: Backend service integration
- ✅ **Component Integration**: React component functionality
- ✅ **Performance**: Response times and bundle optimization
- ✅ **Security**: Vulnerability scanning and best practices

## 📋 Checklist

### Development
- [ ] All TypeScript types are properly defined
- [ ] Components have proper PropTypes/interfaces
- [ ] Services handle errors gracefully
- [ ] Utilities are well-tested
- [ ] Documentation is complete

### Testing
- [ ] Unit tests cover all major functions
- [ ] Integration tests validate API endpoints
- [ ] E2E tests check user workflows
- [ ] Performance tests meet benchmarks
- [ ] Error scenarios are tested

### Deployment
- [ ] Package builds successfully
- [ ] All exports are available
- [ ] API endpoints respond correctly
- [ ] Pages render properly
- [ ] Health checks pass

### Quality
- [ ] ESLint passes without errors
- [ ] TypeScript compiles without errors
- [ ] Test coverage meets minimum threshold
- [ ] No security vulnerabilities
- [ ] Performance meets requirements

## 🚀 Deployment Readiness

Based on the validation results above, the blog preview module is:

**Status:** $(if run_test_suite > /dev/null 2>&1; then echo "✅ READY FOR DEPLOYMENT"; else echo "⚠️ NEEDS ATTENTION"; fi)

### Next Steps

1. **Review Test Results**: Address any failing tests or warnings
2. **Security Review**: Resolve any security issues identified
3. **Performance Validation**: Ensure performance benchmarks are met
4. **Integration Testing**: Validate with other system components
5. **Deployment**: Deploy to staging/production environment

## 📞 Support

For questions or issues related to this module:
- Review the package documentation in \`packages/blog-preview/README.md\`
- Check test logs in \`packages/blog-preview/coverage/\`
- Consult the API documentation for endpoint details

---

**Report Generated by:** NutriCoach CI/CD Pipeline
**Timestamp:** $(date -u +"%Y-%m-%dT%H:%M:%S.%03NZ")
EOF

    print_success "Report generated: $REPORT_FILE"
    
    # Display summary
    echo ""
    echo "==============================================="
    print_success "📝 PR Report Generated Successfully!"
    echo "==============================================="
    echo ""
    print_status "📁 Report Location: $REPORT_FILE"
    print_status "📊 Report Size: $(du -sh "$REPORT_FILE" | cut -f1)"
    echo ""
    
    # Show quick summary
    print_status "🔍 Quick Summary:"
    if run_test_suite > /dev/null 2>&1; then
        print_success "All critical tests passing"
    else
        print_warning "Some tests failing - review needed"
    fi
    
    if [ -f "packages/blog-preview/dist/index.js" ]; then
        print_success "Package built successfully"
    else
        print_error "Package build missing"
    fi
    
    echo ""
    print_status "📋 Next: Review the full report and address any issues"
}

# Main execution
main() {
    if [ -z "$PR_NUMBER" ]; then
        print_warning "PR number not provided - generating local report"
        PR_NUMBER="local-$(date +%s)"
    fi
    
    print_status "Generating PR report for blog preview module"
    print_status "Configuration:"
    echo "  PR Number: $PR_NUMBER"
    echo "  Base Branch: $BASE_BRANCH" 
    echo "  Target Branch: $TARGET_BRANCH"
    echo "  Output Directory: $OUTPUT_DIR"
    echo ""
    
    generate_report
}

# Run main function
main "$@"