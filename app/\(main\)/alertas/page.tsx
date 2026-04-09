import { SmartAlerts } from '@/components/features/smart-alerts/smart-alerts'

export const metadata = {
  title: 'Alertas Inteligentes | Sur Realista',
  description: 'Sistema de alertas y notificaciones'
}

export default function SmartAlertsPage() {
  return (
    <div className="min-h-screen">
      <SmartAlerts />
    </div>
  )
}
