"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MapPin, Search, Loader2, ExternalLink, Save, Copy, Eye, EyeOff } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const COMUNAS_CHILE = [
  "AISEN",
  "ALGARROBO",
  "ALHUE",
  "ALTO BIOBIO",
  "ALTO DEL CARMEN",
  "ALTO HOSPICIO",
  "ANCUD",
  "ANDACOLLO",
  "ANGOL",
  "ANTARTICA",
  "ANTOFAGASTA",
  "ANTUCO",
  "ARAUCO",
  "ARICA",
  "BUIN",
  "BULNES",
  "CABILDO",
  "CABO DE HORNOS",
  "CALAMA",
  "CALBUCO",
  "CALDERA",
  "CALERA",
  "CALERA DE TANGO",
  "CALLE LARGA",
  "CAMARONES",
  "CAMINA",
  "CANELA",
  "CANETE",
  "CARAHUE",
  "CARTAGENA",
  "CASABLANCA",
  "CASTRO",
  "CATEMU",
  "CAUQUENES",
  "CERRILLOS",
  "CERRO NAVIA",
  "CHAITEN",
  "CHANCO",
  "CHEPICA",
  "CHIGUAYANTE",
  "CHILE CHICO",
  "CHILLAN",
  "CHILLAN VIEJO",
  "CHIMBARONGO",
  "CHOLCHOL",
  "CHONCHI",
  "CISNES",
  "COBQUECURA",
  "COCHAMO",
  "COCHRANE",
  "CODEGUA",
  "COELEMU",
  "COIHAIQUE",
  "COIHUECO",
  "COINCO",
  "COLBUN",
  "COLCHANE",
  "COLINA",
  "COLLIPULLI",
  "COLTAUCO",
  "COMBARBALA",
  "CONCEPCION",
  "CONCHALI",
  "CONCON",
  "CONSTITUCION",
  "CONTULMO",
  "COPIAPO",
  "COQUIMBO",
  "CORONEL",
  "CORRAL",
  "COYHAIQUE",
  "CUNCO",
  "CURACAUTIN",
  "CURACAVI",
  "CURACO DE VELEZ",
  "CURANILAHUE",
  "CURARREHUE",
  "CUREPTO",
  "CURICO",
  "DALCAHUE",
  "DIEGO DE ALMAGRO",
  "DONIHUE",
  "EL BOSQUE",
  "EL CARMEN",
  "EL MONTE",
  "EL QUISCO",
  "EL TABO",
  "EMPEDRADO",
  "ERCILLA",
  "ESTACION CENTRAL",
  "FLORIDA",
  "FREIRE",
  "FREIRINA",
  "FRESIA",
  "FRUTILLAR",
  "FUTALEUFU",
  "FUTRONO",
  "GALVARINO",
  "GENERAL LAGOS",
  "GORBEA",
  "GRANEROS",
  "GUAITECAS",
  "HUALAIHUE",
  "HUALANE",
  "HUALPEN",
  "HUALQUI",
  "HUARA",
  "HUASCO",
  "HUECHURABA",
  "ILLAPEL",
  "INDEPENDENCIA",
  "IQUIQUE",
  "ISLA DE MAIPO",
  "ISLA DE PASCUA",
  "JUAN FERNANDEZ",
  "LA CISTERNA",
  "LA CRUZ",
  "LA FLORIDA",
  "LA GRANJA",
  "LA HIGUERA",
  "LA LIGUA",
  "LA PINTANA",
  "LA REINA",
  "LA SERENA",
  "LA UNION",
  "LAGO RANCO",
  "LAGO VERDE",
  "LAGUNA BLANCA",
  "LAJA",
  "LAMPA",
  "LANCO",
  "LAS CABRAS",
  "LAS CONDES",
  "LAS GUAITECAS",
  "LAUTARO",
  "LEBU",
  "LICANTEN",
  "LIMACHE",
  "LINARES",
  "LITUECHE",
  "LLANQUIHUE",
  "LO BARNECHEA",
  "LO ESPEJO",
  "LO PRADO",
  "LOLOL",
  "LONCOCHE",
  "LONGAVI",
  "LONQUIMAY",
  "LOS ALAMOS",
  "LOS ANDES",
  "LOS ANGELES",
  "LOS LAGOS",
  "LOS MUERMOS",
  "LOS SAUCES",
  "LOS VILOS",
  "LOTA",
  "LUMACO",
  "MACHALI",
  "MACUL",
  "MAFIL",
  "MAIPU",
  "MALLOA",
  "MARCHIHUE",
  "MARIA ANTONIA",
  "MARIA ELENA",
  "MARIA PINTO",
  "MARIQUINA",
  "MAULE",
  "MAULLÍN",
  "MEJILLONES",
  "MELIPEUCO",
  "MELIPILLA",
  "MOLINA",
  "MONTE PATRIA",
  "MOSTAZAL",
  "MULCHEN",
  "NACIMIENTO",
  "NANCAGUA",
  "NATALES",
  "NAVIDAD",
  "NEGRETE",
  "NINHUE",
  "NIQUEN",
  "NOGALES",
  "NUEVA IMPERIAL",
  "NUNOA",
  "O'HIGGINS",
  "OLIVAR",
  "OLMUE",
  "OSORNO",
  "OVALLE",
  "PADRE HURTADO",
  "PADRE LAS CASAS",
  "PAIHUANO",
  "PAILLACO",
  "PAINE",
  "PALENA",
  "PALMILLA",
  "PANGUIPULLI",
  "PANQUEHUE",
  "PAPUDO",
  "PAREDONES",
  "PARRAL",
  "PEDRO AGUIRRE CERDA",
  "PELARCO",
  "PELLUHUE",
  "PEMUCO",
  "PENCAHUE",
  "PENCO",
  "PEÑAFLOR",
  "PEÑALOLEN",
  "PERQUENCO",
  "PETORCA",
  "PEUMO",
  "PICA",
  "PICHIDEGUA",
  "PICHILEMU",
  "PINTO",
  "PIRQUE",
  "PITRUFQUEN",
  "PLACILLA",
  "PORTEZUELO",
  "PORVENIR",
  "POZO ALMONTE",
  "PRIMAVERA",
  "PROVIDENCIA",
  "PUCHUNCAVI",
  "PUCON",
  "PUDAHUEL",
  "PUENTE ALTO",
  "PUERTO MONTT",
  "PUERTO OCTAY",
  "PUERTO VARAS",
  "PUMANQUE",
  "PUNITAQUI",
  "PUNTA ARENAS",
  "PUQUELDON",
  "PURRANQUE",
  "PUTAENDO",
  "PUTRE",
  "PUYEHUE",
  "QUEILEN",
  "QUELLON",
  "QUEMCHI",
  "QUILACO",
  "QUILICURA",
  "QUILLECO",
  "QUILLÓN",
  "QUILLOTA",
  "QUILPUE",
  "QUINCHAO",
  "QUINTA DE TILCOCO",
  "QUINTA NORMAL",
  "QUINTERO",
  "QUIRIHUE",
  "RANCAGUA",
  "RANQUIL",
  "RAUCO",
  "RECOLETA",
  "RENAICO",
  "RENCA",
  "RENGO",
  "REQUINOA",
  "RETIRO",
  "RINCONADA",
  "RIO BUENO",
  "RIO CLARO",
  "RIO HURTADO",
  "RIO IBAÑEZ",
  "RIO NEGRO",
  "ROMERAL",
  "SAAVEDRA",
  "SAGRADA FAMILIA",
  "SALAMANCA",
  "SAN ANTONIO",
  "SAN BERNARDO",
  "SAN CARLOS",
  "SAN CLEMENTE",
  "SAN ESTEBAN",
  "SAN FABIAN",
  "SAN FELIPE",
  "SAN FERNANDO",
  "SAN GREGORIO",
  "SAN IGNACIO",
  "SAN JAVIER",
  "SAN JOAQUIN",
  "SAN JOSE DE MAIPO",
  "SAN JUAN DE LA COSTA",
  "SAN MIGUEL",
  "SAN NICOLAS",
  "SAN PABLO",
  "SAN PEDRO",
  "SAN PEDRO DE ATACAMA",
  "SAN PEDRO DE LA PAZ",
  "SAN RAFAEL",
  "SAN RAMON",
  "SAN ROSENDO",
  "SAN VICENTE",
  "SANTA BARBARA",
  "SANTA CRUZ",
  "SANTA JUANA",
  "SANTA MARIA",
  "SANTIAGO",
  "SANTO DOMINGO",
  "SIERRA GORDA",
  "TALAGANTE",
  "TALCA",
  "TALCAHUANO",
  "TALTAL",
  "TEMUCO",
  "TENO",
  "TEODORO SCHMIDT",
  "TIERRA AMARILLA",
  "TIL TIL",
  "TIMAUKEL",
  "TIRUA",
  "TOCOPILLA",
  "TOLTEN",
  "TOME",
  "TORRES DEL PAINE",
  "TRAIGUEN",
  "TREHUACO",
  "TUCAPEL",
  "VALDIVIA",
  "VALLENAR",
  "VALPARAISO",
  "VICHUQUEN",
  "VICTORIA",
  "VICUÑA",
  "VILLA ALEGRE",
  "VILLA ALEMANA",
  "VILLARRICA",
  "VINA DEL MAR",
  "VITACURA",
  "YERBAS BUENAS",
  "YUMBEL",
  "YUNGAY",
  "ZAPALLAR",
]

