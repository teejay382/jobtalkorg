import React, { Component, ReactNode, Suspense } from 'react';
import LazyErrorDisplay from './LazyErrorDisplay.tsx';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Send error to an external logging service asynchronously
    setTimeout(() => {
      console.error('ErrorBoundary caught an error', error, errorInfo);
    }, 0);
  }

  shouldComponentUpdate(nextProps: Props, nextState: State) {
    // Only update if the error state changes
    return this.state.hasError !== nextState.hasError || this.state.error !== nextState.error;
  }

  render() {
    if (this.state.hasError) {
      return (
        <Suspense fallback={<div>Loading...</div>}>
          <LazyErrorDisplay error={this.state.error} />
        </Suspense>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
