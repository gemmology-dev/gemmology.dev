/**
 * Numeric result with classification badge.
 * Shows a value along with a category/classification label.
 */

import { type ReactNode } from 'react';
import { cn } from '../../ui/cn';
import { NumberResult } from './NumberResult';

type ResultVariant = 'crystal' | 'emerald' | 'sapphire' | 'ruby' | 'topaz' | 'neutral';
type ClassificationLevel = 'none' | 'low' | 'medium' | 'high' | 'very-high';

interface ClassifiedResultProps {
  /** The numeric value to display */
  value: number | string;
  /** Number of decimal places (only applies if value is a number) */
  precision?: number;
  /** Unit label */
  unit?: string;
  /** Label describing the result */
  label?: string;
  /** Additional description text */
  description?: string;
  /** Color variant for the container */
  variant?: ResultVariant;
  /** Whether to enable copy-to-clipboard */
  copyable?: boolean;
  /** Classification text (e.g., "Low", "Medium", "Very High") */
  classification: string;
  /** Classification severity level (affects badge color) */
  classificationLevel?: ClassificationLevel;
  /** Additional content below the result */
  children?: ReactNode;
  /** Additional class names */
  className?: string;
}

const levelBadgeClasses: Record<ClassificationLevel, string> = {
  'none': 'bg-slate-100 text-slate-700 border-slate-200',
  'low': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'medium': 'bg-blue-100 text-blue-700 border-blue-200',
  'high': 'bg-amber-100 text-amber-700 border-amber-200',
  'very-high': 'bg-red-100 text-red-700 border-red-200',
};

/**
 * Infer classification level from common classification strings.
 */
function inferLevel(classification: string): ClassificationLevel {
  const lower = classification.toLowerCase();
  if (lower === 'none' || lower === 'singly refractive') return 'none';
  if (lower === 'low' || lower === 'weak') return 'low';
  if (lower === 'medium' || lower === 'moderate') return 'medium';
  if (lower === 'high' || lower === 'strong') return 'high';
  if (lower.includes('very') || lower.includes('extreme') || lower.includes('exceptional')) return 'very-high';
  return 'medium'; // Default fallback
}

export function ClassifiedResult({
  value,
  precision,
  unit,
  label,
  description,
  variant = 'crystal',
  copyable = true,
  classification,
  classificationLevel,
  children,
  className,
}: ClassifiedResultProps) {
  const level = classificationLevel ?? inferLevel(classification);

  return (
    <NumberResult
      value={value}
      precision={precision}
      unit={unit}
      label={label}
      description={description}
      variant={variant}
      copyable={copyable}
      className={className}
    >
      {/* Classification badge */}
      <div className="flex justify-center mt-3">
        <span
          className={cn(
            'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border',
            levelBadgeClasses[level]
          )}
        >
          {classification}
        </span>
      </div>

      {/* Additional content */}
      {children}
    </NumberResult>
  );
}
