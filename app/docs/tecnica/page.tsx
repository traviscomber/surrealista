"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Code, Database, Server, Globe, Shield, Zap, Layers, GitBranch, Monitor, Settings, BookOpen, ExternalLink, Download, Copy, CheckCircle } from 'lucide-react'

export default function DocumentacionTecnicaPage() {
  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Code className="h-8 w-8 text-blue-600" />
            Documentación Técnica
          </h1>
          <p className="text-gray-600 mt-2">
            Arquitectura, especificaciones técnicas y guías de desarrollo
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge className="bg-green-500 text-white px-4 py-2 text-lg">
            v1.2.0
          </Badge>
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Descargar PDF
          </Button>
        </div>
      </div>

      {/* Quick Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg">Arquitectura</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Diseño del sistema y componentes principales
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-green-600" />
              <CardTitle className="text-lg">Base de Datos</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Esquemas, relaciones y optimizaciones
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-purple-600" />
              <CardTitle className="text-lg">APIs</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Endpoints, autenticación y ejemplos
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-red-600" />
              <CardTitle className="text-lg">Seguridad</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Protocolos y mejores prácticas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Documentation */}
      <Tabs defaultValue="architecture" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="architecture">Arquitectura</TabsTrigger>
          <TabsTrigger value="database">Base de Datos</TabsTrigger>
          <TabsTrigger value="apis">APIs</TabsTrigger>
          <TabsTrigger value="deployment">Deployment</TabsTrigger>
          <TabsTrigger value="security">Seguridad</TabsTrigger>
        </TabsList>

        <TabsContent value="architecture" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5" />
                Arquitectura del Sistema
              </CardTitle>
              <CardDescription>
                Diseño general y componentes principales de Sur-Realista
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Stack Tecnológico</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium">Frontend</span>
                      <Badge>Next.js 14 + TypeScript</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium">Backend</span>
                      <Badge>Next.js API Routes</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium">Base de Datos</span>
                      <Badge>Supabase (PostgreSQL)</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium">Autenticación</span>
                      <Badge>Supabase Auth</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium">Hosting</span>
                      <Badge>Vercel</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium">IA/ML</span>
                      <Badge>OpenAI GPT-4</Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Componentes Principales</h3>
                  <div className="space-y-3">
                    <div className="p-3 border rounded-lg">
                      <h4 className="font-medium text-blue-600">Frontend Layer</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        React components, UI/UX, estado global
                      </p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <h4 className="font-medium text-green-600">API Layer</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        REST endpoints, middleware, validaciones
                      </p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <h4 className="font-medium text-purple-600">Business Logic</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Servicios, utilidades, procesamiento IA
                      </p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <h4 className="font-medium text-orange-600">Data Layer</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        ORM, queries, migraciones, cache
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Flujo de Datos</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <pre className="text-sm overflow-x-auto">
{`Usuario → Frontend (Next.js) → API Routes → Business Logic → Supabase
                                    ↓
                              Integraciones Externas
                                    ↓
                            (SII, CIREN, OpenAI, etc.)`}
                  </pre>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Patrones de Diseño</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium">Repository Pattern</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Abstracción de acceso a datos
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium">Service Layer</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Lógica de negocio centralizada
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium">Factory Pattern</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Creación de instancias IA
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium">Observer Pattern</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Notificaciones y eventos del sistema
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="database" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Esquema de Base de Datos
              </CardTitle>
              <CardDescription>
                Estructura de datos y relaciones en PostgreSQL
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Tablas Principales</h3>
                  <div className="space-y-3">
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-medium text-blue-800">properties</h4>
                      <p className="text-sm text-blue-600 mt-1">
                        Información principal de propiedades
                      </p>
                      <div className="text-xs text-blue-600 mt-2">
                        id, title, description, price, location, type, status
                      </div>
                    </div>
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <h4 className="font-medium text-green-800">property_images</h4>
                      <p className="text-sm text-green-600 mt-1">
                        Imágenes asociadas a propiedades
                      </p>
                      <div className="text-xs text-green-600 mt-2">
                        id, property_id, url, alt_text, order
                      </div>
                    </div>
                    <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                      <h4 className="font-medium text-purple-800">users</h4>
                      <p className="text-sm text-purple-600 mt-1">
                        Usuarios del sistema
                      </p>
                      <div className="text-xs text-purple-600 mt-2">
                        id, email, name, role, created_at
                      </div>
                    </div>
                    <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                      <h4 className="font-medium text-orange-800">messages</h4>
                      <p className="text-sm text-orange-600 mt-1">
                        Sistema de mensajería
                      </p>
                      <div className="text-xs text-orange-600 mt-2">
                        id, user_id, subject, content, status
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Relaciones</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <pre className="text-sm overflow-x-auto">
{`properties
├── property_images (1:N)
├── property_features (1:N)
└── property_analytics (1:1)

users
├── messages (1:N)
├── user_preferences (1:1)
└── user_sessions (1:N)

ai_conversations
├── conversation_messages (1:N)
└── conversation_analytics (1:1)`}
                    </pre>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Índices y Optimizaciones</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium">Índices Principales</h4>
                    <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                      <li>• properties.location (GiST)</li>
                      <li>• properties.price (B-tree)</li>
                      <li>• properties.status (B-tree)</li>
                      <li>• users.email (Unique)</li>
                    </ul>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium">Optimizaciones</h4>
                    <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                      <li>• Connection pooling</li>
                      <li>• Query caching</li>
                      <li>• Lazy loading</li>
                      <li>• Pagination</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="apis" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Documentación de APIs
              </CardTitle>
              <CardDescription>
                Endpoints, autenticación y ejemplos de uso
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Endpoints Principales</h3>
                  <div className="space-y-3">
                    <div className="p-3 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-green-100 text-green-800">GET</Badge>
                        <code className="text-sm">/api/properties</code>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Obtener lista de propiedades con filtros
                      </p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-blue-100 text-blue-800">POST</Badge>
                        <code className="text-sm">/api/properties</code>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Crear nueva propiedad
                      </p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-purple-100 text-purple-800">POST</Badge>
                        <code className="text-sm">/api/ai/chat</code>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Interactuar con asistente IA
                      </p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-orange-100 text-orange-800">GET</Badge>
                        <code className="text-sm">/api/integrations/sii</code>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Datos del SII Chile
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Autenticación</h3>
                  <div className="space-y-3">
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-medium text-blue-800">JWT Tokens</h4>
                      <p className="text-sm text-blue-600 mt-1">
                        Autenticación basada en tokens JWT
                      </p>
                    </div>
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h4 className="font-medium text-green-800">Supabase Auth</h4>
                      <p className="text-sm text-green-600 mt-1">
                        Gestión de usuarios y sesiones
                      </p>
                    </div>
                    <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                      <h4 className="font-medium text-purple-800">Rate Limiting</h4>
                      <p className="text-sm text-purple-600 mt-1">
                        Límites de requests por usuario
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Ejemplo de Request</h3>
                <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                  <pre className="text-sm">
{`// GET /api/properties
curl -X GET "https://sur-realista.vercel.app/api/properties" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -G -d "location=puerto-varas" \\
     -d "minPrice=100000" \\
     -d "maxPrice=500000"

// Response
{
  "data": [
    {
      "id": "123",
      "title": "Casa con vista al lago",
      "price": 250000,
      "location": "Puerto Varas",
      "type": "house",
      "images": [...]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45
  }
}`}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deployment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                Deployment y DevOps
              </CardTitle>
              <CardDescription>
                Configuración de despliegue y CI/CD
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Entornos</h3>
                  <div className="space-y-3">
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <h4 className="font-medium text-green-800">Producción</h4>
                      <p className="text-sm text-green-600 mt-1">
                        Vercel + Supabase Production
                      </p>
                      <code className="text-xs text-green-600">
                        https://sur-realista.vercel.app
                      </code>
                    </div>
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-medium text-blue-800">Staging</h4>
                      <p className="text-sm text-blue-600 mt-1">
                        Vercel Preview + Supabase Staging
                      </p>
                      <code className="text-xs text-blue-600">
                        https://sur-realista-git-staging.vercel.app
                      </code>
                    </div>
                    <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                      <h4 className="font-medium text-purple-800">Desarrollo</h4>
                      <p className="text-sm text-purple-600 mt-1">
                        Local + Supabase Local
                      </p>
                      <code className="text-xs text-purple-600">
                        http://localhost:3000
                      </code>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">CI/CD Pipeline</h3>
                  <div className="space-y-3">
                    <div className="p-3 border rounded-lg">
                      <h4 className="font-medium">1. Code Push</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Git push a GitHub repository
                      </p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <h4 className="font-medium">2. Tests</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Jest + Testing Library + E2E
                      </p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <h4 className="font-medium">3. Build</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Next.js build + TypeScript check
                      </p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <h4 className="font-medium">4. Deploy</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Vercel automatic deployment
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Variables de Entorno</h3>
                <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                  <pre className="text-sm">
{`# Database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI Services
OPENAI_API_KEY=sk-your-openai-key

# External APIs
SII_API_KEY=your-sii-key
CIREN_API_KEY=your-ciren-key

# App Configuration
NEXT_PUBLIC_APP_URL=https://sur-realista.vercel.app
NEXTAUTH_SECRET=your-nextauth-secret`}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Seguridad y Mejores Prácticas
              </CardTitle>
              <CardDescription>
                Protocolos de seguridad implementados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Autenticación</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="text-sm">JWT con expiración</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="text-sm">Refresh tokens</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="text-sm">2FA opcional</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="text-sm">Rate limiting</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Protección de Datos</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-blue-500" />
                      <span className="text-sm">Encriptación en tránsito (HTTPS)</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-blue-500" />
                      <span className="text-sm">Encriptación en reposo</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-blue-500" />
                      <span className="text-sm">Sanitización de inputs</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-blue-500" />
                      <span className="text-sm">Validación de esquemas</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Headers de Seguridad</h3>
                <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                  <pre className="text-sm">
{`// next.config.js
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  }
]`}
                  </pre>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Monitoreo y Logs</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium">Logging</h4>
                    <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                      <li>• Requests y responses</li>
                      <li>• Errores y excepciones</li>
                      <li>• Intentos de autenticación</li>
                      <li>• Accesos no autorizados</li>
                    </ul>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium">Alertas</h4>
                    <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                      <li>• Múltiples intentos fallidos</li>
                      <li>• Patrones de tráfico anómalos</li>
                      <li>• Errores críticos del sistema</li>
                      <li>• Uso excesivo de recursos</li>
                    </ul>
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
