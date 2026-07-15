import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from './cn';

type BadgeVariant =
  | 'default'
  | 'crystal'
  | 'ruby'
  | 'sapphire'
  | 'emerald'
  | 'amethyst'
  | 'topaz'
  | 'outline'
  // Crystal system variants
  | 'cubic'
  | 'hexagonal'
  | 'trigonal'
  | 'tetragonal'
  | 'orthorhombic'
  | 'monoclinic'
  | 'triclinic';

type BadgeSize = 'sm' | 'md';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  children: ReactNode;
}

// Dark mode uses the alpha-tint pattern for every hue: text-{hue}-300 on
// bg-{hue}-400/10 with a matching border-{hue}-400/20 (see docs/dark-mode.md).
const variantStyles: Record<BadgeVariant, string> = {
  default:
    'bg-slate-100 text-slate-700 dark:bg-coffee-raised2 dark:text-cream-secondary dark:border dark:border-coffee-border',
  crystal:
    'bg-crystal-100 text-crystal-700 dark:bg-crystal-400/10 dark:text-crystal-300 dark:border dark:border-crystal-400/20',
  ruby: 'bg-red-100 text-red-700 dark:bg-red-400/10 dark:text-red-300 dark:border dark:border-red-400/20',
  sapphire:
    'bg-blue-100 text-blue-700 dark:bg-blue-400/10 dark:text-blue-300 dark:border dark:border-blue-400/20',
  emerald:
    'bg-green-100 text-green-700 dark:bg-green-400/10 dark:text-green-300 dark:border dark:border-green-400/20',
  amethyst:
    'bg-purple-100 text-purple-700 dark:bg-purple-400/10 dark:text-purple-300 dark:border dark:border-purple-400/20',
  topaz:
    'bg-amber-100 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300 dark:border dark:border-amber-400/20',
  outline:
    'border border-slate-300 text-slate-700 bg-transparent dark:border-coffee-border-strong dark:text-cream-secondary',
  // Crystal system colors
  cubic:
    'bg-amber-100 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300 dark:border dark:border-amber-400/20',
  hexagonal:
    'bg-cyan-100 text-cyan-700 dark:bg-cyan-400/10 dark:text-cyan-300 dark:border dark:border-cyan-400/20',
  trigonal:
    'bg-violet-100 text-violet-700 dark:bg-violet-400/10 dark:text-violet-300 dark:border dark:border-violet-400/20',
  tetragonal:
    'bg-lime-100 text-lime-700 dark:bg-lime-400/10 dark:text-lime-300 dark:border dark:border-lime-400/20',
  orthorhombic:
    'bg-orange-100 text-orange-700 dark:bg-orange-400/10 dark:text-orange-300 dark:border dark:border-orange-400/20',
  monoclinic:
    'bg-rose-100 text-rose-700 dark:bg-rose-400/10 dark:text-rose-300 dark:border dark:border-rose-400/20',
  triclinic:
    'bg-teal-100 text-teal-700 dark:bg-teal-400/10 dark:text-teal-300 dark:border dark:border-teal-400/20',
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
};

export function Badge({
  variant = 'default',
  size = 'sm',
  children,
  className,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
