"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Download, RefreshCw, Filter, X, Save, Check } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

// Datos de ejemplo para análisis
const propertyTypeData = [
  { name: "Casa", value: 35 },
  { name: "Departamento", value: 25 },
  { name: "Terreno", value: 20 },
  { name: "Parcela", value: 15 },
  { name: "Comercial", value: 5 },
]

const locationData = [
  { name: "Pucón", value: 30 },
  { name: "Puerto Varas", value: 25 },
  { name: "Frutillar", value: 15 },
  { name: "Villarrica", value: 12 },
  { name: "Puerto Montt", value: 10 },
  { name: "Otros", value: 8 },
]

const priceRangeData = [
  { name: "< 100M", value: 15 },
  { name: "100M-200M", value: 25 },
  { name: "200M-300M", value: 30 },
  { name: "300M-500M", value: 20 },
  { name: "> 500M", value: 10 },
]

const monthlyTrendsData = [
  { name: "Ene", visitas: 1200, consultas: 350, ventas: 12 },
  { name: "Feb", visitas: 1400, consultas: 420, ventas: 15 },
  { name: "Mar", visitas: 1300, consultas: 380, ventas: 14 },
  { name: "Abr", visitas: 1500, consultas: 450, ventas: 18 },
  { name: "May", visitas: 1700, consultas: 520, ventas: 22 },
  { name: "Jun", visitas: 1600, consultas: 480, ventas: 20 },
]

const priceHistoryData = [
  { name: "2018", pucon: 2500, puertoVaras: 2700, frutillar: 2300, villarrica: 2100 },
  { name: "2019", pucon: 2700, puertoVaras: 2900, frutillar: 2500, villarrica: 2300 },
  { name: "2020", pucon: 2900, puertoVaras: 3100, frutillar: 2700, villarrica: 2500 },
  { name: "2021", pucon: 3200, puertoVaras: 3400, frutillar: 3000, villarrica: 2800 },
  { name: "2022", pucon: 3500, puertoVaras: 3700, frutillar: 3300, villarrica: 3100 },
  { name: "2023", pucon: 3800, puertoVaras: 4000, frutillar: 3600, villarrica: 3400 },
]

const propertyFeatureData = [
  { feature: "Vista al Lago", score: 9.2 },
  { feature: "Acceso a Playa", score: 8.7 },
  { feature: "Cerca de Centro", score: 7.5 },
  { feature: "Jardín Amplio", score: 7.2 },
  { feature: "Piscina", score: 6.8 },
  { feature: "Terraza", score: 6.5 },
  { feature: "Estacionamiento", score: 6.0 },
]

const clientSegmentData = [
  { name: "Inversionistas", value: 30 },
  { name: "Familias", value: 40 },
  { name: "Jubilados", value: 15 },
  { name: "Extranjeros", value: 10 },
  { name: "Otros", value: 5 },
]

const clientAgeData = [
  { name: "25-34", value: 15 },
  { name: "35-44", value: 30 },
  { name: "45-54", value: 25 },
  { name: "55-64", value: 20 },
  { name: "65+", value: 10 },
]

const clientPreferenceData = [
  { subject: "Vista", inversionista: 7, familia: 5, jubilado: 9, extranjero: 8 },
  { subject: "Ubicación", inversionista: 9, familia: 8, jubilado: 7, extranjero: 9 },
  { subject: "Precio", inversionista: 8, familia: 9, jubilado: 8, extranjero: 6 },
  { subject: "Tamaño", inversionista: 5, familia: 9, jubilado: 6, extranjero: 7 },
  { subject: "Amenidades", inversionista: 6, familia: 7, jubilado: 8, extranjero: 9 },
  { subject: "Inversión", inversionista: 10, familia: 5, jubilado: 7, extranjero: 8 },
]

const clientBehaviorData = [
  { name: "Ene", busquedas: 850, visitas: 320, consultas: 120 },
  { name: "Feb", busquedas: 940, visitas: 350, consultas: 150 },
  { name: "Mar", busquedas: 880, visitas: 310, consultas: 130 },
  { name: "Abr", busquedas: 1050, visitas: 390, consultas: 170 },
  { name: "May", busquedas: 1200, visitas: 450, consultas: 210 },
  { name: "Jun", busquedas: 1100, visitas: 420, consultas: 190 },
]

const marketPredictionData = [
  { name: "Jul", actual: 0, prediccion: 1650 },
  { name: "Ago", actual: 0, prediccion: 1720 },
  { name: "Sep", actual: 0, prediccion: 1800 },
  { name: "Oct", actual: 0, prediccion: 1650 },
  { name: "Nov", actual: 0, prediccion: 1500 },
  { name: "Dic", actual: 0, prediccion: 1400 },
]

const pricePredictionData = [
  { name: "2023", pucon: 3800, puertoVaras: 4000, frutillar: 3600, villarrica: 3400 },
  { name: "2024", pucon: 4100, puertoVaras: 4300, frutillar: 3900, villarrica: 3700 },
  { name: "2025", pucon: 4400, puertoVaras: 4600, frutillar: 4200, villarrica: 4000 },
  { name: "2026", pucon: 4700, puertoVaras: 4900, frutillar: 4500, villarrica: 4300 },
  { name: "2027", pucon: 5000, puertoVaras: 5200, frutillar: 4800, villarrica: 4600 },
]

const seasonalityData = [
  { name: "Ene", indice: 120 },
  { name: "Feb", indice: 130 },
  { name: "Mar", indice: 110 },
  { name: "Abr", indice: 90 },
  { name: "May", indice: 80 },
  { name: "Jun", indice: 70 },
  { name: "Jul", indice: 60 },
  { name: "Ago", indice: 70 },
  { name: "Sep", indice: 90 },
  { name: "Oct", indice: 100 },
  { name: "Nov", indice: 110 },
  { name: "Dic", indice: 120 },
]

