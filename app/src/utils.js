const shuffleAnswerSequence = (oldQuestions = []) => {
    const newQuestions = oldQuestions.map((question) => {
        const answerWithIndex = question.answers?.map((ans, i) => [ans, i]);
        const shuffledAnswersWithIndex = answerWithIndex.sort(
            () => Math.random() - 0.5,
        );
        const shuffledAnswers = shuffledAnswersWithIndex.map((ans) => ans[0]);
        const oldCorrectAnswer = question.correctAnswer;
        const newCorrectAnswer = shuffledAnswersWithIndex.findIndex(
            (ans) => `${ans[1] + 1}` === `${oldCorrectAnswer}`,
        ) + 1;
        return {
            ...question,
            correctAnswer: `${newCorrectAnswer}`,
            answers: shuffledAnswers,
        };
    });
    return newQuestions;
};

const shuffleQuestions = (q) => {
    for (let i = q.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [q[i], q[j]] = [q[j], q[i]];
    }
    return q;
};

const shuffleEverything = (questions) => shuffleAnswerSequence(shuffleQuestions(questions));

const createRealTest = (allQuestions) => {
    const category1Questions = allQuestions.filter((question) => question.category === 0);
    const category2Questions = allQuestions.filter((question) => question.category === 1);
    const category3Questions = allQuestions.filter((question) => question.category === 2);

    const shuffledCat1 = shuffleQuestions([...category1Questions]);
    const shuffledCat2 = shuffleQuestions([...category2Questions]);
    const shuffledCat3 = shuffleQuestions([...category3Questions]);

    const selectedCat1 = shuffledCat1.slice(0, 16);
    const selectedCat2 = shuffledCat2.slice(0, 7);
    const selectedCat3 = shuffledCat3.slice(0, 7);

    const combinedQuestions = [...selectedCat1, ...selectedCat2, ...selectedCat3];

    return shuffleEverything(combinedQuestions);
}

export const getFinalQuestions = ({ questions, selectedCategory, selectedSubCategory, shuffle, isRealTest }) => {
    let finalQuestions = [...questions];

    if (isRealTest) {
        finalQuestions = createRealTest(finalQuestions);
    } else {
        if (selectedCategory !== '') {
            finalQuestions = finalQuestions.filter((question) => question.category === selectedCategory)
        }

        if (selectedSubCategory !== '') {
            finalQuestions = finalQuestions.filter((question) => question.subCategory === selectedSubCategory);
        }

        if (shuffle) {
            finalQuestions = shuffleEverything(finalQuestions);
        }
    }

    finalQuestions = finalQuestions.map((question, index) => ({
        ...question,
        questionIndex: index + 1,
    }));

    return finalQuestions;
}
