/**
 * Question generator for the quiz system.
 * Extracts questions from YAML learn content (tables, items, comparisons).
 */

import type {
  Question,
  QuestionType,
  Category,
  Difficulty,
  QuizConfig,
} from './question-types';
import { shuffle, pickRandom, generateWrongAnswers } from './shuffle';

/** Section structure from learn YAML content */
interface LearnSection {
  title: string;
  id?: string;
  content?: string;
  items?: Array<{
    name: string;
    value?: string;
    description?: string;
    examples?: string[];
  }>;
  table?: {
    caption?: string;
    headers: string[];
    rows: string[][];
  };
  comparison?: {
    items: Array<{
      title: string;
      points: string[];
    }>;
  };
  subsections?: LearnSection[];
}

/** Learn content entry structure (matches Astro collection) */
export interface LearnEntry {
  id: string;
  data: {
    title: string;
    description: string;
    category: Category;
    difficulty?: Difficulty;
    sections: LearnSection[];
  };
}

/** Options for question generation */
interface GeneratorOptions {
  /** Max questions to generate per section */
  maxPerSection?: number;
  /** Question types to include */
  types?: QuestionType[];
  /** Categories to include */
  categories?: Category[];
  /** Difficulties to include */
  difficulties?: Difficulty[];
}

const DEFAULT_OPTIONS: GeneratorOptions = {
  maxPerSection: 3,
  types: ['multiple-choice', 'true-false', 'matching', 'fill-blank'],
};

/**
 * Generate quiz questions from learn content entries.
 */
export function generateQuestions(
  entries: LearnEntry[],
  options: GeneratorOptions = {}
): Question[] {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const questions: Question[] = [];

  for (const entry of entries) {
    // Filter by category if specified
    if (opts.categories && !opts.categories.includes(entry.data.category)) {
      continue;
    }

    // Filter by difficulty if specified
    const difficulty = entry.data.difficulty || 'intermediate';
    if (opts.difficulties && !opts.difficulties.includes(difficulty)) {
      continue;
    }

    // Process each section
    for (const section of entry.data.sections) {
      const sectionQuestions = generateSectionQuestions(
        section,
        entry,
        opts
      );
      questions.push(...sectionQuestions);

      // Process subsections
      if (section.subsections) {
        for (const subsection of section.subsections) {
          const subQuestions = generateSectionQuestions(
            subsection,
            entry,
            opts
          );
          questions.push(...subQuestions);
        }
      }
    }
  }

  return questions;
}

/**
 * Generate questions from a single section.
 */
function generateSectionQuestions(
  section: LearnSection,
  entry: LearnEntry,
  options: GeneratorOptions
): Question[] {
  const questions: Question[] = [];
  const maxPerSection = options.maxPerSection || 3;

  // Generate from tables
  if (section.table && options.types?.includes('multiple-choice')) {
    const tableQuestions = generateTableQuestions(section.table, entry, section.title);
    questions.push(...tableQuestions.slice(0, maxPerSection));
  }

  // Generate from items
  if (section.items && section.items.length > 0) {
    if (options.types?.includes('fill-blank')) {
      const fillBlankQuestions = generateFillBlankQuestions(section.items, entry, section.title);
      questions.push(...fillBlankQuestions.slice(0, maxPerSection));
    }
    if (options.types?.includes('true-false')) {
      const trueFalseQuestions = generateTrueFalseFromItems(section.items, entry, section.title);
      questions.push(...trueFalseQuestions.slice(0, maxPerSection));
    }
  }

  // Generate from comparisons
  if (section.comparison && options.types?.includes('matching')) {
    const matchingQuestions = generateMatchingQuestions(section.comparison, entry, section.title);
    questions.push(...matchingQuestions.slice(0, maxPerSection));
  }

  return questions;
}

/**
 * Generate multiple-choice questions from table data.
 */
