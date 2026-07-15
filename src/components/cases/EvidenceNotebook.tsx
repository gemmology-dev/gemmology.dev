/**
 * EvidenceNotebook — the running list of evidence revealed so far in a case.
 *
 * Responsive layout without a media-query hook (SSR/hydration safe):
 * - `lg:` and up: an always-open sticky right rail.
 * - below `lg:`: a collapsible `<details>` disclosure ("Evidence (n)") shown
 *   above the step panel.
 *
 * Both variants render the same list (in accumulation/reveal order — the
 * notebook never reorders evidence); only one is visible at a given
 * viewport width via Tailwind responsive display classes.
 */

import { Badge } from '../ui/Badge';
import type { EvidenceItem } from '../../lib/cases/case-types';

interface EvidenceNotebookProps {
  evidence: EvidenceItem[];
}

function EvidenceList({ evidence }: { evidence: EvidenceItem[] }) {
  if (evidence.length === 0) {
    return <p className="text-sm text-slate-500">No evidence gathered yet.</p>;
  }

  return (
    <ul className="space-y-3">
      {evidence.map((item) => (
        <li key={item.id} className="rounded-lg border border-slate-200 bg-white p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-slate-800">{item.label}</span>
            <Badge variant="outline" size="sm">{item.kind}</Badge>
          </div>
          <p className="mt-1 text-sm text-slate-700">{item.value}</p>
          {item.detail && <p className="mt-1 text-xs text-slate-500">{item.detail}</p>}
          {item.toolHref && (
            <a
              href={item.toolHref}
              className="mt-1 inline-block text-xs font-medium text-crystal-700 hover:text-crystal-900 hover:underline"
            >
              Open tool &rarr;
            </a>
          )}
        </li>
      ))}
    </ul>
  );
}

export function EvidenceNotebook({ evidence }: EvidenceNotebookProps) {
  return (
    <>
      {/* Below lg: collapsible disclosure above the step panel. */}
      <details className="lg:hidden mb-4 rounded-lg border border-slate-200 bg-slate-50 open:bg-white">
        <summary className="cursor-pointer select-none px-4 py-3 text-sm font-semibold text-slate-800">
          Evidence ({evidence.length})
        </summary>
        <div className="px-4 pb-4">
          <EvidenceList evidence={evidence} />
        </div>
      </details>

      {/* lg and up: always-open sticky right rail. */}
      <aside className="hidden lg:block lg:sticky lg:top-24 lg:w-72 lg:flex-shrink-0">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <h3 className="mb-3 text-sm font-semibold text-slate-800">
            Evidence ({evidence.length})
          </h3>
          <EvidenceList evidence={evidence} />
        </div>
      </aside>
    </>
  );
}
