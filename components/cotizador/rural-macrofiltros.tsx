"use client"

import React from "react"
import { MacrofilterSection, MacrofilterOption } from "./macrofilter-section"
import { Droplets, Leaf, GitBranch, TreePine, Building2, MapPin, Zap, Trees, Wheat, Home } from "lucide-react"

export interface RuralMacrofilters {
  aptitudAgricola: string[]
  recursosHidricos: string[]
  aptitudFruticola: string[]
  aptitudGanadera: string[]
  aptitudLechera: string[]
  potencialForestal: string[]
  desarrolloInmobiliario: string[]
  conservacionTurismo: string[]
  infraestructura: string[]
  accesibilidad: string[]
}

interface RuralMacrofiltrosProps {
  values: RuralMacrofilters
  onChange: (values: RuralMacrofilters) => void
}

const MACROFILTROS_OPTIONS = {
  aptitudAgricola: [
    { id: "suelo-fertil", label: "Suelo Fértil", description: "Suelo apto para cultivos" },
    { id: "capacidad-uso", label: "Capacidad de Uso", description: "Clasificación de capacidad" },
    { id: "profundidad", label: "Profundidad Adecuada", description: "Profundidad > 80cm" },
    { id: "trumao", label: "Trumao", description: "Suelo volcánico de alta fertilidad" },
    { id: "riego-disponible", label: "Riego Disponible", description: "Capacidad de riego" },
    { id: "mecanizable", label: "Mecanizable", description: "Apto para maquinaria agrícola" },
  ] as MacrofilterOption[],

  recursosHidricos: [
    { id: "derechos-agua", label: "Derechos de Agua", description: "Derechos de agua constituidos" },
    { id: "pozos", label: "Pozos", description: "Pozos profundos o surgentes" },
    { id: "vertientes", label: "Vertientes", description: "Vertientes/ojos de agua" },
    { id: "esteros", label: "Esteros", description: "Cursos de agua naturales" },
    { id: "lagos-lagunas", label: "Lagos/Lagunas", description: "Cuerpos de agua estática" },
    { id: "apr", label: "APR Disponible", description: "Agua Potable Rural disponible" },
  ] as MacrofilterOption[],

  aptitudFruticola: [
    { id: "clima-adecuado", label: "Clima Adecuado", description: "Clima favorable para frutales" },
    { id: "horas-frio", label: "Horas de Frío", description: "Acumulación de horas de frío" },
    { id: "agua-abundante", label: "Agua Abundante", description: "Disponibilidad de agua para riego" },
    { id: "especie-establecida", label: "Especie Establecida", description: "Huertos frutales establecidos" },
    { id: "historial-productivo", label: "Historial Productivo", description: "Historia de producción fructífera" },
    { id: "mercado-acceso", label: "Acceso a Mercado", description: "Proximidad a mercados de venta" },
  ] as MacrofilterOption[],

  aptitudGanadera: [
    { id: "pastizales", label: "Pastizales", description: "Pastos para alimentación animal" },
    { id: "carga-animal", label: "Carga Animal", description: "Capacidad de carga ganadera" },
    { id: "cercos", label: "Cercos", description: "Cercos perimetrales e internos" },
    { id: "corrales", label: "Corrales", description: "Instalaciones de manejo" },
    { id: "manga", label: "Manga/Chute", description: "Infraestructura de trabajo" },
    { id: "bebederos", label: "Bebederos", description: "Acceso a agua para animales" },
  ] as MacrofilterOption[],

  aptitudLechera: [
    { id: "pastizales-permanentes", label: "Pastizales Permanentes", description: "Pastos permanentes de calidad" },
    { id: "agua-abundante-lechera", label: "Agua Abundante", description: "Alto requerimiento de agua" },
    { id: "sala-ordena", label: "Sala de Ordeña", description: "Infraestructura de ordeño" },
    { id: "establos", label: "Establos", description: "Construcciones para lechería" },
    { id: "caminos-internos", label: "Caminos Internos", description: "Red de caminos internos" },
    { id: "acceso-veterinario", label: "Acceso Veterinario", description: "Proximidad a servicios vet." },
  ] as MacrofilterOption[],

  potencialForestal: [
    { id: "bosque-nativo", label: "Bosque Nativo", description: "Presencia de bosque nativo" },
    { id: "plantaciones", label: "Plantaciones", description: "Plantaciones forestales establecidas" },
    { id: "especies-nobles", label: "Especies Nobles", description: "Presencia de especies de valor" },
    { id: "renovales", label: "Renovales", description: "Áreas en regeneración" },
    { id: "certificacion", label: "Certificación", description: "Certificaciones forestales" },
    { id: "vias-acceso", label: "Vías de Acceso", description: "Caminos para extracción" },
  ] as MacrofilterOption[],

  desarrolloInmobiliario: [
    { id: "subdivisible", label: "Subdivisible", description: "Apto para subdivisión" },
    { id: "cantidad-roles", label: "Cantidad de Roles", description: "Potencial de múltiples lotes" },
    { id: "regulacion-vigente", label: "Regulación Vigente", description: "Normativa vigente favorable" },
    { id: "acceso-publico", label: "Acceso Público", description: "Acceso directo desde camino público" },
    { id: "energia-trifasica", label: "Energía Trifásica", description: "Conexión trifásica disponible" },
    { id: "potencial-apreciacion", label: "Potencial de Apreciación", description: "Área con desarrollo potencial" },
  ] as MacrofilterOption[],

  conservacionTurismo: [
    { id: "bosque-nativo-cons", label: "Bosque Nativo", description: "Bosque nativo de alto valor" },
    { id: "biodiversidad", label: "Biodiversidad", description: "Flora y fauna diversa" },
    { id: "rios-lagos-turismo", label: "Ríos/Lagos", description: "Presencia de ríos o lagos" },
    { id: "vistas-panoramicas", label: "Vistas Panorámicas", description: "Vistas de valor turístico" },
    { id: "senderos", label: "Senderos", description: "Senderos o caminos para trekking" },
    { id: "potencial-carbono", label: "Potencial de Carbono", description: "Capacidad de captura de carbono" },
  ] as MacrofilterOption[],

  infraestructura: [
    { id: "vivienda", label: "Vivienda", description: "Casa principal con servicios" },
    { id: "galpones", label: "Galpones", description: "Estructuras de almacenamiento" },
    { id: "caminos", label: "Caminos Internos", description: "Red de caminos internos" },
    { id: "energia-electrica", label: "Energía Eléctrica", description: "Conexión eléctrica disponible" },
    { id: "bodegas", label: "Bodegas", description: "Estructuras de bodegaje" },
    { id: "corrales-infraestructura", label: "Corrales/Estructuras", description: "Infraestructura pecuaria" },
  ] as MacrofilterOption[],

  accesibilidad: [
    { id: "distancia-ciudad", label: "Distancia a Ciudad", description: "Proximidad a centros urbanos" },
    { id: "acceso-autopista", label: "Acceso a Autopista", description: "Conexión a autopista próxima" },
    { id: "camino-pavimentado", label: "Camino Pavimentado", description: "Acceso por camino pavimentado" },
    { id: "conectividad", label: "Conectividad", description: "Señal celular/internet disponible" },
    { id: "distancia-aeropuerto", label: "Distancia a Aeropuerto", description: "Proximidad a aeropuertos" },
    { id: "puerto-acceso", label: "Puerto/Acceso Marítimo", description: "Proximidad a puertos" },
  ] as MacrofilterOption[],
}

