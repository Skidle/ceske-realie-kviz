
const CORRECT_MESSAGE = 'Máte pravdu. Pro pokračování klikněte na tlačítko «Další»';
const INCORRECT_MESSAGE = 'Nesprávná odpověď. Zkuste to prosím znovu.';

interface InstantFeedbackProps {
  showInstantFeedback: boolean;
  incorrectAnswer: boolean;
  correctAnswer: boolean;
}

function InstantFeedback({
  showInstantFeedback, incorrectAnswer, correctAnswer,
}: InstantFeedbackProps) {
  if (!showInstantFeedback) {
    return null;
  }

  return (
    <>
      {incorrectAnswer && <div className="alert incorrect">{INCORRECT_MESSAGE}</div>}
      {correctAnswer && <div className="alert correct">{CORRECT_MESSAGE}</div>}
    </>
  );
}

export default InstantFeedback;
