/**
 * StudyStore implementations.
 *
 * Track T1 (`.trees/study-foundation`) provides `LocalStudyStore`.
 * Future tracks may add `RemoteStudyStore` (Cloudflare-backed) for v1.1+.
 */

export type { StudyStore } from '../study-types';

/**
 * Default factory — re-exported here so consumers can swap implementations
 * by editing one file. Track T1 fills this in.
 */
export { LocalStudyStore, getStudyStore } from './local';
