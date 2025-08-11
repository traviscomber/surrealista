"use client"

import Image from "next/image"
import { useState } from "react"

interface SimpleImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
  fill?: boolean
  objectFit?: "cover" | "contain" | "fill" | "none" | "scale-down"
}

export function SimpleImage({
  src,
  alt,
  width,
  height,
  className = "",
  priority = false,
  fill = false,
  objectFit = "cover",
}: SimpleImageProps) {
  const [error, setError] = useState(false)

  // Generate a placeholder URL if the image fails to load
  const placeholderUrl = `/placeholder.svg?height=${height || 400}&width=${width || 600}&query=${encodeURIComponent(
    alt || "property image",
  )}`

  // Use the placeholder if there's an error
  const imageSrc = error ? placeholderUrl : src

  return (
    <Image
      src={imageSrc || "/placeholder.svg"}
      alt={alt}
      width={fill ? undefined : width || 600}
      height={fill ? undefined : height || 400}
      className={className}
      priority={priority}
      fill={fill}
      style={fill ? { objectFit } : undefined}
      onError={() => setError(true)}
    />
  )
}
