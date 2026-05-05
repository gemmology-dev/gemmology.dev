# T7b Security Audit — Study System v1

**Audit ID:** T7b  
**Reviewer:** Security Review Agent (T7b)  
**Date:** 2026-05-05  
**Branch:** feature/study-v1  
**Scope:** LocalStudyStore, ExportImportPanel, Question YAML rendering, useQuiz/useExam hooks, dev harness  
**Frameworks:** OWASP ASVS L1, STRIDE, OWASP Top 10 (Client-Side)

---

## Executive Summary

The study system v1 surface presents no immediately exploitable remote-code-execution or cross-origin attack paths. However, two High-severity issues require remediation before the v1 production release: the import path accepts unvalidated `ResponseRecord` array items, enabling a crafted import to inject arbitrary content into the append-only log; and the `_write` helper propagates `QuotaExceededError` silently, offering a local denial-of-service vector via a large import file. Five Medium findings address a permissive CSP, the dev harness being included in the static build bundle, missing downgrade-safety guards in the migration runner, missing per-field bounds on `optionChosen`, and the legacy `clearQuizStorage` helper not purging v1 study keys. Two Low and one Info finding round out the report.

**Critical findings:** 0  
**High findings:** 2  
**Medium findings:** 5  
**Low findings:** 2  
**Info findings:** 1

---

## Findings Table

| ID | Severity | STRIDE | Category | Description | Location | Evidence |
|----|----------|--------|----------|-------------|----------|---------|
| T7b-01 | High | Tampering | Input Validation | `importAll` appends `ResponseRecord` items without per-item type validation | `src/lib/quiz/store/local.ts:221-224` | `toAppend` is filtered only for duplicate-key deduplication; no guard function equivalent to `isScheduleEntry` exists for response items |
| T7b-02 | High | Denial of Service | Resource Management | `_write` does not catch `QuotaExceededError`; a large import payload can silently corrupt state or break all write operations | `src/lib/quiz/store/local.ts:304-306` | `localStorage.setItem` throws `DOMException` when the 5 MB browser quota is exceeded; no try/catch wraps it; the import path merges then writes the full combined array before cap enforcement |
| T7b-03 | Medium | Tampering | CSP Misconfiguration | Global CSP includes `'unsafe-inline'` and `'unsafe-eval'` in `script-src`, neutralising XSS defence for all pages including the quiz | `public/_headers:6` | `script-src 'self' 'unsafe-inline' 'unsafe-eval'` — any injected script executes without restriction |
| T7b-04 | Medium | Information Disclosure | Dev Harness Exposure | The dev harness page is statically compiled into the production build; only a runtime 404 returned by Astro server-side logic prevents access, but in `output: 'static'` mode there is no server — Astro will pre-render the page, emitting `_dev/study-components/index.html` | `src/pages/_dev/study-components.astro:14-16`, `astro.config.mjs:9` | `if (!import.meta.env.DEV) return new Response(null, { status: 404 })` is dead code in a static build; the page will be pre-rendered to HTML and shipped |
| T7b-05 | Medium | Tampering | Migration Safety | Migration runner does not guard against a stored version number exceeding `CURRENT_VERSION`; a user running a newer build in one tab and an older build in another would silently leave v2+ storage untouched and stamp it back to v1 | `src/lib/quiz/store/migrations.ts:52-63` | `for (let i = version; i < CURRENT_VERSION; i++)` — when `version > CURRENT_VERSION` the loop body never runs but `setItem(MIGRATION_VERSION_KEY, '1')` overwrites the higher version, potentially corrupting future upgrade logic |
| T7b-06 | Medium | Tampering | Data Bounds | `optionChosen` is an unbounded string stored in every `ResponseRecord`; a crafted quiz answer (e.g. from a future `fill-blank` type) or a malicious import payload can write arbitrarily large per-record strings, contributing to quota exhaustion before the RESPONSE_LOG_CAP kicks in | `src/lib/quiz/study-types.ts:28`, `src/hooks/useQuiz.ts:201`, `src/hooks/useExam.ts:354` | `optionChosen: Array.isArray(answer) ? answer.join(',') : answer` — no max-length enforcement |
| T7b-07 | Medium | Repudiation | Session Management | `clearQuizStorage` in `useLocalStorage.ts` only removes legacy v0 keys (`gemmology-quiz-state`, `gemmology-quiz-progress`, `gemmology-exam-state`); it does not clear any of the four v1 study keys defined in `STUDY_STORAGE_KEYS` | `src/hooks/useLocalStorage.ts:109-113` | A user invoking "reset progress" via this utility retains all v1 responses, schedule, and settings |
| T7b-08 | Low | Information Disclosure | Entropy | `makeSessionId()` uses `Math.random()` (not `crypto.getRandomValues`); on shared or browser-fingerprinted devices the session ID is weakly random and could be predicted to correlate study sessions | `src/hooks/useQuiz.ts:72-73`, `src/hooks/useExam.ts:101-102` | `Date.now() + Math.random().toString(36).slice(2,9)` — 7 base-36 digits is approximately 36 bits of entropy at best, less on seeded/deterministic engines |
| T7b-09 | Low | Tampering | Content Integrity | `SectionRenderer.astro` passes YAML `content` and `callout.text` fields through `marked.parse()` then directly into Astro `set:html` without DOMPurify; `dompurify` is a declared dependency but is not applied here | `src/components/learn/SectionRenderer.astro:77-83,101,106,157` | `marked` does not sanitize HTML by default (the `sanitize` option was removed in v1.0); author-controlled YAML content bypasses DOMPurify which is correctly used elsewhere for SVG |
| T7b-10 | Info | — | Defence-in-Depth | `_singleton` in `local.ts` is module-level global state; in test environments or SSR edge runtimes that reuse module state across requests this could theoretically leak one user's store reference to another request | `src/lib/quiz/store/local.ts:374-379` | The current `output: 'static'` Astro build makes this a non-issue today, but should be noted for any future server-rendering migration |