function generateTableQuestions(
  table: NonNullable<LearnSection['table']>,
  entry: LearnEntry,
  sectionTitle: string
): Question[] {
  const questions: Question[] = [];
  const { headers, rows } = table;

  if (rows.length < 2) return questions; // Need at least 2 rows for wrong answers

  // Generate "What is [property] of [subject]?" questions
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    const row = rows[rowIndex];
    const subject = row[0]; // First column is typically the subject

    // For each property column (skip first column which is the subject)
    for (let colIndex = 1; colIndex < headers.length; colIndex++) {
      const property = headers[colIndex];
      const correctAnswer = row[colIndex];

      // Skip if value is empty or too short
      if (!correctAnswer || correctAnswer.length < 2) continue;

      // Get wrong answers from other rows in the same column
      const wrongAnswers = rows
        .filter((_, idx) => idx !== rowIndex)
        .map(r => r[colIndex])
        .filter(v => v && v.length >= 2)
        .slice(0, 3);

      if (wrongAnswers.length < 2) continue; // Need at least 2 wrong answers

      const options = shuffle([correctAnswer, ...wrongAnswers.slice(0, 3)]);

      questions.push({
        id: `${entry.id}-table-${rowIndex}-${colIndex}`,
        type: 'multiple-choice',
        difficulty: entry.data.difficulty || 'intermediate',
        category: entry.data.category,
        topic: entry.data.title,
        questionText: `What is the ${property.toLowerCase()} of ${subject}?`,
        options,
        correctAnswer,
        sourceRef: `/learn/${entry.id}`,
      });
    }
  }

  // Generate reverse questions: "Which [subject type] has [property value]?"
  if (rows.length >= 3) {
    for (let colIndex = 1; colIndex < headers.length; colIndex++) {
      const property = headers[colIndex];

      // Pick a random row for the correct answer
      const correctRowIndex = Math.floor(Math.random() * rows.length);
      const correctRow = rows[correctRowIndex];
      const correctAnswer = correctRow[0];
      const propertyValue = correctRow[colIndex];

      if (!propertyValue || propertyValue.length < 2) continue;

      // Get wrong answers from other subjects
      const wrongAnswers = rows
        .filter((_, idx) => idx !== correctRowIndex)
        .map(r => r[0])
        .slice(0, 3);

      if (wrongAnswers.length < 2) continue;

      const options = shuffle([correctAnswer, ...wrongAnswers]);
      const subjectType = headers[0].toLowerCase();

      questions.push({
        id: `${entry.id}-table-reverse-${colIndex}-${correctRowIndex}`,
        type: 'multiple-choice',
        difficulty: entry.data.difficulty || 'intermediate',
        category: entry.data.category,
        topic: entry.data.title,
        questionText: `Which ${subjectType} has ${property.toLowerCase()} of ${propertyValue}?`,
        options,
        correctAnswer,
        sourceRef: `/learn/${entry.id}`,
      });
    }
  }

  return questions;
}

/**
 * Generate fill-in-blank questions from items.
 */
function generateFillBlankQuestions(
  items: NonNullable<LearnSection['items']>,
  entry: LearnEntry,
  sectionTitle: string
): Question[] {
  const questions: Question[] = [];

  for (const item of items) {
    // Generate from name/value pairs
    if (item.value) {
      questions.push({
        id: `${entry.id}-fillblank-${item.name}`,
        type: 'fill-blank',
        difficulty: entry.data.difficulty || 'intermediate',
        category: entry.data.category,
        topic: entry.data.title,
        questionText: `In ${sectionTitle.toLowerCase()}, what is the value for "${item.name}"?`,
        correctAnswer: item.value,
        explanation: item.description,
        sourceRef: `/learn/${entry.id}`,
      });
    }

    // Generate from examples
    if (item.examples && item.examples.length > 0) {
      const example = pickRandom(item.examples, 1)[0];
      if (example) {
        questions.push({
          id: `${entry.id}-fillblank-example-${item.name}`,
          type: 'fill-blank',
          difficulty: entry.data.difficulty || 'intermediate',
          category: entry.data.category,
          topic: entry.data.title,
          questionText: `Name one example of ${item.name.toLowerCase()}.`,
          correctAnswer: item.examples, // Accept any example as correct
          explanation: `Examples include: ${item.examples.join(', ')}`,
          sourceRef: `/learn/${entry.id}`,
        });
      }
    }
  }

  return questions;
}

/**
 * Generate true/false questions from items.
 */
function generateTrueFalseFromItems(
  items: NonNullable<LearnSection['items']>,
  entry: LearnEntry,
  sectionTitle: string
): Question[] {
  const questions: Question[] = [];

  // Find items with values to create true/false statements
  const itemsWithValues = items.filter(item => item.value);

  for (let i = 0; i < itemsWithValues.length; i++) {
    const item = itemsWithValues[i];

    // Create a TRUE statement
    questions.push({
      id: `${entry.id}-tf-true-${item.name}`,
      type: 'true-false',
      difficulty: entry.data.difficulty || 'intermediate',
      category: entry.data.category,
      topic: entry.data.title,
      questionText: `True or False: The ${item.name.toLowerCase()} is ${item.value}.`,
      options: ['True', 'False'],
      correctAnswer: 'True',
      explanation: item.description,
      sourceRef: `/learn/${entry.id}`,
    });

    // Create a FALSE statement by swapping values with another item
    if (itemsWithValues.length > 1) {
      const otherIndex = (i + 1) % itemsWithValues.length;
      const otherItem = itemsWithValues[otherIndex];

      questions.push({
        id: `${entry.id}-tf-false-${item.name}`,
        type: 'true-false',
        difficulty: entry.data.difficulty || 'intermediate',
        category: entry.data.category,
        topic: entry.data.title,
        questionText: `True or False: The ${item.name.toLowerCase()} is ${otherItem.value}.`,
        options: ['True', 'False'],
        correctAnswer: 'False',
        explanation: `The correct answer is: ${item.value}`,
        sourceRef: `/learn/${entry.id}`,
      });
    }
  }

  return questions;
}

