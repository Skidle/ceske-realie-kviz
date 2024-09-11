import React, { useState } from 'react';
import Core from './Core';
import flag from '../cz_flag.png';
import { getFinalQuestions } from '../utils';

function Quiz({
  quiz,
  categories,
}) {
  const [start, setStart] = useState(false);

  const [shuffle, toggleShuffle] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubCategory, setSelectedSubCategory] = useState('');
  const [isRealTest, setIsRealTest] = useState(false);

  const appLocale = quiz.appLocale;

  const handleCategoryChange = (event) => {
    const category = event.target.value === '' ? '' : parseInt(event.target.value, 10);
    setSelectedCategory(category);
    setSelectedSubCategory('');
  };

  const handleSubCategoryChange = (event) => {
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
          <div>
            {appLocale.landingHeaderText.replace('<questionLength>', finalQuestions.length)}
          </div>
          <div className="quiz-synopsis">
            <span>
              <strong>Vítejte v aplikaci pro přípravu na zkoušku z českých reálií!</strong>
              <img src={flag} style={{
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
              Více informací o zkoušce a jejím průběhu naleznete na stránkách <a href='https://cestina-pro-cizince.cz/obcanstvi/' target="_blank">https://cestina-pro-cizince.cz/obcanstvi/</a>.
            </span>
              <br /><br />
              Hodně štěstí při přípravě a úspěchu u zkoušky!
              <br /><br />
              Pokud narazíte na jakýkoli problém s aplikací, neváhejte nás kontaktovat na: <a href="mailto:cz.citizenship.guide@gmail.com">cz.citizenship.guide@gmail.com</a>.
            </details>
          </div>

          <h2>{appLocale.settings}</h2>

          <div className="toggle-container">
            <span id="toggleLabel">{appLocale.realTestLabel}</span>
            <label className="toggle-switch">
              <input type="checkbox" id="realTestToggle" checked={isRealTest} onChange={handleRealTestToggle} />
              <span className="slider"></span>
            </label>
          </div>

          <br />

          <div>
            {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
            <label>{appLocale.chooseCategoryLabel}</label>
            <br />
            <select value={selectedCategory} onChange={handleCategoryChange} disabled={isRealTest}>
              <option value="">{appLocale.allCategoriesLabel}</option>
              {categories.map((cat, idx) => (
                // eslint-disable-next-line react/no-array-index-key
                <option value={idx} key={idx}>{cat.name}</option>
              ))}
            </select>
          </div>

          {selectedCategory !== '' && (
            <>
              <div>
                {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
                <label>{appLocale.chooseSubCategoryLabel}</label>
                <br />
                <select value={selectedSubCategory} onChange={handleSubCategoryChange} disabled={isRealTest}>
                  <option value="">{appLocale.allSubCategoriesLabel}</option>
                  {categories[selectedCategory].subCategories.map((subCat, idx) => (
                    // eslint-disable-next-line react/no-array-index-key
                    <option value={idx} key={idx}>{subCat}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div className="simple-checkbox-container">
            {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
            <label>{appLocale.shuffleCheckboxLabel}</label>
            <input type="checkbox" checked={shuffle} onChange={handleShuffleChange} disabled={isRealTest} />
          </div>

          <div className="startQuizWrapper">
            <button type="button" onClick={() => setStart(true)} className="startQuizBtn btn">
              {appLocale.startQuizBtn}
            </button>
          </div>
        </div>
      )}

      {start && (
        <>
          <button type="button" onClick={() => setStart(false)} id="icon-back-button">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                 className="feather feather-arrow-left">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
          </button>
          <Core
            questions={finalQuestions}
            appLocale={appLocale}
            showInstantFeedback
          />
        </>
      )}
    </div>
  );
}

export default Quiz;
