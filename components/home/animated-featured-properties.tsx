"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, MapPin, Bed, Bath, Maximize, Star } from 'lucide-react'

// Property data structure
interface Property {
  id: string
  title: string
  location: string
  region: string
  description: string
  price: number
  image: string
  bedrooms: number
  bathrooms: number
  squareMeters: number
  features: string[]
  contactName: string
  contactPhone: string
  contactEmail: string
  propertyType: string
  featured: boolean
  isNew: boolean
  rating: number
}

interface AnimatedFeaturedPropertiesProps {
  properties?: any[]
}

export default function AnimatedFeaturedProperties({ properties: dbProperties = [] }: AnimatedFeaturedPropertiesProps) {
  // Featured properties with working placeholder images
  const defaultProperties: Property[] = [
    {
      id: "casa-lago-villarrica-pucon",
      title: "Casa de Lujo Frente al Lago Villarrica",
      location: "Pucón, Región de la Araucanía",
      region: "Araucanía",
      description: "Espectacular casa de lujo con vista panorámica al lago Villarrica y volcán. Diseño moderno con amplios ventanales, terraza y acceso directo al lago.",
      price: 650000000,
      image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&crop=center",
      bedrooms: 4,
      bathrooms: 3,
      squareMeters: 280,
      features: ["Vista al lago", "Acceso a playa", "Terraza panorámica", "Quincho", "Calefacción central"],
      contactName: "Cristian Covarrubias",
      contactPhone: "56994368627",
      contactEmail: "c.covarrubiasf@exportsur.com",
      propertyType: "Casa",
      featured: true,
      isNew: true,
      rating: 5,
    },
    {
      id: "cabana-volcan-osorno-puerto-varas",
      title: "Cabaña Premium con Vista al Volcán Osorno",
      location: "Puerto Varas, Región de Los Lagos",
      region: "Los Lagos",
      description: "Cabaña de lujo con arquitectura tradicional alemana y vistas espectaculares al volcán Osorno y lago Llanquihue.",
      price: 480000000,
      image: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&h=600&fit=crop&crop=center",
      bedrooms: 3,
      bathrooms: 2,
      squareMeters: 220,
      features: ["Vista al volcán", "Arquitectura alemana", "Jardín amplio", "Chimenea", "Terraza"],
      contactName: "María González",
      contactPhone: "56998765432",
      contactEmail: "mgonzalez@surrealista.cl",
      propertyType: "Cabaña",
      featured: true,
      isNew: false,
      rating: 4.8,
    },
    {
      id: "casa-patrimonial-castro-chiloe",
      title: "Casa Patrimonial Restaurada en Castro",
      location: "Castro, Región de Los Lagos",
      region: "Los Lagos",
      description: "Hermosa casa patrimonial completamente restaurada con vista al mar. Arquitectura típica chilota con toques modernos.",
      price: 380000000,
      image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop&crop=center",
      bedrooms: 5,
      bathrooms: 3,
      squareMeters: 320,
      features: ["Arquitectura chilota", "Vista al mar", "Palafito restaurado", "Calefacción", "Muelle privado"],
      contactName: "Juan Pérez",
      contactPhone: "56991234567",
      contactEmail: "jperez@surrealista.cl",
      propertyType: "Casa",
      featured: true,
      isNew: false,
      rating: 4.9,
    },
    {
      id: "parcela-exclusiva-frutillar-llanquihue",
      title: "Parcela Exclusiva en Frutillar",
      location: "Frutillar, Región de Los Lagos",
      region: "Los Lagos",
      description: "Parcela con acceso privado al lago Llanquihue. Terreno plano con bosque nativo, ideal para construir la casa de sus sueños.",
      price: 420000000,
      image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=600&fit=crop&crop=center",
      bedrooms: 0,
      bathrooms: 0,
      squareMeters: 5000,
      features: ["Acceso al lago", "Bosque nativo", "Terreno plano", "Servicios básicos", "Vista al volcán"],
      contactName: "Ana Muñoz",
      contactPhone: "56997654321",
      contactEmail: "amunoz@surrealista.cl",
      propertyType: "Parcela",
      featured: true,
      isNew: true,
      rating: 4.7,
    },
    {
      id: "casa-moderna-valdivia-rio",
      title: "Casa Moderna en Valdivia",
      location: "Valdivia, Región de Los Ríos",
      region: "Los Ríos",
      description: "Moderna casa con acceso directo al río Calle-Calle. Diseño contemporáneo con amplios espacios y muelle privado.",
      price: 390000000,
      image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop&crop=center",
      bedrooms: 4,
      bathrooms: 3,
      squareMeters: 260,
      features: ["Acceso al río", "Muelle privado", "Diseño moderno", "Ventanales", "Terraza"],
      contactName: "Roberto Silva",
      contactPhone: "56993456789",
      contactEmail: "rsilva@surrealista.cl",
      propertyType: "Casa",
      featured: true,
      isNew: false,
      rating: 4.6,
    },
  ]

  // Use database properties if available, otherwise use default
  const properties = dbProperties.length > 0 ? dbProperties.map((prop, index) => ({
    ...prop,
    image: prop.image || defaultProperties[index % defaultProperties.length]?.image || "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&crop=center",
    rating: prop.rating || 4.5,
    propertyType: prop.property_type || "Casa",
    squareMeters: prop.square_meters || prop.squareMeters || 200,
    isNew: prop.created_at && new Date(prop.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  })) : defaultProperties

  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)
  const [imageErrors, setImageErrors] = useState<{[key: string]: boolean}>({})
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null)
  const currentProperty = properties[currentIndex]

  // Auto-advance carousel
  useEffect(() => {
    if (isAutoPlaying && properties.length > 1) {
      autoPlayRef.current = setInterval(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % properties.length)
      }, 5000)
    }

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current)
      }
    }
  }, [isAutoPlaying, properties.length])

  // Pause auto-play when user interacts
  const handleManualNavigation = (index: number) => {
    setCurrentIndex(index)
    setIsAutoPlaying(false)

    if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current)
    }

    setTimeout(() => {
      setIsAutoPlaying(true)
    }, 10000)
  }

  const nextSlide = () => {
    handleManualNavigation((currentIndex + 1) % properties.length)
  }

  const prevSlide = () => {
    handleManualNavigation((currentIndex - 1 + properties.length) % properties.length)
  }

  // Format price in Chilean pesos
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      maximumFractionDigits: 0,
    }).format(price)
  }

  // Handle image error
  const handleImageError = (propertyId: string) => {
    setImageErrors(prev => ({ ...prev, [propertyId]: true }))
  }

  // Get image URL with fallback
  const getImageUrl = (property: Property) => {
    if (imageErrors[property.id]) {
      return "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&crop=center"
    }
    return property.image || "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&crop=center"
  }

  if (!currentProperty) {
    return null
  }

  return (
    <section className="py-16 bg-gradient-to-br from-blue-50 to-green-50">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-blue-100 to-green-100 mb-4">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-green-600 flex items-center justify-center mr-2">
              <Star className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-semibold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
              Propiedades Destacadas
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Descubre el Sur de Chile</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Propiedades cuidadosamente seleccionadas en los destinos más exclusivos del sur de Chile
          </p>
        </div>

        {/* Main Carousel */}
        <div className="relative bg-white rounded-3xl shadow-xl overflow-hidden mb-8">
          {/* Property Image */}
          <div className="relative h-[500px] md:h-[600px] overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full h-full"
              >
                <img
                  src={getImageUrl(currentProperty) || "/placeholder.svg"}
                  alt={currentProperty.title || "Propiedad en el Sur de Chile"}
                  className="w-full h-full object-cover"
                  onError={() => handleImageError(currentProperty.id)}
                />
              </motion.div>
            </AnimatePresence>

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

            {/* Property Type Badge */}
            <div className="absolute top-6 left-6 flex items-center space-x-3">
              <Badge className="bg-gradient-to-r from-blue-600 to-green-600 text-white border-0 py-1.5 px-3 text-sm">
                {currentProperty.propertyType || "Casa"}
              </Badge>
              {currentProperty.isNew && (
                <Badge className="bg-amber-500 text-white border-0 py-1.5 px-3 text-sm">Nuevo</Badge>
              )}
            </div>

            {/* Rating */}
            <div className="absolute top-6 right-6">
              <div className="flex items-center bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5">
                <Star className="h-4 w-4 text-amber-500 fill-amber-500 mr-1" />
                <span className="text-sm font-semibold">{currentProperty.rating?.toFixed(1) || "4.8"}</span>
              </div>
            </div>

            {/* Property Info */}
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentIndex}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                  className="space-y-4"
                >
                  {/* Title and Location */}
                  <div>
                    <h3 className="text-2xl md:text-4xl font-bold text-white mb-2">
                      {currentProperty.title || "Propiedad Exclusiva"}
                    </h3>
                    <div className="flex items-center text-white/90">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span>{currentProperty.location || "Sur de Chile"}</span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-white/80 max-w-3xl line-clamp-2 md:line-clamp-3">
                    {currentProperty.description || "Hermosa propiedad ubicada en el sur de Chile"}
                  </p>

                  {/* Property Stats */}
                  <div className="flex flex-wrap gap-4">
                    {(currentProperty.bedrooms || 0) > 0 && (
                      <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                        <Bed className="h-4 w-4 text-white mr-2" />
                        <span className="text-white">{currentProperty.bedrooms} dormitorios</span>
                      </div>
                    )}
                    {(currentProperty.bathrooms || 0) > 0 && (
                      <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                        <Bath className="h-4 w-4 text-white mr-2" />
                        <span className="text-white">{currentProperty.bathrooms} baños</span>
                      </div>
                    )}
                    <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                      <Maximize className="h-4 w-4 text-white mr-2" />
                      <span className="text-white">{currentProperty.squareMeters || currentProperty.square_meters || 200} m²</span>
                    </div>
                  </div>

                  {/* Price and CTA */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="bg-white/90 backdrop-blur-sm rounded-xl px-5 py-3">
                      <span className="text-sm text-gray-600">Precio</span>
                      <div className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                        {formatPrice(currentProperty.price || 350000000)}
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Link href={`/propiedades/${currentProperty.id}`}>
                        <Button className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white border-0">
                          Ver Detalles
                        </Button>
                      </Link>
                      <Button variant="outline" className="border-white text-white hover:bg-white/20 bg-transparent">
                        Contactar Asesor
                      </Button>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Navigation Arrows */}
            {properties.length > 1 && (
              <>
                <button
                  onClick={prevSlide}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors z-10"
                >
                  <ChevronLeft className="h-6 w-6 text-gray-800" />
                </button>
                <button
                  onClick={nextSlide}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors z-10"
                >
                  <ChevronRight className="h-6 w-6 text-gray-800" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Thumbnails */}
        {properties.length > 1 && (
          <div className="flex justify-center">
            <div className="flex space-x-2 overflow-x-auto pb-2 max-w-full">
              {properties.map((property, index) => (
                <button
                  key={property.id || index}
                  onClick={() => handleManualNavigation(index)}
                  className={`relative flex-shrink-0 w-24 h-16 md:w-32 md:h-20 rounded-lg overflow-hidden transition-all ${
                    currentIndex === index
                      ? "ring-2 ring-offset-2 ring-blue-600 scale-105"
                      : "opacity-70 hover:opacity-100"
                  }`}
                >
                  <img
                    src={getImageUrl(property) || "/placeholder.svg"}
                    alt={property.title || "Propiedad"}
                    className="w-full h-full object-cover"
                    onError={() => handleImageError(property.id)}
                  />
                  {currentIndex === index && <div className="absolute inset-0 bg-blue-600/20" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Dots Indicator */}
        {properties.length > 1 && (
          <div className="flex justify-center mt-6">
            <div className="flex space-x-2">
              {properties.map((_, index) => (
                <button
                  key={index}
                  onClick={() => handleManualNavigation(index)}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    currentIndex === index
                      ? "bg-gradient-to-r from-blue-600 to-green-600 w-8"
                      : "bg-gray-300 hover:bg-gray-400"
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
