import express from 'express';
import { shuffleArray, toMSQLDate, getDistinctArray } from 'common/utils';
import { OceSession } from 'models/OceSession';
import ExamModel, { Exam } from 'models/ExamModel';
import QuestionModel, { Question } from 'models/QuestionModel';
import AnswerModel, { Answer } from 'models/AnswerModel';
import ExamProgressModel, { ExamProgress } from 'models/ExamProgressModel';
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
            await markExamProgressIfCompleted(examProgress);
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

        if (!examToken && !examProgress) {
            return res.json({ result: 'no ok' });
        }

        const exam = await ExamModel.getById(examToken?.exam || examProgress.exam);
        const questions = await QuestionModel.getByIdArray(JSON.parse(exam?.questionIdsArray || '[]'));
        const answers = await AnswerModel.getByQuestionIdArray(questions.map(a => a.id));

        const examSelectedAnswers: number[] = JSON.parse(examProgress?.selectedAnswersData || '[]');
        const examPreparedQuestions: QuestionAnswer[] = JSON.parse(examProgress?.questionsData || '[]');

        if (examPreparedQuestions.length === 0) {
            const shuffledQuestions = await shuffleAndSaveExam(exam, userId, examToken, questions, answers);
            examPreparedQuestions.push(...shuffledQuestions);
        } else {
            await markExamProgressIfCompleted(examProgress);
        }

        examPreparedQuestions.forEach(q => {
            q.text = questions.find(x => x.id === q.id)?.text;
            q.answers.forEach(a => {
                a.text = answers.find(x => x.id === a.id)?.text;
            });
            return q;
        });

        const correctQuestionIds = examProgress?.completed ? await getCorrectQuestions(questions, answers, examSelectedAnswers) : [];

        res.json({
            questionsAnswersList: examPreparedQuestions,
            selectedAnswersList: examSelectedAnswers,
            correctAnswers: examProgress?.completed ? answers.filter(x => x.correct === 1 as any).map(x => x.id) : [],
            correctQuestions: correctQuestionIds,
            examName: exam.name,
            username: user.username,
            points: correctQuestionIds.length,
            percent: (correctQuestionIds.length / examPreparedQuestions.length),
            startTime: examProgress?.created || new Date().toISOString(),
            completed: examProgress?.completed,
            examTimeLimit: examProgress?.timeLimit || examToken.examDuration,
            finishedTime: examProgress?.completed
        });
    },
    saveAnswersAction: async (req: express.Request, res: express.Response) => {
        const session = req.session as OceSession;
        const userId = session.userId;
        const selectedAnswerIds = getDistinctArray<number>(req.body.answers.filter((x: number) => x));
        const reqExamToken = req.params.token;
        const isCompleted = !!req.body.isCompleted;

        const examProgress = await ExamProgressModel.getByTokenForUser(reqExamToken, userId);

        if (!examProgress) {
            return res.json({ result: 'no ok' });
        } else if (examProgress.completed) {
            return res.json({ result: 'no ok, already done' });
        }

        examProgress.selectedAnswersData = JSON.stringify(selectedAnswerIds);
        if (isCompleted) {
            examProgress.completed = toMSQLDate(new Date());
        }

        await ExamProgressModel.editById(examProgress.id, examProgress);

        res.json({ result: 'ok' });
    }
};

export const shuffleAndSaveExam = async (exam: Exam, forUserId: number, token: ExamToken, questions: Question[], answers: Answer[]) => {
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
    const qAmt = token.examQuestions;
    examQuestionsData.splice(0, len - qAmt);

    console.log('Generating new exam for user.');
    shuffleArray(examQuestionsData);

    const examProgress: ExamProgress = {
        exam: exam.id,
        questionsData: JSON.stringify(examQuestionsData),
        token: token.token,
        timeLimit: token.examDuration,
        user: forUserId,
        selectedAnswersData: '[]'
    };

    const examId = await ExamProgressModel.insert(examProgress);
    examProgress.id = examId;

    return examQuestionsData as QuestionAnswer[];
};

export const markExamProgressIfCompleted = async (examProgress: ExamProgress) => {
    if (examProgress && (examProgress.created.getTime() + examProgress.timeLimit) < new Date().getTime()) {
        console.log('Marking exam as complete because of timelimit.');
        const completed = new Date(examProgress.created.getTime() + examProgress.timeLimit);
        await ExamProgressModel.editById(examProgress.id, { completed: toMSQLDate(completed) });
    }
};

export const getCorrectQuestions = async (questions: Question[], answers: Answer[], selectedAnswerIds: number[]) => {
    const correctQuestionIds: number[] = [];
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
            if (allCorrect) {
                correctQuestionIds.push(q.id);
            }
        }
    });
    return correctQuestionIds;
};
