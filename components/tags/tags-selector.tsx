"use client"

import { useState, useEffect } from "react"
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

export function TagsSelector({ entityType, entityId, onTagsChange, disabled = false }: TagsSelectorProps) {
  const [tags, setTags] = useState<string[]>([])
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const supabase = createBrowserClient()

  // Load tags for this entity
  useEffect(() => {
    loadEntityTags()
    loadAvailableTags()
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
      } else if (entityType === "task") {
        query = supabase.from("tasks").select("tags").eq("id", entityId)
      }

      if (query) {
        const { data, error } = await query
        if (error) throw error

        if (entityType === "task" && data && data[0]) {
          setTags(data[0].tags || [])
        } else if (data) {
          const tagNames = data.map((item: any) => item.tags?.name || item.tags).filter(Boolean)
          setTags(tagNames)
        }
      }
    } catch (error) {
      console.error("[v0] Error loading entity tags:", error)
    }
  }

  const loadAvailableTags = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.from("tags").select("name").order("name")
      if (error) throw error
      setAvailableTags((data || []).map((t: any) => t.name))
    } catch (error) {
      console.error("[v0] Error loading available tags:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const addTag = async (tagName: string) => {
    if (!tagName.trim() || tags.includes(tagName.trim())) return

    const normalizedTag = tagName.trim()
    setIsSaving(true)

    try {
      // Ensure tag exists in tags table
      const { data: existingTag, error: selectError } = await supabase
        .from("tags")
        .select("id")
        .eq("name", normalizedTag)
        .single()

      let tagId = existingTag?.id

      if (!existingTag) {
        // Create new tag
        const { data: newTag, error: insertError } = await supabase
          .from("tags")
          .insert({ name: normalizedTag, color: generateColor() })
          .select("id")
          .single()

        if (insertError) throw insertError
        tagId = newTag?.id
      }

      // Link tag to entity
      if (tagId) {
        if (entityType === "task") {
          // For tasks, update tags array directly
          const { error: updateError } = await supabase
            .from("tasks")
            .update({ tags: [...tags, normalizedTag] })
            .eq("id", entityId)
          if (updateError) throw updateError
        } else {
          const linkTable =
            entityType === "kmz"
              ? "kmz_tags"
              : entityType === "client"
                ? "client_tags"
                : "communication_tags"
          const linkColumn =
            entityType === "kmz" ? "kmz_id" : entityType === "client" ? "client_id" : "communication_id"

          const { error: linkError } = await supabase
            .from(linkTable)
            .insert({
              [linkColumn]: entityId,
              tag_id: tagId,
            })

          if (linkError) throw linkError
        }
      }

      const newTags = [...tags, normalizedTag]
      setTags(newTags)
      setInputValue("")
      onTagsChange?.(newTags)

      if (!availableTags.includes(normalizedTag)) {
        setAvailableTags([...availableTags, normalizedTag].sort())
      }
    } catch (error) {
      console.error("[v0] Error adding tag:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const removeTag = async (tagToRemove: string) => {
    setIsSaving(true)

    try {
      if (entityType === "task") {
        // For tasks, update tags array
        const newTags = tags.filter((t) => t !== tagToRemove)
        const { error: updateError } = await supabase.from("tasks").update({ tags: newTags }).eq("id", entityId)

        if (updateError) throw updateError
        setTags(newTags)
        onTagsChange?.(newTags)
      } else {
        // Get tag ID
        const { data: tagData, error: selectError } = await supabase
          .from("tags")
          .select("id")
          .eq("name", tagToRemove)
          .single()

        if (selectError) throw selectError

        // Delete link
        const linkTable =
          entityType === "kmz"
            ? "kmz_tags"
            : entityType === "client"
              ? "client_tags"
              : "communication_tags"
        const linkColumn =
          entityType === "kmz" ? "kmz_id" : entityType === "client" ? "client_id" : "communication_id"

        const { error: deleteError } = await supabase
          .from(linkTable)
          .delete()
          .eq(linkColumn, entityId)
          .eq("tag_id", tagData.id)

        if (deleteError) throw deleteError

        const newTags = tags.filter((t) => t !== tagToRemove)
        setTags(newTags)
        onTagsChange?.(newTags)
      }
    } catch (error) {
      console.error("[v0] Error removing tag:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const filteredTags = availableTags.filter(
    (tag) => tag.toLowerCase().includes(inputValue.toLowerCase()) && !tags.includes(tag),
  )

  function generateColor(): string {
    const colors = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8", "#F7DC6F", "#BB8FCE", "#85C1E2"]
    return colors[Math.floor(Math.random() * colors.length)]
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
              <button
                onClick={() => removeTag(tag)}
                disabled={isSaving}
                className="ml-1 hover:text-emerald-900"
              >
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
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  addTag(inputValue)
                }
              }}
              onFocus={() => setIsOpen(true)}
              className="flex-1"
            />
            <Button
              size="sm"
              onClick={() => addTag(inputValue)}
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
                    addTag(tag)
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
