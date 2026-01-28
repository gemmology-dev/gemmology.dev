/**
 * Protected Gem Identification tools wrapper.
 */

import { LockGate } from './LockGate';
import { IdentificationTools } from '../identification/IdentificationTools';

export function ProtectedIdentification() {
  return (
    <LockGate>
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900">Gem Identification</h1>
            <p className="text-slate-600 mt-2">
              Comprehensive identification tools including side-by-side gem comparison, Mohs hardness reference, and cleavage/fracture patterns.
            </p>
          </div>
          <IdentificationTools />
        </div>
      </div>
    </LockGate>
  );
}
