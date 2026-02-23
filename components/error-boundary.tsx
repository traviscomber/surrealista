"use client"

import type React from "react"
import { Component, ReactNode } from "react"

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[v0] Error boundary caught error:", error)
    console.error("[v0] Error info:", errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="w-full h-screen flex items-center justify-center bg-red-50 p-4">
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
              <h1 className="text-2xl font-bold text-red-600 mb-4">Algo salió mal</h1>
              <p className="text-gray-600 mb-4">
                Ha ocurrido un error en la aplicación. Por favor, recarga la página para continuar.
              </p>
              <details className="text-left bg-gray-50 p-4 rounded text-sm text-gray-700 mb-4">
                <summary className="cursor-pointer font-semibold">Detalles del error</summary>
                <pre className="mt-2 overflow-auto text-xs">{this.state.error?.message}</pre>
              </details>
              <button
                onClick={() => window.location.reload()}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                Recargar página
              </button>
            </div>
          </div>
        )
      )
    }

    return this.props.children
  }
}
