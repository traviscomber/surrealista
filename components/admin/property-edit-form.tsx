"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { PropertyBasicInfoForm } from "./property-forms/basic-info-form"
import { PropertyDetailsForm } from "./property-forms/details-form"
import { PropertyLocationForm } from "./property-forms/location-form"
import { PropertyMediaForm } from "./property-forms/media-form"
import { PropertyFeaturesForm } from "./property-forms/features-form"
import { PropertyPricingForm } from "./property-forms/pricing-form"
import { PropertyPreview } from "./property-preview"
import { Loader2 } from "lucide-react"

interface PropertyEditFormProps {
  id: string
}

type NumericInput = string | number
type PropertyRecord = {
  title?: string
  [key: string]: unknown
}

type BasicInfo = {
  title: string
  description: string
  property_type: string
  status: string
  featured: boolean
}

type Details = {
  bedrooms: NumericInput
  bathrooms: NumericInput
  area: NumericInput
  land_area: NumericInput
  year_built: NumericInput
  parking: NumericInput
}

type Location = {
  address: string
  city: string
  region: string
  provincia?: string
  comuna?: string
  postal_code: string
  latitude: NumericInput
  longitude: NumericInput
  roll_number?: string
}

type Pricing = {
  price: NumericInput
  price_currency: string
  price_per_sqm: NumericInput
  maintenance_fee: NumericInput
}

type Features = {
  features: string[]
  amenities: string[]
}

type Media = {
  images: string[]
  videos?: string[]
  virtual_tour_url?: string
}

type PropertyFormState = {
  basic: BasicInfo
  details: Details
  location: Location
  pricing: Pricing
  features: Features
  media: Media
}

const EMPTY_FORM: PropertyFormState = {
  basic: {
    title: "",
    description: "",
    property_type: "house",
    status: "available",
    featured: false,
  },
  details: {
    bedrooms: "",
    bathrooms: "",
    area: "",
    land_area: "",
    year_built: "",
    parking: "",
  },
  location: {
    address: "",
    city: "",
    region: "",
    postal_code: "",
    latitude: "",
    longitude: "",
  },
  pricing: {
    price: "",
    price_currency: "CLP",
    price_per_sqm: "",
    maintenance_fee: "",
  },
  features: {
    features: [],
    amenities: [],
  },
  media: {
    images: [],
    videos: [],
    virtual_tour_url: "",
  },
}

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" ? (value as Record<string, unknown>) : {}
}

function getString(row: Record<string, unknown>, key: string, fallback = ""): string {
  const value = row[key]
  return typeof value === "string" ? value : fallback
}

function getBoolean(row: Record<string, unknown>, key: string, fallback = false): boolean {
  const value = row[key]
  return typeof value === "boolean" ? value : fallback
}

function getNumericInput(row: Record<string, unknown>, key: string): NumericInput {
  const value = row[key]
  return typeof value === "number" && Number.isFinite(value) ? value : ""
}

function getStringArray(row: Record<string, unknown>, key: string): string[] {
  const value = row[key]
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []
}

