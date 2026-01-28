/**
 * Polariscope Interpretation Guide
 * Interactive guide to polariscope reactions
 */

import { useState } from 'react';

const REACTIONS = [
  {
    id: 'dark',
    name: 'Remains Dark (Extinct)',
    interpretation: 'Isotropic (Cubic system or Amorphous)',
    examples: ['Diamond', 'Spinel', 'Garnet', 'Opal', 'Glass'],
    color: 'slate',
  },
  {
    id: 'blink',
    name: 'Blinks 4 Times (Light/Dark/Light/Dark)',
    interpretation: 'Anisotropic - Doubly Refractive',
    examples: ['Ruby', 'Sapphire', 'Emerald', 'Topaz', 'Tourmaline', 'Quartz'],
    color: 'emerald',
  },
  {
    id: 'adr',
    name: 'Anomalous Double Refraction (ADR)',
    interpretation: 'Isotropic with strain or twinning',
    examples: ['Synthetic spinel', 'Some garnets', 'Some diamonds'],
    color: 'amber',
  },
  {
    id: 'optic',
    name: 'Bull\'s Eye or Cross Pattern',
    interpretation: 'Optic axis visible (uniaxial or biaxial figure)',
    examples: ['View down c-axis in corundum, quartz, tourmaline'],
    color: 'sapphire',
  },
];

const PROCEDURES = [
  {
    step: '1',
    title: 'Set Up',
    description: 'Cross the polarizers so no light passes through',
    details: 'Rotate top polarizer until the field goes completely dark',
  },
  {
    step: '2',
    title: 'Place Stone',
    description: 'Insert the gem between crossed polarizers',
    details: 'Use a bezel setter or immersion cell if needed',
  },
  {
    step: '3',
    title: 'Rotate Stone',
    description: 'Rotate the stone 360° and observe changes',
    details: 'Count how many times it goes from light to dark',
  },
  {
    step: '4',
    title: 'Interpret',
    description: 'Match the observed reaction to the patterns below',
    details: 'Some gems may show weak or partial reactions',
  },
];

export function PolariscopeGuide() {
  const [selectedReaction, setSelectedReaction] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-slate-600">
          Interactive guide to interpreting polariscope reactions. Select a reaction pattern to learn more.
        </p>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-slate-900 mb-3">Testing Procedure</h4>
        <div className="grid md:grid-cols-4 gap-3">
          {PROCEDURES.map((proc) => (
            <div key={proc.step} className="bg-slate-50 rounded-lg p-3 border border-slate-200">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-crystal-500 text-white flex items-center justify-center text-xs font-bold">
                  {proc.step}
                </div>
                <h5 className="font-semibold text-sm text-slate-900">{proc.title}</h5>
              </div>
              <p className="text-xs text-slate-600">{proc.description}</p>
              <p className="text-xs text-slate-500 mt-1">{proc.details}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-slate-900 mb-3">Reaction Patterns</h4>
        <div className="grid md:grid-cols-2 gap-3">
          {REACTIONS.map((reaction) => (
            <button
              key={reaction.id}
              onClick={() => setSelectedReaction(selectedReaction === reaction.id ? null : reaction.id)}
              className={`text-left p-4 rounded-lg border-2 transition-all ${
                selectedReaction === reaction.id
                  ? 'border-crystal-500 bg-crystal-50'
                  : 'border-slate-200 bg-white hover:border-crystal-300'
              }`}
            >
              <h5 className="font-semibold text-slate-900 mb-1">{reaction.name}</h5>
              <p className="text-sm text-slate-600 mb-2">{reaction.interpretation}</p>
              {selectedReaction === reaction.id && (
                <div className="mt-3 pt-3 border-t border-slate-200">
                  <p className="text-xs font-medium text-slate-700 mb-2">Common Examples:</p>
                  <div className="flex flex-wrap gap-1">
                    {reaction.examples.map((ex) => (
                      <span
                        key={ex}
                        className={`px-2 py-1 rounded text-xs bg-${reaction.color}-100 text-${reaction.color}-700`}
                      >
                        {ex}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">Important Notes</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• <strong>Optic axis:</strong> Stones viewed down optic axis remain dark even if anisotropic</li>
          <li>• <strong>Thin sections:</strong> Very thin stones may show weak reactions</li>
          <li>• <strong>ADR:</strong> Strain patterns indicate heat treatment or synthetic origin in some cases</li>
          <li>• <strong>Conoscope:</strong> Use convergent light to see interference figures</li>
        </ul>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-amber-900 mb-2">Troubleshooting</h4>
        <ul className="text-sm text-amber-800 space-y-1">
          <li>• If no reaction at all, check polarizers are properly crossed</li>
          <li>• Weak reactions may need immersion fluid to reduce surface reflections</li>
          <li>• Multiple orientations needed for comprehensive testing</li>
          <li>• Clean polarizers and stone surface for best results</li>
        </ul>
      </div>
    </div>
  );
}
