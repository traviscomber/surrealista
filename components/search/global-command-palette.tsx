"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Calculator, CheckSquare, FolderOpen, MapPin, MessageSquare, Search, Users } from "lucide-react"
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
}

const quickActions = [
  { label: "Abrir Campos", href: "/campos", icon: FolderOpen },
  { label: "Buscar mercado", href: "/busqueda", icon: Search },
  { label: "Inteligencia territorial", href: "/kmz-analisis", icon: MapPin },
  { label: "Valorización", href: "/cotizador", icon: Calculator },
  { label: "Clientes", href: "/clientes", icon: Users },
  { label: "Tareas", href: "/gestion-tareas", icon: CheckSquare },
  { label: "Comunicaciones", href: "/comunicaciones", icon: MessageSquare },
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

  const performSearch = useCallback(async (value: string) => {
    setQuery(value)
    const searchQuery = value.trim()
    if (searchQuery.length < 2) {
      setResults([])
      return
    }

    setIsSearching(true)
    try {
      const escaped = searchQuery.replace(/[%_,]/g, " ").trim()
      const { data, error } = await supabase
        .from("kmz_collection")
        .select("id,file_name,region,description,placemarks_count")
        .or(`file_name.ilike.%${escaped}%,description.ilike.%${escaped}%,region.ilike.%${escaped}%`)
        .limit(20)

      if (error) throw error
      setResults((data ?? []) as CampoResult[])
    } catch {
      setResults([])
    } finally {
      setIsSearching(false)
    }
  }, [])

  const navigate = (href: string) => {
    setOpen(false)
    setQuery("")
    setResults([])
    router.push(href)
  }

  return (
    <>
      <Button variant="ghost" className="h-10 gap-2 px-3" onClick={() => setOpen(true)} aria-label="Buscar campos y abrir funciones">
        <Search className="h-4 w-4" />
        <span className="hidden 2xl:inline">Buscar</span>
        <span className="hidden rounded border px-1.5 py-0.5 text-[10px] text-muted-foreground 2xl:inline">⌘K</span>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Buscar un campo por nombre, región o descripción…" value={query} onValueChange={(value) => void performSearch(value)} />
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
              <CommandItem key={campo.id} value={`${campo.file_name} ${campo.region ?? ""}`} onSelect={() => navigate(`/campos?file=${campo.id}`)}>
                <MapPin className="mr-2 h-4 w-4" />
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{campo.file_name}</div>
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
