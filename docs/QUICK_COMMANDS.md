# ⚡ Quick Commands - Blog Preview Module

## 🚀 One-Line Setup

```bash
# Complete setup and validation (run from project root)
git checkout -b feature/blog-preview-test && \
cd packages/blog-preview && pnpm install && pnpm build && pnpm test && \
cd ../../apps/web && pnpm install && pnpm build && \
cd .. && ./scripts/cross-validation.sh && \
echo "✅ Setup complete! Ready to create PR."
```

## 📦 Package Commands

```bash
# Blog Preview Package (from packages/blog-preview/)
pnpm install              # Install dependencies
pnpm build                # Build package
pnpm dev                  # Build in watch mode
pnpm test                 # Run unit tests
pnpm test:watch           # Run tests in watch mode
pnpm test:coverage        # Run tests with coverage
pnpm lint                 # Run ESLint
pnpm lint:fix             # Fix ESLint issues
pnpm type-check           # TypeScript type checking
pnpm clean                # Clean build directory

# Quick validation
pnpm build && pnpm test && pnpm lint && echo "✅ Package ready"
```

## 🌐 Web App Commands

```bash
# Web Application (from apps/web/)
pnpm install              # Install dependencies
pnpm dev                  # Start development server
pnpm build                # Build for production
pnpm start                # Start production server
pnpm lint                 # Run ESLint
pnpm type-check           # TypeScript checking

# Quick test
pnpm build && pnpm start && echo "✅ Server running on http://localhost:3000"
```

## 🧪 Testing Commands

```bash
# Unit Tests
cd packages/blog-preview && pnpm test:coverage

# Integration Tests (requires server running)
cd apps/web && pnpm vitest run __tests__/integration/

# E2E Tests (requires server running)
cd apps/web && pnpm vitest run __tests__/e2e/

# Performance Tests
cd apps/web && pnpm vitest run __tests__/performance/

# All tests
cd packages/blog-preview && pnpm test && \
cd ../../apps/web && pnpm vitest run __tests__/
```

## 🔍 Validation Commands

```bash
# Quick health check
curl -s http://localhost:3000/api/blog-preview/health | jq '.'

# API testing
curl -s http://localhost:3000/api/blog | jq '.data[0]'
curl -s "http://localhost:3000/api/blog?search=nutrition&limit=3" | jq '.'
curl -s http://localhost:3000/api/blog/slug/getting-started-with-nutricoach | jq '.data.title'

# Page testing
curl -I http://localhost:3000/blog
curl -I http://localhost:3000/blog/getting-started-with-nutricoach
```

## 🤖 Automation Commands

```bash
# Cross-validation suite
./scripts/cross-validation.sh

# Deployment validation
./scripts/validate-deployment.sh http://localhost:3000

# Agent coordination (if dev-agents available)
./scripts/trigger-agents.sh ./dev-agents

# Generate PR report
./scripts/generate-pr-report.sh

# Full automation pipeline
./scripts/trigger-agents.sh && \
./scripts/cross-validation.sh && \
./scripts/validate-deployment.sh && \
./scripts/generate-pr-report.sh
```

## 🏗️ Build Commands

```bash
# Build blog-preview package with validation
cd packages/blog-preview && ./scripts/build.sh

# Build everything
pnpm build  # (from project root)

# Clean and rebuild
rm -rf packages/*/dist apps/*/.next && pnpm build

# Production build
NODE_ENV=production pnpm build
```

## 🔧 Development Commands

```bash
# Start development with hot reload
cd apps/web && pnpm dev

# Start with custom port
cd apps/web && PORT=3001 pnpm dev

# Start with debugging
cd apps/web && DEBUG=* pnpm dev

# Watch for changes in package
cd packages/blog-preview && pnpm dev
```

## 📊 Monitoring Commands

```bash
# Check package size
cd packages/blog-preview && du -sh dist/

# Check dependencies
cd packages/blog-preview && pnpm list
cd apps/web && pnpm list --depth=0

# Security audit
pnpm audit
cd packages/blog-preview && pnpm audit --audit-level high

# Performance check
time curl -s http://localhost:3000/api/blog > /dev/null
```