const propertyComparisonData = [
  { id: 1, nombre: "Casa Lago Villarrica", precio: 350, m2: 180, dormitorios: 4, banos: 3, valoracion: 9.2 },
  { id: 2, nombre: "Parcela Puerto Varas", precio: 420, m2: 5000, dormitorios: 3, banos: 2, valoracion: 8.7 },
  { id: 3, nombre: "Depto. Centro Pucón", precio: 280, m2: 120, dormitorios: 3, banos: 2, valoracion: 8.5 },
  { id: 4, nombre: "Casa Frutillar Alto", precio: 320, m2: 160, dormitorios: 3, banos: 2, valoracion: 8.3 },
  { id: 5, nombre: "Parcela Villarrica", precio: 380, m2: 4500, dormitorios: 4, banos: 3, valoracion: 8.1 },
]

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82ca9d"]

// Añadir después de la definición de AppliedFilter
interface FilterPreset {
  id: string
  name: string
  description?: string
  filters: AppliedFilter[]
  createdAt: string
  updatedAt: string
  isDefault?: boolean
}

interface AppliedFilter {
  id: string
  category: string
  name: string
  value: string
  displayValue: string
}

export function AIDataAnalysis() {
  const [timeRange, setTimeRange] = useState("6m")
  const [activeTab, setActiveTab] = useState("overview")
  const [propertiesTab, setPropertiesTab] = useState("general")
  const [clientsTab, setClientsTab] = useState("segmentation")
  const [predictionsTab, setPredictionsTab] = useState("market")
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)

  // Añadir estos estados justo después de los estados existentes
  const [activeFilterTab, setActiveFilterTab] = useState("property")
  const [filterPreset, setFilterPreset] = useState("default")

  const [appliedFilters, setAppliedFilters] = useState<AppliedFilter[]>([])

  // Añadir después de los estados existentes
  const [savedPresets, setSavedPresets] = useState<FilterPreset[]>([])
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [newPresetName, setNewPresetName] = useState("")
  const [newPresetDescription, setNewPresetDescription] = useState("")
  const [selectedPreset, setSelectedPreset] = useState<FilterPreset | null>(null)
  const [showManagePresetsDialog, setShowManagePresetsDialog] = useState(false)
  const [editingPreset, setEditingPreset] = useState<FilterPreset | null>(null)
  const [showSuccessAlert, setShowSuccessAlert] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")

  const removeFilter = (filterId: string) => {
    setAppliedFilters(appliedFilters.filter((filter) => filter.id !== filterId))
  }

  const clearAllFilters = () => {
    setAppliedFilters([])
  }

  // Añadir después de la función clearAllFilters()

  // Cargar presets guardados desde localStorage al iniciar
  useEffect(() => {
    const loadSavedPresets = () => {
      try {
        const savedPresetsJson = localStorage.getItem("aiAnalysisPresets")
        if (savedPresetsJson) {
          const presets = JSON.parse(savedPresetsJson) as FilterPreset[]
          setSavedPresets(presets)
        } else {
          // Si no hay presets guardados, inicializar con los presets por defecto
          const defaultPresets: FilterPreset[] = [
            {
              id: "default",
              name: "Preset Predeterminado",
              description: "Configuración básica sin filtros aplicados",
              filters: [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              isDefault: true,
            },
            {
              id: "high-end",
              name: "Propiedades Premium",
              description: "Propiedades de alto valor con características exclusivas",
              filters: [
                {
                  id: "price-1",
                  category: "Propiedad",
                  name: "Precio",
                  value: "range",
                  displayValue: "> 500M",
                },
                {
                  id: "feature-1",
                  category: "Propiedad",
                  name: "Característica",
                  value: "vista-lago",
                  displayValue: "Vista al Lago",
                },
                {
                  id: "feature-2",
                  category: "Propiedad",
                  name: "Característica",
                  value: "piscina",
                  displayValue: "Piscina",
                },
              ],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              isDefault: true,
            },
            {
              id: "investment",
              name: "Oportunidades Inversión",
              description: "Propiedades con alto potencial de retorno de inversión",
              filters: [
                {
                  id: "performance-1",
                  category: "Rendimiento",
                  name: "ROI Proyectado",
                  value: "5",
                  displayValue: ">5%",
                },
                {
                  id: "location-1",
                  category: "Ubicación",
                  name: "Zona",
                  value: "costa",
                  displayValue: "Costa/Lago",
                },
              ],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              isDefault: true,
            },
            {
              id: "family",
              name: "Familias Extranjeras",
              description: "Propiedades ideales para familias extranjeras",
              filters: [
                {
                  id: "client-1",
                  category: "Cliente",
                  name: "Segmento",
                  value: "familia",
                  displayValue: "Familias",
                },
                {
                  id: "client-2",
                  category: "Cliente",
                  name: "Origen",
                  value: "internacional",
                  displayValue: "Internacional",
                },
                {
                  id: "property-1",
                  category: "Propiedad",
                  name: "Dormitorios",
                  value: "3",
                  displayValue: "3+",
                },
              ],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              isDefault: true,
            },
            {
              id: "seasonal",
              name: "Análisis Estacional",
              description: "Análisis de tendencias estacionales",
              filters: [
                {
                  id: "time-1",
                  category: "Tiempo",
                  name: "Periodo",
                  value: "1y",
                  displayValue: "Último año",
                },
                {
                  id: "time-2",
                  category: "Tiempo",
                  name: "Estacionalidad",
                  value: "adjusted",
                  displayValue: "Ajustado por estacionalidad",
                },
              ],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              isDefault: true,
            },
          ]
          setSavedPresets(defaultPresets)
          localStorage.setItem("aiAnalysisPresets", JSON.stringify(defaultPresets))
        }
      } catch (error) {
        console.error("Error loading saved presets:", error)
      }
    }

    loadSavedPresets()
  }, [])

  // Guardar un nuevo preset
  const saveCurrentFiltersAsPreset = () => {
    if (!newPresetName.trim()) return

    const newPreset: FilterPreset = {
      id: `preset-${Date.now()}`,
      name: newPresetName.trim(),
      description: newPresetDescription.trim() || undefined,
      filters: [...appliedFilters],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const updatedPresets = [...savedPresets, newPreset]
    setSavedPresets(updatedPresets)
    localStorage.setItem("aiAnalysisPresets", JSON.stringify(updatedPresets))

    setNewPresetName("")
    setNewPresetDescription("")
    setShowSaveDialog(false)

    // Mostrar mensaje de éxito
    setSuccessMessage(`Configuración "${newPreset.name}" guardada correctamente`)
    setShowSuccessAlert(true)
    setTimeout(() => setShowSuccessAlert(false), 3000)
  }

  // Cargar un preset guardado
  const loadPreset = (presetId: string) => {
    const preset = savedPresets.find((p) => p.id === presetId)
    if (preset) {
      setAppliedFilters([...preset.filters])
      setSelectedPreset(preset)

      // Mostrar mensaje de éxito
      setSuccessMessage(`Configuración "${preset.name}" cargada correctamente`)
      setShowSuccessAlert(true)
      setTimeout(() => setShowSuccessAlert(false), 3000)
    }
  }

  // Actualizar un preset existente
  const updatePreset = (presetId: string, updates: Partial<FilterPreset>) => {
    const updatedPresets = savedPresets.map((preset) =>
      preset.id === presetId
        ? {
            ...preset,
            ...updates,
            updatedAt: new Date().toISOString(),
          }
        : preset,
    )

    setSavedPresets(updatedPresets)
    localStorage.setItem("aiAnalysisPresets", JSON.stringify(updatedPresets))

    // Mostrar mensaje de éxito
    const updatedPreset = updatedPresets.find((p) => p.id === presetId)
    if (updatedPreset) {
      setSuccessMessage(`Configuración "${updatedPreset.name}" actualizada correctamente`)
      setShowSuccessAlert(true)
      setTimeout(() => setShowSuccessAlert(false), 3000)
    }
  }

  // Eliminar un preset
  const deletePreset = (presetId: string) => {
    const presetToDelete = savedPresets.find((p) => p.id === presetId)
    if (!presetToDelete || presetToDelete.isDefault) return

    const updatedPresets = savedPresets.filter((preset) => preset.id !== presetId)
    setSavedPresets(updatedPresets)
    localStorage.setItem("aiAnalysisPresets", JSON.stringify(updatedPresets))

    // Si el preset eliminado era el seleccionado, deseleccionarlo
    if (selectedPreset?.id === presetId) {
      setSelectedPreset(null)
    }

    // Mostrar mensaje de éxito
    setSuccessMessage(`Configuración "${presetToDelete.name}" eliminada correctamente`)
    setShowSuccessAlert(true)
    setTimeout(() => setShowSuccessAlert(false), 3000)
  }

  // Actualizar filtros del preset actual
  const updateCurrentPreset = () => {
    if (!selectedPreset) return

    updatePreset(selectedPreset.id, { filters: [...appliedFilters] })
  }

  // Función de ejemplo para añadir filtros (en una implementación real, esto se conectaría a los controles de filtro)
  const addExampleFilters = () => {
    // Solo añadimos filtros de ejemplo si no hay ninguno aplicado
    if (appliedFilters.length === 0) {
      setAppliedFilters([
        {
          id: "location-1",
          category: "Ubicación",
          name: "Ciudad",
          value: "pucon",
          displayValue: "Pucón",
        },
        {
          id: "property-1",
          category: "Propiedad",
          name: "Tipo",
          value: "casa",
          displayValue: "Casa",
        },
        {
          id: "property-2",
          category: "Propiedad",
          name: "Dormitorios",
          value: "3",
          displayValue: "3+",
        },
        {
          id: "price-1",
          category: "Propiedad",
          name: "Precio",
          value: "range",
          displayValue: "200M - 400M",
        },
        {
          id: "feature-1",
          category: "Propiedad",
          name: "Característica",
          value: "vista-lago",
          displayValue: "Vista al Lago",
        },
      ])
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Análisis de Datos IA</h2>
          <p className="text-gray-500">Insights y análisis generados por IA a partir de datos inmobiliarios</p>
        </div>
        <div className="flex gap-2">
          <Select defaultValue={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Periodo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1m">Último mes</SelectItem>
              <SelectItem value="3m">Últimos 3 meses</SelectItem>
              <SelectItem value="6m">Últimos 6 meses</SelectItem>
              <SelectItem value="1y">Último año</SelectItem>
              <SelectItem value="all">Todo el tiempo</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="relative"
          >
            <Filter className="h-4 w-4" />
            {appliedFilters.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                {appliedFilters.length}
              </span>
            )}
            {selectedPreset && <span className="absolute -bottom-1 -right-1 bg-green-500 w-2 h-2 rounded-full"></span>}
          </Button>
          <Button variant="outline" size="sm" onClick={addExampleFilters} className="hidden md:flex">
            <Filter className="h-4 w-4 mr-2" />
            Cargar Filtros Ejemplo
          </Button>
          <Button variant="outline" size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {appliedFilters.length > 0 && (
        <div className="bg-gray-50 p-3 rounded-lg mb-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium text-gray-700">Filtros Aplicados</h3>
            <div className="flex gap-2">
              {selectedPreset && (
                <Button variant="outline" size="sm" onClick={updateCurrentPreset} className="h-8 text-xs">
                  <Save className="h-3.5 w-3.5 mr-1" />
                  Actualizar Preset
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={clearAllFilters} className="h-8 text-xs">
                Limpiar Todos
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {appliedFilters.map((filter) => (
              <div key={filter.id} className="flex items-center bg-white border rounded-full px-3 py-1 text-sm">
                <span className="text-xs font-medium text-gray-500 mr-1">{filter.category}:</span>
                <span className="text-xs font-medium mr-1">{filter.name}</span>
                <span className="text-xs">{filter.displayValue}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFilter(filter.id)}
                  className="h-5 w-5 p-0 ml-1 rounded-full hover:bg-gray-100"
                >
                  <span className="sr-only">Eliminar</span>
                  <X className="h-3 w-3 text-gray-500" />
                </Button>
              </div>
            ))}
          </div>
          <div className="mt-2 text-xs text-gray-500">
            {appliedFilters.length === 1 ? "1 filtro aplicado" : `${appliedFilters.length} filtros aplicados`}
            {selectedPreset && <span className="ml-2 text-blue-600">• Preset: {selectedPreset.name}</span>}
          </div>
        </div>
      )}

      {/* Alerta de éxito */}
      {showSuccessAlert && (
        <Alert className="mb-4 bg-green-50 border-green-200">
          <Check className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">Operación exitosa</AlertTitle>
          <AlertDescription className="text-green-700">{successMessage}</AlertDescription>
        </Alert>
      )}

      {showAdvancedFilters && (
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-sm font-medium">Filtros Avanzados</CardTitle>
                <CardDescription>Personaliza tu análisis con filtros específicos</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar Filtros
                </Button>
                <Button variant="outline" size="sm">
                  Guardar Configuración
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="property" className="w-full">
              <TabsList className="mb-4 w-full justify-start">
                <TabsTrigger value="property">Propiedad</TabsTrigger>
                <TabsTrigger value="location">Ubicación</TabsTrigger>
                <TabsTrigger value="client">Cliente</TabsTrigger>
                <TabsTrigger value="performance">Rendimiento</TabsTrigger>
                <TabsTrigger value="time">Tiempo</TabsTrigger>
              </TabsList>

              <TabsContent value="property" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="property-type">Tipo de Propiedad</Label>
                    <Select defaultValue="all">
                      <SelectTrigger id="property-type">
                        <SelectValue placeholder="Todos los tipos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los tipos</SelectItem>
                        <SelectItem value="casa">Casa</SelectItem>
                        <SelectItem value="departamento">Departamento</SelectItem>
                        <SelectItem value="terreno">Terreno</SelectItem>
                        <SelectItem value="parcela">Parcela</SelectItem>
                        <SelectItem value="comercial">Comercial</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price-range">Rango de Precio (millones)</Label>
                    <div className="pt-2">
                      <Slider defaultValue={[100, 500]} min={0} max={1000} step={10} />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>0M</span>
                      <span>1000M</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="property-status">Estado</Label>
                    <Select defaultValue="all">
                      <SelectTrigger id="property-status">
                        <SelectValue placeholder="Todos los estados" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los estados</SelectItem>
                        <SelectItem value="venta">En Venta</SelectItem>
                        <SelectItem value="vendida">Vendida</SelectItem>
                        <SelectItem value="reservada">Reservada</SelectItem>
                        <SelectItem value="inactiva">Inactiva</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bedrooms">Dormitorios</Label>
                    <Select defaultValue="all">
                      <SelectTrigger id="bedrooms">
                        <SelectValue placeholder="Cualquiera" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Cualquiera</SelectItem>
                        <SelectItem value="1">1+</SelectItem>
                        <SelectItem value="2">2+</SelectItem>
                        <SelectItem value="3">3+</SelectItem>
                        <SelectItem value="4">4+</SelectItem>
                        <SelectItem value="5">5+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bathrooms">Baños</Label>
                    <Select defaultValue="all">
                      <SelectTrigger id="bathrooms">
                        <SelectValue placeholder="Cualquiera" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Cualquiera</SelectItem>
                        <SelectItem value="1">1+</SelectItem>
                        <SelectItem value="2">2+</SelectItem>
                        <SelectItem value="3">3+</SelectItem>
                        <SelectItem value="4">4+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="size">Tamaño (m²)</Label>
                    <div className="pt-2">
                      <Slider defaultValue={[50, 200]} min={0} max={500} step={10} />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>0m²</span>
                      <span>500m²</span>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Tabs de análisis principal */}
      <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4 w-full justify-start">
          <TabsTrigger value="overview">Visión General</TabsTrigger>
          <TabsTrigger value="properties">Propiedades</TabsTrigger>
          <TabsTrigger value="clients">Clientes</TabsTrigger>
          <TabsTrigger value="performance">Rendimiento</TabsTrigger>
          <TabsTrigger value="predictions">Predicciones</TabsTrigger>
        </TabsList>

        {/* Visión General */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Distribución por Tipo</CardTitle>
              </CardHeader>
              <CardContent className="h-[200px] flex items-center justify-center">
                <div className="w-full h-full bg-gray-100 rounded-md flex items-center justify-center">
                  {/* Aquí iría el gráfico real */}
                  <div className="text-center">
                    <div className="flex flex-wrap justify-center gap-2 mb-2">
                      {propertyTypeData.map((entry, index) => (
                        <div key={`type-${index}`} className="flex items-center">
                          <div
                            className="w-3 h-3 rounded-full mr-1"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          ></div>
                          <span className="text-xs">
                            {entry.name}: {entry.value}%
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="w-32 h-32 mx-auto rounded-full border-8 border-gray-200 relative">
                      {propertyTypeData.map((entry, index) => {
                        const rotation =
                          index > 0 ? propertyTypeData.slice(0, index).reduce((sum, item) => sum + item.value, 0) : 0
                        return (
                          <div
                            key={`pie-${index}`}
                            className="absolute inset-0 rounded-full overflow-hidden"
                            style={{
                              clipPath: `polygon(50% 50%, 50% 0%, ${50 + 50 * Math.cos(((rotation + entry.value / 2) * 3.6 * Math.PI) / 180)}% ${50 - 50 * Math.sin(((rotation + entry.value / 2) * 3.6 * Math.PI) / 180)}%, ${50 + 50 * Math.cos((rotation * 3.6 * Math.PI) / 180)}% ${50 - 50 * Math.sin((rotation * 3.6 * Math.PI) / 180)}%)`,
                              backgroundColor: COLORS[index % COLORS.length],
                            }}
                          ></div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Distribución por Ubicación</CardTitle>
              </CardHeader>
              <CardContent className="h-[200px] flex items-center justify-center">
                <div className="w-full h-full bg-gray-100 rounded-md flex items-center justify-center">
                  {/* Aquí iría el gráfico real */}
                  <div className="w-full px-4">
                    {locationData.map((entry, index) => (
                      <div key={`location-${index}`} className="mb-2">
                        <div className="flex justify-between text-xs mb-1">
                          <span>{entry.name}</span>
                          <span>{entry.value}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="h-2 rounded-full"
                            style={{
                              width: `${entry.value}%`,
                              backgroundColor: COLORS[index % COLORS.length],
                            }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Distribución por Precio</CardTitle>
              </CardHeader>
              <CardContent className="h-[200px] flex items-center justify-center">
                <div className="w-full h-full bg-gray-100 rounded-md flex items-center justify-center">
                  {/* Aquí iría el gráfico real */}
                  <div className="w-full h-full flex items-end justify-around px-4 pb-4">
                    {priceRangeData.map((entry, index) => (
                      <div key={`price-${index}`} className="flex flex-col items-center">
                        <div
                          className="w-12 rounded-t-md"
                          style={{
                            height: `${entry.value * 3}px`,
                            backgroundColor: COLORS[index % COLORS.length],
                          }}
                        ></div>
                        <span className="text-xs mt-1">{entry.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Tendencias Mensuales</CardTitle>
              <CardDescription>Visitas, consultas y ventas en los últimos 6 meses</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] flex items-center justify-center">
              <div className="w-full h-full bg-gray-100 rounded-md flex items-center justify-center">
                {/* Aquí iría el gráfico real */}
                <div className="w-full h-full flex flex-col justify-between p-4">
                  <div className="flex justify-between mb-2">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-blue-500 mr-1"></div>
                      <span className="text-xs">Visitas</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-green-500 mr-1"></div>
                      <span className="text-xs">Consultas</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-amber-500 mr-1"></div>
                      <span className="text-xs">Ventas</span>
                    </div>
                  </div>
                  <div className="flex-1 flex items-end">
                    <div className="w-full h-[200px] flex items-end justify-around">
                      {monthlyTrendsData.map((entry, index) => (
                        <div key={`trend-${index}`} className="flex items-end justify-center gap-1">
                          <div
                            className="w-3 bg-blue-500 rounded-t-sm"
                            style={{ height: `${entry.visitas / 10}px` }}
                          ></div>
                          <div
                            className="w-3 bg-green-500 rounded-t-sm"
                            style={{ height: `${entry.consultas / 2}px` }}
                          ></div>
                          <div
                            className="w-3 bg-amber-500 rounded-t-sm"
                            style={{ height: `${entry.ventas * 5}px` }}
                          ></div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-around mt-2">
                    {monthlyTrendsData.map((entry, index) => (
                      <span key={`month-${index}`} className="text-xs">
                        {entry.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Propiedades */}
        <TabsContent value="properties" className="space-y-6">
          <Tabs defaultValue={propertiesTab} value={propertiesTab} onValueChange={setPropertiesTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="features">Características</TabsTrigger>
              <TabsTrigger value="pricing">Precios</TabsTrigger>
              <TabsTrigger value="comparison">Comparativa</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Distribución por Tipo</CardTitle>
                    <CardDescription>Porcentaje de propiedades por tipo</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[300px] flex items-center justify-center">
                    <div className="w-full h-full bg-gray-100 rounded-md flex items-center justify-center">
                      {/* Aquí iría el gráfico real */}
                      <div className="text-center">
                        <div className="flex flex-wrap justify-center gap-2 mb-2">
                          {propertyTypeData.map((entry, index) => (
                            <div key={`type-detail-${index}`} className="flex items-center">
                              <div
                                className="w-3 h-3 rounded-full mr-1"
                                style={{ backgroundColor: COLORS[index % COLORS.length] }}
                              ></div>
                              <span className="text-xs">
                                {entry.name}: {entry.value}%
                              </span>
                            </div>
                          ))}
                        </div>
                        <div className="w-48 h-48 mx-auto rounded-full border-8 border-gray-200 relative">
                          {propertyTypeData.map((entry, index) => {
                            const rotation =
                              index > 0
                                ? propertyTypeData.slice(0, index).reduce((sum, item) => sum + item.value, 0)
                                : 0
                            return (
                              <div
                                key={`pie-detail-${index}`}
                                className="absolute inset-0 rounded-full overflow-hidden"
                                style={{
                                  clipPath: `polygon(50% 50%, 50% 0%, ${50 + 50 * Math.cos(((rotation + entry.value / 2) * 3.6 * Math.PI) / 180)}% ${50 - 50 * Math.sin(((rotation + entry.value / 2) * 3.6 * Math.PI) / 180)}%, ${50 + 50 * Math.cos((rotation * 3.6 * Math.PI) / 180)}% ${50 - 50 * Math.sin((rotation * 3.6 * Math.PI) / 180)}%)`,
                                  backgroundColor: COLORS[index % COLORS.length],
                                }}
                              ></div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Distribución por Ubicación</CardTitle>
                    <CardDescription>Porcentaje de propiedades por ubicación</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[300px] flex items-center justify-center">
                    <div className="w-full h-full bg-gray-100 rounded-md flex items-center justify-center">
                      {/* Aquí iría el gráfico real */}
                      <div className="w-full px-6">
                        {locationData.map((entry, index) => (
                          <div key={`location-detail-${index}`} className="mb-3">
                            <div className="flex justify-between text-sm mb-1">
                              <span>{entry.name}</span>
                              <span>{entry.value}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                              <div
                                className="h-3 rounded-full"
                                style={{
                                  width: `${entry.value}%`,
                                  backgroundColor: COLORS[index % COLORS.length],
                                }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="features" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Valoración de Características</CardTitle>
                  <CardDescription>Impacto de características en la valoración de propiedades</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center">
                  <div className="w-full h-full bg-gray-100 rounded-md flex items-center justify-center">
                    {/* Aquí iría el gráfico real */}
                    <div className="w-full px-6">
                      {propertyFeatureData.map((entry, index) => (
                        <div key={`feature-${index}`} className="mb-3">
                          <div className="flex justify-between text-sm mb-1">
                            <span>{entry.feature}</span>
                            <span>{entry.score.toFixed(1)}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div
                              className="h-3 rounded-full"
                              style={{
                                width: `${(entry.score / 10) * 100}%`,
                                backgroundColor: `hsl(${120 * (entry.score / 10)}, 70%, 60%)`,
                              }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="pricing" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Evolución de Precios por Ubicación</CardTitle>
                  <CardDescription>Precio promedio por m² en los últimos años</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center">
                  <div className="w-full h-full bg-gray-100 rounded-md flex items-center justify-center">
                    {/* Aquí iría el gráfico real */}
                    <div className="w-full h-full flex flex-col justify-between p-4">
                      <div className="flex justify-between mb-2">
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-blue-500 mr-1"></div>
                          <span className="text-xs">Pucón</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-green-500 mr-1"></div>
                          <span className="text-xs">Puerto Varas</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-amber-500 mr-1"></div>
                          <span className="text-xs">Frutillar</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-purple-500 mr-1"></div>
                          <span className="text-xs">Villarrica</span>
                        </div>
                      </div>
                      <div className="flex-1 relative">
                        {/* Líneas de tendencia */}
                        <svg className="w-full h-full absolute inset-0">
                          {/* Pucón */}
                          <polyline
                            points="30,180 110,170 190,160 270,145 350,130 430,115"
                            fill="none"
                            stroke="#3b82f6"
                            strokeWidth="2"
                          />
                          {/* Puerto Varas */}
                          <polyline
                            points="30,175 110,165 190,155 270,140 350,125 430,110"
                            fill="none"
                            stroke="#22c55e"
                            strokeWidth="2"
                          />
                          {/* Frutillar */}
                          <polyline
                            points="30,185 110,175 190,165 270,150 350,135 430,120"
                            fill="none"
                            stroke="#f59e0b"
                            strokeWidth="2"
                          />
                          {/* Villarrica */}
                          <polyline
                            points="30,190 110,180 190,170 270,155 350,140 430,125"
                            fill="none"
                            stroke="#a855f7"
                            strokeWidth="2"
                          />
                        </svg>
                      </div>
                      <div className="flex justify-between mt-2">
                        {priceHistoryData.map((entry, index) => (
                          <span key={`year-${index}`} className="text-xs">
                            {entry.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="comparison" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Comparativa de Propiedades</CardTitle>
                  <CardDescription>Análisis comparativo de propiedades destacadas</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 font-medium">Propiedad</th>
                          <th className="text-right py-2 font-medium">Precio (M)</th>
                          <th className="text-right py-2 font-medium">m²</th>
                          <th className="text-right py-2 font-medium">Dorm.</th>
                          <th className="text-right py-2 font-medium">Baños</th>
                          <th className="text-right py-2 font-medium">Valoración</th>
                        </tr>
                      </thead>
                      <tbody>
                        {propertyComparisonData.map((property) => (
                          <tr key={property.id} className="border-b">
                            <td className="py-2">{property.nombre}</td>
                            <td className="text-right py-2">{property.precio}</td>
                            <td className="text-right py-2">{property.m2}</td>
                            <td className="text-right py-2">{property.dormitorios}</td>
                            <td className="text-right py-2">{property.banos}</td>
                            <td className="text-right py-2">
                              <div className="flex items-center justify-end">
                                <span className="mr-2">{property.valoracion.toFixed(1)}</span>
                                <div className="w-16 bg-gray-200 rounded-full h-1.5">
                                  <div
                                    className="h-1.5 rounded-full"
                                    style={{
                                      width: `${(property.valoracion / 10) * 100}%`,
                                      backgroundColor: `hsl(${120 * (property.valoracion / 10)}, 70%, 60%)`,
                                    }}
                                  ></div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* Clientes */}
        <TabsContent value="clients" className="space-y-6">
          <Tabs defaultValue={clientsTab} value={clientsTab} onValueChange={setClientsTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="segmentation">Segmentación</TabsTrigger>
              <TabsTrigger value="preferences">Preferencias</TabsTrigger>
              <TabsTrigger value="behavior">Comportamiento</TabsTrigger>
            </TabsList>

            <TabsContent value="segmentation" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Segmentos de Clientes</CardTitle>
                    <CardDescription>Distribución por tipo de cliente</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[300px] flex items-center justify-center">
                    <div className="w-full h-full bg-gray-100 rounded-md flex items-center justify-center">
                      {/* Aquí iría el gráfico real */}
                      <div className="text-center">
                        <div className="flex flex-wrap justify-center gap-2 mb-2">
                          {clientSegmentData.map((entry, index) => (
                            <div key={`segment-${index}`} className="flex items-center">
                              <div
                                className="w-3 h-3 rounded-full mr-1"
                                style={{ backgroundColor: COLORS[index % COLORS.length] }}
                              ></div>
                              <span className="text-xs">
                                {entry.name}: {entry.value}%
                              </span>
                            </div>
                          ))}
                        </div>
                        <div className="w-48 h-48 mx-auto rounded-full border-8 border-gray-200 relative">
                          {clientSegmentData.map((entry, index) => {
                            const rotation =
                              index > 0
                                ? clientSegmentData.slice(0, index).reduce((sum, item) => sum + item.value, 0)
                                : 0
                            return (
                              <div
                                key={`segment-pie-${index}`}
                                className="absolute inset-0 rounded-full overflow-hidden"
                                style={{
                                  clipPath: `polygon(50% 50%, 50% 0%, ${50 + 50 * Math.cos(((rotation + entry.value / 2) * 3.6 * Math.PI) / 180)}% ${50 - 50 * Math.sin(((rotation + entry.value / 2) * 3.6 * Math.PI) / 180)}%, ${50 + 50 * Math.cos((rotation * 3.6 * Math.PI) / 180)}% ${50 - 50 * Math.sin((rotation * 3.6 * Math.PI) / 180)}%)`,
                                  backgroundColor: COLORS[index % COLORS.length],
                                }}
                              ></div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Distribución por Edad</CardTitle>
                    <CardDescription>Porcentaje de clientes por rango de edad</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[300px] flex items-center justify-center">
                    <div className="w-full h-full bg-gray-100 rounded-md flex items-center justify-center">
                      {/* Aquí iría el gráfico real */}
                      <div className="w-full h-full flex items-end justify-around px-6 pb-6">
                        {clientAgeData.map((entry, index) => (
                          <div key={`age-${index}`} className="flex flex-col items-center">
                            <div
                              className="w-16 rounded-t-md"
                              style={{
                                height: `${entry.value * 6}px`,
                                backgroundColor: COLORS[index % COLORS.length],
                              }}
                            ></div>
                            <div className="flex flex-col items-center mt-2">
                              <span className="text-xs">{entry.name}</span>
                              <span className="text-xs font-medium">{entry.value}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="preferences" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Preferencias por Segmento</CardTitle>
                  <CardDescription>Valoración de características por tipo de cliente</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center">
                  <div className="w-full h-full bg-gray-100 rounded-md flex items-center justify-center">
                    {/* Aquí iría el gráfico real */}
                    <div className="w-full px-6">
                      {clientPreferenceData.map((entry, index) => (
                        <div key={`preference-${index}`} className="mb-4">
                          <div className="flex justify-between text-sm mb-1">
                            <span>{entry.subject}</span>
                          </div>
                          <div className="flex gap-1 h-5">
                            <div
                              className="rounded-sm"
                              style={{
                                width: `${(entry.inversionista / 10) * 25}%`,
                                backgroundColor: COLORS[0],
                              }}
                            ></div>
                            <div
                              className="rounded-sm"
                              style={{
                                width: `${(entry.familia / 10) * 25}%`,
                                backgroundColor: COLORS[1],
                              }}
                            ></div>
                            <div
                              className="rounded-sm"
                              style={{
                                width: `${(entry.jubilado / 10) * 25}%`,
                                backgroundColor: COLORS[2],
                              }}
                            ></div>
                            <div
                              className="rounded-sm"
                              style={{
                                width: `${(entry.extranjero / 10) * 25}%`,
                                backgroundColor: COLORS[3],
                              }}
                            ></div>
                          </div>
                        </div>
                      ))}
                      <div className="flex justify-between text-xs mt-2">
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full mr-1" style={{ backgroundColor: COLORS[0] }}></div>
                          <span>Inversionista</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full mr-1" style={{ backgroundColor: COLORS[1] }}></div>
                          <span>Familia</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full mr-1" style={{ backgroundColor: COLORS[2] }}></div>
                          <span>Jubilado</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full mr-1" style={{ backgroundColor: COLORS[3] }}></div>
                          <span>Extranjero</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="behavior" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Comportamiento de Clientes</CardTitle>
                  <CardDescription>Actividad de clientes en los últimos 6 meses</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center">
                  <div className="w-full h-full bg-gray-100 rounded-md flex items-center justify-center">
                    {/* Aquí iría el gráfico real */}
                    <div className="w-full h-full flex flex-col justify-between p-4">
                      <div className="flex justify-between mb-2">
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-blue-500 mr-1"></div>
                          <span className="text-xs">Búsquedas</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-green-500 mr-1"></div>
                          <span className="text-xs">Visitas</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-amber-500 mr-1"></div>
                          <span className="text-xs">Consultas</span>
                        </div>
                      </div>
                      <div className="flex-1 relative">
                        {/* Líneas de tendencia */}
                        <svg className="w-full h-full absolute inset-0">
                          {/* Búsquedas */}
                          <polyline
                            points="30,150 110,140 190,145 270,130 350,110 430,120"
                            fill="none"
                            stroke="#3b82f6"
                            strokeWidth="2"
                          />
                          {/* Visitas */}
                          <polyline
                            points="30,180 110,175 190,182 270,170 350,160 430,165"
                            fill="none"
                            stroke="#22c55e"
                            strokeWidth="2"
                          />
                          {/* Consultas */}
                          <polyline
                            points="30,200 110,195 190,198 270,190 350,180 430,185"
                            fill="none"
                            stroke="#f59e0b"
                            strokeWidth="2"
                          />
                        </svg>
                      </div>
                      <div className="flex justify-between mt-2">
                        {clientBehaviorData.map((entry, index) => (
                          <span key={`behavior-month-${index}`} className="text-xs">
                            {entry.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* Predicciones */}
        <TabsContent value="predictions" className="space-y-6">
          <Tabs defaultValue={predictionsTab} value={predictionsTab} onValueChange={setPredictionsTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="market">Mercado</TabsTrigger>
              <TabsTrigger value="pricing">Precios</TabsTrigger>
              <TabsTrigger value="seasonality">Estacionalidad</TabsTrigger>
            </TabsList>

            <TabsContent value="market" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Predicción de Mercado</CardTitle>
                  <CardDescription>Proyección de actividad para los próximos 6 meses</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center">
                  <div className="w-full h-full bg-gray-100 rounded-md flex items-center justify-center">
                    {/* Aquí iría el gráfico real */}
                    <div className="w-full h-full flex flex-col justify-between p-4">
                      <div className="flex justify-between mb-2">
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-blue-500 mr-1"></div>
                          <span className="text-xs">Datos Actuales</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-purple-500 mr-1"></div>
                          <span className="text-xs">Predicción</span>
                        </div>
                      </div>
                      <div className="flex-1 relative">
                        {/* Líneas de tendencia */}
                        <svg className="w-full h-full absolute inset-0">
                          {/* Datos actuales */}
                          <polyline
                            points="30,150 110,140 190,145 270,130 350,110 430,120"
                            fill="none"
                            stroke="#3b82f6"
                            strokeWidth="2"
                          />
                          {/* Línea punteada de separación */}
                          <line
                            x1="430"
                            y1="50"
                            x2="430"
                            y2="220"
                            stroke="#888888"
                            strokeWidth="1"
                            strokeDasharray="4"
                          />
                          {/* Predicción */}
                          <polyline
                            points="430,120 510,110 590,100 670,115 750,130 830,140"
                            fill="none"
                            stroke="#a855f7"
                            strokeWidth="2"
                            strokeDasharray="4"
                          />
                        </svg>
                      </div>
                      <div className="flex justify-between mt-2">
                        <span className="text-xs">Ene</span>
                        <span className="text-xs">Feb</span>
                        <span className="text-xs">Mar</span>
                        <span className="text-xs">Abr</span>
                        <span className="text-xs">May</span>
                        <span className="text-xs">Jun</span>
                        <span className="text-xs font-medium">Jul</span>
                        <span className="text-xs font-medium">Ago</span>
                        <span className="text-xs font-medium">Sep</span>
                        <span className="text-xs font-medium">Oct</span>
                        <span className="text-xs font-medium">Nov</span>
                        <span className="text-xs font-medium">Dic</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="pricing" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Predicción de Precios</CardTitle>
                  <CardDescription>Proyección de precios por m² para los próximos 5 años</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center">
                  <div className="w-full h-full bg-gray-100 rounded-md flex items-center justify-center">
                    {/* Aquí iría el gráfico real */}
                    <div className="w-full h-full flex flex-col justify-between p-4">
                      <div className="flex justify-between mb-2">
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-blue-500 mr-1"></div>
                          <span className="text-xs">Pucón</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-green-500 mr-1"></div>
                          <span className="text-xs">Puerto Varas</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-amber-500 mr-1"></div>
                          <span className="text-xs">Frutillar</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-purple-500 mr-1"></div>
                          <span className="text-xs">Villarrica</span>
                        </div>
                      </div>
                      <div className="flex-1 relative">
                        {/* Líneas de tendencia */}
                        <svg className="w-full h-full absolute inset-0">
                          {/* Línea punteada de separación */}
                          <line
                            x1="190"
                            y1="50"
                            x2="190"
                            y2="220"
                            stroke="#888888"
                            strokeWidth="1"
                            strokeDasharray="4"
                          />
                          {/* Pucón */}
                          <polyline
                            points="30,180 110,170 190,160 270,145 350,130 430,115"
                            fill="none"
                            stroke="#3b82f6"
                            strokeWidth="2"
                          />
                          {/* Puerto Varas */}
                          <polyline
                            points="30,175 110,165 190,155 270,140 350,125 430,110"
                            fill="none"
                            stroke="#22c55e"
                            strokeWidth="2"
                          />
                          {/* Frutillar */}
                          <polyline
                            points="30,185 110,175 190,165 270,150 350,135 430,120"
                            fill="none"
                            stroke="#f59e0b"
                            strokeWidth="2"
                          />
                          {/* Villarrica */}
                          <polyline
                            points="30,190 110,180 190,170 270,155 350,140 430,125"
                            fill="none"
                            stroke="#a855f7"
                            strokeWidth="2"
                          />
                        </svg>
                      </div>
                      <div className="flex justify-between mt-2">
                        {pricePredictionData.map((entry, index) => (
                          <span key={`price-year-${index}`} className={`text-xs ${index > 0 ? "font-medium" : ""}`}>
                            {entry.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="seasonality" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Estacionalidad del Mercado</CardTitle>
                  <CardDescription>Índice de actividad por mes (100 = promedio anual)</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center">
                  <div className="w-full h-full bg-gray-100 rounded-md flex items-center justify-center">
                    {/* Aquí iría el gráfico real */}
                    <div className="w-full h-full flex items-end justify-around px-4 pb-4">
                      {seasonalityData.map((entry, index) => (
                        <div key={`seasonality-${index}`} className="flex flex-col items-center">
                          <div
                            className="w-8 rounded-t-md"
                            style={{
                              height: `${entry.indice * 1.5}px`,
                              backgroundColor:
                                entry.indice > 100 ? "#22c55e" : entry.indice < 90 ? "#ef4444" : "#f59e0b",
                            }}
                          ></div>
                          <div className="flex flex-col items-center mt-2">
                            <span className="text-xs">{entry.name}</span>
                            <span className="text-xs font-medium">{entry.indice}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>
    </div>
  )
}
