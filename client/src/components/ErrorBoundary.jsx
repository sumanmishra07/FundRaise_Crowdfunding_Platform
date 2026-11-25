import { Component } from 'react';

// Shows a readable message instead of a blank screen if any component crashes.
export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('FundRaise UI error:', error, info?.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div style={{ maxWidth: 560, margin: '12vh auto', padding: 24, fontFamily: 'system-ui, sans-serif' }}>
        <h1 style={{ color: '#0c3b3a' }}>Something went wrong</h1>
        <p style={{ color: '#587070' }}>The page hit an unexpected error. Reload to try again.</p>
        <pre style={{ background: '#fdecea', color: '#b42318', padding: 12, borderRadius: 10, whiteSpace: 'pre-wrap' }}>
          {String(this.state.error?.message || this.state.error)}
        </pre>
        <button
          onClick={() => window.location.reload()}
          style={{ padding: '12px 20px', borderRadius: 12, border: 0, background: '#ffb020', color: '#0c3b3a', fontWeight: 700, cursor: 'pointer' }}
        >
          Reload page
        </button>
      </div>
    );
  }
}
