import { Check, X } from 'lucide-react';

const CORRECT_MESSAGE = 'Máte pravdu. Pro pokračování klikněte na tlačítko «Další»';
const INCORRECT_MESSAGE = 'Nesprávná odpověď. Správná odpověď je zvýrazněná.';

interface AnswerFeedbackProps {
  showInstantFeedback: boolean;
  incorrectAnswer: boolean;
  correctAnswer: boolean;
}

function AnswerFeedback({
  showInstantFeedback, incorrectAnswer, correctAnswer,
}: AnswerFeedbackProps) {
  if (!showInstantFeedback || (!incorrectAnswer && !correctAnswer)) {
    return null;
  }

  const right = correctAnswer;

  return (
    <div
      role="status"
      className={`mb-4 flex items-center gap-2 rounded-lg px-4 py-3 text-sm ${
        right ? 'bg-green-50 text-green-800' : 'bg-wrong-50 text-wrong-700'
      }`}
    >
      {right ? <Check className="w-5 h-5 shrink-0" /> : <X className="w-5 h-5 shrink-0" />}
      {right ? CORRECT_MESSAGE : INCORRECT_MESSAGE}
    </div>
  );
}

export default AnswerFeedback;
