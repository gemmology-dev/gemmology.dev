/**
 * Collapsible card wrapper for individual calculators.
 * Used in the grid layout to show all calculators at once.
 */

import type { ReactNode } from 'react';
import { cn } from '../ui/cn';

interface CalculatorCardProps {
  /** Unique identifier for the calculator */
  id: string;
  /** Display title */
  title: string;
  /** Short description of what this calculator does */
  description: string;
  /** SVG path data for the icon */
  iconPath: string;
  /** Whether the card is currently expanded */
  expanded: boolean;
  /** Callback when the card header is clicked */
  onToggle: () => void;
  /** The calculator component to render when expanded */
  children: ReactNode;
}

export function CalculatorCard({
  id,
  title,
  description,
  iconPath,
  expanded,
  onToggle,
  children,
}: CalculatorCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border bg-white shadow-sm overflow-hidden transition-all',
        expanded ? 'border-crystal-300 shadow-md' : 'border-slate-200'
      )}
    >
      {/* Clickable header */}
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          'w-full flex items-center gap-4 p-4 text-left transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-inset focus:ring-crystal-500',
          expanded ? 'bg-crystal-50' : 'hover:bg-slate-50'
        )}
        aria-expanded={expanded}
        aria-controls={`calculator-panel-${id}`}
      >
        {/* Icon */}
        <div
          className={cn(
            'flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg transition-colors',
            expanded ? 'bg-crystal-500 text-white' : 'bg-slate-100 text-slate-600'
          )}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={iconPath} />
          </svg>
        </div>

        {/* Title and description */}
        <div className="flex-1 min-w-0">
          <h3 className={cn(
            'font-semibold text-sm',
            expanded ? 'text-crystal-700' : 'text-slate-900'
          )}>
            {title}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5 truncate">
            {description}
          </p>
        </div>

        {/* Chevron indicator */}
        <svg
          className={cn(
            'w-5 h-5 flex-shrink-0 transition-transform duration-200',
            expanded ? 'rotate-180 text-crystal-600' : 'text-slate-400'
          )}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expandable content */}
      <div
        id={`calculator-panel-${id}`}
        className={cn(
          'transition-all duration-200 ease-out overflow-hidden',
          expanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        <div className="p-4 pt-0 border-t border-slate-100">
          <div className="pt-4">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
