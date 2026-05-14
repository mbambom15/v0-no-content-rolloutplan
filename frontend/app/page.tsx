"use client"

import { useState } from "react"
import { RolloutPlanForm } from "@/components/rollout-plan-form"
import { RolloutPlanResults } from "@/components/rollout-plan-results"
import { UnitStandardsTable } from "@/components/unit-standards-table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalendarDays, FileSpreadsheet, Settings2 } from "lucide-react"

export interface UnitStandard {
  us_id: string
  title: string
  credits: number
  type: string
  module: string | null
  theory_percentage: number
  logbook_percentage: number
}

export interface SessionSchedule {
  session_number: number
  contact_date: string
  submission_date: string
  unit_standards: {
    us_id: string
    title: string
    credits: number
    type: string
    theory_hours: number
    logbook_hours: number
  }[]
  total_credits: number
  total_hours: number
  working_days: number
  module: string | null
}

export interface RolloutPlan {
  qualification_name: string
  cohort_name: string
  deal_start_date: string
  deal_end_date: string
  induction_date: string
  first_contact_date: string
  total_sessions: number
  sessions: SessionSchedule[]
  total_credits: number
  total_notional_hours: number
  poe_building_date: string
  moderation_date: string
  final_submission_date: string
}

export default function Home() {
  const [plan, setPlan] = useState<RolloutPlan | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  return (
    <main className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <CalendarDays className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">Roll-out Plan Generator</h1>
              <p className="text-sm text-muted-foreground">
                Generate learnership schedules with automatic date calculations
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8">
        <Tabs defaultValue="generator" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="generator" className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              Generator
            </TabsTrigger>
            <TabsTrigger value="unit-standards" className="flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              Unit Standards
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings2 className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="generator" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
              <RolloutPlanForm 
                onPlanGenerated={setPlan} 
                isLoading={isLoading}
                setIsLoading={setIsLoading}
              />
              <RolloutPlanResults plan={plan} isLoading={isLoading} />
            </div>
          </TabsContent>

          <TabsContent value="unit-standards">
            <UnitStandardsTable />
          </TabsContent>

          <TabsContent value="settings">
            <div className="rounded-lg border border-border bg-card p-6">
              <h2 className="text-lg font-semibold text-foreground">Settings</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Configure default values and preferences for roll-out plan generation.
              </p>
              <div className="mt-6 space-y-4">
                <div className="rounded-lg border border-border bg-muted/50 p-4">
                  <h3 className="font-medium text-foreground">Credit Calculation</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    1 Credit = 10 Notional Hours
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Working Day = 8 Hours (remainder carries over)
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-muted/50 p-4">
                  <h3 className="font-medium text-foreground">Assessment Split</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Theory: 30% | Logbook: 70%
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}
