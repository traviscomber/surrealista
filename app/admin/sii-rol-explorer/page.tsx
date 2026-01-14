import SiiRolExplorer from "@/components/sii-rol-explorer"

export const metadata = {
  title: "Explorador SII - Consultar Roles",
  description: "Herramienta para consultar números de rol en el SII",
}

export default function SiiPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Consultor de Roles (SII)</h1>
        <p className="mt-2 text-slate-600">
          Consulta el número de rol de propiedades mediante el servicio oficial del SII.
        </p>
      </div>

      <SiiRolExplorer />

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
        <p className="font-semibold">Información técnica:</p>
        <ul className="mt-2 list-inside list-disc space-y-1 text-xs">
          <li>Esta herramienta opera bajo demanda del usuario</li>
          <li>Respeta los términos de servicio del SII</li>
          <li>Puede requerir verificación manual (CAPTCHA)</li>
          <li>No realiza automatización masiva</li>
        </ul>
      </div>
    </div>
  )
}