---

## Detailed Findings

### T7b-01 — High — Unvalidated ResponseRecord items in importAll

**STRIDE:** Tampering  
**ASVS:** V5.1.1 (Input Validation)

**Evidence:** `src/lib/quiz/store/local.ts` lines 215–228.

```
const toAppend = payload.responses.filter(
  r => !existingKeys.has(`${r.questionId}::${r.timestamp}`)
);
existing.responses.push(...toAppend);
```

The outer `isExportPayload` guard confirms `payload.responses` is an array, but performs no per-element checks. There is a `isScheduleEntry` type guard and an `isUserProgress` guard, both applied element-by-element during import. No equivalent `isResponseRecord` guard exists. An attacker who crafts a JSON file with an array element shaped as `{ questionId: {}, timestamp: "x", correct: "yes", ... }` will successfully append that element to the persistent log, bypassing TypeScript's structural typing at runtime.

**Exploit scenario:** A user is socially engineered to import a crafted `.json` file from an untrusted source. The `responses` array contains items with non-numeric timestamps, object-valued `questionId`, or extremely long string fields. The SM-2 scheduler and progress tracker subsequently consume these malformed records, potentially producing NaN values, incorrect due dates, or type errors surfaced to the UI.

**Suggested mitigation:** Implement an `isResponseRecord(v: unknown): v is ResponseRecord` type guard — mirroring the pattern already used for `isScheduleEntry` — and apply it inside the `toAppend` filter. Reject or warn on each invalid element.

---

### T7b-02 — High — QuotaExceededError not caught in `_write`

**STRIDE:** Denial of Service  
**ASVS:** V11.1 (Error Handling)

**Evidence:** `src/lib/quiz/store/local.ts` lines 304–306.

```typescript
private _write(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value));
}
```

