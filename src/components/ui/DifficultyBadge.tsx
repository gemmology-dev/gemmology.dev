import type { HTMLAttributes } from 'react';
import { cn } from './cn';

type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';
type DifficultySize = 'sm' | 'md';

interface DifficultyBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  level: DifficultyLevel;
  size?: DifficultySize;
}

const levelStyles: Record<DifficultyLevel, string> = {
  beginner: 'bg-emerald-100 text-emerald-700',
  intermediate: 'bg-amber-100 text-amber-700',
  advanced: 'bg-red-100 text-red-700',
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
        'inline-block rounded-full font-medium capitalize',
        levelStyles[level],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {level}
    </span>
  );
}
