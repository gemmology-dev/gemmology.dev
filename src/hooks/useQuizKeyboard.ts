/**
 * Keyboard essentials for quiz/exam navigation (A8).
 *
 * `classifyKeyEvent` is a pure function so the key-handling logic can be
 * tested without mounting a component or a real DOM keydown listener.
 * `useQuizKeyboard` wires it to a document-level `keydown` listener,
 * mirroring the pattern used by ConfidenceTap's q/w/e shortcuts (separate
 * listener, disjoint keys — no conflict).
 */

import { useEffect, useCallback } from 'react';

export type QuizKeyAction =
  | { type: 'select-index'; index: number }
  | { type: 'enter' }
  | { type: 'none' };

/** Minimal shape needed from a KeyboardEvent — kept narrow for easy testing. */
export interface ClassifiableKeyEvent {
  key: string;
  target: EventTarget | null;
  ctrlKey?: boolean;
  metaKey?: boolean;
  altKey?: boolean;
}

const DIGIT_KEYS = ['1', '2', '3', '4'];

/**
 * Classifies a keydown event into a quiz keyboard action.
 *
 * - Digits 1-4 → `select-index` (0-based), suppressed when focus is inside an
 *   input/textarea/select (keeps fill-blank text entry and matching selects
 *   safe from accidental option selection).
 * - Enter → `enter` (submit/advance — the caller decides which, based on its
 *   own state), NOT suppressed inside inputs so fill-blank can be completed
 *   with Enter.
 * - Any key combined with a modifier (Ctrl/Cmd/Alt), or `enabled: false`
 *   (e.g. a confirm dialog is open), is ignored.
 */
export function classifyKeyEvent(
  event: ClassifiableKeyEvent,
  enabled: boolean
): QuizKeyAction {
  if (!enabled) return { type: 'none' };
  if (event.ctrlKey || event.metaKey || event.altKey) return { type: 'none' };

  if (event.key === 'Enter') {
    return { type: 'enter' };
  }

  const tag = (event.target as Element | null)?.tagName?.toLowerCase() ?? '';
  const isInInput = tag === 'input' || tag === 'textarea' || tag === 'select';
  if (isInInput) return { type: 'none' };

  if (DIGIT_KEYS.includes(event.key)) {
    return { type: 'select-index', index: DIGIT_KEYS.indexOf(event.key) };
  }

  return { type: 'none' };
}

export interface UseQuizKeyboardOptions {
  /** When false, all shortcuts are inert (e.g. a confirm dialog is open). */
  enabled: boolean;
  /** Called for digit keys 1-4, with a 0-based option index. */
  onSelectIndex?: (index: number) => void;
  /** Called for Enter. The caller decides whether that means submit or advance. */
  onEnter?: () => void;
}

/** Wires `classifyKeyEvent` to a document-level keydown listener. */
export function useQuizKeyboard({
  enabled,
  onSelectIndex,
  onEnter,
}: UseQuizKeyboardOptions): void {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const action = classifyKeyEvent(e, enabled);
      if (action.type === 'none') return;
      if (action.type === 'enter') {
        e.preventDefault();
        onEnter?.();
      } else if (action.type === 'select-index') {
        onSelectIndex?.(action.index);
      }
    },
    [enabled, onSelectIndex, onEnter]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
