/**
 * Shared answer-normalization for free-text comparisons (fill-blank, and the
 * string branches of matching/mcq correctness checks).
 *
 * Pipeline: trim -> NFKD-decompose + strip combining diacritics -> lowercase
 * -> collapse internal whitespace runs to a single space -> trim again.
 *
 * Deliberately does NOT implement numeric-word equivalence (e.g. "10" vs
 * "ten"): curators are expected to list every acceptable surface form in
 * `acceptedAnswers` (see docs/authoring-questions.md).
 */

// Combining diacritical marks block (U+0300-U+036F), reached after NFKD
// decomposition splits accented characters into base + combining mark.
const COMBINING_MARKS_RE = /[̀-ͯ]/g;

export function normalizeAnswer(value: string): string {
  return value
    .trim()
    .normalize('NFKD')
    .replace(COMBINING_MARKS_RE, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}
