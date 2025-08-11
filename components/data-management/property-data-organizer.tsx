"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Filter, Download, BarChart3, MapPin, Droplets, Star } from "lucide-react"
import { supabase } from "@/lib/supabase/client"

interface Property {
  id: string
  title: string
  contact_name: string
  contact_phone: string
  contact_email: string
  property_rol: string
  water_rights: boolean
  owner_name: string
  region: string
  data_quality_score: number
  import_source: string
  created_at: string
}

interface PropertyStats {
  total: number
  withWaterRights: number
  regions: { [key: string]: number }
  averageQuality: number
}

export default function PropertyDataOrganizer() {
  const [properties, setProperties] = useState<Property[]>([])
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([])
  const [stats, setStats] = useState<PropertyStats>({
    total: 0,
    withWaterRights: 0,
    regions: {},
    averageQuality: 0,
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [regionFilter, setRegionFilter] = useState("all")
  const [waterRightsFilter, setWaterRightsFilter] = useState("all")
  const [qualityFilter, setQualityFilter] = useState("all")

  useEffect(() => {
    loadProperties()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [properties, searchTerm, regionFilter, waterRightsFilter, qualityFilter])

  const loadProperties = async () => {
    try {
      const { data, error } = await supabase.from("properties").select("*").order("created_at", { ascending: false })

      if (error) throw error

      setProperties(data || [])
      calculateStats(data || [])
    } catch (error) {
      console.error("Error loading properties:", error)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (data: Property[]) => {
    const total = data.length
    const withWaterRights = data.filter((p) => p.water_rights).length
    const regions: { [key: string]: number } = {}
    let totalQuality = 0

    data.forEach((property) => {
      if (property.region) {
        regions[property.region] = (regions[property.region] || 0) + 1
      }
      totalQuality += property.data_quality_score || 0
    })

    const averageQuality = total > 0 ? Math.round(totalQuality / total) : 0

    setStats({
      total,
      withWaterRights,
      regions,
      averageQuality,
    })
  }

  const applyFilters = () => {
    let filtered = properties

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (property) =>
          property.title?.toLowerCase().includes(term) ||
          property.contact_name?.toLowerCase().includes(term) ||
          property.owner_name?.toLowerCase().includes(term) ||
          property.region?.toLowerCase().includes(term),
      )
    }

    // Region filter
    if (regionFilter !== "all") {
      filtered = filtered.filter((property) => property.region === regionFilter)
    }

    // Water rights filter
    if (waterRightsFilter !== "all") {
      const hasWaterRights = waterRightsFilter === "yes"
      filtered = filtered.filter((property) => property.water_rights === hasWaterRights)
    }

    // Quality filter
    if (qualityFilter !== "all") {
      filtered = filtered.filter((property) => {
        const score = property.data_quality_score || 0
        switch (qualityFilter) {
          case "high":
            return score >= 80
          case "medium":
            return score >= 60 && score < 80
          case "low":
            return score < 60
          default:
            return true
        }
      })
    }

    setFilteredProperties(filtered)
  }

  const exportData = () => {
    const csvHeaders = [
      "Título",
      "Contacto",
      "Teléfono",
      "Email",
      "Rol",
      "Derechos de Agua",
      "Propietario",
      "Región",
      "Calidad de Datos (%)",
      "Fuente",
    ]

    const csvData = filteredProperties.map((property) => [
      property.title || "",
      property.contact_name || "",
      property.contact_phone || "",
      property.contact_email || "",
      property.property_rol || "",
      property.water_rights ? "Sí" : "No",
      property.owner_name || "",
      property.region || "",
      property.data_quality_score || 0,
      property.import_source || "",
    ])

    const csvContent = [csvHeaders, ...csvData].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `propiedades-organizadas-${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getQualityBadge = (score: number) => {
    if (score >= 80) return <Badge className="bg-green-100 text-green-800">Alta ({score}%)</Badge>
    if (score >= 60) return <Badge className="bg-yellow-100 text-yellow-800">Media ({score}%)</Badge>
    return <Badge className="bg-red-100 text-red-800">Baja ({score}%)</Badge>
  }

  const uniqueRegions = Array.from(new Set(properties.map((p) => p.region).filter(Boolean)))

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Statistics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Propiedades</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Droplets className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Con Derechos de Agua</p>
                <p className="text-2xl font-bold text-gray-900">{stats.withWaterRights}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <MapPin className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Regiones</p>
                <p className="text-2xl font-bold text-gray-900">{Object.keys(stats.regions).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Star className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Calidad Promedio</p>
                <p className="text-2xl font-bold text-gray-900">{stats.averageQuality}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros y Búsqueda
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar propiedades..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={regionFilter} onValueChange={setRegionFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Todas las regiones" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las regiones</SelectItem>
                {uniqueRegions.map((region) => (
                  <SelectItem key={region} value={region}>
                    {region}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={waterRightsFilter} onValueChange={setWaterRightsFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Derechos de agua" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="yes">Con derechos</SelectItem>
                <SelectItem value="no">Sin derechos</SelectItem>
              </SelectContent>
            </Select>

            <Select value={qualityFilter} onValueChange={setQualityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Calidad de datos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las calidades</SelectItem>
                <SelectItem value="high">Alta (80%+)</SelectItem>
                <SelectItem value="medium">Media (60-79%)</SelectItem>
                <SelectItem value="low">Baja (&lt;60%)</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={exportData} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Exportar CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Properties List */}
      <Card>
        <CardHeader>
          <CardTitle>Propiedades ({filteredProperties.length})</CardTitle>
          <CardDescription>
            Lista de propiedades organizadas con información de contacto y calidad de datos
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredProperties.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No se encontraron propiedades con los filtros aplicados</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {filteredProperties.map((property) => (
                <div key={property.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-lg">{property.title || "Sin título"}</h4>
                    <div className="flex items-center gap-2">
                      {getQualityBadge(property.data_quality_score || 0)}
                      {property.water_rights && (
                        <Badge className="bg-blue-100 text-blue-800">
                          <Droplets className="h-3 w-3 mr-1" />
                          Derechos de Agua
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p>
                        <strong>Contacto:</strong> {property.contact_name || "N/A"}
                      </p>
                      <p>
                        <strong>Teléfono:</strong> {property.contact_phone || "N/A"}
                      </p>
                      <p>
                        <strong>Email:</strong> {property.contact_email || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p>
                        <strong>Propietario:</strong> {property.owner_name || "N/A"}
                      </p>
                      <p>
                        <strong>Región:</strong> {property.region || "N/A"}
                      </p>
                      <p>
                        <strong>Rol:</strong> {property.property_rol || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p>
                        <strong>Fuente:</strong> {property.import_source || "Manual"}
                      </p>
                      <p>
                        <strong>Creado:</strong> {new Date(property.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Regional Distribution */}
      {Object.keys(stats.regions).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Distribución por Región</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(stats.regions)
                .sort(([, a], [, b]) => b - a)
                .map(([region, count]) => (
                  <div key={region} className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-lg font-bold text-gray-900">{count}</div>
                    <div className="text-sm text-gray-600">{region}</div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
