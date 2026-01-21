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

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-slate-100 text-slate-700',
  crystal: 'bg-crystal-100 text-crystal-700',
  ruby: 'bg-red-100 text-red-700',
  sapphire: 'bg-blue-100 text-blue-700',
  emerald: 'bg-green-100 text-green-700',
  amethyst: 'bg-purple-100 text-purple-700',
  topaz: 'bg-amber-100 text-amber-700',
  outline: 'border border-slate-300 text-slate-700 bg-transparent',
  // Crystal system colors
  cubic: 'bg-amber-100 text-amber-700',
  hexagonal: 'bg-cyan-100 text-cyan-700',
  trigonal: 'bg-violet-100 text-violet-700',
  tetragonal: 'bg-lime-100 text-lime-700',
  orthorhombic: 'bg-orange-100 text-orange-700',
  monoclinic: 'bg-rose-100 text-rose-700',
  triclinic: 'bg-teal-100 text-teal-700',
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
