import express from 'express';
import settingsCache from 'common/settingsCache';
import { SettingEnum } from 'src/common/constants';
import { saveSession, shuffleArray } from 'common/utils';
import QuestionModel from 'models/QuestionModel';
import CategoryModel, { ExtendedCategory } from 'models/CategoryModel';
import AnswerModel from 'models/AnswerModel';
import { QuizScore, OceSession } from 'models/OceSession';
import QuizRecordsModel, { QuizRecords } from 'models/QuizRecordsModel';

export default {
    index: async (req: express.Request, res: express.Response) => {
        const isQuick = req.query.quick === 'true';
        const minQuestionCount: number = isQuick ? 1 : settingsCache.getInt(SettingEnum.minQuestionCount);
        const maxQuestionCount: number = isQuick ? 5 : 120;
        const session = req.session as OceSession;
        const currentQuiz = session.quizScore;
        if (currentQuiz && currentQuiz.length > 0) {
            const index = currentQuiz.findIndex(q => !q.selectedAnswerId);
            if (index !== -1) { return res.redirect('/quiz/start'); }
        }

        const allCategories = await CategoryModel.getAllWithPublicQuestions(0);
        const categoriesWithQuestions = await CategoryModel.getAllWithPublicQuestions(1);

        const categoriesTree = allCategories.filter(c => c.parent === null && c.questionCount !== 0).map((topCat: ExtendedCategory) => {
            const categories = categoriesWithQuestions.filter(cat => cat.parent === topCat.id);
            topCat.subcategories = categories;
            delete topCat.parent;
            return topCat;
        });

        const toFewQuestions = session.error?.toFewQuestions;
        delete session.error;

        await saveSession(req);

        res.render('quiz/index', {
            title: 'Quizz',
            categoriesTree,
            minQuestionCount,
            maxQuestionCount,
            toFewQuestions,
            isQuick
        });
    },

    generate: async (req: express.Request, res: express.Response) => {
        const session = req.session as OceSession;
        const categories = Array.isArray(req.body.categories)
            ? req.body.categories.map((x: string) => parseInt(x))
            : [req.body.categories];
        // const minQuestionCount: number = settingsCache.getInt(SettingEnum.minQuestionCount);
        const questionCount = parseInt(req.body.questionCount);// > minQuestionCount ? parseInt(req.body.questionCount) : minQuestionCount;

        const questionIds = (await QuestionModel.getRandomPublic(categories, questionCount))
            .filter((x: any) => x.answerCount === 1);

        console.log('Cat:', categories);
        console.log(questionCount);
        console.log(questionIds.length);
        console.log(questionIds);

        if (questionIds.length < questionCount) {
            session.error = { toFewQuestions: true };
            await saveSession(req);
            return res.redirect('/quiz');
        }

        session.quizScore = questionIds.map(q => {
            return {
                questionId: q.id,
                correctAnswerId: null,
                selectedAnswerId: null
            } as QuizScore;
        });

        await saveSession(req);
        res.redirect('start');
    },

    quiz: async (req: express.Request, res: express.Response) => {
        const session = req.session as OceSession;
        const scores = session.quizScore;
        const maxCountdownTime: number = settingsCache.get(SettingEnum.quizQuestionTime);
        console.log(scores);
        const currentIndex = scores.findIndex(score => !score.selectedAnswerId);

        if (currentIndex >= 0) {
            const currentQuestion = scores[currentIndex];
            const questionId: number = currentQuestion.questionId;
            const points = scores.filter(s => {
                return parseInt(s.correctAnswerId as any) === parseInt(s.selectedAnswerId as any);
            }).length;
            const progress = { max: scores.length, current: currentIndex + 1, points };

            const question = await QuestionModel.getById(questionId);
            const answers = await AnswerModel.getByQuestionId(questionId);
            shuffleArray(answers);

            if (!currentQuestion.started) {
                currentQuestion.started = (new Date()).getTime();
            }

            const now = new Date().getTime();
            const countdown = Math.round(maxCountdownTime - (now - currentQuestion.started) / 1000);
            if (!countdown || countdown < 0) {
                const correctAnswer = answers.find(a => !!parseInt(a.correct as any));
                currentQuestion.selectedAnswerId = -1;
                currentQuestion.correctAnswerId = correctAnswer.id;
                await saveSession(req);
                return res.redirect('/quiz/start');
            }

            await saveSession(req);
            res.render('quiz/showQuestion', {
                title: 'Quizz',
                question,
                answers,
                progress,
                questionIndex: currentIndex,
                countdown,
                maxCountdownTime
            });
        } else {
            let points = 0;
            const endScores = scores.map(score => {
                if (score.correctAnswerId === score.selectedAnswerId) {
                    points++;
                }
                return {
                    ...score,
                    isCorrect: score.correctAnswerId === score.selectedAnswerId
                };
            });
            const congrats = points / scores.length >= 0.75;
            const record: QuizRecords = {
                user: session.userId,
                points,
                length: scores.length,
                data: JSON.stringify(scores)
            };
            await QuizRecordsModel.insert(record);
            await saveSession(req);
            res.render('quiz/endQuiz', { title: 'Quizz', scores: endScores, points, congrats });
        }
    },

    answerAction: async (req: express.Request, res: express.Response) => {
        const session = req.session as OceSession;
        const scores = session.quizScore;
        const answerForQuestionIndex = parseInt(req.body.questionIndex);
        const selectedId = parseInt(req.body.selectedAnswer);
        const maxCountdownTime: number = settingsCache.get(SettingEnum.quizQuestionTime);

        if (answerForQuestionIndex >= 0 && answerForQuestionIndex < scores.length) {
            const currentQuestion = scores[answerForQuestionIndex];
            if (!(currentQuestion.selectedAnswerId > 0)) {
                const countdown = Math.round(maxCountdownTime - (new Date().getTime() - currentQuestion.started) / 1000);
                const answers = await AnswerModel.getByQuestionId(currentQuestion.questionId);
                const correctAnswer = answers.find(a => !!parseInt(a.correct as any));
                if (countdown >= 0) {
                    currentQuestion.selectedAnswerId = selectedId;
                } else {
                    currentQuestion.selectedAnswerId = -1;
                }
                currentQuestion.correctAnswerId = correctAnswer.id;
                await saveSession(req);
                return res.json({ correctId: correctAnswer.id, selectedId: selectedId });
            }
            return res.json({ correctId: currentQuestion.correctAnswerId, selectedId: currentQuestion.selectedAnswerId });
        }
        return res.json({ reload: true });
    }
};
