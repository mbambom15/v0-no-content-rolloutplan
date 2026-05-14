"use client"

import { useState } from "react"
import { Plus, Trash2, GripVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"

export interface CustomUnitStandard {
  us_id: string
  title: string
  credits: number
  type: "Core" | "Fundamental" | "Elective"
  module?: string
  theory_percentage: number
  logbook_percentage: number
}

interface UnitStandardInputProps {
  unitStandards: CustomUnitStandard[]
  onUnitStandardsChange: (unitStandards: CustomUnitStandard[]) => void
}

const emptyUnitStandard: CustomUnitStandard = {
  us_id: "",
  title: "",
  credits: 1,
  type: "Core",
  module: "",
  theory_percentage: 30,
  logbook_percentage: 70,
}

export function UnitStandardInput({ unitStandards, onUnitStandardsChange }: UnitStandardInputProps) {
  const [newUS, setNewUS] = useState<CustomUnitStandard>({ ...emptyUnitStandard })

  const addUnitStandard = () => {
    if (!newUS.us_id || !newUS.title || newUS.credits < 1) return
    
    onUnitStandardsChange([...unitStandards, { ...newUS }])
    setNewUS({ ...emptyUnitStandard })
  }

  const removeUnitStandard = (index: number) => {
    const updated = unitStandards.filter((_, i) => i !== index)
    onUnitStandardsChange(updated)
  }

  const updateUnitStandard = (index: number, field: keyof CustomUnitStandard, value: string | number) => {
    const updated = [...unitStandards]
    updated[index] = { ...updated[index], [field]: value }
    onUnitStandardsChange(updated)
  }

  const totalCredits = unitStandards.reduce((sum, us) => sum + us.credits, 0)
  const totalHours = totalCredits * 10

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-foreground flex items-center justify-between">
          <span>Custom Unit Standards</span>
          {unitStandards.length > 0 && (
            <div className="flex gap-2">
              <Badge variant="secondary">{unitStandards.length} units</Badge>
              <Badge variant="outline">{totalCredits} credits</Badge>
              <Badge variant="outline">{totalHours} hours</Badge>
            </div>
          )}
        </CardTitle>
        <CardDescription>
          Add unit standards manually with their credits. Leave empty to use the default ITSS5 curriculum.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add New Unit Standard Form */}
        <div className="grid gap-3 rounded-lg border border-dashed border-border p-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="us_id" className="text-xs">Unit Standard ID</Label>
              <Input
                id="us_id"
                placeholder="e.g., 114046"
                value={newUS.us_id}
                onChange={(e) => setNewUS({ ...newUS, us_id: e.target.value })}
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="credits" className="text-xs">Credits</Label>
              <Input
                id="credits"
                type="number"
                min={1}
                max={50}
                value={newUS.credits}
                onChange={(e) => setNewUS({ ...newUS, credits: parseInt(e.target.value) || 1 })}
                className="h-9"
              />
            </div>
          </div>
          
          <div className="space-y-1.5">
            <Label htmlFor="title" className="text-xs">Title</Label>
            <Input
              id="title"
              placeholder="Unit standard title..."
              value={newUS.title}
              onChange={(e) => setNewUS({ ...newUS, title: e.target.value })}
              className="h-9"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="type" className="text-xs">Type</Label>
              <Select
                value={newUS.type}
                onValueChange={(v) => setNewUS({ ...newUS, type: v as CustomUnitStandard["type"] })}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Core">Core</SelectItem>
                  <SelectItem value="Fundamental">Fundamental</SelectItem>
                  <SelectItem value="Elective">Elective</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="module" className="text-xs">Module (optional)</Label>
              <Input
                id="module"
                placeholder="e.g., Network Design"
                value={newUS.module || ""}
                onChange={(e) => setNewUS({ ...newUS, module: e.target.value })}
                className="h-9"
              />
            </div>
          </div>

          <Button 
            type="button" 
            onClick={addUnitStandard}
            disabled={!newUS.us_id || !newUS.title || newUS.credits < 1}
            className="w-full"
            size="sm"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Unit Standard
          </Button>
        </div>

        {/* List of Added Unit Standards */}
        {unitStandards.length > 0 && (
          <ScrollArea className="h-[300px] rounded-md border border-border">
            <div className="p-2 space-y-2">
              {unitStandards.map((us, index) => (
                <div
                  key={`${us.us_id}-${index}`}
                  className="flex items-start gap-2 rounded-md border border-border bg-muted/30 p-3"
                >
                  <GripVertical className="h-4 w-4 mt-1 text-muted-foreground cursor-grab" />
                  
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="shrink-0 font-mono">
                        {us.us_id}
                      </Badge>
                      <Badge 
                        variant={us.type === "Core" ? "default" : us.type === "Fundamental" ? "secondary" : "outline"}
                        className="shrink-0"
                      >
                        {us.type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {us.credits} credits ({us.credits * 10} hours)
                      </span>
                    </div>
                    
                    <Input
                      value={us.title}
                      onChange={(e) => updateUnitStandard(index, "title", e.target.value)}
                      className="h-8 text-sm"
                    />
                    
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <Label className="text-xs text-muted-foreground">Credits:</Label>
                        <Input
                          type="number"
                          min={1}
                          max={50}
                          value={us.credits}
                          onChange={(e) => updateUnitStandard(index, "credits", parseInt(e.target.value) || 1)}
                          className="h-7 w-16 text-xs"
                        />
                      </div>
                      {us.module && (
                        <Badge variant="outline" className="text-xs">
                          {us.module}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => removeUnitStandard(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {unitStandards.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-4">
            No custom unit standards added. The default ITSS5 curriculum (24 unit standards, 140 credits) will be used.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
