/**
 * Optic-sign / 2V reasoner.
 *
 * The user reports the optic character seen in the polariscope plus the
 * relevant refractive indices (ω/ε for uniaxial, α/β/γ for biaxial). The
 * widget computes the optic sign, birefringence, and 2V (when applicable),
 * then ranks candidate species from the database whose stored
 * `optical_character` matches the observation.
 *
 * The mineral DB stores optic character as freeform text — we parse it via
 * `parseOpticalCharacter()` so no SQL schema migration is needed.
 */

import { useEffect, useMemo, useState } from 'react';
import { getAllMinerals, type Mineral } from '../../lib/db';
import {
  parseOpticalCharacter,
  uniaxialSign,
  biaxialSign,
  biaxial2V,
  characterMatches,
  type OpticCharacterKind,
  type OpticSign,
} from '../../lib/optic-sign/optic-character';
import { FormField, NumberInput, Select } from '../form';
import { Pagination } from '../ui';
import { usePagination } from '../../hooks/usePagination';

const CHARACTER_OPTIONS: { value: OpticCharacterKind; label: string }[] = [
  { value: 'isotropic', label: 'Isotropic (single dark cross or dark all rotations)' },
  { value: 'uniaxial', label: 'Uniaxial (one optic axis)' },
  { value: 'biaxial', label: 'Biaxial (two optic axes)' },
  { value: 'aggregate', label: 'Aggregate (snake-like flickering = AGG)' },
];

interface MatchRow {
  mineral: Mineral;
  riOverlap: boolean;
  birefringenceOverlap: boolean;
}

const SIGN_LABEL: Record<OpticSign, string> = {
  '+': 'positive',
  '-': 'negative',
  '+/-': 'either sign (variable)',
  'n/a': '— not applicable —',
};

