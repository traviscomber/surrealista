"use client"

import { useState, useEffect } from "react"
import { EmailSender } from "@/components/email/email-sender"
import { getEmailLogs } from "@/app/actions/email"
import { Card } from "@/components/ui/card"
import { Mail, Clock, CheckCircle, XCircle } from "lucide-react"

export default function EmailPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadLogs()
  }, [])

  const loadLogs = async () => {
    setIsLoading(true)
    const result = await getEmailLogs(undefined, 100)
    if (result.success) {
      setLogs(result.data)
    }
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-2">
          <Mail className="w-6 h-6" />
          <h1 className="text-2xl font-bold">Comunicaciones por Email</h1>
        </div>

        <EmailSender />

        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Historial de Emails</h2>

          {isLoading ? (
            <p>Cargando...</p>
          ) : logs.length === 0 ? (
            <p className="text-gray-500">No hay emails registrados</p>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-3 border rounded-md">
                  <div className="flex-1">
                    <p className="font-medium">{log.subject}</p>
                    <p className="text-sm text-gray-600">{log.recipient_email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {log.status === "sent" && (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm">Enviado</span>
                      </>
                    )}
                    {log.status === "pending" && (
                      <>
                        <Clock className="w-4 h-4 text-yellow-500" />
                        <span className="text-sm">Pendiente</span>
                      </>
                    )}
                    {log.status === "failed" && (
                      <>
                        <XCircle className="w-4 h-4 text-red-500" />
                        <span className="text-sm">Error</span>
                      </>
                    )}
                    <span className="text-xs text-gray-500">{new Date(log.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