All four write paths (`appendResponse`, `updateSchedule`, `updateProgress`, `updateSettings`) and both import branches call `_write` without any enclosing try/catch. `localStorage.setItem` throws a `DOMException` (`QuotaExceededError`) when the browser's 5 MB origin quota is full. This exception propagates up through `importAll`'s inner try/catch blocks and surfaces as a partial-import warning string — but the write that succeeded before the throw is already committed, leaving the store in a partially-updated state. On normal usage this also means a single large import that overflows quota will leave the response store and schedule store in an inconsistent state.

**Exploit scenario:** A user imports a valid-shaped but padded export file containing 10,000 responses with maximally long `optionChosen` strings (~1 KB each) — approximately 10 MB serialised. The browser quota is exceeded mid-import after the response array is written but before the schedule is updated. Subsequent quiz sessions operate with a populated response log but stale or absent schedule, producing misleading SM-2 scheduling.

**Suggested mitigation:** Wrap `localStorage.setItem` in `_write` with try/catch. On `QuotaExceededError`, trim the oldest responses and retry once, or throw a typed `StorageFullError` that callers can surface as a user-facing error in the import UI. Additionally, enforce an `accept` attribute size limit in `ExportImportPanel` — see T7b-06 note on `optionChosen` bounds.

---

### T7b-03 — Medium — Permissive CSP (`unsafe-inline`, `unsafe-eval`)

**STRIDE:** Tampering  
**ASVS:** V14.4.1, V14.5.3

**Evidence:** `public/_headers` line 6.

```
script-src 'self' 'unsafe-inline' 'unsafe-eval'
```

`'unsafe-inline'` permits inline `<script>` tags and `javascript:` URIs. `'unsafe-eval'` permits `eval()`, `new Function()`, and similar dynamic code execution APIs required by Monaco Editor and sql.js WASM. While the primary XSS surfaces in the study system use React's text-node rendering (safe), the find at T7b-09 (marked without DOMPurify in SectionRenderer) and the SVG `dangerouslySetInnerHTML` usages in `MineralModal`/`ExpressionSelector` (unsanitised paths) mean that a content injection would execute without CSP blocking it.

**Suggested mitigation:** Move Monaco Editor to a sandboxed `<iframe>` or replace `'unsafe-eval'` with a nonce or hash-based policy for the WASM worker. For `'unsafe-inline'`, adopt nonces for Astro's inline scripts. This is a multi-sprint effort; as a short-term measure, add a Trusted Types policy to prevent DOM sink misuse.

---

### T7b-04 — Medium — Dev harness included in static production build

**STRIDE:** Information Disclosure  
**ASVS:** V14.2.1 (Unintended Content Disclosure)

**Evidence:** `src/pages/_dev/study-components.astro` lines 14–16; `astro.config.mjs` line 9 (`output: 'static'`).

The guard `if (!import.meta.env.DEV) return new Response(null, { status: 404 })` is an Astro server-side middleware pattern. In `output: 'static'` mode Astro evaluates all frontmatter at build time. At build time `import.meta.env.DEV` is `false`, so the `return new Response(...)` is executed — but in a static build this causes Astro to render the page as an empty response, likely emitting `_dev/study-components/index.html` as an empty or error page rather than omitting the route. Regardless, the JS bundle for `StudyDevHarness` is shipped. The `<meta name="robots" content="noindex, nofollow">` is present, but that does not prevent direct navigation.

**Suggested mitigation:** Gate the page at the file system level using a Vite/Astro glob import that excludes `src/pages/_dev/` in production, or use Astro's `export const prerender = false` with `output: 'hybrid'` and a proper 404. The simplest safe option for a fully static build is to move the harness to a separate Storybook instance or simply delete the page from the `src/pages/` tree before the production build via a CI step.

---

### T7b-05 — Medium — Migration runner has no downgrade safety guard

**STRIDE:** Tampering  
**ASVS:** V8.2 (Data Integrity)

**Evidence:** `src/lib/quiz/store/migrations.ts` lines 52–63.

```typescript
let version = stored !== null ? parseInt(stored, 10) : 0;
if (!Number.isFinite(version) || version < 0) { version = 0; }
for (let i = version; i < CURRENT_VERSION; i++) {
  migrations[i]!(storage);
}
storage.setItem(MIGRATION_VERSION_KEY, String(CURRENT_VERSION));
```

