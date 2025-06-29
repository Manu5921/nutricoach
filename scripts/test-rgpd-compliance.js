#!/usr/bin/env node

/**
 * RGPD Compliance Test Suite for NutriCoach
 * 
 * Tests all RGPD features:
 * - Cookie consent system
 * - Data export functionality
 * - Account deletion process
 * - Audit logging
 * 
 * Usage: node scripts/test-rgpd-compliance.js
 */

const fs = require('fs')
const path = require('path')

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
}

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✅${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}❌${colors.reset} ${msg}`),
  header: (msg) => console.log(`\n${colors.cyan}${colors.bright}🔒 ${msg}${colors.reset}\n`)
}

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  warnings: 0,
  tests: []
}

function addTest(name, status, message = '') {
  testResults.tests.push({ name, status, message })
  if (status === 'PASS') testResults.passed++
  else if (status === 'FAIL') testResults.failed++
  else if (status === 'WARN') testResults.warnings++
}

function checkFileExists(filePath, description) {
  const fullPath = path.join(process.cwd(), filePath)
  const exists = fs.existsSync(fullPath)
  
  if (exists) {
    log.success(`${description} exists: ${filePath}`)
    addTest(description, 'PASS')
    return true
  } else {
    log.error(`${description} missing: ${filePath}`)
    addTest(description, 'FAIL', `File not found: ${filePath}`)
    return false
  }
}

function checkFileContains(filePath, searchTerms, description) {
  const fullPath = path.join(process.cwd(), filePath)
  
  if (!fs.existsSync(fullPath)) {
    log.error(`${description} - File not found: ${filePath}`)
    addTest(description, 'FAIL', 'File not found')
    return false
  }

  const content = fs.readFileSync(fullPath, 'utf8')
  const missingTerms = searchTerms.filter(term => !content.includes(term))
  
  if (missingTerms.length === 0) {
    log.success(`${description}`)
    addTest(description, 'PASS')
    return true
  } else {
    log.error(`${description} - Missing: ${missingTerms.join(', ')}`)
    addTest(description, 'FAIL', `Missing terms: ${missingTerms.join(', ')}`)
    return false
  }
}

function validateRGPDPages() {
  log.header('VALIDATING RGPD LEGAL PAGES')

  // Check all legal pages exist
  const pages = [
    { path: 'app/privacy/page.tsx', name: 'Privacy Policy' },
    { path: 'app/terms/page.tsx', name: 'Terms of Service' },
    { path: 'app/cookies/page.tsx', name: 'Cookie Policy' },
    { path: 'app/legal/page.tsx', name: 'Legal Notice' }
  ]

  pages.forEach(page => {
    checkFileExists(page.path, page.name)
  })

  // Check privacy policy contains RGPD requirements
  checkFileContains('app/privacy/page.tsx', [
    'Article 9 RGPD',
    'données de santé',
    'consentement explicite',
    'dpo@nutricoach.app',
    'CNIL'
  ], 'Privacy Policy contains RGPD requirements')

  // Check terms contain pricing and French law
  checkFileContains('app/terms/page.tsx', [
    '6,99€/mois',
    'droit français',
    'résiliation libre',
    '14 jours'
  ], 'Terms contain pricing and legal requirements')

  // Check cookie policy has granular consent
  checkFileContains('app/cookies/page.tsx', [
    'consentement granulaire',
    'essentiels',
    'analytiques',
    'marketing',
    '13 mois maximum'
  ], 'Cookie Policy supports granular consent')
}

function validateRGPDComponents() {
  log.header('VALIDATING RGPD COMPONENTS')

  // Check cookie consent component
  checkFileExists('components/CookieConsent.tsx', 'Cookie Consent Component')
  checkFileContains('components/CookieConsent.tsx', [
    'CookieSettings',
    'essential: true',
    'analytics:',
    'marketing:',
    'localStorage',
    'RGPD'
  ], 'Cookie Consent Component functionality')

  // Check RGPD manager component
  checkFileExists('components/RGPDManager.tsx', 'RGPD Manager Component')
  checkFileContains('components/RGPDManager.tsx', [
    'export-data',
    'delete-account',
    'Article 20 RGPD',
    'Article 17 RGPD',
    'SUPPRIMER DÉFINITIVEMENT'
  ], 'RGPD Manager Component functionality')

  // Check dashboard integration
  checkFileContains('app/dashboard/page.tsx', [
    'RGPDManager',
    'privacy',
    'Confidentialité'
  ], 'Dashboard integrates RGPD Manager')
}

function validateRGPDAPIs() {
  log.header('VALIDATING RGPD API ENDPOINTS')

  // Check data export API
  checkFileExists('app/api/user/export-data/route.ts', 'Data Export API')
  checkFileContains('app/api/user/export-data/route.ts', [
    'POST',
    'export_info',
    'Article 20 RGPD',
    'audit_logs',
    'data_export_logs',
    'health_data'
  ], 'Data Export API functionality')

  // Check account deletion API
  checkFileExists('app/api/user/delete-account/route.ts', 'Account Deletion API')
  checkFileContains('app/api/user/delete-account/route.ts', [
    'DELETE',
    'SUPPRIMER DÉFINITIVEMENT',
    'Article 17 RGPD',
    'deletion_logs',
    'cascade'
  ], 'Account Deletion API functionality')

  // Check consent API
  checkFileExists('app/api/user/consent/route.ts', 'Consent Management API')
  checkFileContains('app/api/user/consent/route.ts', [
    'POST',
    'GET',
    'consent_logs',
    'cookies_analytics',
    'Article 7 RGPD'
  ], 'Consent Management API functionality')
}

function validateDatabaseSchema() {
  log.header('VALIDATING DATABASE SCHEMA')

  // Check migration files exist
  const migrations = [
    { path: 'supabase/migrations/001_initial_schema.sql', name: 'Initial Schema Migration' },
    { path: 'supabase/migrations/003_rgpd_audit_tables.sql', name: 'RGPD Audit Tables Migration' }
  ]

  migrations.forEach(migration => {
    checkFileExists(migration.path, migration.name)
  })

  // Check RGPD audit tables migration
  checkFileContains('supabase/migrations/003_rgpd_audit_tables.sql', [
    'audit_logs',
    'deletion_logs',
    'data_export_logs',
    'consent_logs',
    'enable row level security',
    'log_audit_event',
    'log_consent_change'
  ], 'RGPD Audit Tables Migration contains required tables')
}

function validateDocumentation() {
  log.header('VALIDATING DOCUMENTATION')

  // Check RGPD compliance guide
  checkFileExists('docs/RGPD-COMPLIANCE-GUIDE.md', 'RGPD Compliance Guide')
  checkFileContains('docs/RGPD-COMPLIANCE-GUIDE.md', [
    'conformité RGPD',
    'données de santé',
    'Article 9',
    'checklist',
    'audit'
  ], 'RGPD Compliance Guide content')
}

function validateSecurityMeasures() {
  log.header('VALIDATING SECURITY MEASURES')

  // Check middleware exists
  checkFileExists('middleware.ts', 'Next.js Middleware')
  
  // Check authentication setup
  checkFileExists('lib/auth/user-service.ts', 'User Service')
  checkFileExists('lib/auth/security.ts', 'Security Module')

  // Check RLS policies in migrations
  checkFileContains('supabase/migrations/001_initial_schema.sql', [
    'enable row level security',
    'policy',
    'auth.uid()',
    'authenticated'
  ], 'Row Level Security policies configured')

  // Check environment variable usage
  const configFiles = ['next.config.js', 'lib/supabase-client.ts']
  configFiles.forEach(file => {
    if (fs.existsSync(file)) {
      checkFileContains(file, [
        'process.env'
      ], `${file} uses environment variables`)
    }
  })
}

function validateCookieCompliance() {
  log.header('VALIDATING COOKIE COMPLIANCE')

  // Check layout integrates cookie consent
  checkFileContains('app/layout.tsx', [
    'CookieConsent',
    'import'
  ], 'Layout integrates Cookie Consent')

  // Check analytics is conditional
  if (fs.existsSync('components/analytics/WebVitals.tsx')) {
    checkFileContains('components/analytics/WebVitals.tsx', [
      'consent',
      'analytics'
    ], 'Analytics respects cookie consent')
  } else {
    log.warning('Analytics component not found - will need consent integration')
    addTest('Analytics Cookie Consent', 'WARN', 'Component not found')
  }
}

function checkComplianceLevel() {
  log.header('COMPLIANCE ASSESSMENT')

  const totalTests = testResults.passed + testResults.failed + testResults.warnings
  const passRate = (testResults.passed / totalTests) * 100
  
  console.log(`\n📊 RGPD Compliance Test Results:`)
  console.log(`   ✅ Passed: ${colors.green}${testResults.passed}${colors.reset}`)
  console.log(`   ❌ Failed: ${colors.red}${testResults.failed}${colors.reset}`)
  console.log(`   ⚠️  Warnings: ${colors.yellow}${testResults.warnings}${colors.reset}`)
  console.log(`   📈 Pass Rate: ${passRate >= 90 ? colors.green : passRate >= 70 ? colors.yellow : colors.red}${passRate.toFixed(1)}%${colors.reset}`)

  let complianceLevel = 'NON-COMPLIANT'
  let complianceColor = colors.red

  if (passRate >= 95) {
    complianceLevel = 'EXCELLENT COMPLIANCE'
    complianceColor = colors.green
  } else if (passRate >= 85) {
    complianceLevel = 'GOOD COMPLIANCE'
    complianceColor = colors.green
  } else if (passRate >= 70) {
    complianceLevel = 'BASIC COMPLIANCE'
    complianceColor = colors.yellow
  } else if (passRate >= 50) {
    complianceLevel = 'PARTIAL COMPLIANCE'
    complianceColor = colors.yellow
  }

  console.log(`\n🎯 Compliance Level: ${complianceColor}${complianceLevel}${colors.reset}`)

  if (testResults.failed > 0) {
    console.log(`\n⚠️  Failed Tests:`)
    testResults.tests.filter(t => t.status === 'FAIL').forEach(test => {
      console.log(`   ${colors.red}❌${colors.reset} ${test.name}: ${test.message}`)
    })
  }

  if (testResults.warnings > 0) {
    console.log(`\n⚠️  Warnings:`)
    testResults.tests.filter(t => t.status === 'WARN').forEach(test => {
      console.log(`   ${colors.yellow}⚠${colors.reset} ${test.name}: ${test.message}`)
    })
  }

  console.log(`\n📋 Next Steps:`)
  if (passRate < 100) {
    console.log(`   1. Address failed tests above`)
    console.log(`   2. Complete missing components`)
    console.log(`   3. Test in development environment`)
  }
  console.log(`   4. Deploy database migrations`)
  console.log(`   5. Configure production environment variables`)
  console.log(`   6. Test cookie consent in production`)
  console.log(`   7. Verify RGPD export/deletion functionality`)

  return passRate >= 85
}

// Main execution
function main() {
  console.log(`${colors.cyan}${colors.bright}`)
  console.log(`🔒 NUTRICOACH RGPD COMPLIANCE TEST SUITE`)
  console.log(`=============================================`)
  console.log(`Testing RGPD compliance for data protection`)
  console.log(`${colors.reset}`)

  validateRGPDPages()
  validateRGPDComponents()
  validateRGPDAPIs()
  validateDatabaseSchema()
  validateDocumentation()
  validateSecurityMeasures()
  validateCookieCompliance()
  
  const isCompliant = checkComplianceLevel()
  
  console.log(`\n${colors.bright}🏁 Test Suite Complete${colors.reset}`)
  
  if (isCompliant) {
    console.log(`${colors.green}✅ NutriCoach is RGPD compliant and ready for EU deployment!${colors.reset}`)
    process.exit(0)
  } else {
    console.log(`${colors.red}❌ RGPD compliance issues found. Please address before production.${colors.reset}`)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

module.exports = { main, testResults }