import { CompanyInfo } from "@/components/about/company-info"
import { TeamSection } from "@/components/about/team-section"

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
            Sobre Sur-Realista
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Somos la inmobiliaria líder en el sur de Chile, combinando experiencia local con tecnología de vanguardia
            para ofrecer el mejor servicio inmobiliario.
          </p>
        </div>

        <CompanyInfo />
        <TeamSection />
      </div>
    </div>
  )
}
