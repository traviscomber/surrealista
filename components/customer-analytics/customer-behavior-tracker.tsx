"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  BarChart3,
  TrendingUp,
  MessageCircle,
  Phone,
  Mail,
  Globe,
  Share2,
  Eye,
  Target,
  ThumbsUp,
  ThumbsDown,
  AlertCircle,
  CheckCircle,
} from "lucide-react"

interface CustomerProfile {
  id: string
  name: string
  email: string
  score: number
  segment: "hot" | "warm" | "cold"
  channels: ChannelActivity[]
  sentiment: "positive" | "neutral" | "negative"
  conversionProbability: number
  lastActivity: string
  totalInteractions: number
}

interface ChannelActivity {
  channel: "email" | "whatsapp" | "phone" | "web" | "social"
  interactions: number
  lastInteraction: string
  engagement: number
}

interface Insight {
  id: string
  type: "opportunity" | "warning" | "success"
  title: string
  description: string
  action: string
  priority: "high" | "medium" | "low"
}

const mockCustomers: CustomerProfile[] = [
  {
    id: "1",
    name: "Carlos Mendoza",
    email: "carlos@inversionesdelsur.cl",
    score: 92,
    segment: "hot",
    sentiment: "positive",
    conversionProbability: 85,
    lastActivity: "2024-01-15T10:30:00",
    totalInteractions: 47,
    channels: [
      { channel: "email", interactions: 15, lastInteraction: "2024-01-15T10:30:00", engagement: 78 },
      { channel: "whatsapp", interactions: 12, lastInteraction: "2024-01-14T16:45:00", engagement: 92 },
      { channel: "phone", interactions: 8, lastInteraction: "2024-01-13T14:20:00", engagement: 95 },
      { channel: "web", interactions: 10, lastInteraction: "2024-01-15T09:15:00", engagement: 65 },
      { channel: "social", interactions: 2, lastInteraction: "2024-01-12T11:00:00", engagement: 45 },
    ],
  },
  {
    id: "2",
    name: "María González",
    email: "maria@turismopatagonia.cl",
    score: 78,
    segment: "warm",
    sentiment: "neutral",
    conversionProbability: 62,
    lastActivity: "2024-01-14T15:20:00",
    totalInteractions: 23,
    channels: [
      { channel: "email", interactions: 8, lastInteraction: "2024-01-14T15:20:00", engagement: 55 },
      { channel: "whatsapp", interactions: 6, lastInteraction: "2024-01-13T12:30:00", engagement: 70 },
      { channel: "phone", interactions: 3, lastInteraction: "2024-01-12T10:15:00", engagement: 80 },
      { channel: "web", interactions: 5, lastInteraction: "2024-01-14T14:45:00", engagement: 45 },
      { channel: "social", interactions: 1, lastInteraction: "2024-01-11T16:00:00", engagement: 30 },
    ],
  },
  {
    id: "3",
    name: "Roberto Silva",
    email: "roberto@forestallosandes.cl",
    score: 45,
    segment: "cold",
    sentiment: "negative",
    conversionProbability: 25,
    lastActivity: "2024-01-10T11:45:00",
    totalInteractions: 12,
    channels: [
      { channel: "email", interactions: 5, lastInteraction: "2024-01-10T11:45:00", engagement: 25 },
      { channel: "whatsapp", interactions: 2, lastInteraction: "2024-01-09T14:20:00", engagement: 35 },
      { channel: "phone", interactions: 1, lastInteraction: "2024-01-08T09:30:00", engagement: 60 },
      { channel: "web", interactions: 3, lastInteraction: "2024-01-10T10:15:00", engagement: 20 },
      { channel: "social", interactions: 1, lastInteraction: "2024-01-07T13:45:00", engagement: 15 },
    ],
  },
]

