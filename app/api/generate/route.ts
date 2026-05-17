import { NextRequest, NextResponse } from 'next/server'
import { generateRolloutPlan, type RolloutPlanRequest } from '@/lib/rollout-plan'

export async function POST(request: NextRequest) {
  try {
    const body: RolloutPlanRequest = await request.json()
    
    // Validate required fields
    if (!body.qualification_name || !body.deal_start_date || !body.induction_date) {
      return NextResponse.json(
        { error: 'Missing required fields: qualification_name, deal_start_date, induction_date' },
        { status: 400 }
      )
    }

    // Set defaults
    const requestWithDefaults: RolloutPlanRequest = {
      qualification_name: body.qualification_name,
      deal_start_date: body.deal_start_date,
      induction_date: body.induction_date,
      sessions_per_month: body.sessions_per_month ?? 2,
      working_hours_per_day: body.working_hours_per_day ?? 8,
      group_by_module: body.group_by_module ?? true,
      custom_unit_standards: body.custom_unit_standards ?? null,
    }

    const plan = generateRolloutPlan(requestWithDefaults)
    return NextResponse.json(plan)
  } catch (error) {
    console.error('Error generating rollout plan:', error)
    return NextResponse.json(
      { error: 'Failed to generate rollout plan' },
      { status: 500 }
    )
  }
}
