"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, Maximize2, ExternalLink } from "lucide-react"
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

  // If no images, use a placeholder
  const galleryImages =
    images?.length > 0 ? images : [{ id: "placeholder", url: "/placeholder.svg?key=m9xt9", is_main: true }]

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? galleryImages.length - 1 : prev - 1))
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === galleryImages.length - 1 ? 0 : prev + 1))
  }

  // Generate a placeholder based on the current image
  const getPlaceholder = (index: number) => {
    return `/placeholder.svg?height=400&width=600&query=property image ${index + 1}`
  }

  return (
    <div className="mb-8">
      <div className="relative rounded-lg overflow-hidden border border-gray-200">
        <div className="aspect-w-16 aspect-h-9">
          <SimpleImage
            src={galleryImages[currentIndex].url}
            alt={`Property image ${currentIndex + 1}`}
            className="w-full h-full object-cover"
            fallbackSrc={getPlaceholder(currentIndex)}
          />
        </div>

        <Button
          variant="outline"
          size="icon"
          className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white"
          onClick={handlePrevious}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white"
          onClick={handleNext}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          className="absolute right-2 top-2 bg-white/80 hover:bg-white"
          onClick={() => setIsFullscreen(true)}
        >
          <Maximize2 className="h-5 w-5" />
        </Button>

        {sourceUrl && (
          <Button variant="outline" size="sm" className="absolute left-2 top-2 bg-white/80 hover:bg-white" asChild>
            <a href={sourceUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-1" />
              Ver Original
            </a>
          </Button>
        )}
      </div>

      {/* Thumbnails */}
      {galleryImages.length > 1 && (
        <div className="grid grid-cols-5 gap-2 mt-2">
          {galleryImages.slice(0, 5).map((image, index) => (
            <div
              key={image.id}
              className={`aspect-w-3 aspect-h-2 rounded-md overflow-hidden cursor-pointer border ${
                index === currentIndex ? "border-primary" : "border-gray-200"
              }`}
              onClick={() => setCurrentIndex(index)}
            >
              <SimpleImage
                src={image.url}
                alt={`Property thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
                fallbackSrc={getPlaceholder(index)}
              />
            </div>
          ))}
        </div>
      )}

      {/* Fullscreen dialog */}
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className="max-w-screen-xl p-0 bg-black">
          <div className="relative h-screen flex items-center justify-center">
            <SimpleImage
              src={galleryImages[currentIndex].url}
              alt={`Property image ${currentIndex + 1}`}
              className="max-h-full max-w-full object-contain"
              fallbackSrc={getPlaceholder(currentIndex)}
            />

            <Button
              variant="outline"
              size="icon"
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40"
              onClick={() => {
                handlePrevious()
              }}
            >
              <ChevronLeft className="h-8 w-8" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40"
              onClick={() => {
                handleNext()
              }}
            >
              <ChevronRight className="h-8 w-8" />
            </Button>

            {sourceUrl && (
              <Button
                variant="outline"
                size="sm"
                className="absolute top-4 left-4 bg-white/20 hover:bg-white/40"
                asChild
              >
                <a href={sourceUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Ver en Sitio Original
                </a>
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
