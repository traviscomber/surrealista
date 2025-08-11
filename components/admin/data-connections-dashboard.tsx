"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Database,
  Globe,
  TrendingUp,
  MapPin,
  Building2,
  Activity,
  DollarSign,
  BarChart3,
  Wifi,
  WifiOff,
  RefreshCw,
  ExternalLink,
  Shield,
} from "lucide-react"
import { dataSourcesService } from "@/lib/integrations/data-sources"

interface ConnectionStatus {
  name: string
  status: "connected" | "disconnected" | "error"
  lastSync: string
  recordCount: number
  description: string
  icon: any
  color: string
}

export default function DataConnectionsDashboard() {
  const [connections, setConnections] = useState<ConnectionStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [marketData, setMarketData] = useState<any>(null)
  const [economicData, setEconomicData] = useState<any>(null)
  const [realEstateData, setRealEstateData] = useState<any>(null)
  // Agregar indicador visual de última actualización
  const [lastUpdate, setLastUpdate] = useState<string>("")

  useEffect(() => {
    loadConnectionsStatus()
    loadMarketData()

    // Auto-refresh cada 30 segundos
    const interval = setInterval(() => {
      loadMarketData()
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  const loadConnectionsStatus = async () => {
    setLoading(true)
    try {
      const status: ConnectionStatus[] = [
        {
          name: "Banco Central de Chile",
          status: "connected",
          lastSync: "2024-01-15T10:30:00Z",
          recordCount: 1250,
          description: "Indicadores económicos oficiales (UF, UTM, TPM)",
          icon: "Globe",
          color: "blue",
        },
        {
          name: "OpenStreetMap",
          status: "connected",
          lastSync: "2024-01-15T09:15:00Z",
          recordCount: 8900,
          description: "Datos geográficos y amenidades",
          icon: "MapPin",
          color: "green",
        },
        {
          name: "Google Drive API",
          status: "disconnected",
          lastSync: "N/A",
          recordCount: 0,
          description: "Integración pendiente - Etapa 2 del proyecto",
          icon: "Database",
          color: "gray",
        },
        {
          name: "Portal Inmobiliario",
          status: "disconnected",
          lastSync: "N/A",
          recordCount: 0,
          description: "API en desarrollo - próximamente",
          icon: "Building2",
          color: "purple",
        },
        {
          name: "SII Chile",
          status: "disconnected",
          lastSync: "N/A",
          recordCount: 0,
          description: "Integración planificada para validación de propiedades",
          icon: "Shield",
          color: "red",
        },
        {
          name: "CIREN",
          status: "disconnected",
          lastSync: "N/A",
          recordCount: 0,
          description: "Datos de recursos naturales - en evaluación",
          icon: "BarChart3",
          color: "orange",
        },
      ]
      setConnections(status)
    } catch (error) {
      console.error("Error loading connections:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadMarketData = async () => {
    try {
      const [market, economic, realEstate] = await Promise.all([
        dataSourcesService.getMarketData(),
        dataSourcesService.getEconomicIndicators(),
        dataSourcesService.getRealEstateData(),
      ])
      setMarketData(market)
      setEconomicData(economic)
      setRealEstateData(realEstate)
      setLastUpdate(new Date().toLocaleTimeString())
    } catch (error) {
      console.error("Error loading market data:", error)
    }
  }

  const refreshConnection = async (connectionName: string) => {
    // Simular refresh
    setConnections((prev) =>
      prev.map((conn) =>
        conn.name === connectionName
          ? { ...conn, lastSync: new Date().toISOString(), status: "connected" as const }
          : conn,
      ),
    )
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "connected":
        return <Wifi className="h-4 w-4 text-green-500" />
      case "disconnected":
        return <WifiOff className="h-4 w-4 text-gray-500" />
      case "error":
        return <WifiOff className="h-4 w-4 text-red-500" />
      default:
        return <WifiOff className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "connected":
        return "bg-green-100 text-green-800"
      case "disconnected":
        return "bg-gray-100 text-gray-800"
      case "error":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getIconComponent = (iconName: string) => {
    const icons: { [key: string]: any } = {
      Globe,
      Database,
      Shield,
      MapPin,
      Building2,
      BarChart3,
    }
    const IconComponent = icons[iconName] || Database
    return IconComponent
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Conexiones de Datos</h2>
          <p className="text-gray-600">
            Fuentes de datos externas y APIs conectadas
            {lastUpdate && <span className="ml-2 text-sm text-green-600">• Última actualización: {lastUpdate}</span>}
          </p>
        </div>
        <Button onClick={loadConnectionsStatus} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Actualizar
        </Button>
      </div>

      {/* Estado General */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Database className="h-4 w-4" />
              Conexiones Activas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {connections.filter((c) => c.status === "connected").length}
            </div>
            <div className="text-sm text-gray-600">de {connections.length} total</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Registros Totales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {connections.reduce((sum, c) => sum + c.recordCount, 0).toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Datos disponibles</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              UF Actual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {economicData?.uf ? `$${economicData.uf.toLocaleString()}` : "Cargando..."}
            </div>
            <div className="text-sm text-gray-600">Pesos chilenos</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Dólar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {economicData?.usd ? `$${economicData.usd.toLocaleString()}` : "Cargando..."}
            </div>
            <div className="text-sm text-gray-600">Pesos chilenos</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="connections" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="connections">Conexiones</TabsTrigger>
          <TabsTrigger value="market">Datos de Mercado</TabsTrigger>
          <TabsTrigger value="economic">Indicadores</TabsTrigger>
          <TabsTrigger value="apis">APIs Externas</TabsTrigger>
        </TabsList>

        <TabsContent value="connections">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {connections.map((connection) => {
              const IconComponent = getIconComponent(connection.icon)
              return (
                <Card key={connection.name}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <IconComponent className={`h-4 w-4 text-${connection.color}-500`} />
                        {connection.name}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(connection.status)}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => refreshConnection(connection.name)}
                          className="h-6 w-6 p-0"
                        >
                          <RefreshCw className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Estado:</span>
                        <Badge variant="outline" className={getStatusColor(connection.status)}>
                          {connection.status === "connected"
                            ? "Conectado"
                            : connection.status === "error"
                              ? "Error"
                              : "Desconectado"}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Registros:</span>
                        <span className="text-sm font-medium">{connection.recordCount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Última sync:</span>
                        <span className="text-sm font-medium">
                          {new Date(connection.lastSync).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">{connection.description}</div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="market">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Mercado Inmobiliario</CardTitle>
              </CardHeader>
              <CardContent>
                {realEstateData ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {realEstateData.averagePrice.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-600">Precio Promedio UF</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{realEstateData.transactions}</div>
                        <div className="text-sm text-gray-600">Transacciones/Mes</div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Crecimiento anual:</span>
                        <span className="text-sm font-medium text-green-600">+{realEstateData.growth}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Tiempo promedio venta:</span>
                        <span className="text-sm font-medium">{realEstateData.avgSaleTime} días</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-600">Cargando datos...</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tendencias por Región</CardTitle>
              </CardHeader>
              <CardContent>
                {realEstateData?.regions ? (
                  <div className="space-y-3">
                    {realEstateData.regions.map((region: any, index: number) => (
                      <div key={index} className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">{region.name}</div>
                          <div className="text-sm text-gray-600">{region.properties} propiedades</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{region.avgPrice.toLocaleString()} UF</div>
                          <div className={`text-sm ${region.change > 0 ? "text-green-600" : "text-red-600"}`}>
                            {region.change > 0 ? "+" : ""}
                            {region.change}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-600">Cargando regiones...</div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="economic">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Indicadores Monetarios</CardTitle>
              </CardHeader>
              <CardContent>
                {economicData ? (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">UF:</span>
                      <span className="font-medium">${economicData.uf.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">UTM:</span>
                      <span className="font-medium">${economicData.utm.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">USD:</span>
                      <span className="font-medium">${economicData.usd.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">EUR:</span>
                      <span className="font-medium">${economicData.eur.toLocaleString()}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-600">Cargando...</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Tasas de Interés</CardTitle>
              </CardHeader>
              <CardContent>
                {economicData ? (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">TPM:</span>
                      <span className="font-medium">{economicData.tpm}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Hipotecario:</span>
                      <span className="font-medium">{economicData.mortgage}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Comercial:</span>
                      <span className="font-medium">{economicData.commercial}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Consumo:</span>
                      <span className="font-medium">{economicData.consumer}%</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-600">Cargando...</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Inflación y PIB</CardTitle>
              </CardHeader>
              <CardContent>
                {economicData ? (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">IPC Anual:</span>
                      <span className="font-medium">{economicData.inflation}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">PIB:</span>
                      <span className="font-medium">{economicData.gdp}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Desempleo:</span>
                      <span className="font-medium">{economicData.unemployment}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">IMACEC:</span>
                      <span className="font-medium">{economicData.imacec}%</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-600">Cargando...</div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="apis">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>APIs Externas Disponibles</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Globe className="h-5 w-5 text-blue-500" />
                        <span className="font-medium">API Banco Central</span>
                      </div>
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        Activa
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600 mb-3">Indicadores económicos oficiales de Chile</div>
                    <Button variant="outline" size="sm" className="w-full bg-transparent">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Ver Documentación
                    </Button>
                  </div>

                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-green-500" />
                        <span className="font-medium">OpenStreetMap</span>
                      </div>
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        Activa
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600 mb-3">Datos geográficos y amenidades</div>
                    <Button variant="outline" size="sm" className="w-full bg-transparent">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Ver Documentación
                    </Button>
                  </div>

                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Database className="h-5 w-5 text-gray-500" />
                        <span className="font-medium">Google Drive API</span>
                      </div>
                      <Badge variant="outline" className="bg-gray-100 text-gray-800">
                        Desconectada
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600 mb-3">Integración pendiente - Etapa 2 del proyecto</div>
                    <Button variant="outline" size="sm" className="w-full bg-transparent" disabled>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Próximamente
                    </Button>
                  </div>

                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-purple-500" />
                        <span className="font-medium">Portal Inmobiliario</span>
                      </div>
                      <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                        En Desarrollo
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600 mb-3">Datos de mercado inmobiliario</div>
                    <Button variant="outline" size="sm" className="w-full bg-transparent" disabled>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Próximamente
                    </Button>
                  </div>

                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-red-500" />
                        <span className="font-medium">SII Chile</span>
                      </div>
                      <Badge variant="outline" className="bg-red-100 text-red-800">
                        Desconectada
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600 mb-3">
                      Integración planificada para validación de propiedades
                    </div>
                    <Button variant="outline" size="sm" className="w-full bg-transparent" disabled>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Próximamente
                    </Button>
                  </div>

                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-orange-500" />
                        <span className="font-medium">CIREN</span>
                      </div>
                      <Badge variant="outline" className="bg-orange-100 text-orange-800">
                        En Evaluación
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600 mb-3">Datos de recursos naturales</div>
                    <Button variant="outline" size="sm" className="w-full bg-transparent" disabled>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Próximamente
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Configuración de APIs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">Frecuencia de Actualización</div>
                      <div className="text-sm text-gray-600">Cada 6 horas para datos económicos</div>
                    </div>
                    <Button variant="outline" size="sm">
                      Configurar
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">Cache de Datos</div>
                      <div className="text-sm text-gray-600">Almacenamiento local por 24 horas</div>
                    </div>
                    <Button variant="outline" size="sm">
                      Limpiar Cache
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">Alertas de Fallos</div>
                      <div className="text-sm text-gray-600">Notificaciones por email</div>
                    </div>
                    <Button variant="outline" size="sm">
                      Configurar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
