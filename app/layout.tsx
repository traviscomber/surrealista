import type React from "react"
import type { Metadata } from "next"
import Script from "next/script"
import { Inter, Lora } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { PasswordGateRouteBoundary } from "@/components/auth/password-gate-route-boundary"
import { VisitReminders } from "@/components/visits/visit-reminders"
import { Toaster } from "sonner"
import { SentryInit } from "@/components/sentry-init"
import { APP_TIME_ZONE } from "@/lib/timezone"

const lora = Lora({ subsets: ["latin"], variable: "--font-lora", display: "swap" })
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" })

const timezoneBootstrap = `
(() => {
  const timeZone = ${JSON.stringify(APP_TIME_ZONE)};
  const methods = ["toLocaleString", "toLocaleDateString", "toLocaleTimeString"];
  for (const method of methods) {
    const original = Date.prototype[method];
    if (typeof original !== "function") continue;
    Object.defineProperty(Date.prototype, method, {
      configurable: true,
      writable: true,
      value: function(locales, options) {
        const nextOptions = options && typeof options === "object"
          ? { ...options, timeZone: options.timeZone || timeZone }
          : { timeZone };
        return original.call(this, locales, nextOptions);
      },
    });
  }
})();
`

export const metadata: Metadata = {
  title: {
    default: "Sur Realista Intelligence",
    template: "%s | Sur Realista Intelligence",
  },
  description:
    "Plataforma interna de inteligencia territorial de Sur Realista. Campos es la vista principal para explorar inventario, mapa, regiones, vecinos y propietarios, con mercado, valorización y operación comercial como capas de apoyo.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false, noimageindex: true },
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-CL" suppressHydrationWarning className="scroll-smooth" data-time-zone={APP_TIME_ZONE}>
      <body className={`${inter.variable} ${lora.variable} font-sans bg-background text-foreground`}>
        <Script id="sur-realista-timezone" strategy="beforeInteractive">
          {timezoneBootstrap}
        </Script>
        <SentryInit />
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange storageKey="sur-realista-theme">
          <PasswordGateRouteBoundary>{children}</PasswordGateRouteBoundary>
        </ThemeProvider>
        <Toaster />
        <VisitReminders />
      </body>
    </html>
  )
}
