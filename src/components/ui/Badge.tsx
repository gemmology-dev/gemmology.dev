import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { HTMLAttributes, ReactNode } from 'react';

type BadgeVariant = 'default' | 'crystal' | 'ruby' | 'sapphire' | 'emerald' | 'outline';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  children: ReactNode;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-slate-100 text-slate-700',
  crystal: 'bg-crystal-100 text-crystal-700',
  ruby: 'bg-red-100 text-red-700',
  sapphire: 'bg-blue-100 text-blue-700',
  emerald: 'bg-green-100 text-green-700',
  outline: 'border border-slate-300 text-slate-700 bg-transparent',
};

export function Badge({ variant = 'default', children, className, ...props }: BadgeProps) {
  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
          variantStyles[variant]
        ),
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
