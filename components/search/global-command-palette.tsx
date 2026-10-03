"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Bot, Calculator, CheckSquare, Files, FolderOpen, Home, MapPin, MessageSquare, Search, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { supabase } from "@/lib/supabase/client"

type CampoResult = {
  id: string
  file_name: string
  region: string | null
  description: string | null
  placemarks_count: number | null
  metadata?: Record<string, unknown> | null
}

const quickActions = [
  { label: "Inicio", href: "/", icon: Home },
  { label: "Campos", href: "/campos", icon: FolderOpen },
  { label: "Clientes", href: "/clientes", icon: Users },
  { label: "Multimedia", href: "/comunicaciones", icon: MessageSquare },
  { label: "Documentos", href: "/documentacion", icon: Files },
  { label: "Mercado", href: "/mercado", icon: Search },
  { label: "Inteligencia territorial", href: "/kmz-analisis", icon: MapPin },
  { label: "Valorización", href: "/cotizador", icon: Calculator },
  { label: "Tareas", href: "/gestion-tareas", icon: CheckSquare },
  { label: "Asistente IA", href: "/asistente", icon: Bot },
]

export function GlobalCommandPalette() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<CampoResult[]>([])
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        setOpen((current) => !current)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const latestSearchRef = useRef(0)

  useEffect(() => {
    const searchQuery = query.trim()
    const searchId = ++latestSearchRef.current

    if (searchQuery.length < 2) {
      setResults([])
      setIsSearching(false)
      return
    }

    const timer = window.setTimeout(async () => {
      setIsSearching(true)
      try {
        const escaped = searchQuery.replace(/[%_,]/g, " ").trim()
        const { data, error } = await supabase
          .from("kmz_collection")
          .select("id,file_name,region,description,placemarks_count,metadata")
          .or(`file_name.ilike.%${escaped}%,metadata->>manual_display_name.ilike.%${escaped}%,description.ilike.%${escaped}%,region.ilike.%${escaped}%`)
          .limit(20)

        if (error) throw error
        if (latestSearchRef.current === searchId) {
          setResults((data ?? []) as CampoResult[])
        }
      } catch {
        if (latestSearchRef.current === searchId) {
          setResults([])
        }
      } finally {
        if (latestSearchRef.current === searchId) {
          setIsSearching(false)
        }
      }
    }, 300)

    return () => window.clearTimeout(timer)
  }, [query])

  const navigate = (href: string) => {
    setOpen(false)
    setQuery("")
    setResults([])
    router.push(href)
  }

  return (
    <>
      <Button
        variant="ghost"
        className="h-9 gap-2 rounded-none px-3 text-[11px] font-medium text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
        onClick={() => setOpen(true)}
        aria-label="Buscar campos y abrir funciones"
      >
        <Search className="h-3.5 w-3.5" />
        <span className="hidden lg:inline">Buscar</span>
        <span className="hidden border-l border-border/70 pl-2 font-mono text-[9px] text-muted-foreground xl:inline">⌘K</span>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Buscar un campo por nombre, región o descripción…" value={query} onValueChange={setQuery} />
        <CommandList>
          <CommandGroup heading="Funciones operativas">
            {quickActions.map(({ label, href, icon: Icon }) => (
              <CommandItem key={href} onSelect={() => navigate(href)}>
                <Icon className="mr-2 h-4 w-4" />
                {label}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Campos">
            {results.map((campo) => (
              <CommandItem
                key={campo.id}
                value={`${campo.file_name} ${campo.region ?? ""} ${campo.description ?? ""}`}
                onSelect={() => navigate(`/campos?kmz=${encodeURIComponent(campo.id)}`)}
              >
                <MapPin className="mr-2 h-4 w-4" />
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{typeof campo.metadata?.manual_display_name === "string" && campo.metadata.manual_display_name.trim() ? campo.metadata.manual_display_name : campo.file_name}</div>
                  <div className="truncate text-xs text-muted-foreground">{campo.region || "Sin región"}{campo.placemarks_count ? ` · ${campo.placemarks_count} elementos` : ""}</div>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandEmpty>{isSearching ? "Buscando…" : query.length >= 2 ? "No se encontraron campos." : "Escribe al menos 2 caracteres."}</CommandEmpty>
        </CommandList>
      </CommandDialog>
    </>
  )
}
