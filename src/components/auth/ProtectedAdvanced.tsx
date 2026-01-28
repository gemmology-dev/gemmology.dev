/**
 * Protected Advanced Analysis tools wrapper.
 */

import { LockGate } from './LockGate';
import { AdvancedTools } from '../advanced/AdvancedTools';

export function ProtectedAdvanced() {
  return (
    <LockGate>
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900">Advanced Analysis</h1>
            <p className="text-slate-600 mt-2">
              Advanced gemmological analysis tools including treatment detection reference, origin determination characteristics, and gemstone cut proportion analyzer.
            </p>
          </div>
          <AdvancedTools />
        </div>
      </div>
    </LockGate>
  );
}
