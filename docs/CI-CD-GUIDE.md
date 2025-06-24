# CI/CD Pipeline Guide for NutriCoach

This comprehensive guide covers the complete CI/CD pipeline setup for the NutriCoach monorepo, featuring advanced GitHub Actions workflows with enterprise-grade reliability and security.

## 🚀 Overview

The NutriCoach CI/CD pipeline is designed for a modern Next.js 15 + Supabase monorepo with the following capabilities:

- **🔄 Continuous Integration**: Automated testing, linting, and validation
- **🚀 Continuous Deployment**: Zero-downtime deployments to Vercel
- **🗄️ Database Management**: Automated Supabase migrations with rollback
- **🔒 Security-First**: Comprehensive security scanning and validation
- **📊 Monitoring**: Health checks, performance metrics, and alerting
- **🔧 Developer Experience**: Fast feedback loops and detailed reporting

### Architecture Highlights

- **Monorepo Support**: Turborepo integration with intelligent caching
- **Multi-Environment**: Staging and production environments with protection
- **Parallel Execution**: Optimized job parallelization for speed
- **Smart Caching**: Multi-layer caching for dependencies and build artifacts
- **Conditional Execution**: Path-based job execution for efficiency

## 📋 Pipeline Structure

### 1. CI Pipeline (`.github/workflows/ci.yml`)

**🎯 Purpose**: Comprehensive code quality and testing validation

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests targeting `main` or `develop`
- Manual workflow dispatch

**🔧 Key Features:**
- **Change Detection**: Only runs relevant jobs based on file changes
- **Progressive Validation**: Fast feedback with gradual complexity
- **Parallel Execution**: Maximized concurrency for speed
- **Quality Gates**: Comprehensive validation checkpoints

**Jobs Overview:**

| Job | Purpose | Dependencies | Runtime |
|-----|---------|--------------|---------|
| **setup** | Dependency installation & caching | None | ~2-3 min |
| **lint** | Code style & formatting | setup | ~1-2 min |
| **type-check** | TypeScript validation | setup | ~2-3 min |
| **build** | Production build validation | setup | ~3-5 min |
| **test-unit** | Unit test execution | setup, build | ~2-4 min |
| **test-integration** | Integration test execution | setup, build | ~3-6 min |
| **test-e2e** | End-to-end testing (PR only) | setup, build | ~5-10 min |
| **security-audit** | Vulnerability scanning | setup | ~1-2 min |
| **quality-gate** | Final validation | all above | ~1 min |
| **notify** | Status notifications | quality-gate | ~30s |

### 2. Deploy Pipeline (`.github/workflows/deploy.yml`)

**🎯 Purpose**: Safe, automated deployment with comprehensive validation

**Triggers:**
- Push to `main` branch (auto-production)
- Release published events
- Manual workflow dispatch with environment selection

**🔧 Advanced Features:**
- **Environment Detection**: Intelligent environment routing
- **Pre-deployment Validation**: Comprehensive safety checks
- **Database Coordination**: Migration synchronization
- **Health Monitoring**: Post-deployment verification
- **Automatic Rollback**: Failure recovery mechanisms
- **Release Management**: Automated GitHub releases

### 3. Database Migrations (`.github/workflows/database-migrations.yml`)

**🎯 Purpose**: Safe, automated database evolution with enterprise-grade safety

**Advanced Migration Safety:**
- **SQL Validation**: Syntax and semantic checking
- **Dangerous Operation Detection**: Automatic flagging of risky operations
- **Test Environment Validation**: Clean database testing
- **Backup Creation**: Automatic pre-migration backups
- **Sequential Deployment**: Staging → Production flow
- **Rollback Capabilities**: Emergency recovery procedures

## ⚙️ Environment Configuration

### GitHub Secrets Configuration

Configure these secrets in your GitHub repository settings (`Settings → Secrets and variables → Actions`):

#### 🔐 Vercel Integration
```bash
VERCEL_TOKEN=your_vercel_token_here
VERCEL_ORG_ID=your_organization_id
VERCEL_PROJECT_ID_PROD=prod_project_id
VERCEL_PROJECT_ID_STAGING=staging_project_id
```

#### 🗄️ Supabase Integration
```bash
SUPABASE_ACCESS_TOKEN=your_supabase_access_token
SUPABASE_PROJECT_REF_PROD=your_prod_project_ref
SUPABASE_PROJECT_REF_STAGING=your_staging_project_ref
SUPABASE_DB_URL=postgres://[username]:[password]@db.[ref].supabase.co:5432/postgres
NEXT_PUBLIC_SUPABASE_URL=https://[ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_TEST_ANON_KEY=your_test_anon_key
```

