"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, Mail, Phone } from "lucide-react"

export function ComunicacionesView() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MessageSquare className="h-5 w-5 text-green-600" />
              WhatsApp
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Mensajes sin leer</span>
                <Badge className="bg-green-50 text-green-700">12</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Conversaciones activas</span>
                <Badge variant="outline">8</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Mail className="h-5 w-5 text-blue-600" />
              Gmail
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Correos sin leer</span>
                <Badge className="bg-blue-50 text-blue-700">5</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Respuestas pendientes</span>
                <Badge variant="outline">3</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Phone className="h-5 w-5 text-purple-600" />
              Llamadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Llamadas perdidas</span>
                <Badge className="bg-purple-50 text-purple-700">2</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Seguimientos hoy</span>
                <Badge variant="outline">4</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historial de Comunicaciones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Historial de comunicaciones próximamente</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
