"use client"

import { UserContactManager } from "@/components/tasks/user-contact-manager"

export default function GestionTareasPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Gestión de Tareas y Alertas</h1>
        <p className="text-muted-foreground mt-2">
          Administra usuarios, contactos y preferencias de notificación para el sistema de tareas
        </p>
      </div>

      <UserContactManager />
    </div>
  )
}
