"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { REGIONS, COMMUNES_BY_REGION } from "@/lib/sii/chile-locations"

type Role = { rol_manzana: string; rol_predio: string; direccion?: string }

export default function SiiRolExplorer() {
  const [region, setRegion] = useState("")
  const [comuna, setComuna] = useState("")
  const [calle, setCalle] = useState("")
  const [numero, setNumero] = useState("")

  const [status, setStatus] = useState<"idle" | "running" | "captcha" | "done" | "error">("idle")
  const [msg, setMsg] = useState("")
  const [roles, setRoles] = useState<Role[]>([])

  const communesForRegion = region ? COMMUNES_BY_REGION[region] || [] : []

  const handleRegionChange = (value: string) => {
    setRegion(value)
    setComuna("") // Reset comuna selection when region changes
  }

  async function run() {
    setStatus("running")
    setMsg("Abriendo consulta oficial del SII…")
    setRoles([])

    try {
      const r = await fetch("/api/sii/explore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ region, comuna, calle, numero }),
      })

      const data = await r.json()

      if (!r.ok) {
        setStatus("error")
        setMsg(data?.error ?? "Error al consultar.")
        return
      }

      if (data?.state === "CAPTCHA_REQUIRED") {
        setStatus("captcha")
        setMsg("Verificación requerida (CAPTCHA) en la ventana del SII. Complétala para continuar.")
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

        <Select value={comuna} onValueChange={setComuna} disabled={!region}>
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

        <Input placeholder="Calle" value={calle} onChange={(e) => setCalle(e.target.value)} className="bg-white" />
        <Input placeholder="Número" value={numero} onChange={(e) => setNumero(e.target.value)} className="bg-white" />
      </div>

      <Button onClick={run} disabled={status === "running"} className="mt-4 w-full bg-green-600 hover:bg-green-700">
        {status === "running" ? "Consultando…" : "Explorar terreno (SII)"}
      </Button>

      {msg && (
        <Card className="mt-4 border-slate-200 bg-slate-50 p-3">
          <p className="text-sm text-slate-700">{msg}</p>
        </Card>
      )}

      {status === "done" && roles.length > 0 && (
        <div className="mt-4 space-y-2">
          <h3 className="font-semibold text-slate-900">Roles encontrados</h3>
          {roles.map((role, i) => (
            <Card key={i} className="border-slate-200 bg-white p-3">
              <div className="text-sm">
                <span className="text-slate-600">ROL:</span>{" "}
                <span className="font-semibold text-slate-900">
                  {role.rol_manzana}-{role.rol_predio}
                </span>
              </div>
              {role.direccion && <div className="mt-1 text-xs text-slate-500">{role.direccion}</div>}
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
