"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Search,
  Building2,
  Users,
  DollarSign,
  MapPin,
  TrendingUp,
  FileText,
  AlertCircle,
  CheckCircle,
  Loader2,
  Calendar,
  Target,
} from "lucide-react"
import type { SIRENECompany, SIRENEFinancialData, SIRENERealEstateCompany } from "@/lib/sirene/types"

interface CompanySearchProps {
  onCompanySelect?: (company: SIRENECompany) => void
}

export function CompanySearch({ onCompanySelect }: CompanySearchProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [searchType, setSearchType] = useState<"rut" | "name" | "filters">("rut")
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<SIRENERealEstateCompany[]>([])
  const [selectedCompany, setSelectedCompany] = useState<SIRENERealEstateCompany | null>(null)
  const [financialData, setFinancialData] = useState<SIRENEFinancialData[]>([])

  const handleSearch = async () => {
    if (!searchTerm.trim()) return

    setIsSearching(true)
    setSearchResults([])
    setSelectedCompany(null)

    try {
      // Simular búsqueda con delay realista
      await new Promise((resolve) => setTimeout(resolve, 1500))

      const mockResults: SIRENERealEstateCompany[] = [
        {
          rut: "76123456-7",
          razonSocial: "INMOBILIARIA PATAGONIA SPA",
          nombreFantasia: "Patagonia Properties",
          giro: "ACTIVIDADES INMOBILIARIAS",
          fechaConstitucion: "2020-01-15",
          capital: 100000000,
          estado: "ACTIVA",
          tipoSociedad: "SOCIEDAD POR ACCIONES",
          direccion: {
            calle: "Costanera del Lago",
            numero: "500",
            comuna: "Puerto Varas",
            region: "Los Lagos",
          },
          representanteLegal: {
            nombre: "ANDREA PATRICIA SILVA ROJAS",
            rut: "15678901-2",
            cargo: "DIRECTORA",
          },
          actividadEconomica: [
            {
              codigo: "681000",
              descripcion: "Actividades inmobiliarias",
              categoria: "INMOBILIARIA",
            },
          ],
          licenciaInmobiliaria: {
            numero: "IM-2020-001",
            fechaVencimiento: "2025-12-31",
            estado: "VIGENTE",
          },
          proyectosActivos: [
            {
              nombre: "Condominio Vista Lagos",
              comuna: "Puerto Varas",
              estado: "EN_CONSTRUCCION",
              unidades: 45,
              valorProyecto: 8500000000,
            },
            {
              nombre: "Parcelas El Bosque",
              comuna: "Frutillar",
              estado: "EN_VENTA",
              unidades: 12,
              valorProyecto: 3200000000,
            },
          ],
          ventasHistoricas: [
            {
              ano: 2023,
              unidadesVendidas: 28,
              montoTotal: 5600000000,
              precioPromedio: 200000000,
            },
            {
              ano: 2022,
              unidadesVendidas: 22,
              montoTotal: 4200000000,
              precioPromedio: 190909091,
            },
          ],
          especializacion: ["CONDOMINIOS", "PARCELAS", "CASAS_PREMIUM"],
        },
        {
          rut: "96234567-8",
          razonSocial: "DESARROLLOS INMOBILIARIOS DEL SUR LTDA",
          nombreFantasia: "Sur Desarrollos",
          giro: "CONSTRUCCION Y VENTA DE INMUEBLES",
          fechaConstitucion: "2015-06-20",
          capital: 200000000,
          estado: "ACTIVA",
          tipoSociedad: "SOCIEDAD DE RESPONSABILIDAD LIMITADA",
          direccion: {
            calle: "Avenida Philippi",
            numero: "1850",
            comuna: "Puerto Varas",
            region: "Los Lagos",
          },
          representanteLegal: {
            nombre: "RODRIGO ALEJANDRO MORALES CASTRO",
            rut: "11223344-5",
            cargo: "GERENTE",
          },
          actividadEconomica: [
            {
              codigo: "681000",
              descripcion: "Actividades inmobiliarias",
              categoria: "INMOBILIARIA",
            },
            {
              codigo: "410000",
              descripcion: "Construcción de edificios",
              categoria: "CONSTRUCCION",
            },
          ],
          licenciaInmobiliaria: {
            numero: "IM-2015-045",
            fechaVencimiento: "2025-06-30",
            estado: "VIGENTE",
          },
          proyectosActivos: [
            {
              nombre: "Torres del Lago",
              comuna: "Puerto Varas",
              estado: "TERMINADO",
              unidades: 80,
              valorProyecto: 16000000000,
            },
          ],
          ventasHistoricas: [
            {
              ano: 2023,
              unidadesVendidas: 35,
              montoTotal: 8750000000,
              precioPromedio: 250000000,
            },
            {
              ano: 2022,
              unidadesVendidas: 28,
              montoTotal: 7000000000,
              precioPromedio: 250000000,
            },
          ],
          especializacion: ["DEPARTAMENTOS", "TORRES", "PROYECTOS_MASIVOS"],
        },
      ]

      // Filtrar resultados según el término de búsqueda
      let filteredResults = mockResults
      if (searchType === "rut") {
        filteredResults = mockResults.filter((company) =>
          company.rut.toLowerCase().includes(searchTerm.toLowerCase().replace(/[.-]/g, "")),
        )
      } else if (searchType === "name") {
        filteredResults = mockResults.filter(
          (company) =>
            company.razonSocial.toLowerCase().includes(searchTerm.toLowerCase()) ||
            company.nombreFantasia?.toLowerCase().includes(searchTerm.toLowerCase()),
        )
      }

      setSearchResults(filteredResults)
    } catch (error) {
      console.error("Error searching companies:", error)
    } finally {
      setIsSearching(false)
    }
  }

  const handleCompanySelect = async (company: SIRENERealEstateCompany) => {
    setSelectedCompany(company)
    onCompanySelect?.(company)

    // Simular carga de datos financieros
    const mockFinancialData: SIRENEFinancialData[] = [
      {
        rut: company.rut,
        ano: 2023,
        ingresos: 2500000000,
        patrimonio: 800000000,
        activos: 1200000000,
        pasivos: 400000000,
        utilidades: 150000000,
        trabajadores: 25,
        ventasUF: 89285,
        clasificacionTamano: "MEDIANA",
      },
      {
        rut: company.rut,
        ano: 2022,
        ingresos: 2200000000,
        patrimonio: 750000000,
        activos: 1100000000,
        pasivos: 350000000,
        utilidades: 120000000,
        trabajadores: 22,
        ventasUF: 78571,
        clasificacionTamano: "MEDIANA",
      },
    ]
    setFinancialData(mockFinancialData)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVA":
        return "bg-green-100 text-green-800"
      case "INACTIVA":
        return "bg-red-100 text-red-800"
      case "SUSPENDIDA":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("es-CL").format(num)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Search className="h-5 w-5 mr-2" />
            Búsqueda de Empresas SIRENE
          </CardTitle>
          <CardDescription>Busca información detallada de empresas inmobiliarias registradas en Chile</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="search-term">Término de búsqueda</Label>
              <Input
                id="search-term"
                placeholder={
                  searchType === "rut"
                    ? "Ej: 76.123.456-7 o 76123456-7"
                    : searchType === "name"
                      ? "Ej: Inmobiliaria Patagonia"
                      : "Filtros avanzados"
                }
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <div className="w-48">
              <Label htmlFor="search-type">Tipo de búsqueda</Label>
              <Select value={searchType} onValueChange={(value: any) => setSearchType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rut">Por RUT</SelectItem>
                  <SelectItem value="name">Por Nombre</SelectItem>
                  <SelectItem value="filters">Filtros Avanzados</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={handleSearch} disabled={isSearching || !searchTerm.trim()}>
                {isSearching ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Buscando...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Buscar
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Sugerencias de búsqueda */}
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-gray-500">Prueba con:</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchTerm("76123456-7")
                setSearchType("rut")
              }}
            >
              76.123.456-7
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchTerm("Patagonia")
                setSearchType("name")
              }}
            >
              Patagonia
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchTerm("Sur Desarrollos")
                setSearchType("name")
              }}
            >
              Sur Desarrollos
            </Button>
          </div>
        </CardContent>
      </Card>

      {isSearching && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500 mr-3" />
              <span className="text-lg">Consultando base de datos SIRENE...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {searchResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Resultados de Búsqueda</CardTitle>
            <CardDescription>Se encontraron {searchResults.length} empresas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {searchResults.map((company) => (
                <div
                  key={company.rut}
                  className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleCompanySelect(company)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Building2 className="h-5 w-5 text-blue-500" />
                        <h3 className="font-semibold">{company.razonSocial}</h3>
                        <Badge className={getStatusColor(company.estado)}>{company.estado}</Badge>
                      </div>
                      {company.nombreFantasia && (
                        <p className="text-sm text-gray-600 mb-1">
                          <strong>Nombre Fantasía:</strong> {company.nombreFantasia}
                        </p>
                      )}
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>RUT:</strong> {company.rut}
                      </p>
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>Giro:</strong> {company.giro}
                      </p>
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>Ubicación:</strong> {company.direccion.comuna}, {company.direccion.region}
                      </p>
                      {company.licenciaInmobiliaria && (
                        <div className="flex items-center gap-1 mt-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm text-green-600">Licencia Inmobiliaria Vigente</span>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">Capital: {formatCurrency(company.capital)}</p>
                      <p className="text-xs text-gray-500">Constituida: {company.fechaConstitucion}</p>
                      {company.proyectosActivos.length > 0 && (
                        <p className="text-xs text-blue-600 mt-1">
                          {company.proyectosActivos.length} proyecto(s) activo(s)
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {searchResults.length === 0 && !isSearching && searchTerm && (
        <Card>
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron resultados</h3>
            <p className="text-gray-500">
              No se encontraron empresas que coincidan con "{searchTerm}". Intenta con otro término de búsqueda.
            </p>
          </CardContent>
        </Card>
      )}

      {selectedCompany && (
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="general">Información General</TabsTrigger>
            <TabsTrigger value="financial">Datos Financieros</TabsTrigger>
            <TabsTrigger value="projects">Proyectos</TabsTrigger>
            <TabsTrigger value="analysis">Análisis IA</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Building2 className="h-5 w-5 mr-2" />
                    Datos Corporativos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Razón Social</Label>
                    <p className="font-medium">{selectedCompany.razonSocial}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Nombre Fantasía</Label>
                    <p>{selectedCompany.nombreFantasia || "No registrado"}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">RUT</Label>
                    <p>{selectedCompany.rut}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Tipo de Sociedad</Label>
                    <p>{selectedCompany.tipoSociedad}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Estado</Label>
                    <Badge className={getStatusColor(selectedCompany.estado)}>{selectedCompany.estado}</Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Capital</Label>
                    <p className="font-medium">{formatCurrency(selectedCompany.capital)}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MapPin className="h-5 w-5 mr-2" />
                    Ubicación y Contacto
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Dirección</Label>
                    <p>
                      {selectedCompany.direccion.calle} {selectedCompany.direccion.numero}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Comuna</Label>
                    <p>{selectedCompany.direccion.comuna}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Región</Label>
                    <p>{selectedCompany.direccion.region}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Representante Legal</Label>
                    <p>
                      {selectedCompany.representanteLegal.nombre} ({selectedCompany.representanteLegal.cargo})
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Fecha Constitución</Label>
                    <p className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {selectedCompany.fechaConstitucion}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {selectedCompany.licenciaInmobiliaria && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Licencia Inmobiliaria
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Número de Licencia</Label>
                      <p className="font-medium">{selectedCompany.licenciaInmobiliaria.numero}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Fecha Vencimiento</Label>
                      <p>{selectedCompany.licenciaInmobiliaria.fechaVencimiento}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Estado</Label>
                      <Badge
                        className={
                          selectedCompany.licenciaInmobiliaria.estado === "VIGENTE"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }
                      >
                        {selectedCompany.licenciaInmobiliaria.estado}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {selectedCompany.especializacion && selectedCompany.especializacion.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Target className="h-5 w-5 mr-2" />
                    Especialización
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {selectedCompany.especializacion.map((spec, index) => (
                      <Badge key={index} variant="outline" className="bg-blue-50 text-blue-700">
                        {spec.replace("_", " ")}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="financial" className="space-y-4">
            {financialData.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Ingresos {financialData[0].ano}</p>
                          <p className="text-2xl font-bold">{formatCurrency(financialData[0].ingresos)}</p>
                        </div>
                        <DollarSign className="h-8 w-8 text-green-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Patrimonio</p>
                          <p className="text-2xl font-bold">{formatCurrency(financialData[0].patrimonio)}</p>
                        </div>
                        <TrendingUp className="h-8 w-8 text-blue-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Trabajadores</p>
                          <p className="text-2xl font-bold">{formatNumber(financialData[0].trabajadores)}</p>
                        </div>
                        <Users className="h-8 w-8 text-purple-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Clasificación</p>
                          <p className="text-lg font-bold">{financialData[0].clasificacionTamano}</p>
                        </div>
                        <Building2 className="h-8 w-8 text-orange-500" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Evolución Financiera</CardTitle>
                    <CardDescription>Comparación de los últimos años</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {financialData.map((data, index) => (
                        <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                              <span className="font-bold text-blue-600">{data.ano}</span>
                            </div>
                            <div>
                              <p className="font-semibold">Año {data.ano}</p>
                              <p className="text-sm text-gray-600">{formatNumber(data.trabajadores)} trabajadores</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{formatCurrency(data.ingresos)}</p>
                            <p className="text-sm text-gray-600">Utilidades: {formatCurrency(data.utilidades)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="pt-6 text-center">
                  <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Datos Financieros No Disponibles</h3>
                  <p className="text-gray-500">No se encontraron datos financieros para esta empresa</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="projects" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Proyectos Activos</CardTitle>
                <CardDescription>Desarrollos inmobiliarios en curso</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {selectedCompany.proyectosActivos.map((proyecto, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold">{proyecto.nombre}</h4>
                          <p className="text-sm text-gray-600">
                            <MapPin className="h-4 w-4 inline mr-1" />
                            {proyecto.comuna}
                          </p>
                          <p className="text-sm text-gray-600">
                            <Building2 className="h-4 w-4 inline mr-1" />
                            {formatNumber(proyecto.unidades)} unidades
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge
                            className={
                              proyecto.estado === "EN_CONSTRUCCION"
                                ? "bg-blue-100 text-blue-800"
                                : proyecto.estado === "EN_VENTA"
                                  ? "bg-green-100 text-green-800"
                                  : proyecto.estado === "TERMINADO"
                                    ? "bg-gray-100 text-gray-800"
                                    : "bg-yellow-100 text-yellow-800"
                            }
                          >
                            {proyecto.estado.replace("_", " ")}
                          </Badge>
                          <p className="text-sm font-medium mt-1">{formatCurrency(proyecto.valorProyecto)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Historial de Ventas</CardTitle>
                <CardDescription>Rendimiento comercial por año</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {selectedCompany.ventasHistoricas.map((venta, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-semibold">Año {venta.ano}</p>
                        <p className="text-sm text-gray-600">
                          {formatNumber(venta.unidadesVendidas)} unidades vendidas
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(venta.montoTotal)}</p>
                        <p className="text-sm text-gray-600">Promedio: {formatCurrency(venta.precioPromedio)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analysis" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Análisis de IA
                </CardTitle>
                <CardDescription>Insights generados automáticamente</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">Fortalezas Identificadas</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Licencia inmobiliaria vigente y en regla</li>
                      <li>• Cartera diversificada de proyectos activos</li>
                      <li>• Crecimiento sostenido en ventas anuales</li>
                      <li>• Especialización en segmento premium</li>
                      <li>• Ubicación estratégica en zona turística</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <h4 className="font-semibold text-yellow-900 mb-2">Áreas de Atención</h4>
                    <ul className="text-sm text-yellow-800 space-y-1">
                      <li>• Concentración geográfica en una sola comuna</li>
                      <li>• Dependencia de proyectos de gran escala</li>
                      <li>• Necesidad de diversificar tipos de producto</li>
                      <li>• Exposición a fluctuaciones del mercado turístico</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-semibold text-green-900 mb-2">Oportunidades</h4>
                    <ul className="text-sm text-green-800 space-y-1">
                      <li>• Expansión a comunas vecinas con alta demanda</li>
                      <li>• Desarrollo de proyectos de vivienda social</li>
                      <li>• Alianzas estratégicas con otras inmobiliarias</li>
                      <li>• Aprovechamiento del crecimiento del turismo</li>
                      <li>• Incorporación de tecnologías sustentables</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-purple-50 rounded-lg">
                    <h4 className="font-semibold text-purple-900 mb-2">Recomendaciones Estratégicas</h4>
                    <ul className="text-sm text-purple-800 space-y-1">
                      <li>• Considerar expansión geográfica gradual</li>
                      <li>• Desarrollar productos para diferentes segmentos</li>
                      <li>• Fortalecer presencia digital y marketing</li>
                      <li>• Evaluar alianzas con empresas complementarias</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
