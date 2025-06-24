# 🔐 GitHub Environments Security Architecture

Complete GitHub environments configuration for NutriCoach with maximum security and isolation between staging and production.

## 🏗️ Architecture Overview

This directory contains the complete GitHub environments setup for NutriCoach, implementing a multi-layered security architecture with:

- **4 Isolated Environments** with different security levels
- **Comprehensive Secret Management** with environment isolation
- **Automated Security Workflows** with multiple scanning tools
- **Compliance Monitoring** for GDPR, CCPA, and SOC2
- **Incident Response** automation

## 📁 Files Structure

```
.github/environments/
├── README.md                    # This file
├── environment-setup.sh         # Automated setup script
├── staging.yml                 # Staging environment config
├── production.yml              # Production environment config
├── staging-db.yml              # Staging database config
├── production-db.yml           # Production database config (ultra-secure)
└── secrets-template.md         # Generated secrets template
```

## 🌐 Environment Configurations

### 1. Staging Environment (`staging.yml`)
- **Purpose**: Development testing and validation
- **Auto-deploy**: From `develop` branch
- **Approval**: None required
- **Wait time**: 5 minutes
- **Protection**: Basic security checks

### 2. Production Environment (`production.yml`)
- **Purpose**: Live application serving users
- **Auto-deploy**: None (manual only)
- **Approval**: 2 reviewers required (DevOps + Senior Dev)
- **Wait time**: 30 minutes
- **Protection**: Maximum security controls

### 3. Staging Database (`staging-db.yml`)
- **Purpose**: Database schema and migration testing
- **Auto-deploy**: From `develop` branch
- **Approval**: None required
- **Wait time**: 2 minutes
- **Protection**: Migration safety checks

### 4. Production Database (`production-db.yml`)
- **Purpose**: Production data operations
- **Auto-deploy**: None (manual only)
- **Approval**: 3 reviewers required (DBA + Security + DevOps)
- **Wait time**: 60 minutes
- **Protection**: Ultra-secure with mandatory approvals

## 🚀 Quick Setup

### Prerequisites

1. **GitHub CLI** installed and authenticated
2. **Repository admin access**
3. **Organization admin access** (for team creation)

### Automated Setup

Run the setup script to automatically configure all environments:

```bash
# Make the script executable
chmod +x .github/environments/environment-setup.sh

# Run the setup
./.github/environments/environment-setup.sh
```

The script will:
1. ✅ Create GitHub teams
2. ✅ Create environments with protection rules
3. ✅ Set up branch protection
4. ✅ Generate secrets template
5. ✅ Validate the setup

### Manual Setup

If you prefer manual setup, follow these steps:

#### 1. Create GitHub Teams

Create the following teams in your GitHub organization:

- `devops-team`: Infrastructure and deployment management
- `database-admin-team`: Database operations and migrations
- `security-team`: Security reviews and compliance
- `senior-developers`: Code and architecture reviews
- `senior-devops-team`: Senior DevOps approval authority

#### 2. Create Environments

Go to your repository **Settings** → **Environments** and create:

1. **staging** - Use `staging.yml` configuration
2. **production** - Use `production.yml` configuration
3. **staging-db** - Use `staging-db.yml` configuration
4. **production-db** - Use `production-db.yml` configuration

#### 3. Configure Protection Rules

For each environment, set up the protection rules as specified in the YAML files:

- Required reviewers
- Wait timers
- Deployment branch policies
- Required status checks

## 🔐 Secrets Configuration

### Repository Secrets (Shared)

Configure these secrets at the repository level:

```
VERCEL_ORG_ID
SUPABASE_ACCESS_TOKEN
SLACK_WEBHOOK_URL
PAGER_DUTY_SERVICE_KEY
```

### Environment-Specific Secrets

Configure secrets for each environment following the patterns in `secrets-template.md`:

#### Staging Environment
- All staging secrets end with `_STAGING`
- Use test/development API keys
- Lower security requirements

#### Production Environment
- All production secrets end with `_PRODUCTION`
- Use live API keys
- Maximum security requirements

#### Database Environments
- Database-specific secrets for operations
- Backup and restore tokens
- Monitoring and audit tokens

## 🔒 Security Workflows

The security workflow (`.github/workflows/security-checks.yml`) includes:

### 1. Secret Detection
- **TruffleHog**: Historical secret scanning
- **GitLeaks**: Real-time secret detection
- **Custom validation**: Environment secret verification
- **Hardcoded secrets**: Source code analysis

