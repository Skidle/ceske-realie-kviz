import QuizSetup from '../quiz/QuizSetup';
import { quiz } from '../content/quiz';
import { categories } from '../content/categories';

function QuizPage() {
  return (
    <main className="container mx-auto px-4 pt-20 sm:pt-24 pb-10 sm:pb-14 flex-grow">
      <div className="max-w-2xl mx-auto bg-white rounded-lg border border-flag-100 shadow-sm">
        {/* The flag, as a rule rather than a picture. */}
        <div className="flex h-1 rounded-t-lg overflow-hidden">
          <div className="w-1/2 bg-flag-600" />
          <div className="w-1/2 bg-wrong-500" />
        </div>
        <div className="p-5 md:p-8">
        <QuizSetup quiz={quiz} categories={categories.categories} />
        </div>
      </div>
    </main>
  );
}

export default QuizPage;
