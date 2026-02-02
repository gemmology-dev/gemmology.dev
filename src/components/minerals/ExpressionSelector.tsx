import { useRef, useEffect, useState } from 'react';
import { cn } from '../ui/cn';
import type { MineralExpression } from '../../lib/db';

interface ExpressionSelectorProps {
  expressions: MineralExpression[];
  selected: string;
  onSelect: (expressionId: string) => void;
  className?: string;
}

/**
 * Horizontal scrollable gallery for selecting crystal form variants.
 * Shows thumbnails of each expression with the selected one highlighted.
 */
export function ExpressionSelector({
  expressions,
  selected,
  onSelect,
  className,
}: ExpressionSelectorProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(false);

  // Check scroll position to show/hide fade edges
  const updateScrollFades = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftFade(scrollLeft > 8);
      setShowRightFade(scrollLeft < scrollWidth - clientWidth - 8);
    }
  };

  useEffect(() => {
    updateScrollFades();
    const scrollEl = scrollRef.current;
    if (scrollEl) {
      scrollEl.addEventListener('scroll', updateScrollFades);
      window.addEventListener('resize', updateScrollFades);
      return () => {
        scrollEl.removeEventListener('scroll', updateScrollFades);
        window.removeEventListener('resize', updateScrollFades);
      };
    }
  }, [expressions]);

  // Scroll selected item into view when selection changes
  useEffect(() => {
    if (scrollRef.current) {
      const selectedEl = scrollRef.current.querySelector(`[data-expression-id="${selected}"]`);
      if (selectedEl) {
        selectedEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [selected]);

  if (expressions.length <= 1) {
    return null;
  }

  return (
    <div className={cn('relative', className)}>
      {/* Horizontal Scroll Container */}
      <div
        ref={scrollRef}
        className={cn(
          'flex gap-3 overflow-x-auto pb-2 -mx-4 px-4',
          'scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent'
        )}
      >
        {expressions.map((expr) => (
          <button
            key={expr.id}
            data-expression-id={expr.id}
            onClick={() => onSelect(expr.id)}
            className={cn(
              'flex-shrink-0 w-24 rounded-lg overflow-hidden transition-all duration-200',
              'border-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
              selected === expr.id
                ? 'border-blue-500 shadow-md shadow-blue-500/20 scale-105'
                : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
            )}
            title={expr.name}
            aria-pressed={selected === expr.id}
          >
            {/* Thumbnail */}
            <div className="aspect-square bg-slate-50 p-2">
              {expr.model_svg ? (
                <div
                  className="w-full h-full [&>svg]:w-full [&>svg]:h-full"
                  dangerouslySetInnerHTML={{ __html: expr.model_svg }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300">
                  <CrystalIcon className="w-8 h-8" />
                </div>
              )}
            </div>

            {/* Label */}
            <div className="px-2 py-1.5 text-center border-t border-slate-100">
              <span className={cn(
                'text-xs font-medium truncate block',
                selected === expr.id ? 'text-blue-700' : 'text-slate-600'
              )}>
                {expr.name}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Fade edges on scroll */}
      <div
        className={cn(
          'absolute left-0 top-0 bottom-2 w-8 bg-gradient-to-r from-white to-transparent pointer-events-none transition-opacity',
          showLeftFade ? 'opacity-100' : 'opacity-0'
        )}
      />
      <div
        className={cn(
          'absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none transition-opacity',
          showRightFade ? 'opacity-100' : 'opacity-0'
        )}
      />
    </div>
  );
}

/**
 * Small crystal icon placeholder.
 */
function CrystalIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  );
}

export default ExpressionSelector;
