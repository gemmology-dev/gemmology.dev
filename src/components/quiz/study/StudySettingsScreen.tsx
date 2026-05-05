/**
 * StudySettingsScreen — page-level wrapper that wires the StudySettingsPanel
 * and ExportImportPanel against the real LocalStudyStore.
 *
 * Used by `src/pages/study/settings.astro`.
 */

import { useEffect, useState } from 'react';
import { StudySettingsPanel } from './StudySettingsPanel';
import { ExportImportPanel } from './ExportImportPanel';
import { getStudyStore } from '../../../lib/quiz/store/local';
import {
  DEFAULT_STUDY_SETTINGS,
  type StudySettings,
} from '../../../lib/quiz/study-types';

export function StudySettingsScreen() {
  const [store] = useState(() => getStudyStore());
  const [settings, setSettings] = useState<StudySettings>(DEFAULT_STUDY_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;
    void store.getSettings().then(s => {
      if (!mounted) return;
      setSettings(s);
      setLoaded(true);
    });
    return () => {
      mounted = false;
    };
  }, [store]);

  const handleChange = (patch: Partial<StudySettings>) => {
    const next = { ...settings, ...patch, version: 1 as const };
    setSettings(next);
    void store.updateSettings(patch);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-12">
      <div className="max-w-3xl mx-auto px-4 space-y-8">
        <header>
          <h1 className="text-3xl font-bold text-slate-900">Study settings</h1>
          <p className="text-slate-600 mt-2">
            Customise how the study system schedules and presents practice questions.
          </p>
        </header>

        {loaded ? (
          <>
            <StudySettingsPanel value={settings} onChange={handleChange} />
            <ExportImportPanel store={store} />
          </>
        ) : (
          <div className="text-center py-12 animate-pulse text-slate-400">
            Loading settings…
          </div>
        )}
      </div>
    </div>
  );
}
