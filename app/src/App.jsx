import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Quiz from './lib/Quiz';
import { quiz } from './quiz.js';
import { categories } from './categories';
import Landing from './Landing';
import './index.css';

function QuizPage() {
  return (
    <div className="App">
      <div id="main-container">
        <Quiz quiz={quiz} categories={categories.categories} />
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/kviz" element={<QuizPage />} />
        {/* Any other path used to render a blank page; send it home instead. */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
