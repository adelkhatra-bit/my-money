import React from 'react';
import FatalErrorScreen from '../FatalErrorScreen/FatalErrorScreen';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('❌ [ErrorBoundary] FATAL ERROR CAUGHT:', error, errorInfo);
    console.error('❌ [ErrorBoundary] Error message:', error?.message);
    console.error('❌ [ErrorBoundary] Error stack:', error?.stack);
    console.error('❌ [ErrorBoundary] Component stack:', errorInfo?.componentStack);

    this.setState({
      error,
      errorInfo
    });

    if (typeof window !== 'undefined' && window.onerror) {
      window.onerror(
        error?.message || 'Unknown error',
        'ErrorBoundary',
        0,
        0,
        error
      );
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <FatalErrorScreen
          error={this.state.error}
          errorInfo={this.state.errorInfo}
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
