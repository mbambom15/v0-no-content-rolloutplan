import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { generateRolloutPlan, type RolloutPlanRequest } from '@/lib/rollout-plan'

export async function POST(request: NextRequest) {
  try {
    const body: RolloutPlanRequest = await request.json()
    
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
    
    // Create workbook
    const workbook = XLSX.utils.book_new()
    
    // Sheet 1: Overview
    const overviewData = [
      ['Roll-out Plan Overview'],
      [''],
      ['Qualification', plan.qualification_name],
      ['Deal Start Date', plan.deal_start_date],
      ['Deal End Date', plan.deal_end_date],
      ['Induction Date', plan.induction_date],
      ['First Contact Session', plan.first_contact_session],
      ['Total Sessions', plan.total_sessions],
      ['Total Credits', plan.total_credits],
      ['Total Hours', plan.total_hours],
      ['Sessions per Month', plan.sessions_per_month],
      ['Working Hours per Day', plan.working_hours_per_day],
    ]
    const overviewSheet = XLSX.utils.aoa_to_sheet(overviewData)
    overviewSheet['!cols'] = [{ wch: 25 }, { wch: 40 }]
    XLSX.utils.book_append_sheet(workbook, overviewSheet, 'Overview')
    
    // Sheet 2: Session Schedule
    const sessionData = [
      ['Session #', 'Date', 'Unit Standards'],
      ...plan.session_schedule.map(s => [
        s.session_number,
        s.date,
        s.unit_standards.join(', ')
      ])
    ]
    const sessionSheet = XLSX.utils.aoa_to_sheet(sessionData)
    sessionSheet['!cols'] = [{ wch: 12 }, { wch: 15 }, { wch: 50 }]
    XLSX.utils.book_append_sheet(workbook, sessionSheet, 'Session Schedule')
    
    // Sheet 3: Unit Standards Detail
    const usData = [
      ['Session #', 'US ID', 'Title', 'Credits', 'Type', 'Module', 'Contact Date', 'Submission Date', 'Days', 'Hours', 'Theory %', 'Logbook %'],
      ...plan.unit_standards.map(us => [
        us.session_number,
        us.id,
        us.title,
        us.credits,
        us.type,
        us.module,
        us.contact_session_date,
        us.submission_date,
        us.days_for_completion,
        us.total_hours,
        us.theory_percentage,
        us.logbook_percentage
      ])
    ]
    const usSheet = XLSX.utils.aoa_to_sheet(usData)
    usSheet['!cols'] = [
      { wch: 10 }, { wch: 10 }, { wch: 50 }, { wch: 8 }, { wch: 12 },
      { wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 6 }, { wch: 8 },
      { wch: 10 }, { wch: 10 }
    ]
    XLSX.utils.book_append_sheet(workbook, usSheet, 'Unit Standards')
    
    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
    
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="rollout_plan_${plan.qualification_name.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx"`,
      },
    })
  } catch (error) {
    console.error('Error exporting Excel:', error)
    return NextResponse.json(
      { error: 'Failed to export Excel file' },
      { status: 500 }
    )
  }
}
