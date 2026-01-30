/**
 * Result card for gem identification matches.
 * Displays mineral info with confidence score and matched properties.
 */

import { cn } from '../ui';
import type { MatchResult } from '../../lib/identification/match-calculator';
import { getConfidenceLevel, getConfidenceClasses } from '../../lib/identification/match-calculator';

interface IdentificationMatchCardProps {
  result: MatchResult;
  showDetails?: boolean;
  className?: string;
}

export function IdentificationMatchCard({
  result,
  showDetails = true,
  className,
}: IdentificationMatchCardProps) {
  const { mineral, confidenceScore, matchDetails, matchedProperties } = result;
  const { label: confidenceLabel, level } = getConfidenceLevel(confidenceScore);
  const colors = getConfidenceClasses(level);

  return (
    <div
      className={cn(
        'rounded-lg border p-4 transition-colors',
        colors.border,
        colors.bg,
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h4 className="font-semibold text-slate-900 truncate">
            {mineral.name}
          </h4>
          {mineral.system && (
            <p className="text-sm text-slate-600">
              {mineral.system}
              {mineral.point_group && ` · ${mineral.point_group}`}
            </p>
          )}
        </div>

        {/* Confidence badge */}
        <div className="flex-shrink-0 text-right">
          <div className={cn(
            'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-medium',
            level === 'excellent' && 'bg-emerald-100 text-emerald-800',
            level === 'good' && 'bg-blue-100 text-blue-800',
            level === 'partial' && 'bg-amber-100 text-amber-800',
            level === 'weak' && 'bg-slate-100 text-slate-600',
          )}>
            <span>{confidenceScore}%</span>
          </div>
          <p className={cn('text-xs mt-1', colors.text)}>
            {confidenceLabel}
          </p>
        </div>
      </div>

      {/* Matched properties summary */}
      {matchedProperties.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {matchedProperties.map(prop => (
            <span
              key={prop}
              className="inline-flex items-center gap-1 rounded bg-white/80 px-2 py-0.5 text-xs font-medium text-slate-700"
            >
              <svg className="h-3 w-3 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              {formatPropertyName(prop)}
            </span>
          ))}
        </div>
      )}

      {/* Property details */}
      {showDetails && matchDetails.length > 0 && (
        <div className="mt-4 space-y-1.5">
          <p className="text-xs font-medium text-slate-700 uppercase tracking-wide">
            Property Comparison
          </p>
          <div className="grid gap-1">
            {matchDetails.map(detail => (
              <div
                key={detail.property}
                className={cn(
                  'flex items-center justify-between text-sm rounded px-2 py-1',
                  detail.matched ? 'bg-white/80' : 'bg-white/40'
                )}
              >
                <span className="flex items-center gap-2">
                  {detail.matched ? (
                    <svg className="h-4 w-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                  <span className={detail.matched ? 'text-slate-900' : 'text-slate-500'}>
                    {detail.property}
                  </span>
                </span>
                <span className="text-right">
                  <span className={cn(
                    'font-mono text-xs',
                    detail.matched ? 'text-slate-700' : 'text-slate-500'
                  )}>
                    {detail.measured}
                  </span>
                  <span className="text-slate-400 mx-1">→</span>
                  <span className={cn(
                    'font-mono text-xs',
                    detail.matched ? 'text-slate-700' : 'text-slate-500'
                  )}>
                    {detail.expected}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Additional mineral info */}
      {mineral.chemistry && (
        <p className="mt-3 text-xs text-slate-600 font-mono truncate">
          {mineral.chemistry}
        </p>
      )}
    </div>
  );
}

/**
 * Format property key to display name.
 */
function formatPropertyName(prop: string): string {
  const names: Record<string, string> = {
    ri: 'RI',
    sg: 'SG',
    birefringence: 'Birefringence',
    dispersion: 'Dispersion',
    hardness: 'Hardness',
    crystalSystem: 'Crystal System',
    opticSign: 'Optic Sign',
  };
  return names[prop] || prop;
}

/**
 * Compact version of match card for list view.
 */
export function IdentificationMatchCardCompact({
  result,
  className,
}: Omit<IdentificationMatchCardProps, 'showDetails'>) {
  const { mineral, confidenceScore, matchedProperties } = result;
  const { level } = getConfidenceLevel(confidenceScore);

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white px-4 py-3',
        className
      )}
    >
      <div className="min-w-0 flex-1">
        <h4 className="font-medium text-slate-900 truncate">
          {mineral.name}
        </h4>
        <p className="text-xs text-slate-500 mt-0.5">
          {matchedProperties.length} of {result.matchDetails.length} properties match
        </p>
      </div>

      <div className={cn(
        'flex-shrink-0 rounded-full px-2.5 py-1 text-sm font-medium',
        level === 'excellent' && 'bg-emerald-100 text-emerald-800',
        level === 'good' && 'bg-blue-100 text-blue-800',
        level === 'partial' && 'bg-amber-100 text-amber-800',
        level === 'weak' && 'bg-slate-100 text-slate-600',
      )}>
        {confidenceScore}%
      </div>
    </div>
  );
}
