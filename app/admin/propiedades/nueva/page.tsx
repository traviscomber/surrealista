"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Save, X, ImageIcon, MapPin, DollarSign, Home, Check, Upload, Plus, ArrowLeft } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import Image from "next/image"

// Componente para la carga de imágenes
const ImageUploader = () => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center h-40 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
          <Upload className="h-8 w-8 text-gray-400 mb-2" />
          <div className="text-sm font-medium text-gray-700">Subir Imagen Principal</div>
          <div className="text-xs text-gray-500 mt-1">Arrastra o haz clic para subir</div>
        </div>

        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="relative border rounded-lg overflow-hidden h-40">
            <Image
              src={`/images/property-sample-${i}.png`}
              alt={`Imagen de propiedad ${i}`}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Button size="icon" variant="outline" className="h-8 w-8 bg-white/80 hover:bg-white">
                <ImageIcon className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="outline"
                className="h-8 w-8 bg-white/80 hover:bg-white text-red-500 hover:text-red-600"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            {i === 1 && (
              <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">Principal</div>
            )}
          </div>
        ))}

        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center h-40 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
          <Plus className="h-8 w-8 text-gray-400 mb-2" />
          <div className="text-sm font-medium text-gray-700">Agregar Más Imágenes</div>
          <div className="text-xs text-gray-500 mt-1">Máximo 10 imágenes</div>
        </div>
      </div>

      <div className="text-sm text-gray-500">
        * Las imágenes deben tener un tamaño mínimo de 1200x800 píxeles y un peso máximo de 5MB.
      </div>
    </div>
  )
}

// Componente para el mapa de ubicación
const LocationMap = () => {
  return (
    <div className="space-y-4">
      <div className="relative w-full h-[400px] rounded-lg overflow-hidden border">
        <Image
          src="/placeholder.svg?height=400&width=800&query=map+of+southern+chile+with+location+pin"
          alt="Mapa de ubicación"
          fill
          className="object-cover"
        />
      </div>
      <div className="text-sm text-gray-500">
        * Haz clic en el mapa para seleccionar la ubicación exacta de la propiedad.
      </div>
    </div>
  )
}

