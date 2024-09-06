import Quiz from './lib/Quiz';
import { quiz } from './quiz.js';
import { categories } from './categories';

function App() {
  return (
    <div className="App">
        <div id="main-container">
            <Quiz quiz={quiz} showInstantFeedback={true} categories={categories.categories} />
        </div>
    </div>
  );
}

export default App;
