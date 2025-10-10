"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Search, Users, MapPin, Mail, Phone, Building, ChevronRight } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import dynamic from "next/dynamic"

const CanvasMap = dynamic(() => import("@/components/maps/canvas-map"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
      <div className="text-center">
        <MapPin className="h-12 w-12 text-purple-600 mx-auto mb-4 animate-pulse" />
        <p className="text-gray-600 font-medium">Cargando mapa...</p>
      </div>
    </div>
  ),
})

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

  const supabase = createClient()

  useEffect(() => {
    loadClientes()
  }, [])

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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-16rem)]">
      {/* Left Panel: Client List */}
      <Card className="overflow-hidden">
        <CardContent className="p-6 h-full flex flex-col">
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
      <Card className="overflow-hidden">
        <CardContent className="p-0 h-full relative">
          {selectedCliente && (
            <div className="absolute top-4 left-4 right-4 z-10">
              <Card className="shadow-lg">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-900">{selectedCliente.name}</h4>
                      <p className="text-sm text-gray-600">
                        {getClientTypeLabel(selectedCliente.client_type)} • {selectedCliente.related_properties}{" "}
                        propiedades
                      </p>
                      {selectedCliente.location && (
                        <p className="text-xs text-gray-500 mt-1">
                          {selectedCliente.location}, {selectedCliente.region}
                        </p>
                      )}
                    </div>
                    <Button size="sm" variant="outline" onClick={() => setSelectedCliente(null)}>
                      Cerrar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {clientesAsProperties.length > 0 ? (
            <CanvasMap
              properties={clientesAsProperties}
              kmzData={[]}
              showKmzOverlay={false}
              onToggleKmzOverlay={() => {}}
              onPropertySelect={(prop) => {
                const cliente = clientes.find((c) => c.id === prop?.id)
                if (cliente) setSelectedCliente(cliente)
              }}
              selectedProperty={
                selectedCliente ? clientesAsProperties.find((p) => p.id === selectedCliente.id) || null : null
              }
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
              <div className="text-center">
                <MapPin className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                <p className="text-gray-600 font-medium">Mapa de Relaciones</p>
                <p className="text-sm text-gray-500 mt-2">
                  Selecciona un cliente para ver sus propiedades relacionadas
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
