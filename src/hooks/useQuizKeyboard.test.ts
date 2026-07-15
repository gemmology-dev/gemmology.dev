import { describe, it, expect } from 'vitest';
import { classifyKeyEvent } from './useQuizKeyboard';
import type { ClassifiableKeyEvent } from './useQuizKeyboard';

function makeEvent(overrides: Partial<ClassifiableKeyEvent> = {}): ClassifiableKeyEvent {
  return {
    key: '1',
    target: document.createElement('div'),
    ctrlKey: false,
    metaKey: false,
    altKey: false,
    ...overrides,
  };
}

describe('classifyKeyEvent (A8)', () => {
  it('classifies digits 1-4 as select-index with 0-based indices', () => {
    expect(classifyKeyEvent(makeEvent({ key: '1' }), true)).toEqual({ type: 'select-index', index: 0 });
    expect(classifyKeyEvent(makeEvent({ key: '2' }), true)).toEqual({ type: 'select-index', index: 1 });
    expect(classifyKeyEvent(makeEvent({ key: '3' }), true)).toEqual({ type: 'select-index', index: 2 });
    expect(classifyKeyEvent(makeEvent({ key: '4' }), true)).toEqual({ type: 'select-index', index: 3 });
  });

  it('ignores digits outside 1-4', () => {
    expect(classifyKeyEvent(makeEvent({ key: '5' }), true)).toEqual({ type: 'none' });
    expect(classifyKeyEvent(makeEvent({ key: '0' }), true)).toEqual({ type: 'none' });
  });

  it('classifies Enter as "enter"', () => {
    expect(classifyKeyEvent(makeEvent({ key: 'Enter' }), true)).toEqual({ type: 'enter' });
  });

  it('suppresses digit selection when focus is in an input, textarea, or select', () => {
    for (const tagName of ['input', 'textarea', 'select']) {
      const target = document.createElement(tagName);
      expect(classifyKeyEvent(makeEvent({ key: '1', target }), true)).toEqual({ type: 'none' });
    }
  });

  it('does NOT suppress Enter when focus is in an input (fill-blank safe)', () => {
    const target = document.createElement('input');
    expect(classifyKeyEvent(makeEvent({ key: 'Enter', target }), true)).toEqual({ type: 'enter' });
  });

  it('ignores everything when enabled is false', () => {
    expect(classifyKeyEvent(makeEvent({ key: '1' }), false)).toEqual({ type: 'none' });
    expect(classifyKeyEvent(makeEvent({ key: 'Enter' }), false)).toEqual({ type: 'none' });
  });

  it('ignores keys pressed with modifiers (Ctrl/Cmd/Alt)', () => {
    expect(classifyKeyEvent(makeEvent({ key: '1', ctrlKey: true }), true)).toEqual({ type: 'none' });
    expect(classifyKeyEvent(makeEvent({ key: '1', metaKey: true }), true)).toEqual({ type: 'none' });
    expect(classifyKeyEvent(makeEvent({ key: '1', altKey: true }), true)).toEqual({ type: 'none' });
    expect(classifyKeyEvent(makeEvent({ key: 'Enter', ctrlKey: true }), true)).toEqual({ type: 'none' });
  });

  it('ignores unrelated keys', () => {
    expect(classifyKeyEvent(makeEvent({ key: 'a' }), true)).toEqual({ type: 'none' });
    expect(classifyKeyEvent(makeEvent({ key: 'Escape' }), true)).toEqual({ type: 'none' });
  });
});
