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
import { Mail, MessageSquare, Globe, Users, TrendingUp, Eye, Shield, Database, Bot, BarChart3, Settings, AlertTriangle, CheckCircle } from 'lucide-react'

interface BuyerProfile {
  id: string
  name: string
  email: string
  phone: string
  interests: string[]
  interactions: number
  lastActivity: string
  score: number
  status: 'hot' | 'warm' | 'cold'
  recommendedProperties: string[]
}

interface Integration {
  id: string
  name: string
  type: 'email' | 'social' | 'messaging'
  status: 'connected' | 'disconnected' | 'error'
  lastSync: string
  dataPoints: number
}

interface AnalyticsData {
  totalProfiles: number
  activeProfiles: number
  conversions: number
  engagementRate: number
  topInterests: Array<{ interest: string; count: number }>
}

export default function BuyerLinkingSystem() {
  const [buyerProfiles, setBuyerProfiles] = useState<BuyerProfile[]>([])
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalProfiles: 0,
    activeProfiles: 0,
    conversions: 0,
    engagementRate: 0,
    topInterests: []
  })
  const [activeTab, setActiveTab] = useState("profiles")
  const [privacySettings, setPrivacySettings] = useState({
    emailAnalysis: true,
    socialMonitoring: false,
    messageProcessing: true,
    dataRetention: 90
  })

  useEffect(() => {
    loadBuyerData()
    loadIntegrations()
    loadAnalytics()
  }, [])

  const loadBuyerData = async () => {
    // Mock data for demonstration
    const mockProfiles: BuyerProfile[] = [
      {
        id: "1",
        name: "María González",
        email: "maria.gonzalez@email.com",
        phone: "+56987654321",
        interests: ["Casa familiar", "Jardín amplio", "Cerca colegios"],
        interactions: 15,
        lastActivity: "2024-01-15",
        score: 85,
        status: "hot",
        recommendedProperties: ["Casa Lago Villarrica", "Parcela Los Aromos"]
      },
      {
        id: "2",
        name: "Carlos Martínez",
        email: "carlos.martinez@email.com",
        phone: "+56912345678",
        interests: ["Inversión", "Terreno comercial", "Centro ciudad"],
        interactions: 8,
        lastActivity: "2024-01-14",
        score: 65,
        status: "warm",
        recommendedProperties: ["Local Comercial Centro", "Oficina Providencia"]
      },
      {
        id: "3",
        name: "Ana Silva",
        email: "ana.silva@email.com",
        phone: "+56998765432",
        interests: ["Primera vivienda", "Departamento", "Metro cercano"],
        interactions: 3,
        lastActivity: "2024-01-10",
        score: 35,
        status: "cold",
        recommendedProperties: ["Depto Las Condes", "Depto Ñuñoa"]
      }
    ]
    
    setBuyerProfiles(mockProfiles)
  }

  const loadIntegrations = async () => {
    const mockIntegrations: Integration[] = [
      {
        id: "gmail",
        name: "Gmail",
        type: "email",
        status: "connected",
        lastSync: "2024-01-15 10:30",
        dataPoints: 1250
      },
      {
        id: "whatsapp",
        name: "WhatsApp Business",
        type: "messaging",
        status: "connected",
        lastSync: "2024-01-15 10:25",
        dataPoints: 890
      },
      {
        id: "facebook",
        name: "Facebook",
        type: "social",
        status: "disconnected",
        lastSync: "2024-01-10 15:20",
        dataPoints: 0
      },
      {
        id: "instagram",
        name: "Instagram",
        type: "social",
        status: "error",
        lastSync: "2024-01-12 09:15",
        dataPoints: 340
      }
    ]
    
    setIntegrations(mockIntegrations)
  }

  const loadAnalytics = async () => {
    const mockAnalytics: AnalyticsData = {
      totalProfiles: 156,
      activeProfiles: 89,
      conversions: 12,
      engagementRate: 68,
      topInterests: [
        { interest: "Casa familiar", count: 45 },
        { interest: "Inversión", count: 32 },
        { interest: "Departamento", count: 28 },
        { interest: "Terreno", count: 21 },
        { interest: "Comercial", count: 18 }
      ]
    }
    
    setAnalytics(mockAnalytics)
  }

  const connectIntegration = async (integrationId: string) => {
    setIntegrations(prev => prev.map(integration => 
      integration.id === integrationId 
        ? { ...integration, status: 'connected', lastSync: new Date().toLocaleString() }
        : integration
    ))
  }

  const getStatusBadge = (status: BuyerProfile['status']) => {
    const statusConfig = {
      hot: { color: "bg-red-100 text-red-800", text: "Caliente" },
      warm: { color: "bg-yellow-100 text-yellow-800", text: "Tibio" },
      cold: { color: "bg-blue-100 text-blue-800", text: "Frío" }
    }
    
    const config = statusConfig[status]
    return <Badge className={config.color}>{config.text}</Badge>
  }

  const getIntegrationIcon = (type: Integration['type']) => {
    switch (type) {
      case 'email': return <Mail className="h-4 w-4" />
      case 'social': return <Globe className="h-4 w-4" />
      case 'messaging': return <MessageSquare className="h-4 w-4" />
      default: return <Database className="h-4 w-4" />
    }
  }

  const getIntegrationStatus = (status: Integration['status']) => {
    const statusConfig = {
      connected: { color: "bg-green-100 text-green-800", text: "Conectado", icon: CheckCircle },
      disconnected: { color: "bg-gray-100 text-gray-800", text: "Desconectado", icon: AlertTriangle },
      error: { color: "bg-red-100 text-red-800", text: "Error", icon: AlertTriangle }
    }
    
    const config = statusConfig[status]
    const Icon = config.icon
    
    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {config.text}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profiles">Perfiles</TabsTrigger>
          <TabsTrigger value="integrations">Integraciones</TabsTrigger>
          <TabsTrigger value="analytics">Análisis</TabsTrigger>
          <TabsTrigger value="privacy">Privacidad</TabsTrigger>
        </TabsList>

        {/* Buyer Profiles Tab */}
        <TabsContent value="profiles" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Perfiles de Compradores
              </CardTitle>
              <CardDescription>
                Perfiles generados automáticamente basados en interacciones multicanal
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {buyerProfiles.map((profile) => (
                  <Card key={profile.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-medium">{profile.name}</h3>
                          <div className="text-sm text-gray-600">
                            {profile.email} • {profile.phone}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right text-sm">
                            <div className="font-medium">Score: {profile.score}</div>
                            <div className="text-gray-600">{profile.interactions} interacciones</div>
                          </div>
                          {getStatusBadge(profile.status)}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium mb-2">Intereses Identificados</h4>
                          <div className="flex flex-wrap gap-1">
                            {profile.interests.map((interest, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {interest}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h4 className="font-medium mb-2">Propiedades Recomendadas</h4>
                          <div className="space-y-1">
                            {profile.recommendedProperties.map((property, index) => (
                              <div key={index} className="text-sm text-blue-600 hover:underline cursor-pointer">
                                {property}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                          Última actividad: {profile.lastActivity}
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Eye className="h-3 w-3 mr-1" />
                            Ver Historial
                          </Button>
                          <Button size="sm">
                            <Mail className="h-3 w-3 mr-1" />
                            Contactar
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="integrations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Integraciones Multicanal
              </CardTitle>
              <CardDescription>
                Conecta y gestiona las fuentes de datos de comportamiento de clientes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {integrations.map((integration) => (
                  <Card key={integration.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          {getIntegrationIcon(integration.type)}
                          <div>
                            <h3 className="font-medium">{integration.name}</h3>
                            <div className="text-sm text-gray-600 capitalize">
                              {integration.type}
                            </div>
                          </div>
                        </div>
                        {getIntegrationStatus(integration.status)}
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span>Puntos de datos:</span>
                          <span className="font-medium">{integration.dataPoints.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Última sincronización:</span>
                          <span className="text-gray-600">{integration.lastSync}</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {integration.status === 'connected' ? (
                          <Button size="sm" variant="outline" className="flex-1">
                            <Settings className="h-3 w-3 mr-1" />
                            Configurar
                          </Button>
                        ) : (
                          <Button 
                            size="sm" 
                            className="flex-1"
                            onClick={() => connectIntegration(integration.id)}
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Conectar
                          </Button>
                        )}
                        <Button size="sm" variant="outline">
                          <TrendingUp className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Alert className="mt-6">
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  <strong>Privacidad:</strong> Todas las integraciones respetan las políticas de 
                  privacidad y requieren consentimiento explícito del usuario.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{analytics.totalProfiles}</div>
                  <div className="text-sm text-gray-600">Perfiles Totales</div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{analytics.activeProfiles}</div>
                  <div className="text-sm text-gray-600">Perfiles Activos</div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">{analytics.conversions}</div>
                  <div className="text-sm text-gray-600">Conversiones</div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-600">{analytics.engagementRate}%</div>
                  <div className="text-sm text-gray-600">Engagement</div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Intereses Más Populares
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.topInterests.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{item.interest}</span>
                    <div className="flex items-center gap-3">
                      <Progress value={(item.count / analytics.topInterests[0].count) * 100} className="w-24 h-2" />
                      <span className="text-sm text-gray-600 w-8">{item.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Análisis de Comportamiento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Patrones de Comunicación</h4>
                  <div className="space-y-2 text-sm">
                    <div>• Horario preferido: 10:00 - 12:00 y 15:00 - 18:00</div>
                    <div>• Canal preferido: WhatsApp (65%), Email (25%), Llamadas (10%)</div>
                    <div>• Tiempo de respuesta promedio: 2.5 horas</div>
                    <div>• Tasa de apertura de emails: 78%</div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Tendencias de Interés</h4>
                  <div className="space-y-2 text-sm">
                    <div>• Búsquedas más frecuentes: "casa familiar" (+15%)</div>
                    <div>• Presupuesto promedio: UF 3,500 - 5,000</div>
                    <div>• Ubicaciones preferidas: Las Condes, Providencia, Ñuñoa</div>
                    <div>• Tiempo de decisión promedio: 45 días</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Privacy Tab */}
        <TabsContent value="privacy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Configuración de Privacidad
              </CardTitle>
              <CardDescription>
                Gestiona el consentimiento y la privacidad de los datos de clientes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium mb-4">Análisis de Datos</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="email-analysis">Análisis de Emails</Label>
                        <div className="text-sm text-gray-600">
                          Analizar conversaciones de correo para identificar intereses
                        </div>
                      </div>
                      <Switch
                        id="email-analysis"
                        checked={privacySettings.emailAnalysis}
                        onCheckedChange={(checked) => 
                          setPrivacySettings(prev => ({ ...prev, emailAnalysis: checked }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="social-monitoring">Monitoreo de Redes Sociales</Label>
                        <div className="text-sm text-gray-600">
                          Seguimiento de interacciones en plataformas sociales
                        </div>
                      </div>
                      <Switch
                        id="social-monitoring"
                        checked={privacySettings.socialMonitoring}
                        onCheckedChange={(checked) => 
                          setPrivacySettings(prev => ({ ...prev, socialMonitoring: checked }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="message-processing">Procesamiento de Mensajes</Label>
                        <div className="text-sm text-gray-600">
                          Análisis de conversaciones en WhatsApp y otras plataformas
                        </div>
                      </div>
                      <Switch
                        id="message-processing"
                        checked={privacySettings.messageProcessing}
                        onCheckedChange={(checked) => 
                          setPrivacySettings(prev => ({ ...prev, messageProcessing: checked }))
                        }
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-4">Retención de Datos</h4>
                  <div>
                    <Label htmlFor="data-retention">Período de retención (días)</Label>
                    <Input
                      id="data-retention"
                      type="number"
                      value={privacySettings.dataRetention}
                      onChange={(e) => 
                        setPrivacySettings(prev => ({ ...prev, dataRetention: parseInt(e.target.value) }))
                      }
                      className="mt-1 w-32"
                    />
                    <div className="text-sm text-gray-600 mt-1">
                      Los datos se eliminarán automáticamente después de este período
                    </div>
                  </div>
                </div>

                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Cumplimiento:</strong> El sistema cumple con GDPR, CCPA y la Ley de 
                    Protección de Datos Personales de Chile. Todos los usuarios deben dar 
                    consentimiento explícito antes del procesamiento de sus datos.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
