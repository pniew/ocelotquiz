import express from 'express';
import xlsx from 'xlsx';
import QuestionModel from 'models/QuestionModel';
import AnswerModel, { Answer } from 'models/AnswerModel';
import CategoryModel, { ExtendedCategory } from 'models/CategoryModel';
import UserModel from 'models/UserModel';
import settingsCache from 'common/settingsCache';
import { SettingEnum } from 'src/common/constants';
import fileUpload from 'express-fileupload';
import { saveSession, getDistinctArray } from 'common/utils';
import { OceSession } from 'models/OceSession';
import categoriesController from './categoriesController';

export default {
    index: async (req: express.Request, res: express.Response) => {
        const session = req.session as OceSession;
        const userId = session.userId;
        const isAdmin = session.isAdmin;
        const questions = isAdmin ? await QuestionModel.getAll() : await QuestionModel.getByUser(userId);
        if ((questions && questions.length === 0) || !questions) {
            return res.render('question/index', { title: 'Brak pytań', isAdmin });
        }
        const answers = await AnswerModel.getByQuestionIdArray(questions.map(question => question.id));
        const categories = await CategoryModel.getByIdArray(getDistinctArray(questions.map(questions => questions.category)));
        const users = await UserModel.getByIdArray(getDistinctArray(questions.map(questions => questions.user)));

        const data = questions.map(question => {
            const status = question.status === 'private' ? 'btn-secondary fa-circle' : question.status === 'pending' ? 'btn-warning fa-circle' : 'btn-success fa-check-circle';
            const statusDescription = question.status === 'private' ? 'Pytanie prywatne' : question.status === 'pending' ? 'Oczekuje na akceptacje' : 'Pytanie publiczne';
            const isPublic = question.status === 'public';

            return {
                id: question.id,
                user: question.user,
                text: question.text,
                status,
                isPublic,
                statusDescription,
                creator: users.find(c => question.user === c.id),
                category: categories.filter(category => category.id === question.category)[0],
                answers: answers.filter(answer => answer.question === question.id)
            };
        });
        res.render('question/index', { title: 'Pytania', data, isAdmin });
    },

    pending: async (req: express.Request, res: express.Response) => {
        const session = req.session as OceSession;
        const question = await QuestionModel.getById(parseInt(req.params.id));
        if (question.user !== session.userId && !session.isAdmin) {
            return res.status(404).send();
        }
        let status = 'pending';
        if (session.isAdmin) {
            status = 'public';
        }
        await QuestionModel.editById(parseInt(req.params.id), { status });
        await saveSession(req);
        res.redirect(`/question/${question.id}`);
    },

    revoke: async (req: express.Request, res: express.Response) => {
        const session = req.session as OceSession;
        const question = await QuestionModel.getById(parseInt(req.params.id));
        if (question.user !== session.userId && !session.isAdmin) {
            return res.status(404).send();
        }
        await QuestionModel.editById(parseInt(req.params.id), { status: 'private' });
        await saveSession(req);
        res.redirect(`/question/${question.id}`);
    },

    pendingIndex: async (req: express.Request, res: express.Response) => {
        const questions = await QuestionModel.getByStatus('pending');
        if ((questions && questions.length === 0) || !questions) {
            return res.render('question/pending', { title: 'Oczekujące pytania' });
        }
        const answers = await AnswerModel.getByQuestionIdArray(questions.map(question => question.id));
        const categories = await CategoryModel.getByIdArray([...new Set(questions.map(questions => questions.category))]);
        const users = await UserModel.getByIdArray([...new Set(questions.map(questions => questions.user))]);
        const data = questions.map(question => {
            return {
                id: question.id,
                user: question.user,
                text: question.text,
                creator: users.find(c => question.user === c.id),
                category: categories.filter(category => category.id === question.category)[0],
                answers: answers.filter(answer => answer.question === question.id)
            };
        });
        res.render('question/pending', { title: 'Oczekujące pytania', data });
    },

    pendingAction: async (req: express.Request, res: express.Response) => {
        const questionId = parseInt(req.params.id);
        if (req.body.action === 'accept') {
            await QuestionModel.editById(questionId, { status: 'public' });
        } else if (req.body.action === 'deny') {
            await QuestionModel.editById(questionId, { status: 'private' });
        } else {
            return res.status(500).send(); // no co ty robisz?
        }
        await saveSession(req);
        res.redirect('/questions/admin/pending');
    },

    create: async (req: express.Request, res: express.Response) => {
        const session = req.session as OceSession;
        const categories = (await CategoryModel.getAll()).map((cat) => {
            return { ...cat, name: cat.name.toUpperCase() };
        });

        const allCategories = await CategoryModel.getAllWithPublicQuestions(0);
        const categoriesWithQuestions = await CategoryModel.getAllWithPublicQuestions(1);

        const categoriesTree = allCategories.filter(c => c.parent === null && c.questionCount !== 0).map((topCat: ExtendedCategory) => {
            const categories = categoriesWithQuestions.filter(cat => cat.parent === topCat.id);
            topCat.subcategories = categories;
            delete topCat.parent;
            return topCat;
        });

        const maxQuestionLength = settingsCache.get(SettingEnum.maxQuestionLength);
        const defaultAnswerAmount = settingsCache.get(SettingEnum.defaultAnswerAmount);

        const answers = [];
        for (let i = 0; i < defaultAnswerAmount; i++) {
            answers.push({});
        }

        const questionAdded = session.questionAddedId ? session.questionAddedId : 0;
        delete session.questionAddedId;

        res.render('question/createEdit', {
            title: 'Dodaj pytanie',
            defaultAnswerAmount,
            maxQuestionLength,
            questionAdded,
            categories,
            categoriesTree,
            answers
        });
    },

    upload: async (req: express.Request, res: express.Response) => {
        const allCategories = await CategoryModel.getAllWithPublicQuestions(0);
        const categoriesWithQuestions = await CategoryModel.getAllWithPublicQuestions(1);

        const categoriesTree = allCategories.filter(c => c.parent === null && c.questionCount !== 0).map((topCat: ExtendedCategory) => {
            const categories = categoriesWithQuestions.filter(cat => cat.parent === topCat.id);
            topCat.subcategories = categories;
            delete topCat.parent;
            return topCat;
        });

        res.render('question/upload', { title: 'Dodaj pytanie z pliku .xlsx', categoriesTree });
    },

    canAdd: async (req: express.Request, res: express.Response) => {
        const session = req.session as OceSession;
        const userId = session.userId;
        const timeout = await QuestionModel.getNewerThanForUser(new Date(new Date().getTime() - 30 * 1000), userId);
        if (timeout.length > 0) {
            return res.json({ ready: false });
        } else {
            return res.json({ ready: true });
        }
    },

    edit: async (req: express.Request, res: express.Response) => {
        const session = req.session as OceSession;
        const isAdmin = session.isAdmin;
        const questionId = parseInt(req.params.id);
        const userId = session.userId;

        const question = await QuestionModel.getById(questionId);

        if (!question || (question.user !== userId && !isAdmin)) {
            return res.status(404).send();
        }

        const allCategories = await CategoryModel.getAllWithPublicQuestions(0);
        const categoriesWithQuestions = await CategoryModel.getAllWithPublicQuestions(1);

        const categoriesTree = allCategories.filter(c => c.parent === null).map((topCat: ExtendedCategory) => {
            const categories = categoriesWithQuestions.filter(cat => cat.parent === topCat.id);
            topCat.subcategories = categories;
            delete topCat.parent;
            return topCat;
        });

        const isCategoryPublic = categoriesWithQuestions.findIndex(c => c.id === question.category) === -1;
        const privateCategory = isCategoryPublic ? allCategories.find(c => c.id === question.category) : undefined;

        const answers = await AnswerModel.getByQuestionId(questionId);
        const maxQuestionLength = settingsCache.get(SettingEnum.maxQuestionLength);
        const isPrivate = question.status === 'private';
        const isPublic = question.status === 'public';
        const isPending = question.status === 'pending';
        const isPublicCandidate = answers.filter(a => !!parseInt(a.correct)).length === 1;

        const returnPath = session.redirectTo;
        if (returnPath) {
            delete session.redirectTo;
            await saveSession(req);
        }

        res.render('question/createEdit', {
            title: 'Pytanie',
            question,
            isPrivate,
            isPublic,
            isPending,
            isPublicCandidate,
            privateCategory,
            isAdmin,
            answers,
            maxQuestionLength,
            categoriesTree,
            selected: question.category,
            returnPath
        });
    },

    store: async (req: express.Request, res: express.Response) => {
        const session = req.session as OceSession;
        const userId = session.userId;
        let insertedId: number;

        const categoryName: string = req.body.categoryName;
        const categoryId = parseInt(req.body.category);
        const category = await categoriesController.getOrCreatePrivate({
            id: categoryId,
            name: categoryName,
            description: ''
        });

        if (req.files) {
            try {
                const spreadsheet = req.files.spreadsheet as fileUpload.UploadedFile;

                const xlsxData = xlsx.read(spreadsheet.data, { type: 'buffer' });
                const sheet = xlsxData.Sheets[xlsxData.SheetNames[0]];
                const data = xlsx.utils.sheet_to_json(sheet, { header: 1 }) as [];

                let question: { text?: undefined, answers: [any?] };
                const questions = [];
                for (const row of data) {
                    if (row[0]) {
                        if (question !== undefined) {
                            questions.push(question);
                        }
                        question = { text: row[0], answers: [] };
                    }
                    const answer = { text: row[1], correct: row[2] !== undefined ? '1' : '0' };
                    if (answer.text) {
                        question.answers.push(answer);
                    }
                }
                questions.push(question);

                for (const question of questions) {
                    if (question.text.length > parseInt(settingsCache.get(SettingEnum.maxQuestionLength))) {
                        return res.render('error', { error: { message: 'Co najmniej jedno z pytań jest zbyt długie!' } });
                    }
                    if (question.answers.length !== parseInt(settingsCache.get(SettingEnum.defaultAnswerAmount))) {
                        return res.render('error', { error: { message: 'Co najmniej jedno z pytań posiada nieprawidłową ilość odpowiedzi!' } });
                    }
                    for (const answer of question.answers) {
                        if (answer.text.length > parseInt(settingsCache.get(SettingEnum.maxQuestionLength))) {
                            return res.render('error', { error: { message: 'Co najmniej jedna z odpowiedzi jest zbyt długa!' } });
                        }
                    }
                }

                for (const question of questions) {
                    insertedId = await QuestionModel.insert({ text: question.text, user: userId, category: category.id, status: 'private' });
                    await question.answers.map(async (answer: Answer) => {
                        answer.question = insertedId;
                        return await AnswerModel.insert(answer);
                    });
                }
                await saveSession(req);
                res.redirect('/questions');
            } catch (error) {
                return res.render('error', { error: { message: 'Nieobługiwany format pliku!' } });
            }
        } else {
            const timeout = await QuestionModel.getNewerThanForUser(new Date(new Date().getTime() - 30 * 1000), userId);
            if (timeout.length > 0) {
                return res.render('error', { error: { message: 'Dodajesz pytania zbyt szybko!' } });
            }

            const question = req.body.question;
            question.user = userId;
            question.category = category.id;
            delete question.status;

            insertedId = await QuestionModel.insert(question);
            await req.body.answer.map(async (answer: Answer) => {
                answer.question = insertedId;
                if (!answer.correct) {
                    answer.correct = '0';
                }
                return await AnswerModel.insert(answer);
            });
            req.session.questionAddedId = insertedId;
            await saveSession(req);
            res.redirect('/question/create');
        }
    },

    update: async (req: express.Request, res: express.Response) => {
        const session = req.session as OceSession;
        const questionId = parseInt(req.params.id);
        const userId = session.userId;
        const question = req.body.question;
        const returnPath = req.body.returnTo;

        const categoryName = req.body.categoryName;
        const categoryId = parseInt(req.body.category);
        const category = await categoriesController.getOrCreatePrivate({
            id: categoryId,
            name: categoryName,
            description: ''
        });

        question.category = category.id;
        const oldQuestion = await QuestionModel.getById(questionId);

        if (session.isAdmin) {
            if (question.status === 'pending') {
                question.status = 'public';
            }
        } else {
            if (question.status === 'public') {
                question.status = 'pending';
            } else if (question.status !== 'private' || question.status !== 'pending') {
                question.status = 'private';
            }
            if (oldQuestion.user !== userId) {
                return res.status(404).send();
            }
        }

        const updateQuestion = QuestionModel.editById(questionId, req.body.question);
        const updateAnswers = req.body.answer.map(answer => {
            if (!answer.correct) {
                answer.correct = '0';
            }
            return AnswerModel.editById(answer.id, answer);
        });
        await Promise.all([updateQuestion, updateAnswers]);

        await saveSession(req);
        res.redirect(returnPath || '/questions');
    },

    destroy: async (req: express.Request, res: express.Response) => {
        QuestionModel.deleteById(parseInt(req.params.id));
        await saveSession(req);
        res.redirect('/questions');
    },

    remove: async (req: express.Request, res: express.Response) => {
        const session = req.session as OceSession;
        const userId = session.userId;
        const isUserAdmin = session.isAdmin;
        const questionIds = req.body.questionIds as number[];

        if (questionIds.length > 0) {
            const questions = await QuestionModel.getByIdArray(questionIds);
            const ids = questions.filter(q => isUserAdmin || q.user === userId).map(q => q.id);
            await QuestionModel.deleteByIdArray(ids);
        }

        res.status(200).json({ result: 'ok' });
    }
};
