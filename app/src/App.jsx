import Quiz from './lib/Quiz';
import { quiz } from './quiz.js';
import { categories } from './categories';
import Landing from "./Landing";
import './index.css';

function App() {
    const path = window.location.pathname;

    return (
        <>
            {path === '/' && <Landing />}
            {path === '/kviz' && (
                <div className="App">
                    <div id="main-container">
                        <Quiz quiz={quiz} categories={categories.categories}/>
                    </div>
                </div>
            )}
        </>
    );
}

export default App;
