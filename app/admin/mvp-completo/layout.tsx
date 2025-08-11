import { Metadata } from "next"

export const metadata: Metadata = {
  title: "MVP Completo - Sur Realista",
  description: "Sistema integral de gestión de repositorio, estandarización y vinculación de compradores",
}

export default function MVPCompletoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  )
}
