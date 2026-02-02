/**
 * Dispersion Calculator
 * Calculate fire/dispersion from RI at different wavelengths
 */

import { useCalculatorForm } from '../../hooks/useCalculatorForm';
import { useCalculatorData } from '../../hooks/useCalculatorData';
import { validateRI } from './ValidationMessage';
import { FormField, NumberInput } from '../form';
import { ClassifiedResult } from './results';

// Fallback data if database is unavailable
const FALLBACK_GEMS_DISPERSION = [
  { name: 'Diamond', dispersion: 0.044, ri: 2.417 },
  { name: 'Zircon', dispersion: 0.039, ri: 1.960 },
  { name: 'Sphene', dispersion: 0.051, ri: 1.900 },
  { name: 'Demantoid Garnet', dispersion: 0.057, ri: 1.888 },
  { name: 'Ruby/Sapphire', dispersion: 0.018, ri: 1.762 },
  { name: 'Spinel', dispersion: 0.020, ri: 1.718 },
  { name: 'Topaz', dispersion: 0.014, ri: 1.619 },
  { name: 'Tourmaline', dispersion: 0.017, ri: 1.624 },
  { name: 'Quartz', dispersion: 0.013, ri: 1.544 },
  { name: 'Emerald', dispersion: 0.014, ri: 1.577 },
];

function classifyDispersion(dispersion: number): { category: string; level: 'low' | 'medium' | 'high' | 'very-high' } {
  if (dispersion < 0.020) return { category: 'Low', level: 'low' };
  if (dispersion < 0.030) return { category: 'Moderate', level: 'medium' };
  if (dispersion < 0.040) return { category: 'High', level: 'high' };
  return { category: 'Very High', level: 'very-high' };
}

export function DispersionCalculator() {
  const { mineralsWithDispersion, dbAvailable, loading } = useCalculatorData();

  // Use database data if available, otherwise fallback
  const dispersionGems = dbAvailable && mineralsWithDispersion.length > 0
    ? mineralsWithDispersion.map(m => ({
        name: m.name,
        dispersion: m.dispersion ?? 0,
        ri: m.ri_min && m.ri_max ? (m.ri_min + m.ri_max) / 2 : 0,
      }))
    : FALLBACK_GEMS_DISPERSION;

  const { values, errors, result, setValue } = useCalculatorForm({
    fields: {
      riRed: {
        validate: validateRI,
        parse: parseFloat,
      },
      riViolet: {
        validate: validateRI,
        parse: parseFloat,
      },
    },
    crossValidate: ({ riRed, riViolet }) => {
      const red = parseFloat(riRed);
      const violet = parseFloat(riViolet);
      if (!isNaN(red) && !isNaN(violet) && violet <= red) {
        return { riViolet: 'RI at violet must be greater than RI at red' };
      }
      return {};
    },
    compute: ({ riRed, riViolet }) => {
      if (riRed === undefined || riViolet === undefined) return null;
      if (riViolet <= riRed) return null;
      const dispersion = riViolet - riRed;
      const { category, level } = classifyDispersion(dispersion);
      return { dispersion, category, level };
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-slate-600">
          Enter the refractive index at red (C-line, 656nm) and violet (F-line, 486nm) wavelengths to calculate dispersion.
        </p>
        <p className="text-xs text-slate-500 mt-2">
          <strong>Formula:</strong> Dispersion = RI(violet) − RI(red)
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <FormField
          name="ri-red"
          label="RI at Red (C-line 656nm)"
          error={errors.riRed}
        >
          <NumberInput
            value={values.riRed}
            onChange={(v) => setValue('riRed', v)}
            min={1}
            max={3}
            step={0.001}
            placeholder="e.g., 2.407"
          />
        </FormField>

        <FormField
          name="ri-violet"
          label="RI at Violet (F-line 486nm)"
          error={errors.riViolet}
        >
          <NumberInput
            value={values.riViolet}
            onChange={(v) => setValue('riViolet', v)}
            min={1}
            max={3}
            step={0.001}
            placeholder="e.g., 2.451"
          />
        </FormField>
      </div>

      {result && (
        <ClassifiedResult
          value={result.dispersion}
          precision={3}
          label={`Dispersion (${result.category})`}
          classification={`${result.category === 'Very High' || result.category === 'High' ? 'Excellent' : result.category === 'Moderate' ? 'Good' : 'Low'} spectral color separation`}
          classificationLevel={result.level}
        />
      )}

      <div className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-slate-900">Gem Dispersion Reference</h4>
          {dbAvailable && (
            <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">
              {dispersionGems.length} gems from database
            </span>
          )}
        </div>
        {loading ? (
          <div className="text-center py-4 text-slate-500 text-sm">Loading gem data...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-slate-700">Gem</th>
                  <th className="px-3 py-2 text-left font-medium text-slate-700">Dispersion</th>
                  <th className="px-3 py-2 text-left font-medium text-slate-700">RI (avg)</th>
                  <th className="px-3 py-2 text-left font-medium text-slate-700">Fire</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dispersionGems.slice(0, 15).map((gem) => (
                  <tr key={gem.name} className="hover:bg-slate-50">
                    <td className="px-3 py-2 text-slate-900">{gem.name}</td>
                    <td className="px-3 py-2 font-mono text-slate-700">{gem.dispersion.toFixed(3)}</td>
                    <td className="px-3 py-2 font-mono text-slate-600">{gem.ri > 0 ? gem.ri.toFixed(3) : '—'}</td>
                    <td className="px-3 py-2 text-slate-600">
                      {gem.dispersion >= 0.040 ? 'Very High' : gem.dispersion >= 0.030 ? 'High' : gem.dispersion >= 0.020 ? 'Moderate' : 'Low'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">Why Dispersion Matters</h4>
        <p className="text-sm text-blue-800">
          Dispersion measures how much a gem splits white light into spectral colors. Higher dispersion creates more "fire" — the rainbow flashes seen in a well-cut stone. Diamond's high dispersion (0.044) is why it shows exceptional fire, while quartz's low dispersion (0.013) produces minimal color flashes.
        </p>
      </div>
    </div>
  );
}
