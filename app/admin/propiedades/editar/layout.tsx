import type { ReactNode } from "react"

export default function EditPropertyLayout({
  children,
}: {
  children: ReactNode
}) {
  // Este layout no añade ningún componente adicional
  // para evitar la duplicación con el layout raíz
  return children
}