When a future v2 build has run and written `gemmology-study-version = 2` to storage, opening the site in the current v1 build causes `version = 2`, `CURRENT_VERSION = 1`, the loop does not execute (correct), but `storage.setItem(MIGRATION_VERSION_KEY, '1')` is unconditionally called, downgrading the version stamp. If the v2 migration logic depends on this key being 2 the next time the newer build loads, it will re-run the v2 migration, potentially corrupting data.

**Suggested mitigation:** Add an early return when `version >= CURRENT_VERSION`:
```typescript
if (version >= CURRENT_VERSION) return;
```
This is the standard pattern in SQLite and Flyway-style migration runners.

---

### T7b-06 — Medium — `optionChosen` field is unbounded

**STRIDE:** Tampering / Denial of Service  
**ASVS:** V5.1.2 (Input Validation — Positive Allowlisting)

**Evidence:** `src/lib/quiz/study-types.ts:28`; `src/hooks/useQuiz.ts:201`; `src/hooks/useExam.ts:354`.

`optionChosen` is typed `string | undefined` with no length constraint. In the current MCQ and true/false question types the value is short and bounded by the option text. For `fill-blank` questions (schema-declared, runtime deferred), the user types free text that is stored verbatim. With RESPONSE_LOG_CAP at 10,000 items and no per-field limit, a user could drive each record to several KB and accumulate megabytes of responses that persist to quota and then trigger the silent-write-failure bug in T7b-02.

**Suggested mitigation:** Enforce a server-side (build-time Zod) and client-side (`appendResponse` pre-write) truncation of `optionChosen` to a reasonable maximum, e.g. 512 characters.

---

### T7b-07 — Medium — `clearQuizStorage` does not clear v1 study keys

**STRIDE:** Repudiation  
**ASVS:** V3.3.1 (Session Termination)

**Evidence:** `src/hooks/useLocalStorage.ts` lines 109–113.

```typescript
const keysToRemove = [
  'gemmology-quiz-state',
  'gemmology-quiz-progress',
  'gemmology-exam-state',
];
```

The four v1 study keys (`gemmology-study-responses`, `gemmology-study-schedule`, `gemmology-study-progress`, `gemmology-study-settings`) and the migration version key (`gemmology-study-version`) are absent. A user or operator invoking a "reset all progress" path that calls `clearQuizStorage` will believe the slate is clean, but the v1 store retains all SM-2 schedule, response history, and settings. This is particularly relevant on shared or kiosk devices.

**Suggested mitigation:** Extend `clearQuizStorage` to include all keys from both `STORAGE_KEYS` (useLocalStorage) and `STUDY_STORAGE_KEYS` (study-types), plus `MIGRATION_VERSION_KEY`. Alternatively, provide a new `clearStudyStorage()` export from the store module that iterates `Object.values(STUDY_STORAGE_KEYS)`.

---

### T7b-08 — Low — Weak session ID entropy (`Math.random`)

**STRIDE:** Information Disclosure  
**ASVS:** V2.9.1 (Cryptographic Software)

**Evidence:** `src/hooks/useQuiz.ts:72-73`; `src/hooks/useExam.ts:101-102`.

`Date.now()` provides millisecond precision (trivially observable via `performance.now` or guessed from page load time). The random suffix is 7 base-36 characters (~36 bits). `Math.random()` is not a CSPRNG. The session ID is stored in localStorage and in every `ResponseRecord`. While this is a client-only application and the session ID is not used for authentication, it is an identifier correlating behaviour across a session and appears in exported backup files.