#### 🚀 Performance Optimization
```bash
TURBO_TOKEN=your_turbo_remote_cache_token
TURBO_TEAM=your_turbo_team_name
```

#### 📢 Notification Integrations
```bash
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
```

#### 📊 Code Coverage & Analytics
```bash
CODECOV_TOKEN=your_codecov_token
```

### Environment Protection Rules

Set up GitHub Environments with appropriate protection:

1. **staging**
   - Auto-deployment from `develop` branch
   - No approval required
   - 10-minute timeout

2. **production**
   - Manual approval required (2 reviewers)
   - Protected branch deployment only
   - 30-minute timeout

3. **staging-db**
   - Database migrations staging
   - Auto-approval for `develop`

4. **production-db**
   - Database migrations production
   - Manual approval required (DBA team)
   - Review required for dangerous operations

## 🛠️ Local Development Tools

### Production Deployment Script

The production deployment script provides enterprise-grade deployment capabilities:

```bash
# Run production deployment
./scripts/deploy/production.sh

# Features included:
# ✅ Comprehensive prerequisite checks
# ✅ Database backup creation
# ✅ Full test suite execution
# ✅ Security audit validation
# ✅ Production build verification
# ✅ Health checks with retries
# ✅ Automatic rollback on failure
# ✅ Release creation and tagging
# ✅ Notification dispatch
```

**Safety Features:**
- **Confirmation Required**: Manual confirmation for production deploys
- **Prerequisites Validation**: Node.js, git, environment variables
- **Clean Working Directory**: Ensures no uncommitted changes
- **Branch Validation**: Must be on `main` branch
- **Comprehensive Backups**: Database and configuration backups
- **Health Monitoring**: Multi-layer health validation

### Helper Functions Library

```bash
# Source the helper functions
source ./scripts/deploy/deploy-helpers.sh

# Example usage
check_required_tools "node:18.0.0" "pnpm:8.0.0" "supabase" "vercel"
validate_env_vars "VERCEL_TOKEN:secret" "SUPABASE_ACCESS_TOKEN:secret"
check_git_status "main" true
health_check "https://nutricoach.vercel.app" 5 10 30
measure_performance "https://nutricoach.vercel.app" 10 2
```

## 📊 Monitoring and Observability

### Health Check Matrix

| Check Type | Endpoint | Frequency | Timeout | Retries |
|------------|----------|-----------|---------|---------|
| **API Health** | `/api/health` | Post-deploy | 30s | 5 |
| **Database** | Supabase ping | Pre/Post deploy | 10s | 3 |
| **Frontend** | `/` | Post-deploy | 30s | 3 |
| **Performance** | All endpoints | Post-deploy | 30s | 10 |

### Notification Strategy

**📢 Slack Channels:**
- `#nutricoach-ci` - CI pipeline status
- `#nutricoach-deployments` - Deployment notifications
- `#nutricoach-alerts` - Critical alerts and failures
- `#nutricoach-db` - Database migration status
- `#nutricoach-production` - Production-specific notifications

**🔔 Notification Types:**
- **Success**: ✅ Deployment completions, test passes
- **Warning**: ⚠️ Performance issues, security findings
- **Error**: ❌ Deployment failures, test failures
- **Security**: 🚨 Vulnerability discoveries, breaches

## 🔍 Troubleshooting Guide

### Common Issues and Solutions

#### 1. Build Failures 🏗️

**Symptoms:**
```
Error: TypeScript compilation failed
Error: Test failures detected
Error: Build process exited with code 1
```

**Diagnosis:**
```bash
# Check local build
pnpm build

# Check TypeScript issues
pnpm type-check

# Run tests locally
pnpm test
```

**Solutions:**
- Fix TypeScript errors in the codebase
- Update failing tests
- Check for missing environment variables
- Verify dependency compatibility

#### 2. Deployment Failures 🚀

**Symptoms:**
```
Error: Vercel deployment failed
Error: Health checks failed
Error: Environment variables missing
```

**Diagnosis:**
```bash
# Check Vercel CLI locally
vercel --version
vercel whoami

# Test deployment locally
vercel dev

# Check environment variables
echo $VERCEL_TOKEN | wc -c
```

**Solutions:**
- Verify Vercel token and permissions
- Check project configuration
- Validate environment variables
- Review deployment logs in Vercel dashboard

#### 3. Database Migration Issues 🗄️

**Symptoms:**
```
Error: Migration failed to apply
Error: SQL syntax error
Error: Connection to database failed
```

**Diagnosis:**
```bash
# Check Supabase connection
supabase status
supabase db ping --project-ref YOUR_REF

# Validate migrations locally
supabase db diff
supabase db reset
```

**Solutions:**
- Fix SQL syntax errors
- Resolve migration conflicts
- Check database connectivity
- Review migration order

### Emergency Procedures 🚨

