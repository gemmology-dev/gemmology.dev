/**
 * Unified Gem Identification Tool.
 * Allows users to input multiple gemmological properties to find matching gems.
 */

import { useState, useMemo } from 'react';
import { FormField, NumberInput, Select } from '../form';
import { validateNumber } from '../calculator/ValidationMessage';
import {
  useGemIdentification,
  DEFAULT_TOLERANCES,
  type IdentificationCriteria,
  type ToleranceSettings,
} from '../../hooks/useGemIdentification';
import { IdentificationMatchCard } from './IdentificationMatchCard';
import { cn } from '../ui';

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
  // Property values
  const [ri, setRi] = useState('');
  const [sg, setSg] = useState('');
  const [birefringence, setBirefringence] = useState('');
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

  // Validation
  const riError = ri ? validateNumber(ri, { min: 1, max: 3, label: 'RI' }) : null;
  const sgError = sg ? validateNumber(sg, { min: 1, max: 8, label: 'SG' }) : null;
  const birefringenceError = birefringence
    ? validateNumber(birefringence, { min: 0, max: 0.5, label: 'Birefringence' })
    : null;
  const dispersionError = dispersion
    ? validateNumber(dispersion, { min: 0, max: 0.2, label: 'Dispersion' })
    : null;
  const hardnessError = hardness
    ? validateNumber(hardness, { min: 1, max: 10, label: 'Hardness' })
    : null;

  // Build criteria object
  const criteria: IdentificationCriteria = useMemo(() => {
    const result: IdentificationCriteria = {};

    const riNum = parseFloat(ri);
    if (!isNaN(riNum) && !riError) result.ri = riNum;

    const sgNum = parseFloat(sg);
    if (!isNaN(sgNum) && !sgError) result.sg = sgNum;

    const birefNum = parseFloat(birefringence);
    if (!isNaN(birefNum) && !birefringenceError) result.birefringence = birefNum;

    const dispNum = parseFloat(dispersion);
    if (!isNaN(dispNum) && !dispersionError) result.dispersion = dispNum;

    const hardNum = parseFloat(hardness);
    if (!isNaN(hardNum) && !hardnessError) result.hardness = hardNum;

    if (crystalSystem) result.crystalSystem = crystalSystem;
    if (opticSign === '+' || opticSign === '-') result.opticSign = opticSign;

    return result;
  }, [ri, sg, birefringence, dispersion, hardness, crystalSystem, opticSign, riError, sgError, birefringenceError, dispersionError, hardnessError]);

  // Calculate matches
  const results = useMemo(() => {
    return findMatches(criteria, tolerances);
  }, [findMatches, criteria, tolerances]);

  // Count active criteria
  const activeCriteria = Object.keys(criteria).length;

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

  // Clear all inputs
  const handleClear = () => {
    setRi('');
    setSg('');
    setBirefringence('');
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
          Enter measured gemmological properties to find matching gemstones. More properties = more precise results.
        </p>
        {dbAvailable && (
          <p className="text-xs text-slate-500 mt-1">
            Searching {mineralsCount} minerals in database
          </p>
        )}
      </div>

      {/* Primary inputs - RI and SG */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <FormField
            name="id-ri"
            label="Refractive Index"
            error={riError}
            hint="Primary identification property"
          >
            <NumberInput
              value={ri}
              onChange={setRi}
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
      </div>

      {/* Secondary inputs */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="space-y-1">
          <FormField
            name="id-birefringence"
            label="Birefringence"
            error={birefringenceError}
          >
            <NumberInput
              value={birefringence}
              onChange={setBirefringence}
              min={0}
              max={0.5}
              step={0.001}
              placeholder="e.g., 0.009"
            />
          </FormField>
          <Select
            options={TOLERANCE_OPTIONS.birefringence}
            value={tolerances.birefringence.toString()}
            onChange={(v) => handleToleranceChange('birefringence', v)}
          />
        </div>

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
              placeholder="e.g., 0.013"
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

      {/* Dropdowns */}
      <div className="grid md:grid-cols-2 gap-4">
        <FormField name="id-crystal-system" label="Crystal System">
          <Select
            options={crystalSystemOptions}
            value={crystalSystem}
            onChange={setCrystalSystem}
            placeholder="Any system"
          />
        </FormField>

        <FormField name="id-optic-sign" label="Optic Sign">
          <Select
            options={OPTIC_SIGN_OPTIONS}
            value={opticSign}
            onChange={setOpticSign}
            placeholder="Any sign"
          />
        </FormField>
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

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {results.slice(0, 20).map((result, index) => (
              <IdentificationMatchCard
                key={`${result.mineral.id}-${index}`}
                result={result}
                showDetails={showAdvanced}
              />
            ))}
            {results.length > 20 && (
              <p className="text-center text-sm text-slate-500 py-2">
                Showing top 20 of {results.length} matches. Narrow your criteria for more precise results.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Help section */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-slate-900 mb-2">Identification Tips</h4>
        <ul className="text-sm text-slate-600 space-y-1">
          <li>• Start with RI and SG - they narrow down candidates quickly</li>
          <li>• Add birefringence to distinguish between similar species</li>
          <li>• Crystal system helps eliminate many possibilities</li>
          <li>• Higher confidence scores indicate better matches</li>
          <li>• 90%+ is excellent, 70-89% is good, 50-69% is partial</li>
        </ul>
      </div>
    </div>
  );
}