**Suggested mitigation:** Use `crypto.randomUUID()` (available in all target browsers and in Astro's build environment) instead of `Date.now() + Math.random()`.

---

### T7b-09 — Low — `marked` output injected into `set:html` without DOMPurify

**STRIDE:** Tampering (XSS)  
**ASVS:** V5.3.3 (Output Encoding)

**Evidence:** `src/components/learn/SectionRenderer.astro` lines 77–83, 101, 106, 157.

`marked.parse()` converts Markdown to HTML. The `marked` v15 library does not sanitize HTML embedded in Markdown source. The YAML content files (`gemmology-knowledge/docs/learn/*.yaml`) are author-controlled build-time assets, so this is not an immediately exploitable end-user injection point. However, the `DOMPurify` library is declared as a dependency and is correctly applied to SVG paths elsewhere. A compromised YAML file in the knowledge repository (supply-chain threat) or a contributor mistake would allow arbitrary HTML — including `<script>` tags — to render in the learn section.

Note: `RationalePanel.tsx` does not use `set:html` or `dangerouslySetInnerHTML` for rationale text; it renders `{rationaleCorrect}` and `{opt.rationale}` as plain React text nodes (lines 107 and 159), which is the correct and safe pattern.

**Suggested mitigation:** Pass the output of `marked.parse()` through a server-side DOMPurify call (using `dompurify` with `jsdom` as the DOM environment, which is already a dev dependency) before handing to `set:html`. This is defence-in-depth against supply-chain and contributor errors.

---

### T7b-10 — Info — Module-singleton store could leak across SSR requests

**STRIDE:** Information Disclosure  
**ASVS:** V1.1.1 (Secure Design)

**Evidence:** `src/lib/quiz/store/local.ts` lines 374–379.

`_singleton` is a module-level variable. In `output: 'static'` mode this is a build-time concern only and poses no runtime risk. If the project migrates to `output: 'server'` or `output: 'hybrid'` and `LocalStudyStore` is instantiated in a server route, the singleton would be shared across all users' requests within a Node.js worker. The store writes to `localStorage`, which does not exist in a server context, so the constructor's `typeof localStorage !== 'undefined'` guard would prevent instantiation — but this should be documented.

**Suggested mitigation:** Add a JSDoc comment to `getStudyStore()` stating it is browser-only and must not be called from server-rendered Astro pages or API routes. If SSR migration is planned, refactor to a per-request factory pattern.

---

## Threat Model Summary (STRIDE)

| Threat | Component | Mitigated? | Notes |
|--------|-----------|-----------|-------|
| Spoofing | Session IDs (sessionId) | Partial | Math.random; see T7b-08 |
| Tampering | Import payload (responses) | No | No per-item validation; T7b-01 |
| Tampering | Import payload (schedule, progress, settings) | Yes | Type guards applied |
| Tampering | YAML content → set:html | Partial | DOMPurify absent on marked output; T7b-09 |
| Tampering | CSP bypass | No | unsafe-inline/eval present; T7b-03 |
| Repudiation | clearQuizStorage misses v1 keys | No | T7b-07 |
| Information Disclosure | Dev harness in prod build | No | T7b-04 |
| Information Disclosure | Module singleton in SSR | Partial | Only risky if SSR migration happens; T7b-10 |
| Denial of Service | QuotaExceededError silent | No | T7b-02 |
| Elevation of Privilege | N/A | N/A | No server-side auth surface |

---

## Compliance Mapping (OWASP ASVS L1)

| Control | Requirement | Status |
|---------|------------|--------|
| V5.1.1 | Validate all input, including file imports | FAIL — T7b-01 |
| V5.3.3 | Encode output for context; use DOMPurify where rendering HTML | PARTIAL — T7b-09 |
| V11.1.2 | Handle all exceptions; do not expose error detail | FAIL — T7b-02 |
| V14.4.1 | Content-Security-Policy deployed without unsafe directives | FAIL — T7b-03 |
| V14.2.1 | No debug/dev functionality in production | FAIL — T7b-04 |
| V8.2.1 | Validate and sanitise data before storage | PARTIAL — T7b-01, T7b-06 |
| V3.3.1 | Destroy all session data on reset/logout | FAIL — T7b-07 |
| V2.9.1 | Use cryptographically secure random for identifiers | FAIL — T7b-08 |

---

*Audit performed read-only on branch `feature/study-v1`. No files were modified.*
