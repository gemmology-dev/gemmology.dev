/**
 * Spectroscope Line Calculator
 * Wavelength ↔ color + common absorption lines
 */

import { useState } from 'react';

interface AbsorptionLine {
  gem: string;
  wavelength: number;
  color: string;
  strength: string;
  notes: string;
}

const COMMON_LINES: AbsorptionLine[] = [
  { gem: 'Ruby', wavelength: 694, color: 'Deep red', strength: 'Strong', notes: 'Chromium doublet at 694.2 and 692.9nm' },
  { gem: 'Ruby', wavelength: 668, color: 'Red', strength: 'Medium', notes: 'Broad band' },
  { gem: 'Ruby', wavelength: 659, color: 'Red-orange', strength: 'Medium', notes: 'Fine line' },
  { gem: 'Emerald', wavelength: 683, color: 'Red', strength: 'Weak', notes: 'Chromium line' },
  { gem: 'Emerald', wavelength: 637, color: 'Orange-red', strength: 'Weak', notes: 'Chromium doublet' },
  { gem: 'Alexandrite', wavelength: 680, color: 'Red', strength: 'Strong', notes: 'Chromium doublet' },
  { gem: 'Jadeite (Green)', wavelength: 691, color: 'Red', strength: 'Medium', notes: 'Chromium (dyed may show)' },
  { gem: 'Demantoid Garnet', wavelength: 443, color: 'Blue-violet', strength: 'Strong', notes: 'Characteristic horsetail band' },
  { gem: 'Zircon', wavelength: 653, color: 'Red-orange', strength: 'Strong', notes: 'Uranium lines' },
  { gem: 'Diamond (Yellow)', wavelength: 415, color: 'Violet', strength: 'Medium', notes: 'Cape series' },
  { gem: 'Peridot', wavelength: 497, color: 'Blue-green', strength: 'Strong', notes: 'Iron triplet' },
  { gem: 'Peridot', wavelength: 493, color: 'Blue-green', strength: 'Strong', notes: 'Central line of triplet' },
  { gem: 'Peridot', wavelength: 473, color: 'Blue', strength: 'Strong', notes: 'Iron triplet' },
  { gem: 'Sapphire (Blue)', wavelength: 450, color: 'Blue-violet', strength: 'Medium', notes: 'Iron-titanium' },
  { gem: 'Aquamarine', wavelength: 537, color: 'Green', strength: 'Weak', notes: 'Iron absorption' },
];

function wavelengthToRGB(wavelength: number): string {
  let r = 0, g = 0, b = 0;

  if (wavelength >= 380 && wavelength < 440) {
    r = -(wavelength - 440) / (440 - 380);
    b = 1.0;
  } else if (wavelength >= 440 && wavelength < 490) {
    g = (wavelength - 440) / (490 - 440);
    b = 1.0;
  } else if (wavelength >= 490 && wavelength < 510) {
    g = 1.0;
    b = -(wavelength - 510) / (510 - 490);
  } else if (wavelength >= 510 && wavelength < 580) {
    r = (wavelength - 510) / (580 - 510);
    g = 1.0;
  } else if (wavelength >= 580 && wavelength < 645) {
    r = 1.0;
    g = -(wavelength - 645) / (645 - 580);
  } else if (wavelength >= 645 && wavelength <= 780) {
    r = 1.0;
  }

  // Intensity falloff at edges
  let factor = 1.0;
  if (wavelength >= 380 && wavelength < 420) {
    factor = 0.3 + 0.7 * (wavelength - 380) / (420 - 380);
  } else if (wavelength >= 700 && wavelength <= 780) {
    factor = 0.3 + 0.7 * (780 - wavelength) / (780 - 700);
  }

  r = Math.round(r * factor * 255);
  g = Math.round(g * factor * 255);
  b = Math.round(b * factor * 255);

  return `rgb(${r}, ${g}, ${b})`;
}

export function SpectroscopeCalculator() {
  const [wavelength, setWavelength] = useState('589');
  const [gemFilter, setGemFilter] = useState('all');

  const wl = parseFloat(wavelength);
  const isValid = !isNaN(wl) && wl >= 380 && wl <= 780;

  const color = isValid ? wavelengthToRGB(wl) : '';

  const filtered = COMMON_LINES.filter(line => {
    const matchGem = gemFilter === 'all' || line.gem === gemFilter;
    return matchGem;
  });

  const uniqueGems = Array.from(new Set(COMMON_LINES.map(l => l.gem))).sort();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-slate-600">
          Enter a wavelength (380-780nm) to see its color, or browse common absorption lines by gem.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Wavelength (nm)
          </label>
          <input
            type="number"
            step="1"
            min="380"
            max="780"
            value={wavelength}
            onChange={(e) => setWavelength(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-crystal-500 focus:border-crystal-500"
            placeholder="e.g., 694"
          />
          {!isValid && wavelength && (
            <p className="text-xs text-red-500 mt-1">Valid range: 380-780nm</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Filter by Gem
          </label>
          <select
            value={gemFilter}
            onChange={(e) => setGemFilter(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-crystal-500 focus:border-crystal-500"
          >
            <option value="all">All Gems</option>
            {uniqueGems.map(gem => (
              <option key={gem} value={gem}>{gem}</option>
            ))}
          </select>
        </div>
      </div>

      {isValid && (
        <div className="p-6 rounded-lg border border-slate-300">
          <div className="text-center">
            <div className="text-sm text-slate-600 mb-2">Color at {wl}nm</div>
            <div
              className="w-full h-24 rounded-lg border-2 border-slate-300 shadow-inner"
              style={{ backgroundColor: color }}
            />
            <div className="mt-3 text-sm text-slate-500">
              {wl < 450 ? 'Violet-Blue' :
               wl < 495 ? 'Blue' :
               wl < 570 ? 'Green' :
               wl < 590 ? 'Yellow-Green' :
               wl < 620 ? 'Yellow-Orange' :
               wl < 750 ? 'Red' : 'Deep Red'}
            </div>
          </div>
        </div>
      )}

      <div>
        <h4 className="text-sm font-semibold text-slate-900 mb-3">
          Common Absorption Lines ({filtered.length})
        </h4>
        <div className="space-y-2">
          {filtered.map((line, idx) => (
            <div key={idx} className="p-3 rounded-lg border border-slate-200 bg-white hover:border-crystal-300 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h5 className="font-semibold text-sm text-slate-900">{line.gem}</h5>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      {line.strength}
                    </span>
                  </div>
                  <div className="text-sm text-slate-600">
                    <span className="font-mono font-medium">{line.wavelength}nm</span> — {line.color}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{line.notes}</p>
                </div>
                <div
                  className="w-12 h-12 rounded border-2 border-slate-300 shrink-0"
                  style={{ backgroundColor: wavelengthToRGB(line.wavelength) }}
                  title={`${line.wavelength}nm`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">Spectroscope Usage</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Use a strong white light source for best results</li>
          <li>• Absorption lines appear as dark bands against bright spectrum</li>
          <li>• Some gems show many lines, others show few or none</li>
          <li>• Position matters - some lines only visible in certain orientations</li>
        </ul>
      </div>

      <div className="text-sm text-slate-600">
        <a
          href="/learn/equipment/spectroscope"
          className="text-crystal-600 hover:text-crystal-700 underline"
        >
          Learn spectroscope technique and absorption spectrum interpretation →
        </a>
      </div>
    </div>
  );
}
