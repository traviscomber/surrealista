import { AICapabilities } from "@/components/ai-features/ai-capabilities"
import { AIPracticalExamples } from "@/components/ai-features/ai-practical-examples"
import { AIBenefits } from "@/components/ai-features/ai-benefits"
import { AIRoadmap } from "@/components/ai-features/ai-roadmap"
import { AICaseStudies } from "@/components/ai-features/ai-case-studies"
import { AITechnicalDetails } from "@/components/ai-features/ai-technical-details"
import { AIImplementationDetails } from "@/components/ai-features/ai-implementation-details"
import { AIFAQ } from "@/components/ai-features/ai-faq"

export default function AITechnologyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
            Tecnología IA Avanzada
          </h1>
          <p className="text-xl text-gray-600 max-w-4xl mx-auto">
            Descubre cómo nuestra inteligencia artificial revoluciona el mercado inmobiliario del sur de Chile con
            análisis predictivos, valoraciones precisas y recomendaciones personalizadas.
          </p>
        </div>

        <div className="space-y-20">
          <AICapabilities />
          <AIPracticalExamples />
          <AIBenefits />
          <AIImplementationDetails />
          <AITechnicalDetails />
          <AICaseStudies />
          <AIRoadmap />
          <AIFAQ />
        </div>
      </div>
    </div>
  )
}
