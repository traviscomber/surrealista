import { SocialMediaGenerator } from '@/components/features/social-media-generator/social-media-generator'

export const metadata = {
  title: 'Generador RRSS | Sur Realista',
  description: 'Generación automática de contenido para redes sociales'
}

export default function SocialMediaGeneratorPage() {
  return (
    <div className="min-h-screen">
      <SocialMediaGenerator />
    </div>
  )
}
