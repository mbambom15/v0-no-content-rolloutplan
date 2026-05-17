import { NextRequest, NextResponse } from 'next/server'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
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
    
    // Create PDF
    const doc = new jsPDF()
    
    // Title
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text('Roll-out Plan', 105, 20, { align: 'center' })
    
    doc.setFontSize(14)
    doc.setFont('helvetica', 'normal')
    doc.text(plan.qualification_name, 105, 30, { align: 'center' })
    
    // Overview section
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Overview', 14, 45)
    
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    const overviewData = [
      ['Deal Start Date', plan.deal_start_date],
      ['Deal End Date', plan.deal_end_date],
      ['Induction Date', plan.induction_date],
      ['First Contact Session', plan.first_contact_session],
      ['Total Sessions', plan.total_sessions.toString()],
      ['Total Credits', plan.total_credits.toString()],
      ['Total Hours', plan.total_hours.toString()],
    ]
    
    autoTable(doc, {
      startY: 50,
      head: [],
      body: overviewData,
      theme: 'grid',
      styles: { fontSize: 9 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 50 },
        1: { cellWidth: 50 },
      },
    })
    
    // Session Schedule
    const currentY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Session Schedule', 14, currentY)
    
    const sessionTableData = plan.session_schedule.slice(0, 12).map(s => [
      s.session_number.toString(),
      s.date,
      s.unit_standards.join(', ')
    ])
    
    autoTable(doc, {
      startY: currentY + 5,
      head: [['Session', 'Date', 'Unit Standards']],
      body: sessionTableData,
      theme: 'striped',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [20, 184, 166] },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 30 },
        2: { cellWidth: 130 },
      },
    })
    
    // New page for Unit Standards
    doc.addPage()
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Unit Standards Schedule', 105, 20, { align: 'center' })
    
    const usTableData = plan.unit_standards.map(us => [
      us.session_number.toString(),
      us.id,
      us.title.substring(0, 40) + (us.title.length > 40 ? '...' : ''),
      us.credits.toString(),
      us.contact_session_date,
      us.submission_date,
    ])
    
    autoTable(doc, {
      startY: 30,
      head: [['Sess', 'ID', 'Title', 'Cr', 'Contact', 'Submission']],
      body: usTableData,
      theme: 'striped',
      styles: { fontSize: 7 },
      headStyles: { fillColor: [20, 184, 166] },
      columnStyles: {
        0: { cellWidth: 12 },
        1: { cellWidth: 18 },
        2: { cellWidth: 70 },
        3: { cellWidth: 10 },
        4: { cellWidth: 25 },
        5: { cellWidth: 25 },
      },
    })
    
    // Generate buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))
    
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="rollout_plan_${plan.qualification_name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf"`,
      },
    })
  } catch (error) {
    console.error('Error exporting PDF:', error)
    return NextResponse.json(
      { error: 'Failed to export PDF file' },
      { status: 500 }
    )
  }
}
