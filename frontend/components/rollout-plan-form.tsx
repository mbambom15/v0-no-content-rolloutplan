"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { format } from "date-fns"
import { CalendarIcon, Download, FileText, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import type { RolloutPlan } from "@/app/page"

const formSchema = z.object({
  qualification_name: z.string().min(1, "Qualification name is required"),
  cohort_name: z.string().min(1, "Cohort name is required"),
  deal_start_date: z.date({ required_error: "Deal start date is required" }),
  induction_date: z.date({ required_error: "Induction date is required" }),
  sessions_per_month: z.number().min(1).max(4),
  working_hours_per_day: z.number().min(1).max(12),
  group_by_module: z.boolean(),
})

type FormValues = z.infer<typeof formSchema>

interface RolloutPlanFormProps {
  onPlanGenerated: (plan: RolloutPlan) => void
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
}

export function RolloutPlanForm({ onPlanGenerated, isLoading, setIsLoading }: RolloutPlanFormProps) {
  const [generatedPlan, setGeneratedPlan] = useState<RolloutPlan | null>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      qualification_name: "IT System Support (ITSS5)",
      cohort_name: "Begonia",
      sessions_per_month: 2,
      working_hours_per_day: 8,
      group_by_module: true,
    },
  })

  async function onSubmit(values: FormValues) {
    setIsLoading(true)
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          deal_start_date: format(values.deal_start_date, "yyyy-MM-dd"),
          induction_date: format(values.induction_date, "yyyy-MM-dd"),
        }),
      })
      
      if (!response.ok) {
        throw new Error("Failed to generate plan")
      }
      
      const plan = await response.json()
      setGeneratedPlan(plan)
      onPlanGenerated(plan)
    } catch (error) {
      console.error("Error generating plan:", error)
    } finally {
      setIsLoading(false)
    }
  }

  async function downloadExcel() {
    if (!generatedPlan) return
    
    const values = form.getValues()
    const response = await fetch("/api/export/excel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...values,
        deal_start_date: format(values.deal_start_date, "yyyy-MM-dd"),
        induction_date: format(values.induction_date, "yyyy-MM-dd"),
      }),
    })
    
    if (response.ok) {
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `rollout_plan_${values.cohort_name}_${format(values.deal_start_date, "yyyy-MM-dd")}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      a.remove()
    }
  }

  async function downloadPDF() {
    if (!generatedPlan) return
    
    const values = form.getValues()
    const response = await fetch("/api/export/pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...values,
        deal_start_date: format(values.deal_start_date, "yyyy-MM-dd"),
        induction_date: format(values.induction_date, "yyyy-MM-dd"),
      }),
    })
    
    if (response.ok) {
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `rollout_plan_${values.cohort_name}_${format(values.deal_start_date, "yyyy-MM-dd")}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      a.remove()
    }
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-foreground">Plan Configuration</CardTitle>
        <CardDescription>
          Set the parameters for your roll-out plan
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="qualification_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Qualification</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select qualification" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="IT System Support (ITSS5)">
                        IT System Support (ITSS5)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cohort_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cohort Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Begonia" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="deal_start_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Deal Start Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date("2020-01-01")}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    12-month deal period starts from this date
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="induction_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Induction Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date("2020-01-01")}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    First contact session is 7 days after induction
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="sessions_per_month"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sessions/Month</FormLabel>
                    <Select 
                      onValueChange={(v) => field.onChange(parseInt(v))} 
                      defaultValue={field.value.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1">1</SelectItem>
                        <SelectItem value="2">2</SelectItem>
                        <SelectItem value="3">3</SelectItem>
                        <SelectItem value="4">4</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="working_hours_per_day"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hours/Day</FormLabel>
                    <Select 
                      onValueChange={(v) => field.onChange(parseInt(v))} 
                      defaultValue={field.value.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="6">6</SelectItem>
                        <SelectItem value="7">7</SelectItem>
                        <SelectItem value="8">8</SelectItem>
                        <SelectItem value="9">9</SelectItem>
                        <SelectItem value="10">10</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="group_by_module"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Group by Module</FormLabel>
                    <FormDescription>
                      Keep related unit standards together
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate Roll-out Plan"
              )}
            </Button>

            {generatedPlan && (
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={downloadExcel}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Excel
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={downloadPDF}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  PDF
                </Button>
              </div>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
