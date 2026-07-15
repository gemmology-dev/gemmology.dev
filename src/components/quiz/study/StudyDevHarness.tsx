/**
 * Dev harness component — only used in `src/pages/_dev/study-components.astro`.
 * Not exported from the main index; never imported in production code.
 */

import { useState } from 'react';
import { DEFAULT_STUDY_SETTINGS } from '../../../lib/quiz/study-types';
import type { StudySettings, StudyStore } from '../../../lib/quiz/study-types';
import { ConfidenceTap } from './ConfidenceTap';
import { RationalePanel } from './RationalePanel';
import type { OptionRationale } from './RationalePanel';
import { ScheduleBadge } from './ScheduleBadge';
import { UnvettedFlag } from './UnvettedFlag';
import { StudySettingsPanel } from './StudySettingsPanel';
import { ExportImportPanel } from './ExportImportPanel';
import { LearnQuizWidget } from './LearnQuizWidget';
import type { WidgetQuestion } from './LearnQuizWidget';

// ── Mock store (success) ──────────────────────────────────────────────────────

function makeMockStore(exportFails = false): StudyStore {
  return {
    appendResponse: async () => {},
    getResponsesFor: async () => [],
    getRecentResponses: async () => [],
    getSchedule: async () => null,
    updateSchedule: async () => {},
    getDueItems: async () => [],
    getProgress: async () => ({
      completedTopics: {} as any,
      bestScores: {} as any,
      totalQuizzes: 0,
      totalCorrect: 0,
      totalAttempted: 0,
      lastActivity: 0,
    }),
    updateProgress: async () => {},
    getSettings: async () => DEFAULT_STUDY_SETTINGS,
    updateSettings: async () => {},
    exportAll: exportFails
      ? async () => { throw new Error('Simulated disk full'); }
      : async () => JSON.stringify({ version: 1, mock: true }, null, 2),
    importAll: async () => ({ success: true, warnings: [] }),
  };
}

// ── Fixtures ──────────────────────────────────────────────────────────────────

const NOW = Date.now();

const SCHEDULE_ENTRIES = {
  neverSeen: null,
  due: {
    questionId: 'x',
    nextDue: NOW - 1000,
    intervalDays: 1,
    easeFactor: 2.5,
    repetitions: 1,
    lapses: 0,
    lastReviewed: NOW - 86_400_000,
    totalReviews: 2,
  },
  mastered7: {
    questionId: 'y',
    nextDue: NOW + 86_400_000 * 7,
    intervalDays: 7,
    easeFactor: 2.6,
    repetitions: 3,
    lapses: 0,
    lastReviewed: NOW - 86_400_000,
    totalReviews: 5,
  },
  mastered30: {
    questionId: 'z',
    nextDue: NOW + 86_400_000 * 30,
    intervalDays: 30,
    easeFactor: 2.8,
    repetitions: 6,
    lapses: 1,
    lastReviewed: NOW - 86_400_000,
    totalReviews: 10,
  },
} as const;

const OPTION_RATIONALES: OptionRationale[] = [
  {
    text: 'Natural ruby (corundum)',
    isCorrect: true,
    rationale: 'RI 1.762–1.770, SG 4.00, uniaxial negative: all diagnostic of corundum.',
  },
  {
    text: 'Spinel',
    isCorrect: false,
    rationale: 'Spinel is isotropic (single RI ≈ 1.718); no uniaxial reading possible.',
  },
  {
    text: 'Pyrope garnet',
    isCorrect: false,
    rationale: 'Pyrope is isotropic and SG 3.7–3.9, not 4.00.',
  },
];

const MOCK_QUESTIONS: WidgetQuestion[] = [
  {
    id: 'q1',
    questionText:
      'A polished red stone gives RI 1.762–1.770, SG 4.00, uniaxial negative. What is the most likely identification?',
    options: ['Natural ruby (corundum)', 'Spinel', 'Pyrope garnet'],
    correctAnswer: 'Natural ruby (corundum)',
    rationaleCorrect:
      'The diagnostic chain is optic character first (eliminates spinel and pyrope as isotropic), then SG (eliminates remaining alternatives at 4.00).',
    optionRationales: OPTION_RATIONALES,
  },
  {
    id: 'q2',
    questionText: 'Which crystal system is diamond?',
    options: ['Cubic', 'Hexagonal', 'Trigonal'],
    correctAnswer: 'Cubic',
    rationaleCorrect: 'Diamond crystallises in the cubic (isometric) system with point group m3m.',
    optionRationales: [
      { text: 'Cubic', isCorrect: true, rationale: 'Correct: m3m symmetry.' },
      { text: 'Hexagonal', isCorrect: false, rationale: '6-fold symmetry axis; does not apply to diamond.' },
      { text: 'Trigonal', isCorrect: false, rationale: '3-fold symmetry; quartz and corundum, not diamond.' },
    ],
  },
  {
    id: 'q3',
    questionText: 'What causes asterism in star ruby?',
    options: ['Silk (rutile needles)', 'Liquid inclusions', 'Growth planes'],
    correctAnswer: 'Silk (rutile needles)',
    rationaleCorrect:
      'Rutile needle inclusions oriented along three sets of planes at 120° produce the six-rayed star by reflected light.',
    optionRationales: [
      { text: 'Silk (rutile needles)', isCorrect: true, rationale: 'Three sets of intersecting rutile needles at 60°/120°.' },
      { text: 'Liquid inclusions', isCorrect: false, rationale: 'Liquid inclusions produce internal reflections, not asterism.' },
      { text: 'Growth planes', isCorrect: false, rationale: 'Growth planes can cause colour zoning, not asterism.' },
    ],
  },
];

