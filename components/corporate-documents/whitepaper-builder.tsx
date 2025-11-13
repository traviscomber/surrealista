"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { FileText, Sparkles, Download, Eye, MapPin, Zap, Droplets, BoldIcon as RoadIcon } from "lucide-react"
import { createBrowserClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  CHILEAN_REGIONS,
  type Region,
  type Provincia,
  type Comuna,
  getProvinciasForRegion,
  getComunasForProvincia,
} from "@/lib/chile-locations"
import {
  CHILEAN_REGIONS_DETAILED,
  findLocationDetails,
  findNearestAirport,
  findNearestCities,
  findNearestPort,
  estimateTravelTime,
} from "@/lib/chile-geographic-data"

interface WhitepaperVariable {
  key: string
  label: string
  type: "text" | "textarea" | "image" | "number"
  placeholder?: string
  required: boolean
}

interface ChileRegion {
  id: string
  name: string
  code: string
}

interface ChileProvince {
  id: string
  name: string
  region_id: string
}

interface ChileCommune {
  id: string
  name: string
  province_id: string
  population: number
  nearby_towns: Array<{ name: string; distance_km: number; travel_time_mins: number }>
  water_irrigation: {
    canal_rights: boolean
    well_access: boolean
    irrigation_system: string
    water_sources: string[]
    annual_flow: string
  }
  electricity_info: {
    available: boolean
    type: string
    provider: string
    voltage: string
    capacity: string
  }
  access_roads: Array<{ name: string; type: string; distance_km: number; condition: string }>
  major_cities: Array<{ name: string; type: string; distance_km: number; travel_time_mins: number }>
}

const WHITEPAPER_VARIABLES: WhitepaperVariable[] = [
  {
    key: "property_name",
    label: "Nombre de la Propiedad",
    type: "text",
    placeholder: "Campo Los Aromos",
    required: true,
  },
  {
    key: "property_subtitle",
    label: "Subtítulo",
    type: "text",
    placeholder: "Propiedad agrícola premium",
    required: false,
  },
  { key: "hero_image", label: "Imagen Principal", type: "image", required: true },
  {
    key: "superficie_total",
    label: "Superficie Total (hectáreas)",
    type: "number",
    placeholder: "10.67",
    required: true,
  },
  { key: "ubicacion", label: "Ubicación", type: "text", placeholder: "Paine, Región Metropolitana", required: true },
  { key: "comuna", label: "Comuna", type: "text", placeholder: "Paine", required: true },
  { key: "region", label: "Región", type: "text", placeholder: "Metropolitana", required: true },
  { key: "provincia", label: "Provincia", type: "text", placeholder: "Maipo", required: false },
  { key: "poblacion", label: "Población", type: "text", placeholder: "82.000 habitantes", required: false },
  {
    key: "infraestructura",
    label: "Infraestructura",
    type: "textarea",
    placeholder: "Casa principal, bodega, galpones...",
    required: true,
  },
  {
    key: "agua_riego",
    label: "Agua y Riego",
    type: "textarea",
    placeholder: "Derechos de agua, riego tecnificado...",
    required: false,
  },
  {
    key: "servicios",
    label: "Servicios y Accesos",
    type: "textarea",
    placeholder: "Luz, camino pavimentado...",
    required: false,
  },
  {
    key: "poblados_cercanos",
    label: "Poblados Cercanos",
    type: "textarea",
    placeholder: "Santiago (35 km), Buin (15 km)...",
    required: false,
  },
  { key: "polygon_image", label: "Imagen Polígono/KMZ", type: "image", required: false },
  { key: "location_map", label: "Mapa de Ubicación", type: "image", required: false },
  { key: "photo_1", label: "Fotografía 1", type: "image", required: false },
  { key: "photo_2", label: "Fotografía 2", type: "image", required: false },
  { key: "cover_image", label: "Imagen Contraportada", type: "image", required: false },
  { key: "tour_image", label: "Imagen Recorrido Visual", type: "image", required: false },
]

