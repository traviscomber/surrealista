"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"
import { Loader2 } from "lucide-react"

export default function CheckFeaturedProperties() {
  const [isLoading, setIsLoading] = useState(true)
  const [featuredProperties, setFeaturedProperties] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [updateResult, setUpdateResult] = useState<{ success: boolean; message: string } | null>(null)

  useEffect(() => {
    fetchFeaturedProperties()
  }, [])

  const fetchFeaturedProperties = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Fetch all properties to check how many are featured
      const { data: allProperties, error: allPropertiesError } = await supabase
        .from("properties")
        .select("id, featured")

      if (allPropertiesError) throw allPropertiesError

      // Fetch featured properties with their images
      const { data, error } = await supabase
        .from("properties")
        .select(`
          *,
          property_images(*)
        `)
        .eq("featured", true)
        .order("created_at", { ascending: false })

      if (error) throw error

      console.log("Featured properties:", data)
      console.log("All properties:", allProperties)

      setFeaturedProperties(data || [])
    } catch (err: any) {
      console.error("Error fetching featured properties:", err)
      setError(err.message || "Error al cargar propiedades destacadas")
    } finally {
      setIsLoading(false)
    }
  }

  const toggleFeatured = async (id: string, currentValue: boolean) => {
    setIsUpdating(true)
    setUpdateResult(null)

    try {
      const { error } = await supabase.from("properties").update({ featured: !currentValue }).eq("id", id)

      if (error) throw error

      setUpdateResult({
        success: true,
        message: `Propiedad ${currentValue ? "removida de" : "marcada como"} destacada exitosamente.`,
      })

      // Refresh the list
      fetchFeaturedProperties()
    } catch (err: any) {
      console.error("Error updating property:", err)
      setUpdateResult({
        success: false,
        message: `Error: ${err.message || "Error al actualizar propiedad"}`,
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const markRandomPropertiesAsFeatured = async () => {
    setIsUpdating(true)
    setUpdateResult(null)

    try {
      // Get all properties
      const { data: allProperties, error: fetchError } = await supabase.from("properties").select("id, featured")

      if (fetchError) throw fetchError

      if (!allProperties || allProperties.length === 0) {
        throw new Error("No hay propiedades disponibles para marcar como destacadas")
      }

      // Filter out already featured properties
      const nonFeaturedProperties = allProperties.filter((p) => !p.featured)

      if (nonFeaturedProperties.length === 0) {
        throw new Error("Todas las propiedades ya están marcadas como destacadas")
      }

      // Randomly select up to 3 properties to mark as featured
      const numToMark = Math.min(3, nonFeaturedProperties.length)
      const shuffled = [...nonFeaturedProperties].sort(() => 0.5 - Math.random())
      const selected = shuffled.slice(0, numToMark)

      // Mark selected properties as featured
      for (const property of selected) {
        const { error } = await supabase.from("properties").update({ featured: true }).eq("id", property.id)

        if (error) throw error
      }

      setUpdateResult({
        success: true,
        message: `${numToMark} propiedades marcadas como destacadas exitosamente.`,
      })

      // Refresh the list
      fetchFeaturedProperties()
    } catch (err: any) {
      console.error("Error marking properties as featured:", err)
      setUpdateResult({
        success: false,
        message: `Error: ${err.message || "Error al marcar propiedades como destacadas"}`,
      })
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Verificar Propiedades Destacadas</CardTitle>
        <CardDescription>
          Esta herramienta muestra todas las propiedades marcadas como destacadas en la base de datos.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <Button onClick={fetchFeaturedProperties} disabled={isLoading} variant="outline">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Cargando...
              </>
            ) : (
              "Actualizar lista"
            )}
          </Button>

          <Button onClick={markRandomPropertiesAsFeatured} disabled={isLoading || isUpdating}>
            {isUpdating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Actualizando...
              </>
            ) : (
              "Marcar propiedades aleatorias como destacadas"
            )}
          </Button>
        </div>

        {updateResult && (
          <div
            className={`p-4 rounded-md mb-6 ${
              updateResult.success ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
            }`}
          >
            {updateResult.message}
          </div>
        )}

        {error ? (
          <div className="p-4 bg-red-50 text-red-800 rounded-md">Error: {error}</div>
        ) : isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : featuredProperties.length === 0 ? (
          <div className="p-8 text-center border rounded-md">
            <p className="text-gray-500 mb-4">No se encontraron propiedades destacadas en la base de datos.</p>
            <p className="text-sm text-gray-400">
              Para que la sección de propiedades destacadas funcione correctamente, debe haber al menos una propiedad
              con el campo "featured" establecido como true.
            </p>
          </div>
        ) : (
          <>
            <p className="mb-4">
              Se encontraron <strong>{featuredProperties.length}</strong> propiedades destacadas en la base de datos.
            </p>

            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Ubicación</TableHead>
                    <TableHead className="text-right">Precio</TableHead>
                    <TableHead>Imágenes</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {featuredProperties.map((property) => (
                    <TableRow key={property.id}>
                      <TableCell className="font-medium">{property.title || "Sin título"}</TableCell>
                      <TableCell>
                        {property.property_type === "house"
                          ? "Casa"
                          : property.property_type === "apartment"
                            ? "Departamento"
                            : property.property_type === "land"
                              ? "Terreno"
                              : property.property_type === "rural"
                                ? "Parcela"
                                : property.property_type || "N/A"}
                      </TableCell>
                      <TableCell>{property.city || property.location || "N/A"}</TableCell>
                      <TableCell className="text-right">{formatCurrency(property.price || 0)}</TableCell>
                      <TableCell>
                        {property.property_images && property.property_images.length > 0 ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700">
                            {property.property_images.length} imágenes
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-red-50 text-red-700">
                            Sin imágenes
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleFeatured(property.id, property.featured)}
                          disabled={isUpdating}
                          className="text-red-500"
                        >
                          Quitar destacado
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
