/**
 * UnvettedFlag — warning indicator for auto-generated, unreviewed questions.
 *
 * Renders only when `unvetted` is true. Combines IconBox (warning icon) with a
 * Badge label and an accessible tooltip via aria-describedby.
 *
 * Uses `IconBox` and `Badge` from `@/components/ui`.
 */

import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { IconBox } from '../../ui/IconBox';
import { Badge } from '../../ui/Badge';
import { cn } from '../../ui/cn';

interface UnvettedFlagProps {
  /** Whether this question is auto-generated and not yet expert-reviewed. */
  unvetted: boolean;
}

const TOOLTIP_ID = 'unvetted-tooltip';

export function UnvettedFlag({ unvetted }: UnvettedFlagProps) {
  const [tooltipVisible, setTooltipVisible] = useState(false);

  if (!unvetted) return null;

  return (
    <span className="relative inline-flex items-center gap-1.5">
      {/* Icon trigger */}
      <span
        role="img"
        aria-describedby={TOOLTIP_ID}
        aria-label="Auto-generated question"
        className="inline-flex items-center cursor-help"
        onMouseEnter={() => setTooltipVisible(true)}
        onMouseLeave={() => setTooltipVisible(false)}
        onFocus={() => setTooltipVisible(true)}
        onBlur={() => setTooltipVisible(false)}
        tabIndex={0}
      >
        <IconBox
          size="sm"
          variant="topaz"
          className="w-6 h-6"
          aria-hidden="true"
        >
          <AlertTriangle className="w-3.5 h-3.5" />
        </IconBox>
      </span>

      {/* Badge label */}
      <Badge variant="topaz" size="sm">
        Auto-generated
      </Badge>

      {/* Tooltip */}
      <span
        id={TOOLTIP_ID}
        role="tooltip"
        className={cn(
          'absolute bottom-full left-0 mb-2 z-50',
          'w-56 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2',
          'text-xs text-amber-800 shadow-md',
          'transition-opacity duration-150',
          tooltipVisible ? 'opacity-100' : 'opacity-0 pointer-events-none',
        )}
      >
        Auto-generated, not yet expert-reviewed. Treat this question with extra
        scepticism and check the source article if unsure.
      </span>
    </span>
  );
}
