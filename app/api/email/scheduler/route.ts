import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/lib/email/service';
import { emailWorkflowEngine } from '@/lib/email/workflows';

export async function POST(request: NextRequest) {
  try {
    // Verify this is an internal call or has proper authorization
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.SCHEDULER_TOKEN || 'default-scheduler-token';
    
    if (authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const { action } = await request.json();

    let result;

    switch (action) {
      case 'process_queue':
        result = await emailService.processEmailQueue();
        break;
      
      case 'process_workflows':
        result = await emailWorkflowEngine.processScheduledWorkflows();
        break;
      
      case 'both':
        const queueResult = await emailService.processEmailQueue();
        const workflowResult = await emailWorkflowEngine.processScheduledWorkflows();
        
        result = {
          success: queueResult.success && workflowResult.success,
          queue: queueResult,
          workflows: workflowResult
        };
        break;
      
      default:
        return NextResponse.json(
          { error: 'Action non supportée. Utilisez: process_queue, process_workflows, ou both' },
          { status: 400 }
        );
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Email scheduler error:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET(request: NextRequest) {
  try {
    // Simple health check
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        email_service: 'operational',
        workflow_engine: 'operational'
      }
    });
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}