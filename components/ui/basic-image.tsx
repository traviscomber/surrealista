"use client"

import { useState } from "react"

interface BasicImageProps {
  src: string
  alt: string
  className?: string
  width?: string | number
  height?: string | number
}

export function BasicImage({ src, alt, className = "", width, height }: BasicImageProps) {
  const [imgSrc, setImgSrc] = useState(src)
  const [error, setError] = useState(false)

  // Fallback image
  const fallbackSrc = `/placeholder.svg?height=400&width=600&query=${encodeURIComponent(alt)}`

  const handleError = () => {
    if (!error) {
      console.log(`Error loading image: ${src}, falling back to placeholder`)
      setImgSrc(fallbackSrc)
      setError(true)
    }
  }

  return (
    <img
      src={imgSrc || "/placeholder.svg"}
      alt={alt}
      className={className}
      width={width}
      height={height}
      onError={handleError}
      loading="lazy"
    />
  )
}
