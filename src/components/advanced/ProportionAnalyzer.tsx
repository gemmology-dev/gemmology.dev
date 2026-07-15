/**
 * Gemstone Cut Proportion Analyser
 * Evaluate cut quality based on proportion measurements
 */

import { useState } from 'react';
import {
  gradeRoundBrilliant,
  type GirdleThickness,
  type CuletSize,
  type CutGradeBand,
} from '../../lib/calculator/cut-grades';

const GIRDLE_OPTIONS: { value: GirdleThickness | ''; label: string }[] = [
  { value: '', label: 'not measured' },
  { value: 'extremely-thin', label: 'Extremely thin (chipping risk)' },
  { value: 'very-thin', label: 'Very thin' },
  { value: 'thin', label: 'Thin' },
  { value: 'medium', label: 'Medium' },
  { value: 'slightly-thick', label: 'Slightly thick' },
  { value: 'thick', label: 'Thick' },
  { value: 'very-thick', label: 'Very thick' },
  { value: 'extremely-thick', label: 'Extremely thick (carat-weight penalty)' },
];

const CULET_OPTIONS: { value: CuletSize | ''; label: string }[] = [
  { value: '', label: 'not measured' },
  { value: 'none', label: 'None / pointed' },
  { value: 'very-small', label: 'Very small' },
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'slightly-large', label: 'Slightly large' },
  { value: 'large', label: 'Large' },
  { value: 'very-large', label: 'Very large' },
  { value: 'extremely-large', label: 'Extremely large' },
];

const GIA_BADGE: Record<CutGradeBand, string> = {
  Excellent: 'bg-green-200 dark:bg-emerald-400/10 text-green-800 dark:text-emerald-300',
  'Very Good': 'bg-blue-200 dark:bg-blue-400/10 text-blue-800 dark:text-blue-300',
  Good: 'bg-slate-200 dark:bg-coffee-raised2 text-slate-800 dark:text-cream-secondary',
  Fair: 'bg-amber-200 dark:bg-amber-400/10 text-amber-800 dark:text-amber-300',
  Poor: 'bg-red-200 dark:bg-red-400/10 text-red-800 dark:text-red-300',
};

interface ProportionStandard {
  cut: string;
  gem: string;
  tablePercent: { ideal: string; acceptable: string };
  depthPercent: { ideal: string; acceptable: string };
  crownAngle: { ideal: string; acceptable: string };
  pavilionAngle: { ideal: string; acceptable: string };
  notes: string;
}

interface CutGrade {
  grade: 'Excellent' | 'Very Good' | 'Good' | 'Fair' | 'Poor';
  description: string;
  marketImpact: string;
}

