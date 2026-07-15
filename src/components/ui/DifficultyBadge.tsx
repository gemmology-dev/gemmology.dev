import type { HTMLAttributes } from 'react';
import { cn } from './cn';

type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';
type DifficultySize = 'sm' | 'md';

interface DifficultyBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  level: DifficultyLevel;
  size?: DifficultySize;
}

// Each level gets a distinct hue + a leading dot in a stronger shade so the
// three states are scannable at a glance even on small mobile screens (P2-3).
const levelStyles: Record<DifficultyLevel, string> = {
  beginner:
    'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200 dark:bg-emerald-400/10 dark:text-emerald-300 dark:ring-emerald-400/20',
  intermediate:
    'bg-amber-50 text-amber-800 ring-1 ring-amber-200 dark:bg-amber-400/10 dark:text-amber-300 dark:ring-amber-400/20',
  advanced:
    'bg-rose-50 text-rose-800 ring-1 ring-rose-200 dark:bg-rose-400/10 dark:text-rose-300 dark:ring-rose-400/20',
};

const dotStyles: Record<DifficultyLevel, string> = {
  beginner: 'bg-emerald-500 dark:bg-emerald-400',
  intermediate: 'bg-amber-500 dark:bg-amber-400',
  advanced: 'bg-rose-600 dark:bg-rose-400',
};

const sizeStyles: Record<DifficultySize, string> = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-1',
};

export function DifficultyBadge({
  level,
  size = 'sm',
  className,
  ...props
}: DifficultyBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium capitalize',
        levelStyles[level],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      <span aria-hidden="true" className={cn('h-1.5 w-1.5 rounded-full', dotStyles[level])} />
      {level}
    </span>
  );
}
