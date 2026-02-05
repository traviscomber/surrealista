"use client"

import { useState, useEffect } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Plus, Edit, Trash2, GripVertical } from "lucide-react"

interface Placeholder {
  id: string
  placeholder_name: string
  placeholder_label: string
  sort_order: number
}

interface FolderPlaceholdersEditorProps {
  folderId: string
  folderName: string
  isOpen: boolean
  onClose: () => void
}

export function FolderPlaceholdersEditor({
  folderId,
  folderName,
  isOpen,
  onClose,
}: FolderPlaceholdersEditorProps) {
  const [placeholders, setPlaceholders] = useState<Placeholder[]>([])
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [newPlaceholder, setNewPlaceholder] = useState({
    name: "",
    label: "",
  })
  const supabase = createBrowserClient()

  useEffect(() => {
    if (isOpen) {
      loadPlaceholders()
    }
  }, [isOpen, folderId])

  const loadPlaceholders = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("folder_placeholders")
        .select("*")
        .eq("folder_id", folderId)
        .order("sort_order", { ascending: true })

      if (error) {
        console.error("[v0] Error loading placeholders:", error)
        return
      }

      setPlaceholders(data || [])
    } catch (err) {
      console.error("[v0] Unexpected error loading placeholders:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddPlaceholder = async () => {
    if (!newPlaceholder.name.trim() || !newPlaceholder.label.trim()) {
      console.log("[v0] Placeholder name or label is empty")
      return
    }

    try {
      const { data, error } = await supabase
        .from("folder_placeholders")
        .insert([
          {
            folder_id: folderId,
            placeholder_name: newPlaceholder.name.trim(),
            placeholder_label: newPlaceholder.label.trim(),
            sort_order: placeholders.length,
          },
        ])
        .select()

      if (error) {
        console.error("[v0] Error adding placeholder:", error)
        return
      }

      console.log("[v0] Placeholder added:", data)
      setPlaceholders((prev) => [...prev, data[0]])
      setNewPlaceholder({ name: "", label: "" })
    } catch (err) {
      console.error("[v0] Unexpected error adding placeholder:", err)
    }
  }

  const handleDeletePlaceholder = async (id: string) => {
    try {
      const { error } = await supabase.from("folder_placeholders").delete().eq("id", id)

      if (error) {
        console.error("[v0] Error deleting placeholder:", error)
        return
      }

      setPlaceholders((prev) => prev.filter((p) => p.id !== id))
      setDeletingId(null)
    } catch (err) {
      console.error("[v0] Unexpected error deleting placeholder:", err)
    }
  }

  const handleUpdatePlaceholder = async (id: string, name: string, label: string) => {
    try {
      const { error } = await supabase
        .from("folder_placeholders")
        .update({
          placeholder_name: name,
          placeholder_label: label,
        })
        .eq("id", id)

      if (error) {
        console.error("[v0] Error updating placeholder:", error)
        return
      }

      setPlaceholders((prev) =>
        prev.map((p) =>
          p.id === id
            ? { ...p, placeholder_name: name, placeholder_label: label }
            : p
        )
      )
      setEditingId(null)
    } catch (err) {
      console.error("[v0] Unexpected error updating placeholder:", err)
    }
  }

  const handleReorderPlaceholders = async (fromIndex: number, toIndex: number) => {
    const newPlaceholders = [...placeholders]
    const [movedItem] = newPlaceholders.splice(fromIndex, 1)
    newPlaceholders.splice(toIndex, 0, movedItem)

    // Update sort_order for all affected items
    const updates = newPlaceholders.map((p, index) => ({
      ...p,
      sort_order: index,
    }))

    setPlaceholders(updates)

    // Batch update to database
    try {
      for (const p of updates) {
        await supabase
          .from("folder_placeholders")
          .update({ sort_order: p.sort_order })
          .eq("id", p.id)
      }
    } catch (err) {
      console.error("[v0] Error reordering placeholders:", err)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar Placeholders - {folderName}</DialogTitle>
          <DialogDescription>
            Personaliza los campos que pueden tener documentos en esta carpeta
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Placeholders List */}
          <div className="space-y-2">
            <Label className="text-base font-semibold">Placeholders Actuales</Label>
            {placeholders.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground border border-dashed rounded">
                No hay placeholders configurados. Agrega uno para comenzar.
              </div>
            ) : (
              <div className="space-y-2">
                {placeholders.map((placeholder, index) => (
                  <div
                    key={placeholder.id}
                    className="flex items-center gap-2 p-3 border rounded bg-muted/30"
                  >
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {placeholder.placeholder_label}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {placeholder.placeholder_name}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingId(placeholder.id)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setDeletingId(placeholder.id)}
                      className="h-8 w-8 p-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add New Placeholder */}
          <div className="space-y-3 pt-4 border-t">
            <Label className="text-base font-semibold">Agregar Nuevo Placeholder</Label>
            <div className="space-y-2">
              <div>
                <Label htmlFor="name" className="text-sm">
                  Nombre técnico
                </Label>
                <Input
                  id="name"
                  placeholder="ej: propuesta_comercial"
                  value={newPlaceholder.name}
                  onChange={(e) =>
                    setNewPlaceholder({ ...newPlaceholder, name: e.target.value })
                  }
                  className="text-sm"
                />
              </div>
              <div>
                <Label htmlFor="label" className="text-sm">
                  Etiqueta visible
                </Label>
                <Input
                  id="label"
                  placeholder="ej: Propuesta Comercial"
                  value={newPlaceholder.label}
                  onChange={(e) =>
                    setNewPlaceholder({ ...newPlaceholder, label: e.target.value })
                  }
                  className="text-sm"
                />
              </div>
              <Button
                onClick={handleAddPlaceholder}
                className="w-full gap-2"
                disabled={loading}
              >
                <Plus className="h-4 w-4" />
                Agregar Placeholder
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Edit Dialog */}
      {editingId && (
        <EditPlaceholderDialog
          placeholder={placeholders.find((p) => p.id === editingId)!}
          onClose={() => setEditingId(null)}
          onSave={(name, label) => {
            handleUpdatePlaceholder(editingId, name, label)
          }}
        />
      )}

      {/* Delete Dialog */}
      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Placeholder</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Está seguro que desea eliminar este placeholder? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingId && handleDeletePlaceholder(deletingId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  )
}

function EditPlaceholderDialog({
  placeholder,
  onClose,
  onSave,
}: {
  placeholder: Placeholder
  onClose: () => void
  onSave: (name: string, label: string) => void
}) {
  const [name, setName] = useState(placeholder.placeholder_name)
  const [label, setLabel] = useState(placeholder.placeholder_label)

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Placeholder</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="edit-name" className="text-sm">
              Nombre técnico
            </Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-sm"
            />
          </div>
          <div>
            <Label htmlFor="edit-label" className="text-sm">
              Etiqueta visible
            </Label>
            <Input
              id="edit-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="text-sm"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={() => {
              onSave(name, label)
              onClose()
            }}
          >
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
