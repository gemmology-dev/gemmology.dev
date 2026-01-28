/**
 * Error boundary and error display components for quiz failures.
 */

import { Component, type ReactNode } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { IconBox } from '../ui/IconBox';

// ============================================================================
// Error Display Component (functional)
// ============================================================================

interface QuizErrorProps {
  /** Error title */
  title?: string;
  /** Error message to display */
  message?: string;
  /** Callback to retry loading */
  onRetry?: () => void;
  /** Callback to go back/reset */
  onBack?: () => void;
  /** Additional class names */
  className?: string;
}

/**
 * Displays a user-friendly error message with retry option.
 */
export function QuizError({
  title = 'Unable to load questions',
  message = 'Please check your connection and try again.',
  onRetry,
  onBack,
  className,
}: QuizErrorProps) {
  return (
    <Card padding="lg" className={className}>
      <div className="text-center">
        <IconBox variant="ruby" size="lg" className="mx-auto mb-4">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </IconBox>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
        <p className="text-slate-600 mb-6">{message}</p>
        <div className="flex items-center justify-center gap-3">
          {onBack && (
            <Button variant="ghost" onClick={onBack}>
              Go back
            </Button>
          )}
          {onRetry && (
            <Button onClick={onRetry}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Try again
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

// ============================================================================
// Network Error Component
// ============================================================================

interface NetworkErrorProps {
  onRetry?: () => void;
  className?: string;
}

/**
 * Specific error display for network failures.
 */
export function NetworkError({ onRetry, className }: NetworkErrorProps) {
  return (
    <QuizError
      title="Connection lost"
      message="We couldn't connect to the server. Check your internet connection and try again."
      onRetry={onRetry}
      className={className}
    />
  );
}

// ============================================================================
// No Questions Error Component
// ============================================================================

interface NoQuestionsErrorProps {
  onBack?: () => void;
  className?: string;
}

/**
 * Error display when no questions match the selected criteria.
 */
export function NoQuestionsError({ onBack, className }: NoQuestionsErrorProps) {
  return (
    <Card padding="lg" className={className}>
      <div className="text-center">
        <IconBox variant="slate" size="lg" className="mx-auto mb-4">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </IconBox>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">No questions found</h3>
        <p className="text-slate-600 mb-6">
          No questions match your selected categories and difficulty.
          Try selecting different options.
        </p>
        {onBack && (
          <Button variant="secondary" onClick={onBack}>
            Change settings
          </Button>
        )}
      </div>
    </Card>
  );
}

// ============================================================================
// Error Boundary Class Component
// ============================================================================

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Callback when an error occurs */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  /** Custom fallback component */
  fallback?: ReactNode;
  /** Callback to retry (resets error state) */
  onRetry?: () => void;
  /** Callback to go back */
  onBack?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * React Error Boundary for quiz components.
 * Catches JavaScript errors in child components and displays a fallback UI.
 */
export class QuizErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Quiz error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    this.props.onRetry?.();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <QuizError
          title="Something went wrong"
          message="An unexpected error occurred. Please try again."
          onRetry={this.handleRetry}
          onBack={this.props.onBack}
        />
      );
    }

    return this.props.children;
  }
}
