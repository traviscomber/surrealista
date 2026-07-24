import type React from "react"
import type { Metadata } from "next"
import { Inter, Lora } from "next/font/google"
import "./globals.css"
import "@/components/campos/campos-inspector-accordion.css"
import "@/components/campos/campos-five-phase-suite.css"
import { CAMPOSFivePhaseSuite } from "@/components/campos/campos-five-phase-suite"
import { ThemeProvider } from "@/components/theme-provider"
import { VisitReminders } from "@/components/visits/visit-reminders"
import { CAMPOSInspectorAccordion } from "@/components/campos/campos-inspector-accordion"
import { Toaster } from "sonner"
import { SentryInit } from "@/components/sentry-init"

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
  title: {
    default: "Sur Realista | Gestión territorial interna",
    template: "%s | Sur Realista",
  },
  description:
    "Espacio interno para administrar propiedades, antecedentes territoriales, clientes, documentos y fuentes de información de Sur Realista.",
  robots: {
    index: false,
    follow: false,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning className="scroll-smooth">
      <body className={`${inter.variable} ${lora.variable} bg-background font-sans text-foreground antialiased`}>
        <SentryInit />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          storageKey="sur-realista-theme"
        >
          {children}
        </ThemeProvider>
        <CAMPOSInspectorAccordion />
        <CAMPOSFivePhaseSuite />
        <Toaster richColors closeButton />
        <VisitReminders />
      </body>
    </html>
  )
}
