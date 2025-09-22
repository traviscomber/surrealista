"use client"

import { useState, useEffect } from "react"
import { ChevronRight, ChevronDown, File, Folder, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface FileNode {
  name: string
  type: "file" | "folder"
  path: string
  children?: FileNode[]
  size?: number
  modified?: string
}

// Mock data structure - in real implementation, this would come from your file system
const mockFileStructure: FileNode[] = [
  {
    name: "app",
    type: "folder",
    path: "/app",
    children: [
      {
        name: "(dashboard)",
        type: "folder",
        path: "/app/(dashboard)",
        children: [{ name: "admin", type: "folder", path: "/app/(dashboard)/admin" }],
      },
      {
        name: "(features)",
        type: "folder",
        path: "/app/(features)",
        children: [
          { name: "ai", type: "folder", path: "/app/(features)/ai" },
          { name: "properties", type: "folder", path: "/app/(features)/properties" },
        ],
      },
      {
        name: "api",
        type: "folder",
        path: "/app/api",
        children: [{ name: "v1", type: "folder", path: "/app/api/v1" }],
      },
      { name: "layout.tsx", type: "file", path: "/app/layout.tsx", size: 1024 },
      { name: "globals.css", type: "file", path: "/app/globals.css", size: 2048 },
    ],
  },
  {
    name: "components",
    type: "folder",
    path: "/components",
    children: [
      { name: "admin", type: "folder", path: "/components/admin" },
      { name: "ai-features", type: "folder", path: "/components/ai-features" },
      { name: "auth", type: "folder", path: "/components/auth" },
      { name: "properties", type: "folder", path: "/components/properties" },
      { name: "ui", type: "folder", path: "/components/ui" },
    ],
  },
  {
    name: "lib",
    type: "folder",
    path: "/lib",
    children: [
      { name: "agents", type: "folder", path: "/lib/agents" },
      { name: "ai", type: "folder", path: "/lib/ai" },
      { name: "services", type: "folder", path: "/lib/services" },
      { name: "supabase", type: "folder", path: "/lib/supabase" },
      { name: "utils", type: "folder", path: "/lib/utils" },
    ],
  },
  {
    name: "scripts",
    type: "folder",
    path: "/scripts",
    children: [
      { name: "migrations", type: "folder", path: "/scripts/migrations" },
      { name: "imports", type: "folder", path: "/scripts/imports" },
    ],
  },
]

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
    const { files, folders, size } = countNodes(mockFileStructure)
    setStats({ totalFiles: files, totalFolders: folders, totalSize: size })
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Explorador de Archivos</h2>
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
          <FileTree nodes={mockFileStructure} searchTerm={searchTerm} />
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <h3 className="font-semibold mb-2">Sugerencias de Organización</h3>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li>• Agrupar componentes por funcionalidad</li>
            <li>• Separar lógica de negocio de UI</li>
            <li>• Usar nombres consistentes (ES/EN)</li>
            <li>• Limitar profundidad a 3 niveles</li>
          </ul>
        </Card>

        <Card className="p-4">
          <h3 className="font-semibold mb-2">Archivos Más Grandes</h3>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li>• globals.css (2.0KB)</li>
            <li>• layout.tsx (1.0KB)</li>
            <li>• Revisar archivos grandes</li>
          </ul>
        </Card>

        <Card className="p-4">
          <h3 className="font-semibold mb-2">Acciones Rápidas</h3>
          <div className="space-y-2">
            <Button variant="outline" size="sm" className="w-full bg-transparent">
              Reorganizar Carpetas
            </Button>
            <Button variant="outline" size="sm" className="w-full bg-transparent">
              Limpiar Archivos
            </Button>
            <Button variant="outline" size="sm" className="w-full bg-transparent">
              Generar Índice
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