export default function NewPropertyPage() {
  const [activeTab, setActiveTab] = useState("details")

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="icon" asChild className="mr-2">
          <Link href="/admin/propiedades">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Nueva Propiedad</h1>
          <p className="text-gray-500">Crea una nueva propiedad en Sur-Realista</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle>Información de la Propiedad</CardTitle>
              <CardDescription>Ingresa los detalles básicos de la propiedad</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="details" className="w-full" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-4 mb-6">
                  <TabsTrigger value="details" className="flex items-center gap-2">
                    <Home className="h-4 w-4" />
                    <span className="hidden md:inline">Detalles</span>
                  </TabsTrigger>
                  <TabsTrigger value="location" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span className="hidden md:inline">Ubicación</span>
                  </TabsTrigger>
                  <TabsTrigger value="pricing" className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    <span className="hidden md:inline">Precio</span>
                  </TabsTrigger>
                  <TabsTrigger value="images" className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    <span className="hidden md:inline">Imágenes</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="mt-0">
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="title">Título de la Propiedad</Label>
                        <Input id="title" placeholder="Ej: Casa con Vista al Lago en Puerto Varas" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="property-type">Tipo de Propiedad</Label>
                        <Select>
                          <SelectTrigger id="property-type">
                            <SelectValue placeholder="Seleccionar tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="house">Casa</SelectItem>
                            <SelectItem value="apartment">Departamento</SelectItem>
                            <SelectItem value="land">Terreno</SelectItem>
                            <SelectItem value="cabin">Cabaña</SelectItem>
                            <SelectItem value="commercial">Comercial</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Descripción</Label>
                      <Textarea
                        id="description"
                        placeholder="Describe la propiedad con detalles atractivos..."
                        className="min-h-[150px]"
                      />
                    </div>

                    <Separator />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="bedrooms">Dormitorios</Label>
                        <Input id="bedrooms" type="number" min="0" placeholder="Ej: 3" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bathrooms">Baños</Label>
                        <Input id="bathrooms" type="number" min="0" step="0.5" placeholder="Ej: 2.5" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="parking">Estacionamientos</Label>
                        <Input id="parking" type="number" min="0" placeholder="Ej: 2" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="built-area">Superficie Construida (m²)</Label>
                        <Input id="built-area" type="number" min="0" placeholder="Ej: 120" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="total-area">Superficie Total (m²)</Label>
                        <Input id="total-area" type="number" min="0" placeholder="Ej: 500" />
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <Label>Características</Label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                          "Piscina",
                          "Jardín",
                          "Terraza",
                          "Balcón",
                          "Vista al Lago",
                          "Vista al Mar",
                          "Amoblado",
                          "Calefacción Central",
                          "Chimenea",
                          "Acceso a Playa",
                          "Seguridad 24/7",
                          "Estacionamiento de Visitas",
                        ].map((feature) => (
                          <div key={feature} className="flex items-center space-x-2">
                            <Checkbox id={`feature-${feature}`} />
                            <label
                              htmlFor={`feature-${feature}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {feature}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="location" className="mt-0">
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="region">Región</Label>
                        <Select>
                          <SelectTrigger id="region">
                            <SelectValue placeholder="Seleccionar región" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="los-lagos">Los Lagos</SelectItem>
                            <SelectItem value="los-rios">Los Ríos</SelectItem>
                            <SelectItem value="araucania">La Araucanía</SelectItem>
                            <SelectItem value="biobio">Biobío</SelectItem>
                            <SelectItem value="aysen">Aysén</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="city">Ciudad</Label>
                        <Select>
                          <SelectTrigger id="city">
                            <SelectValue placeholder="Seleccionar ciudad" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="puerto-varas">Puerto Varas</SelectItem>
                            <SelectItem value="puerto-montt">Puerto Montt</SelectItem>
                            <SelectItem value="frutillar">Frutillar</SelectItem>
                            <SelectItem value="valdivia">Valdivia</SelectItem>
                            <SelectItem value="pucon">Pucón</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address">Dirección</Label>
                      <Input id="address" placeholder="Ej: Av. Vicente Pérez Rosales 1240" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="latitude">Latitud</Label>
                        <Input id="latitude" placeholder="Ej: -41.3178" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="longitude">Longitud</Label>
                        <Input id="longitude" placeholder="Ej: -72.9858" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="postal-code">Código Postal</Label>
                        <Input id="postal-code" placeholder="Ej: 5550000" />
                      </div>
                    </div>

                    <LocationMap />
                  </div>
                </TabsContent>

                <TabsContent value="pricing" className="mt-0">
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="price">Precio (USD)</Label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                          <Input id="price" className="pl-10" placeholder="Ej: 250000" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="price-type">Tipo de Precio</Label>
                        <Select>
                          <SelectTrigger id="price-type">
                            <SelectValue placeholder="Seleccionar tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sale">Venta</SelectItem>
                            <SelectItem value="rent">Arriendo</SelectItem>
                            <SelectItem value="seasonal">Arriendo Temporal</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="maintenance-fee">Gastos Comunes (USD)</Label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                          <Input id="maintenance-fee" className="pl-10" placeholder="Ej: 150" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="currency">Moneda</Label>
                        <Select defaultValue="usd">
                          <SelectTrigger id="currency">
                            <SelectValue placeholder="Seleccionar moneda" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="usd">USD</SelectItem>
                            <SelectItem value="clp">CLP</SelectItem>
                            <SelectItem value="uf">UF</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <Label>Opciones de Precio</Label>
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <Checkbox id="negotiable" />
                          <label
                            htmlFor="negotiable"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            Precio Negociable
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="financing" />
                          <label
                            htmlFor="financing"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            Financiamiento Disponible
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="show-price" defaultChecked />
                          <label
                            htmlFor="show-price"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            Mostrar Precio en Listado
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="images" className="mt-0">
                  <ImageUploader />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader className="pb-4">
              <CardTitle>Publicación</CardTitle>
              <CardDescription>Configura la visibilidad y estado de la propiedad</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="status">Estado</Label>
                  <Select defaultValue="draft">
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Seleccionar estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Borrador</SelectItem>
                      <SelectItem value="published">Publicada</SelectItem>
                      <SelectItem value="pending">Pendiente de Revisión</SelectItem>
                      <SelectItem value="sold">Vendida</SelectItem>
                      <SelectItem value="rented">Arrendada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label>Opciones de Visibilidad</Label>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="featured" />
                      <label
                        htmlFor="featured"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Destacar Propiedad
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="homepage" />
                      <label
                        htmlFor="homepage"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Mostrar en Página Principal
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="hide-address" />
                      <label
                        htmlFor="hide-address"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Ocultar Dirección Exacta
                      </label>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="agent">Agente Asignado</Label>
                  <Select>
                    <SelectTrigger id="agent">
                      <SelectValue placeholder="Seleccionar agente" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="carlos">Carlos Mendoza</SelectItem>
                      <SelectItem value="maria">María González</SelectItem>
                      <SelectItem value="diego">Diego Flores</SelectItem>
                      <SelectItem value="valentina">Valentina Soto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="publish-date">Fecha de Publicación</Label>
                  <Input id="publish-date" type="date" />
                </div>

                <Separator />

                <div className="flex flex-col gap-4">
                  <Button className="w-full gap-2">
                    <Save className="h-4 w-4" />
                    Guardar como Borrador
                  </Button>
                  <Button variant="outline" className="w-full gap-2">
                    <Check className="h-4 w-4" />
                    Publicar Propiedad
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader className="pb-4">
              <CardTitle>SEO</CardTitle>
              <CardDescription>Optimiza la visibilidad en buscadores</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="meta-title">Título Meta</Label>
                  <Input id="meta-title" placeholder="Título para SEO" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="meta-description">Descripción Meta</Label>
                  <Textarea id="meta-description" placeholder="Descripción para SEO..." className="min-h-[80px]" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="keywords">Palabras Clave</Label>
                  <Input id="keywords" placeholder="Ej: casa, lago, puerto varas" />
                  <p className="text-xs text-gray-500 mt-1">Separadas por comas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