const PROPORTION_STANDARDS: ProportionStandard[] = [
  {
    cut: 'Round Brilliant',
    gem: 'Diamond',
    tablePercent: { ideal: '53-58%', acceptable: '52-62%' },
    depthPercent: { ideal: '59-62.5%', acceptable: '57-64%' },
    crownAngle: { ideal: '34-35°', acceptable: '32-37°' },
    pavilionAngle: { ideal: '40.6-41.0°', acceptable: '39.5-42.0°' },
    notes: 'Tolkowsky proportions for maximum brilliance and fire'
  },
  {
    cut: 'Round Brilliant',
    gem: 'Sapphire/Ruby',
    tablePercent: { ideal: '55-65%', acceptable: '50-70%' },
    depthPercent: { ideal: '65-75%', acceptable: '60-80%' },
    crownAngle: { ideal: '35-40°', acceptable: '30-45°' },
    pavilionAngle: { ideal: '42-45°', acceptable: '40-48°' },
    notes: 'Higher RI requires steeper pavilion than diamond'
  },
  {
    cut: 'Emerald Cut',
    gem: 'Diamond',
    tablePercent: { ideal: '60-68%', acceptable: '55-75%' },
    depthPercent: { ideal: '60-68%', acceptable: '58-72%' },
    crownAngle: { ideal: '12-16°', acceptable: '10-18°' },
    pavilionAngle: { ideal: '42-44°', acceptable: '40-46°' },
    notes: 'Step cut emphasizes clarity over brilliance'
  },
  {
    cut: 'Oval Brilliant',
    gem: 'Diamond',
    tablePercent: { ideal: '53-62%', acceptable: '50-68%' },
    depthPercent: { ideal: '58-65%', acceptable: '56-70%' },
    crownAngle: { ideal: '33-36°', acceptable: '30-38°' },
    pavilionAngle: { ideal: '40-42°', acceptable: '38-44°' },
    notes: 'Length-to-width ratio: 1.35-1.50 ideal'
  },
  {
    cut: 'Cushion Brilliant',
    gem: 'Diamond',
    tablePercent: { ideal: '58-68%', acceptable: '55-75%' },
    depthPercent: { ideal: '61-68%', acceptable: '58-72%' },
    crownAngle: { ideal: '33-38°', acceptable: '30-40°' },
    pavilionAngle: { ideal: '40-42°', acceptable: '38-44°' },
    notes: 'Wide range of acceptable proportions; modern vs antique styles'
  },
  {
    cut: 'Cabochon',
    gem: 'Corundum (Star)',
    tablePercent: { ideal: 'N/A', acceptable: 'N/A' },
    depthPercent: { ideal: '50-70%', acceptable: '40-80%' },
    crownAngle: { ideal: 'Dome shape', acceptable: 'Varies' },
    pavilionAngle: { ideal: 'Flat to slight dome', acceptable: 'Varies' },
    notes: 'Height critical for star centering; base must be flat or slightly domed'
  },
  {
    cut: 'Oval Cabochon',
    gem: 'Opal',
    tablePercent: { ideal: 'N/A', acceptable: 'N/A' },
    depthPercent: { ideal: '30-50%', acceptable: '25-60%' },
    crownAngle: { ideal: 'Low to medium dome', acceptable: 'Varies' },
    pavilionAngle: { ideal: 'Flat base', acceptable: 'Flat to slight dome' },
    notes: 'Avoid high domes (magnifies cracks); thicker = more durable'
  },
  {
    cut: 'Emerald Cut',
    gem: 'Emerald',
    tablePercent: { ideal: '60-70%', acceptable: '55-75%' },
    depthPercent: { ideal: '60-70%', acceptable: '55-75%' },
    crownAngle: { ideal: '12-18°', acceptable: '10-20°' },
    pavilionAngle: { ideal: '40-44°', acceptable: '38-46°' },
    notes: 'Step cut minimizes visibility of inclusions'
  },
];

const CUT_GRADES: CutGrade[] = [
  {
    grade: 'Excellent',
    description: 'Proportions within ideal range, maximum brilliance and fire',
    marketImpact: 'Premium pricing - 10-20% above average cut'
  },
  {
    grade: 'Very Good',
    description: 'Proportions within acceptable range, excellent light performance',
    marketImpact: 'Slight premium - 5-10% above average cut'
  },
  {
    grade: 'Good',
    description: 'Proportions acceptable, good light return',
    marketImpact: 'Market average pricing'
  },
  {
    grade: 'Fair',
    description: 'Proportions outside ideal, noticeable light leakage',
    marketImpact: 'Discount - 10-20% below average cut'
  },
  {
    grade: 'Poor',
    description: 'Severe proportion issues, significant windowing or extinction',
    marketImpact: 'Heavy discount - 30-50% below average cut'
  },
];

