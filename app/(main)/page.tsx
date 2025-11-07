"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Folder,
  FileText,
  MapPin,
  Calendar,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  ArrowLeft,
  FolderOpen,
  File,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import dynamic from "next/dynamic"
import { createBrowserClient } from "@supabase/ssr"
import { useRouter } from "next/navigation"

const SimpleDriveFolderView = dynamic(
  () =>
    import("@/components/google-drive/simple-drive-folder-view").then((mod) => ({
      default: mod.SimpleDriveFolderView,
    })),
  {
    loading: () => (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    ),
    ssr: false,
  },
)

const realDriveService: any = null

interface SearchIndexItem {
  id: string
  name: string
  type: "folder" | "file"
  path: string
  parentId: string
  mimeType?: string
}

interface IndexingProgress {
  isIndexing: boolean
  currentFolder: string
  foldersProcessed: number
  filesProcessed: number
  totalProgress: number
}

function FolderDetailView({ folder, onBack }: { folder: any; onBack: () => void }) {
  const [folderContents, setFolderContents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadFolderContents()
  }, [folder.id])

  const loadFolderContents = async () => {
    try {
      setLoading(true)
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      )

      const { data, error } = await supabase
        .from("kmz_collection")
        .select("*")
        .eq("region", folder.location)
        .order("created_at", { ascending: false })

      if (error) throw error

      setFolderContents(data || [])
    } catch (err) {
      console.error("[v0] Error loading folder contents:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <FolderOpen className="h-5 w-5 text-blue-600" />
                {folder.name}
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="flex items-center justify-center mb-2">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-blue-600">{folder.files}</p>
              <p className="text-sm text-gray-600">archivos</p>
            </div>
            <div>
              <div className="flex items-center justify-center mb-2">
                <MapPin className="h-5 w-5 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-green-600">{folder.rolNumbers}</p>
              <p className="text-sm text-gray-600">números de rol</p>
            </div>
            <div>
              <div className="flex items-center justify-center mb-2">
                <Calendar className="h-5 w-5 text-purple-600" />
              </div>
              <p className="text-sm font-bold text-purple-600">Aug 8,</p>
              <p className="text-sm text-gray-600">2025</p>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Archivos en esta carpeta</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : folderContents.length === 0 ? (
              <div className="text-center py-12">
                <Folder className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No se encontraron archivos</p>
              </div>
            ) : (
              <div className="space-y-2">
                {folderContents.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <File className="h-5 w-5 text-gray-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{file.file_name || "Sin nombre"}</p>
                      <p className="text-xs text-gray-500">{file.region}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

const FolderCard = ({
  folder,
  viewMode,
  onViewDetails,
}: { folder: any; viewMode: "grid" | "list"; onViewDetails: (folder: any) => void }) => {
  const statusConfig = useMemo(() => {
    const getStatusColor = (status: string) => {
      switch (status) {
        case "complete":
          return "text-green-600 bg-green-50 border-green-200"
        case "processing":
          return "text-blue-600 bg-blue-50 border-blue-200"
        case "pending":
          return "text-yellow-600 bg-yellow-50 border-yellow-200"
        default:
          return "text-red-600 bg-red-50 border-red-200"
      }
    }

    const getStatusIcon = (status: string) => {
      switch (status) {
        case "complete":
          return <CheckCircle className="h-4 w-4" />
        case "processing":
          return <Calendar className="h-4 w-4" />
        case "pending":
          return <AlertCircle className="h-4 w-4" />
        default:
          return <AlertCircle className="h-4 w-4" />
      }
    }

    const getStatusText = (status: string) => {
      switch (status) {
        case "complete":
          return "Completo"
        case "processing":
          return "Procesando"
        case "pending":
          return "Pendiente"
        default:
          return "Incompleto"
      }
    }

    return { getStatusColor, getStatusIcon, getStatusText }
  }, [])

  const handleClick = useCallback(() => {
    onViewDetails(folder)
  }, [folder, onViewDetails])

  if (viewMode === "list") {
    return (
      <div
        className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
        onClick={handleClick}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Folder className="h-5 w-5 text-blue-600" />
            <div>
              <h3 className="font-medium text-gray-900">{folder.name}</h3>
              <p className="text-sm text-gray-500">
                {folder.location} • {folder.propertyType}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                {folder.files}
              </span>
            </div>
            <div className="text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {folder.rolNumbers}
              </span>
            </div>
            <Badge className={statusConfig.getStatusColor(folder.status)}>
              {statusConfig.getStatusIcon(folder.status)}
              {statusConfig.getStatusText(folder.status)}
            </Badge>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={handleClick}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium truncate">{folder.name}</CardTitle>
          <Badge className={statusConfig.getStatusColor(folder.status)}>
            {statusConfig.getStatusIcon(folder.status)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Archivos:</span>
            <span className="font-medium">{folder.files}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Rol:</span>
            <span className="font-medium">{folder.rolNumbers}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Completitud:</span>
            <span className="font-medium">{folder.completionScore}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    router.push("/busqueda")
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
      <div className="text-center">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
        <p className="text-gray-600">Redirigiendo a búsqueda...</p>
      </div>
    </div>
  )
}
