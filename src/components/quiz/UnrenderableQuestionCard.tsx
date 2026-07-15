/**
 * Fallback card shown in place of a structurally unrenderable question
 * (e.g. a matching question that lost its pairs, or an MCQ with fewer than
 * 2 options). Never scored — the caller must call `onSkip` to advance.
 */

import { AlertTriangle } from 'lucide-react';
import { Button } from '../ui/Button';
import { IconBox } from '../ui/IconBox';

interface UnrenderableQuestionCardProps {
  /** Current question number (1-based) */
  questionNumber: number;
  /** Total number of questions */
  totalQuestions: number;
  /** Called when the user dismisses this question */
  onSkip: () => void;
}

export function UnrenderableQuestionCard({
  questionNumber,
  totalQuestions,
  onSkip,
}: UnrenderableQuestionCardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
        <span className="text-sm font-medium text-slate-600">
          Question {questionNumber} of {totalQuestions}
        </span>
      </div>

      <div className="px-6 py-10 flex flex-col items-center text-center gap-4">
        <IconBox variant="topaz">
          <AlertTriangle className="w-5 h-5" aria-hidden="true" />
        </IconBox>
        <div>
          <p className="font-medium text-slate-900">This question could not be displayed</p>
          <p className="mt-1 text-sm text-slate-600">
            It is missing data required for its question type. It has not been scored — skip
            ahead to continue.
          </p>
        </div>
        <Button variant="primary" onClick={onSkip}>
          Skip question
        </Button>
      </div>
    </div>
  );
}
