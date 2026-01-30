/**
 * Base wrapper component for calculator results.
 * Provides consistent styling and accessibility features including live region.
 */

import { type ReactNode } from 'react';
import { cn } from '../../ui/cn';

type ResultVariant = 'crystal' | 'emerald' | 'sapphire' | 'ruby' | 'topaz' | 'neutral';

interface ResultContainerProps {
  /** Result content */
  children: ReactNode;
  /** Color variant */
  variant?: ResultVariant;
  /** Whether this is a live region (announces changes to screen readers) */
  liveRegion?: boolean;
  /** Live region politeness setting */
  politeness?: 'polite' | 'assertive';
  /** Additional class names */
  className?: string;
}

const variantClasses: Record<ResultVariant, string> = {
  crystal: 'bg-crystal-50 border-crystal-200',
  emerald: 'bg-emerald-50 border-emerald-200',
  sapphire: 'bg-blue-50 border-blue-200',
  ruby: 'bg-red-50 border-red-200',
  topaz: 'bg-amber-50 border-amber-200',
  neutral: 'bg-slate-50 border-slate-200',
};

export function ResultContainer({
  children,
  variant = 'crystal',
  liveRegion = true,
  politeness = 'polite',
  className,
}: ResultContainerProps) {
  return (
    <div
      className={cn(
        'p-4 rounded-lg border',
        variantClasses[variant],
        className
      )}
      role={liveRegion ? 'status' : undefined}
      aria-live={liveRegion ? politeness : undefined}
      aria-atomic={liveRegion ? 'true' : undefined}
    >
      {children}
    </div>
  );
}
