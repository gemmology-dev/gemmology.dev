/**
 * Full-width tool section with sticky header and colored accent.
 * Replaces CalculatorCard for tool category pages — always expanded,
 * single-column layout that uses 100% available width.
 */

import type { ReactNode } from 'react';

type Accent = 'emerald' | 'blue' | 'purple' | 'rose' | 'amber' | 'cyan';

const ACCENT_CLASSES: Record<Accent, {
  border: string;
  iconBg: string;
  iconText: string;
  headerBg: string;
  headerBorder: string;
  titleText: string;
  strip: string;
}> = {
  emerald: {
    border: 'border-emerald-200 dark:border-emerald-400/30',
    iconBg: 'bg-emerald-100 dark:bg-emerald-400/10',
    iconText: 'text-emerald-600 dark:text-emerald-300',
    headerBg: 'bg-emerald-50 dark:bg-emerald-400/10',
    headerBorder: 'border-emerald-200 dark:border-emerald-400/20',
    titleText: 'text-emerald-800 dark:text-emerald-300',
    strip: 'bg-emerald-500',
  },
  blue: {
    border: 'border-blue-200 dark:border-blue-400/30',
    iconBg: 'bg-blue-100 dark:bg-blue-400/10',
    iconText: 'text-blue-600 dark:text-blue-300',
    headerBg: 'bg-blue-50 dark:bg-blue-400/10',
    headerBorder: 'border-blue-200 dark:border-blue-400/20',
    titleText: 'text-blue-800 dark:text-blue-300',
    strip: 'bg-blue-500',
  },
  purple: {
    border: 'border-purple-200 dark:border-purple-400/30',
    iconBg: 'bg-purple-100 dark:bg-purple-400/10',
    iconText: 'text-purple-600 dark:text-purple-300',
    headerBg: 'bg-purple-50 dark:bg-purple-400/10',
    headerBorder: 'border-purple-200 dark:border-purple-400/20',
    titleText: 'text-purple-800 dark:text-purple-300',
    strip: 'bg-purple-500',
  },
  rose: {
    border: 'border-rose-200 dark:border-rose-400/30',
    iconBg: 'bg-rose-100 dark:bg-rose-400/10',
    iconText: 'text-rose-600 dark:text-rose-300',
    headerBg: 'bg-rose-50 dark:bg-rose-400/10',
    headerBorder: 'border-rose-200 dark:border-rose-400/20',
    titleText: 'text-rose-800 dark:text-rose-300',
    strip: 'bg-rose-500',
  },
  amber: {
    border: 'border-amber-200 dark:border-amber-400/30',
    iconBg: 'bg-amber-100 dark:bg-amber-400/10',
    iconText: 'text-amber-600 dark:text-amber-300',
    headerBg: 'bg-amber-50 dark:bg-amber-400/10',
    headerBorder: 'border-amber-200 dark:border-amber-400/20',
    titleText: 'text-amber-800 dark:text-amber-300',
    strip: 'bg-amber-500',
  },
  cyan: {
    border: 'border-cyan-200 dark:border-cyan-400/30',
    iconBg: 'bg-cyan-100 dark:bg-cyan-400/10',
    iconText: 'text-cyan-600 dark:text-cyan-300',
    headerBg: 'bg-cyan-50 dark:bg-cyan-400/10',
    headerBorder: 'border-cyan-200 dark:border-cyan-400/20',
    titleText: 'text-cyan-800 dark:text-cyan-300',
    strip: 'bg-cyan-500',
  },
};

interface ToolSectionProps {
  id: string;
  title: string;
  description: string;
  iconPath: string;
  accent: Accent;
  children: ReactNode;
}

export function ToolSection({
  id,
  title,
  description,
  iconPath,
  accent,
  children,
}: ToolSectionProps) {
  const colors = ACCENT_CLASSES[accent];

  return (
    <section
      id={`tool-${id}`}
      className={`rounded-xl border ${colors.border} bg-white dark:bg-coffee-raised shadow-sm`}
    >
      {/* Colored accent strip + sticky header */}
      <div className="sticky top-16 z-10 rounded-t-xl">
        <div className={`h-1.5 ${colors.strip} rounded-t-xl`} />
        <div className={`flex items-center gap-4 px-5 py-3.5 ${colors.headerBg} border-b ${colors.headerBorder}`}>
          <div className={`flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-lg ${colors.iconBg}`}>
            <svg
              className={`w-5 h-5 ${colors.iconText}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={iconPath} />
            </svg>
          </div>
          <div className="min-w-0">
            <h3 className={`font-semibold text-base ${colors.titleText}`}>{title}</h3>
            <p className="text-xs text-slate-700 dark:text-cream-secondary truncate">{description}</p>
          </div>
        </div>
      </div>

      {/* Content — always visible, full width */}
      <div className="p-5 pt-4">
        {children}
      </div>
    </section>
  );
}
