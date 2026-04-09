import { PipelineKanban } from '@/components/features/pipeline-kanban/pipeline-kanban'

export const metadata = {
  title: 'Pipeline | Sur Realista',
  description: 'Kanban pipeline de ventas'
}

export default function PipelinePage() {
  return (
    <div className="min-h-screen">
      <PipelineKanban />
    </div>
  )
}
