import { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class MobileErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          
          <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
          
          <p className="text-muted-foreground text-sm mb-6 max-w-xs">
            We encountered an unexpected error. Please try again or contact support if the problem persists.
          </p>

          <Button
            onClick={this.handleRetry}
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </Button>

          {process.env.NODE_ENV === 'development' && this.state.error && (
            <div className="mt-6 p-4 rounded-lg bg-muted text-left w-full max-w-sm overflow-auto">
              <p className="text-xs font-mono text-destructive">
                {this.state.error.message}
              </p>
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
