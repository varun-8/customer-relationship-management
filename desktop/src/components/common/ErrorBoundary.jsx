import React from 'react';
import { AlertOctagon, RotateCcw, Home, Terminal } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Unhandled React Error Boundary caught exception:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#F8FAFC',
            padding: '24px',
            fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
          }}
        >
          <div
            style={{
              maxWidth: '560px',
              width: '100%',
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              border: '1.5px solid #FECDD3',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)',
              padding: '32px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '18px',
                backgroundColor: '#FEE2E2',
                color: '#DC2626',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '18px',
              }}
            >
              <AlertOctagon size={32} />
            </div>

            <h1 style={{ fontSize: '20px', fontWeight: '800', color: '#0F172A', margin: '0 0 8px' }}>
              Something went unexpected
            </h1>

            <p style={{ fontSize: '13.5px', color: '#64748B', margin: '0 0 20px', lineHeight: '1.5' }}>
              The application encountered an unexpected runtime error. Your saved data in the database is safe.
            </p>

            {this.state.error && (
              <div
                style={{
                  backgroundColor: '#FFF1F2',
                  border: '1px solid #FFE4E6',
                  borderRadius: '10px',
                  padding: '12px',
                  fontSize: '12.5px',
                  fontWeight: '700',
                  color: '#BE123C',
                  textAlign: 'left',
                  marginBottom: '20px',
                  wordBreak: 'break-word',
                }}
              >
                {this.state.error.toString()}
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={this.handleReset}
                style={{
                  padding: '10px 18px',
                  borderRadius: '10px',
                  backgroundColor: '#2563EB',
                  color: '#FFFFFF',
                  fontSize: '13px',
                  fontWeight: '800',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <RotateCcw size={15} />
                <span>Try Again</span>
              </button>

              <button
                type="button"
                onClick={this.handleReload}
                style={{
                  padding: '10px 18px',
                  borderRadius: '10px',
                  backgroundColor: '#FFFFFF',
                  color: '#0F172A',
                  fontSize: '13px',
                  fontWeight: '700',
                  border: '1.5px solid #E2E8F0',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Home size={15} />
                <span>Reload App</span>
              </button>
            </div>

            {/* Collapsible Developer Trace */}
            {this.state.errorInfo && (
              <div style={{ marginTop: '24px', textAlign: 'left' }}>
                <button
                  type="button"
                  onClick={() => this.setState((prev) => ({ showDetails: !prev.showDetails }))}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#64748B',
                    fontSize: '11.5px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: 0,
                    margin: '0 auto',
                  }}
                >
                  <Terminal size={13} />
                  <span>{this.state.showDetails ? 'Hide Technical Details' : 'Show Technical Details'}</span>
                </button>

                {this.state.showDetails && (
                  <pre
                    style={{
                      marginTop: '10px',
                      padding: '12px',
                      backgroundColor: '#0F172A',
                      color: '#E2E8F0',
                      borderRadius: '8px',
                      fontSize: '11px',
                      overflowX: 'auto',
                      maxHeight: '160px',
                      lineHeight: '1.4',
                    }}
                  >
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
