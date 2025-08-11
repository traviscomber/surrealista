import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin, Phone, Mail, Clock } from "lucide-react"
import { BasicImage } from "@/components/ui/basic-image"

export function ContactInfo() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Información de Contacto</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-start">
          <MapPin className="h-5 w-5 text-primary mr-3 mt-0.5" />
          <div>
            <h3 className="font-semibold mb-1">Dirección</h3>
            <p className="text-gray-600">Av. Principal 123</p>
            <p className="text-gray-600">Puerto Montt, Chile</p>
          </div>
        </div>

        <div className="flex items-start">
          <Phone className="h-5 w-5 text-primary mr-3 mt-0.5" />
          <div>
            <h3 className="font-semibold mb-1">Teléfono</h3>
            <p className="text-gray-600">+56 9 1234 5678</p>
            <p className="text-gray-600">+56 2 2345 6789</p>
          </div>
        </div>

        <div className="flex items-start">
          <Mail className="h-5 w-5 text-primary mr-3 mt-0.5" />
          <div>
            <h3 className="font-semibold mb-1">Email</h3>
            <p className="text-gray-600">info@sur-realista.cl</p>
            <p className="text-gray-600">ventas@sur-realista.cl</p>
          </div>
        </div>

        <div className="flex items-start">
          <Clock className="h-5 w-5 text-primary mr-3 mt-0.5" />
          <div>
            <h3 className="font-semibold mb-1">Horario de Atención</h3>
            <p className="text-gray-600">Lunes a Viernes: 9:00 - 18:00</p>
            <p className="text-gray-600">Sábado: 10:00 - 14:00</p>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t">
          <h3 className="font-semibold mb-3">Nuestra Oficina</h3>
          <div className="h-64 rounded-md overflow-hidden">
            <BasicImage
              src="https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1170&q=80"
              alt="Oficina Sur-Realista"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
