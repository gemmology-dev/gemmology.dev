import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from './cn';

type IconBoxSize = 'sm' | 'md' | 'lg';
type IconBoxVariant = 'crystal' | 'ruby' | 'sapphire' | 'emerald' | 'amethyst' | 'topaz' | 'slate';

interface IconBoxProps extends HTMLAttributes<HTMLDivElement> {
  size?: IconBoxSize;
  variant?: IconBoxVariant;
  children: ReactNode;
}

const sizeStyles: Record<IconBoxSize, string> = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
};

const variantStyles: Record<IconBoxVariant, string> = {
  crystal: 'bg-crystal-100 text-crystal-700 dark:bg-crystal-400/10 dark:text-crystal-300',
  ruby: 'bg-red-100 text-red-600 dark:bg-red-400/10 dark:text-red-300',
  sapphire: 'bg-blue-100 text-blue-600 dark:bg-blue-400/10 dark:text-blue-300',
  emerald: 'bg-green-100 text-green-600 dark:bg-green-400/10 dark:text-green-300',
  amethyst: 'bg-purple-100 text-purple-600 dark:bg-purple-400/10 dark:text-purple-300',
  topaz: 'bg-amber-100 text-amber-600 dark:bg-amber-400/10 dark:text-amber-300',
  slate: 'bg-slate-100 text-slate-600 dark:bg-coffee-raised2 dark:text-cream-secondary',
};

export function IconBox({
  size = 'md',
  variant = 'crystal',
  children,
  className,
  ...props
}: IconBoxProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-lg transition-transform',
        sizeStyles[size],
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
