"use client"

import { format, parseISO } from "date-fns"
import { Calendar, Clock, FileCheck, Users } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Skeleton } from "@/components/ui/skeleton"
import type { RolloutPlan } from "@/app/page"

interface RolloutPlanResultsProps {
  plan: RolloutPlan | null
  isLoading: boolean
}

function formatDate(dateString: string) {
  return format(parseISO(dateString), "EEE, dd MMM yyyy")
}

function getModuleColor(module: string | null) {
  const colors: Record<string, string> = {
    "Network Design & Installations": "bg-blue-500/20 text-blue-400 border-blue-500/30",
    "Computer Operating Systems": "bg-green-500/20 text-green-400 border-green-500/30",
    "Systems Management": "bg-orange-500/20 text-orange-400 border-orange-500/30",
    "Business Research Skills": "bg-purple-500/20 text-purple-400 border-purple-500/30",
    "Workplace Efficacy & Customer Care": "bg-pink-500/20 text-pink-400 border-pink-500/30",
    "Demonstrations": "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  }
  return colors[module || ""] || "bg-muted text-muted-foreground border-border"
}

export function RolloutPlanResults({ plan, isLoading }: RolloutPlanResultsProps) {
  if (isLoading) {
    return (
      <Card className="border-border bg-card">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </CardContent>
      </Card>
    )
  }

  if (!plan) {
    return (
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">Generated Plan</CardTitle>
          <CardDescription>
            Configure the parameters and generate a roll-out plan to see the results here
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-border">
            <div className="text-center">
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-2 text-sm text-muted-foreground">
                No plan generated yet
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-foreground">{plan.qualification_name}</CardTitle>
            <CardDescription className="flex items-center gap-2 mt-1">
              <Users className="h-4 w-4" />
              Cohort: {plan.cohort_name}
            </CardDescription>
          </div>
          <Badge variant="outline" className="border-primary/50 text-primary">
            {plan.total_sessions} Sessions
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Key Dates */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground">Deal Start</p>
            <p className="mt-1 font-medium text-foreground">{formatDate(plan.deal_start_date)}</p>
          </div>
          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground">Deal End</p>
            <p className="mt-1 font-medium text-foreground">{formatDate(plan.deal_end_date)}</p>
          </div>
          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground">Induction</p>
            <p className="mt-1 font-medium text-foreground">{formatDate(plan.induction_date)}</p>
          </div>
          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground">First Contact</p>
            <p className="mt-1 font-medium text-foreground">{formatDate(plan.first_contact_date)}</p>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="flex items-center gap-3 rounded-lg border border-border bg-primary/5 p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
              <FileCheck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{plan.total_credits}</p>
              <p className="text-xs text-muted-foreground">Total Credits</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-border bg-chart-2/5 p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-chart-2/20">
              <Clock className="h-5 w-5 text-chart-2" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{plan.total_notional_hours}</p>
              <p className="text-xs text-muted-foreground">Notional Hours</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-border bg-chart-3/5 p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-chart-3/20">
              <Calendar className="h-5 w-5 text-chart-3" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{plan.total_sessions}</p>
              <p className="text-xs text-muted-foreground">Sessions</p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Session Schedule Table */}
        <div>
          <h3 className="mb-3 font-semibold text-foreground">Session Schedule</h3>
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="w-16">#</TableHead>
                  <TableHead>Module</TableHead>
                  <TableHead>Contact Date</TableHead>
                  <TableHead>Submission Date</TableHead>
                  <TableHead className="text-right">Credits</TableHead>
                  <TableHead className="text-right">Hours</TableHead>
                  <TableHead className="text-right">Days</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plan.sessions.map((session) => (
                  <TableRow key={session.session_number}>
                    <TableCell className="font-mono font-medium">
                      {session.session_number.toString().padStart(2, "0")}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={getModuleColor(session.module)}
                      >
                        {session.module || "Mixed"}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {formatDate(session.contact_date)}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {formatDate(session.submission_date)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {session.total_credits}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {session.total_hours}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {session.working_days}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Unit Standards per Session */}
        <div>
          <h3 className="mb-3 font-semibold text-foreground">Unit Standards Detail</h3>
          <Accordion type="single" collapsible className="space-y-2">
            {plan.sessions.map((session) => (
              <AccordionItem 
                key={session.session_number} 
                value={`session-${session.session_number}`}
                className="rounded-lg border border-border bg-muted/20 px-4"
              >
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-medium text-muted-foreground">
                      Session {session.session_number.toString().padStart(2, "0")}
                    </span>
                    <Badge variant="outline" className={getModuleColor(session.module)}>
                      {session.module || "Mixed"}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {session.unit_standards.length} unit standards
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 pb-2">
                    {session.unit_standards.map((us) => (
                      <div 
                        key={us.us_id}
                        className="flex items-start justify-between rounded border border-border bg-card p-3"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-muted-foreground">
                              US {us.us_id}
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              {us.type}
                            </Badge>
                          </div>
                          <p className="mt-1 text-sm text-foreground">{us.title}</p>
                        </div>
                        <div className="ml-4 text-right">
                          <p className="font-medium text-foreground">{us.credits} credits</p>
                          <p className="text-xs text-muted-foreground">
                            T: {us.theory_hours}h / L: {us.logbook_hours}h
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <Separator />

        {/* Final Dates */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg border border-border bg-muted/30 p-3 text-center">
            <p className="text-xs text-muted-foreground">POE Building</p>
            <p className="mt-1 text-sm font-medium text-foreground">
              {formatDate(plan.poe_building_date)}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-muted/30 p-3 text-center">
            <p className="text-xs text-muted-foreground">Moderation</p>
            <p className="mt-1 text-sm font-medium text-foreground">
              {formatDate(plan.moderation_date)}
            </p>
          </div>
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-center">
            <p className="text-xs text-primary">Final Submission</p>
            <p className="mt-1 text-sm font-medium text-primary">
              {formatDate(plan.final_submission_date)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
