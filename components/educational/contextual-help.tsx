"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { HelpCircle, ChevronDown, ChevronUp } from "lucide-react"
import { useState } from "react"

interface ContextualHelpItem {
  question: string
  answer: string
  icon?: React.ReactNode
}

interface ContextualHelpProps {
  title: string
  items: ContextualHelpItem[]
  defaultExpanded?: boolean
}

export function ContextualHelp({ title, items, defaultExpanded = false }: ContextualHelpProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader className="pb-3">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-between w-full hover:opacity-80 transition-opacity"
        >
          <div className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-base text-blue-900">{title}</CardTitle>
          </div>
          {isExpanded ? <ChevronUp className="h-4 w-4 text-blue-600" /> : <ChevronDown className="h-4 w-4 text-blue-600" />}
        </button>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-3">
          {items.map((item, index) => (
            <div key={index} className="space-y-1">
              <p className="text-sm font-semibold text-blue-900">{item.question}</p>
              <p className="text-sm text-blue-800 leading-relaxed ml-4 border-l-2 border-blue-300 pl-3">
                {item.answer}
              </p>
            </div>
          ))}
        </CardContent>
      )}
    </Card>
  )
}

interface QuickTipsProps {
  tips: string[]
}

export function QuickTips({ tips }: QuickTipsProps) {
  return (
    <Card className="border-amber-200 bg-amber-50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm text-amber-900 flex items-center gap-2">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-200 text-xs font-bold text-amber-900">
            💡
          </span>
          Consejos Rápidos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {tips.map((tip, index) => (
            <li key={index} className="flex gap-3 text-sm text-amber-800">
              <span className="flex-shrink-0 font-semibold text-amber-600">•</span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
