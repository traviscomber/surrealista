"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Lightbulb, HelpCircle, CheckCircle2 } from "lucide-react"

interface InfoBoxProps {
  title: string
  description: string
  type?: "info" | "tip" | "help" | "success"
  icon?: React.ReactNode
}

export function InfoBox({ title, description, type = "info", icon }: InfoBoxProps) {
  const typeStyles = {
    info: "border-blue-200 bg-blue-50 text-blue-900",
    tip: "border-amber-200 bg-amber-50 text-amber-900",
    help: "border-purple-200 bg-purple-50 text-purple-900",
    success: "border-green-200 bg-green-50 text-green-900",
  }

  const typeIcons = {
    info: <AlertCircle className="h-5 w-5" />,
    tip: <Lightbulb className="h-5 w-5" />,
    help: <HelpCircle className="h-5 w-5" />,
    success: <CheckCircle2 className="h-5 w-5" />,
  }

  return (
    <div className={`border rounded-lg p-4 flex gap-3 ${typeStyles[type]}`}>
      <div className="flex-shrink-0 mt-0.5">{icon || typeIcons[type]}</div>
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-sm mb-1">{title}</h4>
        <p className="text-sm opacity-90 leading-relaxed">{description}</p>
      </div>
    </div>
  )
}

interface StepCardProps {
  step: number
  title: string
  description: string
  children?: React.ReactNode
}

export function StepCard({ step, title, description, children }: StepCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-100 text-teal-900 font-semibold text-sm flex-shrink-0">
            {step}
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription className="mt-1">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      {children && <CardContent>{children}</CardContent>}
    </Card>
  )
}

interface FeatureCardProps {
  icon: React.ReactNode
  title: string
  description: string
}

export function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="flex gap-4 p-4 rounded-lg border border-slate-200 hover:border-teal-300 hover:bg-teal-50/30 transition-colors">
      <div className="flex-shrink-0 h-12 w-12 flex items-center justify-center rounded-lg bg-teal-100 text-teal-600">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-sm text-foreground">{title}</h3>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{description}</p>
      </div>
    </div>
  )
}

interface QuickStartProps {
  title: string
  steps: Array<{ title: string; description: string }>
}

export function QuickStart({ title, steps }: QuickStartProps) {
  return (
    <Card className="border-teal-200 bg-gradient-to-br from-teal-50 to-cyan-50">
      <CardHeader>
        <CardTitle className="text-teal-900">{title}</CardTitle>
        <CardDescription>Sigue estos pasos para empezar rápidamente</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {steps.map((step, index) => (
            <div key={index} className="flex gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-600 text-white text-xs font-semibold flex-shrink-0">
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-teal-900">{step.title}</p>
                <p className="text-xs text-teal-800 mt-0.5 leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
