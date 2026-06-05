'use client'

import { Button } from '@/components/ui/button'
import { FileDown, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { downloadPropertySheet } from '@/lib/pdf/property-pdf-generator'

interface DownloadPropertyButtonProps {
  propertyData: any
  propertyName: string
  variant?: 'default' | 'outline' | 'ghost' | 'secondary'
  size?: 'default' | 'sm' | 'lg'
  className?: string
}

export function DownloadPropertyButton({
  propertyData,
  propertyName,
  variant = 'outline',
  size = 'sm',
  className = '',
}: DownloadPropertyButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleDownload = async () => {
    setLoading(true)
    try {
      // Use HTML as default since PDF requires external library
      downloadPropertySheet(propertyData, propertyName, 'html')
    } catch (error) {
      console.error('Error downloading property sheet:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleDownload}
      disabled={loading}
      className={className}
      title="Descargar ficha de propiedad"
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Descargando...
        </>
      ) : (
        <>
          <FileDown className="w-4 h-4 mr-2" />
          Descargar Ficha
        </>
      )}
    </Button>
  )
}
