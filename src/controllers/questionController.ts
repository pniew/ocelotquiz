import express from 'express';
import Question from 'models/Question';
import Answer from 'models/Answer';
import settingsCache from 'common/settingsCache';
// TODO: perhaps fix or move parseInts

export default {
    index: async (req: express.Request, res: express.Response) => {
        const questions = await Question.getAll();
        const answers = await Answer.getByQuestionIdArray(questions.map(question => question.id));
        const data = questions.map(question => {
            return {
                id: question.id,
                text: question.text,
                answers: answers.filter(answer => answer.question === question.id)
            };
        });
        res.render('question/index', { title: 'Pytania', data });
    },
};