### 2. Dependency Security
- **NPM Audit**: Vulnerability assessment
- **Snyk**: Advanced dependency analysis
- **Trivy**: Comprehensive vulnerability detection
- **OSSAR**: Microsoft security scanning

### 3. Code Security Analysis
- **CodeQL**: GitHub's semantic code analysis
- **Semgrep**: Rule-based security scanning
- **ESLint Security**: JavaScript-specific security rules

### 4. Infrastructure Security
- **Terraform Security**: Infrastructure as code scanning
- **GitHub Actions Security**: Workflow configuration validation
- **Container Security**: Docker image vulnerability scanning

### 5. Database Security
- **SQL Analysis**: Migration safety validation
- **Supabase Security**: RLS policy verification
- **Schema Validation**: Database structure integrity

### 6. API Security Testing
- **OWASP ZAP**: Web application security testing
- **Endpoint Validation**: API security verification
- **Authentication Testing**: Security mechanism validation

### 7. Compliance Validation
- **GDPR Compliance**: Privacy regulation validation
- **Security Headers**: HTTP security configuration
- **Documentation**: Compliance documentation requirements

## 📊 Monitoring & Alerts

### Security Metrics

The system tracks:
- **Secret Exposure Rate**: 0 per month target
- **Vulnerability Resolution Time**: < 24 hours
- **Security Scan Coverage**: 100%
- **Failed Authentication Attempts**: Daily monitoring
- **Deployment Security Score**: > 95%

### Alert Channels

#### Critical Alerts (Immediate Response)
- 🚨 PagerDuty escalation
- 🚨 Slack #security-incidents
- 🚨 Email to security team
- 🚨 SMS to on-call personnel

#### Warning Alerts (24-hour Response)
- ⚠️ Slack #security-alerts
- ⚠️ Email to development team

#### Info Alerts (Weekly Review)
- ℹ️ Security scan reports
- ℹ️ Compliance summaries

## 🔧 Customization

### Adding New Environments

1. Create new YAML configuration file
2. Update `environment-setup.sh` script
3. Add environment-specific secrets
4. Update security workflows if needed

### Modifying Security Rules

1. Update `.gitleaks.toml` for secret detection
2. Modify `.eslintrc.security.js` for code analysis
3. Adjust `.zap/rules.tsv` for API security testing
4. Update workflow YAML for new checks

### Team Configuration

Modify the teams array in `environment-setup.sh`:

```bash
teams=(
    "your-team:Your Team Name:Team description"
    # Add more teams as needed
)
```

## 🚨 Incident Response

### Automatic Responses

The system automatically:
1. **Creates security issues** for failed scans
2. **Notifies security team** via multiple channels
3. **Blocks deployments** with security violations
4. **Generates security reports** for all scans

### Manual Response Procedures

Follow the incident response procedures in `docs/SECURITY-GUIDE.md`:

1. **Severity 1 (Critical)**: < 15 minutes response
2. **Severity 2 (High)**: < 1 hour response
3. **Severity 3 (Medium)**: < 4 hours response
4. **Severity 4 (Low)**: < 24 hours response

## 📚 Documentation

### Essential Reading

- `docs/SECURITY-GUIDE.md`: Complete security documentation
- `docs/CI-CD-GUIDE.md`: Deployment procedures
- `.github/workflows/security-checks.yml`: Security workflow details

### Configuration Files

- `.gitleaks.toml`: Secret detection configuration
- `.eslintrc.security.js`: Code security rules
- `.zap/rules.tsv`: API security testing rules

## 🔄 Maintenance

### Regular Tasks

#### Weekly
- Review security scan results
- Update vulnerability databases
- Check secret rotation schedules

#### Monthly
- Review and update security rules
- Validate team permissions
- Update documentation

#### Quarterly
- Full security architecture review
- Compliance audit
- Incident response drill

### Updates

Keep the following up to date:
- GitHub Actions versions
- Security tool versions
- Rule configurations
- Team memberships

## 🆘 Support

### Internal Contacts
- **Security Team**: security@nutricoach.com
- **DevOps Team**: devops@nutricoach.com
- **Database Team**: database@nutricoach.com

### Emergency Contacts
- **Security Hotline**: +1-555-SECURITY
- **DevOps On-call**: +1-555-DEVOPS
- **Incident Commander**: +1-555-INCIDENT

### External Resources
- [GitHub Security Best Practices](https://docs.github.com/en/code-security)
- [OWASP Security Guidelines](https://owasp.org/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)

---

**🔐 Security is everyone's responsibility. When in doubt, ask the security team.**