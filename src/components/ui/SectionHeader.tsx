import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from './cn';
import { Badge } from './Badge';

interface SectionHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  badge?: string;
  align?: 'center' | 'left';
  children?: ReactNode;
}

export function SectionHeader({
  title,
  description,
  badge,
  align = 'center',
  children,
  className,
  ...props
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        'mb-12',
        align === 'center' && 'text-center',
        className
      )}
      {...props}
    >
      {badge && (
        <Badge variant="crystal" className="mb-4">
          {badge}
        </Badge>
      )}
      <h2 className="text-3xl font-bold text-slate-900">{title}</h2>
      {description && (
        <p
          className={cn(
            'mt-4 text-lg text-slate-600',
            align === 'center' && 'max-w-2xl mx-auto'
          )}
        >
          {description}
        </p>
      )}
      {children}
    </div>
  );
}
