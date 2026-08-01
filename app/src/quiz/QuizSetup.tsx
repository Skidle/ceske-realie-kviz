import React, { useState } from 'react';

/** Shared by both dropdowns so they cannot drift apart. */
const SELECT_CLASS = 'w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 '
  + 'text-zinc-800 focus:border-indigo-500 focus:outline-none focus:ring-1 '
  + 'focus:ring-indigo-500 disabled:bg-zinc-100 disabled:text-zinc-400';
import { ArrowLeft } from 'lucide-react';
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
    <div>
      {!start && (
        <div>
          <h2 className="text-2xl font-serif mb-4 text-zinc-800">{quiz.quizTitle}</h2>

          <div className="text-zinc-700 mb-8">
            <p className="flex items-center gap-2 font-medium">
              Vítejte v aplikaci pro přípravu na zkoušku z českých reálií!
              {/* decorative: the adjacent text already says this is the Czech exam */}
              <img src={flag} alt="" className="w-5 h-auto border border-zinc-300" />
            </p>

            <details className="mt-4">
              <summary className="cursor-pointer text-fuchsia-600 hover:text-fuchsia-700">
                Popis aplikace
              </summary>
              <div className="mt-3 space-y-3 text-sm">
                <p>
                  Interaktivní testové úlohy vám pomohou efektivně se připravit na zkoušku
                  a prohloubit vaše znalosti o České republice.
                </p>
                <p>
                  Úlohy pocházejí z Národního pedagogického institutu České republiky,
                  který je výhradním vlastníkem autorských práv.
                </p>
                <p>
                  Více informací o zkoušce a jejím průběhu naleznete na stránkách
                  {' '}
                  <a
                    href="https://cestina-pro-cizince.cz/obcanstvi/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-fuchsia-600 hover:text-fuchsia-700 underline"
                  >
                    cestina-pro-cizince.cz
                  </a>
                  .
                </p>
                <p>Hodně štěstí při přípravě a úspěchu u zkoušky!</p>
                <p>
                  Pokud narazíte na jakýkoli problém s aplikací, neváhejte nás kontaktovat na:
                  {' '}
                  <a
                    href="mailto:cz.citizenship.guide@gmail.com"
                    className="text-fuchsia-600 hover:text-fuchsia-700 underline"
                  >
                    cz.citizenship.guide@gmail.com
                  </a>
                  .
                </p>
              </div>
            </details>
          </div>

          <h2 className="text-xl font-serif mb-4 text-zinc-800">{appLocale.settings}</h2>

          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <span id="toggleLabel" aria-hidden="true" className="text-zinc-700">
                {appLocale.realTestLabel}
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <span className="sr-only">{appLocale.realTestLabel}</span>
                <input
                  type="checkbox"
                  id="realTestToggle"
                  checked={isRealTest}
                  onChange={handleRealTestToggle}
                  className="sr-only peer"
                />
                <span
                  className="w-12 h-6 bg-zinc-300 rounded-full transition-colors
                    peer-checked:bg-indigo-600 peer-focus:ring-2 peer-focus:ring-indigo-400"
                />
                <span
                  className="absolute left-1 w-4 h-4 bg-white rounded-full transition-transform
                    peer-checked:translate-x-6"
                />
              </label>
            </div>

            <div>
              <label htmlFor="categorySelect" className="block mb-1 text-sm text-zinc-600">
                {appLocale.chooseCategoryLabel}
              </label>
              <select
                id="categorySelect"
                value={selectedCategory}
                onChange={handleCategoryChange}
                disabled={isRealTest}
                className={SELECT_CLASS}
              >
                <option value="">{appLocale.allCategoriesLabel}</option>
                {categories.map((cat: Category, idx: number) => (
                  <option value={idx} key={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>

            {selectedCategory !== '' && (
              <div>
                <label htmlFor="subCategorySelect" className="block mb-1 text-sm text-zinc-600">
                  {appLocale.chooseSubCategoryLabel}
                </label>
                <select
                  id="subCategorySelect"
                  value={selectedSubCategory}
                  onChange={handleSubCategoryChange}
                  disabled={isRealTest}
                  className={SELECT_CLASS}
                >
                  <option value="">{appLocale.allSubCategoriesLabel}</option>
                  {categories[selectedCategory].subCategories.map((subCat: string, idx: number) => (
                    <option value={idx} key={subCat}>{subCat}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="shuffleToggle"
                checked={shuffle}
                onChange={handleShuffleChange}
                disabled={isRealTest}
                className="w-4 h-4 accent-indigo-600 disabled:opacity-50"
              />
              <label htmlFor="shuffleToggle" className="text-zinc-700">
                {appLocale.shuffleCheckboxLabel}
              </label>
            </div>
          </div>

          <p className="mt-8 text-zinc-600">
            {appLocale.landingHeaderText.replace('<questionLength>', String(finalQuestions.length))}
          </p>

          <button
            type="button"
            onClick={() => setStart(true)}
            className="mt-4 w-full bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium
              hover:bg-indigo-700 transition-colors"
          >
            {appLocale.startQuizBtn}
          </button>
        </div>
      )}

      {start && (
        <>
          <button
            type="button"
            onClick={() => setStart(false)}
            aria-label={appLocale.backButtonLabel}
            className="mb-4 inline-flex items-center gap-1 text-fuchsia-600 hover:text-fuchsia-700"
          >
            <ArrowLeft className="w-5 h-5" />
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
