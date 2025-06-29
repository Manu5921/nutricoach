import { NextRequest, NextResponse } from 'next/server'
import { generateWidgetData } from '@/components/mobile/WidgetComponents'

// GET /api/widget/daily-summary
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const date = url.searchParams.get('date') || new Date().toISOString().split('T')[0]
    
    // Generate mock data for widget
    // In production, this would fetch real user data for the specified date
    const widgetData = generateWidgetData.dailySummary()
    widgetData.date = new Date(date).toLocaleDateString('fr-FR')
    
    // Calculate completion percentage
    const completionPercentage = Math.round(
      (widgetData.calories / widgetData.goals.calories) * 100
    )
    
    // Add some insights
    const insights = generateInsights(widgetData)
    
    const response = {
      success: true,
      data: {
        ...widgetData,
        completionPercentage,
        insights
      },
      lastUpdated: new Date().toISOString(),
      cacheMaxAge: 600 // 10 minutes
    }

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=600, stale-while-revalidate=1200',
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    })

  } catch (error) {
    console.error('Daily summary widget API error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to generate daily summary',
        data: {
          type: 'daily-summary',
          date: new Date().toLocaleDateString('fr-FR'),
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          waterIntake: 0,
          goals: {
            calories: 2000,
            protein: 80,
            carbs: 200,
            fat: 60,
            water: 2.5
          }
        }
      },
      { status: 500 }
    )
  }
}

// Generate insights based on nutrition data
function generateInsights(data: any): string[] {
  const insights: string[] = []
  
  // Calorie insights
  const calorieProgress = (data.calories / data.goals.calories) * 100
  if (calorieProgress < 50) {
    insights.push('🍽️ Il vous reste beaucoup de calories à consommer')
  } else if (calorieProgress > 110) {
    insights.push('⚠️ Vous avez dépassé votre objectif calorique')
  } else if (calorieProgress >= 90) {
    insights.push('🎯 Excellent ! Vous approchez de votre objectif')
  }
  
  // Protein insights
  const proteinProgress = (data.protein / data.goals.protein) * 100
  if (proteinProgress < 60) {
    insights.push('💪 Pensez à ajouter plus de protéines')
  } else if (proteinProgress >= 100) {
    insights.push('💪 Objectif protéines atteint !')
  }
  
  // Hydration insights
  const waterProgress = (data.waterIntake / data.goals.water) * 100
  if (waterProgress < 50) {
    insights.push('💧 N\'oubliez pas de vous hydrater')
  } else if (waterProgress >= 100) {
    insights.push('💧 Excellente hydratation !')
  }
  
  // Macro balance insights
  const totalMacros = data.protein * 4 + data.carbs * 4 + data.fat * 9
  if (totalMacros > 0) {
    const proteinPercent = (data.protein * 4 / totalMacros) * 100
    const carbPercent = (data.carbs * 4 / totalMacros) * 100
    const fatPercent = (data.fat * 9 / totalMacros) * 100
    
    if (proteinPercent > 30) {
      insights.push('🥩 Régime riche en protéines')
    } else if (carbPercent > 60) {
      insights.push('🍞 Régime riche en glucides')
    } else if (fatPercent > 40) {
      insights.push('🥑 Régime riche en lipides')
    } else {
      insights.push('⚖️ Équilibre macro nutritionnel')
    }
  }
  
  // Time-based insights
  const currentHour = new Date().getHours()
  if (currentHour < 12 && calorieProgress < 20) {
    insights.push('🌅 N\'oubliez pas votre petit-déjeuner')
  } else if (currentHour >= 18 && calorieProgress < 70) {
    insights.push('🌆 Il est temps de prendre un bon dîner')
  }
  
  return insights.slice(0, 2) // Limit to 2 insights for widget space
}

// POST /api/widget/daily-summary (for quick updates)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request
    if (!body.type || !['water', 'quick-meal'].includes(body.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid update type' },
        { status: 400 }
      )
    }

    // Process different update types
    let message = ''
    switch (body.type) {
      case 'water':
        if (typeof body.amount !== 'number') {
          return NextResponse.json(
            { success: false, error: 'Invalid water amount' },
            { status: 400 }
          )
        }
        message = `${body.amount}L d'eau ajoutée`
        break
        
      case 'quick-meal':
        if (!body.calories || typeof body.calories !== 'number') {
          return NextResponse.json(
            { success: false, error: 'Invalid meal data' },
            { status: 400 }
          )
        }
        message = `Repas rapide ajouté (+${body.calories} cal)`
        break
    }

    // In production, update the database
    console.log('Widget daily summary update:', body)

    // Return updated data
    const updatedData = generateWidgetData.dailySummary()
    
    return NextResponse.json({
      success: true,
      message,
      data: updatedData
    })

  } catch (error) {
    console.error('Daily summary POST error:', error)
    
    return NextResponse.json(
      { success: false, error: 'Failed to update daily summary' },
      { status: 500 }
    )
  }
}