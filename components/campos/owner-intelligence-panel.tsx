"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Database,
  Sparkles,
  ExternalLink,
  Copy,
  RefreshCw,
  SkipForward,
  CheckCheck,
  TrendingUp,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export interface OwnerCandidate {
  name: string
  type: "person" | "company"
  confidence: number
  reason: string
  source: string
  url?: string
  dateFound: string
}

export interface OwnerResearchLead {
  name: string
  type: "person" | "company"
  confidence: number
  reason: string
  source: string
  url?: string
  documentType?: string
  dateFound: string
}

export interface OwnerResearchQueue {
  status: "pending" | "evidence-found" | "confirmed" | "skipped"
  priorityScore: number
  priorityTier: "critical" | "high" | "medium" | "low"
  primaryRol: string | null
  searchQueries: string[]
  suggestedNextStep: string
  generatedAt: string
}

export interface OwnerIntelligencePanelProps {
  kmzId: string
  metadata?: {
    public_owner_candidate?: OwnerCandidate | null
    owner_research_leads?: OwnerResearchLead[]
    owner_research_queue?: OwnerResearchQueue
    confirmed_owner?: string | null
    cbr_document_url?: string | null
    owner_confidence?: number
    web_owner?: string | null
    web_owner_confidence?: number | null
    web_owner_evidence_url?: string | null
  }
  onRefresh?: (kmzId: string) => Promise<void>
  onConfirm?: (kmzId: string, ownerName: string) => Promise<void>
  onSkip?: (kmzId: string) => Promise<void>
}

