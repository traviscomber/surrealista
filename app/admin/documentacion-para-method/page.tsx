"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BookOpen,
  Folder,
  FileText,
  MapPin,
  Camera,
  MessageSquare,
  Video,
  Archive,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  Lightbulb,
  Target,
  Users,
  TrendingUp,
  Search,
  Filter,
  Settings,
  Zap,
  Brain,
  Database,
  Shield,
  Workflow,
} from "lucide-react"

export default function PARAMethodDocumentation() {
  const [activeExample, setActiveExample] = useState("complete")

  const folderExamples = {
    complete: {
      name: "Valdivia 142 has Teresa F...",
      status: "complete",
      structure: {
        "1_FOTOS": {
          icon: <Camera className="h-4 w-4" />,
          color: "text-green-600",
          files: [
            "fotos/exterior_campo_iñipulli_01.jpg",
            "fotos_cel/vista_panoramica_celular.jpg",
            "Fotos_enero_2024/drone_vista_aerea_campo.jpg",
            "Fotos_enero_2024/limites_terreno_marcados.jpg",
          ],
          subfolders: ["fotos", "fotos cel", "Fotos enero 2024"],
        },
        "2_DOCUMENTOS": {
          icon: <FileText className="h-4 w-4" />,
          color: "text-blue-600",
          files: [
            "a_Antecedentes_titulo/Fundo_Iñipulli_140_110124_compressed.pdf",
            "b_Tasacion_info_campo/Tasacion_Comercial_Campo_140has.pdf",
            "c_Documentos_comerciales/MARIOUINAfoto.pdf",
          ],
          subfolders: ["a_Antecedentes_titulo", "b_Tasacion_info_campo", "c_Documentos_comerciales"],
        },
        "3_COMUNICACIONES": {
          icon: <MessageSquare className="h-4 w-4" />,
          color: "text-purple-600",
          files: [
            "a_interaccion_compradores/consulta_teresa_f_campo.pdf",
            "b_interaccion_dueno_contacto/negociacion_iñipulli_140.pdf",
          ],
          subfolders: ["a_interaccion_compradores", "b_interaccion_dueno_contacto", "c_sugerencia_clientes"],
        },
        "4_MARKETING": {
          icon: <Video className="h-4 w-4" />,
          color: "text-orange-600",
          files: ["videos_promocionales/tour_campo_iñipulli_140has.mp4", "reels_instagram/reel_campo_valdivia.mp4"],
          subfolders: ["videos_promocionales", "reels_instagram", "publicaciones_portales"],
        },
        "5_PDF_SUELTO": {
          icon: <FileText className="h-4 w-4" />,
          color: "text-red-600",
          files: ["presentacion_campo_iñipulli_140has.pdf", "brochure_fundo_valdivia_teresa_f.pdf"],
          subfolders: [],
        },
        "6_KMZ_SUELTO": {
          icon: <MapPin className="h-4 w-4" />,
          color: "text-indigo-600",
          files: ["Campo_Iñipulli_140_has.kmz", "limites_fundo_valdivia_teresa_f.kmz"],
          subfolders: [],
        },
      },
    },
    incomplete: {
      name: "Caso Éxito - Quilpué Residencial",
      status: "incomplete",
      structure: {
        "1_FOTOS": {
          icon: <Camera className="h-4 w-4" />,
          color: "text-green-600",
          files: ["fotos_preliminares/fachada_quilpue.jpg"],
          subfolders: ["fotos_preliminares"],
        },
        "2_DOCUMENTOS": {
          icon: <FileText className="h-4 w-4" />,
          color: "text-blue-600",
          files: ["a_Antecedentes_titulo/Inscripción_Propiedad.pdf", "c_Documentos_comerciales/Mandato_Exclusivo.pdf"],
          subfolders: ["a_Antecedentes_titulo", "c_Documentos_comerciales"],
        },
        "3_COMUNICACIONES": {
          icon: <MessageSquare className="h-4 w-4" />,
          color: "text-purple-600",
          files: [],
          subfolders: [],
        },
        "4_MARKETING": {
          icon: <Video className="h-4 w-4" />,
          color: "text-orange-600",
          files: [],
          subfolders: [],
        },
        "5_PDF_SUELTO": {
          icon: <FileText className="h-4 w-4" />,
          color: "text-red-600",
          files: [],
          subfolders: [],
        },
        "6_KMZ_SUELTO": {
          icon: <MapPin className="h-4 w-4" />,
          color: "text-indigo-600",
          files: [],
          subfolders: [],
        },
      },
    },
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BookOpen className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Método PARA + Sistema Sur-Realista</h1>
              <p className="text-gray-600 mt-1">
                Documentación completa del sistema de organización documental inmobiliaria
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Resumen</TabsTrigger>
            <TabsTrigger value="para-method">Método PARA</TabsTrigger>
            <TabsTrigger value="sur-realista">Sistema Sur-Realista</TabsTrigger>
            <TabsTrigger value="integration">Integración</TabsTrigger>
            <TabsTrigger value="examples">Ejemplos</TabsTrigger>
            <TabsTrigger value="best-practices">Mejores Prácticas</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-l-4 border-l-blue-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-blue-600" />
                    Objetivo del Sistema
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed">
                    Transformar Google Drive de un simple almacén de archivos en un "segundo cerebro" activo que
                    organiza la información inmobiliaria por accionabilidad, no por categorías estáticas.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-green-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    Beneficios Clave
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Reducción del 80% en tiempo de búsqueda
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Organización automática por prioridad
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Extracción inteligente de números de rol
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-600" />
                  Filosofía del "Segundo Cerebro"
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <Database className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <h3 className="font-semibold text-blue-900">Capturar</h3>
                    <p className="text-sm text-blue-700">Almacenar información de forma sistemática</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <Workflow className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <h3 className="font-semibold text-green-900">Organizar</h3>
                    <p className="text-sm text-green-700">Estructurar por accionabilidad</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <Zap className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                    <h3 className="font-semibold text-purple-900">Actuar</h3>
                    <p className="text-sm text-purple-700">Facilitar la toma de decisiones</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* PARA Method Tab */}
          <TabsContent value="para-method" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="border-l-4 border-l-red-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-700">
                    <Target className="h-5 w-5" />
                    Projects
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-3">Tareas con fecha límite específica y resultado tangible</p>
                  <div className="space-y-2">
                    <Badge variant="outline" className="text-xs">
                      Venta Parcela Pucón
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Tasación Casa Temuco
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Negociación Terreno
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-blue-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-700">
                    <Settings className="h-5 w-5" />
                    Areas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-3">Responsabilidades continuas sin fecha de finalización</p>
                  <div className="space-y-2">
                    <Badge variant="outline" className="text-xs">
                      Gestión Clientes
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Marketing Digital
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Finanzas
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-green-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-700">
                    <BookOpen className="h-5 w-5" />
                    Resources
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-3">Temas de interés y referencia para el futuro</p>
                  <div className="space-y-2">
                    <Badge variant="outline" className="text-xs">
                      Plantillas Contratos
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Estudios Mercado
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Normativas Legales
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-gray-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-700">
                    <Archive className="h-5 w-5" />
                    Archives
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-3">Elementos inactivos de las otras tres categorías</p>
                  <div className="space-y-2">
                    <Badge variant="outline" className="text-xs">
                      Ventas 2023
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Proyectos Finalizados
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Documentos Antiguos
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Workflow className="h-5 w-5 text-blue-600" />
                  Flujo de Vida de las Carpetas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-2">
                      <Target className="h-6 w-6 text-red-600" />
                    </div>
                    <p className="text-sm font-medium">Projects</p>
                    <p className="text-xs text-gray-500">Activo</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400" />
                  <div className="text-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                      <Settings className="h-6 w-6 text-blue-600" />
                    </div>
                    <p className="text-sm font-medium">Areas</p>
                    <p className="text-xs text-gray-500">Mantenimiento</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400" />
                  <div className="text-center">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-2">
                      <BookOpen className="h-6 w-6 text-green-600" />
                    </div>
                    <p className="text-sm font-medium">Resources</p>
                    <p className="text-xs text-gray-500">Referencia</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400" />
                  <div className="text-center">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                      <Archive className="h-6 w-6 text-gray-600" />
                    </div>
                    <p className="text-sm font-medium">Archives</p>
                    <p className="text-xs text-gray-500">Inactivo</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sur-Realista System Tab */}
          <TabsContent value="sur-realista" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Folder className="h-5 w-5 text-blue-600" />
                  Sistema de 6 Categorías Sur-Realista
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(folderExamples.complete.structure).map(([categoryName, category]) => (
                    <div key={categoryName} className="border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className={category.color}>{category.icon}</div>
                        <h3 className="font-semibold text-gray-900">{categoryName}</h3>
                      </div>
                      <div className="space-y-2">
                        <div className="text-sm text-gray-600">
                          <strong>Archivos:</strong> {category.files.length}
                        </div>
                        <div className="text-sm text-gray-600">
                          <strong>Subcarpetas:</strong> {category.subfolders.length}
                        </div>
                        <div className="text-xs text-gray-500">
                          {category.files.slice(0, 2).map((file, idx) => (
                            <div key={idx} className="truncate">
                              • {file}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-green-600" />
                  Convenciones de Nomenclatura
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">
                      Formato Estándar (Basado en Casos Reales Campos 2025)
                    </h4>
                    <code className="text-sm bg-white px-2 py-1 rounded border">
                      Campo_Iñipulli_140_has.kmz | Fundo_Iñipulli_140_110124_compressed.pdf | Fotos_enero_2024/
                    </code>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Ejemplos Reales Campos 2025:</h4>
                      <ul className="text-sm space-y-1 text-gray-700">
                        <li>• Campo_Iñipulli_140_has.kmz</li>
                        <li>• Fundo_Iñipulli_140_110124_compressed.pdf</li>
                        <li>• MARIOUINAfoto.pdf</li>
                        <li>• Orden_de_Venta_Iñipulli.docx</li>
                        <li>• Orden_de_Venta_TF.pdf</li>
                        <li>• Fotos_enero_2024/</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Evitar:</h4>
                      <ul className="text-sm space-y-1 text-red-600">
                        <li>• documento_final_final.pdf</li>
                        <li>• IMG_001.jpg</li>
                        <li>• Untitled document.docx</li>
                        <li>• fotos cel (sin fecha)</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Integration Tab */}
          <TabsContent value="integration" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Workflow className="h-5 w-5 text-purple-600" />
                  Integración PARA + Sur-Realista
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="font-semibold text-gray-900">Mapeo de Categorías</h3>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                          <Target className="h-5 w-5 text-red-600" />
                          <div>
                            <p className="font-medium text-red-900">Projects</p>
                            <p className="text-sm text-red-700">
                              Valdivia 142 has Teresa F, Quilpué Residencial, Viña del Mar Comercial
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                          <Settings className="h-5 w-5 text-blue-600" />
                          <div>
                            <p className="font-medium text-blue-900">Areas</p>
                            <p className="text-sm text-blue-700">Gestión fotos por fecha, documentos por categorías</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                          <BookOpen className="h-5 w-5 text-green-600" />
                          <div>
                            <p className="font-medium text-green-900">Resources</p>
                            <p className="text-sm text-green-700">
                              Templates Campo Iñipulli, nomenclatura Fundo_[Nombre]_[Hectáreas]_[Fecha], estructura 6
                              categorías
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h3 className="font-semibold text-gray-900">Estructura Híbrida</h3>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <div className="text-sm font-mono space-y-1">
                          <div>📁 1_Projects/</div>
                          <div className="ml-4">📁 Valdivia_142_has_Teresa_F/</div>
                          <div className="ml-8">📁 1_FOTOS/fotos/</div>
                          <div className="ml-8">📁 1_FOTOS/fotos_cel/</div>
                          <div className="ml-8">📁 1_FOTOS/Fotos_enero_2024/</div>
                          <div className="ml-8">📁 2_DOCUMENTOS/a_Antecedentes_titulo/</div>
                          <div className="ml-8">📁 3_COMUNICACIONES/a_interaccion_compradores/</div>
                          <div className="ml-8">📁 4_MARKETING/videos_promocionales/</div>
                          <div className="ml-8">📁 5_PDF_SUELTO/</div>
                          <div className="ml-8">📁 6_KMZ_SUELTO/Campo_Iñipulli_140_has.kmz</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-indigo-600" />
                  Funcionalidades Inteligentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg">
                    <Search className="h-8 w-8 text-blue-600 mb-3" />
                    <h3 className="font-semibold mb-2">Búsqueda Profunda</h3>
                    <p className="text-sm text-gray-600">
                      Busca en nombres de carpetas, subcarpetas y archivos simultáneamente
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <Filter className="h-8 w-8 text-green-600 mb-3" />
                    <h3 className="font-semibold mb-2">Filtros Avanzados</h3>
                    <p className="text-sm text-gray-600">
                      Filtra por estado, ubicación, tipo de propiedad, fecha y tamaño
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <MapPin className="h-8 w-8 text-purple-600 mb-3" />
                    <h3 className="font-semibold mb-2">Extracción de Rol</h3>
                    <p className="text-sm text-gray-600">
                      Identifica automáticamente números de rol chilenos en documentos
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Examples Tab */}
          <TabsContent value="examples" className="space-y-6">
            <div className="flex gap-4 mb-6">
              <Button
                variant={activeExample === "complete" ? "default" : "outline"}
                onClick={() => setActiveExample("complete")}
              >
                Caso Completo
              </Button>
              <Button
                variant={activeExample === "incomplete" ? "default" : "outline"}
                onClick={() => setActiveExample("incomplete")}
              >
                Caso Incompleto
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Folder className="h-5 w-5 text-blue-600" />
                  {folderExamples[activeExample as keyof typeof folderExamples].name}
                  <Badge
                    variant={activeExample === "complete" ? "default" : "secondary"}
                    className={
                      activeExample === "complete" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                    }
                  >
                    {activeExample === "complete" ? "Completo" : "Incompleto"}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(folderExamples[activeExample as keyof typeof folderExamples].structure).map(
                    ([categoryName, category]) => (
                      <div key={categoryName} className="border rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <div className={category.color}>{category.icon}</div>
                          <h3 className="font-semibold text-gray-900">{categoryName}</h3>
                          <Badge variant="outline" className="text-xs">
                            {category.files.length + category.subfolders.length} elementos
                          </Badge>
                        </div>

                        {category.files.length > 0 || category.subfolders.length > 0 ? (
                          <div className="ml-7 space-y-2">
                            {category.subfolders.map((subfolder, idx) => (
                              <div key={idx} className="flex items-center gap-2 py-1 px-2 bg-blue-50 rounded">
                                <Folder className="h-4 w-4 text-blue-500" />
                                <span className="text-sm text-gray-700 font-medium">{subfolder}</span>
                              </div>
                            ))}
                            {category.files.map((file, idx) => (
                              <div key={idx} className="flex items-center gap-2 py-1 px-2 bg-gray-50 rounded">
                                <FileText className="h-4 w-4 text-gray-500" />
                                <span className="text-sm text-gray-700">{file}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="ml-7 text-sm text-gray-500 italic">No hay archivos en esta categoría</div>
                        )}
                      </div>
                    ),
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Best Practices Tab */}
          <TabsContent value="best-practices" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-l-4 border-l-green-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-700">
                    <CheckCircle className="h-5 w-5" />
                    Mejores Prácticas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                      <div>
                        <p className="font-medium">Revisión Semanal</p>
                        <p className="text-sm text-gray-600">Procesa la carpeta 0_Inbox semanalmente</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                      <div>
                        <p className="font-medium">Nomenclatura Consistente</p>
                        <p className="text-sm text-gray-600">Usa siempre el formato YYYY-MM-DD_Proyecto_Tipo_Version</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                      <div>
                        <p className="font-medium">Archivado Oportuno</p>
                        <p className="text-sm text-gray-600">Mueve proyectos completados a Archives inmediatamente</p>
                      </div>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-red-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-700">
                    <AlertTriangle className="h-5 w-5" />
                    Errores Comunes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />
                      <div>
                        <p className="font-medium">Carpetas Demasiado Profundas</p>
                        <p className="text-sm text-gray-600">Evita más de 3-4 niveles de anidación</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />
                      <div>
                        <p className="font-medium">Nombres Ambiguos</p>
                        <p className="text-sm text-gray-600">No uses "final", "nuevo", "copia" en nombres</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />
                      <div>
                        <p className="font-medium">Acumulación en Projects</p>
                        <p className="text-sm text-gray-600">Mantén máximo 10-15 proyectos activos</p>
                      </div>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-yellow-600" />
                  Flujo de Trabajo Recomendado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg">
                    <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      1
                    </div>
                    <div>
                      <p className="font-medium">Captura Inmediata</p>
                      <p className="text-sm text-gray-600">
                        Guarda todos los archivos nuevos en 0_Inbox con nomenclatura correcta
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-green-50 rounded-lg">
                    <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      2
                    </div>
                    <div>
                      <p className="font-medium">Clasificación Semanal</p>
                      <p className="text-sm text-gray-600">
                        Procesa el inbox y mueve archivos a Projects, Areas o Resources
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-purple-50 rounded-lg">
                    <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      3
                    </div>
                    <div>
                      <p className="font-medium">Revisión Mensual</p>
                      <p className="text-sm text-gray-600">
                        Archiva proyectos completados y limpia carpetas innecesarias
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-indigo-600" />
                  Guía para Diferentes Roles
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2 text-blue-900">Administrador</h3>
                    <ul className="text-sm space-y-1 text-gray-700">
                      <li>• Configurar estructura inicial</li>
                      <li>• Entrenar al equipo</li>
                      <li>• Monitorear cumplimiento</li>
                      <li>• Realizar auditorías mensuales</li>
                    </ul>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2 text-green-900">Agente Inmobiliario</h3>
                    <ul className="text-sm space-y-1 text-gray-700">
                      <li>• Crear carpetas por propiedad</li>
                      <li>• Mantener documentos actualizados</li>
                      <li>• Usar nomenclatura estándar</li>
                      <li>• Archivar ventas completadas</li>
                    </ul>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2 text-purple-900">Asistente</h3>
                    <ul className="text-sm space-y-1 text-gray-700">
                      <li>• Procesar documentos entrantes</li>
                      <li>• Organizar comunicaciones</li>
                      <li>• Mantener archivos actualizados</li>
                      <li>• Generar reportes de estado</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
