"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  Database,
  Key,
  Globe,
  Cookie,
  FileText,
  Activity,
} from "lucide-react"

interface DiagnosticTest {
  id: string
  name: string
  description: string
  status: "pending" | "running" | "success" | "error" | "warning"
  result?: string
  error?: string
  duration?: number
}

interface ConnectionStatus {
  isAuthenticated: boolean
  hasValidToken: boolean
  canAccessDrive: boolean
  folderCount: number
  lastSync: string | null
}

export default function ConnectionDiagnosticsPage() {
  const [tests, setTests] = useState<DiagnosticTest[]>([
    {
      id: "oauth-endpoint",
      name: "OAuth Endpoint",
      description: "Test OAuth authentication endpoint availability",
      status: "pending",
    },
    {
      id: "cookie-check",
      name: "Authentication Cookies",
      description: "Verify authentication cookies are present and valid",
      status: "pending",
    },
    {
      id: "drive-api",
      name: "Google Drive API",
      description: "Test connection to Google Drive API",
      status: "pending",
    },
    {
      id: "folder-access",
      name: "Folder Access",
      description: "Test access to the configured Google Drive folder",
      status: "pending",
    },
    {
      id: "permissions",
      name: "API Permissions",
      description: "Verify required Google Drive permissions",
      status: "pending",
    },
  ])

  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    isAuthenticated: false,
    hasValidToken: false,
    canAccessDrive: false,
    folderCount: 0,
    lastSync: null,
  })

  const [isRunning, setIsRunning] = useState(false)
  const [progress, setProgress] = useState(0)

  const runDiagnostics = async () => {
    setIsRunning(true)
    setProgress(0)

    const totalTests = tests.length
    let completedTests = 0

    for (const test of tests) {
      // Update test status to running
      setTests((prev) => prev.map((t) => (t.id === test.id ? { ...t, status: "running" } : t)))

      const startTime = Date.now()

      try {
        let result: any

        switch (test.id) {
          case "oauth-endpoint":
            result = await fetch("/api/diagnostics/google-drive?test=oauth")
            break
          case "cookie-check":
            result = await fetch("/api/diagnostics/google-drive?test=cookies")
            break
          case "drive-api":
            result = await fetch("/api/diagnostics/google-drive?test=api")
            break
          case "folder-access":
            result = await fetch("/api/diagnostics/google-drive?test=folder")
            break
          case "permissions":
            result = await fetch("/api/diagnostics/google-drive?test=permissions")
            break
        }

        const data = await result.json()
        const duration = Date.now() - startTime

        setTests((prev) =>
          prev.map((t) =>
            t.id === test.id
              ? {
                  ...t,
                  status: data.success ? "success" : "error",
                  result: data.message,
                  error: data.error,
                  duration,
                }
              : t,
          ),
        )
      } catch (error) {
        const duration = Date.now() - startTime
        setTests((prev) =>
          prev.map((t) =>
            t.id === test.id
              ? {
                  ...t,
                  status: "error",
                  error: error instanceof Error ? error.message : "Unknown error",
                  duration,
                }
              : t,
          ),
        )
      }

      completedTests++
      setProgress((completedTests / totalTests) * 100)

      // Small delay between tests
      await new Promise((resolve) => setTimeout(resolve, 500))
    }

    // Update connection status
    await updateConnectionStatus()
    setIsRunning(false)
  }

  const updateConnectionStatus = async () => {
    try {
      const response = await fetch("/api/diagnostics/google-drive?test=status")
      const data = await response.json()
      setConnectionStatus(data.status || connectionStatus)
    } catch (error) {
      console.error("Failed to update connection status:", error)
    }
  }

  const resetTests = () => {
    setTests((prev) =>
      prev.map((test) => ({
        ...test,
        status: "pending",
        result: undefined,
        error: undefined,
        duration: undefined,
      })),
    )
    setProgress(0)
  }

  const getStatusIcon = (status: DiagnosticTest["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />
      case "warning":
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
      case "running":
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
      default:
        return <div className="h-5 w-5 rounded-full bg-gray-300" />
    }
  }

  const getStatusBadge = (status: DiagnosticTest["status"]) => {
    switch (status) {
      case "success":
        return <Badge className="bg-green-500 text-white">Passed</Badge>
      case "error":
        return <Badge className="bg-red-500 text-white">Failed</Badge>
      case "warning":
        return <Badge className="bg-yellow-500 text-white">Warning</Badge>
      case "running":
        return <Badge className="bg-blue-500 text-white">Running</Badge>
      default:
        return <Badge variant="outline">Pending</Badge>
    }
  }

  useEffect(() => {
    updateConnectionStatus()
  }, [])

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Connection Diagnostics</h1>
          <p className="text-gray-600 mt-2">Comprehensive Google Drive connection testing and troubleshooting</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={resetTests} disabled={isRunning}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button onClick={runDiagnostics} disabled={isRunning}>
            {isRunning ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Activity className="h-4 w-4 mr-2" />}
            Run Diagnostics
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tests">Diagnostic Tests</TabsTrigger>
          <TabsTrigger value="manual">Manual Tests</TabsTrigger>
          <TabsTrigger value="logs">Connection Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Connection Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Connection Status
              </CardTitle>
              <CardDescription>Current Google Drive connection state</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div
                    className={`text-2xl font-bold ${connectionStatus.isAuthenticated ? "text-green-500" : "text-red-500"}`}
                  >
                    {connectionStatus.isAuthenticated ? "YES" : "NO"}
                  </div>
                  <div className="text-sm text-gray-600">Authenticated</div>
                </div>
                <div className="text-center">
                  <div
                    className={`text-2xl font-bold ${connectionStatus.hasValidToken ? "text-green-500" : "text-red-500"}`}
                  >
                    {connectionStatus.hasValidToken ? "YES" : "NO"}
                  </div>
                  <div className="text-sm text-gray-600">Valid Token</div>
                </div>
                <div className="text-center">
                  <div
                    className={`text-2xl font-bold ${connectionStatus.canAccessDrive ? "text-green-500" : "text-red-500"}`}
                  >
                    {connectionStatus.canAccessDrive ? "YES" : "NO"}
                  </div>
                  <div className="text-sm text-gray-600">Drive Access</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-500">{connectionStatus.folderCount}</div>
                  <div className="text-sm text-gray-600">Folders Found</div>
                </div>
              </div>

              {connectionStatus.lastSync && (
                <div className="text-sm text-gray-600">
                  Last successful sync: {new Date(connectionStatus.lastSync).toLocaleString()}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Progress */}
          {isRunning && (
            <Card>
              <CardHeader>
                <CardTitle>Diagnostic Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <Progress value={progress} className="w-full" />
                <p className="text-sm text-gray-600 mt-2">{Math.round(progress)}% complete</p>
              </CardContent>
            </Card>
          )}

          {/* Quick Results */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tests.map((test) => (
              <Card key={test.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(test.status)}
                      <span className="font-medium">{test.name}</span>
                    </div>
                    {getStatusBadge(test.status)}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{test.description}</p>
                  {test.result && <p className="text-sm text-green-600">{test.result}</p>}
                  {test.error && <p className="text-sm text-red-600">{test.error}</p>}
                  {test.duration && <p className="text-xs text-gray-500 mt-1">{test.duration}ms</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="tests" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Test Results</CardTitle>
              <CardDescription>Comprehensive diagnostic test results with detailed information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {tests.map((test, index) => (
                <div key={test.id}>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(test.status)}
                      <div>
                        <h3 className="font-medium">{test.name}</h3>
                        <p className="text-sm text-gray-600">{test.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(test.status)}
                      {test.duration && <p className="text-xs text-gray-500 mt-1">{test.duration}ms</p>}
                    </div>
                  </div>

                  {(test.result || test.error) && (
                    <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                      {test.result && (
                        <div className="text-sm text-green-700 mb-2">
                          <strong>Result:</strong> {test.result}
                        </div>
                      )}
                      {test.error && (
                        <div className="text-sm text-red-700">
                          <strong>Error:</strong> {test.error}
                        </div>
                      )}
                    </div>
                  )}

                  {index < tests.length - 1 && <Separator className="mt-4" />}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manual" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Manual Testing Tools</CardTitle>
              <CardDescription>Manual tools for testing specific connection components</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" className="h-20 flex-col gap-2 bg-transparent">
                  <Key className="h-6 w-6" />
                  Test OAuth Flow
                </Button>
                <Button variant="outline" className="h-20 flex-col gap-2 bg-transparent">
                  <Cookie className="h-6 w-6" />
                  Check Cookies
                </Button>
                <Button variant="outline" className="h-20 flex-col gap-2 bg-transparent">
                  <Globe className="h-6 w-6" />
                  Test API Endpoint
                </Button>
                <Button variant="outline" className="h-20 flex-col gap-2 bg-transparent">
                  <FileText className="h-6 w-6" />
                  List Folders
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Connection Logs</CardTitle>
              <CardDescription>Real-time connection logs and debugging information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm h-64 overflow-y-auto">
                <div>[{new Date().toISOString()}] Connection diagnostics initialized</div>
                <div>[{new Date().toISOString()}] Checking authentication status...</div>
                <div>[{new Date().toISOString()}] OAuth endpoint: /api/auth/google</div>
                <div>[{new Date().toISOString()}] Drive API endpoint: /api/drive/folders</div>
                <div>[{new Date().toISOString()}] Target folder ID: 1wJRhFJNpIqoJ_O9FPIhpPglmypnwgt5F</div>
                <div>[{new Date().toISOString()}] Waiting for diagnostic tests...</div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
