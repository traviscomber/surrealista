import { AdvancedGeoSearch } from '@/components/features/advanced-geo-search/advanced-geo-search'

export const metadata = {
  title: 'Búsqueda Avanzada | Sur Realista',
  description: 'Búsqueda geográfica avanzada'
}

export default function AdvancedSearchPage() {
  return (
    <div className="min-h-screen">
      <AdvancedGeoSearch />
    </div>
  )
}
