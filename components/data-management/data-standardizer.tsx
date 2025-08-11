"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Settings, CheckCircle, AlertTriangle, Play, Pause, RotateCcw, FileText, MapPin, Phone, Mail, User } from 'lucide-react'

interface DataStandardizerProps {
  onStandardizationComplete?: () => void
}

interface StandardizationRule {
  id: string
  name: string
  field: string
  type: 'format' | 'validation' | 'transformation'
  enabled: boolean
  description: string
  examples: string[]
}

interface StandardizationProgress {
  total: number
  processed: number
  successful: number
  failed: number
  currentField: string
}

export default function DataStandardizer({ onStandardizationComplete }: DataStandardizerProps) {
  const [rules, setRules] = useState<StandardizationRule[]>([])
  const [progress, setProgress] = useState<StandardizationProgress>({
    total: 0,
    processed: 0,
    successful: 0,
    failed: 0,
    currentField: ""
  })
  const [isRunning, setIsRunning] = useState(false)
  const [activeTab, setActiveTab] = useState("rules")

  useEffect(() => {
    loadStandardizationRules()
  }, [])

  const loadStandardizationRules = () => {
    const defaultRules: StandardizationRule[] = [
      {
        id: "phone-format",
        name: "Formato de Teléfono Chileno",
        field: "contact_phone",
        type: "format",
        enabled: true,
        description: "Estandariza números telefónicos al formato +56XXXXXXXXX",
        examples: ["9 1234 5678 → +56912345678", "56912345678 → +56912345678"]
      },
      {
        id: "email-validation",
        name: "Validación de Email",
        field: "contact_email",
        type: "validation",
        enabled: true,
        description: "Valida y limpia direcciones de correo electrónico",
        examples: ["JUAN@EMAIL.COM → juan@email.com", "juan@email → ERROR"]
      },
      {
        id: "region-standardization",
        name: "Estandarización de Regiones",
        field: "region",
        type: "transformation",
        enabled: true,
        description: "Normaliza nombres de regiones chilenas",
        examples: ["metropolitana → Metropolitana", "rm → Metropolitana"]
      },
      {
        id: "name-capitalization",
        name: "Capitalización de Nombres",
        field: "contact_name",
        type: "format",
        enabled: true,
        description: "Aplica capitalización correcta a nombres de contacto",
        examples: ["juan pérez → Juan Pérez", "MARÍA GONZÁLEZ → María González"]
      },
      {
        id: "property-title-cleanup",
        name: "Limpieza de Títulos",
        field: "title",
        type: "transformation",
        enabled: true,
        description: "Limpia y estandariza títulos de propiedades",
        examples: ["fundo  la esperanza → Fundo La Esperanza", "CASA LAGO → Casa Lago"]
      },
      {
        id: "water-rights-boolean",
        name: "Derechos de Agua Booleano",
        field: "water_rights",
        type: "transformation",
        enabled: true,
        description: "Convierte valores de derechos de agua a booleano",
        examples: ["si → true", "no → false", "x → true"]
      }
    ]
    
    setRules(defaultRules)
  }

  const toggleRule = (ruleId: string) => {
    setRules(prev => prev.map(rule => 
      rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule
    ))
  }

  const startStandardization = async () => {
    setIsRunning(true)
    setProgress({
      total: 47, // Mock total properties
      processed: 0,
      successful: 0,
      failed: 0,
      currentField: ""
    })

    const enabledRules = rules.filter(rule => rule.enabled)
    
    for (let i = 0; i < enabledRules.length; i++) {
      const rule = enabledRules[i]
      
      setProgress(prev => ({
        ...prev,
        currentField: rule.name
      }))

      // Simulate processing each rule
      for (let j = 0; j <= 47; j++) {
        await new Promise(resolve => setTimeout(resolve, 50))
        
        setProgress(prev => ({
          ...prev,
          processed: Math.floor((i * 47 + j) / enabledRules.length),
          successful: Math.floor((i * 47 + j) / enabledRules.length * 0.9),
          failed: Math.floor((i * 47 + j) / enabledRules.length * 0.1)
        }))
      }
    }

    setProgress(prev => ({
      ...prev,
      processed: 47,
      successful: 42,
      failed: 5,
      currentField: "Completado"
    }))

    setIsRunning(false)
    onStandardizationComplete?.()
  }

  const pauseStandardization = () => {
    setIsRunning(false)
  }

  const resetProgress = () => {
    setProgress({
      total: 0,
      processed: 0,
      successful: 0,
      failed: 0,
      currentField: ""
    })
  }

  const getRuleIcon = (type: StandardizationRule['type']) => {
    switch (type) {
      case 'format': return <FileText className="h-4 w-4" />
      case 'validation': return <CheckCircle className="h-4 w-4" />
      case 'transformation': return <RotateCcw className="h-4 w-4" />
      default: return <Settings className="h-4 w-4" />
    }
  }

  const getRuleColor = (type: StandardizationRule['type']) => {
    switch (type) {
      case 'format': return "bg-blue-100 text-blue-800"
      case 'validation': return "bg-green-100 text-green-800"
      case 'transformation': return "bg-purple-100 text-purple-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="rules">Reglas de Estandarización</TabsTrigger>
          <TabsTrigger value="progress">Progreso</TabsTrigger>
          <TabsTrigger value="results">Resultados</TabsTrigger>
        </TabsList>

        {/* Rules Tab */}
        <TabsContent value="rules" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configuración de Reglas
              </CardTitle>
              <CardDescription>
                Configura las reglas de estandarización que se aplicarán a tus datos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {rules.map((rule) => (
                  <div key={rule.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {getRuleIcon(rule.type)}
                        <div>
                          <h4 className="font-medium">{rule.name}</h4>
                          <p className="text-sm text-gray-600">{rule.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={getRuleColor(rule.type)}>
                          {rule.type === 'format' ? 'Formato' : 
                           rule.type === 'validation' ? 'Validación' : 'Transformación'}
                        </Badge>
                        <Switch
                          checked={rule.enabled}
                          onCheckedChange={() => toggleRule(rule.id)}
                        />
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-600">
                      <strong>Campo:</strong> {rule.field}
                    </div>
                    
                    <div className="mt-2">
                      <strong className="text-sm">Ejemplos:</strong>
                      <ul className="text-sm text-gray-600 mt-1">
                        {rule.examples.map((example, index) => (
                          <li key={index} className="ml-4">• {example}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={resetProgress}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reiniciar
                </Button>
                <Button 
                  onClick={isRunning ? pauseStandardization : startStandardization}
                  disabled={rules.filter(r => r.enabled).length === 0}
                  className="flex items-center gap-2"
                >
                  {isRunning ? (
                    <>
                      <Pause className="h-4 w-4" />
                      Pausar Estandarización
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" />
                      Iniciar Estandarización
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Progress Tab */}
        <TabsContent value="progress" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                Progreso de Estandarización
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Overall Progress */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Progreso General</span>
                    <span className="text-sm text-gray-600">
                      {progress.processed} / {progress.total}
                    </span>
                  </div>
                  <Progress 
                    value={progress.total > 0 ? (progress.processed / progress.total) * 100 : 0} 
                    className="h-3" 
                  />
                </div>

                {/* Current Status */}
                {isRunning && (
                  <Alert>
                    <Play className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Procesando:</strong> {progress.currentField}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{progress.successful}</div>
                    <div className="text-sm text-gray-600">Exitosos</div>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{progress.failed}</div>
                    <div className="text-sm text-gray-600">Fallidos</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {progress.total > 0 ? Math.round((progress.successful / progress.total) * 100) : 0}%
                    </div>
                    <div className="text-sm text-gray-600">Tasa de Éxito</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Results Tab */}
        <TabsContent value="results" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Resultados de Estandarización
              </CardTitle>
            </CardHeader>
            <CardContent>
              {progress.processed > 0 ? (
                <div className="space-y-4">
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription>
                      <strong>Estandarización completada:</strong> {progress.successful} propiedades 
                      procesadas exitosamente de {progress.total} totales.
                    </AlertDescription>
                  </Alert>

                  {progress.failed > 0 && (
                    <Alert className="border-yellow-200 bg-yellow-50">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <AlertDescription>
                        <strong>Atención:</strong> {progress.failed} propiedades requieren revisión manual.
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium mb-2">Campos Estandarizados</h4>
                      <ul className="text-sm space-y-1">
                        <li className="flex items-center gap-2">
                          <Phone className="h-3 w-3" />
                          Teléfonos: 42 normalizados
                        </li>
                        <li className="flex items-center gap-2">
                          <Mail className="h-3 w-3" />
                          Emails: 38 validados
                        </li>
                        <li className="flex items-center gap-2">
                          <MapPin className="h-3 w-3" />
                          Regiones: 45 estandarizadas
                        </li>
                        <li className="flex items-center gap-2">
                          <User className="h-3 w-3" />
                          Nombres: 43 capitalizados
                        </li>
                      </ul>
                    </div>

                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium mb-2">Mejoras de Calidad</h4>
                      <ul className="text-sm space-y-1">
                        <li>• Calidad promedio: 73% → 89%</li>
                        <li>• Campos completos: +15%</li>
                        <li>• Formato consistente: +22%</li>
                        <li>• Errores de validación: -67%</li>
                      </ul>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hay resultados disponibles. Ejecuta la estandarización primero.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
