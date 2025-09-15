"use client"

import { Button } from "@/components/ui/button"
import { MessageCircle } from "lucide-react"
import { useRouter } from "next/navigation"

export function FloatingChat() {
  const router = useRouter()

  const handleChatClick = () => {
    router.push("/asistente-ia")
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Button
        onClick={handleChatClick}
        className="h-14 w-14 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200"
        size="icon"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    </div>
  )
}
