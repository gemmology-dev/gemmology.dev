/**
 * LocalCaseStore — localStorage-backed persistence for Lab Simulation case
 * runs (Phase 3).
 *
 * Mirrors the defensive read/write try/catch style and synchronous API of
 * src/lib/quiz/challenge-store.ts (LocalChallengeStore): a small,
 * self-contained store rather than an implementation of the async
 * `StudyStore` interface, since case runs are tracked per-case rather than
 * per-question.
 */

import type { CaseRunnerState, CaseResult } from './case-types';

export const CASE_STORAGE_KEY = 'gemmology-cases-v1';

/** One case's persisted entry: its runner state, plus a result once complete. */
export interface CaseStoredEntry {
  state: CaseRunnerState;
  result?: CaseResult;
}

interface CaseStoreEnvelope {
  version: 1;
  cases: Record<string, CaseStoredEntry>;
}

function emptyEnvelope(): CaseStoreEnvelope {
  return { version: 1, cases: {} };
}

function isEnvelope(v: unknown): v is CaseStoreEnvelope {
  return (
    typeof v === 'object' &&
    v !== null &&
    (v as CaseStoreEnvelope).version === 1 &&
    typeof (v as CaseStoreEnvelope).cases === 'object' &&
    (v as CaseStoreEnvelope).cases !== null
  );
}

export class LocalCaseStore {
  /** The stored entry for a case, or `null` if no attempt has been recorded yet. */
  getCaseState(caseId: string): CaseStoredEntry | null {
    const envelope = this._read();
    return envelope.cases[caseId] ?? null;
  }

  /** All recorded case entries, keyed by caseId — used by the hub for summary cards. */
  getAllCaseSummaries(): Record<string, CaseStoredEntry> {
    return this._read().cases;
  }

  /**
   * Persist the runner state for a case, optionally alongside its final
   * result (present once `state.status === 'complete'`). Overwrites any
   * previous entry for this caseId.
   */
  saveCaseState(caseId: string, state: CaseRunnerState, result?: CaseResult): CaseStoredEntry {
    const envelope = this._read();
    const entry: CaseStoredEntry = result ? { state, result } : { state };
    envelope.cases[caseId] = entry;
    this._write(envelope);
    return entry;
  }

  /** Remove all persisted progress for a single case (used by "Restart case"). */
  clearCase(caseId: string): void {
    const envelope = this._read();
    if (!(caseId in envelope.cases)) return;
    delete envelope.cases[caseId];
    this._write(envelope);
  }

  private _read(): CaseStoreEnvelope {
    try {
      if (typeof localStorage === 'undefined') return emptyEnvelope();
      const raw = localStorage.getItem(CASE_STORAGE_KEY);
      if (raw === null) return emptyEnvelope();
      const parsed: unknown = JSON.parse(raw);
      return isEnvelope(parsed) ? parsed : emptyEnvelope();
    } catch {
      return emptyEnvelope();
    }
  }

  private _write(envelope: CaseStoreEnvelope): void {
    try {
      if (typeof localStorage === 'undefined') return;
      localStorage.setItem(CASE_STORAGE_KEY, JSON.stringify(envelope));
    } catch (err) {
      console.warn('[case-store] write failed:', err);
    }
  }
}

let _singleton: LocalCaseStore | null = null;

/** Lazy singleton. Call this from components/hooks rather than constructing directly. */
export function getCaseStore(): LocalCaseStore {
  if (_singleton === null) _singleton = new LocalCaseStore();
  return _singleton;
}
