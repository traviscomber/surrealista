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
import { createBrowserClient } from "@/lib/supabase/client"
import { toast } from "@/components/ui/use-toast"

type MessageStatus = "pending" | "in_progress" | "resolved" | "spam"

type MessageActionsProps = {
  messageId: string
  status: MessageStatus
}

function getStatusText(status: MessageStatus) {
  switch (status) {
    case "pending":
      return "Pendiente"
    case "in_progress":
      return "En Proceso"
    case "resolved":
      return "Resuelto"
    case "spam":
      return "Spam"
  }
}

export function MessageActions({ messageId, status }: MessageActionsProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createBrowserClient()
  const numericMessageId = Number(messageId)
  const hasValidMessageId = Number.isInteger(numericMessageId)

  const updateStatus = async (newStatus: MessageStatus) => {
    if (!hasValidMessageId) return
    setLoading(true)
    try {
      const { error } = await supabase.from("messages").update({ status: newStatus }).eq("id", numericMessageId)

      if (error) {
        toast({
          title: "Error",
          description: "No se pudo actualizar el estado del mensaje",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Éxito",
        description: `Estado actualizado a ${getStatusText(newStatus)}`,
      })
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  const deleteMessage = async () => {
    if (!hasValidMessageId) return
    setLoading(true)
    try {
      const { error } = await supabase.from("messages").delete().eq("id", numericMessageId)

      if (error) {
        toast({
          title: "Error",
          description: "No se pudo eliminar el mensaje",
          variant: "destructive",
        })
        setDeleteDialogOpen(false)
        return
      }

      toast({
        title: "Éxito",
        description: "Mensaje eliminado correctamente",
      })
      router.push("/admin/mensajes")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={() => router.push("/admin/mensajes")}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Volver
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" disabled={!hasValidMessageId}>
            <MoreHorizontal className="mr-2 h-4 w-4" />
            Acciones
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Estado del mensaje</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => void updateStatus("pending")} disabled={status === "pending" || loading}>
            <Clock className="mr-2 h-4 w-4" />
            Marcar como pendiente
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => void updateStatus("in_progress")} disabled={status === "in_progress" || loading}>
            <Star className="mr-2 h-4 w-4" />
            Marcar en proceso
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => void updateStatus("resolved")} disabled={status === "resolved" || loading}>
            <CheckCircle className="mr-2 h-4 w-4" />
            Marcar como resuelto
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => void updateStatus("spam")} disabled={status === "spam" || loading}>
            <AlertCircle className="mr-2 h-4 w-4" />
            Marcar como spam
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setDeleteDialogOpen(true)} disabled={loading} className="text-red-600">
            <Trash2 className="mr-2 h-4 w-4" />
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
              onClick={(event) => {
                event.preventDefault()
                void deleteMessage()
              }}
              disabled={loading || !hasValidMessageId}
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