function toNullableNumber(value: NumericInput): number | null {
  if (value === "" || value === null || value === undefined) return null
  const parsed = typeof value === "number" ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function normalizePropertyRow(value: unknown): PropertyRecord {
  const row = asRecord(value)
  return {
    ...row,
    title: getString(row, "title"),
  }
}

export function PropertyEditForm({ id }: PropertyEditFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("basic-info")
  const [property, setProperty] = useState<PropertyRecord | null>(null)
  const [formData, setFormData] = useState<PropertyFormState>(EMPTY_FORM)

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const { data, error } = await supabase.from("properties").select("*").eq("id", id).single()

        if (error) throw error

        const row = asRecord(data)
        const normalizedProperty = normalizePropertyRow(data)

        setProperty(normalizedProperty)
        setFormData({
          basic: {
            title: getString(row, "title"),
            description: getString(row, "description"),
            property_type: getString(row, "property_type", "house"),
            status: getString(row, "status", "available"),
            featured: getBoolean(row, "featured"),
          },
          details: {
            bedrooms: getNumericInput(row, "bedrooms"),
            bathrooms: getNumericInput(row, "bathrooms"),
            area: getNumericInput(row, "square_meters"),
            land_area: getNumericInput(row, "lot_size"),
            year_built: getNumericInput(row, "year_built"),
            parking: "",
          },
          location: {
            address: getString(row, "address"),
            city: getString(row, "city"),
            region: getString(row, "region"),
            provincia: "",
            comuna: "",
            postal_code: "",
            latitude: getNumericInput(row, "latitude"),
            longitude: getNumericInput(row, "longitude"),
            roll_number: getString(row, "roll_number"),
          },
          pricing: {
            price: getNumericInput(row, "price"),
            price_currency: "CLP",
            price_per_sqm: "",
            maintenance_fee: "",
          },
          features: {
            features: [],
            amenities: getStringArray(row, "amenities"),
          },
          media: {
            images: getStringArray(row, "images"),
            videos: [],
            virtual_tour_url: "",
          },
        })
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Error desconocido"
        toast({
          title: "Error",
          description: "No se pudo cargar la propiedad: " + message,
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchProperty()
  }, [id, toast])

  const handleFormChange = <K extends keyof PropertyFormState>(section: K, data: PropertyFormState[K]) => {
    setFormData((prev) => ({
      ...prev,
      [section]: data,
    }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const updateData = {
        title: formData.basic.title.trim(),
        description: formData.basic.description.trim() || null,
        property_type: formData.basic.property_type,
        status: formData.basic.status,
        featured: formData.basic.featured,
        bedrooms: toNullableNumber(formData.details.bedrooms),
        bathrooms: toNullableNumber(formData.details.bathrooms),
        square_meters: toNullableNumber(formData.details.area),
        lot_size: toNullableNumber(formData.details.land_area),
        year_built: toNullableNumber(formData.details.year_built),
        address: formData.location.address.trim() || null,
        city: formData.location.city.trim(),
        region: formData.location.region.trim(),
        latitude: toNullableNumber(formData.location.latitude),
        longitude: toNullableNumber(formData.location.longitude),
        roll_number: formData.location.roll_number?.trim() || null,
        price: toNullableNumber(formData.pricing.price),
        amenities: formData.features.amenities,
        images: formData.media.images,
        updated_at: new Date().toISOString(),
      }

      if (!updateData.title || !updateData.city || !updateData.region || updateData.price === null) {
        throw new Error("Título, ciudad, región y precio son obligatorios")
      }

      const { error } = await supabase.from("properties").update(updateData).eq("id", id)

      if (error) throw error

      setProperty((prev) => normalizePropertyRow({ ...(prev || {}), ...updateData }))

      toast({
        title: "Propiedad actualizada",
        description: "Los cambios han sido guardados exitosamente.",
      })

      router.refresh()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error desconocido"
      console.log("[v0] Error saving property:", message)
      toast({
        title: "Error",
        description: "No se pudo actualizar la propiedad: " + message,
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Cargando propiedad...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Editar Propiedad: {property?.title || "Propiedad"}</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              "Guardar Cambios"
            )}
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3 md:grid-cols-6 mb-6">
              <TabsTrigger value="basic-info">Información Básica</TabsTrigger>
              <TabsTrigger value="details">Detalles</TabsTrigger>
              <TabsTrigger value="location">Ubicación</TabsTrigger>
              <TabsTrigger value="pricing">Precios</TabsTrigger>
              <TabsTrigger value="features">Características</TabsTrigger>
              <TabsTrigger value="media">Multimedia</TabsTrigger>
            </TabsList>

            <TabsContent value="basic-info">
              <PropertyBasicInfoForm data={formData.basic} onChange={(data) => handleFormChange("basic", data)} />
            </TabsContent>

            <TabsContent value="details">
              <PropertyDetailsForm data={formData.details} onChange={(data) => handleFormChange("details", data)} />
            </TabsContent>

            <TabsContent value="location">
              <PropertyLocationForm data={formData.location} onChange={(data) => handleFormChange("location", data)} />
            </TabsContent>

            <TabsContent value="pricing">
              <PropertyPricingForm data={formData.pricing} onChange={(data) => handleFormChange("pricing", data)} />
            </TabsContent>

            <TabsContent value="features">
              <PropertyFeaturesForm data={formData.features} onChange={(data) => handleFormChange("features", data)} />
            </TabsContent>

            <TabsContent value="media">
              <PropertyMediaForm
                data={formData.media}
                propertyId={id}
                onChange={(data) => handleFormChange("media", data)}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Vista Previa</h3>
          <PropertyPreview
            property={{
              ...property,
              ...formData.basic,
              ...formData.details,
              ...formData.location,
              ...formData.pricing,
              images: formData.media.images,
            }}
          />
        </CardContent>
      </Card>
    </div>
  )
}
