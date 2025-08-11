/**
 * Utilidades para optimización y manejo de imágenes
 */

// Detecta si el navegador soporta WebP
export function supportsWebp(): boolean {
  if (typeof window === "undefined") return false

  const elem = document.createElement("canvas")
  if (!!(elem.getContext && elem.getContext("2d"))) {
    // Se devuelve true si el navegador soporta WebP
    return elem.toDataURL("image/webp").indexOf("data:image/webp") === 0
  }
  return false
}

// Detecta si el navegador soporta AVIF
export function supportsAvif(): boolean {
  if (typeof window === "undefined") return false

  // Esta es una detección simple, en producción se podría usar una imagen de prueba
  // o una biblioteca como Modernizr para una detección más precisa
  return HTMLImageElement.prototype.hasOwnProperty("loading")
}

// Convierte una URL de imagen a su versión WebP
export function convertToWebp(url: string): string {
  if (!url) return url

  // Si ya es WebP, devolver la URL original
  if (url.endsWith(".webp")) return url

  // Si es una URL de placeholder, no convertir
  if (url.includes("placeholder.svg")) return url

  // Si es una URL externa, no convertir (necesitaríamos un proxy)
  if (url.startsWith("http") && !url.includes(process.env.NEXT_PUBLIC_VERCEL_URL || "")) {
    return url
  }

  // Convertir la URL a WebP
  // Esto asume que tenemos un endpoint de API que convierte imágenes a WebP
  return `/api/image-convert?url=${encodeURIComponent(url)}&format=webp`
}

// Convierte una URL de imagen a su versión AVIF
export function convertToAvif(url: string): string {
  if (!url) return url

  // Si ya es AVIF, devolver la URL original
  if (url.endsWith(".avif")) return url

  // Si es una URL de placeholder, no convertir
  if (url.includes("placeholder.svg")) return url

  // Si es una URL externa, no convertir (necesitaríamos un proxy)
  if (url.startsWith("http") && !url.includes(process.env.NEXT_PUBLIC_VERCEL_URL || "")) {
    return url
  }

  // Convertir la URL a AVIF
  // Esto asume que tenemos un endpoint de API que convierte imágenes a AVIF
  return `/api/image-convert?url=${encodeURIComponent(url)}&format=avif`
}

// Obtiene la mejor URL de imagen basada en el soporte del navegador
export function getBestImageUrl(url: string): string {
  if (!url) return url

  if (supportsAvif()) {
    return convertToAvif(url)
  } else if (supportsWebp()) {
    return convertToWebp(url)
  }

  return url
}

// Genera un placeholder de baja calidad para efecto blur-up
export function getBlurPlaceholder(alt: string, width = 20, height = 20): string {
  return `/placeholder.svg?height=${height}&width=${width}&query=${encodeURIComponent(alt)}`
}

// Optimiza el tamaño de la imagen según el contexto
export function getOptimizedImageUrl(url: string, width?: number, quality = 80): string {
  if (!url) return url

  // Si es una URL de placeholder, no optimizar
  if (url.includes("placeholder.svg")) return url

  // Si es una URL externa, no optimizar (necesitaríamos un proxy)
  if (url.startsWith("http") && !url.includes(process.env.NEXT_PUBLIC_VERCEL_URL || "")) {
    return url
  }

  // Optimizar la URL
  // Esto asume que tenemos un endpoint de API que optimiza imágenes
  let optimizedUrl = `/api/image-optimize?url=${encodeURIComponent(url)}&quality=${quality}`

  if (width) {
    optimizedUrl += `&width=${width}`
  }

  return optimizedUrl
}