const MOCK_QUESTIONS_UNVETTED: WidgetQuestion[] = [
  {
    ...MOCK_QUESTIONS[0],
    id: 'q1-unvetted',
    unvetted: true,
  },
];

// ── Section wrapper ───────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-slate-200 pb-8 dark:border-coffee-border">
      <h2 className="text-lg font-semibold text-slate-800 mb-4 dark:text-cream-primary">{title}</h2>
      {children}
    </section>
  );
}

function Sub({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-slate-500 uppercase tracking-wider mb-2 dark:text-cream-muted">{label}</p>
      {children}
    </div>
  );
}

// ── Interactive ConfidenceTap ─────────────────────────────────────────────────

function InteractiveConfidenceTap() {
  const [value, setValue] = useState<'unsure' | 'fairly-sure' | 'certain' | null>(null);
  return (
    <div>
      <ConfidenceTap value={value} onChange={setValue} />
      <p className="text-xs text-slate-600 mt-1 dark:text-cream-secondary">
        Selected: <code>{value ?? 'null'}</code>. Try keyboard Q/W/E.
      </p>
    </div>
  );
}

// ── Interactive StudySettingsPanel ────────────────────────────────────────────

function InteractiveSettings() {
  const [settings, setSettings] = useState<StudySettings>({ ...DEFAULT_STUDY_SETTINGS });
  return (
    <div>
      <StudySettingsPanel
        value={settings}
        onChange={(patch) => setSettings((s) => ({ ...s, ...patch }))}
      />
      <pre className="mt-3 text-xs bg-slate-100 rounded p-3 overflow-auto dark:bg-coffee-raised2 dark:text-cream-secondary">
        {JSON.stringify(settings, null, 2)}
      </pre>
    </div>
  );
}

// ── Main harness component ────────────────────────────────────────────────────

