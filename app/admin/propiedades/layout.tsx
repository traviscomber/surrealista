"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function AdminPropertiesLayout({ children }) {
  const router = useRouter()

  useEffect(() => {
    router.replace("/admin/propiedades-lista")
  }, [router])

  return null
}
