"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import type { UnitStandard } from "@/app/page"

interface UnitStandardsData {
  unit_standards: UnitStandard[]
  modules: { name: string; unit_standards: string[] }[]
}

function getTypeColor(type: string) {
  const colors: Record<string, string> = {
    "Core": "bg-blue-500/20 text-blue-400 border-blue-500/30",
    "Fundamental": "bg-green-500/20 text-green-400 border-green-500/30",
    "Elective": "bg-orange-500/20 text-orange-400 border-orange-500/30",
  }
  return colors[type] || "bg-muted text-muted-foreground border-border"
}

function getModuleColor(module: string | null) {
  const colors: Record<string, string> = {
    "Network Design & Installations": "bg-blue-500/10 text-blue-400",
    "Computer Operating Systems": "bg-green-500/10 text-green-400",
    "Systems Management": "bg-orange-500/10 text-orange-400",
    "Business Research Skills": "bg-purple-500/10 text-purple-400",
    "Workplace Efficacy & Customer Care": "bg-pink-500/10 text-pink-400",
    "Demonstrations": "bg-cyan-500/10 text-cyan-400",
  }
  return colors[module || ""] || ""
}

export function UnitStandardsTable() {
  const [data, setData] = useState<UnitStandardsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchUnitStandards() {
      try {
        const response = await fetch("/api/unit-standards")
        if (response.ok) {
          const json = await response.json()
          setData(json)
        }
      } catch (error) {
        console.error("Error fetching unit standards:", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchUnitStandards()
  }, [])

  if (isLoading) {
    return (
      <Card className="border-border bg-card">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-96" />
        </CardContent>
      </Card>
    )
  }

  if (!data) {
    return (
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">Unit Standards</CardTitle>
          <CardDescription>Failed to load unit standards data</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const totalCredits = data.unit_standards.reduce((sum, us) => sum + us.credits, 0)
  const totalHours = totalCredits * 10

  const coreCount = data.unit_standards.filter(us => us.type === "Core").length
  const fundamentalCount = data.unit_standards.filter(us => us.type === "Fundamental").length
  const electiveCount = data.unit_standards.filter(us => us.type === "Elective").length

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-foreground">Unit Standards</CardTitle>
            <CardDescription>
              IT System Support (ITSS5) Qualification - {data.unit_standards.length} Unit Standards
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="border-blue-500/30 text-blue-400">
              {coreCount} Core
            </Badge>
            <Badge variant="outline" className="border-green-500/30 text-green-400">
              {fundamentalCount} Fundamental
            </Badge>
            <Badge variant="outline" className="border-orange-500/30 text-orange-400">
              {electiveCount} Elective
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-lg border border-border bg-muted/30 p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{data.unit_standards.length}</p>
            <p className="text-xs text-muted-foreground">Unit Standards</p>
          </div>
          <div className="rounded-lg border border-border bg-muted/30 p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{totalCredits}</p>
            <p className="text-xs text-muted-foreground">Total Credits</p>
          </div>
          <div className="rounded-lg border border-border bg-muted/30 p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{totalHours}</p>
            <p className="text-xs text-muted-foreground">Notional Hours</p>
          </div>
          <div className="rounded-lg border border-border bg-muted/30 p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{data.modules.length}</p>
            <p className="text-xs text-muted-foreground">Modules</p>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="w-24">US ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Module</TableHead>
                <TableHead className="w-28">Type</TableHead>
                <TableHead className="w-20 text-right">Credits</TableHead>
                <TableHead className="w-24 text-right">Hours</TableHead>
                <TableHead className="w-28 text-right">Theory (30%)</TableHead>
                <TableHead className="w-32 text-right">Logbook (70%)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.unit_standards.map((us) => (
                <TableRow key={us.us_id} className={getModuleColor(us.module)}>
                  <TableCell className="font-mono font-medium">{us.us_id}</TableCell>
                  <TableCell className="max-w-md">
                    <p className="line-clamp-2 text-sm">{us.title}</p>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground">
                      {us.module || "-"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getTypeColor(us.type)}>
                      {us.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">{us.credits}</TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {us.credits * 10}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {Math.round(us.credits * 10 * 0.3)}h
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {Math.round(us.credits * 10 * 0.7)}h
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Module Summary */}
        <div>
          <h3 className="mb-3 font-semibold text-foreground">Modules Overview</h3>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {data.modules.map((module) => {
              const moduleUS = data.unit_standards.filter(us => us.module === module.name)
              const moduleCredits = moduleUS.reduce((sum, us) => sum + us.credits, 0)
              return (
                <div 
                  key={module.name}
                  className="rounded-lg border border-border bg-muted/20 p-4"
                >
                  <h4 className="font-medium text-foreground">{module.name}</h4>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {moduleUS.length} unit standards
                  </p>
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Credits:</span>
                    <span className="font-medium text-foreground">{moduleCredits}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Hours:</span>
                    <span className="font-medium text-foreground">{moduleCredits * 10}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
