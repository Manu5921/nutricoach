#!/bin/bash

# Cross-validation script for blog preview module
# Validates integration between different components and systems

set -e

# Configuration
MODULE_PATH="./packages/blog-preview"
WEB_APP_PATH="./apps/web"
TEST_SERVER_PORT="3001"
VALIDATION_TIMEOUT="60"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

print_header() {
    echo -e "${PURPLE}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${PURPLE}║                 CROSS-VALIDATION SUITE                       ║${NC}"
    echo -e "${PURPLE}╚══════════════════════════════════════════════════════════════╝${NC}"
}

print_status() {
    echo -e "${BLUE}[CROSS-VAL]${NC} $1"
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

# Function to start test server
start_test_server() {
    print_status "Starting test server on port $TEST_SERVER_PORT..."
    
    cd "$WEB_APP_PATH"
    PORT=$TEST_SERVER_PORT pnpm start &
    SERVER_PID=$!
    
    # Wait for server to start
    print_status "Waiting for server to be ready..."
    for i in {1..30}; do
        if curl -s "http://localhost:$TEST_SERVER_PORT/api/health" >/dev/null 2>&1; then
            print_success "Test server is ready"
            return 0
        fi
        sleep 2
    done
    
    print_error "Test server failed to start"
    return 1
}

# Function to stop test server
stop_test_server() {
    if [ ! -z "$SERVER_PID" ]; then
        print_status "Stopping test server..."
        kill $SERVER_PID 2>/dev/null || true
        wait $SERVER_PID 2>/dev/null || true
    fi
}

# Function to validate package imports
validate_package_imports() {
    print_status "🔍 Validating package imports..."
    
    # Test that all exports are available
    node -e "
    const pkg = require('./$MODULE_PATH/dist/index.js');
    const expectedExports = [
        'BlogService',
        'BlogCard', 
        'BlogList',
        'BlogHero',
        'formatDate',
        'formatReadTime',
        'BlogPostSchema'
    ];
    
    const missingExports = expectedExports.filter(exp => !pkg[exp]);
    
    if (missingExports.length > 0) {
        console.error('Missing exports:', missingExports);
        process.exit(1);
    }
    
    console.log('✅ All expected exports are available');
    " || return 1
    
    print_success "Package imports validation passed"
}

# Function to validate TypeScript integration
validate_typescript_integration() {
    print_status "🔍 Validating TypeScript integration..."
    
    # Create a temporary test file to check TypeScript integration
    cat > /tmp/ts-integration-test.ts << 'EOF'
import { BlogService, BlogCard, BlogPostPreview } from '@nutricoach/blog-preview';

// Test service instantiation
const service = new BlogService('http://test.com');

// Test type checking
const mockPost: BlogPostPreview = {
    id: '1',
    title: 'Test',
    slug: 'test',
    authorName: 'Author',
    tags: []
};

// This should compile without errors
console.log('TypeScript integration test passed');
EOF

    cd "$WEB_APP_PATH"
    if npx tsc --noEmit /tmp/ts-integration-test.ts; then
        print_success "TypeScript integration validation passed"
        rm -f /tmp/ts-integration-test.ts
        return 0
    else
        print_error "TypeScript integration validation failed"
        rm -f /tmp/ts-integration-test.ts
        return 1
    fi
}

# Function to validate API integration
validate_api_integration() {
    print_status "🔍 Validating API integration..."
    
    local base_url="http://localhost:$TEST_SERVER_PORT"
    
    # Test health endpoint
    if ! curl -sf "$base_url/api/blog-preview/health" | grep -q "healthy"; then
        print_error "Health endpoint failed"
        return 1
    fi
    
    # Test blog list endpoint
    if ! curl -sf "$base_url/api/blog" | grep -q "data"; then
        print_error "Blog list endpoint failed"
        return 1
    fi
    
    # Test blog search
    if ! curl -sf "$base_url/api/blog?search=nutrition" | grep -q "data"; then
        print_error "Blog search endpoint failed"
        return 1
    fi
    
    # Test pagination
    if ! curl -sf "$base_url/api/blog?page=1&limit=2" | grep -q "pagination"; then
        print_error "Blog pagination failed"
        return 1
    fi
    
    print_success "API integration validation passed"
}

# Function to validate component rendering
validate_component_rendering() {
    print_status "🔍 Validating component rendering..."
    
    local base_url="http://localhost:$TEST_SERVER_PORT"
    
    # Test blog list page
    local blog_page=$(curl -sf "$base_url/blog")
    if ! echo "$blog_page" | grep -q "NutriCoach Blog"; then
        print_error "Blog list page rendering failed"
        return 1
    fi
    
    # Check for component markers
    if ! echo "$blog_page" | grep -q "blog-card\|blog-list"; then
        print_error "Blog components not found in rendered page"
        return 1
    fi
    
    # Test individual blog post
    local post_page=$(curl -sf "$base_url/blog/getting-started-with-nutricoach")
    if ! echo "$post_page" | grep -q "Getting Started with NutriCoach"; then
        print_warning "Individual blog post rendering may have issues"
    fi
    
    print_success "Component rendering validation passed"
}

# Function to validate data flow
validate_data_flow() {
    print_status "🔍 Validating data flow..."
    
    local base_url="http://localhost:$TEST_SERVER_PORT"
    
    # Test full data flow: API -> Service -> Component
    node -e "
    const fetch = require('node-fetch');
    const { BlogService } = require('./$MODULE_PATH/dist/index.js');
    
    async function testDataFlow() {
        try {
            // Test service integration
            const service = new BlogService('$base_url');
            const response = await service.getBlogPosts({ limit: 5 });
            
            if (!response.success) {
                console.error('Service request failed:', response.message);
                process.exit(1);
            }
            
            if (!response.data || !response.data.data || response.data.data.length === 0) {
                console.error('No data returned from service');
                process.exit(1);
            }
            
            // Validate data structure
            const post = response.data.data[0];
            const requiredFields = ['id', 'title', 'slug', 'authorName'];
            const missingFields = requiredFields.filter(field => !post[field]);
            
            if (missingFields.length > 0) {
                console.error('Missing required fields:', missingFields);
                process.exit(1);
            }
            
            console.log('✅ Data flow validation passed');
        } catch (error) {
            console.error('Data flow validation failed:', error.message);
            process.exit(1);
        }
    }
    
    testDataFlow();
    " || return 1
    
    print_success "Data flow validation passed"
}

# Function to validate error handling
validate_error_handling() {
    print_status "🔍 Validating error handling..."
    
    local base_url="http://localhost:$TEST_SERVER_PORT"
    
    # Test 404 handling for API
    local api_404_response=$(curl -s -w "%{http_code}" "$base_url/api/blog/non-existent-id")
    if [[ "$api_404_response" != *"404" ]]; then
        print_warning "API 404 handling may not be correct"
    fi
    
    # Test 404 handling for pages
    local page_404_response=$(curl -s -w "%{http_code}" "$base_url/blog/non-existent-post")
    if [[ "$page_404_response" != *"404" ]] && [[ "$page_404_response" != *"200" ]]; then
        print_warning "Page 404 handling may not be correct"
    fi
    
    # Test service error handling
    node -e "
    const { BlogService } = require('./$MODULE_PATH/dist/index.js');
    
    async function testErrorHandling() {
        try {
            const service = new BlogService('http://invalid-url-for-testing');
            const response = await service.getBlogPosts();
            
            if (response.success) {
                console.error('Expected error handling but got success');
                process.exit(1);
            }
            
            if (!response.error || !response.message) {
                console.error('Error response missing required fields');
                process.exit(1);
            }
            
            console.log('✅ Service error handling working');
        } catch (error) {
            console.error('Error handling test failed:', error.message);
            process.exit(1);
        }
    }
    
    testErrorHandling();
    " || return 1
    
    print_success "Error handling validation passed"
}

# Function to validate performance
validate_performance() {
    print_status "🔍 Validating performance..."
    
    local base_url="http://localhost:$TEST_SERVER_PORT"
    
    # Test API response times
    local start_time=$(date +%s%N)
    curl -sf "$base_url/api/blog?limit=10" > /dev/null
    local end_time=$(date +%s%N)
    local api_time=$(( (end_time - start_time) / 1000000 ))
    
    if [ $api_time -gt 2000 ]; then
        print_warning "API response time is slow: ${api_time}ms"
    else
        print_success "API response time is good: ${api_time}ms"
    fi
    
    # Test page load times
    start_time=$(date +%s%N)
    curl -sf "$base_url/blog" > /dev/null
    end_time=$(date +%s%N)
    local page_time=$(( (end_time - start_time) / 1000000 ))
    
    if [ $page_time -gt 5000 ]; then
        print_warning "Page load time is slow: ${page_time}ms"
    else
        print_success "Page load time is good: ${page_time}ms"
    fi
}

# Main execution
main() {
    print_header
    print_status "Starting cross-validation for blog preview module"
    echo ""
    
    # Set trap for cleanup
    trap stop_test_server EXIT
    
    # Build packages first
    print_status "📦 Building packages..."
    cd "$MODULE_PATH"
    pnpm build || {
        print_error "Package build failed"
        exit 1
    }
    
    cd - > /dev/null
    cd "$WEB_APP_PATH"
    pnpm build || {
        print_error "Web app build failed"
        exit 1
    }
    cd - > /dev/null
    
    # Start test server
    start_test_server || {
        print_error "Failed to start test server"
        exit 1
    }
    
    # Run validation tests
    local validation_results=()
    
    echo ""
    print_status "🧪 Running cross-validation tests..."
    echo ""
    
    # Test 1: Package Imports
    if validate_package_imports; then
        validation_results+=("✅ Package Imports")
    else
        validation_results+=("❌ Package Imports")
    fi
    
    # Test 2: TypeScript Integration
    if validate_typescript_integration; then
        validation_results+=("✅ TypeScript Integration")
    else
        validation_results+=("❌ TypeScript Integration")
    fi
    
    # Test 3: API Integration
    if validate_api_integration; then
        validation_results+=("✅ API Integration")
    else
        validation_results+=("❌ API Integration")
    fi
    
    # Test 4: Component Rendering
    if validate_component_rendering; then
        validation_results+=("✅ Component Rendering")
    else
        validation_results+=("❌ Component Rendering")
    fi
    
    # Test 5: Data Flow
    if validate_data_flow; then
        validation_results+=("✅ Data Flow")
    else
        validation_results+=("❌ Data Flow")
    fi
    
    # Test 6: Error Handling
    if validate_error_handling; then
        validation_results+=("✅ Error Handling")
    else
        validation_results+=("❌ Error Handling")
    fi
    
    # Test 7: Performance
    if validate_performance; then
        validation_results+=("✅ Performance")
    else
        validation_results+=("❌ Performance")
    fi
    
    # Summary
    echo ""
    echo "==============================================="
    print_success "🎉 Cross-validation completed!"
    echo "==============================================="
    echo ""
    print_status "📊 Validation Results:"
    for result in "${validation_results[@]}"; do
        echo "  $result"
    done
    echo ""
    
    # Check for failures
    local failed_count=$(echo "${validation_results[@]}" | grep -o "❌" | wc -l)
    local total_count=${#validation_results[@]}
    local success_count=$((total_count - failed_count))
    
    print_status "Score: $success_count/$total_count validations passed"
    
    if [ $failed_count -eq 0 ]; then
        print_success "🚀 All cross-validations passed! Module is ready for deployment."
        exit 0
    elif [ $failed_count -le 2 ]; then
        print_warning "⚠️  Some validations failed but module may still be deployable"
        print_status "Review failed validations and address critical issues"
        exit 1
    else
        print_error "❌ Too many validations failed - module needs fixes before deployment"
        exit 1
    fi
}

# Run main function
main "$@"