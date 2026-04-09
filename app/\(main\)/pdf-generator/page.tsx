import { PDFGenerator } from '@/components/features/pdf-generator/pdf-generator'

export const metadata = {
  title: 'Generador de PDFs | Sur Realista',
  description: 'Generación automática de fichas y reportes'
}

export default function PDFGeneratorPage() {
  return (
    <div className="min-h-screen">
      <PDFGenerator />
    </div>
  )
}
