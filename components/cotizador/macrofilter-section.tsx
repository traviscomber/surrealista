"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { ChevronDown, ChevronUp } from "lucide-react"

export interface MacrofilterOption {
  id: string
  label: string
  description?: string
}

export interface MacrofilterSectionProps {
  title: string
  description?: string
  options: MacrofilterOption[]
  selectedIds: string[]
  onChange: (selectedIds: string[]) => void
  icon?: React.ReactNode
  defaultOpen?: boolean
}

export function MacrofilterSection({
  title,
  description,
  options,
  selectedIds,
  onChange,
  icon,
  defaultOpen = false,
}: MacrofilterSectionProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen)

  const handleToggle = (id: string) => {
    const newSelected = selectedIds.includes(id)
      ? selectedIds.filter((s) => s !== id)
      : [...selectedIds, id]
    onChange(newSelected)
  }

  const selectedCount = selectedIds.length

  return (
    <Card className="border-slate-200 bg-white">
      <CardHeader
        className="cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            {icon && <div className="mt-1">{icon}</div>}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">{title}</CardTitle>
                {selectedCount > 0 && (
                  <span className="inline-flex items-center justify-center bg-emerald-100 text-emerald-700 text-xs font-semibold px-2 py-1 rounded-full">
                    {selectedCount}
                  </span>
                )}
              </div>
              {description && <CardDescription className="mt-1">{description}</CardDescription>}
            </div>
          </div>
          <button className="mt-0.5 text-slate-500 hover:text-slate-700 transition-colors">
            {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>
        </div>
      </CardHeader>

      {isOpen && (
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-slate-100 pt-4">
            {options.map((option) => (
              <div key={option.id} className="flex items-start gap-2">
                <Checkbox
                  id={option.id}
                  checked={selectedIds.includes(option.id)}
                  onCheckedChange={() => handleToggle(option.id)}
                  className="mt-1"
                />
                <Label
                  htmlFor={option.id}
                  className="flex flex-col gap-0.5 cursor-pointer flex-1"
                >
                  <span className="font-medium text-sm text-slate-900">{option.label}</span>
                  {option.description && (
                    <span className="text-xs text-slate-500">{option.description}</span>
                  )}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  )
}