#### Immediate Rollback

```bash
# 1. Rollback Vercel deployment
vercel rollback --token $VERCEL_TOKEN

# 2. Check deployment history
vercel ls --token $VERCEL_TOKEN

# 3. Promote previous deployment
vercel promote [DEPLOYMENT_ID] --token $VERCEL_TOKEN
```

#### Database Emergency Recovery

```bash
# 1. Download latest backup
# Check workflow artifacts for recent backups

# 2. Restore database
supabase db reset --linked
psql $DATABASE_URL < backup_file.sql

# 3. Verify restoration
supabase db ping --project-ref $PROJECT_REF
```

## 🚀 Performance Optimization

### Caching Strategy

**📦 Multi-Layer Caching:**

```yaml
# 1. Dependency Cache
- uses: actions/cache@v4
  with:
    path: ~/.pnpm-store
    key: ${{ runner.os }}-pnpm-${{ hashFiles('**/pnpm-lock.yaml') }}

# 2. Turbo Cache
- uses: actions/cache@v4
  with:
    path: .turbo
    key: ${{ runner.os }}-turbo-${{ github.sha }}

# 3. Build Cache
- uses: actions/cache@v4
  with:
    path: |
      apps/web/.next
      packages/*/dist
    key: ${{ runner.os }}-build-${{ github.sha }}
```

**⚡ Performance Benefits:**
- **Dependency Installation**: 3-5 minutes → 30-60 seconds
- **Build Process**: 5-8 minutes → 2-3 minutes
- **Test Execution**: 10-15 minutes → 5-8 minutes

## 🔒 Security and Compliance

### Security Scanning Matrix

| Tool | Scope | Frequency | Threshold |
|------|-------|-----------|-----------|
| **npm audit** | Dependencies | Every run | High: 0, Critical: 0 |
| **CodeQL** | Source code | Weekly | Medium+ |
| **Semgrep** | Security patterns | Every run | High+ |
| **TruffleHog** | Secret detection | Every run | Any |
| **Trivy** | Container scan | Release | High+ |

### Compliance Features

**📋 Audit Trail:**
- Complete deployment history
- Change tracking with git commits
- Approval workflows for production
- Comprehensive logging

**🔐 Access Control:**
- Environment-based permissions
- Required reviews for critical changes
- Secret management best practices
- Principle of least privilege

## 🛠️ Maintenance and Operations

### Regular Maintenance Tasks

**📅 Weekly:**
- [ ] Review dependency updates
- [ ] Check security audit results
- [ ] Monitor pipeline performance
- [ ] Clean up old artifacts

**📅 Monthly:**
- [ ] Update base images and actions
- [ ] Review and optimize cache strategies
- [ ] Analyze deployment metrics
- [ ] Update documentation

**📅 Quarterly:**
- [ ] Security architecture review
- [ ] Performance optimization audit
- [ ] Tool and service evaluation
- [ ] Disaster recovery testing

## 💡 Best Practices

### Development Workflow

**🔄 Branch Strategy:**
```
main (production)
├── develop (staging)
├── feature/new-feature
├── hotfix/critical-fix
└── release/v1.2.0
```

**✅ Pull Request Requirements:**
- [ ] All CI checks pass
- [ ] Code review by 2+ developers
- [ ] Test coverage maintained
- [ ] Documentation updated

### Deployment Strategy

**🚀 Release Strategy:**
- **Feature Releases**: Staged deployment via develop → main
- **Hotfixes**: Direct to main with immediate deployment
- **Major Releases**: Coordinated deployment with notifications

**📋 Pre-deployment Checklist:**
- [ ] All tests passing in CI
- [ ] Staging environment validated
- [ ] Database migrations tested
- [ ] Rollback plan prepared
- [ ] Team notifications sent

## 📚 Additional Resources

### Documentation Links
- [Vercel Deployment Guide](https://vercel.com/docs/deployments)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Turborepo Documentation](https://turbo.build/repo/docs)

### Support Channels
- **Primary**: Slack `#dev-ops`
- **Emergency**: Slack `#incidents`
- **Questions**: GitHub Discussions
- **Issues**: GitHub Issues

### Contributing to CI/CD

When modifying the pipeline:

1. **Fork and Test**: Test changes in a fork repository first
2. **Documentation**: Update this guide with any changes
3. **Review Process**: Get team approval for significant changes
4. **Gradual Rollout**: Implement changes incrementally
5. **Monitoring**: Watch for issues after changes

---

**📞 Need Help?**
- Check this documentation first
- Search existing GitHub issues
- Ask in `#dev-ops` Slack channel
- Create a GitHub issue for bugs
- Use emergency procedures for critical issues

*Pipeline optimized for Next.js 15 + Supabase + Vercel deployment*