import { readFile } from "node:fs/promises"

const required = [
  ["lib/sii/sii-comuna-code-resolver.ts", [
    "SII_COMUNA_TABLE_URL",
    "parseSiiCommuneTable",
    "resolveSiiCommuneCode",
    "parsed.size < 300",
  ]],
  ["lib/kmz/rol-verification.ts", [
    "verifiedSiiRol",
    "\\d{5}",
  ]],
  ["lib/kmz/sii-verification-worker.ts", [
    "resolveSiiCommuneCode",
    "verifiedSiiRol",
    "official_role_recovery",
    "kmz-sii-role-recovery-v1",
    "sii_no_record_requires_external_evidence",
    "sii_commune_mismatch_requires_review",
  ]],
  ["lib/kmz/kmz-reader.ts", [
    "kmlHierarchy",
    "buildKmlHierarchySummary",
    "childElement.localName",
    "folderPath",
  ]],
  ["lib/kmz/kmz-hierarchy.ts", [
    "KmlHierarchySummary",
    "folderCount",
    "maxDepth",
    "rootFolders",
    "placemarkCount",
  ]],
  ["app/api/kmz/field-intelligence/route.ts", [
    "kmlHierarchy",
    "kmz_placemarks",
    ".limit(500)",
    "verifyInternalAccessToken",
    "INTERNAL_ACCESS_COOKIE",
  ]],
  ["components/campos/campo-intelligence-panel-v2.tsx", [
    "Jerarquía KML",
    "Sin estructura Folder preservada",
    "Carpetas raíz",
    "Rutas KML",
  ]],
  ["app/api/cron/recover-kmz-storage/route.ts", [
    "hierarchy_only",
    "hierarchy_recovery",
    "kml_hierarchy",
    "kmlHierarchyRecovery",
  ]],
]

const forbidden = [
  ["lib/kmz/sii-verification-worker.ts", [
    "rol_numbers:Array.from(new Set([...(row.rol_numbers||[]),record?.rol].filter(Boolean)))",
  ]],
]

const failures = []

for (const [path, tokens] of required) {
  let content = ""
  try {
    content = await readFile(path, "utf8")
  } catch (error) {
    failures.push(`${path}: no se pudo leer (${error instanceof Error ? error.message : String(error)})`)
    continue
  }

  for (const token of tokens) {
    if (!content.includes(token)) failures.push(`${path}: falta contrato ${JSON.stringify(token)}`)
  }
}

for (const [path, tokens] of forbidden) {
  const content = await readFile(path, "utf8").catch(() => "")
  for (const token of tokens) {
    if (content.includes(token)) failures.push(`${path}: patrón inseguro presente ${JSON.stringify(token)}`)
  }
}

if (failures.length) {
  console.error("KMZ recovery contract failed:")
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(`KMZ recovery contract passed: ${required.length} surfaces checked`)
