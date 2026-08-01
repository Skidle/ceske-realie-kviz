import React, { useState } from 'react';
import QuizRunner from './QuizRunner';
import flag from '../assets/cz_flag.png';
import { getFinalQuestions } from './selection';
import type { Category, QuizData } from '../content/types';

interface QuizSetupProps {
  quiz: QuizData;
  categories: Category[];
}

function QuizSetup({
  quiz,
  categories,
}: QuizSetupProps) {
  const [start, setStart] = useState(false);

  const [shuffle, toggleShuffle] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<number | ''>('');
  const [selectedSubCategory, setSelectedSubCategory] = useState<number | ''>('');
  const [isRealTest, setIsRealTest] = useState(false);

  const appLocale = quiz.appLocale;

  const handleCategoryChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const category = event.target.value === '' ? '' : parseInt(event.target.value, 10);
    setSelectedCategory(category);
    setSelectedSubCategory('');
  };

  const handleSubCategoryChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const subCategory = event.target.value === '' ? '' : parseInt(event.target.value, 10);
    setSelectedSubCategory(subCategory);
  };

  const handleShuffleChange = () => {
    toggleShuffle(!shuffle);
  };

  const handleRealTestToggle = () => {
    setIsRealTest((prevState) => {
      const isRealTestEnabled = !prevState;

      if (isRealTestEnabled) {
        setSelectedCategory('');
        setSelectedSubCategory('');
        toggleShuffle(false);
      }

      return isRealTestEnabled;
    });
  };

  const finalQuestions = getFinalQuestions({
    questions: quiz.questions,
    selectedCategory,
    selectedSubCategory,
    shuffle,
    isRealTest,
  });

  return (
    <div className="react-quiz-container">
      {!start && (
        <div>
          <h2>{quiz.quizTitle}</h2>
          <div className="quiz-synopsis">
            <span>
              <strong>Vítejte v aplikaci pro přípravu na zkoušku z českých reálií!</strong>
              {/* decorative: the adjacent text already says this is the Czech exam */}
              <img src={flag} alt="" style={{
                width: '20px',
                border: 'solid 1px #aeaeae',
                height: 'auto',
                marginLeft: '5px',
              }} />
            </span>
            <br /><br />

            <details>
              <summary>Popis aplikace</summary>
              <br />
              Interaktivní testové úlohy vám pomohou efektivně se připravit na zkoušku a prohloubit vaše znalosti o České republice.
              <br /><br />
              Úlohy pocházejí z Národního pedagogického institutu České republiky, který je výhradním vlastníkem autorských práv.
              <br /><br />
              <span>
              Více informací o zkoušce a jejím průběhu naleznete na stránkách <a href='https://cestina-pro-cizince.cz/obcanstvi/' target="_blank" rel="noopener noreferrer">https://cestina-pro-cizince.cz/obcanstvi/</a>.
            </span>
              <br /><br />
              Hodně štěstí při přípravě a úspěchu u zkoušky!
              <br /><br />
              Pokud narazíte na jakýkoli problém s aplikací, neváhejte nás kontaktovat na: <a href="mailto:cz.citizenship.guide@gmail.com">cz.citizenship.guide@gmail.com</a>.
            </details>
          </div>

          <h2>{appLocale.settings}</h2>

          <div className="toggle-container">
            <span id="toggleLabel" aria-hidden="true">{appLocale.realTestLabel}</span>
            <label className="toggle-switch">
              <span className="visually-hidden">{appLocale.realTestLabel}</span>
              <input type="checkbox" id="realTestToggle" checked={isRealTest} onChange={handleRealTestToggle} />
              <span className="slider"></span>
            </label>
          </div>

          <br />

          <div>
            <label htmlFor="categorySelect">{appLocale.chooseCategoryLabel}</label>
            <br />
            <div className="custom-select-container">
              <select id="categorySelect" className="custom-select" value={selectedCategory} onChange={handleCategoryChange} disabled={isRealTest}>
                <option value="">{appLocale.allCategoriesLabel}</option>
                {categories.map((cat: Category, idx: number) => (
                  <option value={idx} key={idx}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>

          {selectedCategory !== '' && (
            <>
              <div>
                <label htmlFor="subCategorySelect">{appLocale.chooseSubCategoryLabel}</label>
                <br />
                <div className="custom-select-container">
                  <select id="subCategorySelect" className="custom-select" value={selectedSubCategory} onChange={handleSubCategoryChange} disabled={isRealTest}>
                    <option value="">{appLocale.allSubCategoriesLabel}</option>
                    {categories[selectedCategory].subCategories.map((subCat: string, idx: number) => (
                      <option value={idx} key={idx}>{subCat}</option>
                    ))}
                  </select>
                </div>
              </div>
            </>
          )}

          <div className="simple-checkbox-container">
            <label htmlFor="shuffleToggle">{appLocale.shuffleCheckboxLabel}</label>
            <input type="checkbox" id="shuffleToggle" checked={shuffle} onChange={handleShuffleChange} disabled={isRealTest} />
          </div>

          <br /><br />

          <div>
            {appLocale.landingHeaderText.replace('<questionLength>', String(finalQuestions.length))}
          </div>

          <div className="startQuizWrapper">
            <button type="button" onClick={() => setStart(true)} className="startQuizBtn primary-button btn">
              {appLocale.startQuizBtn}
            </button>
          </div>
        </div>
      )}

      {start && (
        <>
          <button type="button" onClick={() => setStart(false)} id="icon-back-button" aria-label={appLocale.backButtonLabel}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                 className="feather feather-arrow-left">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
          </button>
          <QuizRunner
            questions={finalQuestions}
            appLocale={appLocale}
            showInstantFeedback
          />
        </>
      )}
    </div>
  );
}

export default QuizSetup;
