"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { CheckCircle, AlertTriangle, XCircle, Search, Filter, Edit, Save, X, BarChart3, TrendingUp } from 'lucide-react'

interface QualityControllerProps {
  onQualityUpdate?: () => void
}

interface QualityIssue {
  id: string
  propertyId: string
  propertyTitle: string
  field: string
  issueType: 'missing' | 'invalid' | 'inconsistent' | 'duplicate'
  severity: 'high' | 'medium' | 'low'
  description: string
  currentValue: string
  suggestedValue: string
  status: 'pending' | 'fixed' | 'ignored'
}

interface QualityMetrics {
  totalProperties: number
  qualityScore: number
  issuesFound: number
  issuesFixed: number
  fieldCompleteness: Record<string, number>
  qualityTrends: Array<{ date: string; score: number }>
}

export default function QualityController({ onQualityUpdate }: QualityControllerProps) {
  const [issues, setIssues] = useState<QualityIssue[]>([])
  const [metrics, setMetrics] = useState<QualityMetrics>({
    totalProperties: 0,
    qualityScore: 0,
    issuesFound: 0,
    issuesFixed: 0,
    fieldCompleteness: {},
    qualityTrends: []
  })
  const [searchTerm, setSearchTerm] = useState("")
  const [filterSeverity, setFilterSeverity] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [editingIssue, setEditingIssue] = useState<string | null>(null)
  const [editValue, setEditValue] = useState("")
  const [activeTab, setActiveTab] = useState("issues")

  useEffect(() => {
    loadQualityData()
  }, [])

  const loadQualityData = async () => {
    // Mock data for demonstration
    const mockIssues: QualityIssue[] = [
      {
        id: "1",
        propertyId: "prop-1",
        propertyTitle: "Fundo La Esperanza",
        field: "contact_phone",
        issueType: "invalid",
        severity: "high",
        description: "Formato de teléfono inválido",
        currentValue: "9 1234 5678",
        suggestedValue: "+56912345678",
        status: "pending"
      },
      {
        id: "2",
        propertyId: "prop-2",
        propertyTitle: "Casa Lago Villarrica",
        field: "contact_email",
        issueType: "missing",
        severity: "medium",
        description: "Email de contacto faltante",
        currentValue: "",
        suggestedValue: "",
        status: "pending"
      },
      {
        id: "3",
        propertyId: "prop-3",
        propertyTitle: "Parcela Los Aromos",
        field: "region",
        issueType: "inconsistent",
        severity: "low",
        description: "Formato de región inconsistente",
        currentValue: "metropolitana",
        suggestedValue: "Metropolitana",
        status: "pending"
      }
    ]

    const mockMetrics: QualityMetrics = {
      totalProperties: 47,
      qualityScore: 73,
      issuesFound: 24,
      issuesFixed: 12,
      fieldCompleteness: {
        title: 100,
        contact_name: 95,
        contact_phone: 78,
        contact_email: 65,
        region: 89,
        owner_name: 82,
        property_rol: 71,
        water_rights: 100
      },
      qualityTrends: [
        { date: "2024-01-01", score: 65 },
        { date: "2024-01-02", score: 68 },
        { date: "2024-01-03", score: 71 },
        { date: "2024-01-04", score: 73 }
      ]
    }

    setIssues(mockIssues)
    setMetrics(mockMetrics)
  }

  const filteredIssues = issues.filter(issue => {
    const matchesSearch = issue.propertyTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         issue.field.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSeverity = filterSeverity === "all" || issue.severity === filterSeverity
    const matchesStatus = filterStatus === "all" || issue.status === filterStatus
    
    return matchesSearch && matchesSeverity && matchesStatus
  })

  const handleFixIssue = (issueId: string, newValue: string) => {
    setIssues(prev => prev.map(issue => 
      issue.id === issueId 
        ? { ...issue, currentValue: newValue, status: 'fixed' as const }
        : issue
    ))
    setEditingIssue(null)
    setEditValue("")
    onQualityUpdate?.()
  }

  const handleIgnoreIssue = (issueId: string) => {
    setIssues(prev => prev.map(issue => 
      issue.id === issueId 
        ? { ...issue, status: 'ignored' as const }
        : issue
    ))
    onQualityUpdate?.()
  }

  const startEditing = (issue: QualityIssue) => {
    setEditingIssue(issue.id)
    setEditValue(issue.suggestedValue || issue.currentValue)
  }

  const cancelEditing = () => {
    setEditingIssue(null)
    setEditValue("")
  }

  const getSeverityBadge = (severity: QualityIssue['severity']) => {
    const config = {
      high: { color: "bg-red-100 text-red-800", text: "Alta" },
      medium: { color: "bg-yellow-100 text-yellow-800", text: "Media" },
      low: { color: "bg-blue-100 text-blue-800", text: "Baja" }
    }
    
    const { color, text } = config[severity]
    return <Badge className={color}>{text}</Badge>
  }

  const getStatusBadge = (status: QualityIssue['status']) => {
    const config = {
      pending: { color: "bg-gray-100 text-gray-800", text: "Pendiente", icon: AlertTriangle },
      fixed: { color: "bg-green-100 text-green-800", text: "Corregido", icon: CheckCircle },
      ignored: { color: "bg-orange-100 text-orange-800", text: "Ignorado", icon: XCircle }
    }
    
    const { color, text, icon: Icon } = config[status]
    return (
      <Badge className={`${color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {text}
      </Badge>
    )
  }

  const getIssueTypeText = (type: QualityIssue['issueType']) => {
    const types = {
      missing: "Faltante",
      invalid: "Inválido",
      inconsistent: "Inconsistente",
      duplicate: "Duplicado"
    }
    return types[type]
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="issues">Problemas de Calidad</TabsTrigger>
          <TabsTrigger value="metrics">Métricas</TabsTrigger>
          <TabsTrigger value="trends">Tendencias</TabsTrigger>
        </TabsList>

        {/* Issues Tab */}
        <TabsContent value="issues" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtros y Búsqueda
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Buscar</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Buscar por propiedad o campo..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Severidad</label>
                  <select
                    value={filterSeverity}
                    onChange={(e) => setFilterSeverity(e.target.value)}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="all">Todas</option>
                    <option value="high">Alta</option>
                    <option value="medium">Media</option>
                    <option value="low">Baja</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Estado</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="all">Todos</option>
                    <option value="pending">Pendientes</option>
                    <option value="fixed">Corregidos</option>
                    <option value="ignored">Ignorados</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Issues List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Problemas Encontrados
                </span>
                <Badge variant="outline">{filteredIssues.length} problemas</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredIssues.map((issue) => (
                  <div key={issue.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-medium">{issue.propertyTitle}</h4>
                        <p className="text-sm text-gray-600">
                          Campo: <strong>{issue.field}</strong> - {getIssueTypeText(issue.issueType)}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">{issue.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getSeverityBadge(issue.severity)}
                        {getStatusBadge(issue.status)}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Valor Actual</label>
                        <div className="p-2 bg-red-50 border border-red-200 rounded text-sm">
                          {issue.currentValue || "(vacío)"}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Valor Sugerido</label>
                        {editingIssue === issue.id ? (
                          <Input
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="text-sm"
                          />
                        ) : (
                          <div className="p-2 bg-green-50 border border-green-200 rounded text-sm">
                            {issue.suggestedValue || "(sin sugerencia)"}
                          </div>
                        )}
                      </div>
                    </div>

                    {issue.status === 'pending' && (
                      <div className="flex justify-end gap-2">
                        {editingIssue === issue.id ? (
                          <>
                            <Button variant="outline" size="sm" onClick={cancelEditing}>
                              <X className="h-4 w-4 mr-1" />
                              Cancelar
                            </Button>
                            <Button size="sm" onClick={() => handleFixIssue(issue.id, editValue)}>
                              <Save className="h-4 w-4 mr-1" />
                              Guardar
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button variant="outline" size="sm" onClick={() => handleIgnoreIssue(issue.id)}>
                              <X className="h-4 w-4 mr-1" />
                              Ignorar
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => startEditing(issue)}>
                              <Edit className="h-4 w-4 mr-1" />
                              Editar
                            </Button>
                            <Button size="sm" onClick={() => handleFixIssue(issue.id, issue.suggestedValue)}>
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Aplicar Sugerencia
                            </Button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {filteredIssues.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No se encontraron problemas con los filtros actuales.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Metrics Tab */}
        <TabsContent value="metrics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{metrics.totalProperties}</div>
                  <div className="text-sm text-gray-600">Propiedades Totales</div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{metrics.qualityScore}%</div>
                  <div className="text-sm text-gray-600">Puntuación de Calidad</div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600">{metrics.issuesFound}</div>
                  <div className="text-sm text-gray-600">Problemas Encontrados</div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-600">{metrics.issuesFixed}</div>
                  <div className="text-sm text-gray-600">Problemas Corregidos</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Field Completeness */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Completitud por Campo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(metrics.fieldCompleteness).map(([field, percentage]) => (
                  <div key={field}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium capitalize">{field.replace('_', ' ')}</span>
                      <span className="text-sm text-gray-600">{percentage}%</span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Tendencias de Calidad
              </CardTitle>
              <CardDescription>
                Evolución de la calidad de datos a lo largo del tiempo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <Alert className="border-green-200 bg-green-50">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <AlertDescription>
                    <strong>Tendencia positiva:</strong> La calidad de datos ha mejorado un 12% 
                    en los últimos 4 días gracias a las correcciones aplicadas.
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">+8%</div>
                    <div className="text-sm text-gray-600">Mejora Semanal</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">89%</div>
                    <div className="text-sm text-gray-600">Meta de Calidad</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">12</div>
                    <div className="text-sm text-gray-600">Días para Meta</div>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-4">Historial de Puntuaciones</h4>
                  <div className="space-y-2">
                    {metrics.qualityTrends.map((trend, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{trend.date}</span>
                        <div className="flex items-center gap-2">
                          <Progress value={trend.score} className="w-24 h-2" />
                          <span className="text-sm font-medium">{trend.score}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
