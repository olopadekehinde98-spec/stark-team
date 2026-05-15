'use client'
import { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  crashed: boolean
  error:   Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { crashed: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { crashed: true, error }
  }

  componentDidCatch(error: Error) {
    // Dispatch to ErrorMonitorAgent via custom event
    window.dispatchEvent(new CustomEvent('app-render-error', {
      detail: {
        message: error.message,
        stack:   error.stack,
        url:     window.location.pathname,
      },
    }))
  }

  handleReset = () => {
    this.setState({ crashed: false, error: null })
  }

  render() {
    if (!this.state.crashed) return this.props.children

    if (this.props.fallback) return this.props.fallback

    return (
      <div style={{
        minHeight:      '60vh',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        padding:        24,
        fontFamily:     'Outfit, system-ui, sans-serif',
      }}>
        <div style={{
          background:   '#FEF2F2',
          border:       '1px solid #FCA5A5',
          borderRadius: 16,
          padding:      '36px 28px',
          maxWidth:     420,
          width:        '100%',
          textAlign:    'center',
        }}>
          <div style={{ fontSize: 44, marginBottom: 14 }}>⚠️</div>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>
            Something went wrong
          </div>
          <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.6, marginBottom: 6 }}>
            {this.state.error?.message ?? 'An unexpected render error occurred.'}
          </div>
          <div style={{ fontSize: 12, color: '#94A3B8', marginBottom: 22 }}>
            The AI Error Monitor has been notified.
          </div>
          <button
            onClick={this.handleReset}
            style={{
              padding:      '9px 22px',
              borderRadius: 8,
              fontSize:     13,
              fontWeight:   700,
              background:   '#0F1C2E',
              color:        '#fff',
              border:       'none',
              cursor:       'pointer',
            }}>
            Try again
          </button>
        </div>
      </div>
    )
  }
}