export function StudyDevHarness() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-12 dark:bg-coffee-page">
      <header className="border-b border-slate-200 pb-4 dark:border-coffee-border">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-cream-primary">Study Components: Dev Harness</h1>
        <p className="text-sm text-slate-600 mt-1 dark:text-cream-secondary">
          Only served in development (<code>import.meta.env.DEV</code>). All components rendered
          with mocked data.
        </p>
      </header>

      {/* ── ConfidenceTap ─────────────────────────────────────────────────── */}
      <Section title="ConfidenceTap">
        <div className="space-y-6">
          <Sub label="value=null (nothing selected)">
            <ConfidenceTap value={null} onChange={() => {}} />
          </Sub>
          <Sub label="value='unsure'">
            <ConfidenceTap value="unsure" onChange={() => {}} />
          </Sub>
          <Sub label="value='fairly-sure'">
            <ConfidenceTap value="fairly-sure" onChange={() => {}} />
          </Sub>
          <Sub label="value='certain'">
            <ConfidenceTap value="certain" onChange={() => {}} />
          </Sub>
          <Sub label="disabled=true (value='certain')">
            <ConfidenceTap value="certain" onChange={() => {}} disabled={true} />
          </Sub>
          <Sub label="Interactive: keyboard shortcuts Q/W/E active">
            <InteractiveConfidenceTap />
          </Sub>
        </div>
      </Section>

      {/* ── RationalePanel ────────────────────────────────────────────────── */}
      <Section title="RationalePanel">
        <div className="space-y-6">
          <Sub label="correct=true, all option rationales">
            <RationalePanel
              correct={true}
              rationaleCorrect="The diagnostic chain is optic character first (eliminates spinel and pyrope as isotropic), then SG (eliminates remaining alternatives at 4.00)."
              optionRationales={OPTION_RATIONALES}
              userPickedIndex={0}
              show={true}
            />
          </Sub>
          <Sub label="correct=false, user picked index 1 (Spinel)">
            <RationalePanel
              correct={false}
              rationaleCorrect="The diagnostic chain is optic character first."
              optionRationales={OPTION_RATIONALES}
              userPickedIndex={1}
              show={true}
            />
          </Sub>
          <Sub label="no optionRationales provided">
            <RationalePanel
              correct={true}
              rationaleCorrect="Simple rationale with no per-option breakdown."
              show={true}
            />
          </Sub>
          <Sub label="show=false (renders nothing)">
            <RationalePanel
              correct={true}
              rationaleCorrect="This should not be visible."
              show={false}
            />
            <p className="text-xs text-slate-500 italic dark:text-cream-muted">^ Nothing above</p>
          </Sub>
        </div>
      </Section>

      {/* ── ScheduleBadge ─────────────────────────────────────────────────── */}
      <Section title="ScheduleBadge">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex flex-col gap-1 items-start">
            <span className="text-xs text-slate-500 dark:text-cream-muted">null entry</span>
            <ScheduleBadge entry={null} now={NOW} />
          </div>
          <div className="flex flex-col gap-1 items-start">
            <span className="text-xs text-slate-500 dark:text-cream-muted">totalReviews=0</span>
            <ScheduleBadge entry={{ ...SCHEDULE_ENTRIES.mastered7, totalReviews: 0 }} now={NOW} />
          </div>
          <div className="flex flex-col gap-1 items-start">
            <span className="text-xs text-slate-500 dark:text-cream-muted">due now</span>
            <ScheduleBadge entry={SCHEDULE_ENTRIES.due} now={NOW} />
          </div>
          <div className="flex flex-col gap-1 items-start">
            <span className="text-xs text-slate-500 dark:text-cream-muted">7 days</span>
            <ScheduleBadge entry={SCHEDULE_ENTRIES.mastered7} now={NOW} />
          </div>
          <div className="flex flex-col gap-1 items-start">
            <span className="text-xs text-slate-500 dark:text-cream-muted">30 days</span>
            <ScheduleBadge entry={SCHEDULE_ENTRIES.mastered30} now={NOW} />
          </div>
        </div>
      </Section>

      {/* ── UnvettedFlag ──────────────────────────────────────────────────── */}
      <Section title="UnvettedFlag">
        <div className="space-y-4">
          <Sub label="unvetted=true (hover for tooltip)">
            <UnvettedFlag unvetted={true} />
          </Sub>
          <Sub label="unvetted=false (renders nothing)">
            <UnvettedFlag unvetted={false} />
            <p className="text-xs text-slate-500 italic dark:text-cream-muted">^ Nothing above</p>
          </Sub>
        </div>
      </Section>

      {/* ── StudySettingsPanel ────────────────────────────────────────────── */}
      <Section title="StudySettingsPanel">
        <InteractiveSettings />
      </Section>

      {/* ── ExportImportPanel ─────────────────────────────────────────────── */}
      <Section title="ExportImportPanel">
        <div className="space-y-6">
          <Sub label="Mock store: export succeeds, download triggers">
            <ExportImportPanel store={makeMockStore(false)} />
          </Sub>
          <Sub label="Mock store: export fails (error toast)">
            <ExportImportPanel store={makeMockStore(true)} />
          </Sub>
        </div>
      </Section>

      {/* ── LearnQuizWidget ───────────────────────────────────────────────── */}
      <Section title="LearnQuizWidget">
        <div className="space-y-8">
          <Sub label="3 questions: full interactive flow">
            <LearnQuizWidget
              slug="species/corundum"
              pretestEnabled={true}
              questions={MOCK_QUESTIONS}
              store={makeMockStore()}
            />
          </Sub>
          <Sub label="pretestEnabled=false (renders nothing)">
            <LearnQuizWidget
              slug="species/corundum"
              pretestEnabled={false}
              questions={MOCK_QUESTIONS}
            />
            <p className="text-xs text-slate-500 italic dark:text-cream-muted">^ Nothing above</p>
          </Sub>
          <Sub label="1 question only">
            <LearnQuizWidget
              slug="fundamentals/crystal-systems"
              pretestEnabled={true}
              questions={[MOCK_QUESTIONS[1]]}
              store={makeMockStore()}
            />
          </Sub>
          <Sub label="Unvetted question (auto-generated flag shown)">
            <LearnQuizWidget
              slug="equipment/refractometer"
              pretestEnabled={true}
              questions={MOCK_QUESTIONS_UNVETTED}
              store={makeMockStore()}
            />
          </Sub>
        </div>
      </Section>
    </div>
  );
}
