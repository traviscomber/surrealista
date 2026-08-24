"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"

type PropertyListItem = {
  id: string
  title?: string | null
  description?: string | null
  location?: string | null
  price?: number | null
}

export default function PropertyListClient() {
  const [properties, setProperties] = useState<PropertyListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setLoading(true)
        setError(null)
        const supabase = createClient()
        const { data, error: queryError } = await supabase
          .from("properties")
          .select("id,title,description,location,price")
          .order("created_at", { ascending: false })

        if (queryError) throw queryError
        setProperties((data || []) as PropertyListItem[])
      } catch (caughtError) {
        console.error("Error fetching properties:", caughtError)
        setError(caughtError instanceof Error ? caughtError.message : "No se pudieron cargar las propiedades")
      } finally {
        setLoading(false)
      }
    }

    void fetchProperties()
  }, [])

  const normalizedSearch = searchTerm.trim().toLowerCase()
  const filteredProperties = properties.filter((property) => {
    if (!normalizedSearch) return true
    return (
      (property.title || "").toLowerCase().includes(normalizedSearch) ||
      (property.description || "").toLowerCase().includes(normalizedSearch) ||
      (property.location || "").toLowerCase().includes(normalizedSearch) ||
      (property.price?.toString() || "").includes(normalizedSearch)
    )
  })

  return (
    <div>
      <div className="mb-6">
        <input
          type="text"
          placeholder="Buscar propiedades..."
          className="w-full p-2 border rounded"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />
      </div>

      {loading ? (
        <div className="text-center py-10">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
          <p className="mt-2">Cargando propiedades...</p>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
          <button
            className="mt-2 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
            onClick={() => window.location.reload()}
          >
            Reintentar
          </button>
        </div>
      ) : (
        <>
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Título</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ubicación</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProperties.length > 0 ? (
                    filteredProperties.map((property) => (
                      <tr key={property.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{property.title || "Sin título"}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{property.location || "N/A"}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {property.price != null ? `$${property.price.toLocaleString("es-CL")}` : "N/A"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Link
                            href={`/admin/propiedades/editar/${property.id}`}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            Editar
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                        No se encontraron propiedades
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-500">Total: {filteredProperties.length} propiedades</div>
        </>
      )}
    </div>
  )
}
