import React, { useState, useEffect, useCallback } from 'react';
import Core from './Core';
import defaultLocale from './Locale';
import './styles.css';

function Quiz({
  quiz,
  shuffleAnswer,
  showDefaultResult,
  onComplete,
  customResultPage,
  showInstantFeedback,
  continueTillCorrect,
  revealAnswerOnSubmit,
  allowNavigation,
  onQuestionSubmit,
  disableSynopsis,
  timer,
  allowPauseTimer,
  enableProgressBar,
  categories,
}) {
  const [start, setStart] = useState(false);
  const [questions, setQuestions] = useState(quiz.questions);

  const [shuffle, toggleShuffle] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSubCategory, setSelectedSubCategory] = useState('all');

  const nrOfQuestions = questions.length;

  // Shuffle answers funtion here
  const shuffleAnswerSequence = (oldQuestions = []) => {
    const newQuestions = oldQuestions.map((question) => {
      const answerWithIndex = question.answers?.map((ans, i) => [ans, i]);
      const shuffledAnswersWithIndex = answerWithIndex.sort(
        () => Math.random() - 0.5,
      );
      const shuffledAnswers = shuffledAnswersWithIndex.map((ans) => ans[0]);
      if (question.answerSelectionType === 'single') {
        const oldCorrectAnswer = question.correctAnswer;
        const newCorrectAnswer = shuffledAnswersWithIndex.findIndex(
          (ans) => `${ans[1] + 1}` === `${oldCorrectAnswer}`,
        ) + 1;
        return {
          ...question,
          correctAnswer: `${newCorrectAnswer}`,
          answers: shuffledAnswers,
        };
      }
      if (question.answerSelectionType === 'multiple') {
        const oldCorrectAnswer = question.correctAnswer;
        const newCorrectAnswer = oldCorrectAnswer.map(
          (cans) => shuffledAnswersWithIndex.findIndex(
            (ans) => `${ans[1] + 1}` === `${cans}`,
          ) + 1,
        );
        return {
          ...question,
          correctAnswer: newCorrectAnswer,
          answers: shuffledAnswers,
        };
      }
      return question;
    });
    return newQuestions;
  };
  const shuffleQuestions = useCallback((q) => {
    for (let i = q.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [q[i], q[j]] = [q[j], q[i]];
    }
    return q;
  }, []);

  useEffect(() => {
    if (disableSynopsis) setStart(true);
  }, []);

  useEffect(() => {
    let newQuestions = questions;

    if (shuffleAnswer) {
      newQuestions = shuffleAnswerSequence(newQuestions);
    }

    newQuestions = newQuestions.map((question, index) => ({
      ...question,
      questionIndex: index + 1,
    }));
    setQuestions(newQuestions);
  }, [start]);

  useEffect(() => {
    let newQuestions = quiz.questions;
    if (selectedCategory !== 'all') {
      newQuestions = newQuestions.filter((question) => question.category === selectedCategory);
    } else {
      newQuestions = quiz.questions;
    }

    if (selectedSubCategory !== 'all') {
      newQuestions = newQuestions.filter((question) => question.subCategory === selectedSubCategory);
    }
    setQuestions(newQuestions);
  }, [selectedCategory, selectedSubCategory]);

  const getIndexInQuestions = (question) => quiz.questions.indexOf(question);

  useEffect(() => {
    let newQuestions = questions;
    if (shuffle) {
      newQuestions = shuffleQuestions(newQuestions);
    } else {
      newQuestions = questions.slice().sort((a, b) => getIndexInQuestions(a) - getIndexInQuestions(b));
    }

    setQuestions(newQuestions);
  }, [shuffle]);

  const validateProgressBarColor = (inputColor) => {
    const hexaPattern = /^#([a-fA-F0-9]{6}|[a-fA-F0-9]{3})$/;
    return hexaPattern.test(inputColor);
  };

  const validateQuiz = (q) => {
    if (!q) {
      console.error('Quiz object is required.');
      return false;
    }

    if ((timer && typeof timer !== 'number') || (timer < 1)) {
      console.error(timer && typeof timer !== 'number' ? 'timer must be a number' : 'timer must be a number greater than 0');
      return false;
    }

    if (allowPauseTimer && typeof allowPauseTimer !== 'boolean') {
      console.error('allowPauseTimer must be a Boolean');
      return false;
    }

    if (enableProgressBar && typeof enableProgressBar !== 'boolean') {
      console.error('enableProgressBar must be a Boolean');
      return false;
    }

    if ('progressBarColor' in quiz) {
      if (typeof quiz.progressBarColor !== 'string') {
        console.error('progressBarColor must be a String');
        return false;
      }

      if (!validateProgressBarColor(quiz.progressBarColor)) {
        console.error('progressBarColor must be a valid hex colour');
        return false;
      }
    }

    for (let i = 0; i < questions.length; i += 1) {
      const {
        question,
        questionType,
        answerSelectionType,
        answers,
        correctAnswer,
      } = questions[i];
      if (!question) {
        console.error("Field 'question' is required.");
        return false;
      }

      if (!questionType) {
        console.error("Field 'questionType' is required.");
        return false;
      }
      if (questionType !== 'text' && questionType !== 'photo') {
        console.error(
          "The value of 'questionType' is either 'text' or 'photo'.",
        );
        return false;
      }

      if (!answers) {
        console.error("Field 'answers' is required.");
        return false;
      }
      if (!Array.isArray(answers)) {
        console.error("Field 'answers' has to be an Array");
        return false;
      }

      if (!correctAnswer) {
        console.error("Field 'correctAnswer' is required.");
        return false;
      }

      let selectType = answerSelectionType;

      if (!answerSelectionType) {
        // Default single to avoid code breaking due to automatic version upgrade
        console.warn(
          'Field answerSelectionType should be defined since v0.3.0. Use single by default.',
        );
        selectType = answerSelectionType || 'single';
      }

      if (
        selectType === 'single'
        && !(typeof selectType === 'string' || selectType instanceof String)
      ) {
        console.error(
          'answerSelectionType is single but expecting String in the field correctAnswer',
        );
        return false;
      }

      if (selectType === 'multiple' && !Array.isArray(correctAnswer)) {
        console.error(
          'answerSelectionType is multiple but expecting Array in the field correctAnswer',
        );
        return false;
      }
    }

    return true;
  };

  if (!validateQuiz(quiz)) {
    return null;
  }

  const appLocale = {
    ...defaultLocale,
    ...quiz.appLocale,
  };

  const handleCategoryChange = (event) => {
    const category = event.target.value === 'all' ? 'all' : parseInt(event.target.value, 10);
    setSelectedCategory(category);
    setSelectedSubCategory('all'); // Reset subcategory
    toggleShuffle(false);
  };

  const handleSubCategoryChange = (event) => {
    const subCategory = event.target.value === 'all' ? 'all' : parseInt(event.target.value, 10);
    setSelectedSubCategory(subCategory);
    toggleShuffle(false);
  };

  const handleShuffleChange = () => {
    toggleShuffle(!shuffle);
  };

  return (
    <div className="react-quiz-container">
      {!start && (
        <div>
          <h2>{quiz.quizTitle}</h2>
          <div>
            {appLocale.landingHeaderText.replace(
              '<questionLength>',
              nrOfQuestions,
            )}
          </div>
          {quiz.quizSynopsis && (
            <div className="quiz-synopsis">{quiz.quizSynopsis}</div>
          )}

          <h2>Nastavení</h2>

          <div>
            {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
            <label>Vyberte kategorii</label>
            <br />
            <select value={selectedCategory} onChange={handleCategoryChange}>
              <option value="all">Všechny kategorie</option>
              {categories.map((cat, idx) => (
                // eslint-disable-next-line react/no-array-index-key
                <option value={idx} key={idx}>{cat.name}</option>
              ))}
            </select>
          </div>

          <br />

          {selectedCategory !== 'all' && (
          <div>
            {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
            <label>Vyberte podkategorii</label>
            <br />
            <select value={selectedSubCategory} onChange={handleSubCategoryChange}>
              <option value="all">Všechny podkategorie</option>
              {categories[selectedCategory].subCategories.map((subCat, idx) => (
                // eslint-disable-next-line react/no-array-index-key
                <option value={idx} key={idx}>{subCat}</option>
              ))}
            </select>
          </div>
          )}

          <br />

          <div className="simple-checkbox-container">
            {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
            <label>Zamíchat otázky</label>
            <input type="checkbox" checked={shuffle} onChange={handleShuffleChange} />
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
                 stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                 className="feather feather-arrow-left">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
          </button>
          <Core
            questions={questions}
            showDefaultResult={showDefaultResult}
            onComplete={onComplete}
            customResultPage={customResultPage}
            showInstantFeedback={showInstantFeedback}
            continueTillCorrect={continueTillCorrect}
            revealAnswerOnSubmit={revealAnswerOnSubmit}
            allowNavigation={allowNavigation}
            appLocale={appLocale}
            onQuestionSubmit={onQuestionSubmit}
            timer={timer}
            allowPauseTimer={allowPauseTimer}
            enableProgressBar={enableProgressBar}
            progressBarColor={quiz.progressBarColor}
          />
        </>
      )}
    </div>
  );
}

export default Quiz;
