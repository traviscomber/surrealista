"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, Maximize2, ExternalLink, ImageOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { SimpleImage } from "@/components/ui/simple-image"

interface PropertyGalleryProps {
  images: Array<{ id: string; url: string; is_main: boolean }>
  sourceUrl?: string
}

export function PropertyGallery({ images, sourceUrl }: PropertyGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const galleryImages = (images || []).filter((image) => Boolean(image?.url))
  const hasImages = galleryImages.length > 0

  const handlePrevious = () => {
    if (!hasImages) return
    setCurrentIndex((prev) => (prev === 0 ? galleryImages.length - 1 : prev - 1))
  }

  const handleNext = () => {
    if (!hasImages) return
    setCurrentIndex((prev) => (prev === galleryImages.length - 1 ? 0 : prev + 1))
  }

  if (!hasImages) {
    return (
      <div className="mb-8 overflow-hidden rounded-md border bg-muted/30">
        <div className="flex aspect-video flex-col items-center justify-center gap-3 px-6 text-center text-muted-foreground">
          <ImageOff className="h-7 w-7" aria-hidden="true" />
          <div>
            <p className="font-medium text-foreground">Imagen no disponible</p>
            <p className="mt-1 text-sm">La fuente de esta propiedad no entregó imágenes utilizables.</p>
          </div>
          {sourceUrl ? (
            <Button variant="outline" size="sm" asChild>
              <a href={sourceUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Abrir fuente original
              </a>
            </Button>
          ) : null}
        </div>
      </div>
    )
  }

  const currentImage = galleryImages[Math.min(currentIndex, galleryImages.length - 1)]

  return (
    <div className="mb-8">
      <div className="relative overflow-hidden rounded-md border">
        <div className="aspect-video">
          <SimpleImage
            src={currentImage.url}
            alt={`Imagen ${currentIndex + 1} de la propiedad`}
            className="h-full w-full object-cover"
          />
        </div>

        {galleryImages.length > 1 ? (
          <>
            <Button variant="secondary" size="icon" className="absolute left-2 top-1/2 -translate-y-1/2" onClick={handlePrevious} aria-label="Imagen anterior">
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button variant="secondary" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2" onClick={handleNext} aria-label="Imagen siguiente">
              <ChevronRight className="h-5 w-5" />
            </Button>
          </>
        ) : null}

        <Button variant="secondary" size="icon" className="absolute right-2 top-2" onClick={() => setIsFullscreen(true)} aria-label="Ampliar imagen">
          <Maximize2 className="h-5 w-5" />
        </Button>

        {sourceUrl ? (
          <Button variant="secondary" size="sm" className="absolute left-2 top-2" asChild>
            <a href={sourceUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-1 h-4 w-4" />
              Abrir fuente
            </a>
          </Button>
        ) : null}
      </div>

      {galleryImages.length > 1 ? (
        <div className="mt-2 grid grid-cols-5 gap-2">
          {galleryImages.slice(0, 5).map((image, index) => (
            <button
              key={image.id}
              type="button"
              className={`aspect-[3/2] overflow-hidden rounded-md border ${index === currentIndex ? "border-primary" : "border-border"}`}
              onClick={() => setCurrentIndex(index)}
              aria-label={`Ver imagen ${index + 1}`}
            >
              <SimpleImage src={image.url} alt={`Miniatura ${index + 1} de la propiedad`} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      ) : null}

      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className="max-w-screen-xl bg-background p-0">
          <div className="relative flex h-[90vh] items-center justify-center bg-muted/30">
            <SimpleImage src={currentImage.url} alt={`Imagen ${currentIndex + 1} ampliada`} className="max-h-full max-w-full object-contain" />

            {galleryImages.length > 1 ? (
              <>
                <Button variant="secondary" size="icon" className="absolute left-4 top-1/2 -translate-y-1/2" onClick={handlePrevious} aria-label="Imagen anterior">
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button variant="secondary" size="icon" className="absolute right-4 top-1/2 -translate-y-1/2" onClick={handleNext} aria-label="Imagen siguiente">
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </>
            ) : null}

            {sourceUrl ? (
              <Button variant="secondary" size="sm" className="absolute left-4 top-4" asChild>
                <a href={sourceUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-1 h-4 w-4" />
                  Abrir fuente
                </a>
              </Button>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
