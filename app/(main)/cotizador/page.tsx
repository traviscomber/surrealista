import { QuotationForm } from "@/components/quotation/quotation-form"

export default function QuotationPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
            Cotizador Inteligente
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Obtén una cotización precisa de tu propiedad utilizando nuestra tecnología de IA avanzada. Análisis completo
            en minutos.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <QuotationForm />
        </div>
      </div>
    </div>
  )
}
