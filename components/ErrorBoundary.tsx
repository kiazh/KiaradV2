'use client'

import { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '64px 32px',
          textAlign: 'center',
          color: 'var(--muted)',
        }}>
          <p style={{ fontSize: '16px', marginBottom: '16px' }}>
            Something went wrong.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: 'none',
              border: '1px solid var(--border)',
              color: 'var(--fg)',
              padding: '8px 16px',
              cursor: 'pointer',
              fontSize: '14px',
              transition: 'border-color 0.15s ease',
            }}
            onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--muted)')}
            onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)')}
          >
            Refresh
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
