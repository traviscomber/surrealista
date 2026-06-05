import { redirect } from 'next/navigation'

export default function CotizadorLayout({ children }: { children: React.ReactNode }) {
  redirect('/(main)/cotizador')
}
