"use client"

import { useEffect, useState } from "react"
import { X, Plus, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { createBrowserClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

interface TagsSelectorProps {
  entityType: "kmz" | "client" | "communication" | "task"
  entityId: string
  onTagsChange?: (tags: string[]) => void
  disabled?: boolean
}

function getStringId(value: unknown): string | null {
  if (!value || typeof value !== "object") return null
  const row = value as Record<string, unknown>
  return typeof row.id === "string" && row.id ? row.id : null
}

function getTagArray(value: unknown): string[] {
  if (!value || typeof value !== "object") return []
  const row = value as Record<string, unknown>
  return Array.isArray(row.tags) ? row.tags.filter((tag): tag is string => typeof tag === "string") : []
}

function getTagName(value: unknown): string | null {
  if (!value || typeof value !== "object") return null
  const row = value as Record<string, unknown>
  if (typeof row.name === "string") return row.name

  const nested = row.tags
  if (typeof nested === "string") return nested
  if (nested && typeof nested === "object") {
    const nestedRow = nested as Record<string, unknown>
    return typeof nestedRow.name === "string" ? nestedRow.name : null
  }

  return null
}

export function TagsSelector({ entityType, entityId, onTagsChange, disabled = false }: TagsSelectorProps) {
  const [tags, setTags] = useState<string[]>([])
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const supabase = createBrowserClient()

  useEffect(() => {
    void loadEntityTags()
    void loadAvailableTags()
  }, [entityId, entityType])

  const loadEntityTags = async () => {
    try {
      let query
      if (entityType === "kmz") {
        query = supabase.from("kmz_tags").select("tag_id, tags(name)").eq("kmz_id", entityId)
      } else if (entityType === "client") {
        query = supabase.from("client_tags").select("tag_id, tags(name)").eq("client_id", entityId)
      } else if (entityType === "communication") {
        query = supabase.from("communication_tags").select("tag_id, tags(name)").eq("communication_id", entityId)
      } else {
        query = supabase.from("tasks").select("tags").eq("id", entityId)
      }

      const { data, error } = await query
      if (error) throw error

      if (entityType === "task") {
        const firstRow = Array.isArray(data) ? data[0] : null
        setTags(getTagArray(firstRow))
        return
      }

      const tagNames = (Array.isArray(data) ? data : [])
        .map(getTagName)
        .filter((tag): tag is string => Boolean(tag))
      setTags(tagNames)
    } catch (error) {
      console.error("[tags-selector] Error loading entity tags:", error)
    }
  }

  const loadAvailableTags = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.from("tags").select("name").order("name")
      if (error) throw error

      const names = (Array.isArray(data) ? data : [])
        .map((value) => getTagName(value))
        .filter((tag): tag is string => Boolean(tag))
      setAvailableTags(names)
    } catch (error) {
      console.error("[tags-selector] Error loading available tags:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const addTag = async (tagName: string) => {
    const normalizedTag = tagName.trim()
    if (!normalizedTag || tags.includes(normalizedTag)) return

    setIsSaving(true)

    try {
      const { data: existingTag } = await supabase.from("tags").select("id").eq("name", normalizedTag).maybeSingle()
      let tagId = getStringId(existingTag)

      if (!tagId) {
        const { data: newTag, error: insertError } = await supabase
          .from("tags")
          .insert({ name: normalizedTag, color: generateColor() })
          .select("id")
          .single()

        if (insertError) throw insertError
        tagId = getStringId(newTag)
        if (!tagId) throw new Error("Tag creation returned an invalid id")
      }

      if (entityType === "task") {
        const { error: updateError } = await supabase
          .from("tasks")
          .update({ tags: [...tags, normalizedTag] })
          .eq("id", entityId)
        if (updateError) throw updateError
      } else {
        const linkTable =
          entityType === "kmz" ? "kmz_tags" : entityType === "client" ? "client_tags" : "communication_tags"
        const linkColumn =
          entityType === "kmz" ? "kmz_id" : entityType === "client" ? "client_id" : "communication_id"

        const { error: linkError } = await supabase.from(linkTable).insert({
          [linkColumn]: entityId,
          tag_id: tagId,
        })

        if (linkError) throw linkError
      }

      const newTags = [...tags, normalizedTag]
      setTags(newTags)
      setInputValue("")
      onTagsChange?.(newTags)

      if (!availableTags.includes(normalizedTag)) {
        setAvailableTags([...availableTags, normalizedTag].sort())
      }
    } catch (error) {
      console.error("[tags-selector] Error adding tag:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const removeTag = async (tagToRemove: string) => {
    setIsSaving(true)

    try {
      if (entityType === "task") {
        const newTags = tags.filter((tag) => tag !== tagToRemove)
        const { error: updateError } = await supabase.from("tasks").update({ tags: newTags }).eq("id", entityId)

        if (updateError) throw updateError
        setTags(newTags)
        onTagsChange?.(newTags)
        return
      }

      const { data: tagData, error: selectError } = await supabase
        .from("tags")
        .select("id")
        .eq("name", tagToRemove)
        .single()

      if (selectError) throw selectError
      const tagId = getStringId(tagData)
      if (!tagId) throw new Error("Tag lookup returned an invalid id")

      const linkTable =
        entityType === "kmz" ? "kmz_tags" : entityType === "client" ? "client_tags" : "communication_tags"
      const linkColumn =
        entityType === "kmz" ? "kmz_id" : entityType === "client" ? "client_id" : "communication_id"

      const { error: deleteError } = await supabase
        .from(linkTable)
        .delete()
        .eq(linkColumn, entityId)
        .eq("tag_id", tagId)

      if (deleteError) throw deleteError

      const newTags = tags.filter((tag) => tag !== tagToRemove)
      setTags(newTags)
      onTagsChange?.(newTags)
    } catch (error) {
      console.error("[tags-selector] Error removing tag:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const filteredTags = availableTags.filter(
    (tag) => tag.toLowerCase().includes(inputValue.toLowerCase()) && !tags.includes(tag),
  )

  function generateColor(): string {
    const colors = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8", "#F7DC6F", "#BB8FCE", "#85C1E2"]
    const index = Math.abs(
      normalizedColorSeed(inputValue || "tag") % colors.length,
    )
    return colors[index]
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <Badge
            key={tag}
            className={cn(
              "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 cursor-pointer flex items-center gap-1",
              disabled && "opacity-50 cursor-not-allowed",
            )}
          >
            {tag}
            {!disabled && (
              <button onClick={() => void removeTag(tag)} disabled={isSaving} className="ml-1 hover:text-emerald-900">
                <X className="h-3 w-3" />
              </button>
            )}
          </Badge>
        ))}
      </div>

      {!disabled && (
        <div className="relative">
          <div className="flex gap-2">
            <Input
              placeholder="Agregar tag..."
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault()
                  void addTag(inputValue)
                }
              }}
              onFocus={() => setIsOpen(true)}
              className="flex-1"
            />
            <Button
              size="sm"
              onClick={() => void addTag(inputValue)}
              disabled={!inputValue.trim() || isSaving}
              variant="outline"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            </Button>
          </div>

          {isOpen && filteredTags.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-md shadow-lg z-50 max-h-48 overflow-y-auto">
              {filteredTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => {
                    void addTag(tag)
                    setIsOpen(false)
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function normalizedColorSeed(value: string): number {
  let hash = 0
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) | 0
  }
  return hash
}
