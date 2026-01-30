/**
 * Consolidated result display components for calculator tools.
 *
 * @example
 * ```tsx
 * import { NumberResult, ClassifiedResult, GemMatchBadges } from './results';
 *
 * // Simple numeric result
 * <NumberResult value={sg} precision={2} label="Specific Gravity" copyable />
 *
 * // Numeric result with classification badge
 * <ClassifiedResult
 *   value={biref}
 *   precision={3}
 *   label="Birefringence"
 *   classification="Low"
 *   classificationLevel="low"
 * />
 *
 * // Gem matches as compact badges
 * <GemMatchBadges
 *   matches={matches.map(g => ({ name: g.name, propertyValue: formatSG(g.sg) }))}
 *   label="Possible Matches"
 * />
 * ```
 */

// Base container
export { ResultContainer } from './ResultContainer';

// Result displays
export { NumberResult } from './NumberResult';
export { ClassifiedResult } from './ClassifiedResult';
export { MultiValueResult } from './MultiValueResult';

// Gem match displays
export { GemMatchBadges } from './GemMatchBadges';
export { GemMatchCard } from './GemMatchCard';
export { GemMatchList } from './GemMatchList';
