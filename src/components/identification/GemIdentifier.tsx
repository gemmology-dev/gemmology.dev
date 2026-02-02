/**
 * Unified Gem Identification Tool.
 * Allows users to input multiple gemmological properties to find matching gems.
 * Uses optic character first approach for realistic refractometer workflow.
 */

import { useState, useMemo, useEffect } from 'react';
import { FormField, NumberInput, Select } from '../form';
import { validateNumber } from '../calculator/ValidationMessage';
import {
  useGemIdentification,
  DEFAULT_TOLERANCES,
  type IdentificationCriteria,
  type ToleranceSettings,
} from '../../hooks/useGemIdentification';
import { IdentificationMatchCard } from './IdentificationMatchCard';
import { cn, Pagination } from '../ui';
import { usePagination } from '../../hooks/usePagination';

type OpticCharacter = 'unknown' | 'isotropic' | 'uniaxial' | 'biaxial';

const OPTIC_CHARACTER_OPTIONS = [
  { value: 'unknown', label: 'Unknown / Quick Search' },
  { value: 'isotropic', label: 'Isotropic (Single RI)' },
  { value: 'uniaxial', label: 'Uniaxial (Two RIs)' },
  { value: 'biaxial', label: 'Biaxial (Two RIs)' },
];

const TOLERANCE_OPTIONS = {
  ri: [
    { value: '0.005', label: '± 0.005 (Narrow)' },
    { value: '0.01', label: '± 0.01 (Standard)' },
    { value: '0.02', label: '± 0.02 (Wide)' },
    { value: '0.05', label: '± 0.05 (Very Wide)' },
  ],
  sg: [
    { value: '0.02', label: '± 0.02 (Narrow)' },
    { value: '0.05', label: '± 0.05 (Standard)' },
    { value: '0.1', label: '± 0.1 (Wide)' },
    { value: '0.2', label: '± 0.2 (Very Wide)' },
  ],
  birefringence: [
    { value: '0.002', label: '± 0.002 (Narrow)' },
    { value: '0.005', label: '± 0.005 (Standard)' },
    { value: '0.01', label: '± 0.01 (Wide)' },
  ],
  dispersion: [
    { value: '0.002', label: '± 0.002 (Narrow)' },
    { value: '0.003', label: '± 0.003 (Standard)' },
    { value: '0.005', label: '± 0.005 (Wide)' },
  ],
  hardness: [
    { value: '0.25', label: '± 0.25 (Narrow)' },
    { value: '0.5', label: '± 0.5 (Standard)' },
    { value: '1', label: '± 1 (Wide)' },
  ],
};

const OPTIC_SIGN_OPTIONS = [
  { value: '', label: 'Any sign' },
  { value: '+', label: 'Positive (+)' },
  { value: '-', label: 'Negative (-)' },
];

