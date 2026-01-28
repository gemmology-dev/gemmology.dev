/**
 * Protected Lab tools wrapper.
 */

import { LockGate } from './LockGate';
import { LabTools } from '../lab/LabTools';

export function ProtectedLab() {
  return (
    <LockGate>
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900">Lab Equipment</h1>
            <p className="text-slate-600 mt-2">
              Reference tools for gemological lab equipment including Chelsea filter reactions, spectroscope absorption lines, and heavy liquid separation.
            </p>
          </div>
          <LabTools />
        </div>
      </div>
    </LockGate>
  );
}
