"""
Roll-out Plan Generator Backend
Generates learnership rollout plans with contact sessions and submission dates
calculated based on unit standard credits.
"""

import fastapi
import fastapi.middleware.cors
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from datetime import date, timedelta
from typing import Optional
import io
import json

# Excel and PDF generation
from openpyxl import Workbook
from openpyxl.styles import Font, Alignment, Border, Side, PatternFill
from openpyxl.utils import get_column_letter
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

app = fastapi.FastAPI()

app.add_middleware(
    fastapi.middleware.cors.CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =====================
# DATA MODELS
# =====================

class UnitStandard(BaseModel):
    us_id: str
    title: str
    credits: int
    type: str  # Core, Fundamental, Elective
    module: Optional[str] = None
    theory_percentage: int = 30
    logbook_percentage: int = 70


class Module(BaseModel):
    name: str
    unit_standards: list[str]  # List of US IDs


class QualificationTemplate(BaseModel):
    name: str
    code: str
    unit_standards: list[UnitStandard]
    modules: list[Module]


class RolloutPlanRequest(BaseModel):
    qualification_name: str
    cohort_name: str
    deal_start_date: str  # ISO format YYYY-MM-DD
    induction_date: str  # ISO format YYYY-MM-DD
    sessions_per_month: int = 2
    working_hours_per_day: int = 8
    group_by_module: bool = True
    custom_unit_standards: Optional[list[UnitStandard]] = None


class SessionSchedule(BaseModel):
    session_number: int
    contact_date: str
    submission_date: str
    unit_standards: list[dict]
    total_credits: int
    total_hours: int
    working_days: int
    module: Optional[str] = None


class RolloutPlan(BaseModel):
    qualification_name: str
    cohort_name: str
    deal_start_date: str
    deal_end_date: str
    induction_date: str
    first_contact_date: str
    total_sessions: int
    sessions: list[SessionSchedule]
    total_credits: int
    total_notional_hours: int
    poe_building_date: str
    moderation_date: str
    final_submission_date: str


# =====================
# DEFAULT QUALIFICATION DATA (ITSS5)
# =====================

DEFAULT_UNIT_STANDARDS = [
    # Module 1: Network Design & Installations
    UnitStandard(us_id="114046", title="Demonstrate an understanding of issues affecting the management of a Local Area Computer Network (LAN)", credits=4, type="Core", module="Network Design & Installations"),
    UnitStandard(us_id="114047", title="Install and configure a multi-user networked operating system", credits=9, type="Core", module="Network Design & Installations"),
    UnitStandard(us_id="114054", title="Administer a Local Area Computer Network", credits=7, type="Core", module="Network Design & Installations"),
    UnitStandard(us_id="114060", title="Demonstrate an understanding of Local Area Computer Networks, by installing a networked workstation", credits=5, type="Core", module="Network Design & Installations"),
    UnitStandard(us_id="114072", title="Install and commission a Local Area Computer Network", credits=9, type="Core", module="Network Design & Installations"),
    UnitStandard(us_id="114075", title="Design a Local Area Computer Network for a departmental office environment", credits=5, type="Core", module="Network Design & Installations"),
    
    # Module 2: Computer Operating Systems
    UnitStandard(us_id="114053", title="Monitor and maintain a multi-user networked operating system", credits=6, type="Core", module="Computer Operating Systems"),
    UnitStandard(us_id="114058", title="Demonstrate an understanding of the concepts of multi-user computer operating systems", credits=7, type="Core", module="Computer Operating Systems"),
    UnitStandard(us_id="114183", title="Apply the principles of resolving problems for single-user and multi-user computer operating systems", credits=7, type="Fundamental", module="Computer Operating Systems"),
    
    # Module 3: Systems Management
    UnitStandard(us_id="114049", title="Demonstrate an understanding of computer database management systems", credits=7, type="Elective", module="Systems Management"),
    UnitStandard(us_id="114056", title="Describe Enterprise Systems Management and its role in IT Systems Support", credits=3, type="Core", module="Systems Management"),
    UnitStandard(us_id="114066", title="Test networked IT systems against given specifications", credits=4, type="Core", module="Systems Management"),
    UnitStandard(us_id="114069", title="Administer security systems for a multi-user computer system", credits=15, type="Elective", module="Systems Management"),
    UnitStandard(us_id="114048", title="Create database access for a computer application using Structured Query Language", credits=9, type="Elective", module="Systems Management"),
    
    # Module 4: Business Research Skills
    UnitStandard(us_id="114050", title="Explain the principles of business and the role of Information Technology", credits=4, type="Fundamental", module="Business Research Skills"),
    UnitStandard(us_id="114076", title="Use computer technology to research a computer topic", credits=3, type="Fundamental", module="Business Research Skills"),
    UnitStandard(us_id="8252", title="Writing business reports in retail/wholesale practices", credits=6, type="Fundamental", module="Business Research Skills"),
    UnitStandard(us_id="10135", title="Work as a project team member", credits=0, type="Fundamental", module="Business Research Skills"),
    UnitStandard(us_id="10451", title="Conduct a technical practitioners meeting", credits=4, type="Fundamental", module="Business Research Skills"),
    
    # Module 5: Workplace Efficacy & Customer Care
    UnitStandard(us_id="114052", title="Demonstrate appropriate customer care in the context of IT support, according to a Service Level Agreement", credits=8, type="Core", module="Workplace Efficacy & Customer Care"),
    UnitStandard(us_id="114055", title="Demonstrate an awareness of ethics and professionalism for the computer industry in South Africa", credits=3, type="Fundamental", module="Workplace Efficacy & Customer Care"),
    UnitStandard(us_id="114059", title="Demonstrate an understanding of estimating a unit of work and the implications of late delivery", credits=5, type="Fundamental", module="Workplace Efficacy & Customer Care"),
    
    # Module 6: Demonstrations
    UnitStandard(us_id="114061", title="Demonstrate an understanding of Wide Area Computer Networks (WANs), comparing them with Local Area Networks (LANs)", credits=5, type="Core", module="Demonstrations"),
    UnitStandard(us_id="114074", title="Demonstrate an understanding of different computer network architectures and standards", credits=5, type="Core", module="Demonstrations"),
]

DEFAULT_MODULES = [
    Module(name="Network Design & Installations", unit_standards=["114046", "114047", "114054", "114060", "114072", "114075"]),
    Module(name="Computer Operating Systems", unit_standards=["114053", "114058", "114183"]),
    Module(name="Systems Management", unit_standards=["114049", "114056", "114066", "114069", "114048"]),
    Module(name="Business Research Skills", unit_standards=["114050", "114076", "8252", "10135", "10451"]),
    Module(name="Workplace Efficacy & Customer Care", unit_standards=["114052", "114055", "114059"]),
    Module(name="Demonstrations", unit_standards=["114061", "114074"]),
]


# =====================
# HELPER FUNCTIONS
# =====================

def add_working_days(start_date: date, days: int) -> date:
    """Add working days (excludes weekends) to a date."""
    current = start_date
    added = 0
    while added < days:
        current += timedelta(days=1)
        # Skip weekends (5=Saturday, 6=Sunday)
        if current.weekday() < 5:
            added += 1
    return current


def get_next_monday(d: date) -> date:
    """Get the next Monday from a given date."""
    days_ahead = 0 - d.weekday()  # weekday() is 0 for Monday
    if days_ahead <= 0:
        days_ahead += 7
    return d + timedelta(days=days_ahead)


def calculate_working_days_from_credits(credits: int, hours_per_credit: int = 10, hours_per_day: int = 8) -> int:
    """
    Calculate working days needed based on credits.
    1 credit = 10 notional hours
    Working day = 8 hours (default)
    Carry over remainder to next day.
    """
    total_hours = credits * hours_per_credit
    full_days = total_hours // hours_per_day
    remainder_hours = total_hours % hours_per_day
    
    # If there's a remainder, add an extra day
    if remainder_hours > 0:
        full_days += 1
    
    return full_days


def distribute_unit_standards_to_sessions(
    unit_standards: list[UnitStandard],
    total_sessions: int,
    group_by_module: bool = True
) -> list[list[UnitStandard]]:
    """
    Distribute unit standards across sessions.
    If group_by_module is True, keeps unit standards from the same module together.
    """
    if group_by_module:
        # Group by module first
        modules_dict: dict[str, list[UnitStandard]] = {}
        for us in unit_standards:
            module = us.module or "General"
            if module not in modules_dict:
                modules_dict[module] = []
            modules_dict[module].append(us)
        
        # Flatten back to list preserving module order
        ordered_us = []
        for module_name in ["Network Design & Installations", "Computer Operating Systems", 
                           "Systems Management", "Business Research Skills", 
                           "Workplace Efficacy & Customer Care", "Demonstrations", "General"]:
            if module_name in modules_dict:
                ordered_us.extend(modules_dict[module_name])
    else:
        ordered_us = unit_standards.copy()
    
    # Calculate total credits to distribute evenly
    total_credits = sum(us.credits for us in ordered_us)
    target_credits_per_session = total_credits / total_sessions if total_sessions > 0 else total_credits
    
    sessions: list[list[UnitStandard]] = []
    current_session: list[UnitStandard] = []
    current_credits = 0
    
    for us in ordered_us:
        current_session.append(us)
        current_credits += us.credits
        
        # Check if we should start a new session
        if current_credits >= target_credits_per_session and len(sessions) < total_sessions - 1:
            sessions.append(current_session)
            current_session = []
            current_credits = 0
    
    # Add remaining unit standards to last session
    if current_session:
        sessions.append(current_session)
    
    # If we have fewer sessions than requested, pad with empty sessions
    while len(sessions) < total_sessions:
        sessions.append([])
    
    return sessions


def generate_rollout_plan(request: RolloutPlanRequest) -> RolloutPlan:
    """Generate a complete rollout plan based on the request parameters."""
    
    # Parse dates
    deal_start = date.fromisoformat(request.deal_start_date)
    induction = date.fromisoformat(request.induction_date)
    deal_end = deal_start + timedelta(days=365)  # 12 months
    
    # First contact session is 7 days from induction
    first_contact = induction + timedelta(days=7)
    # Ensure it's a Monday
    if first_contact.weekday() != 0:
        first_contact = get_next_monday(first_contact)
    
    # Get unit standards
    unit_standards = request.custom_unit_standards if request.custom_unit_standards else DEFAULT_UNIT_STANDARDS
    
    # Calculate total sessions (2 per month for 12 months = 24 sessions)
    total_sessions = 12 * request.sessions_per_month
    
    # Distribute unit standards across sessions
    session_us_distribution = distribute_unit_standards_to_sessions(
        unit_standards,
        total_sessions,
        request.group_by_module
    )
    
    # Generate session schedules
    sessions: list[SessionSchedule] = []
    current_contact_date = first_contact
    
    for i, session_us_list in enumerate(session_us_distribution):
        if not session_us_list:
            continue
            
        # Calculate total credits and hours for this session
        session_credits = sum(us.credits for us in session_us_list)
        session_hours = session_credits * 10  # 1 credit = 10 hours
        working_days = calculate_working_days_from_credits(session_credits, 10, request.working_hours_per_day)
        
        # Calculate submission date based on working days
        submission_date = add_working_days(current_contact_date, working_days)
        
        # Get module name if all US in session are from same module
        module_names = set(us.module for us in session_us_list if us.module)
        module_name = list(module_names)[0] if len(module_names) == 1 else None
        
        sessions.append(SessionSchedule(
            session_number=i + 1,
            contact_date=current_contact_date.isoformat(),
            submission_date=submission_date.isoformat(),
            unit_standards=[{
                "us_id": us.us_id,
                "title": us.title,
                "credits": us.credits,
                "type": us.type,
                "theory_hours": int(us.credits * 10 * (us.theory_percentage / 100)),
                "logbook_hours": int(us.credits * 10 * (us.logbook_percentage / 100)),
            } for us in session_us_list],
            total_credits=session_credits,
            total_hours=session_hours,
            working_days=working_days,
            module=module_name
        ))
        
        # Move to next contact date (bi-weekly = every 2 weeks for 2 sessions/month)
        # Or weekly if more sessions per month
        days_between_sessions = 30 // request.sessions_per_month
        current_contact_date = current_contact_date + timedelta(days=days_between_sessions)
        # Ensure it's a Monday
        if current_contact_date.weekday() != 0:
            current_contact_date = get_next_monday(current_contact_date)
    
    # Calculate final dates
    last_submission = date.fromisoformat(sessions[-1].submission_date) if sessions else deal_end
    poe_building = add_working_days(last_submission, 5)
    moderation = deal_end + timedelta(days=7)  # After learnership expiry
    final_submission = add_working_days(poe_building, 5)
    
    # Calculate totals
    total_credits = sum(us.credits for us in unit_standards)
    total_notional_hours = total_credits * 10
    
    return RolloutPlan(
        qualification_name=request.qualification_name,
        cohort_name=request.cohort_name,
        deal_start_date=deal_start.isoformat(),
        deal_end_date=deal_end.isoformat(),
        induction_date=induction.isoformat(),
        first_contact_date=first_contact.isoformat(),
        total_sessions=len(sessions),
        sessions=sessions,
        total_credits=total_credits,
        total_notional_hours=total_notional_hours,
        poe_building_date=poe_building.isoformat(),
        moderation_date=moderation.isoformat(),
        final_submission_date=final_submission.isoformat()
    )


# =====================
# EXCEL EXPORT
# =====================

def generate_excel(plan: RolloutPlan) -> io.BytesIO:
    """Generate an Excel file from the rollout plan."""
    wb = Workbook()
    ws = wb.active
    ws.title = "Rollout Plan"
    
    # Styles
    header_font = Font(bold=True, size=14, color="FFFFFF")
    header_fill = PatternFill(start_color="1F4E79", end_color="1F4E79", fill_type="solid")
    subheader_font = Font(bold=True, size=11)
    subheader_fill = PatternFill(start_color="D6DCE4", end_color="D6DCE4", fill_type="solid")
    thin_border = Border(
        left=Side(style='thin'),
        right=Side(style='thin'),
        top=Side(style='thin'),
        bottom=Side(style='thin')
    )
    
    # Title Section
    ws.merge_cells('A1:H1')
    ws['A1'] = f"{plan.qualification_name} - ROLLOUT PLAN"
    ws['A1'].font = Font(bold=True, size=16)
    ws['A1'].alignment = Alignment(horizontal='center')
    
    ws.merge_cells('A2:H2')
    ws['A2'] = f"Cohort: {plan.cohort_name}"
    ws['A2'].font = Font(bold=True, size=12)
    ws['A2'].alignment = Alignment(horizontal='center')
    
    # Key Dates Section
    row = 4
    ws[f'A{row}'] = "KEY DATES"
    ws[f'A{row}'].font = header_font
    ws[f'A{row}'].fill = header_fill
    ws.merge_cells(f'A{row}:H{row}')
    
    row += 1
    dates_info = [
        ("Deal Start Date", plan.deal_start_date),
        ("Deal End Date", plan.deal_end_date),
        ("Induction Date", plan.induction_date),
        ("First Contact Session", plan.first_contact_date),
        ("POE Building Date", plan.poe_building_date),
        ("Moderation Date", plan.moderation_date),
        ("Final Submission", plan.final_submission_date),
    ]
    
    for label, value in dates_info:
        ws[f'A{row}'] = label
        ws[f'A{row}'].font = subheader_font
        ws[f'B{row}'] = value
        row += 1
    
    # Summary Section
    row += 1
    ws[f'A{row}'] = "SUMMARY"
    ws[f'A{row}'].font = header_font
    ws[f'A{row}'].fill = header_fill
    ws.merge_cells(f'A{row}:H{row}')
    
    row += 1
    ws[f'A{row}'] = "Total Sessions"
    ws[f'B{row}'] = plan.total_sessions
    row += 1
    ws[f'A{row}'] = "Total Credits"
    ws[f'B{row}'] = plan.total_credits
    row += 1
    ws[f'A{row}'] = "Total Notional Hours"
    ws[f'B{row}'] = plan.total_notional_hours
    
    # Sessions Detail Section
    row += 2
    ws[f'A{row}'] = "SESSION SCHEDULE"
    ws[f'A{row}'].font = header_font
    ws[f'A{row}'].fill = header_fill
    ws.merge_cells(f'A{row}:H{row}')
    
    row += 1
    headers = ["Session", "Module", "Contact Date", "Submission Date", "Credits", "Hours", "Working Days", "Unit Standards"]
    for col, header in enumerate(headers, 1):
        cell = ws.cell(row=row, column=col, value=header)
        cell.font = subheader_font
        cell.fill = subheader_fill
        cell.border = thin_border
        cell.alignment = Alignment(horizontal='center', wrap_text=True)
    
    # Session data
    for session in plan.sessions:
        row += 1
        us_titles = ", ".join([us["title"][:50] + "..." if len(us["title"]) > 50 else us["title"] for us in session.unit_standards])
        
        data = [
            session.session_number,
            session.module or "Mixed",
            session.contact_date,
            session.submission_date,
            session.total_credits,
            session.total_hours,
            session.working_days,
            us_titles
        ]
        
        for col, value in enumerate(data, 1):
            cell = ws.cell(row=row, column=col, value=value)
            cell.border = thin_border
            cell.alignment = Alignment(wrap_text=True, vertical='top')
    
    # Unit Standards Detail Sheet
    ws2 = wb.create_sheet(title="Unit Standards")
    
    row = 1
    ws2[f'A{row}'] = "UNIT STANDARDS DETAIL"
    ws2[f'A{row}'].font = Font(bold=True, size=16)
    ws2.merge_cells(f'A{row}:G{row}')
    
    row += 2
    us_headers = ["US ID", "Title", "Type", "Credits", "Notional Hours", "Theory (30%)", "Logbook (70%)"]
    for col, header in enumerate(us_headers, 1):
        cell = ws2.cell(row=row, column=col, value=header)
        cell.font = subheader_font
        cell.fill = subheader_fill
        cell.border = thin_border
    
    for session in plan.sessions:
        for us in session.unit_standards:
            row += 1
            us_data = [
                us["us_id"],
                us["title"],
                us["type"],
                us["credits"],
                us["credits"] * 10,
                us["theory_hours"],
                us["logbook_hours"]
            ]
            for col, value in enumerate(us_data, 1):
                cell = ws2.cell(row=row, column=col, value=value)
                cell.border = thin_border
                cell.alignment = Alignment(wrap_text=True)
    
    # Adjust column widths
    for ws_current in [ws, ws2]:
        for col in range(1, 9):
            ws_current.column_dimensions[get_column_letter(col)].width = 20
    
    ws.column_dimensions['H'].width = 60
    ws2.column_dimensions['B'].width = 60
    
    # Save to BytesIO
    output = io.BytesIO()
    wb.save(output)
    output.seek(0)
    return output


# =====================
# PDF EXPORT
# =====================

def generate_pdf(plan: RolloutPlan) -> io.BytesIO:
    """Generate a PDF file from the rollout plan."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=landscape(A4), topMargin=30, bottomMargin=30)
    elements = []
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=18,
        spaceAfter=20,
        alignment=1  # Center
    )
    
    subtitle_style = ParagraphStyle(
        'CustomSubtitle',
        parent=styles['Heading2'],
        fontSize=14,
        spaceAfter=10,
        alignment=1
    )
    
    # Title
    elements.append(Paragraph(f"{plan.qualification_name} - ROLLOUT PLAN", title_style))
    elements.append(Paragraph(f"Cohort: {plan.cohort_name}", subtitle_style))
    elements.append(Spacer(1, 20))
    
    # Key Dates Table
    dates_data = [
        ["Key Dates", ""],
        ["Deal Start Date", plan.deal_start_date],
        ["Deal End Date", plan.deal_end_date],
        ["Induction Date", plan.induction_date],
        ["First Contact Session", plan.first_contact_date],
        ["POE Building Date", plan.poe_building_date],
        ["Final Submission", plan.final_submission_date],
    ]
    
    dates_table = Table(dates_data, colWidths=[200, 150])
    dates_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1F4E79')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('SPAN', (0, 0), (1, 0)),
        ('FONTNAME', (0, 1), (0, -1), 'Helvetica-Bold'),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('PADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(dates_table)
    elements.append(Spacer(1, 20))
    
    # Summary
    summary_data = [
        ["Summary", ""],
        ["Total Sessions", str(plan.total_sessions)],
        ["Total Credits", str(plan.total_credits)],
        ["Total Notional Hours", str(plan.total_notional_hours)],
    ]
    
    summary_table = Table(summary_data, colWidths=[200, 150])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1F4E79')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('SPAN', (0, 0), (1, 0)),
        ('FONTNAME', (0, 1), (0, -1), 'Helvetica-Bold'),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ('PADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(summary_table)
    elements.append(Spacer(1, 20))
    
    # Sessions Table
    elements.append(Paragraph("Session Schedule", styles['Heading2']))
    elements.append(Spacer(1, 10))
    
    sessions_header = ["#", "Module", "Contact Date", "Submission Date", "Credits", "Hours", "Days"]
    sessions_data = [sessions_header]
    
    for session in plan.sessions:
        sessions_data.append([
            str(session.session_number),
            session.module or "Mixed",
            session.contact_date,
            session.submission_date,
            str(session.total_credits),
            str(session.total_hours),
            str(session.working_days)
        ])
    
    sessions_table = Table(sessions_data, colWidths=[30, 150, 90, 90, 60, 60, 50])
    sessions_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1F4E79')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('PADDING', (0, 0), (-1, -1), 6),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F0F0F0')]),
    ]))
    elements.append(sessions_table)
    
    doc.build(elements)
    buffer.seek(0)
    return buffer


# =====================
# API ENDPOINTS
# =====================

@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/qualifications")
async def get_qualifications():
    """Get list of available qualification templates."""
    return {
        "qualifications": [
            {
                "name": "IT System Support (ITSS5)",
                "code": "ITSS5",
                "total_credits": sum(us.credits for us in DEFAULT_UNIT_STANDARDS),
                "unit_standards_count": len(DEFAULT_UNIT_STANDARDS),
                "modules_count": len(DEFAULT_MODULES)
            }
        ]
    }


@app.get("/unit-standards")
async def get_unit_standards():
    """Get all default unit standards with their details."""
    return {
        "unit_standards": [us.model_dump() for us in DEFAULT_UNIT_STANDARDS],
        "modules": [m.model_dump() for m in DEFAULT_MODULES]
    }


@app.post("/generate")
async def generate_plan(request: RolloutPlanRequest):
    """Generate a rollout plan based on the request parameters."""
    plan = generate_rollout_plan(request)
    return plan.model_dump()


@app.post("/export/excel")
async def export_excel(request: RolloutPlanRequest):
    """Generate and download rollout plan as Excel file."""
    plan = generate_rollout_plan(request)
    excel_file = generate_excel(plan)
    
    filename = f"rollout_plan_{plan.cohort_name.replace(' ', '_')}_{plan.deal_start_date}.xlsx"
    
    return StreamingResponse(
        excel_file,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@app.post("/export/pdf")
async def export_pdf(request: RolloutPlanRequest):
    """Generate and download rollout plan as PDF file."""
    plan = generate_rollout_plan(request)
    pdf_file = generate_pdf(plan)
    
    filename = f"rollout_plan_{plan.cohort_name.replace(' ', '_')}_{plan.deal_start_date}.pdf"
    
    return StreamingResponse(
        pdf_file,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
