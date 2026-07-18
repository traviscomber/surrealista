'use client'

import { useState, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import useSWR from 'swr'
import { Search, Download, Filter, Users } from 'lucide-react'

interface Owner {
  id: string
  file_name: string
  owner: string
  confidence: number
  source: string
  evidence_url?: string
  scraped_at: string
}

export function OwnerDiscoveryDashboard() {
  const [searchTerm, setSearchTerm] = useState('')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [confidenceFilter, setConfidenceFilter] = useState('all')
  const [pageSize, setPageSize] = useState(25)
  const [currentPage, setCurrentPage] = useState(1)

  const { data: owners, isLoading, error } = useSWR(
    '/api/admin/owners',
    async (url) => {
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to fetch owners')
      return res.json()
    },
    { revalidateOnFocus: false, revalidateOnReconnect: false }
  )

  const { data: stats } = useSWR(
    '/api/admin/owners/stats',
    async (url) => {
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to fetch stats')
      return res.json()
    }
  )

  // Filter and search
  const filteredOwners = useMemo(() => {
    if (!owners) return []

    return owners.filter((owner: Owner) => {
      const matchesSearch =
        owner.owner.toLowerCase().includes(searchTerm.toLowerCase()) ||
        owner.file_name.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesSource = sourceFilter === 'all' || owner.source === sourceFilter

      const matchesConfidence =
        confidenceFilter === 'all' ||
        (confidenceFilter === 'high' && owner.confidence >= 0.85) ||
        (confidenceFilter === 'medium' && owner.confidence >= 0.7 && owner.confidence < 0.85) ||
        (confidenceFilter === 'low' && owner.confidence < 0.7)

      return matchesSearch && matchesSource && matchesConfidence
    })
  }, [owners, searchTerm, sourceFilter, confidenceFilter])

  // Pagination
  const totalPages = Math.ceil(filteredOwners.length / pageSize)
  const paginatedOwners = filteredOwners.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  const handleExport = () => {
    const csv = [
      ['Property Name', 'Owner', 'Confidence', 'Source', 'Evidence URL', 'Discovered At'],
      ...filteredOwners.map((owner: Owner) => [
        owner.file_name,
        owner.owner,
        owner.confidence,
        owner.source,
        owner.evidence_url || '',
        new Date(owner.scraped_at).toLocaleDateString(),
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `owners-discovery-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="mb-4">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Owner Discovery</h1>
        <p className="text-muted-foreground mt-2">
          Manage {owners?.length || 0} discovered property owners via web search
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Owners
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground mt-1">Web search discovered</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                High Confidence
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.high_confidence}</div>
              <p className="text-xs text-muted-foreground mt-1">≥ 0.85 confidence</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Companies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.companies}</div>
              <p className="text-xs text-muted-foreground mt-1">vs individuals</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Coverage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.total > 0 ? ((stats.total / 2344) * 100).toFixed(1) : 0}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">of 2,344 KMZ</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters & Search */}
      <div className="space-y-4">
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <label className="text-sm font-medium mb-1 block">Search</label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search owners or properties..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setCurrentPage(1)
                }}
                className="pl-8"
              />
            </div>
          </div>

          <div className="w-48">
            <label className="text-sm font-medium mb-1 block">Source</label>
            <Select value={sourceFilter} onValueChange={(v) => setSourceFilter(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="web_search">Web Search</SelectItem>
                <SelectItem value="research">Manual Research</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="w-48">
            <label className="text-sm font-medium mb-1 block">Confidence</label>
            <Select value={confidenceFilter} onValueChange={(v) => setConfidenceFilter(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Confidence</SelectItem>
                <SelectItem value="high">High (≥0.85)</SelectItem>
                <SelectItem value="medium">Medium (0.7-0.85)</SelectItem>
                <SelectItem value="low">Low (&lt;0.7)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleExport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        <div className="text-sm text-muted-foreground">
          Showing {paginatedOwners.length} of {filteredOwners.length} results
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Property Name</TableHead>
                  <TableHead>Owner Name</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Evidence</TableHead>
                  <TableHead>Discovered</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedOwners.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No owners found matching filters
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedOwners.map((owner: Owner) => (
                    <TableRow key={owner.id}>
                      <TableCell className="font-medium max-w-xs truncate">
                        {owner.file_name}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{owner.owner}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            owner.confidence >= 0.85
                              ? 'default'
                              : owner.confidence >= 0.7
                                ? 'secondary'
                                : 'outline'
                          }
                        >
                          {(owner.confidence * 100).toFixed(0)}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{owner.source}</TableCell>
                      <TableCell>
                        {owner.evidence_url ? (
                          <a
                            href={owner.evidence_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline text-sm"
                          >
                            View
                          </a>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(owner.scraped_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
