import express from 'express';
import { OceSession } from 'models/OceSession';
import ExamTokenModel, { ExamToken } from 'models/ExamTokenModel';
import ExamModel from 'models/ExamModel';
import { mathClamp } from 'common/utils';

export default {
    fetchAction: async (req: express.Request, res: express.Response) => {
        const examId = parseInt(req.params.examId);

        const tokens = (await ExamTokenModel.getByExamId(examId)).map(t => {
            const validTo = new Date(t.created.getTime() + t.validDuration);
            return {
                token: t.token,
                examQuestions: t.examQuestions,
                examDuration: t.examDuration / 60000,
                created: t.created,
                validTo: t.validDuration !== 0 ? validTo : 0
            };
        });

        res.json({ tokens });
    },
    generateAction: async (req: express.Request, res: express.Response) => {
        const session = req.session as OceSession;
        const examId = parseInt(req.params.examId);
        const lifetime = parseInt(req.body.token.lifetime) * 60 * 1000;
        const examDuration = parseInt(req.body.token.examDuration) * 60 * 1000;
        const questionsCount = parseInt(req.body.token.questionsAmount);

        const exam = await ExamModel.getById(examId);

        if (!exam) {
            return res.status(400).json({ result: 'no ok' });
        }

        const examQuestionIds = JSON.parse(exam.questionIdsArray || '[]') as number[];

        const tokenString = generateToken(6);

        const token: ExamToken = {
            user: session.userId,
            token: tokenString,
            exam: examId,
            examDuration,
            validDuration: lifetime,
            examQuestions: mathClamp(questionsCount, 1, examQuestionIds.length)
        };

        const createdId = await ExamTokenModel.insert(token);

        res.json({ result: 'ok', createdId });
    },
    removeAction: async (req: express.Request, res: express.Response) => {
        const examId = parseInt(req.params.examId);
        const reqExamToken = req.params.token;

        const token = await ExamTokenModel.getByToken(reqExamToken);
        if (token.exam === examId) {
            await ExamTokenModel.deleteById(token.id);
        }

        res.json({ result: 'ok' });
    }
};

export function generateToken(length: number) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}
