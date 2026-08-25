import type React from "react"
import type { Metadata } from "next"
import { Inter, Lora } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { PasswordGate } from "@/components/auth/password-gate"
import { VisitReminders } from "@/components/visits/visit-reminders"
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
    default: "Sur Realista Intelligence",
    template: "%s | Sur Realista Intelligence",
  },
  description:
    "Plataforma interna de inteligencia territorial y comercial de Sur Realista para analizar campos, mercado, KMZ, valorizaciones y oportunidades.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning className="scroll-smooth">
      <body className={`${inter.variable} ${lora.variable} font-sans bg-background text-foreground`}>
        <SentryInit />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          storageKey="sur-realista-theme"
        >
          <PasswordGate>{children}</PasswordGate>
        </ThemeProvider>
        <Toaster />
        <VisitReminders />
      </body>
    </html>
  )
}
