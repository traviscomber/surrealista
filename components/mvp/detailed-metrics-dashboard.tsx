"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'
import { TrendingUp, TrendingDown, Activity, Code, Bug, Zap, Users, Database, Globe, Shield } from 'lucide-react'

interface MetricCardProps {
  title: string
  value: string | number
  change: number
  changeType: "increase" | "decrease"
  icon: React.ComponentType<{ className?: string }>
  description?: string
}

const MetricCard = ({ title, value, change, changeType, icon: Icon, description }: MetricCardProps) => {
  const isPositive = changeType === "increase"
  const TrendIcon = isPositive ? TrendingUp : TrendingDown
  const trendColor = isPositive ? "text-green-500" : "text-red-500"
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className={`flex items-center text-xs ${trendColor}`}>
          <TrendIcon className="h-3 w-3 mr-1" />
          {Math.abs(change)}% desde la semana pasada
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  )
}

// Datos realistas para Etapa 1 - Proyecto inicial
const performanceData = [
  { name: 'Día 1', setup: 15, components: 3, tests: 0 },
  { name: 'Día 2', setup: 35, components: 8, tests: 2 },
  { name: 'Día 3', setup: 52, components: 15, tests: 5 },
  { name: 'Día 4', setup: 68, components: 23, tests: 12 },
  { name: 'Día 5', setup: 78, components: 31, tests: 18 },
]

const teamProductivityData = [
  { team: 'Setup', commits: 12, files: 45, hours: 8 },
  { team: 'UI Base', commits: 8, files: 23, hours: 6 },
  { team: 'Data Org', commits: 5, files: 12, hours: 4 },
  { team: 'Config', commits: 3, files: 8, hours: 2 },
]

const projectStatusData = [
  { name: 'Completado', value: 25, color: '#10B981' },
  { name: 'En Progreso', value: 45, color: '#3B82F6' },
  { name: 'Planificado', value: 20, color: '#F59E0B' },
  { name: 'Pendiente', value: 10, color: '#EF4444' },
]

export function DetailedMetricsDashboard() {
  return (
    <div className="space-y-6">
      {/* Key Performance Indicators - Etapa 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Setup Progreso"
          value="78%"
          change={15.2}
          changeType="increase"
          icon={Zap}
          description="Configuración inicial"
        />
        <MetricCard
          title="Componentes Base"
          value="31"
          change={24.0}
          changeType="increase"
          icon={Code}
          description="UI components creados"
        />
        <MetricCard
          title="Tareas Pendientes"
          value="7"
          change={12.5}
          changeType="decrease"
          icon={Bug}
          description="Setup y configuración"
        />
        <MetricCard
          title="Tests Iniciales"
          value="18"
          change={80.0}
          changeType="increase"
          icon={Shield}
          description="Tests básicos escritos"
        />
      </div>

      {/* Progress Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Progreso Diario - Etapa 1
            </CardTitle>
            <CardDescription>
              Evolución del setup y desarrollo inicial
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="setup" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  name="Setup %"
                />
                <Line 
                  type="monotone" 
                  dataKey="components" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  name="Componentes"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Productividad por Área
            </CardTitle>
            <CardDescription>
              Commits y archivos por área de trabajo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={teamProductivityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="team" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="commits" fill="#3B82F6" name="Commits" />
                <Bar dataKey="files" fill="#10B981" name="Archivos" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Project Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              Estado del Proyecto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={projectStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {projectStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {projectStatusData.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    />
                    <span>{item.name}</span>
                  </div>
                  <span className="font-medium">{item.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Configuración Base de Datos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Tablas Creadas</span>
                <span className="font-medium">8/12</span>
              </div>
              <Progress value={67} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Conexión Supabase</span>
                <span className="font-medium text-green-600">Activa</span>
              </div>
              <Progress value={100} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Datos de Prueba</span>
                <span className="font-medium">15 registros</span>
              </div>
              <Progress value={30} className="h-2" />
            </div>
            <div className="pt-2 border-t">
              <div className="flex justify-between text-sm">
                <span>Tamaño Actual</span>
                <span className="font-medium">2.1 MB</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span>Crecimiento Diario</span>
                <span className="font-medium text-blue-600">+0.3 MB</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Estado Servicios
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Vercel Deploy</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium">Activo</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Supabase DB</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium">Conectado</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Google Drive API</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm font-medium">Configurando</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">OpenAI API</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-sm font-medium">Pendiente</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">SII Chile</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-sm font-medium">No configurado</span>
                </div>
              </div>
            </div>
            <div className="pt-3 border-t">
              <div className="flex justify-between text-sm">
                <span>Servicios Activos</span>
                <span className="font-medium text-green-600">2/5</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span>En Configuración</span>
                <span className="font-medium">3</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Breakdown - Etapa 1 */}
      <Card>
        <CardHeader>
          <CardTitle>Estado Detallado por Módulo - Etapa 1</CardTitle>
          <CardDescription>
            Progreso específico de cada componente del setup inicial
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium text-blue-600 mb-2">Frontend Base</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Componentes</span>
                  <span className="font-medium">31</span>
                </div>
                <div className="flex justify-between">
                  <span>Páginas</span>
                  <span className="font-medium">8</span>
                </div>
                <div className="flex justify-between">
                  <span>Configuración</span>
                  <span className="font-medium text-green-600">85%</span>
                </div>
                <div className="flex justify-between">
                  <span>Tests</span>
                  <span className="font-medium">18</span>
                </div>
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <h4 className="font-medium text-green-600 mb-2">Base de Datos</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Tablas</span>
                  <span className="font-medium">8/12</span>
                </div>
                <div className="flex justify-between">
                  <span>Conexión</span>
                  <span className="font-medium text-green-600">OK</span>
                </div>
                <div className="flex justify-between">
                  <span>Datos Prueba</span>
                  <span className="font-medium">15 registros</span>
                </div>
                <div className="flex justify-between">
                  <span>Scripts</span>
                  <span className="font-medium">12</span>
                </div>
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <h4 className="font-medium text-purple-600 mb-2">Organización Datos</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Google Drive</span>
                  <span className="font-medium">Configurando</span>
                </div>
                <div className="flex justify-between">
                  <span>Plantillas</span>
                  <span className="font-medium">3/5</span>
                </div>
                <div className="flex justify-between">
                  <span>Importadores</span>
                  <span className="font-medium">2</span>
                </div>
                <div className="flex justify-between">
                  <span>Validadores</span>
                  <span className="font-medium">1</span>
                </div>
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <h4 className="font-medium text-orange-600 mb-2">Configuración</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Env Variables</span>
                  <span className="font-medium">8/12</span>
                </div>
                <div className="flex justify-between">
                  <span>Deploy Config</span>
                  <span className="font-medium text-green-600">OK</span>
                </div>
                <div className="flex justify-between">
                  <span>APIs Setup</span>
                  <span className="font-medium">2/5</span>
                </div>
                <div className="flex justify-between">
                  <span>Middleware</span>
                  <span className="font-medium text-yellow-600">Básico</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
