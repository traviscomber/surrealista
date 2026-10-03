import { readFile } from "node:fs/promises"

const contracts = [
  ["components/campos/campos-folder-view-integrated.tsx", [
    "fieldDisplayName",
    "manual_display_name",
    "currentOwner",
    "currentGoogleDocsLink",
    "Buscar campo, propietario, región o ROL",
    "ownerEvidence",
  ]],
  ["components/campos/campo-intelligence-panel-v2.tsx", [
    "01 · Identidad",
    "Propietario operativo",
    "Evidencia de propietario",
    "Documento fuente",
    "safeExternalUrl",
    "02 · Uso y actividad",
    "Uso SII",
    "04 · Entorno y POIs",
    "05 · Documentos",
    "07 · Siguiente acción",
    "fieldEvidence",
    "ACTIVITY_KEYS",
    "CROP_KEYS",
  ]],
  ["components/kmz/kmz-owner-edit-modal.tsx", [
    "Archivo fuente KMZ",
    "Propietario",
    "Google Docs",
    "/api/kmz/profile/",
  ]],
  ["components/kmz/kmz-collection-manager.tsx", [
    "@/lib/supabase/client",
    "createBrowserClient()",
  ]],
  ["app/api/kmz/search/route.ts", [
    "owner.ilike",
    "metadata->>confirmed_owner.ilike",
    "extractOwnerEvidence",
    "rol_numbers",
  ]],
  ["app/api/kmz/field-intelligence/route.ts", [
    "kmz_enrichment_evidence",
    "fieldEvidence",
    ".limit(50)",
  ]],
  ["app/api/kmz/profile/[kmzId]/route.ts", [
    "verifyInternalAccessToken",
    "SUPABASE_SERVICE_ROLE_KEY",
    "sameOrigin",
    "manual_display_name",
    "original_file_name",
    "recordOperatorAudit",
  ]],
]

const failures = []

const forbiddenContracts = [
  ["components/kmz/kmz-owner-edit-modal.tsx", ["@supabase/ssr"]],
  ["components/kmz/kmz-collection-manager.tsx", ["@supabase/ssr"]],
]

for (const [path, required] of contracts) {
  let content = ""
  try {
    content = await readFile(path, "utf8")
  } catch (error) {
    failures.push(`${path}: no se pudo leer (${error instanceof Error ? error.message : String(error)})`)
    continue
  }

  for (const token of required) {
    if (!content.includes(token)) failures.push(`${path}: falta contrato ${JSON.stringify(token)}`)
  }
}

for (const [path, forbidden] of forbiddenContracts) {
  let content = ""
  try {
    content = await readFile(path, "utf8")
  } catch {
    continue
  }
  for (const token of forbidden) {
    if (content.includes(token)) failures.push(`${path}: contrato prohibido presente ${JSON.stringify(token)}`)
  }
}

if (failures.length) {
  console.error("Campos contract failed:")
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(`Campos contract passed: ${contracts.length} surfaces checked`)
