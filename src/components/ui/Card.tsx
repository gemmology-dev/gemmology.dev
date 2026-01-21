import type { AnchorHTMLAttributes, HTMLAttributes, ReactNode } from 'react';
import { cn } from './cn';

type CardElement = 'div' | 'article' | 'section' | 'a';

type CardBaseProps = {
  children: ReactNode;
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  as?: CardElement;
};

type CardProps = CardBaseProps &
  (
    | ({ as?: 'div' | 'article' | 'section' } & HTMLAttributes<HTMLDivElement>)
    | ({ as: 'a'; href: string } & AnchorHTMLAttributes<HTMLAnchorElement>)
  );

const paddingStyles = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export function Card({
  children,
  hover = false,
  padding = 'md',
  as: Tag = 'div',
  className,
  ...props
}: CardProps) {
  return (
    <Tag
      className={cn(
        'rounded-xl border border-slate-200 bg-white shadow-sm',
        paddingStyles[padding],
        hover && 'transition-all hover:border-crystal-300 hover:shadow-md cursor-pointer',
        className
      )}
      {...(props as any)}
    >
      {children}
    </Tag>
  );
}

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function CardHeader({ children, className, ...props }: CardHeaderProps) {
  return (
    <div className={cn('mb-4', className)} {...props}>
      {children}
    </div>
  );
}

interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  children: ReactNode;
  as?: 'h1' | 'h2' | 'h3' | 'h4';
}

export function CardTitle({ children, as: Tag = 'h3', className, ...props }: CardTitleProps) {
  return (
    <Tag className={cn('text-lg font-semibold text-slate-900', className)} {...props}>
      {children}
    </Tag>
  );
}

interface CardDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {
  children: ReactNode;
}

export function CardDescription({ children, className, ...props }: CardDescriptionProps) {
  return (
    <p className={cn('text-sm text-slate-600', className)} {...props}>
      {children}
    </p>
  );
}

interface CardContentProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function CardContent({ children, className, ...props }: CardContentProps) {
  return (
    <div className={cn(className)} {...props}>
      {children}
    </div>
  );
}

interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function CardFooter({ children, className, ...props }: CardFooterProps) {
  return (
    <div className={cn('mt-4 pt-4 border-t border-slate-100', className)} {...props}>
      {children}
    </div>
  );
}