const mockInsights: Insight[] = [
  {
    id: "1",
    type: "opportunity",
    title: "Cliente de Alto Valor Activo",
    description: "Carlos Mendoza ha aumentado su actividad en WhatsApp un 40% esta semana",
    action: "Programar llamada de seguimiento",
    priority: "high",
  },
  {
    id: "2",
    type: "warning",
    title: "Disminución de Engagement",
    description: "Roberto Silva no ha respondido emails en los últimos 5 días",
    action: "Cambiar canal de comunicación",
    priority: "medium",
  },
  {
    id: "3",
    type: "success",
    title: "Mejora en Sentiment",
    description: "María González ha mostrado interacciones más positivas",
    action: "Enviar propuesta personalizada",
    priority: "high",
  },
]

export function CustomerBehaviorTracker() {
  const [customers] = useState<CustomerProfile[]>(mockCustomers)
  const [insights] = useState<Insight[]>(mockInsights)
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerProfile | null>(null)

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case "email":
        return <Mail className="h-4 w-4" />
      case "whatsapp":
        return <MessageCircle className="h-4 w-4" />
      case "phone":
        return <Phone className="h-4 w-4" />
      case "web":
        return <Globe className="h-4 w-4" />
      case "social":
        return <Share2 className="h-4 w-4" />
      default:
        return <Eye className="h-4 w-4" />
    }
  }

  const getSegmentColor = (segment: string) => {
    switch (segment) {
      case "hot":
        return "bg-red-100 text-red-800"
      case "warm":
        return "bg-yellow-100 text-yellow-800"
      case "cold":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return <ThumbsUp className="h-4 w-4 text-green-600" />
      case "neutral":
        return <Eye className="h-4 w-4 text-yellow-600" />
      case "negative":
        return <ThumbsDown className="h-4 w-4 text-red-600" />
      default:
        return <Eye className="h-4 w-4" />
    }
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case "opportunity":
        return <Target className="h-4 w-4 text-green-600" />
      case "warning":
        return <AlertCircle className="h-4 w-4 text-yellow-600" />
      case "success":
        return <CheckCircle className="h-4 w-4 text-blue-600" />
      default:
        return <Eye className="h-4 w-4" />
    }
  }

  const totalInteractions = customers.reduce((sum, c) => sum + c.totalInteractions, 0)
  const avgScore = customers.reduce((sum, c) => sum + c.score, 0) / customers.length
  const hotLeads = customers.filter((c) => c.segment === "hot").length

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Análisis de Comportamiento</h1>
          <p className="text-muted-foreground">Sistema Neuralia - Etapa 3</p>
        </div>
        <Button className="gap-2">
          <BarChart3 className="h-4 w-4" />
          Generar Reporte
        </Button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Interacciones</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalInteractions}</div>
            <p className="text-xs text-muted-foreground">+12% vs mes anterior</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Score Promedio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgScore.toFixed(0)}</div>
            <p className="text-xs text-muted-foreground">+5 puntos esta semana</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leads Calientes</CardTitle>
            <Target className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{hotLeads}</div>
            <p className="text-xs text-muted-foreground">Requieren atención inmediata</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversión Promedio</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(customers.reduce((sum, c) => sum + c.conversionProbability, 0) / customers.length).toFixed(0)}%
            </div>
            <p className="text-xs text-muted-foreground">Probabilidad de conversión</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="customers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="customers">Perfiles de Cliente</TabsTrigger>
          <TabsTrigger value="insights">Insights Automáticos</TabsTrigger>
          <TabsTrigger value="channels">Análisis por Canal</TabsTrigger>
        </TabsList>

        <TabsContent value="customers" className="space-y-4">
          <div className="grid gap-4">
            {customers.map((customer) => (
              <Card key={customer.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold">{customer.name}</h3>
                        <Badge className={getSegmentColor(customer.segment)}>{customer.segment.toUpperCase()}</Badge>
                        <div className="flex items-center gap-1">
                          {getSentimentIcon(customer.sentiment)}
                          <span className="text-sm capitalize">{customer.sentiment}</span>
                        </div>
                        <Badge variant="outline">Score: {customer.score}</Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Probabilidad de Conversión</p>
                          <div className="flex items-center gap-2">
                            <Progress value={customer.conversionProbability} className="flex-1" />
                            <span className="text-sm font-medium">{customer.conversionProbability}%</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Total Interacciones</p>
                          <p className="text-lg font-semibold">{customer.totalInteractions}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Última Actividad</p>
                          <p className="text-sm">{new Date(customer.lastActivity).toLocaleDateString()}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {customer.channels.map((channel) => (
                          <div
                            key={channel.channel}
                            className="flex items-center gap-1 bg-muted px-2 py-1 rounded text-sm"
                          >
                            {getChannelIcon(channel.channel)}
                            <span className="capitalize">{channel.channel}</span>
                            <Badge variant="secondary" className="text-xs">
                              {channel.interactions}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Button variant="outline" size="sm" onClick={() => setSelectedCustomer(customer)}>
                        <Eye className="h-4 w-4 mr-2" />
                        Ver Detalles
                      </Button>
                      <Button variant="outline" size="sm">
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Contactar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid gap-4">
            {insights.map((insight) => (
              <Card key={insight.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        {getInsightIcon(insight.type)}
                        <h3 className="font-semibold">{insight.title}</h3>
                        <Badge
                          variant={
                            insight.priority === "high"
                              ? "destructive"
                              : insight.priority === "medium"
                                ? "default"
                                : "secondary"
                          }
                        >
                          {insight.priority}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground">{insight.description}</p>
                      <p className="text-sm font-medium text-blue-600">{insight.action}</p>
                    </div>
                    <Button variant="outline" size="sm">
                      Actuar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="channels" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {["email", "whatsapp", "phone", "web", "social"].map((channel) => {
              const channelData = customers.reduce(
                (acc, customer) => {
                  const channelInfo = customer.channels.find((c) => c.channel === channel)
                  if (channelInfo) {
                    acc.interactions += channelInfo.interactions
                    acc.engagement += channelInfo.engagement
                    acc.count += 1
                  }
                  return acc
                },
                { interactions: 0, engagement: 0, count: 0 },
              )

              const avgEngagement = channelData.count > 0 ? channelData.engagement / channelData.count : 0

              return (
                <Card key={channel}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium capitalize">{channel}</CardTitle>
                    {getChannelIcon(channel)}
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{channelData.interactions}</div>
                    <p className="text-xs text-muted-foreground">{avgEngagement.toFixed(0)}% engagement</p>
                    <Progress value={avgEngagement} className="mt-2" />
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <Card className="fixed inset-4 z-50 bg-background border shadow-lg overflow-auto">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {selectedCustomer.name}
                  <Badge className={getSegmentColor(selectedCustomer.segment)}>
                    {selectedCustomer.segment.toUpperCase()}
                  </Badge>
                </CardTitle>
                <CardDescription>{selectedCustomer.email}</CardDescription>
              </div>
              <Button variant="outline" onClick={() => setSelectedCustomer(null)}>
                Cerrar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Score General</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{selectedCustomer.score}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Probabilidad Conversión</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{selectedCustomer.conversionProbability}%</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Total Interacciones</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{selectedCustomer.totalInteractions}</div>
                </CardContent>
              </Card>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Actividad por Canal</h3>
              <div className="space-y-3">
                {selectedCustomer.channels.map((channel) => (
                  <div key={channel.channel} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getChannelIcon(channel.channel)}
                      <div>
                        <p className="font-medium capitalize">{channel.channel}</p>
                        <p className="text-sm text-muted-foreground">
                          Última interacción: {new Date(channel.lastInteraction).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{channel.interactions} interacciones</p>
                      <p className="text-sm text-muted-foreground">{channel.engagement}% engagement</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
