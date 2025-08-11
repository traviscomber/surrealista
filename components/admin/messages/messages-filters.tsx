"use client"

import { Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function MessagesFilters() {
  return (
    <Suspense fallback={<div className="h-14 bg-muted/30 rounded-lg animate-pulse"></div>}>
      <MessagesFiltersContent />
    </Suspense>
  )
}

function MessagesFiltersContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [search, setSearch] = useState(searchParams.get("search") || "")
  const [status, setStatus] = useState(searchParams.get("status") || "all")
  const [priority, setPriority] = useState(searchParams.get("priority") || "all")

  useEffect(() => {
    const params = new URLSearchParams()

    if (search) {
      params.set("search", search)
    }
    if (status && status !== "all") {
      params.set("status", status)
    }
    if (priority && priority !== "all") {
      params.set("priority", priority)
    }

    router.replace(`/admin/messages?${params.toString()}`)
  }, [search, status, priority, router])

  return (
    <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
      <Input placeholder="Search messages..." value={search} onChange={(e) => setSearch(e.target.value)} />
      <Select value={status} onValueChange={setStatus}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          <SelectItem value="open">Open</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="closed">Closed</SelectItem>
        </SelectContent>
      </Select>
      <Select value={priority} onValueChange={setPriority}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Priority" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          <SelectItem value="high">High</SelectItem>
          <SelectItem value="medium">Medium</SelectItem>
          <SelectItem value="low">Low</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
