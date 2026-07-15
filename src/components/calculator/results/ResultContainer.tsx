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
  crystal: 'bg-crystal-50 border-crystal-200 dark:bg-crystal-400/10 dark:border-crystal-400/20',
  emerald: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-400/10 dark:border-emerald-400/20',
  sapphire: 'bg-blue-50 border-blue-200 dark:bg-blue-400/10 dark:border-blue-400/20',
  ruby: 'bg-red-50 border-red-200 dark:bg-red-400/10 dark:border-red-400/20',
  topaz: 'bg-amber-50 border-amber-200 dark:bg-amber-400/10 dark:border-amber-400/20',
  neutral: 'bg-slate-50 border-slate-200 dark:bg-coffee-raised2 dark:border-coffee-border',
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
