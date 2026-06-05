"use client"

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { HelpCircle } from "lucide-react"

interface HelpTooltipProps {
  content: string
  children?: React.ReactNode
  side?: "top" | "right" | "bottom" | "left"
  className?: string
}

export function HelpTooltip({ content, children, side = "top", className = "" }: HelpTooltipProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            className={`inline-flex items-center justify-center h-4 w-4 rounded-full bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors cursor-help ${className}`}
            type="button"
            tabIndex={0}
          >
            <HelpCircle className="h-3 w-3" />
          </button>
        </TooltipTrigger>
        <TooltipContent side={side} className="max-w-xs text-sm">
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

interface InlineHelpProps {
  label: string
  help: string
  children?: React.ReactNode
}

export function InlineHelp({ label, help, children }: InlineHelpProps) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <HelpTooltip content={help} />
      {children}
    </div>
  )
}
