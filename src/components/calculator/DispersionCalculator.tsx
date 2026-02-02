/**
 * Dispersion Calculator
 * Calculate fire/dispersion from RI at different wavelengths
 */

import { useState, useEffect } from 'react';
import { useCalculatorForm } from '../../hooks/useCalculatorForm';
import { usePagination } from '../../hooks/usePagination';
import { getMineralsWithDispersionPaginated, type Mineral, type PaginatedResult } from '../../lib/db';
import { validateRI } from './ValidationMessage';
import { FormField, NumberInput } from '../form';
import { ClassifiedResult } from './results';
import { PaginatedTable } from '../ui';

function classifyDispersion(dispersion: number): { category: string; level: 'low' | 'medium' | 'high' | 'very-high' } {
  if (dispersion < 0.020) return { category: 'Low', level: 'low' };
  if (dispersion < 0.030) return { category: 'Moderate', level: 'medium' };
  if (dispersion < 0.040) return { category: 'High', level: 'high' };
  return { category: 'Very High', level: 'very-high' };
}

export function DispersionCalculator() {
  const [loading, setLoading] = useState(true);
  const [paginatedData, setPaginatedData] = useState<PaginatedResult<Mineral> | null>(null);

  const { params, onPageChange, onPageSizeChange } = usePagination<Mineral>({
    initialPageSize: 15,
  });

  // Fetch paginated data from database
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const result = await getMineralsWithDispersionPaginated(params);
        setPaginatedData(result);
      } catch (err) {
        console.warn('Failed to load dispersion data:', err);
        setPaginatedData(null);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [params]);

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

  // Define table columns
  const columns = [
    { key: 'name', header: 'Gem' },
    { key: 'dispersion', header: 'Dispersion', mono: true },
    { key: 'ri', header: 'RI (avg)', mono: true },
    { key: 'fire', header: 'Fire' },
  ];

  // Map mineral to table row
  const rowMapper = (m: Mineral) => {
    const dispersion = Number(m.dispersion) || 0;
    const ri = m.ri_min && m.ri_max ? (Number(m.ri_min) + Number(m.ri_max)) / 2 : 0;
    return {
      name: m.name,
      dispersion: dispersion.toFixed(3),
      ri: ri > 0 ? ri.toFixed(3) : '—',
      fire: dispersion >= 0.040 ? 'Very High' : dispersion >= 0.030 ? 'High' : dispersion >= 0.020 ? 'Moderate' : 'Low',
    };
  };

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
        <h4 className="text-sm font-semibold text-slate-900 mb-3">Gem Dispersion Reference</h4>
        <PaginatedTable
          columns={columns}
          data={paginatedData}
          rowMapper={rowMapper}
          loading={loading}
          emptyMessage="No dispersion data available."
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          showPageSize
          showTotalBadge
          variant="minimal"
        />
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
