"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Search, Users, MapPin, Mail, Phone, Building, ChevronRight, Upload, Loader2, CheckCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { KMZMapDisplay } from "@/components/kmz/kmz-map-display"
import { kmzReader, type KMZData } from "@/lib/kmz/kmz-reader"
import { realDriveService } from "@/lib/google-drive/real-drive-service"
import { useDropzone } from "react-dropzone"

interface Cliente {
  id: string
  name: string
  email?: string
  phone?: string
  client_type: "buyer" | "seller" | "investor" | "tenant"
  location?: string
  region?: string
  company?: string
  related_properties: number
  coordinates?: [number, number]
}

export function ClientesView() {
  const [searchTerm, setSearchTerm] = useState("")
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null)
  const [loading, setLoading] = useState(true)
  const [kmzFiles, setKmzFiles] = useState<KMZData[]>([])
  const [loadingKMZ, setLoadingKMZ] = useState(false)
  const [driveConnected, setDriveConnected] = useState(false)
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number; zoom?: number } | undefined>()

  const supabase = createClient()

  useEffect(() => {
    loadClientes()
    connectToDrive()
  }, [])

  const connectToDrive = async () => {
    try {
      const success = await realDriveService.authenticate()
      if (success) {
        setDriveConnected(true)
        console.log("[v0] Successfully connected to Google Drive")
      }
    } catch (error) {
      console.error("[v0] Error connecting to Google Drive:", error)
    }
  }

  const loadClientes = async () => {
    try {
      setLoading(true)

      const { data, error } = await supabase.from("leads").select("*").order("created_at", { ascending: false })

      if (error) {
        console.error("[v0] Error loading clientes:", error)
        setClientes(getMockClientes())
        return
      }

      const clientesData: Cliente[] = (data || []).map((lead) => ({
        id: lead.id,
        name: lead.name || "Cliente sin nombre",
        email: lead.email,
        phone: lead.phone,
        client_type: "buyer" as const,
        location: lead.property_title || "Sin ubicación",
        region: "Por definir",
        company: undefined,
        related_properties: 1,
        coordinates: undefined,
      }))

      setClientes(clientesData.length > 0 ? clientesData : getMockClientes())
    } catch (error) {
      console.error("[v0] Error in loadClientes:", error)
      setClientes(getMockClientes())
    } finally {
      setLoading(false)
    }
  }

  const getMockClientes = (): Cliente[] => [
    {
      id: "1",
      name: "Federico Gana",
      email: "federico.gana@example.com",
      phone: "+56 9 1234 5678",
      client_type: "buyer",
      location: "Talca",
      region: "Maule",
      company: "Agrícola Gana Ltda.",
      related_properties: 3,
      coordinates: [-35.4264, -71.6554],
    },
    {
      id: "2",
      name: "Teresa Fernández",
      email: "teresa.fernandez@example.com",
      phone: "+56 9 8765 4321",
      client_type: "seller",
      location: "Valdivia",
      region: "Los Ríos",
      company: undefined,
      related_properties: 1,
      coordinates: [-39.8142, -73.2459],
    },
    {
      id: "3",
      name: "Roberto Silva",
      email: "roberto.silva@example.com",
      phone: "+56 9 5555 6666",
      client_type: "investor",
      location: "Puerto Varas",
      region: "Los Lagos",
      company: "Inversiones Silva SpA",
      related_properties: 5,
      coordinates: [-41.3317, -72.9828],
    },
  ]

  const filteredClientes = clientes.filter(
    (cliente) =>
      cliente.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (cliente.email && cliente.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (cliente.location && cliente.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (cliente.company && cliente.company.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  const handleClienteClick = (cliente: Cliente) => {
    setSelectedCliente(cliente)

    if (cliente.coordinates) {
      console.log("[v0] Zooming to client location:", cliente.coordinates)
      setMapCenter({
        lat: cliente.coordinates[0],
        lng: cliente.coordinates[1],
        zoom: 13,
      })
    }
  }

  const getClientTypeColor = (type: Cliente["client_type"]) => {
    switch (type) {
      case "buyer":
        return "bg-green-50 text-green-700 border-green-200"
      case "seller":
        return "bg-blue-50 text-blue-700 border-blue-200"
      case "investor":
        return "bg-purple-50 text-purple-700 border-purple-200"
      case "tenant":
        return "bg-orange-50 text-orange-700 border-orange-200"
    }
  }

  const getClientTypeLabel = (type: Cliente["client_type"]) => {
    switch (type) {
      case "buyer":
        return "Comprador"
      case "seller":
        return "Vendedor"
      case "investor":
        return "Inversionista"
      case "tenant":
        return "Arrendatario"
    }
  }

  const clientesAsProperties = filteredClientes
    .filter((c) => c.coordinates)
    .map((cliente) => ({
      id: cliente.id,
      title: cliente.name,
      type: "casa" as const,
      price: 0,
      location: {
        city: cliente.location || "Sin ubicación",
        region: cliente.region || "Sin región",
        coordinates: cliente.coordinates!,
      },
      features: {
        area: 0,
      },
      description: `Cliente ${getClientTypeLabel(cliente.client_type)} - ${cliente.related_properties} propiedades relacionadas`,
      image: "",
      featured: false,
    }))

  const onDropKMZ = async (acceptedFiles: File[]) => {
    const kmzFilesOnly = acceptedFiles.filter(
      (file) => file.name.toLowerCase().endsWith(".kmz") || file.name.toLowerCase().endsWith(".kml"),
    )

    if (kmzFilesOnly.length === 0) {
      alert("Por favor selecciona archivos KMZ o KML válidos")
      return
    }

    setLoadingKMZ(true)

    try {
      const results = []
      for (const file of kmzFilesOnly) {
        try {
          const kmzData = await kmzReader.readKMZFile(file)
          results.push(kmzData)
        } catch (error) {
          console.error(`Error processing ${file.name}:`, error)
        }
      }

      setKmzFiles((prev) => [...prev, ...results])
      console.log("[v0] Loaded", results.length, "KMZ files")
    } catch (error) {
      console.error("Error processing KMZ files:", error)
      alert("Error al procesar los archivos KMZ")
    } finally {
      setLoadingKMZ(false)
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: onDropKMZ,
    accept: {
      "application/vnd.google-earth.kmz": [".kmz"],
      "application/vnd.google-earth.kml+xml": [".kml"],
    },
    multiple: true,
    noClick: false,
  })

  return (
    <div className="flex gap-6 h-[calc(100vh-16rem)]">
      {/* Left Panel: Client List */}
      <Card className="overflow-hidden w-[400px] flex-shrink-0">
        <CardContent className="p-6 h-full flex flex-col">
          {driveConnected && (
            <Alert className="mb-4 bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">Conectado a Google Drive</AlertDescription>
            </Alert>
          )}

          <div className="mb-4">
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all ${
                isDragActive
                  ? "border-purple-400 bg-purple-50"
                  : "border-gray-300 hover:border-purple-400 hover:bg-gray-50"
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="h-6 w-6 text-gray-400 mx-auto mb-2" />
              {isDragActive ? (
                <p className="text-sm text-purple-600 font-medium">Suelta los archivos KMZ aquí</p>
              ) : (
                <div>
                  <p className="text-sm text-gray-600 font-medium">Arrastra archivos KMZ o haz clic</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {kmzFiles.length > 0 ? `${kmzFiles.length} archivo(s) cargado(s)` : "Soporta .kmz y .kml"}
                  </p>
                </div>
              )}
            </div>
            {loadingKMZ && (
              <div className="mt-2 flex items-center gap-2 text-sm text-purple-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Cargando archivos KMZ...</span>
              </div>
            )}
          </div>

          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar clientes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Clientes ({filteredClientes.length})</h3>
            <Badge variant="outline" className="bg-purple-50 text-purple-700">
              {filteredClientes.reduce((sum, c) => sum + c.related_properties, 0)} propiedades
            </Badge>
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-pulse" />
                <p className="text-gray-600">Cargando clientes...</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-2">
              {filteredClientes.map((cliente) => (
                <div
                  key={cliente.id}
                  onClick={() => handleClienteClick(cliente)}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedCliente?.id === cliente.id
                      ? "border-purple-500 bg-purple-50 shadow-md"
                      : "border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <Users
                        className={`h-5 w-5 mt-0.5 ${selectedCliente?.id === cliente.id ? "text-purple-600" : "text-purple-500"}`}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-gray-900">{cliente.name}</p>
                          <Badge className={getClientTypeColor(cliente.client_type)}>
                            {getClientTypeLabel(cliente.client_type)}
                          </Badge>
                        </div>
                        {cliente.company && (
                          <div className="flex items-center gap-1 text-sm text-gray-600 mb-1">
                            <Building className="h-3 w-3" />
                            {cliente.company}
                          </div>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                          {cliente.email && (
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {cliente.email}
                            </div>
                          )}
                          {cliente.phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {cliente.phone}
                            </div>
                          )}
                        </div>
                        {cliente.location && (
                          <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                            <MapPin className="h-3 w-3" />
                            {cliente.location}, {cliente.region}
                          </div>
                        )}
                        <div className="mt-2">
                          <Badge variant="outline" className="text-xs">
                            {cliente.related_properties} propiedades relacionadas
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <ChevronRight
                      className={`h-5 w-5 ${selectedCliente?.id === cliente.id ? "text-purple-600" : "text-gray-400"}`}
                    />
                  </div>
                </div>
              ))}

              {filteredClientes.length === 0 && (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No se encontraron clientes</p>
                  <p className="text-sm text-gray-500 mt-2">Intenta con otros términos de búsqueda</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Right Panel: Map with Client Relationships */}
      <Card className="overflow-hidden flex-1">
        <CardContent className="p-0 h-full relative">
          {selectedCliente && (
            <div className="absolute top-4 left-4 z-[999] max-w-md">
              <Card className="shadow-xl border-2">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 mb-1">{selectedCliente.name}</h4>
                      <p className="text-sm text-gray-600 mb-2">
                        {getClientTypeLabel(selectedCliente.client_type)} • {selectedCliente.related_properties}{" "}
                        propiedades
                      </p>
                      {selectedCliente.location && (
                        <p className="text-xs text-gray-500">
                          {selectedCliente.location}, {selectedCliente.region}
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedCliente(null)}
                      className="flex-shrink-0"
                    >
                      ✕
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <KMZMapDisplay kmzFiles={kmzFiles} height="100%" center={mapCenter} />
        </CardContent>
      </Card>
    </div>
  )
}
