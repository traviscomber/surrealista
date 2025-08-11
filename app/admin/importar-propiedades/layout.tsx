import type { ReactNode } from "react"

export default function ImportPropertiesLayout({
  children,
}: {
  children: ReactNode
}) {
  // Este layout no añade ningún componente adicional
  // para evitar la duplicación con el layout raíz
  return children
}
