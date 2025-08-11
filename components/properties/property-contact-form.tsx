"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Mail, Phone, User, MessageSquare, Send, CheckCircle, MapPin } from "lucide-react"
import { supabase } from "@/lib/supabase/client"

interface Property {
  id: number
  title?: string
  price?: number
  location?: string
}

interface PropertyContactFormProps {
  property?: Property
  propertyId?: string
}

interface FormData {
  name: string
  email: string
  phone: string
  message: string
  acceptTerms: boolean
  contactPreference: "email" | "phone" | "both"
}

export function PropertyContactForm({ property, propertyId }: PropertyContactFormProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    message: property?.title
      ? `Hola, estoy interesado en la propiedad "${property.title}". Me gustaría recibir más información.`
      : "Hola, estoy interesado en esta propiedad. Me gustaría recibir más información.",
    acceptTerms: false,
    contactPreference: "email",
  })
  const [errors, setErrors] = useState<Partial<FormData>>({})

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {}

    if (!formData.name.trim()) {
      newErrors.name = "El nombre es requerido"
    }

    if (!formData.email.trim()) {
      newErrors.email = "El email es requerido"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email inválido"
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "El teléfono es requerido"
    } else if (!/^(\+56)?[0-9]{8,9}$/.test(formData.phone.replace(/\s/g, ""))) {
      newErrors.phone = "Teléfono inválido (formato chileno)"
    }

    if (!formData.message.trim()) {
      newErrors.message = "El mensaje es requerido"
    } else if (formData.message.length < 10) {
      newErrors.message = "El mensaje debe tener al menos 10 caracteres"
    }

    if (!formData.acceptTerms) {
      newErrors.acceptTerms = "Debe aceptar los términos y condiciones"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      toast({
        title: "Error en el formulario",
        description: "Por favor corrige los errores antes de enviar",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Create lead in database
      const leadData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        message: formData.message,
        property_id: property?.id || Number.parseInt(propertyId || "0"),
        property_title: property?.title || "Propiedad desconocida",
        contact_preference: formData.contactPreference,
        source: "property_detail_form",
        status: "new",
        created_at: new Date().toISOString(),
      }

      const { error } = await supabase.from("leads").insert([leadData])

      if (error) {
        throw error
      }

      setIsSuccess(true)
      toast({
        title: "¡Mensaje enviado!",
        description: "Nos pondremos en contacto contigo pronto.",
      })

      // Reset form
      setFormData({
        name: "",
        email: "",
        phone: "",
        message: "",
        acceptTerms: false,
        contactPreference: "email",
      })
    } catch (error) {
      console.error("Error submitting form:", error)
      toast({
        title: "Error al enviar",
        description: "Hubo un problema al enviar tu mensaje. Inténtalo de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      minimumFractionDigits: 0,
    }).format(price)
  }

  if (isSuccess) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-8 text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">¡Mensaje Enviado!</h3>
          <p className="text-gray-600 mb-6">
            Gracias por tu interés en {property?.title || "esta propiedad"}. Nos pondremos en contacto contigo dentro de
            las próximas 24 horas.
          </p>
          <Button onClick={() => setIsSuccess(false)} variant="outline" className="w-full">
            Enviar Otro Mensaje
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-semibold text-gray-900 flex items-center">
          <MessageSquare className="h-5 w-5 mr-2 text-blue-600" />
          Contactar por esta Propiedad
        </CardTitle>
        {property && (
          <div className="space-y-2">
            <p className="text-sm text-gray-600 font-medium">{property.title}</p>
            {property.price && (
              <Badge variant="secondary" className="text-blue-600">
                {formatPrice(property.price)}
              </Badge>
            )}
            {property.location && (
              <div className="flex items-center text-xs text-gray-500">
                <MapPin className="h-3 w-3 mr-1" />
                {property.location}
              </div>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium text-gray-700">
              <User className="h-4 w-4 inline mr-1" />
              Nombre Completo *
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="Tu nombre completo"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
          </div>

          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-gray-700">
              <Mail className="h-4 w-4 inline mr-1" />
              Email *
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="tu@email.com"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              className={errors.email ? "border-red-500" : ""}
            />
            {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
          </div>

          {/* Phone Field */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
              <Phone className="h-4 w-4 inline mr-1" />
              Teléfono *
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+56 9 1234 5678"
              value={formData.phone}
              onChange={(e) => handleInputChange("phone", e.target.value)}
              className={errors.phone ? "border-red-500" : ""}
            />
            {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
          </div>

          {/* Contact Preference */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Preferencia de Contacto</Label>
            <div className="flex space-x-4">
              {[
                { value: "email", label: "Email" },
                { value: "phone", label: "Teléfono" },
                { value: "both", label: "Ambos" },
              ].map((option) => (
                <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="contactPreference"
                    value={option.value}
                    checked={formData.contactPreference === option.value}
                    onChange={(e) => handleInputChange("contactPreference", e.target.value)}
                    className="text-blue-600"
                  />
                  <span className="text-sm text-gray-700">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Message Field */}
          <div className="space-y-2">
            <Label htmlFor="message" className="text-sm font-medium text-gray-700">
              Mensaje *
            </Label>
            <Textarea
              id="message"
              placeholder="Cuéntanos sobre tu interés en esta propiedad..."
              value={formData.message}
              onChange={(e) => handleInputChange("message", e.target.value)}
              className={`min-h-[100px] ${errors.message ? "border-red-500" : ""}`}
            />
            {errors.message && <p className="text-xs text-red-500">{errors.message}</p>}
          </div>

          {/* Terms Checkbox */}
          <div className="flex items-start space-x-2">
            <Checkbox
              id="terms"
              checked={formData.acceptTerms}
              onCheckedChange={(checked) => handleInputChange("acceptTerms", checked as boolean)}
              className={errors.acceptTerms ? "border-red-500" : ""}
            />
            <Label htmlFor="terms" className="text-xs text-gray-600 leading-relaxed">
              Acepto los{" "}
              <a href="/terminos" className="text-blue-600 hover:underline">
                términos y condiciones
              </a>{" "}
              y autorizo el tratamiento de mis datos personales para fines comerciales. *
            </Label>
          </div>
          {errors.acceptTerms && <p className="text-xs text-red-500">{errors.acceptTerms}</p>}

          {/* Submit Button */}
          <Button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Enviar Mensaje
              </>
            )}
          </Button>
        </form>

        {/* Additional Info */}
        <div className="pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">Respuesta garantizada en menos de 24 horas</p>
        </div>
      </CardContent>
    </Card>
  )
}
