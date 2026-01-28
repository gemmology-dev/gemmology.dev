/**
 * Unified result display component for calculators.
 * Shows calculated values with optional copy-to-clipboard functionality.
 */

import { useState, useCallback, type ReactNode } from 'react';
import { cn } from '../ui/cn';

interface ResultCardProps {
  /** The primary value to display */
  value: string | number;
  /** Unit label (e.g., "ct", "mm", "°") */
  unit?: string;
  /** Label describing the result */
  label?: string;
  /** Secondary text below the main value */
  description?: string;
  /** Whether to enable copy-to-clipboard */
  copyable?: boolean;
  /** Custom format for copied text (defaults to value + unit) */
  copyText?: string;
  /** Additional content below the result */
  children?: ReactNode;
  /** Additional class names */
  className?: string;
}

export function ResultCard({
  value,
  unit,
  label,
  description,
  copyable = true,
  copyText,
  children,
  className,
}: ResultCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    const text = copyText ?? `${value}${unit ? ` ${unit}` : ''}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [value, unit, copyText]);

  return (
    <div
      className={cn(
        'relative p-4 rounded-lg bg-crystal-50 border border-crystal-200',
        className
      )}
    >
      {/* Copy button */}
      {copyable && (
        <button
          type="button"
          onClick={handleCopy}
          className={cn(
            'absolute top-2 right-2 p-1.5 rounded-md transition-colors',
            'text-slate-400 hover:text-slate-600 hover:bg-white/50',
            'focus:outline-none focus:ring-2 focus:ring-crystal-500 focus:ring-offset-2'
          )}
          aria-label={copied ? 'Copied!' : 'Copy result'}
          title={copied ? 'Copied!' : 'Copy to clipboard'}
        >
          {copied ? (
            <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          )}
        </button>
      )}

      {/* Label */}
      {label && (
        <p className="text-sm text-slate-500 text-center mb-1">{label}</p>
      )}

      {/* Main value */}
      <p className="text-center">
        <span className="text-3xl font-bold text-crystal-700">{value}</span>
        {unit && <span className="text-lg text-crystal-600 ml-1">{unit}</span>}
      </p>

      {/* Description */}
      {description && (
        <p className="text-sm text-slate-600 text-center mt-1">{description}</p>
      )}

      {/* Additional content */}
      {children}
    </div>
  );
}

/**
 * Compact result display for inline use.
 */
interface ResultInlineProps {
  value: string | number;
  unit?: string;
  label?: string;
  className?: string;
}

export function ResultInline({ value, unit, label, className }: ResultInlineProps) {
  return (
    <span className={cn('inline-flex items-baseline gap-1', className)}>
      {label && <span className="text-sm text-slate-500">{label}:</span>}
      <span className="font-semibold text-crystal-700">{value}</span>
      {unit && <span className="text-sm text-crystal-600">{unit}</span>}
    </span>
  );
}

/**
 * Result display with multiple values.
 */
interface ResultGroupProps {
  /** Array of results to display */
  results: Array<{
    value: string | number;
    unit?: string;
    label: string;
  }>;
  /** Whether to stack vertically or display inline */
  layout?: 'vertical' | 'horizontal';
  className?: string;
}

export function ResultGroup({ results, layout = 'horizontal', className }: ResultGroupProps) {
  return (
    <div
      className={cn(
        'p-4 rounded-lg bg-crystal-50 border border-crystal-200',
        layout === 'horizontal' ? 'flex items-center justify-around' : 'space-y-3',
        className
      )}
    >
      {results.map((result, index) => (
        <div key={index} className="text-center">
          <p className="text-sm text-slate-500">{result.label}</p>
          <p>
            <span className="text-xl font-bold text-crystal-700">{result.value}</span>
            {result.unit && (
              <span className="text-sm text-crystal-600 ml-1">{result.unit}</span>
            )}
          </p>
        </div>
      ))}
    </div>
  );
}
