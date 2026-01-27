/**
 * Protected Playground - Wraps Playground with LockGate
 */

import { LockGate } from './LockGate';
import { Playground } from '../playground/Playground';

interface ProtectedPlaygroundProps {
  initialCDL?: string;
}

export function ProtectedPlayground({ initialCDL }: ProtectedPlaygroundProps) {
  return (
    <LockGate>
      <Playground initialCDL={initialCDL} />
    </LockGate>
  );
}
