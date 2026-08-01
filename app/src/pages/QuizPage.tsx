import QuizSetup from '../quiz/QuizSetup';
import { quiz } from '../content/quiz';
import { categories } from '../content/categories';

function QuizPage() {
  return (
    <main className="container mx-auto px-4 pt-32 pb-16 flex-grow">
      <div className="max-w-2xl mx-auto bg-white/60 backdrop-blur-sm rounded-2xl shadow p-6 md:p-8">
        <QuizSetup quiz={quiz} categories={categories.categories} />
      </div>
    </main>
  );
}

export default QuizPage;
