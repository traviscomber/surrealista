"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Copy, Send } from "lucide-react"

interface CommunicationTemplate {
  id: string
  name: string
  type: string
  icon: any
  category: string
  template: string
  variables: string[]
}

interface TemplateDialogProps {
  template: CommunicationTemplate
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (template: CommunicationTemplate, content: string, subject: string) => void
}

export function TemplateDialog({ template, open, onOpenChange, onSave }: TemplateDialogProps) {
  const [variables, setVariables] = useState<Record<string, string>>({})
  const [subject, setSubject] = useState(template.name)
  const [preview, setPreview] = useState(template.template)

  useEffect(() => {
    const initialVars: Record<string, string> = {}
    template.variables.forEach((v) => {
      initialVars[v] = ""
    })
    setVariables(initialVars)
  }, [template])

  useEffect(() => {
    let updatedPreview = template.template
    Object.entries(variables).forEach(([key, value]) => {
      updatedPreview = updatedPreview.replaceAll(`{${key}}`, value || `{${key}}`)
    })
    setPreview(updatedPreview)
  }, [variables, template])

  const handleCopy = () => {
    navigator.clipboard.writeText(preview)
    alert("Contenido copiado al portapapeles")
  }

  const handleSave = () => {
    onSave(template, preview, subject)
  }

  return (
    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <template.icon className="h-5 w-5 text-purple-600" />
          {template.name}
        </DialogTitle>
      </DialogHeader>

      <div className="grid grid-cols-2 gap-6">
        {/* Variables Form */}
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-900">Completar Campos</h4>
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
            <div>
              <Label>Asunto / Título</Label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Asunto" />
            </div>
            {template.variables.map((variable) => (
              <div key={variable}>
                <Label className="text-sm text-gray-700">{variable.replace(/_/g, " ")}</Label>
                <Input
                  value={variables[variable] || ""}
                  onChange={(e) => setVariables({ ...variables, [variable]: e.target.value })}
                  placeholder={`Ingrese ${variable.toLowerCase().replace(/_/g, " ")}`}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-gray-900">Vista Previa</h4>
            <Button size="sm" variant="outline" onClick={handleCopy} className="gap-2 bg-transparent">
              <Copy className="h-4 w-4" />
              Copiar
            </Button>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 max-h-[500px] overflow-y-auto">
            <pre className="text-sm whitespace-pre-wrap font-sans">{preview}</pre>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t">
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Cancelar
        </Button>
        <Button onClick={handleSave} className="gap-2 bg-purple-600 hover:bg-purple-700">
          <Send className="h-4 w-4" />
          Guardar Comunicación
        </Button>
      </div>
    </DialogContent>
  )
}
