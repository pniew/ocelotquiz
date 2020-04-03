import express from 'express';
import xlsx from 'xlsx';
import QuestionModel from 'models/QuestionModel';
import AnswerModel from 'models/AnswerModel';
import CategoryModel from 'models/CategoryModel';
import settingsCache from 'common/settingsCache';
import fileUpload from 'express-fileupload';
// TODO: perhaps fix or move parseInts

export default {
    index: async (req: express.Request, res: express.Response) => {
        if (req.session.userid === 7) {
            res.redirect('/questions/admin/pending');
            return;
        }
        const userid = req.session.userid;
        const questions = await QuestionModel.getByUser(userid);
        const answers = await AnswerModel.getByQuestionIdArray(questions.map(question => question.id));
        const categories = await CategoryModel.getByIdArray([...new Set(questions.map(questions => questions.category))]);

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
                category: categories.filter(category => category.id === question.category)[0],
                answers: answers.filter(answer => answer.question === question.id)
            };
        });
        res.render('question/index', { title: 'Pytania', data });
    },

    pending: async (req: express.Request, res: express.Response) => {
        const question = await QuestionModel.getById(parseInt(req.params.id));
        if (question.user !== req.session.userid) {
            return res.status(404).send();
        }
        await QuestionModel.editById(parseInt(req.params.id), { status: 'pending' });
        res.redirect(`/question/${question.id}`);
    },

    revoke: async (req: express.Request, res: express.Response) => {
        const question = await QuestionModel.getById(parseInt(req.params.id));
        if (question.user !== req.session.userid) {
            return res.status(404).send();
        }
        await QuestionModel.editById(parseInt(req.params.id), { status: 'private' });
        res.redirect(`/question/${question.id}`);
    },

    pendingIndex: async (req: express.Request, res: express.Response) => {
        if (req.session.userid !== 7) {
            res.redirect('/');
            return;
        }
        const questions = await QuestionModel.getByStatus('pending');
        const answers = await AnswerModel.getByQuestionIdArray(questions.map(question => question.id));
        const categories = await CategoryModel.getByIdArray([...new Set(questions.map(questions => questions.category))]);
        const data = questions.map(question => {
            return {
                id: question.id,
                user: question.user,
                text: question.text,
                category: categories.filter(category => category.id === question.category)[0],
                answers: answers.filter(answer => answer.question === question.id)
            };
        });
        res.render('question/pending', { title: 'Oczekujące pytania', data });
    },

    pendingAction: async (req: express.Request, res: express.Response) => {
        if (req.body.action === 'accept') {
            await QuestionModel.editById(parseInt(req.params.id), { status: 'public' });
        } else if (req.body.action === 'deny') {
            await QuestionModel.editById(parseInt(req.params.id), { status: 'private' });
        } else {
            return res.status(500).send(); // no co ty robisz?
        }
        res.redirect('/questions/admin/pending');
    },

    create: async (req: express.Request, res: express.Response) => {
        const categories = (await CategoryModel.getAll()).map((cat) => {
            return { ...cat, name: cat.name.toUpperCase() };
        });
        const maxQuestionLength = settingsCache.get('max-question-length');
        const defaultAnswerAmount = settingsCache.get('default-answer-amount');

        const answers = [];
        for (let i = 0; i < defaultAnswerAmount; i++) {
            answers.push({});
        }

        const questionAdded = req.session.questionAddedId ? req.session.questionAddedId : 0;
        delete req.session.questionAddedId;

        res.render('question/createEdit', {
            title: 'Dodaj pytanie',
            defaultAnswerAmount,
            maxQuestionLength,
            questionAdded,
            categories,
            answers
        });
    },

    upload: async (req: express.Request, res: express.Response) => {
        const categories = await CategoryModel.getAll();
        res.render('question/upload', { title: 'Dodaj pytanie z pliku .xlsx', categories });
    },

    edit: async (req: express.Request, res: express.Response) => {
        const question = await QuestionModel.getById(parseInt(req.params.id));
        const userid = req.session.userid;

        if (!question || question.user !== userid) {
            return res.status(404).send();
        }

        const categories = (await CategoryModel.getAll()).map((cat) => {
            return { ...cat, name: cat.name.toUpperCase() };
        });

        const answers = await AnswerModel.getByQuestionId(parseInt(req.params.id));
        const maxQuestionLength = settingsCache.get('max-question-length');
        const isPrivate = question.status === 'private';
        const isPublic = question.status === 'public';
        res.render('question/createEdit', {
            title: 'Pytanie',
            question,
            isPrivate,
            isPublic,
            answers,
            maxQuestionLength,
            categories,
            selected: question.category
        });
    },

    store: async (req: express.Request, res: express.Response) => {
        const user: number = req.session.userid;
        let insertedId: number;

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
                    if (question.text.length > parseInt(settingsCache.get('max-question-length'))) {
                        return res.render('error', { error: { message: 'Co najmniej jedno z pytań jest zbyt długie!' } });
                    }
                    if (question.answers.length !== parseInt(settingsCache.get('default-answer-amount'))) {
                        return res.render('error', { error: { message: 'Co najmniej jedno z pytań posiada nieprawidłową ilość odpowiedzi!' } });
                    }
                    for (const answer of question.answers) {
                        if (answer.text.length > parseInt(settingsCache.get('max-question-length'))) {
                            return res.render('error', { error: { message: 'Co najmniej jedna z odpowiedzi jest zbyt długa!' } });
                        }
                    }
                }

                for (const question of questions) {
                    insertedId = await QuestionModel.insert({ text: question.text, user, category: req.body.category, status: 'private' });
                    await question.answers.map(async answer => {
                        answer.question = insertedId;
                        return await AnswerModel.insert(answer);
                    });
                }
                res.redirect('/questions');
            } catch (error) {
                return res.render('error', { error: { message: 'Nieobługiwany format pliku!' } });
            }
        } else {
            const timeout = await QuestionModel.getNewerThan(new Date(new Date().getTime() - 30 * 1000));
            if (timeout.length > 0) {
                return res.render('error', { error: { message: 'Dodajesz pytania zbyt szybko!' } });
            }

            const question = req.body.question;
            question.user = user;
            question.category = req.body.category;
            delete question.status;

            insertedId = await QuestionModel.insert(question);
            await req.body.answer.map(async answer => {
                answer.question = insertedId;
                if (!answer.correct) {
                    answer.correct = '0';
                }
                return await AnswerModel.insert(answer);
            });
            req.session.questionAddedId = insertedId;
            res.redirect('/question/create');
        }
    },

    update: async (req: express.Request, res: express.Response) => {
        const id = parseInt(req.params.id);
        const question = req.body.question;
        question.category = req.body.category;

        if (question.status === 'public') {
            question.status = 'pending';
        } else if (question.status !== 'private' || question.status !== 'pending') {
            question.status = 'private';
        }

        const updateQuestion = QuestionModel.editById(id, req.body.question);
        const updateAnswers = req.body.answer.map(answer => {
            if (!answer.correct) {
                answer.correct = '0';
            }
            return AnswerModel.editById(answer.id, answer);
        });
        await Promise.all([updateQuestion, updateAnswers]);
        res.redirect('/questions');
    },

    destroy: async (req: express.Request, res: express.Response) => {
        QuestionModel.deleteById(parseInt(req.params.id));
        res.redirect('/questions');
    }
};
