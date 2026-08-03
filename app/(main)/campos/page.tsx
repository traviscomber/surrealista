import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, Database, Layers3, MapPinned } from "lucide-react"

import { CamposWorkspace } from "@/components/campos/campos-workspace"
import { LeafletPopupBehavior } from "@/components/kmz/leaflet-popup-behavior"
import { Button } from "@/components/ui/button"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "CAMPOS | Sur-Realista",
  description: "Workspace principal de inteligencia territorial, mapas y expedientes prediales.",
}

export default function CamposPage() {
  return (
    <main className="fixed inset-x-0 bottom-0 top-16 flex min-h-0 flex-col bg-slate-950 text-slate-100">
      <LeafletPopupBehavior />

      <header className="flex min-h-14 flex-shrink-0 items-center justify-between gap-3 border-b border-white/10 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Button asChild variant="ghost" size="icon" className="flex-shrink-0 text-slate-300 hover:bg-white/10 hover:text-white">
            <Link href="/busqueda" aria-label="Volver al centro operativo">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-emerald-300/20 bg-emerald-300/10">
            <MapPinned className="h-4 w-4 text-emerald-200" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-sm font-semibold sm:text-base">CAMPOS</h1>
            <p className="hidden truncate text-xs text-slate-400 sm:block">Inteligencia territorial, mapa y expediente predial</p>
          </div>
        </div>

        <nav className="flex flex-shrink-0 items-center gap-1" aria-label="Acciones de CAMPOS">
          <Button asChild variant="ghost" size="sm" className="text-slate-300 hover:bg-white/10 hover:text-white">
            <Link href="/busqueda?modulo=sii-roles">
              <Layers3 className="mr-2 h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Roles SII</span>
              <span className="sm:hidden">SII</span>
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm" className="text-slate-300 hover:bg-white/10 hover:text-white">
            <Link href="/admin/kmz-collection">
              <Database className="mr-2 h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Colección KMZ</span>
              <span className="sm:hidden">KMZ</span>
            </Link>
          </Button>
        </nav>
      </header>

      <div className="min-h-0 flex-1 p-2 sm:p-3">
        <CamposWorkspace />
      </div>
    </main>
  )
}
