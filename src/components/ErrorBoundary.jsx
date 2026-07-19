import { Component } from 'react';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[HackJudge] Uncaught error:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', padding: 40,
          background: 'var(--bg)', color: 'var(--ink)', fontFamily: 'var(--font-body)',
          gap: 16, textAlign: 'center'
        }}>
          <div style={{ fontSize: 48 }}>⚠️</div>
          <h2 style={{ fontSize: 24, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--ink)' }}>
            Something went wrong
          </h2>
          <p style={{ fontSize: 14, color: 'var(--muted)', maxWidth: 500, lineHeight: 1.6 }}>
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <div style={{
            background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 8,
            padding: '12px 16px', maxWidth: 640, width: '100%', textAlign: 'left',
            fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted)', overflowX: 'auto'
          }}>
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {this.state.error?.stack?.split('\n').slice(0, 8).join('\n')}
            </pre>
          </div>
          <button
            onClick={() => { this.setState({ error: null }); window.location.hash = ''; }}
            style={{
              background: 'var(--ink)', color: 'var(--bg)', border: 'none', borderRadius: 99,
              padding: '12px 28px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
              fontFamily: 'var(--font-body)'
            }}
          >
            Back to Home
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
