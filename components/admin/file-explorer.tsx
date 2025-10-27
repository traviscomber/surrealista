"use client"

import { useState, useEffect } from "react"
import { ChevronRight, ChevronDown, File, Folder, Search, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { driveService } from "@/lib/google-drive/drive-service"

interface FileNode {
  name: string
  type: "file" | "folder"
  path: string
  id?: string
  children?: FileNode[]
  size?: number
  modified?: string
}

interface FileTreeProps {
  nodes: FileNode[]
  level?: number
  searchTerm?: string
}

function FileTree({ nodes, level = 0, searchTerm = "" }: FileTreeProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())

  const toggleFolder = (path: string) => {
    const newExpanded = new Set(expandedFolders)
    if (newExpanded.has(path)) {
      newExpanded.delete(path)
    } else {
      newExpanded.add(path)
    }
    setExpandedFolders(newExpanded)
  }

  const filteredNodes = nodes.filter(
    (node) =>
      searchTerm === "" ||
      node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      node.path.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="space-y-1">
      {filteredNodes.map((node) => (
        <div key={node.path}>
          <div
            className={`flex items-center gap-2 p-2 rounded-md hover:bg-accent cursor-pointer`}
            style={{ paddingLeft: `${level * 20 + 8}px` }}
            onClick={() => node.type === "folder" && toggleFolder(node.path)}
          >
            {node.type === "folder" ? (
              <>
                {expandedFolders.has(node.path) ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
                <Folder className="h-4 w-4 text-blue-500" />
              </>
            ) : (
              <>
                <div className="w-4" />
                <File className="h-4 w-4 text-gray-500" />
              </>
            )}
            <span className="text-sm font-medium">{node.name}</span>
            {node.type === "file" && node.size && (
              <span className="text-xs text-muted-foreground ml-auto">{(node.size / 1024).toFixed(1)}KB</span>
            )}
          </div>

          {node.type === "folder" && expandedFolders.has(node.path) && node.children && (
            <FileTree nodes={node.children} level={level + 1} searchTerm={searchTerm} />
          )}
        </div>
      ))}
    </div>
  )
}

export default function FileExplorer() {
  const [searchTerm, setSearchTerm] = useState("")
  const [fileStructure, setFileStructure] = useState<FileNode[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalFiles: 0,
    totalFolders: 0,
    totalSize: 0,
  })

  const countNodes = (nodes: FileNode[]): { files: number; folders: number; size: number } => {
    let files = 0,
      folders = 0,
      size = 0

    nodes.forEach((node) => {
      if (node.type === "file") {
        files++
        size += node.size || 0
      } else {
        folders++
        if (node.children) {
          const childStats = countNodes(node.children)
          files += childStats.files
          folders += childStats.folders
          size += childStats.size
        }
      }
    })

    return { files, folders, size }
  }

  useEffect(() => {
    const loadGoogleDriveFiles = async () => {
      try {
        setLoading(true)

        // Obtener carpetas raíz de Google Drive
        const folders = await driveService.listFolders()

        // Convertir estructura de Google Drive a FileNode
        const convertToFileNode = async (folder: any): Promise<FileNode> => {
          const node: FileNode = {
            name: folder.name,
            type: "folder",
            path: `/${folder.name}`,
            id: folder.id,
            children: [],
          }

          // Obtener archivos y subcarpetas
          try {
            const [files, subfolders] = await Promise.all([
              driveService.listFiles(folder.id),
              driveService.listFolders(folder.id),
            ])

            // Agregar archivos
            if (files && files.length > 0) {
              node.children = files.map((file: any) => ({
                name: file.name,
                type: "file" as const,
                path: `${node.path}/${file.name}`,
                id: file.id,
                size: file.size ? Number.parseInt(file.size) : 0,
                modified: file.modifiedTime,
              }))
            }

            // Agregar subcarpetas (solo primer nivel para evitar carga excesiva)
            if (subfolders && subfolders.length > 0) {
              const subfolderNodes = subfolders.map((subfolder: any) => ({
                name: subfolder.name,
                type: "folder" as const,
                path: `${node.path}/${subfolder.name}`,
                id: subfolder.id,
                children: [], // No cargar recursivamente para mejor rendimiento
              }))
              node.children = [...(node.children || []), ...subfolderNodes]
            }
          } catch (error) {
            console.error(`Error loading contents for folder ${folder.name}:`, error)
          }

          return node
        }

        // Convertir todas las carpetas raíz
        const rootNodes = await Promise.all(folders.map(convertToFileNode))
        setFileStructure(rootNodes)

        // Calcular estadísticas
        const { files, folders: folderCount, size } = countNodes(rootNodes)
        setStats({ totalFiles: files, totalFolders: folderCount, totalSize: size })
      } catch (error) {
        console.error("Error loading Google Drive files:", error)
        // En caso de error, mostrar mensaje
        setFileStructure([])
      } finally {
        setLoading(false)
      }
    }

    loadGoogleDriveFiles()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Explorador de Archivos - Google Drive</h2>
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span>{stats.totalFiles} archivos</span>
          <span>{stats.totalFolders} carpetas</span>
          <span>{(stats.totalSize / 1024 / 1024).toFixed(1)}MB</span>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar archivos y carpetas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline">Expandir Todo</Button>
      </div>

      <Card className="p-4">
        <div className="max-h-[600px] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Cargando archivos de Google Drive...</span>
            </div>
          ) : fileStructure.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No se encontraron archivos en Google Drive</p>
              <p className="text-sm mt-2">Verifica la conexión con Google Drive</p>
            </div>
          ) : (
            <FileTree nodes={fileStructure} searchTerm={searchTerm} />
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <h3 className="font-semibold mb-2">Archivos Indexados</h3>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li>• Carpetas raíz de Google Drive</li>
            <li>• Archivos y subcarpetas</li>
            <li>• Sincronizado con Drive</li>
            <li>• Búsqueda en tiempo real</li>
          </ul>
        </Card>

        <Card className="p-4">
          <h3 className="font-semibold mb-2">Estadísticas</h3>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li>• {stats.totalFiles} archivos totales</li>
            <li>• {stats.totalFolders} carpetas totales</li>
            <li>• {(stats.totalSize / 1024 / 1024).toFixed(2)} MB en total</li>
          </ul>
        </Card>

        <Card className="p-4">
          <h3 className="font-semibold mb-2">Acciones Rápidas</h3>
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full bg-transparent"
              onClick={() => window.location.reload()}
            >
              Recargar Archivos
            </Button>
            <Button variant="outline" size="sm" className="w-full bg-transparent">
              Ir a Google Drive
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
