import type React from "react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { FloatingChatWidget } from "@/components/chat/floating-chat-widget"

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <FloatingChatWidget />
    </div>
  )
}
