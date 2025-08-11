"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"

export default function PropertyListClient() {
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setLoading(true)
        const supabase = createClient()
        const { data, error } = await supabase.from("properties").select("*").order("created_at", { ascending: false })

        if (error) {
          throw error
        }

        setProperties(data || [])
      } catch (error) {
        console.error("Error fetching properties:", error)
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    fetchProperties()
  }, [])

  const filteredProperties = properties.filter((property) => {
    const searchTermLower = searchTerm.toLowerCase()
    return (
      (property?.title || "").toLowerCase().includes(searchTermLower) ||
      (property?.description || "").toLowerCase().includes(searchTermLower) ||
      (property?.location || "").toLowerCase().includes(searchTermLower) ||
      (property?.price?.toString() || "").includes(searchTerm)
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
          onChange={(e) => setSearchTerm(e.target.value)}
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Título
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ubicación
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Precio
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
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
                            {property.price ? `$${property.price.toLocaleString()}` : "N/A"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Link
                            href={`/admin/propiedades/editar/${property.id}`}
                            className="text-indigo-600 hover:text-indigo-900 mr-4"
                          >
                            Editar
                          </Link>
                          <button className="text-red-600 hover:text-red-900">Eliminar</button>
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
