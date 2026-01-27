/**
 * Array shuffling utilities for quiz question and answer randomization.
 * Uses Fisher-Yates algorithm for unbiased shuffling.
 */

/**
 * Shuffle an array in place using Fisher-Yates algorithm.
 * @param array The array to shuffle
 * @returns The same array, shuffled
 */
export function shuffleInPlace<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/**
 * Return a new shuffled copy of an array.
 * @param array The array to shuffle
 * @returns A new shuffled array
 */
export function shuffle<T>(array: readonly T[]): T[] {
  return shuffleInPlace([...array]);
}

/**
 * Pick n random items from an array without replacement.
 * @param array The array to pick from
 * @param n Number of items to pick
 * @returns Array of n random items
 */
export function pickRandom<T>(array: readonly T[], n: number): T[] {
  if (n >= array.length) {
    return shuffle(array);
  }

  const shuffled = shuffle(array);
  return shuffled.slice(0, n);
}

/**
 * Pick one random item from an array.
 * @param array The array to pick from
 * @returns A random item, or undefined if array is empty
 */
export function pickOne<T>(array: readonly T[]): T | undefined {
  if (array.length === 0) return undefined;
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Shuffle an array of options while tracking which index contains the correct answer.
 * Useful for multiple-choice questions where we need to know the new position.
 * @param options Array of answer options
 * @param correctIndex Index of the correct answer in the original array
 * @returns Object with shuffled options and new correct index
 */
export function shuffleWithCorrectIndex<T>(
  options: readonly T[],
  correctIndex: number
): { shuffled: T[]; newCorrectIndex: number } {
  const indices = options.map((_, i) => i);
  shuffleInPlace(indices);

  const shuffled = indices.map(i => options[i]);
  const newCorrectIndex = indices.indexOf(correctIndex);

  return { shuffled, newCorrectIndex };
}

/**
 * Create wrong answer options by picking from other items, excluding the correct answer.
 * @param allItems All possible items to choose from
 * @param correctItem The correct answer to exclude
 * @param count Number of wrong answers to generate
 * @returns Array of wrong answer options
 */
export function generateWrongAnswers<T>(
  allItems: readonly T[],
  correctItem: T,
  count: number
): T[] {
  const wrongItems = allItems.filter(item => item !== correctItem);
  return pickRandom(wrongItems, count);
}