export function GemIdentifier() {
  // Optic character selection (determines RI input mode)
  const [opticCharacter, setOpticCharacter] = useState<OpticCharacter>('unknown');

  // RI values - single for isotropic/unknown, min/max for uniaxial/biaxial
  const [riSingle, setRiSingle] = useState('');
  const [riMin, setRiMin] = useState('');
  const [riMax, setRiMax] = useState('');

  // Other property values
  const [sg, setSg] = useState('');
  const [dispersion, setDispersion] = useState('');
  const [hardness, setHardness] = useState('');
  const [crystalSystem, setCrystalSystem] = useState('');
  const [opticSign, setOpticSign] = useState('');

  // Tolerance settings
  const [tolerances, setTolerances] = useState<ToleranceSettings>(DEFAULT_TOLERANCES);

  // Show/hide advanced options
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Hook for matching
  const { findMatches, crystalSystems, loading, error, mineralsCount, dbAvailable } = useGemIdentification();

  // Determine if we're using single or dual RI mode
  const isDualRIMode = opticCharacter === 'uniaxial' || opticCharacter === 'biaxial';

  // Validation
  const riSingleError = riSingle ? validateNumber(riSingle, { min: 1, max: 3, label: 'RI' }) : null;
  const riMinError = riMin ? validateNumber(riMin, { min: 1, max: 3, label: 'RI Min' }) : null;
  const riMaxError = riMax ? validateNumber(riMax, { min: 1, max: 3, label: 'RI Max' }) : null;

  // Cross-validation for RI min/max
  const riRangeError = useMemo(() => {
    if (!isDualRIMode || !riMin || !riMax) return null;
    const min = parseFloat(riMin);
    const max = parseFloat(riMax);
    if (!isNaN(min) && !isNaN(max) && min > max) {
      return 'RI Min must be less than or equal to RI Max';
    }
    return null;
  }, [isDualRIMode, riMin, riMax]);

  const sgError = sg ? validateNumber(sg, { min: 1, max: 8, label: 'SG' }) : null;
  const dispersionError = dispersion
    ? validateNumber(dispersion, { min: 0, max: 0.2, label: 'Dispersion' })
    : null;
  const hardnessError = hardness
    ? validateNumber(hardness, { min: 1, max: 10, label: 'Hardness' })
    : null;

  // Auto-calculated birefringence (for dual RI mode)
  const calculatedBirefringence = useMemo(() => {
    if (!isDualRIMode || !riMin || !riMax || riMinError || riMaxError || riRangeError) return null;
    const min = parseFloat(riMin);
    const max = parseFloat(riMax);
    if (isNaN(min) || isNaN(max)) return null;
    return max - min;
  }, [isDualRIMode, riMin, riMax, riMinError, riMaxError, riRangeError]);

  // Build criteria object
  const criteria: IdentificationCriteria = useMemo(() => {
    const result: IdentificationCriteria = {};

    // Handle RI based on mode
    if (isDualRIMode) {
      const min = parseFloat(riMin);
      const max = parseFloat(riMax);
      if (!isNaN(min) && !riMinError) result.riMin = min;
      if (!isNaN(max) && !riMaxError) result.riMax = max;
      // Also include birefringence from the calculated value
      if (calculatedBirefringence !== null && calculatedBirefringence > 0) {
        result.birefringence = calculatedBirefringence;
      }
    } else {
      const ri = parseFloat(riSingle);
      if (!isNaN(ri) && !riSingleError) result.ri = ri;
    }

    const sgNum = parseFloat(sg);
    if (!isNaN(sgNum) && !sgError) result.sg = sgNum;

    const dispNum = parseFloat(dispersion);
    if (!isNaN(dispNum) && !dispersionError) result.dispersion = dispNum;

    const hardNum = parseFloat(hardness);
    if (!isNaN(hardNum) && !hardnessError) result.hardness = hardNum;

    if (crystalSystem) result.crystalSystem = crystalSystem;
    if (opticSign === '+' || opticSign === '-') result.opticSign = opticSign;

    // Set optic character for filtering (isotropic gems have no birefringence)
    if (opticCharacter === 'isotropic') {
      result.opticCharacter = 'isotropic';
    } else if (opticCharacter === 'uniaxial' || opticCharacter === 'biaxial') {
      result.opticCharacter = opticCharacter;
    }

    return result;
  }, [
    isDualRIMode, riSingle, riMin, riMax, sg, dispersion, hardness,
    crystalSystem, opticSign, opticCharacter, calculatedBirefringence,
    riSingleError, riMinError, riMaxError, sgError, dispersionError, hardnessError
  ]);

  // Calculate matches
  const results = useMemo(() => {
    return findMatches(criteria, tolerances);
  }, [findMatches, criteria, tolerances]);

  // Pagination for results
  const { page, params: paginationParams, onPageChange, onPageSizeChange, resetPage } = usePagination({
    initialPageSize: 10,
  });

  // Reset pagination when results change
  useEffect(() => {
    resetPage();
  }, [results.length, resetPage]);

  // Paginate results
  const totalPages = Math.ceil(results.length / paginationParams.pageSize);
  const startIndex = (page - 1) * paginationParams.pageSize;
  const paginatedResults = results.slice(startIndex, startIndex + paginationParams.pageSize);
  const resultsPagination = {
    page,
    pageSize: paginationParams.pageSize,
    total: results.length,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };

  // Count active criteria
  const activeCriteria = Object.keys(criteria).filter(k => k !== 'opticCharacter').length;

  // Crystal system options
  const crystalSystemOptions = useMemo(() => [
    { value: '', label: 'Any system' },
    ...crystalSystems.map(sys => ({ value: sys, label: sys })),
  ], [crystalSystems]);

  // Handle tolerance change
  const handleToleranceChange = (key: keyof ToleranceSettings, value: string) => {
    setTolerances(prev => ({
      ...prev,
      [key]: parseFloat(value),
    }));
  };

  // Handle optic character change - clear RI fields when switching modes
  const handleOpticCharacterChange = (value: string) => {
    const newChar = value as OpticCharacter;
    setOpticCharacter(newChar);

    // Clear RI fields when switching modes
    if (newChar === 'isotropic' || newChar === 'unknown') {
      setRiMin('');
      setRiMax('');
    } else {
      setRiSingle('');
    }

    // Clear optic sign for isotropic
    if (newChar === 'isotropic') {
      setOpticSign('');
    }
  };

  // Clear all inputs
  const handleClear = () => {
    setOpticCharacter('unknown');
    setRiSingle('');
    setRiMin('');
    setRiMax('');
    setSg('');
    setDispersion('');
    setHardness('');
    setCrystalSystem('');
    setOpticSign('');
  };

  if (loading) {
    return (
      <div className="p-4 text-center text-slate-500">
        Loading mineral database...
      </div>
    );
  }

  if (error && !dbAvailable) {
    return (
      <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
        Failed to load mineral database: {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-slate-600">
          Enter measured gemmological properties to find matching gemstones.
          Start by selecting the optic character from your polariscope observation.
        </p>
        {dbAvailable && (
          <p className="text-xs text-slate-500 mt-1">
            Searching {mineralsCount} minerals in database
          </p>
        )}
      </div>

      {/* Step 1: Optic Character Selection */}
      <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
        <FormField
          name="id-optic-character"
          label="Step 1: Optic Character"
          hint="From polariscope observation"
        >
          <Select
            options={OPTIC_CHARACTER_OPTIONS}
            value={opticCharacter}
            onChange={handleOpticCharacterChange}
          />
        </FormField>
      </div>

      {/* Step 2: RI Reading(s) */}
      <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-4">
        <h3 className="text-sm font-medium text-slate-700">
          Step 2: Refractometer Readings
        </h3>

        {isDualRIMode ? (
          <>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <FormField
                  name="id-ri-min"
                  label="RI Minimum (ω or α)"
                  error={riMinError}
                  hint="Lower shadow edge reading"
                >
                  <NumberInput
                    value={riMin}
                    onChange={setRiMin}
                    min={1}
                    max={3}
                    step={0.001}
                    placeholder="e.g., 1.544"
                  />
                </FormField>
              </div>

              <div className="space-y-1">
                <FormField
                  name="id-ri-max"
                  label="RI Maximum (ε or γ)"
                  error={riMaxError || riRangeError}
                  hint="Upper shadow edge reading"
                >
                  <NumberInput
                    value={riMax}
                    onChange={setRiMax}
                    min={1}
                    max={3}
                    step={0.001}
                    placeholder="e.g., 1.553"
                  />
                </FormField>
              </div>
            </div>

            {/* Auto-calculated birefringence display */}
            {calculatedBirefringence !== null && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm text-emerald-700">
                  <strong>Birefringence:</strong> {calculatedBirefringence.toFixed(3)}
                  {calculatedBirefringence === 0 && ' (Isotropic?)'}
                  {calculatedBirefringence > 0 && calculatedBirefringence < 0.010 && ' (Low)'}
                  {calculatedBirefringence >= 0.010 && calculatedBirefringence < 0.025 && ' (Moderate)'}
                  {calculatedBirefringence >= 0.025 && calculatedBirefringence < 0.050 && ' (High)'}
                  {calculatedBirefringence >= 0.050 && ' (Very High)'}
                </span>
              </div>
            )}

            <Select
              options={TOLERANCE_OPTIONS.ri}
              value={tolerances.ri.toString()}
              onChange={(v) => handleToleranceChange('ri', v)}
            />
          </>
        ) : (
          <div className="space-y-1">
            <FormField
              name="id-ri-single"
              label="Refractive Index"
              error={riSingleError}
              hint={opticCharacter === 'isotropic' ? 'Single reading for isotropic gem' : 'Enter observed RI value'}
            >
              <NumberInput
                value={riSingle}
                onChange={setRiSingle}
                min={1}
                max={3}
                step={0.001}
                placeholder="e.g., 1.544"
              />
            </FormField>
            <Select
              options={TOLERANCE_OPTIONS.ri}
              value={tolerances.ri.toString()}
              onChange={(v) => handleToleranceChange('ri', v)}
            />
          </div>
        )}
      </div>

      {/* Step 3: Additional Properties */}
      <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-4">
        <h3 className="text-sm font-medium text-slate-700">
          Step 3: Additional Properties (Optional)
        </h3>

        {/* SG */}
        <div className="space-y-1">
          <FormField
            name="id-sg"
            label="Specific Gravity"
            error={sgError}
            hint="From hydrostatic weighing"
          >
            <NumberInput
              value={sg}
              onChange={setSg}
              min={1}
              max={8}
              step={0.01}
              placeholder="e.g., 2.65"
            />
          </FormField>
          <Select
            options={TOLERANCE_OPTIONS.sg}
            value={tolerances.sg.toString()}
            onChange={(v) => handleToleranceChange('sg', v)}
          />
        </div>

        {/* Secondary properties in grid */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <FormField
              name="id-dispersion"
              label="Dispersion"
              error={dispersionError}
            >
              <NumberInput
                value={dispersion}
                onChange={setDispersion}
                min={0}
                max={0.2}
                step={0.001}
                placeholder="e.g., 0.044"
              />
            </FormField>
            <Select
              options={TOLERANCE_OPTIONS.dispersion}
              value={tolerances.dispersion.toString()}
              onChange={(v) => handleToleranceChange('dispersion', v)}
            />
          </div>

          <div className="space-y-1">
            <FormField
              name="id-hardness"
              label="Hardness (Mohs)"
              error={hardnessError}
            >
              <NumberInput
                value={hardness}
                onChange={setHardness}
                min={1}
                max={10}
                step={0.5}
                placeholder="e.g., 7"
              />
            </FormField>
            <Select
              options={TOLERANCE_OPTIONS.hardness}
              value={tolerances.hardness.toString()}
              onChange={(v) => handleToleranceChange('hardness', v)}
            />
          </div>
        </div>

        {/* Crystal System and Optic Sign */}
        <div className="grid md:grid-cols-2 gap-4">
          <FormField name="id-crystal-system" label="Crystal System">
            <Select
              options={crystalSystemOptions}
              value={crystalSystem}
              onChange={setCrystalSystem}
              placeholder="Any system"
            />
          </FormField>

          {/* Only show optic sign for non-isotropic */}
          {opticCharacter !== 'isotropic' && (
            <FormField name="id-optic-sign" label="Optic Sign">
              <Select
                options={OPTIC_SIGN_OPTIONS}
                value={opticSign}
                onChange={setOpticSign}
                placeholder="Any sign"
              />
            </FormField>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handleClear}
          className="text-sm text-slate-600 hover:text-slate-900 underline"
        >
          Clear all
        </button>
        <span className="text-sm text-slate-500">
          {activeCriteria} {activeCriteria === 1 ? 'property' : 'properties'} entered
        </span>
      </div>

      {/* Results */}
      {activeCriteria === 0 ? (
        <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 text-sm text-center">
          Enter at least one property to find matches
        </div>
      ) : results.length === 0 ? (
        <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-sm text-center">
          No minerals match the given criteria. Try widening the tolerances or reducing the number of properties.
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-slate-700">
              {results.length} {results.length === 1 ? 'Match' : 'Matches'} Found
            </h4>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs text-slate-500 hover:text-slate-700"
            >
              {showAdvanced ? 'Hide' : 'Show'} details
            </button>
          </div>

          <div className="space-y-3">
            {paginatedResults.map((result, index) => (
              <IdentificationMatchCard
                key={`${result.mineral.id}-${index}`}
                result={result}
                showDetails={showAdvanced}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <Pagination
              pagination={resultsPagination}
              onPageChange={onPageChange}
              onPageSizeChange={onPageSizeChange}
              showPageSize
            />
          )}
        </div>
      )}

      {/* Help section */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-slate-900 mb-2">Identification Workflow</h4>
        <ol className="text-sm text-slate-600 space-y-1 list-decimal list-inside">
          <li>Observe optic character with polariscope (isotropic vs anisotropic)</li>
          <li>Take refractometer reading(s) - one for isotropic, two for anisotropic</li>
          <li>Measure SG with hydrostatic weighing</li>
          <li>Note other properties (pleochroism, spectrum, inclusions)</li>
          <li>Compare against database matches</li>
        </ol>
        <p className="text-xs text-slate-500 mt-3">
          Confidence: 90%+ excellent, 70-89% good, 50-69% partial
        </p>
      </div>
    </div>
  );
}