export function OwnerIntelligencePanel({
  kmzId,
  metadata = {},
  onRefresh,
  onConfirm,
  onSkip,
}: OwnerIntelligencePanelProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const candidate = metadata.public_owner_candidate
  const leads = metadata.owner_research_leads || []
  const queue = metadata.owner_research_queue
  const isConfirmed = metadata.owner_confidence === 1.0
  const confidence = metadata.owner_confidence || 0

  // Determine status badge
  const getStatusBadge = () => {
    if (isConfirmed) {
      return <Badge className="bg-green-500/10 text-green-700">Confirmed</Badge>
    }
    if (queue?.status === "evidence-found") {
      return <Badge className="bg-blue-500/10 text-blue-700">Evidence Found</Badge>
    }
    if (queue?.status === "skipped") {
      return <Badge className="bg-gray-500/10 text-gray-700">Skipped</Badge>
    }
    return <Badge className="bg-yellow-500/10 text-yellow-700">Pending</Badge>
  }

  const getConfidenceColor = (conf: number) => {
    if (conf >= 0.9) return "text-green-600"
    if (conf >= 0.75) return "text-blue-600"
    if (conf >= 0.6) return "text-yellow-600"
    return "text-orange-600"
  }

  const handleRefresh = async () => {
    if (!onRefresh) return

    setIsRefreshing(true)
    try {
      await onRefresh(kmzId)
      toast({
        title: "Success",
        description: "Owner discovery refreshed",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh",
        variant: "destructive",
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleConfirm = async () => {
    if (!onConfirm || !candidate) return

    setIsLoading(true)
    try {
      await onConfirm(kmzId, candidate.name)
      toast({
        title: "Success",
        description: "Owner confirmed",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to confirm",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSkip = async () => {
    if (!onSkip) return

    setIsLoading(true)
    try {
      await onSkip(kmzId)
      toast({
        title: "Skipped",
        description: "KMZ marked as skipped",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to skip",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied",
      description: "Text copied to clipboard",
    })
  }

  return (
    <Card className="border-l-4 border-l-indigo-500">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-600" />
            <CardTitle>Owner Intelligence</CardTitle>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Current Candidate */}
        {candidate && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Current Candidate</h3>
            <div className="rounded-lg bg-slate-50 p-3 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-slate-900">{candidate.name}</p>
                  <p className="text-xs text-slate-500 capitalize">{candidate.type}</p>
                </div>
                <div className="flex items-center gap-1">
                  <span className={`text-sm font-semibold ${getConfidenceColor(confidence)}`}>
                    {(confidence * 100).toFixed(0)}%
                  </span>
                </div>
              </div>

              <Progress value={confidence * 100} className="h-2" />

              <p className="text-xs text-slate-600">{candidate.reason}</p>

              {candidate.url && (
                <a
                  href={candidate.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-indigo-600 hover:underline inline-flex items-center gap-1"
                >
                  View source <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
        )}

        {/* Confidence Meter */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Confidence Score</h3>
            <span className={`text-lg font-bold ${getConfidenceColor(confidence)}`}>
              {(confidence * 100).toFixed(1)}%
            </span>
          </div>
          <Progress value={confidence * 100} className="h-2" />
          <p className="text-xs text-slate-500">
            {confidence >= 0.9 && "High confidence - ready to confirm"}
            {confidence >= 0.75 && confidence < 0.9 && "Good confidence - consider confirming"}
            {confidence >= 0.6 && confidence < 0.75 && "Moderate confidence - needs validation"}
            {confidence >= 0.4 && confidence < 0.6 && "Low confidence - requires review"}
            {confidence < 0.4 && "Very low confidence - manual research needed"}
          </p>
        </div>

        {/* Evidence Count */}
        {leads.length > 0 && (
          <div className="flex items-center justify-between rounded-lg bg-blue-50 p-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-blue-900">{leads.length} source{leads.length !== 1 ? "s" : ""}</p>
                <p className="text-xs text-blue-700">Evidence found</p>
              </div>
            </div>
          </div>
        )}

        {/* Web Search Discovery */}
        {metadata.web_owner && (
          <div className="flex items-center justify-between rounded-lg bg-emerald-50 p-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <div>
                <p className="text-sm font-medium text-emerald-900">Web Search Discovery</p>
                <p className="text-xs text-emerald-700">{metadata.web_owner}</p>
                {metadata.web_owner_confidence && (
                  <p className="text-xs text-emerald-600">
                    Confianza: {Math.round(metadata.web_owner_confidence * 100)}%
                  </p>
                )}
              </div>
            </div>
            {metadata.web_owner_evidence_url && (
              <a
                href={metadata.web_owner_evidence_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-600 hover:text-emerald-700"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>
        )}

        {/* CBR Status */}
        {metadata.confirmed_owner && (
          <div className="flex items-center justify-between rounded-lg bg-green-50 p-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-900">CBR Confirmed</p>
                <p className="text-xs text-green-700">{metadata.confirmed_owner}</p>
              </div>
            </div>
            {metadata.cbr_document_url && (
              <a
                href={metadata.cbr_document_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-600 hover:text-green-700"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>
        )}

        {/* Research Leads Tabs */}
        {leads.length > 0 && (
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="all" className="flex-1">
                All ({leads.length})
              </TabsTrigger>
              <TabsTrigger value="high" className="flex-1">
                High Conf
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-2">
              <ScrollArea className="h-64 rounded-lg border p-2">
                <div className="space-y-2 pr-4">
                  {leads.map((lead, idx) => (
                    <div key={idx} className="border-l-2 border-l-indigo-300 pl-3 py-2 text-xs">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-slate-900">{lead.name}</p>
                          <p className="text-slate-600 line-clamp-2">{lead.reason}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {lead.source}
                            </Badge>
                            {lead.url && (
                              <button
                                onClick={() => copyToClipboard(lead.url || "")}
                                className="text-indigo-600 hover:text-indigo-700"
                              >
                                <Copy className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="text-right ml-2">
                          <p className={`font-bold ${getConfidenceColor(lead.confidence)}`}>
                            {(lead.confidence * 100).toFixed(0)}%
                          </p>
                          <p className="text-slate-400 text-xs">
                            {new Date(lead.dateFound).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="high">
              <ScrollArea className="h-64 rounded-lg border p-2">
                <div className="space-y-2 pr-4">
                  {leads
                    .filter((l) => l.confidence >= 0.75)
                    .map((lead, idx) => (
                      <div key={idx} className="border-l-2 border-l-green-300 pl-3 py-2 text-xs">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-slate-900">{lead.name}</p>
                            <p className="text-slate-600 line-clamp-2">{lead.reason}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {lead.source}
                              </Badge>
                            </div>
                          </div>
                          <p className="text-green-600 font-bold">
                            {(lead.confidence * 100).toFixed(0)}%
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        )}

        {/* Queue Status */}
        {queue && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-600 uppercase">Suggested Next Step</p>
            <div className="rounded-lg bg-indigo-50 p-3">
              <p className="text-sm text-indigo-900">{queue.suggestedNextStep}</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {!isConfirmed && (
          <div className="flex gap-2 pt-2">
            {candidate && (
              <Button
                onClick={handleConfirm}
                disabled={isLoading}
                className="flex-1 gap-2"
                variant="default"
              >
                <CheckCheck className="h-4 w-4" />
                Confirm
              </Button>
            )}

            <Button
              onClick={handleSkip}
              disabled={isLoading}
              className="flex-1 gap-2"
              variant="outline"
            >
              <SkipForward className="h-4 w-4" />
              Skip
            </Button>

            {onRefresh && (
              <Button
                onClick={handleRefresh}
                disabled={isRefreshing}
                size="sm"
                variant="outline"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              </Button>
            )}
          </div>
        )}

        {/* Empty State */}
        {!candidate && leads.length === 0 && (
          <div className="text-center py-6 space-y-2">
            <AlertCircle className="h-8 w-8 text-slate-400 mx-auto" />
            <p className="text-sm text-slate-600">No owner information discovered yet</p>
            {onRefresh && (
              <Button onClick={handleRefresh} disabled={isRefreshing} size="sm" variant="outline">
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
                Search Now
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
