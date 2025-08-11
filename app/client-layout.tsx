"use client"

import type React from "react"
import { Inter } from "next/font/google"
import { usePathname } from "next/navigation"
import "./globals.css"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { FloatingChatWidget } from "@/components/chat/floating-chat-widget"

const inter = Inter({ subsets: ["latin"] })

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isAdminPage = pathname?.startsWith("/admin")

  return (
    <html lang="es">
      <body className={inter.className}>
        {!isAdminPage && <Header />}
        <main>{children}</main>
        {!isAdminPage && <Footer />}
        {!isAdminPage && <FloatingChatWidget />}
      </body>
    </html>
  )
}
