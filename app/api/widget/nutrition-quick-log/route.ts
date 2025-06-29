import { NextRequest, NextResponse } from 'next/server'
import { generateWidgetData } from '@/components/mobile/WidgetComponents'

// GET /api/widget/nutrition-quick-log
export async function GET(request: NextRequest) {
  try {
    // Generate mock data for widget
    // In production, this would fetch real user data
    const widgetData = generateWidgetData.nutritionLog()
    
    // Return data optimized for widget consumption
    const response = {
      success: true,
      data: widgetData,
      lastUpdated: new Date().toISOString(),
      cacheMaxAge: 300 // 5 minutes
    }

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    })

  } catch (error) {
    console.error('Widget API error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to generate widget data',
        data: {
          type: 'nutrition-log',
          caloriesConsumed: 0,
          caloriesGoal: 2000,
          lastMeal: 'Aucun repas enregistré'
        }
      },
      { status: 500 }
    )
  }
}

// POST /api/widget/nutrition-quick-log (for quick logging from widget)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request
    if (!body.calories || typeof body.calories !== 'number') {
      return NextResponse.json(
        { success: false, error: 'Invalid calories value' },
        { status: 400 }
      )
    }

    // In production, save to database
    // For now, just acknowledge the data
    const logEntry = {
      id: `log_${Date.now()}`,
      calories: body.calories,
      meal: body.meal || 'Collation',
      timestamp: new Date().toISOString(),
      source: 'widget'
    }

    console.log('Widget nutrition log:', logEntry)

    // Return updated widget data
    const updatedData = generateWidgetData.nutritionLog()
    updatedData.caloriesConsumed += body.calories
    updatedData.lastMeal = body.meal || 'Repas ajouté'

    return NextResponse.json({
      success: true,
      message: 'Nutrition log added successfully',
      data: updatedData
    })

  } catch (error) {
    console.error('Widget POST error:', error)
    
    return NextResponse.json(
      { success: false, error: 'Failed to log nutrition data' },
      { status: 500 }
    )
  }
}