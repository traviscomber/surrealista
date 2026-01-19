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

export function PropertyEditForm({ id }: PropertyEditFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("basic-info")
  const [property, setProperty] = useState<any>(null)
  const [formData, setFormData] = useState<any>({
    basic: {},
    details: {},
    location: {},
    pricing: {},
    features: {},
    media: { images: [] },
  })

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const { data, error } = await supabase.from("properties").select("*").eq("id", id).single()

        if (error) throw error

        setProperty(data)

        // Initialize form data with property data
        setFormData({
          basic: {
            title: data.title || "",
            description: data.description || "",
            property_type: data.property_type || "house",
            status: data.status || "available",
            featured: data.featured || false,
          },
          details: {
            bedrooms: data.bedrooms || "",
            bathrooms: data.bathrooms || "",
            area: data.area || "",
            land_area: data.land_area || "",
            year_built: data.year_built || "",
            parking: data.parking || "",
          },
          location: {
            address: data.address || "",
            city: data.city || "",
            region: data.region || "",
            postal_code: data.postal_code || "",
            latitude: data.latitude || "",
            longitude: data.longitude || "",
          },
          pricing: {
            price: data.price || "",
            price_currency: data.price_currency || "CLP",
            price_per_sqm: data.price_per_sqm || "",
            maintenance_fee: data.maintenance_fee || "",
          },
          features: {
            features: data.features || [],
            amenities: data.amenities || [],
          },
          media: {
            images: data.images || [],
            videos: data.videos || [],
            virtual_tour_url: data.virtual_tour_url || "",
          },
        })
      } catch (error: any) {
        toast({
          title: "Error",
          description: "No se pudo cargar la propiedad: " + error.message,
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchProperty()
  }, [id, toast])

  const handleFormChange = (section: string, data: any) => {
    setFormData((prev) => ({
      ...prev,
      [section]: data,
    }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Combine all form sections into one object
      const combinedData = {
        ...formData.basic,
        ...formData.details,
        ...formData.location,
        ...formData.pricing,
        ...formData.features,
        images: formData.media.images,
        videos: formData.media.videos,
        virtual_tour_url: formData.media.virtual_tour_url,
        updated_at: new Date().toISOString(),
      }

      // Convert numeric fields
      const numericFields = [
        "price",
        "bedrooms",
        "bathrooms",
        "area",
        "land_area",
        "year_built",
        "parking",
        "price_per_sqm",
        "maintenance_fee",
        "latitude",
        "longitude",
      ]

      for (const field of numericFields) {
        if (combinedData[field] !== undefined && combinedData[field] !== "") {
          combinedData[field] = Number(combinedData[field])
        }
      }

      // Update property in database
      const { error } = await supabase.from("properties").update(combinedData).eq("id", id)

      if (error) throw error

      console.log("[v0] Property saved successfully:", combinedData)

      // Update the property state with the new data
      setProperty((prev) => ({ ...prev, ...combinedData }))

      toast({
        title: "Propiedad actualizada",
        description: "Los cambios han sido guardados exitosamente.",
      })

      // Refresh the page to show updated data
      router.refresh()
    } catch (error: any) {
      console.log("[v0] Error saving property:", error.message)
      toast({
        title: "Error",
        description: "No se pudo actualizar la propiedad: " + error.message,
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
        <h2 className="text-2xl font-bold">Editar Propiedad: {property?.title}</h2>
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
