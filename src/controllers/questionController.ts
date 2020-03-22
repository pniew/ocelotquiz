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

    create: async (req: express.Request, res: express.Response) => {
        const maxQuestionLength = settingsCache.get('max-question-length');
        const defaultAnswerAmount = settingsCache.get('default-answer-amount');
        res.render('question/create', { title: 'Dodaj pytanie', defaultAnswerAmount, maxQuestionLength });
    },

    edit: async (req: express.Request, res: express.Response) => {
        const question = await Question.getById(parseInt(req.params.id));
        if (!question) {
            return res.status(404).send();
        }

        const answers = await Answer.getByQuestionId(parseInt(req.params.id));
        const maxQuestionLength = settingsCache.get('max-question-length');
        res.render('question/edit', { title: 'Pytanie', question, answers, maxQuestionLength });
    },

    store: async (req: express.Request, res: express.Response) => {
        const user: number = req.session.userid;
        const question = req.body.question;
        question.user = user;
        const insertedId = await Question.insert(question);
        await req.body.answer.map(answer => {
            answer.question = insertedId;
            if (!answer.correct) {
                answer.correct = '0';
            }
            return Answer.insert(answer);
        });
        res.redirect(`/question/${insertedId}`);
    },

    update: async (req: express.Request, res: express.Response) => {
        const id = parseInt(req.params.id);
        const updateQuestion = Question.editById(id, req.body.question);
        const updateAnswers = req.body.answer.map(answer => {
            if (!answer.correct) {
                answer.correct = '0';
            }
            return Answer.editById(answer.id, answer);
        });
        await Promise.all([updateQuestion, updateAnswers]);
        res.redirect('/questions');
    },

    destroy: async (req: express.Request, res: express.Response) => {
        Question.deleteById(parseInt(req.params.id));
        res.redirect('/questions');
    }
};
