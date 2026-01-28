/**
 * Protected Measurement tools component wrapper.
 * Wraps the measurement tools interface with LockGate authentication.
 */

import { LockGate } from './LockGate';
import { MeasurementTools } from '../calculator';

export function ProtectedMeasurement() {
  return (
    <LockGate>
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-12">
        <div className="max-w-6xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900">Measurement & Calculation</h1>
            <p className="text-slate-600 mt-2">
              Essential measurement and calculation tools for gem identification, including SG, RI, birefringence, dispersion, and carat estimation.
            </p>
          </div>

          {/* Tools */}
          <MeasurementTools />
        </div>
      </div>
    </LockGate>
  );
}
