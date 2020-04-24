import express from 'express';
import { saveSession, shuffleArray, toMSQLDate, getDistinctArray } from 'common/utils';
import { OceSession } from 'models/OceSession';
import ExamModel, { Exam } from 'models/ExamModel';
import QuestionModel, { Question } from 'models/QuestionModel';
import AnswerModel, { Answer } from 'models/AnswerModel';
import ExamProgressModel from 'models/ExamProgressModel';
import ExamTokenModel, { ExamToken } from 'models/ExamTokenModel';
import UserModel from 'src/models/UserModel';

interface QuestionAnswer {
    id: number;
    text?: string;
    answers: SimpleAnswer[];
}

interface SimpleAnswer {
    id: number;
    text?: string;
    correct?: number;
}

export default {
    solve: async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        const session = req.session as OceSession;
        const reqExamToken = req.params.token;

        const [examToken, examProgress] = await Promise.all([
            ExamTokenModel.getByToken(reqExamToken),
            ExamProgressModel.getByTokenForUser(reqExamToken, session.userId)
        ]);

        if (!examToken) {
            return next();
        } else if (!examProgress?.completed && examToken.validDuration && (examToken.created.getTime() + examToken.validDuration) < new Date().getTime()) {
            return next();
        }

        return res.render('quiz/solveExamOnePage', { title: 'Exam', hideHeader: true });
    },
    getExamData: async (req: express.Request, res: express.Response) => {
        const session = req.session as OceSession;
        const userId = session.userId;
        const reqExamToken = req.params.token;

        const [examToken, examProgress, user] = await Promise.all([
            ExamTokenModel.getByToken(reqExamToken),
            ExamProgressModel.getByTokenForUser(reqExamToken, userId),
            UserModel.getById(userId)
        ]);

        if (!examToken) {
            return res.json({ result: 'no ok' });
        }

        const exam = await ExamModel.getById(examToken.exam);
        const questions = await QuestionModel.getByIdArray(JSON.parse(exam?.questionIdsArray || '[]'));
        const answers = await AnswerModel.getByQuestionIdArray(questions.map(a => a.id));

        let examSelectedAnswersData = session.selectedAnswersList || []; // JSON.parse(examProgress?.selectedAnswersData || '[]');
        const progressData: QuestionAnswer[] = JSON.parse(examProgress?.questionsData || '[]');

        if (progressData.length === 0) {
            session.selectedAnswersList = [];
            examSelectedAnswersData = [];
            await saveSession(req);
        }

        if (examProgress?.completed) {
            examSelectedAnswersData = JSON.parse(examProgress?.selectedAnswersData || '[]');
        }

        const examProgressData = progressData.length === 0 ? await shuffleAndSaveExam(exam, userId, examToken, questions, answers) : progressData;

        const questionsAnswersList = examProgressData.map(q => {
            q.text = questions.find(x => x.id === q.id)?.text;
            q.answers.forEach(a => {
                a.text = answers.find(x => x.id === a.id)?.text;
            });
            return q;
        });
        const points = examProgress?.completed ? await countExamScores(questions, answers, JSON.parse(examProgress?.selectedAnswersData || '[]')) : 0;

        res.json({
            questionsAnswersList,
            correctAnswers: examProgress?.completed ? answers.filter(x => x.correct === 1 as any) : [],
            examName: exam.name,
            selectedAnswersList: examSelectedAnswersData,
            startTime: examProgress?.created || new Date().toISOString(),
            duration: examToken.examDuration,
            completed: examProgress?.completed,
            points,
            percent: (points / questionsAnswersList.length),
            username: user.username
        });
    },
    answerAction: async (req: express.Request, res: express.Response) => {
        const session = req.session as OceSession;

        session.selectedAnswersList = req.body.answers;

        await saveSession(req);
        res.json({ result: 'ok' });
    },
    submitAnswersAction: async (req: express.Request, res: express.Response) => {
        const session = req.session as OceSession;
        const userId = session.userId;
        const selectedAnswerIds = getDistinctArray(req.body.answers.filter(x => x));
        const reqExamToken = req.params.token;

        const examProgress = await ExamProgressModel.getByTokenForUser(reqExamToken, userId);

        if (!examProgress) {
            return res.json({ result: 'no ok' });
        } else if (examProgress.completed) {
            return res.json({ result: 'no ok, already done' });
        }

        const completed = new Date();

        await ExamProgressModel.editById(examProgress.id, { selectedAnswersData: JSON.stringify(selectedAnswerIds), completed: toMSQLDate(completed) });
        const questions = await QuestionModel.getByIdArray(JSON.parse(examProgress?.questionsData || '[]').map(q => q.id));
        const answers = await AnswerModel.getByQuestionIdArray(questions.map(a => a.id));

        const score = await countExamScores(questions, answers, selectedAnswerIds);

        res.json({ result: 'ok', score, perc: score / questions.length });
    }
};

export const shuffleAndSaveExam = async (exam: Exam, forUserId: number, withToken: ExamToken, questions: Question[], answers: Answer[]) => {
    const examQuestionsData = questions.map(q => {
        const answerItems = answers.filter(a => a.question === q.id).map(a => {
            return {
                id: a.id
            };
        });
        shuffleArray(answerItems);
        return {
            id: q.id,
            answers: answerItems
        };
    });

    shuffleArray(examQuestionsData);
    const len = examQuestionsData.length;
    const qAmt = withToken.examQuestions;
    examQuestionsData.splice(0, len - qAmt);

    console.log('Generating new exam for user.');
    shuffleArray(examQuestionsData);

    await ExamProgressModel.insert({
        exam: exam.id,
        questionsData: JSON.stringify(examQuestionsData),
        token: withToken.token,
        user: forUserId,
        selectedAnswersData: '[]'
    });

    return examQuestionsData as QuestionAnswer[];
};

export const countExamScores = async (questions: Question[], answers: Answer[], selectedAnswerIds: number[]) => {
    let score = 0;
    questions.forEach(q => {
        const ans = answers.filter(a => a.question === q.id);
        const selected = selectedAnswerIds.filter(s => ans.findIndex(a => a.id === s) !== -1);
        const corrects = ans.filter(a => a.correct as unknown as number === 1);
        if (selected.length === corrects.length) {
            let allCorrect = true;
            corrects.forEach(c => {
                if (!selected.includes(c.id)) {
                    allCorrect = false;
                }
            });
            score += allCorrect ? 1 : 0;
        }
    });
    return score;
};
