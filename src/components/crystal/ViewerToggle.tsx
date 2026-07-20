/**
 * ViewerToggle - Toggle between 2D SVG and 3D WebGL views
 */

import { clsx } from 'clsx';

interface ViewerToggleProps {
  mode: '2d' | '3d';
  onModeChange: (mode: '2d' | '3d') => void;
  disabled?: boolean;
  className?: string;
}

export function ViewerToggle({
  mode,
  onModeChange,
  disabled = false,
  className = '',
}: ViewerToggleProps) {
  return (
    <div className={clsx('flex gap-1 bg-slate-100 dark:bg-coffee-raised2 rounded-lg p-1', className)}>
      <button
        onClick={() => onModeChange('2d')}
        disabled={disabled}
        aria-pressed={mode === '2d'}
        aria-label="Show 2D crystal drawing"
        className={clsx(
          'px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-150',
          'flex items-center gap-1.5',
          mode === '2d'
            ? 'bg-white shadow-sm text-sky-600 dark:bg-coffee-raised dark:text-sky-400'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-cream-muted dark:hover:text-cream-primary dark:hover:bg-coffee-raised',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M3 9h18" />
          <path d="M9 21V9" />
        </svg>
        2D SVG
      </button>

      <button
        onClick={() => onModeChange('3d')}
        disabled={disabled}
        aria-pressed={mode === '3d'}
        aria-label="Show interactive 3D crystal model"
        className={clsx(
          'px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-150',
          'flex items-center gap-1.5',
          mode === '3d'
            ? 'bg-white shadow-sm text-sky-600 dark:bg-coffee-raised dark:text-sky-400'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-cream-muted dark:hover:text-cream-primary dark:hover:bg-coffee-raised',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
        3D WebGL
      </button>
    </div>
  );
}
