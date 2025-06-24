#!/bin/bash

# Build script for @nutricoach/blog-preview package
# This script handles the complete build process with validation

set -e  # Exit on any error

echo "🏗️  Building @nutricoach/blog-preview package..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
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

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the package root."
    exit 1
fi

# Verify package name
PACKAGE_NAME=$(node -p "require('./package.json').name")
if [ "$PACKAGE_NAME" != "@nutricoach/blog-preview" ]; then
    print_error "Wrong package. Expected @nutricoach/blog-preview, got $PACKAGE_NAME"
    exit 1
fi

print_status "Building package: $PACKAGE_NAME"

# Clean previous build
print_status "Cleaning previous build..."
rm -rf dist/
print_success "Cleaned dist directory"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    print_status "Installing dependencies..."
    pnpm install
    print_success "Dependencies installed"
fi

# Run type checking
print_status "Running TypeScript type check..."
if pnpm type-check; then
    print_success "TypeScript type check passed"
else
    print_error "TypeScript type check failed"
    exit 1
fi

# Run linting
print_status "Running ESLint..."
if pnpm lint; then
    print_success "ESLint passed"
else
    print_error "ESLint failed"
    exit 1
fi

# Run tests
print_status "Running unit tests..."
if pnpm test; then
    print_success "Unit tests passed"
else
    print_error "Unit tests failed"
    exit 1
fi

# Build the package
print_status "Compiling TypeScript..."
if pnpm build; then
    print_success "TypeScript compilation completed"
else
    print_error "TypeScript compilation failed"
    exit 1
fi

# Verify build output
print_status "Verifying build output..."

# Check if dist directory exists
if [ ! -d "dist" ]; then
    print_error "dist directory not created"
    exit 1
fi

# Check for main entry point
if [ ! -f "dist/index.js" ]; then
    print_error "Main entry point dist/index.js not found"
    exit 1
fi

# Check for type definitions
if [ ! -f "dist/index.d.ts" ]; then
    print_error "Type definitions dist/index.d.ts not found"
    exit 1
fi

# Check for essential exports
REQUIRED_EXPORTS=(
    "dist/types/index.d.ts"
    "dist/services/index.d.ts"
    "dist/components/index.d.ts"
    "dist/utils/index.d.ts"
)

for export_file in "${REQUIRED_EXPORTS[@]}"; do
    if [ ! -f "$export_file" ]; then
        print_warning "Optional export $export_file not found"
    fi
done

print_success "Build output verification completed"

# Calculate build size
print_status "Calculating build size..."
BUILD_SIZE=$(du -sh dist/ | cut -f1)
print_success "Build size: $BUILD_SIZE"

# Validate package.json exports
print_status "Validating package.json exports..."
node -e "
const pkg = require('./package.json');
const fs = require('fs');

// Check main export
if (!fs.existsSync(pkg.main)) {
    console.error('Main export file does not exist:', pkg.main);
    process.exit(1);
}

// Check types export
if (!fs.existsSync(pkg.types)) {
    console.error('Types export file does not exist:', pkg.types);
    process.exit(1);
}

console.log('✅ Package exports validation passed');
"

print_success "Package.json exports validation completed"

# Generate build summary
print_status "Generating build summary..."

cat > dist/BUILD_INFO.json << EOF
{
    "package": "$PACKAGE_NAME",
    "version": "$(node -p 'require("./package.json").version')",
    "buildDate": "$(date -u +"%Y-%m-%dT%H:%M:%S.%03NZ")",
    "buildSize": "$BUILD_SIZE",
    "nodeVersion": "$(node --version)",
    "pnpmVersion": "$(pnpm --version 2>/dev/null || echo 'unknown')",
    "gitCommit": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
    "gitBranch": "$(git branch --show-current 2>/dev/null || echo 'unknown')",
    "exports": {
        "main": "$(node -p 'require("./package.json").main')",
        "types": "$(node -p 'require("./package.json").types')"
    },
    "files": [
        $(find dist -type f -name "*.js" -o -name "*.d.ts" -o -name "*.map" | sort | sed 's/^/        "/' | sed 's/$/"/' | paste -sd ',' -)
    ]
}
EOF

print_success "Build summary generated: dist/BUILD_INFO.json"

# Final validation
print_status "Running final validation..."

# Test if the built package can be imported
node -e "
try {
    const pkg = require('./dist/index.js');
    console.log('✅ Package can be imported successfully');
    
    // Check for expected exports
    const expectedExports = ['BlogService', 'BlogCard', 'BlogList', 'BlogHero'];
    const missingExports = expectedExports.filter(exp => !pkg[exp]);
    
    if (missingExports.length > 0) {
        console.error('❌ Missing exports:', missingExports.join(', '));
        process.exit(1);
    }
    
    console.log('✅ All expected exports are available');
} catch (error) {
    console.error('❌ Failed to import built package:', error.message);
    process.exit(1);
}
"

print_success "Final validation completed"

# Print summary
echo ""
echo "==============================================="
print_success "🎉 Build completed successfully!"
echo "==============================================="
echo ""
print_status "📊 Build Summary:"
echo "  Package: $PACKAGE_NAME"
echo "  Size: $BUILD_SIZE"
echo "  Output: dist/"
echo "  Main: $(node -p 'require("./package.json").main')"
echo "  Types: $(node -p 'require("./package.json").types')"
echo ""
print_status "🚀 Ready for deployment!"
echo ""

# Optional: Show next steps
print_status "📋 Next steps:"
echo "  1. Test integration: pnpm test:integration"
echo "  2. Publish package: pnpm publish"
echo "  3. Update consuming apps"
echo ""

exit 0