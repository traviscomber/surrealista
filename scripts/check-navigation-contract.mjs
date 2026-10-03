import { readFile } from "node:fs/promises"

const contracts = [
  ["app/(main)/layout.tsx", ["ModuleOperatingShell"]],
  ["app/(dashboard)/layout.tsx", ["ModuleOperatingShell"]],
  ["app/(features)/layout.tsx", ["ModuleOperatingShell"]],
  ["app/admin/layout.tsx", ["ModuleOperatingShell"], ["AdminSidebar"]],
  ["app/clientes/layout.tsx", ["OperatingWorkspace"]],
  ["app/documentacion/layout.tsx", ["OperatingWorkspace"]],
  ["app/home-spotter/layout.tsx", ["OperatingWorkspace"]],
  ["app/opportunities/layout.tsx", ["OperatingWorkspace"]],
  ["app/kmz/layout.tsx", ["OperatingWorkspace"]],
  ["app/kmz-map/layout.tsx", ["OperatingWorkspace"]],
  ["app/kmz-search/layout.tsx", ["OperatingWorkspace"]],
  ["app/kmz-search-advanced/layout.tsx", ["OperatingWorkspace"]],
  ["app/kmz-guide/layout.tsx", ["OperatingWorkspace"]],
  ["app/quick-wins/layout.tsx", ["OperatingWorkspace"]],
  ["components/os/module-operating-shell.tsx", ["href=\"/\"", "aria-label=\"Ir a Inicio\"", "Módulos de Sur Realista", "Saltar al contenido"]],
  ["components/os/navigation-config.ts", ["Inicio", "Campos", "Clientes", "Multimedia", "Documentos", "Mercado"]],
  ["components/search/global-command-palette.tsx", ["Inicio", "Campos", "Clientes", "Multimedia", "Documentos", "Mercado", "Tareas", "Asistente IA"]],
]

const failures = []

for (const [path, required, forbidden = []] of contracts) {
  let content = ""
  try {
    content = await readFile(path, "utf8")
  } catch (error) {
    failures.push(`${path}: no se pudo leer (${error instanceof Error ? error.message : String(error)})`)
    continue
  }

  for (const token of required) {
    if (!content.includes(token)) failures.push(`${path}: falta contrato de navegación ${JSON.stringify(token)}`)
  }

  for (const token of forbidden) {
    if (content.includes(token)) failures.push(`${path}: reapareció navegación paralela ${JSON.stringify(token)}`)
  }
}

if (failures.length) {
  console.error("Navigation contract failed:")
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(`Navigation contract passed: ${contracts.length} surfaces checked`)
