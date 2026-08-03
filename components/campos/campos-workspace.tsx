"use client"

import dynamic from "next/dynamic"
import Link from "next/link"
import React, { Component, type ErrorInfo, type ReactNode } from "react"
import { AlertTriangle, Database, Loader2, Map, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"

const CAMPOSFolderView = dynamic(
  () => import("@/components/campos/campos-folder-view").then((module) => module.CAMPOSFolderView),
  {
    ssr: false,
    loading: () => <CamposLoadingState />,
  },
)

function CamposLoadingState() {
  return (
    <div className="flex h-full min-h-[620px] items-center justify-center bg-slate-950 text-slate-100">
      <div className="max-w-sm text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
        <p className="mt-4 text-sm font-semibold">Cargando inteligencia territorial</p>
        <p className="mt-1 text-xs leading-5 text-slate-400">Preparando colección, geometrías, mapa y expedientes.</p>
      </div>
    </div>
  )
}

interface CamposErrorBoundaryProps {
  children: ReactNode
}

interface CamposErrorBoundaryState {
  hasError: boolean
}

class CamposErrorBoundary extends Component<CamposErrorBoundaryProps, CamposErrorBoundaryState> {
  state: CamposErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): CamposErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[campos] Error no controlado en el workspace", error, info)
  }

  private reset = () => {
    this.setState({ hasError: false })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full min-h-[620px] items-center justify-center bg-slate-950 px-6 text-slate-100">
          <div className="w-full max-w-lg rounded-3xl border border-amber-400/20 bg-amber-400/[0.06] p-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-amber-300/20 bg-amber-300/10">
              <AlertTriangle className="h-5 w-5 text-amber-200" />
            </div>
            <h2 className="mt-5 text-xl font-semibold">CAMPOS no pudo completar la carga</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              La navegación general sigue disponible. Reintenta el módulo sin recargar toda la aplicación.
            </p>
            <Button type="button" variant="secondary" className="mt-5" onClick={this.reset}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Reintentar CAMPOS
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export function CamposWorkspace() {
  return (
    <section aria-label="CAMPOS, inteligencia territorial" className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-border/60 bg-slate-950 shadow-sm">
      <div className="flex min-h-12 flex-shrink-0 items-center justify-between gap-3 border-b border-white/10 bg-slate-950 px-4 text-slate-100">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05]">
            <Map className="h-4 w-4" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">CAMPOS</p>
            <p className="truncate text-[11px] text-slate-400">Mapa territorial, expediente y trazabilidad</p>
          </div>
        </div>
        <Button asChild variant="ghost" size="sm" className="flex-shrink-0 text-slate-300 hover:bg-white/10 hover:text-white">
          <Link href="/admin/kmz-collection">
            <Database className="mr-2 h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Administrar KMZ</span>
            <span className="sm:hidden">KMZ</span>
          </Link>
        </Button>
      </div>

      <div className="min-h-0 flex-1">
        <CamposErrorBoundary>
          <CAMPOSFolderView />
        </CamposErrorBoundary>
      </div>
    </section>
  )
}
