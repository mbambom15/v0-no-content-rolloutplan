// Default ITSS5 Unit Standards
export interface UnitStandard {
  id: string
  title: string
  credits: number
  type: "Core" | "Fundamental" | "Elective"
  module: string
  theory_percentage: number
  logbook_percentage: number
}

export const DEFAULT_UNIT_STANDARDS: UnitStandard[] = [
  // Module 1: Network Design Principles
  { id: "258877", title: "Demonstrate an understanding of the principles of network design", credits: 2, type: "Core", module: "Network Design Principles", theory_percentage: 30, logbook_percentage: 70 },
  { id: "258878", title: "Describe the basic architecture of a personal computer system", credits: 6, type: "Core", module: "Network Design Principles", theory_percentage: 30, logbook_percentage: 70 },
  
  // Module 2: Computer Operating Systems
  { id: "258879", title: "Install an operating system", credits: 5, type: "Core", module: "Computer Operating Systems", theory_percentage: 30, logbook_percentage: 70 },
  { id: "258880", title: "Configure a computer system", credits: 5, type: "Core", module: "Computer Operating Systems", theory_percentage: 30, logbook_percentage: 70 },
  { id: "258881", title: "Install and configure application software", credits: 4, type: "Core", module: "Computer Operating Systems", theory_percentage: 30, logbook_percentage: 70 },
  
  // Module 3: Systems Management
  { id: "258882", title: "Maintain computer equipment and environment", credits: 5, type: "Core", module: "Systems Management", theory_percentage: 30, logbook_percentage: 70 },
  { id: "258883", title: "Perform routine maintenance on computer hardware", credits: 4, type: "Core", module: "Systems Management", theory_percentage: 30, logbook_percentage: 70 },
  { id: "258884", title: "Perform data backup and recovery", credits: 3, type: "Core", module: "Systems Management", theory_percentage: 30, logbook_percentage: 70 },
  
  // Module 4: Business Research Skills
  { id: "258885", title: "Apply basic research skills in a business environment", credits: 5, type: "Fundamental", module: "Business Research Skills", theory_percentage: 30, logbook_percentage: 70 },
  { id: "258886", title: "Gather and analyse information for decision making", credits: 4, type: "Fundamental", module: "Business Research Skills", theory_percentage: 30, logbook_percentage: 70 },
  { id: "258887", title: "Write business documents", credits: 5, type: "Fundamental", module: "Business Research Skills", theory_percentage: 30, logbook_percentage: 70 },
  { id: "258888", title: "Present information in a business environment", credits: 3, type: "Fundamental", module: "Business Research Skills", theory_percentage: 30, logbook_percentage: 70 },
  
  // Module 5: Workplace Efficacy & Customer Care
  { id: "258889", title: "Demonstrate an understanding of workplace safety", credits: 3, type: "Fundamental", module: "Workplace Efficacy & Customer Care", theory_percentage: 30, logbook_percentage: 70 },
  { id: "258890", title: "Provide first-line support to customers", credits: 5, type: "Core", module: "Workplace Efficacy & Customer Care", theory_percentage: 30, logbook_percentage: 70 },
  { id: "258891", title: "Work effectively in an IT environment", credits: 4, type: "Fundamental", module: "Workplace Efficacy & Customer Care", theory_percentage: 30, logbook_percentage: 70 },
  { id: "258892", title: "Communicate effectively in an IT environment", credits: 4, type: "Fundamental", module: "Workplace Efficacy & Customer Care", theory_percentage: 30, logbook_percentage: 70 },
  
  // Module 6: Demonstrations
  { id: "258893", title: "Demonstrate knowledge of ethical practice in IT", credits: 3, type: "Core", module: "Demonstrations", theory_percentage: 30, logbook_percentage: 70 },
  { id: "258894", title: "Apply quality standards in IT support", credits: 4, type: "Core", module: "Demonstrations", theory_percentage: 30, logbook_percentage: 70 },
  { id: "258895", title: "Troubleshoot basic IT problems", credits: 6, type: "Core", module: "Demonstrations", theory_percentage: 30, logbook_percentage: 70 },
  { id: "258896", title: "Support network infrastructure", credits: 5, type: "Elective", module: "Demonstrations", theory_percentage: 30, logbook_percentage: 70 },
  
  // Additional Electives
  { id: "258897", title: "Install and configure network devices", credits: 6, type: "Elective", module: "Network Configuration", theory_percentage: 30, logbook_percentage: 70 },
  { id: "258898", title: "Implement basic security measures", credits: 5, type: "Elective", module: "Security Fundamentals", theory_percentage: 30, logbook_percentage: 70 },
  { id: "258899", title: "Support mobile devices", credits: 4, type: "Elective", module: "Mobile Support", theory_percentage: 30, logbook_percentage: 70 },
  { id: "258900", title: "Provide remote technical support", credits: 5, type: "Elective", module: "Remote Support", theory_percentage: 30, logbook_percentage: 70 },
]

