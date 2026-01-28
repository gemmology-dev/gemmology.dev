/**
 * Protected Optical tools wrapper.
 */

import { LockGate } from './LockGate';
import { OpticalTools } from '../optical/OpticalTools';

export function ProtectedOptical() {
  return (
    <LockGate>
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900">Optical Properties</h1>
            <p className="text-slate-600 mt-2">
              Interactive tools for optical testing including dichroscope interpretation, polariscope reactions, refractometer reading practice, and pleochroism reference.
            </p>
          </div>
          <OpticalTools />
        </div>
      </div>
    </LockGate>
  );
}