export function ProportionAnalyzer() {
  const [selectedCut, setSelectedCut] = useState<string>('');
  const [table, setTable] = useState('');
  const [depth, setDepth] = useState('');
  const [crownAngle, setCrownAngle] = useState('');
  const [pavilionAngle, setPavilionAngle] = useState('');
  const [girdle, setGirdle] = useState<GirdleThickness | ''>('');
  const [culet, setCulet] = useState<CuletSize | ''>('');

  const selectedStandard = PROPORTION_STANDARDS.find(
    s => `${s.cut} (${s.gem})` === selectedCut
  );

  const analyzeProportions = () => {
    if (!selectedStandard || !table || !depth) {
      return null;
    }

    const tableNum = parseFloat(table);
    const depthNum = parseFloat(depth);

    // Simple analysis based on table and depth being within ideal ranges
    const tableIdealRange = selectedStandard.tablePercent.ideal;
    const depthIdealRange = selectedStandard.depthPercent.ideal;

    const tableAcceptableRange = selectedStandard.tablePercent.acceptable;
    const depthAcceptableRange = selectedStandard.depthPercent.acceptable;

    const parseRange = (range: string) => {
      if (range === 'N/A') return null;
      const match = range.match(/(\d+\.?\d*)-(\d+\.?\d*)%?/);
      if (match) {
        return { min: parseFloat(match[1]), max: parseFloat(match[2]) };
      }
      return null;
    };

    const tableIdeal = parseRange(tableIdealRange);
    const depthIdeal = parseRange(depthIdealRange);
    const tableAcceptable = parseRange(tableAcceptableRange);
    const depthAcceptable = parseRange(depthAcceptableRange);

    let score = 0;
    const issues: string[] = [];

    // Table analysis
    if (tableIdeal && tableNum >= tableIdeal.min && tableNum <= tableIdeal.max) {
      score += 2;
    } else if (tableAcceptable && tableNum >= tableAcceptable.min && tableNum <= tableAcceptable.max) {
      score += 1;
      issues.push('Table outside ideal range');
    } else if (tableAcceptable) {
      issues.push('Table significantly outside acceptable range');
    }

    // Depth analysis
    if (depthIdeal && depthNum >= depthIdeal.min && depthNum <= depthIdeal.max) {
      score += 2;
    } else if (depthAcceptable && depthNum >= depthAcceptable.min && depthNum <= depthAcceptable.max) {
      score += 1;
      issues.push('Depth outside ideal range');
    } else if (depthAcceptable) {
      issues.push('Depth significantly outside acceptable range');
    }

    // Determine grade
    let grade: CutGrade['grade'];
    if (score >= 4) {
      grade = 'Excellent';
    } else if (score === 3) {
      grade = 'Very Good';
    } else if (score === 2) {
      grade = 'Good';
    } else if (score === 1) {
      grade = 'Fair';
    } else {
      grade = 'Poor';
    }

    const gradeInfo = CUT_GRADES.find(g => g.grade === grade)!;

    return { grade: gradeInfo, issues };
  };

  const analysis = analyzeProportions();

  const isDiamondRoundBrilliant =
    selectedStandard?.cut === 'Round Brilliant' && selectedStandard?.gem === 'Diamond';
  const giaResult = isDiamondRoundBrilliant
    ? gradeRoundBrilliant({
        tablePercent: table ? parseFloat(table) : undefined,
        depthPercent: depth ? parseFloat(depth) : undefined,
        crownAngle: crownAngle ? parseFloat(crownAngle) : undefined,
        pavilionAngle: pavilionAngle ? parseFloat(pavilionAngle) : undefined,
        girdleThickness: girdle || undefined,
        culetSize: culet || undefined,
      })
    : null;
  const giaInputCount = giaResult?.parameterGrades.length ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-semibold text-slate-900 dark:text-cream-primary mb-3">Cut Grade Reference</h4>
        <div className="space-y-2">
          {CUT_GRADES.map(grade => (
            <div key={grade.grade} className="p-3 rounded-lg border border-slate-200 dark:border-coffee-border bg-slate-50 dark:bg-coffee-raised2">
              <div className="flex items-start justify-between mb-1">
                <h5 className="font-semibold text-slate-900 dark:text-cream-primary text-sm">{grade.grade}</h5>
                <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                  grade.grade === 'Excellent' ? 'bg-green-100 dark:bg-emerald-400/10 text-green-700 dark:text-emerald-300' :
                  grade.grade === 'Very Good' ? 'bg-blue-100 dark:bg-blue-400/10 text-blue-700 dark:text-blue-300' :
                  grade.grade === 'Good' ? 'bg-slate-100 dark:bg-coffee-raised2 text-slate-700 dark:text-cream-secondary' :
                  grade.grade === 'Fair' ? 'bg-amber-100 dark:bg-amber-400/10 text-amber-700 dark:text-amber-300' :
                  'bg-red-100 dark:bg-red-400/10 text-red-700 dark:text-red-300'
                }`}>
                  {grade.marketImpact.split(' - ')[0]}
                </span>
              </div>
              <p className="text-xs text-slate-700 dark:text-cream-secondary mb-1">{grade.description}</p>
              <p className="text-xs text-slate-600 dark:text-cream-muted">
                <strong>Market Impact:</strong> {grade.marketImpact}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-slate-200 dark:border-coffee-border pt-6">
        <h4 className="text-sm font-semibold text-slate-900 dark:text-cream-primary mb-3">Proportion Analyser</h4>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-cream-secondary mb-1">
              Select Cut & Gemstone
            </label>
            <select
              value={selectedCut}
              onChange={(e) => setSelectedCut(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-coffee-border rounded-lg bg-white dark:bg-coffee-sunk text-slate-900 dark:text-cream-primary focus:outline-none focus:ring-2 focus:ring-crystal-500 dark:focus:ring-crystal-400/20 dark:focus:border-crystal-400"
            >
              <option value="">Choose a cut...</option>
              {PROPORTION_STANDARDS.map((std, idx) => (
                <option key={idx} value={`${std.cut} (${std.gem})`}>
                  {std.cut} ({std.gem})
                </option>
              ))}
            </select>
          </div>

          {selectedStandard && (
            <>
              <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-400/10 border border-blue-200 dark:border-blue-400/20">
                <h5 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">Ideal Proportions</h5>
                <div className="grid grid-cols-2 gap-2 text-xs text-blue-800 dark:text-blue-200">
                  <div>
                    <strong>Table:</strong> {selectedStandard.tablePercent.ideal}
                  </div>
                  <div>
                    <strong>Depth:</strong> {selectedStandard.depthPercent.ideal}
                  </div>
                  <div>
                    <strong>Crown Angle:</strong> {selectedStandard.crownAngle.ideal}
                  </div>
                  <div>
                    <strong>Pavilion Angle:</strong> {selectedStandard.pavilionAngle.ideal}
                  </div>
                </div>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
                  <strong>Notes:</strong> {selectedStandard.notes}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-cream-secondary mb-1">
                    Table %
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g., 57"
                    value={table}
                    onChange={(e) => setTable(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-coffee-border rounded-lg bg-white dark:bg-coffee-sunk text-slate-900 dark:text-cream-primary placeholder-slate-500 dark:placeholder-cream-muted focus:outline-none focus:ring-2 focus:ring-crystal-500 dark:focus:ring-crystal-400/20 dark:focus:border-crystal-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-cream-secondary mb-1">
                    Depth %
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g., 61.5"
                    value={depth}
                    onChange={(e) => setDepth(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-coffee-border rounded-lg bg-white dark:bg-coffee-sunk text-slate-900 dark:text-cream-primary placeholder-slate-500 dark:placeholder-cream-muted focus:outline-none focus:ring-2 focus:ring-crystal-500 dark:focus:ring-crystal-400/20 dark:focus:border-crystal-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-cream-secondary mb-1">
                    Crown Angle ° (optional)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g., 34.5"
                    value={crownAngle}
                    onChange={(e) => setCrownAngle(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-coffee-border rounded-lg bg-white dark:bg-coffee-sunk text-slate-900 dark:text-cream-primary placeholder-slate-500 dark:placeholder-cream-muted focus:outline-none focus:ring-2 focus:ring-crystal-500 dark:focus:ring-crystal-400/20 dark:focus:border-crystal-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-cream-secondary mb-1">
                    Pavilion Angle ° (optional)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g., 40.8"
                    value={pavilionAngle}
                    onChange={(e) => setPavilionAngle(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-coffee-border rounded-lg bg-white dark:bg-coffee-sunk text-slate-900 dark:text-cream-primary placeholder-slate-500 dark:placeholder-cream-muted focus:outline-none focus:ring-2 focus:ring-crystal-500 dark:focus:ring-crystal-400/20 dark:focus:border-crystal-400"
                  />
                </div>
              </div>

              {isDiamondRoundBrilliant && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-cream-secondary mb-1">
                      Girdle thickness (optional)
                    </label>
                    <select
                      value={girdle}
                      onChange={(e) => setGirdle(e.target.value as GirdleThickness | '')}
                      className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-coffee-border rounded-lg bg-white dark:bg-coffee-sunk text-slate-900 dark:text-cream-primary focus:outline-none focus:ring-2 focus:ring-crystal-500 dark:focus:ring-crystal-400/20 dark:focus:border-crystal-400"
                    >
                      {GIRDLE_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-cream-secondary mb-1">
                      Culet size (optional)
                    </label>
                    <select
                      value={culet}
                      onChange={(e) => setCulet(e.target.value as CuletSize | '')}
                      className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-coffee-border rounded-lg bg-white dark:bg-coffee-sunk text-slate-900 dark:text-cream-primary focus:outline-none focus:ring-2 focus:ring-crystal-500 dark:focus:ring-crystal-400/20 dark:focus:border-crystal-400"
                    >
                      {CULET_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {giaResult && giaInputCount > 0 && (
                <div className={`p-4 rounded-lg border-2 ${
                  giaResult.grade === 'Excellent' ? 'bg-green-50 dark:bg-emerald-400/10 border-green-300 dark:border-emerald-400/30' :
                  giaResult.grade === 'Very Good' ? 'bg-blue-50 dark:bg-blue-400/10 border-blue-300 dark:border-blue-400/30' :
                  giaResult.grade === 'Good' ? 'bg-slate-50 dark:bg-coffee-raised2 border-slate-300 dark:border-coffee-border' :
                  giaResult.grade === 'Fair' ? 'bg-amber-50 dark:bg-amber-400/10 border-amber-300 dark:border-amber-400/30' :
                  'bg-red-50 dark:bg-red-400/10 border-red-300 dark:border-red-400/30'
                }`}>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h5 className="text-lg font-bold text-slate-900 dark:text-cream-primary">
                      GIA-style Cut Grade: {giaResult.grade}
                    </h5>
                    <span className={`text-xs px-2 py-1 rounded font-medium ${GIA_BADGE[giaResult.grade]}`}>
                      Diamond round brilliant
                    </span>
                  </div>
                  {giaResult.limitingParameter && giaResult.grade !== 'Excellent' && (
                    <p className="text-sm text-slate-800 dark:text-cream-secondary mb-2">
                      <strong>Limiting parameter:</strong> {giaResult.limitingParameter.comment}
                    </p>
                  )}
                  <div className="text-xs text-slate-700 dark:text-cream-secondary">
                    <strong>Per-parameter:</strong>
                    <ul className="mt-1 space-y-0.5">
                      {giaResult.parameterGrades.map((p, idx) => (
                        <li key={idx}>
                          <span className={`inline-block px-1.5 py-0.5 rounded mr-2 text-[10px] font-medium ${GIA_BADGE[p.grade]}`}>
                            {p.grade}
                          </span>
                          {p.parameter} = {p.value}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-cream-muted mt-2 italic">
                    Educational reference only. Formal GIA grading also weighs symmetry, polish, and overall appeal.
                  </p>
                </div>
              )}

              {analysis && (
                <div className={`p-4 rounded-lg border-2 ${
                  analysis.grade.grade === 'Excellent' ? 'bg-green-50 dark:bg-emerald-400/10 border-green-300 dark:border-emerald-400/30' :
                  analysis.grade.grade === 'Very Good' ? 'bg-blue-50 dark:bg-blue-400/10 border-blue-300 dark:border-blue-400/30' :
                  analysis.grade.grade === 'Good' ? 'bg-slate-50 dark:bg-coffee-raised2 border-slate-300 dark:border-coffee-border' :
                  analysis.grade.grade === 'Fair' ? 'bg-amber-50 dark:bg-amber-400/10 border-amber-300 dark:border-amber-400/30' :
                  'bg-red-50 dark:bg-red-400/10 border-red-300 dark:border-red-400/30'
                }`}>
                  <div className="flex items-start justify-between mb-2">
                    <h5 className="text-lg font-bold text-slate-900 dark:text-cream-primary">
                      Cut Grade: {analysis.grade.grade}
                    </h5>
                    <span className={`text-xs px-2 py-1 rounded font-medium ${
                      analysis.grade.grade === 'Excellent' ? 'bg-green-200 dark:bg-emerald-400/10 text-green-800 dark:text-emerald-300' :
                      analysis.grade.grade === 'Very Good' ? 'bg-blue-200 dark:bg-blue-400/10 text-blue-800 dark:text-blue-300' :
                      analysis.grade.grade === 'Good' ? 'bg-slate-200 dark:bg-coffee-raised2 text-slate-800 dark:text-cream-secondary' :
                      analysis.grade.grade === 'Fair' ? 'bg-amber-200 dark:bg-amber-400/10 text-amber-800 dark:text-amber-300' :
                      'bg-red-200 dark:bg-red-400/10 text-red-800 dark:text-red-300'
                    }`}>
                      {analysis.grade.marketImpact}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 dark:text-cream-secondary mb-2">{analysis.grade.description}</p>
                  {analysis.issues.length > 0 && (
                    <div className="mt-2">
                      <strong className="text-sm text-slate-900 dark:text-cream-primary">Issues Detected:</strong>
                      <ul className="text-sm text-slate-700 dark:text-cream-secondary mt-1 space-y-0.5">
                        {analysis.issues.map((issue, idx) => (
                          <li key={idx}>• {issue}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div className="bg-amber-50 dark:bg-amber-400/10 border border-amber-200 dark:border-amber-400/20 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-300 mb-2">⚠️ Important Notes</h4>
        <ul className="text-sm text-amber-800 dark:text-amber-200 space-y-1">
          <li>• This is a simplified analysis - full cut grading requires symmetry, polish, and other factors</li>
          <li>• Colored gemstones have wider acceptable ranges than diamonds</li>
          <li>• Some cuts (antique cushions, Portuguese cuts) intentionally vary from modern standards</li>
          <li>• Professional cut grading requires calibrated proportionscopes and gemological training</li>
        </ul>
      </div>
    </div>
  );
}
