import { EmailTracking } from '@/components/features/email-tracking/email-tracking'

export const metadata = {
  title: 'Email Tracking | Sur Realista',
  description: 'Seguimiento de emails y campaigns'
}

export default function EmailTrackingPage() {
  return (
    <div className="min-h-screen">
      <EmailTracking />
    </div>
  )
}
