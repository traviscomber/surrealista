"use client"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Folder, FileText, ImageIcon, MapPin, Calendar, CheckCircle, AlertCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const successCases = [
  {
    id: "1",
    name: "Valdivia 142 has Teresa F...",
    status: "complete",
    files: 9,
    rolNumbers: 2,
    lastModified: "Aug 12, 2025",
    structure: {
      "1_FOTOS": ["fotos", "fotos cel", "Fotos enero 2024"],
      "2_DOCUMENTOS": ["Fundo Iñipulli_140_110124_compressed.pdf", "MARIOUINAfoto.pdf"],
      "3_COMUNICACIONES": [],
      "4_MARKETING": [],
      "5_PDF_SUELTO": ["Orden de Venta Iñipulli.docx", "Orden de Venta TF.pdf"],
      "6_KMZ_SUELTO": ["Campo Iñipulli 140_has.kmz"],
    },
  },
  {
    id: "2",
    name: "CASA_TEMUCO_FAMILIA_RODRIGUEZ",
    status: "complete",
    files: 15,
    rolNumbers: 1,
    lastModified: "Aug 10, 2025",
    structure: {
      "1_FOTOS": ["2024-07-15", "2024-08-01", "drone_selection"],
      "2_DOCUMENTOS": ["a_antecedentes_titulo", "b_tasacion_info", "c_documentos_comerciales"],
      "3_COMUNICACIONES": ["a_interaccion_compradores", "b_interaccion_dueno"],
      "4_MARKETING": ["video_reel", "publicaciones_portales"],
      "5_PDF_SUELTO": ["presentacion_compradores.pdf"],
      "6_KMZ_SUELTO": ["ubicacion_casa_temuco.kmz"],
    },
  },
  {
    id: "3",
    name: "PARCELA_PUCON_VISTA_LAGO",
    status: "complete",
    files: 12,
    rolNumbers: 1,
    lastModified: "Aug 8, 2025",
    structure: {
      "1_FOTOS": ["2024-06-20", "2024-07-10", "drone_aereas"],
      "2_DOCUMENTOS": ["a_antecedentes_titulo", "b_tasacion_info"],
      "3_COMUNICACIONES": ["a_interaccion_compradores"],
      "4_MARKETING": ["video_promocional", "fotos_marketing"],
      "5_PDF_SUELTO": ["brochure_parcela.pdf"],
      "6_KMZ_SUELTO": ["parcela_pucon_coordenadas.kmz"],
    },
  },
  {
    id: "4",
    name: "DEPARTAMENTO_VALDIVIA_CENTRO",
    status: "incomplete",
    files: 8,
    rolNumbers: 0,
    lastModified: "Aug 5, 2025",
    structure: {
      "1_FOTOS": ["fotos_mezcladas"],
      "2_DOCUMENTOS": [],
      "3_COMUNICACIONES": [],
      "4_MARKETING": [],
      "5_PDF_SUELTO": ["documentos_varios.pdf"],
      "6_KMZ_SUELTO": [],
    },
  },
  {
    id: "5",
    name: "CASA_OSORNO_FAMILIAR",
    status: "complete",
    files: 18,
    rolNumbers: 2,
    lastModified: "Aug 3, 2025",
    structure: {
      "1_FOTOS": ["2024-05-15", "2024-06-01", "seleccion_jorge"],
      "2_DOCUMENTOS": ["a_antecedentes_titulo", "b_tasacion_info", "c_documentos_comerciales"],
      "3_COMUNICACIONES": ["a_interaccion_compradores", "c_sugerencia_clientes"],
      "4_MARKETING": ["video_reel", "publicaciones_portales"],
      "5_PDF_SUELTO": ["presentacion_final.pdf"],
      "6_KMZ_SUELTO": ["casa_osorno_ubicacion.kmz"],
    },
  },
]

function FolderStructureView({ folder }: { folder: (typeof successCases)[0] }) {
  const getStatusColor = (status: string) => {
    return status === "complete" ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"
  }

  const getStatusIcon = (status: string) => {
    return status === "complete" ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Folder className="h-5 w-5 text-blue-600" />
            {folder.name}
          </CardTitle>
          <Badge className={getStatusColor(folder.status)}>
            {getStatusIcon(folder.status)}
            {folder.status === "complete" ? "Completo" : "Incompleto"}
          </Badge>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span className="flex items-center gap-1">
            <FileText className="h-4 w-4" />
            {folder.files} archivos
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            {folder.rolNumbers} números de rol
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {folder.lastModified}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(folder.structure).map(([folderName, contents]) => (
            <div key={folderName} className="border rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Folder className="h-4 w-4 text-blue-500" />
                <span className="font-medium text-sm">{folderName}</span>
              </div>
              <div className="space-y-1">
                {contents.length > 0 ? (
                  contents.map((item, index) => (
                    <div key={index} className="flex items-center gap-2 text-xs text-gray-600">
                      {item.includes(".") ? <FileText className="h-3 w-3" /> : <Folder className="h-3 w-3" />}
                      <span className="truncate">{item}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-gray-400 italic">Vacía</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default function HomePage() {
  const currentDate = new Date().toLocaleDateString("es-CL", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const totalFiles = successCases.reduce((sum, folder) => sum + folder.files, 0)
  const totalRolNumbers = successCases.reduce((sum, folder) => sum + folder.rolNumbers, 0)
  const completeCases = successCases.filter((folder) => folder.status === "complete").length

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <TrendingUp className="h-8 w-8 text-blue-600" />
                Google Drive - Casos de Éxito
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  10 Carpetas Identificadas
                </Badge>
              </h1>
              <p className="text-gray-600 mt-1">{currentDate}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Casos Completos</p>
                <p className="text-3xl font-bold text-green-600">{completeCases}/10</p>
                <p className="text-xs text-gray-500 mt-1">Estructura estándar</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Archivos</p>
                <p className="text-3xl font-bold text-blue-600">{totalFiles}</p>
                <p className="text-xs text-gray-500 mt-1">En todas las carpetas</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Números de Rol</p>
                <p className="text-3xl font-bold text-purple-600">{totalRolNumbers}</p>
                <p className="text-xs text-gray-500 mt-1">Extraídos exitosamente</p>
              </div>
              <MapPin className="h-8 w-8 text-purple-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Fotos Organizadas</p>
                <p className="text-3xl font-bold text-orange-600">156</p>
                <p className="text-xs text-gray-500 mt-1">Por fecha y tipo</p>
              </div>
              <ImageIcon className="h-8 w-8 text-orange-500" />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Estructura de Carpetas - Casos de Éxito</h2>
            <p className="text-gray-600 mb-6">
              Visualización de las carpetas organizadas según el estándar definido en la 2da reunión dev.
            </p>
          </div>

          {successCases.map((folder) => (
            <FolderStructureView key={folder.id} folder={folder} />
          ))}
        </div>
      </div>
    </div>
  )
}
