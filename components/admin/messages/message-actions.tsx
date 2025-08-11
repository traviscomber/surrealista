"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { MoreHorizontal, Trash2, Clock, CheckCircle, AlertCircle, Star, ArrowLeft } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { toast } from "@/components/ui/use-toast"

type MessageActionsProps = {
  messageId: string
  status: "pending" | "in_progress" | "resolved" | "spam"
}

export function MessageActions({ messageId, status }: MessageActionsProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClientComponentClient()

  const updateStatus = async (newStatus: string) => {
    setLoading(true)

    const { error } = await supabase.from("messages").update({ status: newStatus }).eq("id", messageId)

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado del mensaje",
        variant: "destructive",
      })
    } else {
      toast({
        title: "Éxito",
        description: `Estado actualizado a ${getStatusText(newStatus)}`,
      })
      router.refresh()
    }

    setLoading(false)
  }

  const deleteMessage = async () => {
    setLoading(true)

    const { error } = await supabase.from("messages").delete().eq("id", messageId)

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el mensaje",
        variant: "destructive",
      })
      setDeleteDialogOpen(false)
    } else {
      toast({
        title: "Éxito",
        description: "Mensaje eliminado correctamente",
      })
      router.push("/admin/mensajes")
    }

    setLoading(false)
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "Pendiente"
      case "in_progress":
        return "En Proceso"
      case "resolved":
        return "Resuelto"
      case "spam":
        return "Spam"
      default:
        return status
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={() => router.push("/admin/mensajes")}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Volver
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <MoreHorizontal className="h-4 w-4 mr-2" />
            Acciones
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Estado del mensaje</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => updateStatus("pending")} disabled={status === "pending" || loading}>
            <Clock className="h-4 w-4 mr-2" />
            Marcar como pendiente
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => updateStatus("in_progress")} disabled={status === "in_progress" || loading}>
            <Star className="h-4 w-4 mr-2" />
            Marcar en proceso
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => updateStatus("resolved")} disabled={status === "resolved" || loading}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Marcar como resuelto
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => updateStatus("spam")} disabled={status === "spam" || loading}>
            <AlertCircle className="h-4 w-4 mr-2" />
            Marcar como spam
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setDeleteDialogOpen(true)} disabled={loading} className="text-red-600">
            <Trash2 className="h-4 w-4 mr-2" />
            Eliminar mensaje
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El mensaje será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                deleteMessage()
              }}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700"
            >
              {loading ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
