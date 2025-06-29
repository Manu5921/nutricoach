import * as Sentry from '@sentry/nextjs';

export function initSentry() {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || 'https://1308e4009f86d89c058926d210bd4706@o4509553369022464.ingest.de.sentry.io/4509583095234640',
    environment: process.env.NODE_ENV || 'development',
    debug: process.env.NODE_ENV === 'development',
    
    // Performance monitoring
    tracesSampleRate: 0.1,
    
    // Error filtering
    beforeSend(event, hint) {
      // Log deployment errors
      if (event.tags?.deployment === 'railway') {
        console.log('Railway Deployment Error:', event);
      }
      return event;
    },
    
    // Custom tags for Railway deployment tracking
    initialScope: {
      tags: {
        deployment: 'railway',
        platform: 'nutricoach'
      }
    }
  });
}

// Helper to track Railway deployment issues
export function trackRailwayError(error: Error, context?: Record<string, any>) {
  Sentry.withScope((scope) => {
    scope.setTag('error_type', 'railway_deployment');
    scope.setTag('dockerfile_issue', 'npm_ci_production');
    if (context) {
      scope.setContext('deployment_context', context);
    }
    Sentry.captureException(error);
  });
}

// Track build errors specifically
export function trackBuildError(stage: string, command: string, error: string) {
  Sentry.addBreadcrumb({
    message: `Build failed at ${stage}`,
    category: 'deployment',
    level: 'error',
    data: {
      stage,
      command,
      error
    }
  });
  
  Sentry.captureMessage(`Railway Build Error: ${stage} - ${command}`, 'error');
}