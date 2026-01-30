/**
 * Display component for multiple related result values.
 * Used for calculators that output several values at once.
 */

import { type ReactNode } from 'react';
import { cn } from '../../ui/cn';
import { ResultContainer } from './ResultContainer';

type ResultVariant = 'crystal' | 'emerald' | 'sapphire' | 'ruby' | 'topaz' | 'neutral';
type LayoutMode = 'horizontal' | 'vertical' | 'grid';

interface ResultValue {
  /** The value to display */
  value: string | number;
  /** Number of decimal places (only applies if value is a number) */
  precision?: number;
  /** Unit label */
  unit?: string;
  /** Label for this value */
  label: string;
  /** Whether this is the primary/highlighted value */
  primary?: boolean;
}

interface MultiValueResultProps {
  /** Array of result values to display */
  results: ResultValue[];
  /** Layout mode */
  layout?: LayoutMode;
  /** Color variant */
  variant?: ResultVariant;
  /** Additional content below the results */
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

const layoutClasses: Record<LayoutMode, string> = {
  horizontal: 'flex items-center justify-around flex-wrap gap-4',
  vertical: 'space-y-4',
  grid: 'grid grid-cols-2 gap-4',
};

export function MultiValueResult({
  results,
  layout = 'horizontal',
  variant = 'crystal',
  children,
  className,
}: MultiValueResultProps) {
  const textClasses = variantTextClasses[variant];

  return (
    <ResultContainer variant={variant} className={className}>
      <div className={layoutClasses[layout]}>
        {results.map((result, index) => {
          // Format the display value
          const displayValue = typeof result.value === 'number' && result.precision !== undefined
            ? result.value.toFixed(result.precision)
            : String(result.value);

          return (
            <div key={index} className="text-center">
              <p className="text-sm text-slate-500">{result.label}</p>
              <p>
                <span
                  className={cn(
                    'font-bold',
                    result.primary ? 'text-2xl' : 'text-xl',
                    textClasses.value
                  )}
                >
                  {displayValue}
                </span>
                {result.unit && (
                  <span
                    className={cn(
                      'ml-1',
                      result.primary ? 'text-base' : 'text-sm',
                      textClasses.unit
                    )}
                  >
                    {result.unit}
                  </span>
                )}
              </p>
            </div>
          );
        })}
      </div>

      {/* Additional content */}
      {children}
    </ResultContainer>
  );
}