export function OpticSignReasoner() {
  const [minerals, setMinerals] = useState<Mineral[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);

  const [character, setCharacter] = useState<OpticCharacterKind>('uniaxial');
  const [omega, setOmega] = useState('');
  const [epsilon, setEpsilon] = useState('');
  const [alpha, setAlpha] = useState('');
  const [beta, setBeta] = useState('');
  const [gamma, setGamma] = useState('');
  const tolerance = 0.005;

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const all = await getAllMinerals();
        if (!mounted) return;
        setMinerals(all);
      } catch (err) {
        if (!mounted) return;
        setDbError(err instanceof Error ? err.message : 'Database load failed');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const computed = useMemo(() => {
    if (character === 'isotropic') {
      return {
        sign: 'n/a' as OpticSign,
        birefringence: 0,
        twoV: null as number | null,
        riCentre: null as number | null,
      };
    }
    if (character === 'aggregate') {
      return {
        sign: 'n/a' as OpticSign,
        birefringence: null,
        twoV: null,
        riCentre: null,
      };
    }
    if (character === 'uniaxial') {
      const o = parseFloat(omega);
      const e = parseFloat(epsilon);
      if (Number.isNaN(o) || Number.isNaN(e)) {
        return { sign: 'n/a' as OpticSign, birefringence: null, twoV: null, riCentre: null };
      }
      return {
        sign: uniaxialSign(o, e),
        birefringence: Math.abs(e - o),
        twoV: null,
        riCentre: (o + e) / 2,
      };
    }
    // biaxial
    const a = parseFloat(alpha);
    const b = parseFloat(beta);
    const g = parseFloat(gamma);
    if (Number.isNaN(a) || Number.isNaN(g)) {
      return { sign: 'n/a' as OpticSign, birefringence: null, twoV: null, riCentre: null };
    }
    const aSorted = Math.min(a, g);
    const gSorted = Math.max(a, g);
    const bUsed = Number.isNaN(b) ? (aSorted + gSorted) / 2 : b;
    return {
      sign: biaxialSign(aSorted, bUsed, gSorted),
      birefringence: gSorted - aSorted,
      twoV: biaxial2V(aSorted, bUsed, gSorted),
      riCentre: (aSorted + gSorted) / 2,
    };
  }, [character, omega, epsilon, alpha, beta, gamma]);

  const matches = useMemo<MatchRow[]>(() => {
    if (minerals.length === 0) return [];
    const out: MatchRow[] = [];
    const obsSign: OpticSign = computed.sign;
    const ri = computed.riCentre;
    const br = computed.birefringence;

    for (const m of minerals) {
      const ref = parseOpticalCharacter(m.optical_character);
      if (!characterMatches(character, obsSign, ref)) continue;

      let riOk = true;
      if (ri !== null && m.ri_min !== undefined && m.ri_max !== undefined) {
        riOk =
          ri >= m.ri_min - tolerance && ri <= m.ri_max + tolerance;
      }

      let brOk = true;
      if (br !== null && br > 0 && m.birefringence !== undefined) {
        brOk = Math.abs(m.birefringence - br) <= 0.01;
      }

      if (!riOk) continue;
      out.push({
        mineral: m,
        riOverlap:
          ri !== null && m.ri_min !== undefined && m.ri_max !== undefined && riOk,
        birefringenceOverlap: brOk && br !== null && br > 0,
      });
    }

    out.sort((x, y) => {
      // Items with both RI and birefringence overlap rank highest.
      const xs = (x.riOverlap ? 2 : 0) + (x.birefringenceOverlap ? 1 : 0);
      const ys = (y.riOverlap ? 2 : 0) + (y.birefringenceOverlap ? 1 : 0);
      if (ys !== xs) return ys - xs;
      return x.mineral.name.localeCompare(y.mineral.name);
    });
    return out;
  }, [minerals, character, computed]);

  const { paged, page, setPage, totalPages } = usePagination(matches, 10);

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-600">
        Pick what you saw in the polariscope. For uniaxial gems, enter ω and ε from the
        refractometer; for biaxial, enter α and γ (β is optional). The reasoner derives optic
        sign, birefringence, and 2V where defined, then ranks candidate species.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField name="optic-character" label="Optic character (polariscope)">
          <Select
            options={CHARACTER_OPTIONS}
            value={character}
            onChange={(v) => setCharacter(v as OpticCharacterKind)}
          />
        </FormField>
      </div>

      {character === 'uniaxial' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField name="omega" label="ω (omega, ordinary ray)">
            <NumberInput value={omega} onChange={setOmega} step={0.001} placeholder="e.g., 1.544" />
          </FormField>
          <FormField name="epsilon" label="ε (epsilon, extraordinary ray)">
            <NumberInput
              value={epsilon}
              onChange={setEpsilon}
              step={0.001}
              placeholder="e.g., 1.553"
            />
          </FormField>
        </div>
      )}

      {character === 'biaxial' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField name="alpha" label="α (lowest RI)">
            <NumberInput value={alpha} onChange={setAlpha} step={0.001} placeholder="e.g., 1.635" />
          </FormField>
          <FormField name="beta" label="β (middle RI, optional)">
            <NumberInput value={beta} onChange={setBeta} step={0.001} placeholder="e.g., 1.651" />
          </FormField>
          <FormField name="gamma" label="γ (highest RI)">
            <NumberInput value={gamma} onChange={setGamma} step={0.001} placeholder="e.g., 1.670" />
          </FormField>
        </div>
      )}

      {/* Computed-output panel */}
      {character !== 'isotropic' && character !== 'aggregate' && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 space-y-1">
          <h4 className="text-sm font-semibold text-emerald-900">Computed</h4>
          <div className="text-sm text-emerald-900">
            Optic sign:{' '}
            <span className="font-mono font-semibold">{SIGN_LABEL[computed.sign]}</span>
          </div>
          {computed.birefringence !== null && computed.birefringence > 0 && (
            <div className="text-sm text-emerald-900">
              Birefringence: <span className="font-mono">{computed.birefringence.toFixed(3)}</span>
            </div>
          )}
          {computed.twoV !== null && (
            <div className="text-sm text-emerald-900">
              2V (Vz, Mallard): <span className="font-mono">{computed.twoV.toFixed(1)}°</span>{' '}
              <span className="text-xs text-emerald-700">
                (acute 2V around γ for biaxial+, around α for biaxial−)
              </span>
            </div>
          )}
        </div>
      )}

      {/* Candidate list */}
      {dbError && (
        <div className="p-3 rounded bg-rose-50 border border-rose-200 text-rose-700 text-sm">
          Database unavailable; candidate ranking is disabled. ({dbError})
        </div>
      )}
      {loading ? (
        <div className="p-3 rounded bg-slate-50 border border-slate-200 text-slate-600 text-sm text-center">
          Loading mineral database…
        </div>
      ) : matches.length === 0 ? (
        <div className="p-3 rounded bg-amber-50 border border-amber-200 text-amber-700 text-sm text-center">
          No species in the database match these readings. Try widening the tolerance, double-check
          the optic character, or confirm the RI readings.
        </div>
      ) : (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-slate-700">
            {matches.length} candidate species
          </h4>
          {paged.map(({ mineral, riOverlap, birefringenceOverlap }) => (
            <div key={mineral.id} className="p-3 rounded-lg bg-white border border-slate-200">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <a
                    href={`/minerals/${mineral.id}`}
                    className="font-semibold text-rose-700 hover:underline"
                  >
                    {mineral.name}
                  </a>
                  {mineral.optical_character && (
                    <span className="ml-2 text-xs text-slate-500">
                      ({mineral.optical_character})
                    </span>
                  )}
                </div>
                <div className="flex gap-1.5">
                  {riOverlap && (
                    <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">
                      RI ✓
                    </span>
                  )}
                  {birefringenceOverlap && (
                    <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">
                      BR ✓
                    </span>
                  )}
                </div>
              </div>
              {(mineral.ri_min !== undefined || mineral.birefringence !== undefined) && (
                <div className="mt-1 text-xs text-slate-600 font-mono">
                  {mineral.ri_min !== undefined &&
                    mineral.ri_max !== undefined &&
                    `RI ${mineral.ri_min.toFixed(3)}–${mineral.ri_max.toFixed(3)}`}
                  {mineral.birefringence !== undefined &&
                    `  ·  BR ${mineral.birefringence.toFixed(3)}`}
                </div>
              )}
            </div>
          ))}
          {totalPages > 1 && (
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          )}
        </div>
      )}
    </div>
  );
}