export interface RolloutPlanRequest {
  qualification_name: string
  deal_start_date: string
  induction_date: string
  sessions_per_month: number
  working_hours_per_day: number
  group_by_module: boolean
  custom_unit_standards?: UnitStandard[] | null
}

export interface ScheduledUnitStandard extends UnitStandard {
  session_number: number
  contact_session_date: string
  submission_date: string
  days_for_completion: number
  total_hours: number
}

export interface SessionSchedule {
  session_number: number
  date: string
  unit_standards: string[]
}

export interface RolloutPlanResponse {
  qualification_name: string
  deal_start_date: string
  deal_end_date: string
  induction_date: string
  first_contact_session: string
  total_sessions: number
  total_credits: number
  total_hours: number
  sessions_per_month: number
  working_hours_per_day: number
  session_schedule: SessionSchedule[]
  unit_standards: ScheduledUnitStandard[]
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

function parseDate(dateStr: string): Date {
  return new Date(dateStr + 'T00:00:00')
}

export function generateRolloutPlan(request: RolloutPlanRequest): RolloutPlanResponse {
  const unitStandards = request.custom_unit_standards && request.custom_unit_standards.length > 0
    ? request.custom_unit_standards
    : DEFAULT_UNIT_STANDARDS

  const dealStartDate = parseDate(request.deal_start_date)
  const inductionDate = parseDate(request.induction_date)
  const dealEndDate = addDays(dealStartDate, 365)
  const firstContactSession = addDays(inductionDate, 7)

  // Calculate total sessions (default 24 for 12 months)
  const totalSessions = request.sessions_per_month * 12

  // Sort unit standards by module if grouping is enabled
  let sortedUnitStandards = [...unitStandards]
  if (request.group_by_module) {
    sortedUnitStandards.sort((a, b) => a.module.localeCompare(b.module))
  }

  // Calculate session dates (bi-weekly by default)
  const sessionDates: Date[] = []
  let currentDate = new Date(firstContactSession)
  
  for (let i = 0; i < totalSessions; i++) {
    sessionDates.push(new Date(currentDate))
    // Add approximately 2 weeks between sessions
    currentDate = addDays(currentDate, Math.floor(365 / totalSessions))
  }

  // Distribute unit standards across sessions
  const usPerSession = Math.ceil(sortedUnitStandards.length / totalSessions)
  const scheduledUnitStandards: ScheduledUnitStandard[] = []
  const sessionSchedule: SessionSchedule[] = []

  let currentSessionIndex = 0
  let usInCurrentSession = 0

  for (const us of sortedUnitStandards) {
    if (usInCurrentSession >= usPerSession && currentSessionIndex < totalSessions - 1) {
      currentSessionIndex++
      usInCurrentSession = 0
    }

    const sessionNumber = currentSessionIndex + 1
    const contactDate = sessionDates[currentSessionIndex]
    
    // Calculate submission date based on credits
    // 1 credit = 10 hours, working_hours_per_day hours per day
    const totalHours = us.credits * 10
    const daysNeeded = Math.ceil(totalHours / request.working_hours_per_day)
    const submissionDate = addDays(contactDate, daysNeeded)

    scheduledUnitStandards.push({
      ...us,
      session_number: sessionNumber,
      contact_session_date: formatDate(contactDate),
      submission_date: formatDate(submissionDate),
      days_for_completion: daysNeeded,
      total_hours: totalHours,
    })

    usInCurrentSession++
  }

  // Build session schedule
  for (let i = 0; i < totalSessions; i++) {
    const sessionUS = scheduledUnitStandards
      .filter(us => us.session_number === i + 1)
      .map(us => us.id)
    
    if (sessionUS.length > 0 || i < totalSessions) {
      sessionSchedule.push({
        session_number: i + 1,
        date: formatDate(sessionDates[i]),
        unit_standards: sessionUS,
      })
    }
  }

  const totalCredits = unitStandards.reduce((sum, us) => sum + us.credits, 0)
  const totalHours = totalCredits * 10

  return {
    qualification_name: request.qualification_name,
    deal_start_date: request.deal_start_date,
    deal_end_date: formatDate(dealEndDate),
    induction_date: request.induction_date,
    first_contact_session: formatDate(firstContactSession),
    total_sessions: totalSessions,
    total_credits: totalCredits,
    total_hours: totalHours,
    sessions_per_month: request.sessions_per_month,
    working_hours_per_day: request.working_hours_per_day,
    session_schedule: sessionSchedule,
    unit_standards: scheduledUnitStandards,
  }
}
