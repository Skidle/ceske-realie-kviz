import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import SiteLayout from './pages/SiteLayout';
import LandingPage from './pages/LandingPage';
import QuizPage from './pages/QuizPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<SiteLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/kviz" element={<QuizPage />} />
          {/* Any other path used to render a blank page; send it home instead. */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
