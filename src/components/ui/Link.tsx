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

const variantStyles: Record<LinkVariant, string> = {
  default: 'text-slate-700 hover:text-slate-900',
  primary: 'text-crystal-600 hover:text-crystal-700',
  muted: 'text-slate-500 hover:text-slate-700',
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
