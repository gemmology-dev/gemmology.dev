import { clsx } from 'clsx';

/**
 * Normalize SVG dimensions for responsive display.
 * Removes fixed width/height and adds responsive styling.
 */
function normalizeSvgForDisplay(svg: string): string {
  // Remove fixed width/height attributes from the root SVG element
  // This allows CSS to control sizing while viewBox handles aspect ratio
  return svg
    .replace(/<svg([^>]*)\s+width="[^"]*"/gi, '<svg$1')
    .replace(/<svg([^>]*)\s+height="[^"]*"/gi, '<svg$1');
}

interface CDLPreviewProps {
  svgContent: string | null;
  loading?: boolean;
  error?: string | null;
  className?: string;
  /** Re-run the render request — surfaced as a Retry button in the error state. */
  onRetry?: () => void;
}

export function CDLPreview({ svgContent, loading, error, className, onRetry }: CDLPreviewProps) {
  return (
    <div
      className={clsx(
        'relative bg-slate-50 rounded-lg overflow-hidden',
        'bg-[radial-gradient(circle,#e2e8f0_1px,transparent_1px)] bg-[size:20px_20px]',
        className
      )}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-50/80 z-10">
          <div className="flex items-center gap-3 text-slate-600">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Generating preview...</span>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-50/90 z-10 p-4">
          <div className="text-center">
            <svg className="mx-auto h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <p className="mt-2 text-sm text-red-700">{error}</p>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="mt-4 inline-flex items-center gap-2 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Retry
              </button>
            )}
          </div>
        </div>
      )}

      {!loading && !error && !svgContent && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-slate-500">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
            <p className="mt-2">Enter CDL code to see preview</p>
          </div>
        </div>
      )}

      {svgContent && !loading && !error && (
        <div
          className="w-full h-full flex items-center justify-center p-4 [&>svg]:max-w-full [&>svg]:max-h-full [&>svg]:w-auto [&>svg]:h-auto"
          dangerouslySetInnerHTML={{ __html: normalizeSvgForDisplay(svgContent) }}
        />
      )}
    </div>
  );
}