const SUR_REALISTA_BRANDING = {
  company_name: "Sur Realista",
  contact_name: "Juan Eduardo Navarro Galilea",
  contact_email: "juan.navarro@sur-realista.cl",
  contact_phone: "+56 9 8694 9221",
  contact_website: "www.sur-realista.cl",
  commission: "2% + IVA",
  logo_white: "/logos/sur-realista-white.svg",
  logo_color: "/logos/sur-realista-color.svg",
  isotipo_white: "/logos/isotipo-white.svg",
  isotipo_color: "/logos/isotipo-color.svg",
  primary_color: "#4F504F",
  accent_color: "#04B6E1",
  dark_bg: "#374B5C",
}

export function WhitepaperBuilder() {
  const [isOpen, setIsOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState<"data" | "preview">("data")
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [loadingRegions, setLoadingRegions] = useState(false)
  const [loadingProvinces, setLoadingProvinces] = useState(false)
  const [loadingCommunes, setLoadingCommunes] = useState(false)
  const supabase = createBrowserClient()

  const [regions, setRegions] = useState<Region[]>(CHILEAN_REGIONS)
  const [provinces, setProvinces] = useState<Provincia[]>([])
  const [communes, setCommunes] = useState<Comuna[]>([])
  const [selectedRegion, setSelectedRegion] = useState<string>("")
  const [selectedProvince, setSelectedProvince] = useState<string>("")
  const [selectedCommune, setSelectedCommune] = useState<string>("")

  useEffect(() => {
    if (selectedRegion) {
      const provincias = getProvinciasForRegion(selectedRegion)
      setProvinces(provincias)
      setSelectedProvince("")
      setSelectedCommune("")
      setCommunes([])
    }
  }, [selectedRegion])

  useEffect(() => {
    if (selectedRegion && selectedProvince) {
      const comunas = getComunasForProvincia(selectedRegion, selectedProvince)
      setCommunes(comunas)
      setSelectedCommune("")
    }
  }, [selectedProvince])

  useEffect(() => {
    if (selectedCommune && selectedRegion && selectedProvince) {
      const region = regions.find((r) => r.code === selectedRegion)
      const province = provinces.find((p) => p.code === selectedProvince)
      const commune = communes.find((c) => c.code === selectedCommune)

      if (commune && province && region) {
        const detailedRegion = CHILEAN_REGIONS_DETAILED.find((r) => r.name === region.name)
        const communeDetails = detailedRegion?.provincias
          ?.flatMap((p) => p.comunas)
          .find((c) => c.name === commune.name)

        let waterText = ""
        let electricityText = ""
        let roadsText = ""
        let citiesText = ""
        let nearbyText = ""

        if (communeDetails?.coords) {
          const { lat, lng } = communeDetails.coords

          // Get location context
          const locationDetails = findLocationDetails(lat, lng)
          const nearestAirport = findNearestAirport(lat, lng)
          const nearestCities = findNearestCities(lat, lng, 5)
          const nearestPort = findNearestPort(lat, lng)

          // Build water/irrigation text
          waterText = `Zona de ${locationDetails.climateZone?.name || "clima templado"}
• Acceso a fuentes de agua locales
• Sistemas de riego disponibles en la región
• Consultar derechos de agua específicos`

          // Build electricity text
          electricityText = `• Electricidad disponible en la comuna
• Red eléctrica regional conectada
• Consultar capacidad específica del sector`

          // Build roads text
          if (locationDetails.nearestRegionalCapital) {
            roadsText = `• Acceso desde ${locationDetails.nearestRegionalCapital.name} (${Math.round(locationDetails.nearestRegionalCapital.distance)} km)
• Conectividad regional establecida`
          }

          // Build cities text with distances
          citiesText = nearestCities
            .map((city) => {
              const cityType =
                city.name === "Santiago"
                  ? "Capital Nacional"
                  : city.population > 200000
                    ? "Ciudad Principal"
                    : "Ciudad Regional"
              return `${city.name} (${cityType}) → ${Math.round(city.distance)} km (${estimateTravelTime(city.distance)})`
            })
            .join("\n")

          // Build nearby towns text
          if (locationDetails.nearestRegionalCapital) {
            nearbyText = `Capital Regional: ${locationDetails.nearestRegionalCapital.name} (${Math.round(locationDetails.nearestRegionalCapital.distance)} km)`
          }
          if (locationDetails.nearestProvincialCapital) {
            nearbyText += `\nCapital Provincial: ${locationDetails.nearestProvincialCapital.name} (${Math.round(locationDetails.nearestProvincialCapital.distance)} km)`
          }
          if (nearestAirport) {
            nearbyText += `\nAeropuerto más cercano: ${nearestAirport.name} (${nearestAirport.code}) - ${Math.round(nearestAirport.distance)} km`
          }
          if (nearestPort) {
            nearbyText += `\nPuerto más cercano: ${nearestPort.name} (${nearestPort.type}) - ${Math.round(nearestPort.distance)} km`
          }

          const servicesText = `${electricityText}

Accesos:
${roadsText}`

          const allNearbyText = `${nearbyText}

Ciudades importantes:
${citiesText}`

          setFormData({
            ...formData,
            comuna: commune.name,
            provincia: province.name,
            region: region.name,
            ubicacion: `${commune.name}, ${region.name}`,
            poblacion: `${communeDetails.population?.toLocaleString() || "Consultar INE"} habitantes`,
            agua_riego: waterText,
            servicios: servicesText,
            poblados_cercanos: allNearbyText,
          })

          toast.success("✨ Datos geográficos cargados automáticamente", {
            description: "Ubicación, distancias y conectividad calculadas",
          })
        } else {
          // Fallback for communes without detailed coords
          setFormData({
            ...formData,
            comuna: commune.name,
            provincia: province.name,
            region: region.name,
            ubicacion: `${commune.name}, ${region.name}`,
          })

          toast.info("Ubicación seleccionada", {
            description: "Agrega detalles específicos manualmente",
          })
        }
      }
    }
  }, [selectedCommune])

  const loadRegions = async () => {
    try {
      setLoadingRegions(true)
      console.log("[v0] Loading regions from database...")

      const { data, error } = await supabase.from("chile_regions").select("*").order("name")

      console.log("[v0] Regions query result:", { data: data?.length, error })

      if (error) throw error
      setRegions(data || [])

      if (data && data.length > 0) {
        toast.success(`${data.length} regiones cargadas`)
      } else {
        toast.warning("No hay regiones en la base de datos. Usa el botón 'Cargar Datos de Chile'")
      }
    } catch (error) {
      console.error("[v0] Error loading regions:", error)
      toast.error("Error al cargar regiones")
    } finally {
      setLoadingRegions(false)
    }
  }

  const loadProvinces = async (regionId: string) => {
    try {
      setLoadingProvinces(true)
      console.log("[v0] Loading provinces for region:", regionId)

      const { data, error } = await supabase
        .from("chile_provincias")
        .select("*")
        .eq("region_id", regionId)
        .order("name")

      console.log("[v0] Provinces query result:", { data: data?.length, error })

      if (error) throw error
      setProvinces(data || [])

      if (data && data.length > 0) {
        console.log(
          "[v0] Loaded provinces:",
          data.map((p) => p.name),
        )
      }
    } catch (error) {
      console.error("[v0] Error loading provinces:", error)
      toast.error("Error al cargar provincias")
    } finally {
      setLoadingProvinces(false)
    }
  }

  const loadCommunes = async (provinceId: string) => {
    try {
      setLoadingCommunes(true)
      console.log("[v0] Loading communes for province:", provinceId)

      const { data, error } = await supabase
        .from("chile_comunas")
        .select("*")
        .eq("provincia_id", provinceId)
        .order("name")

      console.log("[v0] Communes query result:", { data: data?.length, error })

      if (error) throw error
      setCommunes(data || [])

      if (data && data.length > 0) {
        console.log(
          "[v0] Loaded communes:",
          data.map((c) => c.name),
        )
      }
    } catch (error) {
      console.error("[v0] Error loading communes:", error)
      toast.error("Error al cargar comunas")
    } finally {
      setLoadingCommunes(false)
    }
  }

  const handleInputChange = (key: string, value: string) => {
    setFormData({ ...formData, [key]: value })
  }

  const handleImageUpload = async (key: string, file: File) => {
    try {
      const fileExt = file.name.split(".").pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `whitepaper-images/${fileName}`

      const { data, error } = await supabase.storage.from("property-images").upload(filePath, file)

      if (error) throw error

      const {
        data: { publicUrl },
      } = supabase.storage.from("property-images").getPublicUrl(filePath)

      setFormData({ ...formData, [key]: publicUrl })
      toast.success("Imagen subida exitosamente")
    } catch (error) {
      console.error("Error uploading image:", error)
      toast.error("Error al subir imagen")
    }
  }

  const handleGenerate = async () => {
    try {
      setLoading(true)

      const missingFields = WHITEPAPER_VARIABLES.filter((v) => v.required && !formData[v.key]).map((v) => v.label)

      if (missingFields.length > 0) {
        toast.error(`Campos requeridos faltantes: ${missingFields.join(", ")}`)
        return
      }

      const completeData = {
        ...SUR_REALISTA_BRANDING,
        ...formData,
      }

      const { data, error } = await supabase
        .from("generated_corporate_documents")
        .insert([
          {
            document_name: formData.property_name || "Whitepaper",
            document_data: completeData,
            status: "generated",
            created_by: "system",
          },
        ])
        .select()
        .single()

      if (error) throw error

      toast.success("Whitepaper generado exitosamente")
      setIsOpen(false)
      setFormData({})
    } catch (error) {
      console.error("Error generating whitepaper:", error)
      toast.error("Error al generar whitepaper")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-6 w-6 text-purple-600" />
                Generador de Whitepapers Sur-Realista
              </CardTitle>
              <p className="text-sm text-gray-600 mt-2">
                Crea documentos corporativos profesionales con el branding de Sur-Realista para presentar propiedades a
                clientes
              </p>
            </div>
            <Button onClick={() => setIsOpen(true)} className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Crear Whitepaper
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Whitepaper</DialogTitle>
            <DialogDescription>
              Selecciona la ubicación y completa la información de la propiedad. El sistema auto-completará: ubicación,
              población, agua/riego, electricidad, caminos y distancias a ciudades importantes.
            </DialogDescription>
          </DialogHeader>

          <Tabs
            value={currentStep}
            onValueChange={(v) => setCurrentStep(v as any)}
            className="flex-1 overflow-hidden flex flex-col"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="data">Datos de la Propiedad</TabsTrigger>
              <TabsTrigger value="preview">Vista Previa</TabsTrigger>
            </TabsList>

            <TabsContent value="data" className="flex-1 overflow-y-auto mt-4 space-y-6">
              {/* Información Básica */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Badge>1</Badge> Información Básica
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>
                      Nombre de la Propiedad
                      <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Input
                      placeholder="Campo Los Aromos"
                      value={formData.property_name || ""}
                      onChange={(e) => handleInputChange("property_name", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Subtítulo</Label>
                    <Input
                      placeholder="Propiedad agrícola premium"
                      value={formData.property_subtitle || ""}
                      onChange={(e) => handleInputChange("property_subtitle", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>
                      Superficie Total (hectáreas)
                      <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="10.67"
                      value={formData.superficie_total || ""}
                      onChange={(e) => handleInputChange("superficie_total", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Ubicación */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Badge>2</Badge> <MapPin className="h-4 w-4" /> Ubicación (Auto-completa todo)
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>
                      Región <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar región" />
                      </SelectTrigger>
                      <SelectContent>
                        {regions.map((region) => (
                          <SelectItem key={region.code} value={region.code}>
                            {region.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Provincia</Label>
                    <Select
                      value={selectedProvince}
                      onValueChange={setSelectedProvince}
                      disabled={!selectedRegion || provinces.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar provincia" />
                      </SelectTrigger>
                      <SelectContent>
                        {provinces.map((province) => (
                          <SelectItem key={province.code} value={province.code}>
                            {province.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>
                      Comuna <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Select
                      value={selectedCommune}
                      onValueChange={setSelectedCommune}
                      disabled={!selectedProvince || communes.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar comuna" />
                      </SelectTrigger>
                      <SelectContent>
                        {communes.map((commune) => (
                          <SelectItem key={commune.code} value={commune.code}>
                            {commune.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Auto-populated fields display */}
                {selectedCommune && formData.ubicacion && (
                  <div className="bg-gradient-to-r from-blue-50 to-green-50 p-4 rounded-lg border border-blue-200 space-y-4">
                    <p className="text-sm font-medium text-blue-900 flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      Datos calculados automáticamente desde coordenadas geográficas:
                    </p>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <strong className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> Ubicación:
                        </strong>{" "}
                        {formData.ubicacion}
                      </div>
                      <div>
                        <strong>Población:</strong> {formData.poblacion}
                      </div>
                    </div>

                    {formData.agua_riego && (
                      <div className="bg-white p-3 rounded border border-blue-100">
                        <strong className="flex items-center gap-1 text-blue-700 mb-2">
                          <Droplets className="h-4 w-4" /> Agua y Riego:
                        </strong>
                        <div className="text-xs whitespace-pre-line text-gray-700">{formData.agua_riego}</div>
                      </div>
                    )}

                    {formData.servicios && (
                      <div className="bg-white p-3 rounded border border-green-100">
                        <strong className="flex items-center gap-1 text-green-700 mb-2">
                          <Zap className="h-4 w-4" /> Electricidad y <RoadIcon className="h-4 w-4 ml-2" /> Accesos:
                        </strong>
                        <div className="text-xs whitespace-pre-line text-gray-700">{formData.servicios}</div>
                      </div>
                    )}

                    {formData.poblados_cercanos && (
                      <div className="bg-white p-3 rounded border border-purple-100">
                        <strong className="flex items-center gap-1 text-purple-700 mb-2">
                          <MapPin className="h-4 w-4" /> Conectividad y Ciudades:
                        </strong>
                        <div className="text-xs whitespace-pre-line text-gray-700">{formData.poblados_cercanos}</div>
                      </div>
                    )}

                    <p className="text-xs text-gray-500 italic">
                      💡 Estos datos se calculan usando las mismas librerías de /campos y /kmz-vecindario. Puedes
                      editarlos manualmente si necesitas ajustes.
                    </p>
                  </div>
                )}
              </div>

              {/* Características */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Badge>3</Badge> Características de la Propiedad
                </h3>
                <p className="text-sm text-gray-600">
                  Los campos de Agua/Riego y Servicios ya están pre-llenados. Puedes editarlos o agregar más detalles
                  específicos de la propiedad.
                </p>
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label>
                      Infraestructura
                      <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Textarea
                      placeholder="Casa principal de 240 m², bodega, galpones..."
                      value={formData.infraestructura || ""}
                      onChange={(e) => handleInputChange("infraestructura", e.target.value)}
                      rows={4}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Agua y Riego</Label>
                    <Textarea
                      placeholder="Derechos de agua, riego tecnificado, pozos profundos..."
                      value={formData.agua_riego || ""}
                      onChange={(e) => handleInputChange("agua_riego", e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Servicios y Accesos</Label>
                    <Textarea
                      placeholder="Luz trifásica, camino pavimentado, portones eléctricos..."
                      value={formData.servicios || ""}
                      onChange={(e) => handleInputChange("servicios", e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              {/* Imágenes */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Badge>4</Badge> Imágenes
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {WHITEPAPER_VARIABLES.filter((v) => v.type === "image").map((variable) => (
                    <div key={variable.key} className="space-y-2">
                      <Label>
                        {variable.label}
                        {variable.required && <span className="text-red-500 ml-1">*</span>}
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleImageUpload(variable.key, file)
                          }}
                          className="flex-1"
                        />
                        {formData[variable.key] && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(formData[variable.key], "_blank")}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Branding Sur-Realista */}
              <div className="space-y-4 bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Badge variant="secondary">Branding Sur-Realista</Badge>
                </h3>
                <p className="text-sm text-gray-600">
                  El whitepaper usará automáticamente el branding corporativo de Sur-Realista:
                </p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <strong>Contacto:</strong> {SUR_REALISTA_BRANDING.contact_name}
                  </div>
                  <div>
                    <strong>Email:</strong> {SUR_REALISTA_BRANDING.contact_email}
                  </div>
                  <div>
                    <strong>Teléfono:</strong> {SUR_REALISTA_BRANDING.contact_phone}
                  </div>
                  <div>
                    <strong>Web:</strong> {SUR_REALISTA_BRANDING.contact_website}
                  </div>
                  <div>
                    <strong>Comisión:</strong> {SUR_REALISTA_BRANDING.commission}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="preview" className="flex-1 overflow-y-auto mt-4">
              <div className="space-y-4 p-6 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-lg">Vista Previa del Whitepaper</h3>
                <div className="space-y-6">
                  {/* Slide 1: Cover */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Slide 1: Portada</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <p>
                        <strong>Logo:</strong> Sur Realista (blanco)
                      </p>
                      <p>
                        <strong>Título:</strong> {formData.property_name || "[Nombre de propiedad]"}
                      </p>
                      <p>
                        <strong>Subtítulo:</strong> {formData.property_subtitle || "[Subtítulo]"}
                      </p>
                      <p>
                        <strong>Imagen Hero:</strong> {formData.hero_image ? "✓ Cargada" : "❌ Falta"}
                      </p>
                    </CardContent>
                  </Card>

                  {/* Slide 2: Details */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Slide 2: Detalles de Propiedad</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <p>
                        <strong>Ubicación:</strong> {formData.ubicacion || "[ubicación]"}
                      </p>
                      <p>
                        <strong>Superficie:</strong> {formData.superficie_total || "[hectáreas]"} has.
                      </p>
                      <p>
                        <strong>Infraestructura:</strong> {formData.infraestructura ? "✓ Completada" : "❌ Falta"}
                      </p>
                    </CardContent>
                  </Card>

                  {/* Slide 6: Back Cover */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Slide 6: Contraportada</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <p>
                        <strong>Contacto:</strong> {SUR_REALISTA_BRANDING.contact_name}
                      </p>
                      <p>
                        <strong>Email:</strong> {SUR_REALISTA_BRANDING.contact_email}
                      </p>
                      <p>
                        <strong>Teléfono:</strong> {SUR_REALISTA_BRANDING.contact_phone}
                      </p>
                      <p>
                        <strong>Comisión:</strong> {SUR_REALISTA_BRANDING.commission}
                      </p>
                    </CardContent>
                  </Card>

                  <div className="text-center text-gray-500 py-4">
                    <p>+ 4 slides adicionales con toda la información de la propiedad</p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleGenerate} disabled={loading}>
              {loading ? "Generando..." : "Generar Whitepaper"}
              <Download className="ml-2 h-4 w-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
