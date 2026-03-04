'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Search, Filter, X } from 'lucide-react'

export function OpportunitiesFiltersBar() {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFilters, setSelectedFilters] = useState<string[]>([])

  const STATUS_OPTIONS = ['active', 'pending', 'closed', 'under_review']
  const STAGE_OPTIONS = ['lead', 'prospect', 'negotiation', 'contract', 'closing']
  const PRIORITY_OPTIONS = ['low', 'medium', 'high', 'critical']

  const handleToggleFilter = (filter: string) => {
    setSelectedFilters((prev) =>
      prev.includes(filter) ? prev.filter((f) => f !== filter) : [...prev, filter]
    )
  }

  const clearFilters = () => {
    setSelectedFilters([])
    setSearchTerm('')
  }

  return (
    <div className="space-y-4">
      {/* Search and Filter Bar */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search opportunities by title, location, or property..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          variant={isOpen ? 'default' : 'outline'}
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
        >
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      {/* Active Filters */}
      {selectedFilters.length > 0 && (
        <div className="flex gap-2 flex-wrap items-center">
          {selectedFilters.map((filter) => (
            <Badge
              key={filter}
              variant="secondary"
              className="flex items-center gap-1 cursor-pointer hover:bg-secondary/80"
              onClick={() => handleToggleFilter(filter)}
            >
              {filter}
              <X className="h-3 w-3" />
            </Badge>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-xs text-muted-foreground"
          >
            Clear all
          </Button>
        </div>
      )}

      {/* Expandable Filter Panel */}
      {isOpen && (
        <Card className="p-4 space-y-4">
          <div>
            <h4 className="font-medium mb-2 text-sm">Status</h4>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((status) => (
                <Badge
                  key={status}
                  variant={selectedFilters.includes(status) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => handleToggleFilter(status)}
                >
                  {status}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2 text-sm">Pipeline Stage</h4>
            <div className="flex flex-wrap gap-2">
              {STAGE_OPTIONS.map((stage) => (
                <Badge
                  key={stage}
                  variant={selectedFilters.includes(stage) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => handleToggleFilter(stage)}
                >
                  {stage}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2 text-sm">Priority</h4>
            <div className="flex flex-wrap gap-2">
              {PRIORITY_OPTIONS.map((priority) => (
                <Badge
                  key={priority}
                  variant={selectedFilters.includes(priority) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => handleToggleFilter(priority)}
                >
                  {priority}
                </Badge>
              ))}
            </div>
          </div>

          <Button onClick={() => setIsOpen(false)} className="w-full">
            Apply Filters
          </Button>
        </Card>
      )}
    </div>
  )
}