export function RuralMacrofiltros({ values, onChange }: RuralMacrofiltrosProps) {
  const handleChange = (key: keyof RuralMacrofilters, selected: string[]) => {
    onChange({
      ...values,
      [key]: selected,
    })
  }

  return (
    <div className="space-y-4 p-4">
      <div className="text-center text-slate-600">
        <p className="font-semibold">Sistema de 10 Macrofiltros Rurales</p>
        <p className="text-sm">Selecciona los filtros aplicables a tu propiedad</p>
      </div>

      <MacrofilterSection
        title="1. Aptitud Agrícola"
        description="Capacidad y características del suelo para cultivos"
        icon={<Wheat className="h-5 w-5 text-amber-600" />}
        options={MACROFILTROS_OPTIONS.aptitudAgricola}
        selectedIds={values.aptitudAgricola}
        onChange={(selected) => handleChange("aptitudAgricola", selected)}
        defaultOpen={true}
      />

      <MacrofilterSection
        title="2. Recursos Hídricos"
        description="Disponibilidad y derechos de agua"
        icon={<Droplets className="h-5 w-5 text-blue-600" />}
        options={MACROFILTROS_OPTIONS.recursosHidricos}
        selectedIds={values.recursosHidricos}
        onChange={(selected) => handleChange("recursosHidricos", selected)}
      />

      <MacrofilterSection
        title="3. Aptitud Frutícola"
        description="Potencial para producción de frutas"
        icon={<Leaf className="h-5 w-5 text-red-600" />}
        options={MACROFILTROS_OPTIONS.aptitudFruticola}
        selectedIds={values.aptitudFruticola}
        onChange={(selected) => handleChange("aptitudFruticola", selected)}
      />

      <MacrofilterSection
        title="4. Aptitud Ganadera"
        description="Capacidad para ganadería extensiva"
        icon={<GitBranch className="h-5 w-5 text-orange-600" />}
        options={MACROFILTROS_OPTIONS.aptitudGanadera}
        selectedIds={values.aptitudGanadera}
        onChange={(selected) => handleChange("aptitudGanadera", selected)}
      />

      <MacrofilterSection
        title="5. Aptitud Lechera"
        description="Potencial para producción lechera intensiva"
        icon={<Home className="h-5 w-5 text-rose-600" />}
        options={MACROFILTROS_OPTIONS.aptitudLechera}
        selectedIds={values.aptitudLechera}
        onChange={(selected) => handleChange("aptitudLechera", selected)}
      />

      <MacrofilterSection
        title="6. Potencial Forestal"
        description="Capacidad para producción forestal"
        icon={<TreePine className="h-5 w-5 text-green-700" />}
        options={MACROFILTROS_OPTIONS.potencialForestal}
        selectedIds={values.potencialForestal}
        onChange={(selected) => handleChange("potencialForestal", selected)}
      />

      <MacrofilterSection
        title="7. Desarrollo Inmobiliario"
        description="Potencial para subdivisión y desarrollo"
        icon={<Building2 className="h-5 w-5 text-purple-600" />}
        options={MACROFILTROS_OPTIONS.desarrolloInmobiliario}
        selectedIds={values.desarrolloInmobiliario}
        onChange={(selected) => handleChange("desarrolloInmobiliario", selected)}
      />

      <MacrofilterSection
        title="8. Conservación y Turismo"
        description="Potencial de conservación ecológica y turismo"
        icon={<Trees className="h-5 w-5 text-teal-600" />}
        options={MACROFILTROS_OPTIONS.conservacionTurismo}
        selectedIds={values.conservacionTurismo}
        onChange={(selected) => handleChange("conservacionTurismo", selected)}
      />

      <MacrofilterSection
        title="9. Infraestructura"
        description="Presencia de infraestructura en la propiedad"
        icon={<Zap className="h-5 w-5 text-yellow-600" />}
        options={MACROFILTROS_OPTIONS.infraestructura}
        selectedIds={values.infraestructura}
        onChange={(selected) => handleChange("infraestructura", selected)}
      />

      <MacrofilterSection
        title="10. Accesibilidad y Ubicación"
        description="Conectividad y proximidad a servicios"
        icon={<MapPin className="h-5 w-5 text-indigo-600" />}
        options={MACROFILTROS_OPTIONS.accesibilidad}
        selectedIds={values.accesibilidad}
        onChange={(selected) => handleChange("accesibilidad", selected)}
      />
    </div>
  )
}