/**
 * Generate matching questions from comparison blocks.
 */
function generateMatchingQuestions(
  comparison: NonNullable<LearnSection['comparison']>,
  entry: LearnEntry,
  sectionTitle: string
): Question[] {
  const questions: Question[] = [];

  // Create a "match category to item" question
  const pairs: Array<{ left: string; right: string }> = [];

  for (const compItem of comparison.items) {
    // Pick one point from each comparison item
    if (compItem.points.length > 0) {
      const point = compItem.points[Math.floor(Math.random() * compItem.points.length)];
      pairs.push({ left: point, right: compItem.title });
    }
  }

  if (pairs.length >= 2) {
    questions.push({
      id: `${entry.id}-matching-${sectionTitle}`,
      type: 'matching',
      difficulty: entry.data.difficulty || 'intermediate',
      category: entry.data.category,
      topic: entry.data.title,
      questionText: `Match each item to its correct category:`,
      matchingPairs: pairs,
      correctAnswer: pairs.map(p => `${p.left}:${p.right}`),
      sourceRef: `/learn/${entry.id}`,
    });
  }

  // Also generate multiple-choice questions about category membership
  for (const compItem of comparison.items) {
    if (compItem.points.length > 0) {
      const point = compItem.points[Math.floor(Math.random() * compItem.points.length)];
      const wrongCategories = comparison.items
        .filter(c => c.title !== compItem.title)
        .map(c => c.title)
        .slice(0, 3);

      if (wrongCategories.length >= 2) {
        const options = shuffle([compItem.title, ...wrongCategories]);

        questions.push({
          id: `${entry.id}-comparison-mc-${compItem.title}-${point}`,
          type: 'multiple-choice',
          difficulty: entry.data.difficulty || 'intermediate',
          category: entry.data.category,
          topic: entry.data.title,
          questionText: `"${point}" belongs to which category?`,
          options,
          correctAnswer: compItem.title,
          sourceRef: `/learn/${entry.id}`,
        });
      }
    }
  }

  return questions;
}

/**
 * Filter and select questions based on quiz config.
 */
export function selectQuestions(
  allQuestions: Question[],
  config: QuizConfig
): Question[] {
  let filtered = allQuestions;

  // Filter by categories
  if (config.categories.length > 0) {
    filtered = filtered.filter(q => config.categories.includes(q.category));
  }

  // Filter by difficulty
  if (config.difficulty && config.difficulty.length > 0) {
    filtered = filtered.filter(q => config.difficulty!.includes(q.difficulty));
  }

  // Shuffle if requested
  if (config.shuffleQuestions) {
    filtered = shuffle(filtered);
  }

  // Select the requested number of questions
  return filtered.slice(0, config.questionCount);
}

/**
 * Check if a user's answer is correct.
 */
export function checkAnswer(
  question: Question,
  userAnswer: string | string[]
): boolean {
  const correct = question.correctAnswer;

  // For fill-blank with multiple valid answers
  if (Array.isArray(correct) && typeof userAnswer === 'string') {
    return correct.some(c =>
      c.toLowerCase().trim() === userAnswer.toLowerCase().trim()
    );
  }

  // For matching questions
  if (question.type === 'matching' && Array.isArray(userAnswer) && Array.isArray(correct)) {
    if (userAnswer.length !== correct.length) return false;
    return userAnswer.every(a => correct.includes(a));
  }

  // Standard comparison
  if (typeof correct === 'string' && typeof userAnswer === 'string') {
    return correct.toLowerCase().trim() === userAnswer.toLowerCase().trim();
  }

  return false;
}

/**
 * Get statistics about available questions.
 */
export function getQuestionStats(questions: Question[]): {
  total: number;
  byCategory: Record<Category, number>;
  byDifficulty: Record<Difficulty, number>;
  byType: Record<QuestionType, number>;
} {
  const stats = {
    total: questions.length,
    byCategory: {} as Record<Category, number>,
    byDifficulty: {} as Record<Difficulty, number>,
    byType: {} as Record<QuestionType, number>,
  };

  for (const q of questions) {
    stats.byCategory[q.category] = (stats.byCategory[q.category] || 0) + 1;
    stats.byDifficulty[q.difficulty] = (stats.byDifficulty[q.difficulty] || 0) + 1;
    stats.byType[q.type] = (stats.byType[q.type] || 0) + 1;
  }

  return stats;
}
