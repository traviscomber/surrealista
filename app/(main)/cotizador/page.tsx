import { QuotationForm } from "@/components/quotation/quotation-form"

export default function QuotationPage() {
  return (
    <div className="min-h-screen bg-background py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-primary mb-6">
            Cotizador Inteligente
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
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
