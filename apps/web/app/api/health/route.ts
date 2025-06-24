/**
 * GET /api/health
 * Health check endpoint for monitoring and deployment verification
 */

import { NextRequest } from 'next/server'
import { 
  checkDatabaseConnection,
  type ApiResponse,
} from '@nutricoach/core-nutrition'
import { 
  withApiHandler,
  createApiResponse,
  handleOptions,
} from '../../../lib/api-helpers'
import { createServerSupabaseClient } from '../../../lib/supabase'

interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy'
  timestamp: string
  version: string
  environment: string
  services: {
    database: 'connected' | 'disconnected'
    api: 'operational'
  }
  uptime: number
}

export async function OPTIONS() {
  return handleOptions()
}

export const GET = withApiHandler<HealthCheckResponse>(
  async (request: NextRequest) => {
    const startTime = Date.now()
    
    // Check database connection
    const supabase = await createServerSupabaseClient()
    const isDatabaseConnected = await checkDatabaseConnection(supabase)
    
    // Determine overall health status
    const isHealthy = isDatabaseConnected
    
    const healthData: HealthCheckResponse = {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '0.1.0',
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: isDatabaseConnected ? 'connected' : 'disconnected',
        api: 'operational',
      },
      uptime: process.uptime(),
    }
    
    const responseTime = Date.now() - startTime
    
    return createApiResponse(healthData, {
      status: isHealthy ? 200 : 503,
      meta: {
        action: 'health_check',
        responseTime,
      },
    })
  }
)