## 🐛 Debug Commands

```bash
# Verbose test output
cd packages/blog-preview && pnpm vitest run --reporter=verbose

# Debug specific test
cd packages/blog-preview && pnpm vitest src/__tests__/blog.service.test.ts

# Check build output
cd packages/blog-preview && node -e "console.log(require('./dist/index.js'))"

# Verify exports
cd packages/blog-preview && node -e "
const pkg = require('./dist/index.js');
console.log('Exports:', Object.keys(pkg));
"

# Check server logs
cd apps/web && tail -f .next/trace
```

## 🔄 Git Commands

```bash
# Create and switch to feature branch
git checkout -b feature/blog-preview-test

# Commit with conventional format
git add . && git commit -m "feat: add blog preview module for CI/CD testing

- Complete TypeScript package with Zod schemas
- React components with accessibility support  
- Comprehensive test suite (unit, integration, e2e)
- API routes with proper error handling
- Performance and security validations
- Automated testing and validation scripts"

# Push and create PR
git push origin feature/blog-preview-test && \
gh pr create --title "🧪 Add Blog Preview Module for CI/CD Pipeline Testing" \
             --body-file docs/PR_TEMPLATE.md \
             --label "testing,ci-cd,feature"
```

## 🚨 Emergency Commands

```bash
# Kill all node processes
pkill -f node

# Reset everything
rm -rf node_modules packages/*/node_modules apps/*/node_modules && \
rm -rf packages/*/dist apps/*/.next && \
pnpm install

# Check what's running on port 3000
lsof -i :3000

# Force kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

## 📋 Checklist Commands

```bash
# Pre-commit checklist
cd packages/blog-preview && \
pnpm lint && \
pnpm type-check && \
pnpm test && \
pnpm build && \
echo "✅ Pre-commit checks passed"

# Pre-PR checklist
./scripts/cross-validation.sh && \
./scripts/validate-deployment.sh http://localhost:3000 && \
./scripts/generate-pr-report.sh && \
echo "✅ Ready for PR"

# Deployment readiness
cd packages/blog-preview && pnpm build && \
cd ../../apps/web && pnpm build && \
curl -sf http://localhost:3000/api/blog-preview/health && \
echo "✅ Deployment ready"
```

## 🎯 Common Workflows

### Local Development
```bash
# Terminal 1: Package development
cd packages/blog-preview && pnpm dev

# Terminal 2: Web app development  
cd apps/web && pnpm dev

# Terminal 3: Testing
curl -s http://localhost:3000/api/blog-preview/health
```

### Testing Workflow
```bash
# 1. Unit tests
cd packages/blog-preview && pnpm test:coverage

# 2. Integration tests
cd apps/web && pnpm dev &
sleep 10 && ./scripts/cross-validation.sh

# 3. Generate report
./scripts/generate-pr-report.sh
```

### CI/CD Simulation
```bash
# Simulate GitHub Actions locally
pnpm install && \
pnpm lint && \
pnpm type-check && \
pnpm test && \
pnpm build && \
./scripts/validate-deployment.sh && \
echo "✅ CI/CD simulation passed"
```

## 💡 Pro Tips

```bash
# Use aliases for frequent commands
alias blog-build="cd packages/blog-preview && pnpm build"
alias blog-test="cd packages/blog-preview && pnpm test"
alias web-dev="cd apps/web && pnpm dev"
alias validate-all="./scripts/cross-validation.sh && ./scripts/validate-deployment.sh"

# Watch for file changes
watch -n 2 'curl -s http://localhost:3000/api/blog-preview/health | jq .status'

# Quick API test
function test-blog-api() {
    echo "Health: $(curl -s http://localhost:3000/api/blog-preview/health | jq -r .status)"
    echo "Posts: $(curl -s http://localhost:3000/api/blog | jq '.data | length')"
}
```

---

**💡 Tip**: Bookmark this page for quick reference during development!