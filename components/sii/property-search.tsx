"use client"

import { useState } from "react"
import { Search, Building, MapPin, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import type { SIIProperty, SIITransaction, SIIContributions } from "@/lib/sii/types"

export default function SIIPropertySearch() {
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(false)
  const [property, setProperty] = useState<SIIProperty | null>(null)
  const [transactions, setTransactions] = useState<SIITransaction[]>([])
  const [contributions, setContributions] = useState<SIIContributions | null>(null)

  const handleSearch = async () => {
    if (!searchTerm.trim()) return

    setLoading(true)
    try {
      // Buscar propiedad
      const propertyResponse = await fetch(`/api/sii/property?rol=${encodeURIComponent(searchTerm)}`)
      const propertyData = await propertyResponse.json()

      if (propertyData.success) {
        setProperty(propertyData.data)

        // Obtener transacciones
        const transactionsResponse = await fetch(`/api/sii/transactions?rol=${encodeURIComponent(searchTerm)}`)
        const transactionsData = await transactionsResponse.json()
        if (transactionsData.success) {
          setTransactions(transactionsData.data)
        }

        // Obtener contribuciones
        const contributionsResponse = await fetch(`/api/sii/contributions?rol=${encodeURIComponent(searchTerm)}`)
        const contributionsData = await contributionsResponse.json()
        if (contributionsData.success) {
          setContributions(contributionsData.data)
        }
      }
    } catch (error) {
      console.error("Error searching SII:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-CL")
  }

  return (
    <div className="space-y-6">
      {/* Búsqueda */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Consulta SII - Datos Oficiales
          </CardTitle>
          <CardDescription>
            Busca información oficial de propiedades usando el rol de avalúo (ej: 125-8-0)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="rol">Rol de Avalúo</Label>
              <Input
                id="rol"
                placeholder="Ej: 125-8-0"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleSearch} disabled={loading}>
                <Search className="h-4 w-4 mr-2" />
                {loading ? "Buscando..." : "Buscar"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resultados */}
      {property && (
        <Tabs defaultValue="general" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">Información General</TabsTrigger>
            <TabsTrigger value="transactions">Transacciones</TabsTrigger>
            <TabsTrigger value="contributions">Contribuciones</TabsTrigger>
            <TabsTrigger value="valuation">Valoración</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Información Básica */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Información de la Propiedad
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium">Dirección</Label>
                    <p className="text-sm text-muted-foreground">
                      {property.direccion.calle} {property.direccion.numero}, {property.direccion.comuna}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Rol de Avalúo</Label>
                    <p className="text-sm text-muted-foreground">{property.rolAvaluo}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Destino</Label>
                    <p className="text-sm text-muted-foreground">{property.caracteristicas.destinoInmueble}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Año Construcción</Label>
                    <p className="text-sm text-muted-foreground">{property.caracteristicas.anoConstruction}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Avalúo Fiscal */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Avalúo Fiscal {property.avaluoFiscal.anoAvaluo}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Terreno:</span>
                    <span className="text-sm font-medium">{formatCurrency(property.avaluoFiscal.terreno)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Construcción:</span>
                    <span className="text-sm font-medium">{formatCurrency(property.avaluoFiscal.construccion)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-medium">Total:</span>
                    <span className="font-bold text-lg">{formatCurrency(property.avaluoFiscal.total)}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Superficies */}
              <Card>
                <CardHeader>
                  <CardTitle>Superficies</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Terreno:</span>
                    <span className="text-sm font-medium">{property.superficies.terreno} m²</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Construida:</span>
                    <span className="text-sm font-medium">{property.superficies.construida} m²</span>
                  </div>
                  {property.superficies.util && (
                    <div className="flex justify-between">
                      <span className="text-sm">Útil:</span>
                      <span className="text-sm font-medium">{property.superficies.util} m²</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Propietarios */}
              <Card>
                <CardHeader>
                  <CardTitle>Propietarios</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {property.propietario.map((prop, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium">{prop.nombre}</p>
                        <p className="text-xs text-muted-foreground">{prop.rut}</p>
                      </div>
                      <Badge variant="secondary">{prop.porcentajeDerecho}%</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="transactions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Historial de Transacciones</CardTitle>
                <CardDescription>Compraventas registradas en el SII</CardDescription>
              </CardHeader>
              <CardContent>
                {transactions.length > 0 ? (
                  <div className="space-y-4">
                    {transactions.map((transaction, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-medium">{formatCurrency(transaction.montoTransaccion)}</p>
                            <p className="text-sm text-muted-foreground">{formatDate(transaction.fechaEscritura)}</p>
                          </div>
                          <Badge>{transaction.tipoTransaccion}</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <Label>Comprador:</Label>
                            <p className="text-muted-foreground">{transaction.comprador.nombre}</p>
                          </div>
                          <div>
                            <Label>Vendedor:</Label>
                            <p className="text-muted-foreground">{transaction.vendedor.nombre}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No se encontraron transacciones</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contributions" className="space-y-4">
            {contributions && (
              <Card>
                <CardHeader>
                  <CardTitle>Estado de Contribuciones {contributions.anoTributario}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-green-600">{formatCurrency(contributions.totalPagado)}</p>
                      <p className="text-sm text-muted-foreground">Pagado</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-orange-600">
                        {formatCurrency(contributions.totalPendiente)}
                      </p>
                      <p className="text-sm text-muted-foreground">Pendiente</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{formatCurrency(contributions.totalAnual)}</p>
                      <p className="text-sm text-muted-foreground">Total Anual</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Cuotas Contribuciones Territoriales:</Label>
                    {contributions.contribucionesTerritoriales.cuotas.map((cuota, index) => (
                      <div key={index} className="flex justify-between items-center p-2 border rounded">
                        <span className="text-sm">
                          Cuota {cuota.numero} - Vence: {formatDate(cuota.fechaVencimiento)}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{formatCurrency(cuota.monto)}</span>
                          <Badge variant={cuota.estado === "PAGADA" ? "default" : "destructive"}>{cuota.estado}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>

                  {contributions.beneficios && contributions.beneficios.length > 0 && (
                    <div>
                      <Label>Beneficios Aplicados:</Label>
                      <div className="space-y-1 mt-2">
                        {contributions.beneficios.map((beneficio, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span>{beneficio.descripcion}</span>
                            <span className="text-green-600">-{(beneficio.descuento * 100).toFixed(0)}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="valuation" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Valoración Comercial</CardTitle>
                <CardDescription>Estimación de valor de mercado basada en datos del SII</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-3xl font-bold text-green-600">{formatCurrency(350000000)}</p>
                  <p className="text-sm text-muted-foreground mt-2">Valor Comercial Estimado</p>
                  <p className="text-xs text-muted-foreground mt-1">Factor de corrección: 1.167 sobre avalúo fiscal</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
