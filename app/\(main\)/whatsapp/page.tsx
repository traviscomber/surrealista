import { WhatsAppIntegration } from '@/components/features/whatsapp-integration/whatsapp-integration'

export const metadata = {
  title: 'WhatsApp Business | Sur Realista',
  description: 'Integración con WhatsApp Business'
}

export default function WhatsAppPage() {
  return (
    <div className="min-h-screen">
      <WhatsAppIntegration />
    </div>
  )
}
