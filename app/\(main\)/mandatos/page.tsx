import { MandatosContratos } from '@/components/features/mandatos-contratos/mandatos-contratos'

export const metadata = {
  title: 'Mandatos y Contratos | Sur Realista',
  description: 'Gestión de mandatos y contratos digitales'
}

export default function MandatosPage() {
  return (
    <div className="min-h-screen">
      <MandatosContratos />
    </div>
  )
}
