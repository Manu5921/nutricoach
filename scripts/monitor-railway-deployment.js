#!/usr/bin/env node

/**
 * Railway Deployment Monitor avec Sentry
 * Surveille les erreurs de déploiement et les reporte à Sentry
 */

const { trackRailwayError, trackBuildError, initSentry } = require('../lib/sentry');

// Initialize Sentry
initSentry();

console.log('🚀 Monitoring Railway deployment for NutriCoach...');

// Simuler le monitoring de l'erreur actuelle
const currentError = new Error('npm ci --only=production --silent failed with exit code 1');
currentError.stack = `
Docker build error:
✕ [4/6] RUN npm ci --only=production --silent 
process "/bin/sh -c npm ci --only=production --silent" did not complete successfully: exit code 1

Dockerfile:10
-------------------
8 |
9 |     # Install dependencies
10 | >>> RUN npm ci --only=production --silent
11 |
12 |     # Copy source code
-------------------
`;

// Track l'erreur avec contexte
trackRailwayError(currentError, {
  dockerfile_path: 'Dockerfile',
  railway_config: 'railway.json',
  npm_command: 'npm ci --only=production --silent',
  build_stage: 'dependencies_installation',
  attempted_fixes: [
    'Moved TypeScript types to devDependencies',
    'Created Dockerfile.new',
    'Removed nixpacks.toml',
    'Updated railway.json configuration',
    'Forced cache bust v5.0'
  ],
  persistent_issue: true,
  error_count: 10
});

// Track les détails du build
trackBuildError(
  'dependencies_installation', 
  'npm ci --only=production --silent',
  'Railway continues using old Dockerfile with --only=production despite our fixes'
);

console.log('📊 Error reported to Sentry: https://manucl.sentry.io/issues/');
console.log('🔍 SENTRY_DSN: https://1308e4009f86d89c058926d210bd4706@o4509553369022464.ingest.de.sentry.io/4509583095234640');

// Suggestions d'analyse
console.log('\n🔧 Next steps:');
console.log('1. Check Sentry dashboard for error details');
console.log('2. Review Railway cache behavior');
console.log('3. Consider Vercel deployment as alternative');
console.log('4. Verify Railway is using latest commit');