'use client'

import React from 'react'
import * as Sentry from '@sentry/nextjs'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'

interface ErrorBoundaryProps {
  children: React.ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

class ErrorBoundaryComponent extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
      },
    })
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="max-w-md w-full bg-card rounded-lg border border-destructive p-8 text-center">
            <div className="flex justify-center mb-4">
              <AlertCircle className="w-12 h-12 text-destructive" />
            </div>
            <h1 className="text-2xl font-bold mb-2 text-foreground">Algo salió mal</h1>
            <p className="text-muted-foreground mb-6">
              Un error inesperado ocurrió. El equipo técnico ha sido notificado.
            </p>
            <Button
              onClick={this.handleReset}
              variant="outline"
              className="w-full"
            >
              Intentar de nuevo
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export const ErrorBoundary = Sentry.withErrorBoundary(ErrorBoundaryComponent, {
  fallback: (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full bg-card rounded-lg border p-8 text-center">
        <h1 className="text-2xl font-bold mb-2 text-foreground">Error crítico</h1>
        <p className="text-muted-foreground">Por favor, recarga la página.</p>
      </div>
    </div>
  ),
})
