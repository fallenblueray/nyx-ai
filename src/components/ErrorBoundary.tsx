'use client'

import { Component, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[200px] p-6 bg-slate-900 rounded-lg border border-red-900/50">
          <AlertTriangle className="w-10 h-10 text-red-500 mb-4" />
          <h2 className="text-lg font-semibold text-white mb-2">發生錯誤</h2>
          <p className="text-slate-400 text-sm mb-4 text-center">
            {this.state.error?.message || '請刷新頁面重試'}
          </p>
          <div className="flex gap-2">
            <Button
              onClick={this.handleReset}
              variant="outline"
              size="sm"
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              重試
            </Button>
            <Button
              onClick={() => window.location.reload()}
              variant="default"
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
            >
              刷新頁面
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
