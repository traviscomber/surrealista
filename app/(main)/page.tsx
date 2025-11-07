"use client"

import type React from "react"

export const dynamic = "force-dynamic"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, MapIcon, Loader2, Upload, TrendingUp } from "lucide-react"
import { createBrowserClient } from "@/lib/supabase/client"
import dynamicImport from "next/dynamic"
import { kmzStorageService } from "@/lib/kmz/kmz-storage-service"
import { kmzReader } from "@/lib/kmz/kmz-reader"
import { SimpleDriveFolderView } from "@/components/google-drive/simple-drive-folder-view"
import Link from "next/link"

const KMZMapDisplay = dynamicImport(() => import("@/components/kmz/kmz-map-display").then((mod) => mod.KMZMapDisplay), {
  ssr: false,
  loading: () => (
    <div className="h-[600px] w-full flex items-center justify-center bg-slate-100 rounded-xl">
      <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
    </div>
  ),
})

interface KMZFile {
  id: string
  file_name: string
  coordinates: any
  placemarks_count: number
}

export default function HomePage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [kmzFiles, setKmzFiles] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadingKMZ, setUploadingKMZ] = useState(false)

  const supabase = createBrowserClient()

  useEffect(() => {
    getCurrentUser()
  }, [])

  const getCurrentUser = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setCurrentUser(user)
    } catch (error) {
      console.error("[v0] Error getting user:", error)
    }
  }

  const handleFolderKMZSelection = async (driveItems: any[]) => {
    console.log("[v0] Loading KMZ data for", driveItems.length, "selected files")
    setLoading(true)

    try {
      const supabase = createBrowserClient()

      // Get KMZ data from Supabase for the selected files
      const fileNames = driveItems.map((item) => item.name)

      const { data, error } = await supabase
        .from("kmz_collection")
        .select("*")
        .eq("is_active", true)
        .in("file_name", fileNames)

      if (error) {
        console.error("[v0] Error loading KMZ data:", error)
        setKmzFiles([])
        return
      }

      console.log("[v0] Loaded KMZ data for", data?.length || 0, "files")

      // Transform to map format
      const transformedKMZ = (data || []).map((record: any) => {
        const placemarks = (record.coordinates || []).map((coordArray: any, index: number) => {
          let geometryType = "Point"
          let coordinates = coordArray

          if (Array.isArray(coordArray) && coordArray.length > 3) {
            if (Array.isArray(coordArray[0]) && coordArray[0].length >= 2 && typeof coordArray[0][0] === "number") {
              geometryType = "Polygon"
              coordinates = coordArray
            }
          }

          return {
            name: `${record.file_name} - ${geometryType === "Polygon" ? "Polígono" : "Punto"} ${index + 1}`,
            type: geometryType,
            coordinates: coordinates,
            description: record.description || "",
            properties: {
              rol: record.rol_numbers?.[index] || "",
              category: record.category || "general",
            },
          }
        })

        return {
          fileName: record.file_name,
          placemarks: placemarks,
          bounds: record.bounds,
          metadata: {
            id: record.id,
            category: record.category,
            rolNumbers: record.rol_numbers || [],
            placemarks_count: record.placemarks_count,
          },
        }
      })

      setKmzFiles(transformedKMZ)
    } catch (err) {
      console.error("[v0] Error loading KMZ data:", err)
      setKmzFiles([])
    } finally {
      setLoading(false)
    }
  }

  const handleOfflineKMZUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setUploadingKMZ(true)
    console.log("[v0] Uploading", files.length, "KMZ files from local computer...")

    try {
      const uploadedKMZ = []

      for (const file of Array.from(files)) {
        try {
          console.log("[v0] Processing offline KMZ file:", file.name)

          // Parse the KMZ file
          const kmzData = await kmzReader.readKMZFile(file)

          try {
            const saveResult = await kmzStorageService.saveKMZ({
              file_name: file.name,
              file_path: "offline-upload",
              description: kmzData.metadata?.description,
              metadata: kmzData.metadata,
              placemarks_count: kmzData.placemarks.length,
              rol_numbers: kmzReader.extractPropertyRoles(kmzData),
              bounds: kmzData.bounds,
              coordinates: kmzData.placemarks.map((p) => p.coordinates),
              category: "offline",
              created_by: currentUser?.id,
            })

            if (saveResult.success) {
              console.log("[v0] Offline KMZ saved to database:", file.name)
            }
          } catch (dbError) {
            console.error("[v0] Error saving KMZ to database:", dbError)
          }

          uploadedKMZ.push({
            id: file.name,
            name: file.name,
            placemarks: kmzData.placemarks,
          })
        } catch (error) {
          console.error("[v0] Error processing offline KMZ file:", file.name, error)
        }
      }

      if (uploadedKMZ.length > 0) {
        setKmzFiles((prev) => [...prev, ...uploadedKMZ])
        console.log("[v0] Successfully uploaded", uploadedKMZ.length, "KMZ files")
      }
    } catch (error) {
      console.error("[v0] Error uploading offline KMZ files:", error)
    } finally {
      setUploadingKMZ(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 p-6">
      <div className="max-w-[1800px] mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-blue-600" />
              Sur-Realista - Gestión de Campos
            </h1>
            <p className="text-gray-600">Visualización y gestión de campos con archivos KMZ</p>
          </div>
          <Link href="/busqueda">
            <Button variant="outline">Ver Búsqueda Completa</Button>
          </Link>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              placeholder="Buscar carpetas y archivos KMZ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-14 text-lg"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[calc(100vh-16rem)] min-h-[600px]">
          {/* Folder Structure */}
          <div className="h-full overflow-hidden lg:col-span-1">
            <SimpleDriveFolderView
              apiKey="AIzaSyB6AVo8HT0RyEmiu8YRKj3skR3ujXyjHTU"
              onKMZSelected={handleFolderKMZSelection}
            />
          </div>

          {/* Map Display */}
          <div className="h-full relative lg:col-span-3">
            <Card className="h-full flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapIcon className="h-5 w-5" />
                  Visualización de Campos
                  {kmzFiles.length > 0 && (
                    <Badge variant="outline" className="ml-auto">
                      {kmzFiles.length} archivo{kmzFiles.length !== 1 ? "s" : ""}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden">
                {loading ? (
                  <div className="h-full flex items-center justify-center bg-slate-100 rounded-xl">
                    <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                  </div>
                ) : kmzFiles.length > 0 ? (
                  <div className="h-full w-full rounded-xl overflow-hidden relative z-0">
                    <KMZMapDisplay kmzFiles={kmzFiles} height="100%" />
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center bg-slate-50 rounded-xl">
                    <MapIcon className="h-16 w-16 text-gray-300 mb-4" />
                    <p className="text-gray-500 font-medium">Selecciona una carpeta o archivo</p>
                    <p className="text-sm text-gray-400 mt-2 text-center max-w-sm">
                      Haz clic en las carpetas de la izquierda para visualizar los campos en el mapa
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="absolute top-4 right-4 z-[1000]">
              <input
                ref={fileInputRef}
                type="file"
                accept=".kmz,.kml"
                multiple
                onChange={handleOfflineKMZUpload}
                className="hidden"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingKMZ}
                className="bg-white shadow-lg hover:bg-gray-50"
              >
                {uploadingKMZ ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Subiendo...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Cargar KMZ Offline
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
