import type React from "react"
import type { Metadata } from "next"
import { Inter, Lora } from "next/font/google"
import "./globals.css"

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
  display: "swap",
})

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Sur-Realista - Inmobiliaria Premium del Sur de Chile",
  description:
    "Descubre propiedades exclusivas en el sur de Chile con tecnología IA avanzada. Puerto Varas, Pucón, Valdivia y más.",
  keywords: "inmobiliaria, sur chile, puerto varas, pucon, valdivia, propiedades, casas, terrenos, IA",
  generator: "v0.dev",
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
  userScalable: false,
  themeColor: "#6B8E7A",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.variable} ${lora.variable} font-sans`}>
        {children}
      </body>
    </html>
  )
}
