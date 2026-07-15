"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

type RoleResult = {
  rol?: string
  rol_manzana?: string
  rol_predio?: string
  direccion?: string
  destino?: string
  comuna?: string
  comuna_codigo?: string
  source?: string
  confidence?: number
}

type AvaluoResult = RoleResult & {
  avaluoTotal?: number
  avaluoAfecto?: number
  avaluoExento?: number
  superficieTerreno?: number
  superficieConstruida?: number
  areaHomogenea?: string
  periodo?: string
}

const EXAMPLES = [
  {
    label: "Santiago, Alameda 3",
    comunaCode: "13101",
    calle: "ALAMEDA",
    numero: "3",
    rol: "13101-42-998",
  },
  {
    label: "Santiago, Ahumada 1",
    comunaCode: "13101",
    calle: "AHUMADA",
    numero: "1",
    rol: "13101-29-59",
  },
]

function formatMoney(value?: number) {
  if (typeof value !== "number") return "-"
  return `$${Math.round(value).toLocaleString("es-CL")}`
}

function getDisplayRol(role: RoleResult) {
  return role.rol || [role.comuna_codigo, role.rol_manzana, role.rol_predio].filter(Boolean).join("-")
}

export default function SiiRolExplorer() {
  const [comunaCode, setComunaCode] = useState("13101")
  const [calle, setCalle] = useState("ALAMEDA")
  const [numero, setNumero] = useState("3")
  const [rol, setRol] = useState("13101-42-998")

  const [status, setStatus] = useState<"idle" | "running" | "done" | "error">("idle")
  const [msg, setMsg] = useState("")
  const [source, setSource] = useState("")
  const [roles, setRoles] = useState<RoleResult[]>([])
  const [avaluo, setAvaluo] = useState<AvaluoResult | null>(null)

  const loadExample = (example: (typeof EXAMPLES)[number]) => {
    setComunaCode(example.comunaCode)
    setCalle(example.calle)
    setNumero(example.numero)
    setRol(example.rol)
    setMsg("")
    setRoles([])
    setAvaluo(null)
    setSource("")
    setStatus("idle")
  }

  async function searchAddress() {
    setStatus("running")
    setMsg("Consultando direccion en SII Mapas...")
    setRoles([])
    setAvaluo(null)

    try {
      const response = await fetch("/api/sii/explore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comuna: comunaCode, calle, numero }),
      })
      const data = await response.json()

      if (!response.ok) {
        setStatus("error")
        setMsg(data?.error ?? "Error al consultar SII.")
        return
      }

      setStatus("done")
      setSource(data?.source || "")
      setRoles(data?.roles ?? [])
      setMsg(`Resultado listo: ${data?.count ?? 0} coincidencia(s).`)
    } catch (error: any) {
      setStatus("error")
      setMsg(error?.message ?? "Error desconocido")
    }
  }

  async function verifyRol() {
    setStatus("running")
    setMsg("Verificando rol exacto en SII Mapas...")
    setAvaluo(null)

    try {
      const response = await fetch("/api/sii/roles/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rol, persist: false }),
      })
      const data = await response.json()

      if (!response.ok || !data?.success) {
        setStatus("error")
        setMsg(data?.error ?? "No se pudo verificar el rol.")
        return
      }

      setStatus("done")
      setSource(data?.provider?.source || "")
      setAvaluo(data?.rol ?? null)
      setMsg(data?.rol ? "Rol verificado contra SII Mapas." : "SII no devolvio datos para ese rol.")
    } catch (error: any) {
      setStatus("error")
      setMsg(error?.message ?? "Error desconocido")
    }
  }

  return (
    <section className="w-full max-w-5xl rounded-3xl border border-slate-700 bg-slate-950 p-6 text-slate-100 shadow-2xl">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-300">SII Mapas publico</p>
          <h2 className="mt-2 text-3xl font-bold text-white">Explorador predial real</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-300">
            Usa endpoints publicos de SII Mapas. No usa mocks ni BaseAPI cuando no hay `BASEAPI_API_KEY`.
            La busqueda por direccion depende del nombre exacto que publica SII; si devuelve 0, verifica por rol exacto.
          </p>
        </div>
        <div className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-xs font-semibold text-emerald-200">
          Fuente esperada: sii-public
        </div>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {EXAMPLES.map((example) => (
          <Button
            key={example.label}
            type="button"
            variant="outline"
            onClick={() => loadExample(example)}
            className="border-slate-600 bg-slate-900 text-slate-100 hover:bg-slate-800 hover:text-white"
          >
            {example.label}
          </Button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-slate-700 bg-slate-900 p-5 text-slate-100">
          <h3 className="text-lg font-semibold text-white">Buscar roles por direccion</h3>
          <p className="mt-1 text-sm text-slate-400">El codigo de comuna SII es obligatorio. Ejemplo: Santiago = 13101.</p>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            <Input
              aria-label="Codigo comuna SII"
              value={comunaCode}
              onChange={(event) => setComunaCode(event.target.value)}
              className="border-slate-600 bg-slate-950 text-white placeholder:text-slate-500"
              placeholder="13101"
            />
            <Input
              aria-label="Calle"
              value={calle}
              onChange={(event) => setCalle(event.target.value)}
              className="border-slate-600 bg-slate-950 text-white placeholder:text-slate-500 md:col-span-1"
              placeholder="ALAMEDA"
            />
            <Input
              aria-label="Numero"
              value={numero}
              onChange={(event) => setNumero(event.target.value)}
              className="border-slate-600 bg-slate-950 text-white placeholder:text-slate-500"
              placeholder="3"
            />
          </div>
          <Button
            onClick={searchAddress}
            disabled={status === "running" || !comunaCode || !calle || !numero}
            className="mt-4 w-full bg-emerald-500 text-slate-950 hover:bg-emerald-400"
          >
            Buscar en SII Mapas
          </Button>
        </Card>

        <Card className="border-slate-700 bg-slate-900 p-5 text-slate-100">
          <h3 className="text-lg font-semibold text-white">Verificar rol exacto</h3>
          <p className="mt-1 text-sm text-slate-400">Formato requerido: comuna-manzana-predio.</p>
          <Input
            aria-label="Rol exacto"
            value={rol}
            onChange={(event) => setRol(event.target.value)}
            className="mt-4 border-slate-600 bg-slate-950 text-white placeholder:text-slate-500"
            placeholder="13101-42-998"
          />
          <Button
            onClick={verifyRol}
            disabled={status === "running" || !rol}
            className="mt-4 w-full bg-sky-400 text-slate-950 hover:bg-sky-300"
          >
            Verificar avaluo real
          </Button>
        </Card>
      </div>

      {msg && (
        <Card
          className={`mt-5 border p-4 ${
            status === "error"
              ? "border-red-400/50 bg-red-950 text-red-100"
              : "border-slate-700 bg-slate-900 text-slate-100"
          }`}
        >
          <p className="text-sm font-medium">{msg}</p>
          {source && <p className="mt-1 text-xs text-slate-400">Contrato: {source}</p>}
        </Card>
      )}

      {roles.length > 0 && (
        <div className="mt-5 space-y-3">
          <h3 className="text-lg font-semibold text-white">Resultados por direccion</h3>
          {roles.slice(0, 20).map((role, index) => (
            <Card key={`${getDisplayRol(role)}-${index}`} className="border-slate-700 bg-white p-4 text-slate-950">
              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="font-mono text-base font-bold text-slate-950">{getDisplayRol(role)}</p>
                  {role.direccion && <p className="mt-1 text-sm text-slate-700">{role.direccion}</p>}
                  {role.destino && <p className="text-sm text-slate-600">Destino: {role.destino}</p>}
                </div>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                  {role.source || "sii-public"}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {avaluo && (
        <Card className="mt-5 border-emerald-500/40 bg-emerald-950 p-5 text-emerald-50">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-emerald-300">Avaluo confirmado</p>
              <h3 className="mt-1 font-mono text-2xl font-bold text-white">{getDisplayRol(avaluo)}</h3>
              {avaluo.direccion && <p className="mt-2 text-sm text-emerald-100">{avaluo.direccion}</p>}
              {avaluo.periodo && <p className="text-sm text-emerald-200">Periodo: {avaluo.periodo}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl bg-emerald-900 p-3">
                <p className="text-emerald-300">Total</p>
                <p className="font-bold text-white">{formatMoney(avaluo.avaluoTotal)}</p>
              </div>
              <div className="rounded-xl bg-emerald-900 p-3">
                <p className="text-emerald-300">Afecto</p>
                <p className="font-bold text-white">{formatMoney(avaluo.avaluoAfecto)}</p>
              </div>
              <div className="rounded-xl bg-emerald-900 p-3">
                <p className="text-emerald-300">AH</p>
                <p className="font-bold text-white">{avaluo.areaHomogenea || "-"}</p>
              </div>
              <div className="rounded-xl bg-emerald-900 p-3">
                <p className="text-emerald-300">Fuente</p>
                <p className="font-bold text-white">{avaluo.source || "sii-public"}</p>
              </div>
            </div>
          </div>
        </Card>
      )}
    </section>
  )
}
