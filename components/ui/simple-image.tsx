"use client"

import Image from "next/image"
import { useState } from "react"
import { ImageOff } from "lucide-react"

interface SimpleImageProps {
  src?: string | null
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

  if (!src || error) {
    return (
      <div
        role="img"
        aria-label={`${alt}. Imagen no disponible.`}
        className={`flex items-center justify-center bg-muted text-muted-foreground ${className}`}
        style={fill ? { position: "absolute", inset: 0 } : { width: width || 600, height: height || 400 }}
      >
        <div className="flex flex-col items-center gap-2 px-3 text-center">
          <ImageOff className="h-5 w-5" aria-hidden="true" />
          <span className="text-xs">Imagen no disponible</span>
        </div>
      </div>
    )
  }

  return (
    <Image
      src={src}
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
