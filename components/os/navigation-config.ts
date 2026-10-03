import type { LucideIcon } from "lucide-react"
import {
  Bot,
  BriefcaseBusiness,
  CheckSquare2,
  Files,
  ImageIcon,
  LayoutDashboard,
  MapPinned,
  Settings,
  Users,
} from "lucide-react"

export type SurRealistaNavItem = {
  label: string
  href: string
  icon: LucideIcon
  prefixes: string[]
  code?: string
  description?: string
  agent?: string
}

export const SUR_REALISTA_HOME: SurRealistaNavItem = {
  label: "Inicio",
  href: "/",
  icon: LayoutDashboard,
  prefixes: ["/"],
  code: "SYS",
}

export const SUR_REALISTA_MODULES: SurRealistaNavItem[] = [
  {
    label: "Campos",
    href: "/campos",
    icon: MapPinned,
    code: "M01",
    prefixes: ["/campos", "/kmz", "/kmz-map", "/kmz-search", "/kmz-search-advanced", "/kmz-guide", "/kmz-analisis", "/mapas"],
    description: "Inventario territorial, ROL, mapas, inteligencia y análisis de cada campo.",
    agent: "Agente Campos",
  },
  {
    label: "Clientes",
    href: "/clientes",
    icon: Users,
    code: "M02",
    prefixes: ["/clientes", "/gestion-clientes"],
    description: "Personas, empresas, intereses, relaciones, seguimiento y contexto comercial.",
    agent: "Agente Clientes",
  },
  {
    label: "Multimedia",
    href: "/comunicaciones",
    icon: ImageIcon,
    code: "M03",
    prefixes: ["/comunicaciones"],
    description: "Contenido, redes sociales, packs de publicaciones y activos de comunicación.",
    agent: "Agente Contenido",
  },
  {
    label: "Documentos",
    href: "/documentacion",
    icon: Files,
    code: "M04",
    prefixes: ["/documentacion"],
    description: "Repositorio documental, preparación y generación de informes con evidencia.",
    agent: "Agente Documental",
  },
  {
    label: "Mercado",
    href: "/mercado",
    icon: BriefcaseBusiness,
    code: "M05",
    prefixes: ["/mercado", "/prospeccion", "/propiedades", "/cotizador", "/opportunities", "/home-spotter", "/quick-wins"],
    description: "Propiedades, comparables, prospección, valorización y señales de oportunidad.",
    agent: "Agente Mercado",
  },
]


export const SUR_REALISTA_MARKET_SUBNAV: SurRealistaNavItem[] = [
  {
    label: "Resumen",
    href: "/mercado",
    icon: BriefcaseBusiness,
    prefixes: ["/mercado"],
  },
  {
    label: "Propiedades",
    href: "/propiedades",
    icon: BriefcaseBusiness,
    prefixes: ["/propiedades"],
  },
  {
    label: "Inteligencia de Oportunidades",
    href: "/mercado/oportunidades",
    icon: BriefcaseBusiness,
    prefixes: ["/mercado/oportunidades"],
  },
  {
    label: "Prospección",
    href: "/prospeccion",
    icon: BriefcaseBusiness,
    prefixes: ["/prospeccion"],
  },
  {
    label: "Valorización",
    href: "/cotizador",
    icon: BriefcaseBusiness,
    prefixes: ["/cotizador"],
  },
]

export const SUR_REALISTA_UTILITIES: SurRealistaNavItem[] = [
  {
    label: "Tareas",
    href: "/gestion-tareas",
    icon: CheckSquare2,
    code: "OPS",
    prefixes: ["/gestion-tareas", "/nueva-tarea"],
    description: "Pendientes, responsables y próximos pasos de todos los módulos.",
  },
  {
    label: "Asistente",
    href: "/asistente",
    icon: Bot,
    code: "AI",
    prefixes: ["/asistente", "/asistente-ia", "/ai"],
    description: "Consulta transversal sobre Campos, Clientes, Multimedia, Documentos y Mercado.",
  },
  {
    label: "Administración",
    href: "/admin/dashboard",
    icon: Settings,
    code: "ADM",
    prefixes: ["/admin"],
    description: "Control operativo, fuentes, usuarios y configuración.",
  },
]

export function isSurRealistaNavActive(pathname: string, item: SurRealistaNavItem) {
  if (item.href === "/") return pathname === "/"
  return item.prefixes.some((prefix) => pathname === prefix || pathname.startsWith(prefix + "/"))
}

export function getSurRealistaSection(pathname: string) {
  if (pathname === "/") return SUR_REALISTA_HOME
  return (
    SUR_REALISTA_MODULES.find((item) => isSurRealistaNavActive(pathname, item)) ||
    SUR_REALISTA_UTILITIES.find((item) => isSurRealistaNavActive(pathname, item)) ||
    null
  )
}
