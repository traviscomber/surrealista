"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { REGIONS, COMMUNES_BY_REGION } from "@/lib/sii/chile-locations"

type Role = { rol_manzana: string; rol_predio: string; direccion?: string; destino?: string; source?: string }

const KNOWN_SII_COMMUNE_CODES: Record<string, string> = {
  Santiago: "13101",
  Vitacura: "13132",
  Providencia: "13123",
  "Las Condes": "13114",
  Nunoa: "13120",
  "La Reina": "13113",
  "Lo Barnechea": "13115",
  "San Miguel": "13130",
  Macul: "13118",
  Maipu: "13119",
}

function normalizeCommuneName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/Ã‘/g, "N")
    .replace(/Ã±/g, "n")
    .trim()
}

export default function SiiRolExplorer() {
  const [region, setRegion] = useState("")
  const [comuna, setComuna] = useState("")
  const [comunaCode, setComunaCode] = useState("")
  const [calle, setCalle] = useState("")
  const [numero, setNumero] = useState("")

  const [status, setStatus] = useState<"idle" | "running" | "done" | "error">("idle")
  const [msg, setMsg] = useState("")
  const [roles, setRoles] = useState<Role[]>([])

  const communesForRegion = region ? COMMUNES_BY_REGION[region] || [] : []

  const handleRegionChange = (value: string) => {
    setRegion(value)
    setComuna("")
    setComunaCode("")
  }

  const handleComunaChange = (value: string) => {
    setComuna(value)
    setComunaCode(KNOWN_SII_COMMUNE_CODES[normalizeCommuneName(value)] || "")
  }

  const loadExample = () => {
    setRegion("13")
    setComuna("Santiago")
    setComunaCode("13101")
    setCalle("ALAMEDA")
    setNumero("3")
  }

  async function run() {
    setStatus("running")
    setMsg("Consultando…")
    setRoles([])

    try {
      const r = await fetch("/api/sii/explore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ region, comuna: comunaCode, calle, numero }),
      })

      const data = await r.json()

      if (!r.ok) {
        setStatus("error")
        setMsg(data?.error ?? "Error al consultar.")
        return
      }

      setStatus("done")
      setMsg("Resultado listo.")
      setRoles(data?.roles ?? [])
    } catch (e: any) {
      setStatus("error")
      setMsg(e?.message ?? "Error desconocido")
    }
  }

  return (
    <Card className="w-full max-w-2xl bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Explorador Predial (SII)</h2>
        <p className="mt-1 text-sm text-slate-600">
          Consulta asistida del "Conozca el número de rol". Puede requerir verificación humana.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Select value={region} onValueChange={handleRegionChange}>
          <SelectTrigger className="bg-white">
            <SelectValue placeholder="Selecciona Región" />
          </SelectTrigger>
          <SelectContent>
            {REGIONS.map((r) => (
              <SelectItem key={r.id} value={r.id}>
                {r.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={comuna} onValueChange={handleComunaChange} disabled={!region}>
          <SelectTrigger className="bg-white">
            <SelectValue placeholder="Selecciona Comuna" />
          </SelectTrigger>
          <SelectContent>
            {communesForRegion.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          placeholder="Codigo comuna SII, ej: 13101"
          value={comunaCode}
          onChange={(e) => setComunaCode(e.target.value)}
          className="bg-white"
        />
        <Input placeholder="Calle" value={calle} onChange={(e) => setCalle(e.target.value)} className="bg-white" />
        <Input placeholder="Número" value={numero} onChange={(e) => setNumero(e.target.value)} className="bg-white" />
      </div>

      <Button type="button" variant="outline" onClick={loadExample} className="mt-3 w-full bg-white">
        Cargar ejemplo: Santiago, Alameda 3
      </Button>

      <Button
        onClick={run}
        disabled={status === "running" || !comunaCode || !calle || !numero}
        className="mt-4 w-full"
      >
        {status === "running" ? "Buscando…" : "Explorador terreno (SII)"}
      </Button>

      {msg && (
        <Card className="mt-4 border-slate-200 bg-slate-50 p-3">
          <p className="text-sm text-slate-700">{msg}</p>
        </Card>
      )}

      {roles.length > 0 && (
        <div className="mt-4 space-y-2">
          <h3 className="font-semibold text-slate-900">Resultados:</h3>
          {roles.map((role, i) => (
            <Card key={i} className="border-slate-200 bg-white p-3">
              <p className="text-sm font-mono text-slate-700">
                <strong>Rol:</strong> {role.rol_manzana}-{role.rol_predio}
              </p>
              {role.direccion && <p className="text-xs text-slate-600">{role.direccion}</p>}
              {role.destino && <p className="text-xs text-slate-500">Destino: {role.destino}</p>}
              {role.source && <p className="text-xs text-slate-400">Fuente: {role.source}</p>}
            </Card>
          ))}
        </div>
      )}

      <div className="mt-6 border-t border-slate-200 pt-4 text-xs text-slate-500">
        <p>Fuente: SII (consulta asistida). Si aparece CAPTCHA, debe completarse manualmente.</p>
        <p className="mt-2 text-slate-400">Este módulo respeta las condiciones del sitio oficial del SII.</p>
      </div>
    </Card>
  )
}
