"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2, Eye, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { formatCurrency } from "@/lib/utils"

interface PropertyListProps {
  properties?: any[] // Make properties optional
}

export function PropertyList({ properties = [] }: PropertyListProps) {
  // Provide default empty array
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Ensure properties is always an array before filtering
  const safeProperties = Array.isArray(properties) ? properties : []

  // Filter properties based on search term
  const filteredProperties = safeProperties.filter(
    (property) =>
      (property.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (property.location || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (property.city || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (property.property_type || "").toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Paginate properties
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentProperties = filteredProperties.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredProperties.length / itemsPerPage)

  // Handle page change
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber)
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Buscar propiedades..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1) // Reset to first page on search
              }}
            />
          </div>
          <div className="text-sm text-gray-500">
            Mostrando {filteredProperties.length} de {safeProperties.length} propiedades
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Ubicación</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Precio</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentProperties.length > 0 ? (
                currentProperties.map((property) => (
                  <TableRow key={property.id}>
                    <TableCell className="font-medium">{property.title || "Sin título"}</TableCell>
                    <TableCell>{property.city || property.location || "N/A"}</TableCell>
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
                    <TableCell className="text-right">{formatCurrency(property.price || 0)}</TableCell>
                    <TableCell>
                      {property.status === "available" ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700">
                          Disponible
                        </Badge>
                      ) : property.status === "sold" ? (
                        <Badge variant="outline" className="bg-red-50 text-red-700">
                          Vendido
                        </Badge>
                      ) : (
                        <Badge variant="outline">{property.status || "N/A"}</Badge>
                      )}
                      {property.featured && (
                        <Badge className="ml-2" variant="secondary">
                          Destacada
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="icon" asChild>
                          <Link href={`/propiedades/${property.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button variant="outline" size="icon" asChild>
                          <Link href={`/admin/propiedades/editar/${property.id}`}>
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button variant="outline" size="icon" className="text-red-500">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4 text-gray-500">
                    No se encontraron propiedades
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-6">
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
