import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { cn } from './cn';

type LinkVariant = 'default' | 'primary' | 'muted';

interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  variant?: LinkVariant;
  withArrow?: boolean;
  external?: boolean;
  children: ReactNode;
}

// `primary` is the only variant carrying the warm gold hover-underline touch
// (used sparingly, per spec - nowhere else in the link system).
const variantStyles: Record<LinkVariant, string> = {
  default: 'text-slate-700 hover:text-slate-900 dark:text-cream-secondary dark:hover:text-cream-primary',
  primary:
    'text-crystal-700 hover:text-crystal-800 dark:text-crystal-400 dark:hover:text-crystal-300 dark:hover:underline dark:hover:underline-offset-4 dark:hover:decoration-gold',
  muted: 'text-slate-600 hover:text-slate-800 dark:text-cream-muted dark:hover:text-cream-secondary',
};

function ArrowIcon() {
  return (
    <svg
      className="w-4 h-4 transition-transform group-hover:translate-x-0.5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 7l5 5m0 0l-5 5m5-5H6"
      />
    </svg>
  );
}

export function Link({
  href,
  variant = 'default',
  withArrow = false,
  external = false,
  children,
  className,
  ...props
}: LinkProps) {
  const externalProps = external
    ? { target: '_blank', rel: 'noopener noreferrer' }
    : {};

  return (
    <a
      href={href}
      className={cn(
        'inline-flex items-center gap-2 font-medium transition-colors',
        withArrow && 'group',
        variantStyles[variant],
        className
      )}
      {...externalProps}
      {...props}
    >
      {children}
      {withArrow && <ArrowIcon />}
    </a>
  );
}
