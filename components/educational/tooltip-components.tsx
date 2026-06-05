"use client"

import { HelpTooltip } from "@/components/educational/help-tooltip"
import { Card, CardContent } from "@/components/ui/card"

interface TooltipGridItemProps {
  label: string
  help: string
  icon?: React.ReactNode
  value?: string | React.ReactNode
}

export function TooltipGridItem({ label, help, icon, value }: TooltipGridItemProps) {
  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-semibold text-foreground">{label}</span>
              <HelpTooltip content={help} />
            </div>
            {value && <div className="text-lg font-bold text-teal-600">{value}</div>}
          </div>
          {icon && <div className="flex-shrink-0 text-muted-foreground group-hover:text-teal-600 transition-colors">{icon}</div>}
        </div>
      </CardContent>
    </Card>
  )
}

export function TooltipSection({
  title,
  description,
  help,
  children,
}: {
  title: string
  description?: string
  help?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-foreground">{title}</h3>
            {help && <HelpTooltip content={help} />}
          </div>
          {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
        </div>
      </div>
      {children}
    </div>
  )
}
