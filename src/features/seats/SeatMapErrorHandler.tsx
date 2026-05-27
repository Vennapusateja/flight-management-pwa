'use client';

import React, { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

// A proper Error Boundary to catch render/hydration errors in the SeatMap
export class SeatMapErrorHandler extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error.message };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('SeatMap caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          className="mx-auto w-full max-w-md rounded-xl border border-red-800 bg-red-950/40 p-6 text-center text-sm text-red-300"
        >
          <p className="font-bold mb-2">Something went wrong rendering the seats:</p>
          <p className="font-mono text-xs text-red-400">{this.state.errorMessage}</p>
        </div>
      );
    }

    return this.props.children;
  }
}
