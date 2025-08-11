"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, MapPin, Home, TrendingUp, Mountain, Trees, Waves } from 'lucide-react'
import Link from "next/link"

const PROPERTY_SUGGESTIONS = [
  {
    icon: Waves,
    title: "Cabañas Frente al Lago",
    description: "Villarrica, Llanquihue, Ranco",
    searchParams: { type: "cabaña", location: "pucon", q: "lago" },
  },
  {
    icon: Mountain,
    title: "Casas con Vista al Volcán",
    description: "Pucón, Puerto Varas, Osorno",
    searchParams: { type: "casa", q: "volcán vista" },
  },
  {
    icon: Trees,
    title: "Parcelas en el Bosque",
    description: "Valdivia, Frutillar, Castro",
    searchParams: { type: "parcela", q: "bosque naturaleza" },
  },
  {
    icon: Home,
    title: "Casas de Campo",
    description: "Chiloé, Valdivia, Osorno",
    searchParams: { type: "casa", q: "campo rural" },
  },
]

export default function HeroSection() {
  const [searchQuery, setSearchQuery] = useState("")
  const [propertyType, setPropertyType] = useState("")
  const [location, setLocation] = useState("")

  const handleSearch = () => {
    const params = new URLSearchParams()
    if (searchQuery) params.set("q", searchQuery)
    if (propertyType) params.set("type", propertyType)
    if (location) params.set("location", location)

    window.location.href = `/propiedades?${params.toString()}`
  }

  const handleSuggestionClick = (suggestion: (typeof PROPERTY_SUGGESTIONS)[0]) => {
    const params = new URLSearchParams()
    Object.entries(suggestion.searchParams).forEach(([key, value]) => {
      params.set(key, value)
    })
    window.location.href = `/propiedades?${params.toString()}`
  }

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-green-600">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&h=1080&fit=crop&crop=center"
          alt="Paisaje del sur de Chile con lagos y volcanes"
          className="w-full h-full object-cover opacity-30"
        />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center text-white">
        <div className="max-w-6xl mx-auto">
          {/* Main Heading */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-8 leading-tight">
            Descubre el
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-200 via-white to-green-200">
              Sur de Chile
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl mb-12 text-blue-100 max-w-4xl mx-auto leading-relaxed">
            Propiedades exclusivas en los destinos más hermosos del sur. Desde cabañas frente al lago hasta parcelas con
            vista a los volcanes.
          </p>

          {/* Property Suggestions */}
          <div className="mb-12">
            <h3 className="text-xl font-semibold mb-6 text-blue-200">¿Qué tipo de propiedad te interesa?</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              {PROPERTY_SUGGESTIONS.map((suggestion, index) => {
                const IconComponent = suggestion.icon
                return (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 hover:bg-white/20 hover:border-white/30 transition-all duration-300 group text-left transform hover:scale-105"
                  >
                    <div className="flex items-center mb-3">
                      <div className="bg-gradient-to-r from-blue-400 to-green-400 p-3 rounded-xl mr-3 group-hover:from-blue-300 group-hover:to-green-300 transition-all duration-300">
                        <IconComponent className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <h4 className="font-bold text-white group-hover:text-blue-100 transition-colors text-lg mb-2">
                      {suggestion.title}
                    </h4>
                    <p className="text-sm text-blue-200 group-hover:text-blue-100 transition-colors">
                      {suggestion.description}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Search Bar */}
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 mb-12 shadow-2xl max-w-5xl mx-auto border border-white/20">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="md:col-span-2">
                <Input
                  type="text"
                  placeholder="Ej: cabaña lago, casa volcán, parcela bosque..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-14 text-gray-900 border-gray-200 focus:border-blue-500 rounded-xl text-lg"
                />
              </div>
              <Select value={propertyType} onValueChange={setPropertyType}>
                <SelectTrigger className="h-14 text-gray-900 border-gray-200 rounded-xl text-lg">
                  <SelectValue placeholder="Tipo de propiedad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cabaña">Cabaña</SelectItem>
                  <SelectItem value="casa">Casa</SelectItem>
                  <SelectItem value="parcela">Parcela</SelectItem>
                  <SelectItem value="terreno">Terreno</SelectItem>
                  <SelectItem value="departamento">Departamento</SelectItem>
                  <SelectItem value="lodge">Lodge/Hostería</SelectItem>
                </SelectContent>
              </Select>
              <Select value={location} onValueChange={setLocation}>
                <SelectTrigger className="h-14 text-gray-900 border-gray-200 rounded-xl text-lg">
                  <SelectValue placeholder="Ubicación" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pucon">Pucón</SelectItem>
                  <SelectItem value="puerto-varas">Puerto Varas</SelectItem>
                  <SelectItem value="castro">Castro (Chiloé)</SelectItem>
                  <SelectItem value="valdivia">Valdivia</SelectItem>
                  <SelectItem value="frutillar">Frutillar</SelectItem>
                  <SelectItem value="osorno">Osorno</SelectItem>
                  <SelectItem value="villarrica">Villarrica</SelectItem>
                  <SelectItem value="temuco">Temuco</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleSearch}
              className="w-full mt-6 h-14 bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 text-lg"
            >
              <Search className="mr-3 h-6 w-6" />
              Buscar Propiedades
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="text-center bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="flex items-center justify-center mb-3">
                <div className="bg-gradient-to-r from-blue-400 to-green-400 p-3 rounded-xl mr-3">
                  <Home className="h-8 w-8 text-white" />
                </div>
                <span className="text-4xl font-bold">500+</span>
              </div>
              <p className="text-blue-100 font-medium">Propiedades Exclusivas</p>
            </div>
            <div className="text-center bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="flex items-center justify-center mb-3">
                <div className="bg-gradient-to-r from-blue-400 to-green-400 p-3 rounded-xl mr-3">
                  <MapPin className="h-8 w-8 text-white" />
                </div>
                <span className="text-4xl font-bold">15+</span>
              </div>
              <p className="text-blue-100 font-medium">Ciudades del Sur</p>
            </div>
            <div className="text-center bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="flex items-center justify-center mb-3">
                <div className="bg-gradient-to-r from-blue-400 to-green-400 p-3 rounded-xl mr-3">
                  <TrendingUp className="h-8 w-8 text-white" />
                </div>
                <span className="text-4xl font-bold">98%</span>
              </div>
              <p className="text-blue-100 font-medium">Clientes Satisfechos</p>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-8">
            <Button
              asChild
              size="lg"
              className="bg-white text-blue-900 hover:bg-blue-50 font-bold px-10 py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 text-lg"
            >
              <Link href="/propiedades">Ver Todas las Propiedades</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-2 border-white text-white hover:bg-white hover:text-blue-900 font-bold px-10 py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 bg-transparent text-lg"
            >
              <Link href="/cotizador">Solicitar Cotización</Link>
            </Button>
          </div>

          {/* Popular Searches */}
          <div className="text-center">
            <p className="text-blue-200 text-lg mb-4 font-medium">Búsquedas populares:</p>
            <div className="flex flex-wrap justify-center gap-3">
              {[
                "Cabaña lago Villarrica",
                "Casa Puerto Varas",
                "Parcela Valdivia",
                "Terreno Chiloé",
                "Lodge Pucón",
                "Casa campo Osorno",
              ].map((search, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setSearchQuery(search)
                    const params = new URLSearchParams({ q: search })
                    window.location.href = `/propiedades?${params.toString()}`
                  }}
                  className="bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30 text-blue-100 hover:text-white px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 backdrop-blur-sm"
                >
                  {search}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10">
        <div className="animate-bounce">
          <div className="w-8 h-12 border-2 border-white/60 rounded-full flex justify-center backdrop-blur-sm">
            <div className="w-2 h-4 bg-white rounded-full mt-3 animate-pulse"></div>
          </div>
        </div>
      </div>
    </section>
  )
}
