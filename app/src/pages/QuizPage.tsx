import QuizSetup from '../quiz/QuizSetup';
import { quiz } from '../content/quiz';
import { categories } from '../content/categories';

function QuizPage() {
  return (
    <div className="App">
      <div id="main-container">
        <QuizSetup quiz={quiz} categories={categories.categories} />
      </div>
    </div>
  );
}

export default QuizPage;