interface CoordinateResult {
  comuna: string
  manzana: string
  predio: string
  coordinates: {
    lat: number
    lng: number
  }
  address?: string
  city?: string
  region?: string
  source: string
  extractedAt: string
}

interface SIIFormData {
  comuna: string
  manzana: string
  predio: string
}

export function SIICoordinateExtractor() {
  const [formData, setFormData] = useState<SIIFormData>({
    comuna: "",
    manzana: "",
    predio: "",
  })
  const [isExtracting, setIsExtracting] = useState(false)
  const [result, setResult] = useState<CoordinateResult | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [showForm, setShowForm] = useState(true)
  const { toast } = useToast()

  const handleExtractCoordinates = async () => {
    if (!formData.comuna || !formData.manzana || !formData.predio) {
      toast({
        title: "Error",
        description: "Por favor complete todos los campos requeridos",
        variant: "destructive",
      })
      return
    }

    setIsExtracting(true)
    try {
      const response = await fetch("/api/v1/sii/extract-coordinates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        setResult(data.data)
        toast({
          title: "Coordenadas extraídas",
          description: `Lat: ${data.data.coordinates.lat}, Lng: ${data.data.coordinates.lng}`,
        })
      } else {
        toast({
          title: "Error en extracción",
          description: data.error || "No se pudieron extraer las coordenadas",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al conectar con el servicio de extracción",
        variant: "destructive",
      })
    } finally {
      setIsExtracting(false)
    }
  }

  const handleSaveToDatabase = async () => {
    if (!result) return

    setIsSaving(true)
    try {
      const response = await fetch("/api/v1/properties/save-coordinates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(result),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Guardado exitoso",
          description: "Las coordenadas han sido guardadas en la base de datos",
        })
      } else {
        toast({
          title: "Error al guardar",
          description: data.error || "No se pudieron guardar las coordenadas",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al guardar en la base de datos",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const copyCoordinates = () => {
    if (result) {
      const coordText = `${result.coordinates.lat}, ${result.coordinates.lng}`
      navigator.clipboard.writeText(coordText)
      toast({
        title: "Copiado",
        description: "Coordenadas copiadas al portapapeles",
      })
    }
  }

  const openSIIWebsite = () => {
    window.open("https://www4.sii.cl/mapasui/internet/#/contenido/index.html", "_blank")
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              <CardTitle>BÚSQUEDA POR ROL</CardTitle>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowForm(!showForm)}>
              {showForm ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
              {showForm ? "Ocultar" : "Mostrar"}
            </Button>
          </div>
          <CardDescription>
            Extrae coordenadas desde el sitio oficial del SII usando Comuna, Manzana y Predio
          </CardDescription>
        </CardHeader>

        {showForm && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="comuna" className="text-sm font-medium">
                  * Comuna
                </Label>
                <Select
                  value={formData.comuna}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, comuna: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar comuna" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {COMUNAS_CHILE.map((comuna) => (
                      <SelectItem key={comuna} value={comuna}>
                        {comuna}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="manzana" className="text-sm font-medium">
                  * Manzana
                </Label>
                <Input
                  id="manzana"
                  placeholder="162"
                  value={formData.manzana}
                  onChange={(e) => setFormData((prev) => ({ ...prev, manzana: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="predio" className="text-sm font-medium">
                  * Predio
                </Label>
                <Input
                  id="predio"
                  placeholder="51"
                  value={formData.predio}
                  onChange={(e) => setFormData((prev) => ({ ...prev, predio: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleExtractCoordinates} disabled={isExtracting}>
                {isExtracting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Extrayendo...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Buscar
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Ocultar
              </Button>
              <Button variant="outline" onClick={openSIIWebsite}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Abrir SII
              </Button>
            </div>

            <div className="text-sm text-muted-foreground">
              <p>• Complete todos los campos requeridos (*)</p>
              <p>• El sistema accederá automáticamente al sitio del SII</p>
              <p>• Extraerá las coordenadas de latitud y longitud</p>
            </div>
          </CardContent>
        )}
      </Card>

      {result && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <MapPin className="h-5 w-5" />
              Coordenadas Extraídas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-medium">Comuna</Label>
                <p className="text-lg font-mono">{result.comuna}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Manzana</Label>
                <p className="text-lg font-mono">{result.manzana}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Predio</Label>
                <p className="text-lg font-mono">{result.predio}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Latitud</Label>
                <p className="text-lg font-mono text-blue-600">{result.coordinates.lat}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Longitud</Label>
                <p className="text-lg font-mono text-blue-600">{result.coordinates.lng}</p>
              </div>
            </div>

            {result.address && (
              <div>
                <Label className="text-sm font-medium">Dirección</Label>
                <p className="text-sm">{result.address}</p>
                {result.city && result.region && (
                  <p className="text-sm text-muted-foreground">
                    {result.city}, {result.region}
                  </p>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={copyCoordinates} variant="outline" size="sm">
                <Copy className="h-4 w-4 mr-2" />
                Copiar Coordenadas
              </Button>
              <Button onClick={handleSaveToDatabase} disabled={isSaving} size="sm">
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Guardar en BD
                  </>
                )}
              </Button>
            </div>

            <div className="text-xs text-muted-foreground">
              Extraído el: {new Date(result.extractedAt).toLocaleString("es-CL")}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instrucciones */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Cómo funciona</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p>
            1. <strong>Ingrese el número de rol</strong> en el formato estándar (ej: 12345-67)
          </p>
          <p>
            2. <strong>El sistema accederá automáticamente</strong> al sitio oficial del SII
          </p>
          <p>
            3. <strong>Extrae las coordenadas</strong> de latitud y longitud de la propiedad
          </p>
          <p>
            4. <strong>Guarda los datos</strong> en la base de datos para consultas futuras
          </p>
          <p>
            5. <strong>Proporciona las coordenadas</strong> para uso en mapas y análisis
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
