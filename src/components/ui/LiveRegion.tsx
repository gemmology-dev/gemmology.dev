/**
 * LiveRegion component for screen reader announcements.
 * Uses ARIA live regions to announce dynamic content changes.
 */

interface LiveRegionProps {
  /** The message to announce to screen readers */
  message: string;
  /** Priority level for the announcement */
  priority?: 'polite' | 'assertive';
  /** Whether the entire region should be read */
  atomic?: boolean;
  /** Additional class names */
  className?: string;
}

/**
 * Announces dynamic changes to screen readers using ARIA live regions.
 *
 * Use `polite` (default) for non-urgent updates that can wait.
 * Use `assertive` for critical/time-sensitive announcements.
 *
 * @example
 * // Announce quiz score
 * <LiveRegion message={`Score: ${score} out of ${total}`} />
 *
 * @example
 * // Urgent timer warning
 * <LiveRegion message="30 seconds remaining" priority="assertive" />
 */
export function LiveRegion({
  message,
  priority = 'polite',
  atomic = true,
  className,
}: LiveRegionProps) {
  return (
    <div
      role="status"
      aria-live={priority}
      aria-atomic={atomic}
      className={className ?? 'sr-only'}
    >
      {message}
    </div>
  );
}

/**
 * A visually hidden live region that only announces when message changes.
 * Useful for announcing state changes without visible UI updates.
 */
interface AnnouncerProps {
  /** The message to announce - only announced when it changes */
  message: string;
  /** Priority level */
  priority?: 'polite' | 'assertive';
}

export function Announcer({ message, priority = 'polite' }: AnnouncerProps) {
  return (
    <div
      role="status"
      aria-live={priority}
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  );
}
