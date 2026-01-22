import type { ElementType, HTMLAttributes, ReactNode } from 'react';
import { cn } from './cn';

type ContainerSize = 'sm' | 'md' | 'lg' | 'xl';
type ContainerPadding = 'none' | 'sm' | 'md' | 'lg';

interface ContainerProps extends HTMLAttributes<HTMLElement> {
  size?: ContainerSize;
  padding?: ContainerPadding;
  as?: 'div' | 'section' | 'article' | 'main';
  children: ReactNode;
}

const sizeStyles: Record<ContainerSize, string> = {
  sm: 'max-w-3xl',
  md: 'max-w-4xl',
  lg: 'max-w-6xl',
  xl: 'max-w-7xl',
};

const paddingStyles: Record<ContainerPadding, string> = {
  none: '',
  sm: 'px-4 py-8',
  md: 'px-4 sm:px-6 lg:px-8 py-12',
  lg: 'px-4 sm:px-6 lg:px-8 py-24',
};

export function Container({
  size = 'xl',
  padding = 'md',
  as: Tag = 'div',
  children,
  className,
  ...props
}: ContainerProps) {
  return (
    <Tag
      className={cn(
        'w-full mx-auto',
        sizeStyles[size],
        paddingStyles[padding],
        className
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}
