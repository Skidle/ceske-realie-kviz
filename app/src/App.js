import Quiz from 'react-quiz-component';
import { quiz } from './quiz.js';

function App() {
  return (
    <div className="App">
        <div style={{ margin: 'auto', width: '500px' }}>
            <Quiz quiz={quiz} showInstantFeedback={true} />
        </div>
    </div>
  );
}

export default App;
