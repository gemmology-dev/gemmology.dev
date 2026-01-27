/**
 * Exam timer component showing countdown and controls.
 */

import { cn } from '../ui/cn';

interface ExamTimerProps {
  /** Time remaining in seconds */
  timeRemaining: number;
  /** Whether the timer is running */
  isRunning: boolean;
  /** Whether time has expired */
  isExpired: boolean;
  /** Callback to pause timer */
  onPause?: () => void;
  /** Callback to resume timer */
  onResume?: () => void;
  /** Additional class names */
  className?: string;
}

export function ExamTimer({
  timeRemaining,
  isRunning,
  isExpired,
  onPause,
  onResume,
  className,
}: ExamTimerProps) {
  const hours = Math.floor(timeRemaining / 3600);
  const minutes = Math.floor((timeRemaining % 3600) / 60);
  const seconds = timeRemaining % 60;

  const formatTime = (value: number) => value.toString().padStart(2, '0');

  // Determine urgency level
  const isWarning = timeRemaining <= 300 && timeRemaining > 60; // Last 5 minutes
  const isCritical = timeRemaining <= 60; // Last minute

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-2 rounded-lg',
        !isExpired && !isWarning && !isCritical && 'bg-slate-100 text-slate-700',
        isWarning && 'bg-amber-100 text-amber-700',
        isCritical && 'bg-red-100 text-red-700 animate-pulse',
        isExpired && 'bg-red-500 text-white',
        className
      )}
    >
      {/* Timer icon */}
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>

      {/* Time display */}
      <div className="font-mono text-lg font-semibold">
        {hours > 0 && (
          <>
            <span>{formatTime(hours)}</span>
            <span className="mx-1">:</span>
          </>
        )}
        <span>{formatTime(minutes)}</span>
        <span className="mx-1">:</span>
        <span>{formatTime(seconds)}</span>
      </div>

      {/* Status text */}
      {isExpired && (
        <span className="text-sm font-medium">Time's up!</span>
      )}

      {/* Pause/Resume button (optional) */}
      {!isExpired && onPause && onResume && (
        <button
          type="button"
          onClick={isRunning ? onPause : onResume}
          className={cn(
            'p-1 rounded hover:bg-black/10 transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-offset-2',
            isWarning && 'focus:ring-amber-500',
            isCritical && 'focus:ring-red-500',
            !isWarning && !isCritical && 'focus:ring-slate-500'
          )}
          title={isRunning ? 'Pause' : 'Resume'}
        >
          {isRunning ? (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </button>
      )}
    </div>
  );
}

interface ExamTimerCompactProps {
  /** Time remaining in seconds */
  timeRemaining: number;
  /** Additional class names */
  className?: string;
}

export function ExamTimerCompact({ timeRemaining, className }: ExamTimerCompactProps) {
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const isCritical = timeRemaining <= 60;

  return (
    <span
      className={cn(
        'font-mono text-sm font-medium',
        isCritical ? 'text-red-600' : 'text-slate-600',
        className
      )}
    >
      {minutes}:{seconds.toString().padStart(2, '0')}
    </span>
  );
}
