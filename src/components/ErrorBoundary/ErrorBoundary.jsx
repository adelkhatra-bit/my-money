import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('❌ [ErrorBoundary] Erreur capturée:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '40px',
          textAlign: 'center',
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
          minHeight: '100vh',
          color: '#fff',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <h1 style={{ fontSize: '48px', marginBottom: '20px' }}>⚠️</h1>
          <h2 style={{ fontSize: '24px', marginBottom: '20px' }}>
            Une erreur est survenue
          </h2>
          <p style={{ fontSize: '16px', marginBottom: '30px', opacity: 0.8 }}>
            L'application a rencontré un problème technique.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              background: '#00ff88',
              color: '#000',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Recharger la page
          </button>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details style={{
              marginTop: '30px',
              padding: '20px',
              background: 'rgba(255, 0, 0, 0.1)',
              borderRadius: '8px',
              textAlign: 'left',
              maxWidth: '800px',
              width: '100%'
            }}>
              <summary style={{ cursor: 'pointer', marginBottom: '10px', fontWeight: 'bold' }}>
                Détails techniques (développement)
              </summary>
              <pre style={{
                fontSize: '12px',
                overflow: 'auto',
                whiteSpace: 'pre-wrap',
                wordWrap: 'break-word'
              }}>
                {this.state.error.toString()}
                {this.state.errorInfo && this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
