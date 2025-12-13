import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-gray-900/50 backdrop-blur border border-[#00ffa3]/20 rounded-lg p-8">
            <div className="text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <h1 className="text-2xl font-bold text-[#00ffa3] mb-4">
                System Error Detected
              </h1>
              <p className="text-gray-400 mb-6">
                The application encountered an unexpected error. This has been logged
                for investigation.
              </p>

              {this.state.error && (
                <div className="bg-gray-950/50 border border-red-500/20 rounded p-4 mb-6 text-left">
                  <p className="text-red-400 font-mono text-sm mb-2">
                    <strong>Error:</strong> {this.state.error.message}
                  </p>
                  {this.state.error.stack && (
                    <pre className="text-xs text-gray-500 overflow-auto max-h-32">
                      {this.state.error.stack}
                    </pre>
                  )}
                </div>
              )}

              <div className="flex gap-4 justify-center">
                <button
                  onClick={this.handleReset}
                  className="px-6 py-2 bg-[#00ffa3]/10 hover:bg-[#00ffa3]/20 border border-[#00ffa3]/30 text-[#00ffa3] rounded transition-colors"
                >
                  Try Again
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="px-6 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-600 text-gray-300 rounded transition-colors"
                >
                  Reload Application
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
