/**
 * Simple numeric result display component.
 * Shows a value with optional unit, label, and copy functionality.
 */

import { useState, useCallback, type ReactNode } from 'react';
import { cn } from '../../ui/cn';
import { ResultContainer } from './ResultContainer';

type ResultVariant = 'crystal' | 'emerald' | 'sapphire' | 'ruby' | 'topaz' | 'neutral';

interface NumberResultProps {
  /** The numeric value to display */
  value: number | string;
  /** Number of decimal places (only applies if value is a number) */
  precision?: number;
  /** Unit label (e.g., "ct", "mm", "°") */
  unit?: string;
  /** Position of unit relative to value */
  unitPosition?: 'before' | 'after';
  /** Label describing the result */
  label?: string;
  /** Additional description text */
  description?: string;
  /** Color variant */
  variant?: ResultVariant;
  /** Whether to enable copy-to-clipboard */
  copyable?: boolean;
  /** Custom format for copied text (defaults to value + unit) */
  copyText?: string;
  /** Additional content below the result */
  children?: ReactNode;
  /** Additional class names */
  className?: string;
}

const variantTextClasses: Record<ResultVariant, { value: string; unit: string }> = {
  crystal: { value: 'text-crystal-700', unit: 'text-crystal-600' },
  emerald: { value: 'text-emerald-700', unit: 'text-emerald-600' },
  sapphire: { value: 'text-blue-700', unit: 'text-blue-600' },
  ruby: { value: 'text-red-700', unit: 'text-red-600' },
  topaz: { value: 'text-amber-700', unit: 'text-amber-600' },
  neutral: { value: 'text-slate-700', unit: 'text-slate-600' },
};

export function NumberResult({
  value,
  precision,
  unit,
  unitPosition = 'after',
  label,
  description,
  variant = 'crystal',
  copyable = true,
  copyText,
  children,
  className,
}: NumberResultProps) {
  const [copied, setCopied] = useState(false);

  // Format the display value
  const displayValue = typeof value === 'number' && precision !== undefined
    ? value.toFixed(precision)
    : String(value);

  const handleCopy = useCallback(async () => {
    const text = copyText ?? `${displayValue}${unit ? ` ${unit}` : ''}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [displayValue, unit, copyText]);

  const textClasses = variantTextClasses[variant];

  return (
    <ResultContainer variant={variant} className={cn('relative', className)}>
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

      {/* Main value with unit */}
      <p className="text-center">
        {unitPosition === 'before' && unit && (
          <span className={cn('text-lg mr-1', textClasses.unit)}>{unit}</span>
        )}
        <span className={cn('text-3xl font-bold', textClasses.value)}>{displayValue}</span>
        {unitPosition === 'after' && unit && (
          <span className={cn('text-lg ml-1', textClasses.unit)}>{unit}</span>
        )}
      </p>

      {/* Description */}
      {description && (
        <p className="text-sm text-slate-600 text-center mt-1">{description}</p>
      )}

      {/* Additional content */}
      {children}
    </ResultContainer>
  );
}
