import express from 'express';
import QuestionModel from 'models/QuestionModel';
import { saveSession, getDistinctArray } from 'src/common/utils';
import { OceSession } from 'src/models/OceSession';
import ExamModel, { Exam } from 'src/models/ExamModel';

export default {
    index: async (req: express.Request, res: express.Response) => {
        const session = req.session as OceSession;
        const userId = session.userId;
        const quizList = await ExamModel.getByUserId(userId);

        if (req.headers['x-async-action'] === 'async') {
            return res.json(quizList);
        }

        res.render('quiz/quizList', { title: 'Lista Twoich Quizów', quizList });
    },
    viewExam: async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        const session = req.session as OceSession;
        const isUserAdmin = session.isAdmin;
        const userId = session.userId;
        const quizId = parseInt(req.params.quizId);
        const quiz = await ExamModel.getById(quizId);

        if (!isUserAdmin && quiz.user !== userId) {
            return next();
        }

        if (req.headers['x-async-action'] === 'async') {
            const examQuestionIds = JSON.parse(quiz?.questionIdsArray || '[]') as number[];
            if (examQuestionIds.length > 0) {
                const questionFromDb = await QuestionModel.getByIdArray(examQuestionIds);
                const reorderedQuestions = examQuestionIds.map((id: number) => questionFromDb.find(q => q.id === id));
                return res.json(reorderedQuestions);
            } else {
                return res.json([]);
            }
        }

        res.render('quiz/showExam', { title: 'Quiz', quiz });
    },
    questionActions: async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        const session = req.session as OceSession;
        const isUserAdmin = session.isAdmin;
        const userId = session.userId;
        const action = req.params.action;
        const quizId = parseInt(req.params.quizId);
        const questionIds = req.body.questionIds as number[];

        const quiz = await ExamModel.getById(quizId);

        if (!quiz || (!isUserAdmin && quiz.user !== userId)) {
            return next();
        }

        if (action === 'addIds') {
            addQuestionsToExam(quiz, questionIds);
        } else if (action === 'removeIds') {
            removeQuestionsFromExam(quiz, questionIds);
        } else if (action === 'clear') {
            await ExamModel.editById(quiz.id, { questionIdsArray: '[]' });
        } else {
            return res.status(400).json({ result: 'no ok', action });
        }

        return res.status(200).json({ result: 'ok', action });
    },
    createAction: async (req: express.Request, res: express.Response) => {
        const session = req.session as OceSession;
        const userId = session.userId;
        const name = req.body.quizName;

        if (!name) {
            return res.status(400).json({ result: 'no ok' });
        }

        const exam: Exam = {
            user: userId,
            name: name,
            questionIdsArray: '[]'
        };
        const examId = await ExamModel.insert(exam);

        return res.json({ result: 'ok', createdId: examId });
    },
    remove: async (req: express.Request, res: express.Response) => {
        ExamModel.deleteById(parseInt(req.params.quizId));
        await saveSession(req);
        res.json({ result: 'ok' });
    }
};

export const addQuestionsToExam = async (exam: Exam, questionIds: number[]) => {
    const examQuestionIds = JSON.parse(exam?.questionIdsArray || '[]') as number[];
    const questions = await QuestionModel.getByIdArray(questionIds);
    const questionsIds = questions.filter(q => q.user === exam.user).map(q => q.id);
    examQuestionIds.push(...questionsIds);
    await ExamModel.editById(exam.id, {
        questionIdsArray: JSON.stringify(getDistinctArray(examQuestionIds))
    });
};

export const removeQuestionsFromExam = async (exam: Exam, questionIds: number[]) => {
    const examQuestionIds = JSON.parse(exam?.questionIdsArray || '[]') as number[];
    if (examQuestionIds.length > 0) {
        const newExamQuestionIds = examQuestionIds.filter(id => !questionIds.includes(id));
        await ExamModel.editById(exam.id, {
            questionIdsArray: JSON.stringify(getDistinctArray(newExamQuestionIds))
        });
    }
};
