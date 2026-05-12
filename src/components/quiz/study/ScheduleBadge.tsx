/**
 * ScheduleBadge — compact SM-2 schedule status indicator.
 *
 * Variants:
 *   - null entry    → "New"       (crystal/blue)
 *   - due now       → "Due"       (amber)
 *   - scheduled     → "Mastered (N d)" (emerald)
 *
 * Uses the `Badge` primitive from `@/components/ui`.
 */

import type { ScheduleEntry } from '../../../lib/quiz/study-types';
import { Badge } from '../../ui/Badge';

interface ScheduleBadgeProps {
  /** SM-2 schedule entry, or null when the question has never been seen. */
  entry: ScheduleEntry | null;
  /** Override "now" for testing purposes (Unix ms). */
  now?: number;
}

function daysUntil(nextDueMs: number, nowMs: number): number {
  return Math.round((nextDueMs - nowMs) / 86_400_000);
}

export function ScheduleBadge({ entry, now: nowOverride }: ScheduleBadgeProps) {
  const now = nowOverride ?? Date.now();

  if (!entry || entry.totalReviews === 0) {
    return (
      <Badge variant="crystal" size="sm" aria-label="Question status: New, never seen before">
        New
      </Badge>
    );
  }

  const isDue = entry.nextDue <= now;

  if (isDue) {
    return (
      <Badge
        variant="topaz"
        size="sm"
        aria-label="Question status: Due for review"
      >
        Due
      </Badge>
    );
  }

  const days = daysUntil(entry.nextDue, now);
  const label =
    days === 1 ? 'Mastered (1 d)' : `Mastered (${days} d)`;

  return (
    <Badge
      variant="emerald"
      size="sm"
      aria-label={`Question status: Mastered, due in ${days} day${days === 1 ? '' : 's'}`}
    >
      {label}
    </Badge>
  );
}
