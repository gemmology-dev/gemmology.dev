/**
 * Protected Conversions tools component wrapper.
 */

import { LockGate } from './LockGate';
import { ConversionTools } from '../calculator';

export function ProtectedConversions() {
  return (
    <LockGate>
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900">Unit Conversions</h1>
            <p className="text-slate-600 mt-2">
              Convert between carats, grams, millimeters, inches, Celsius, Fahrenheit, and calculate price per carat with markup.
            </p>
          </div>
          <ConversionTools />
        </div>
      </div>
    </LockGate>
  );
}
