/**
 * Protected Calculator component wrapper.
 * Wraps the calculator interface with LockGate authentication.
 */

import { LockGate } from './LockGate';
import { Calculator } from '../calculator';

export function ProtectedCalculator() {
  return (
    <LockGate>
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-12">
        <div className="max-w-6xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900">Tools & Calculators</h1>
            <p className="text-slate-600 mt-2">
              Gemmological calculators for specific gravity, refractive index, weight estimation, and unit conversions.
            </p>
          </div>

          {/* Calculator */}
          <Calculator />
        </div>
      </div>
    </LockGate>
  );
}
