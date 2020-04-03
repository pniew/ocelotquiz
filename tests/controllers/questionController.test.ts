import sinon, { assert, match } from 'sinon';
import AnswerModel from 'models/AnswerModel';
import QuestionModel from 'models/QuestionModel';
import CategoryModel from 'models/CategoryModel';
import questionController from 'controllers/questionController';
import * as mock from './questions.mock';
import * as categoriesMock from './categories.mock';
import settingsCache from 'src/common/settingsCache';
import * as settingsMock from 'settings.mock';
import path from 'path';
import fs from 'fs';

describe('Question Controller', () => {
    afterEach(() => {
        // Restore the default sandbox here
        sinon.restore();
    });

    beforeEach(() => {
        sinon.stub(settingsCache, 'cacheData' as any).value(settingsMock.settingsCache);
    });

    it('index: should get a list of questions for user id 1', async () => {
        const req = { session: { userid: 1 } };
        const res = { render: sinon.spy() };

        const questionStub = sinon.stub(QuestionModel, 'getByUser').resolves(mock.questions.filter(question => question.user === req.session.userid));
        const answerStub = sinon.stub(AnswerModel, 'getByQuestionIdArray').resolves(mock.answers as any); // TODO: Fix any type (Answer)
        const categoriesStub = sinon.stub(CategoryModel, 'getByIdArray').resolves(categoriesMock.categories as any); // TODO: Fix any type (Answer)

        await questionController.index(req as any, res as any);

        const expectedResult = { title: 'Pytania', data: mock.questionsAnswers };

        assert.calledOnceWithExactly(res.render, 'question/index', expectedResult);
        assert.calledOnce(questionStub);
        assert.calledOnce(answerStub);
        assert.calledOnce(categoriesStub);
    });

    it('edit: should show question with id', async () => {
        const req = { params: { id: 1 }, session: { userid: 1 } };
        const res = { render: sinon.spy() };

        const questionStub = sinon.stub(QuestionModel, 'getById').resolves(mock.questions[0]);
        const answerStub = sinon.stub(AnswerModel, 'getByQuestionId').resolves(mock.answers.slice(0, 4) as any); // TODO: Fix any type (Answer)
        const categoriesStub = sinon.stub(CategoryModel, 'getAll').resolves(categoriesMock.categories as any); // TODO: Fix any type (Answer)

        await questionController.edit(req as any, res as any);

        const expectedResult = {
            title: 'Pytanie',
            maxQuestionLength: 300,
            question: mock.questions[0],
            answers: mock.answers.slice(0, 4),
            categories: categoriesMock.categories,
            selected: 1,
            isPrivate: true,
            isPublic: false
        };

        assert.calledOnceWithExactly(res.render, 'question/createEdit', expectedResult);
        assert.calledOnceWithExactly(questionStub, req.params.id);
        assert.calledOnceWithExactly(answerStub, req.params.id);
        assert.calledOnce(categoriesStub);
    });

    it('edit: should get 404 for question with non-existing id', async () => {
        const req = { params: { id: 1 }, session: { userid: 1 } };
        const res = {
            render: sinon.stub(),
            status: sinon.stub().returnsThis(),
            send: sinon.spy()
        };

        const questionStub = sinon.stub(QuestionModel, 'getById').resolves(undefined);
        const answerStub = sinon.stub(AnswerModel, 'getByQuestionId').resolves(undefined);

        await questionController.edit(req as any, res as any);

        assert.calledOnceWithExactly(questionStub, req.params.id);
        assert.neverCalledWith(answerStub, req.params.id);
        assert.calledOnceWithExactly(res.status, 404);
        assert.calledOnce(res.send);
    });

    it('edit: should get 404 for question not created by logged user', async () => {
        const req = { params: { id: 1 }, session: { userid: 2 } };
        const res = {
            render: sinon.stub(),
            status: sinon.stub().returnsThis(),
            send: sinon.spy()
        };

        const questionStub = sinon.stub(QuestionModel, 'getById').resolves(mock.questions[0]);
        const answerStub = sinon.stub(AnswerModel, 'getByQuestionId').resolves(undefined);
        const categoriesStub = sinon.stub(CategoryModel, 'getAll').resolves(undefined);

        await questionController.edit(req as any, res as any);

        assert.calledOnceWithExactly(questionStub, req.params.id);
        assert.neverCalledWith(answerStub, req.params.id);
        assert.notCalled(categoriesStub);
        assert.calledOnceWithExactly(res.status, 404);
        assert.calledOnce(res.send);
    });

    it('store: should store parsed .csv file with questions and answers within database', async () => {
        const req = {
            body: {
                category: '1'
            },
            files: {
                spreadsheet: {
                    data: fs.readFileSync(path.join(__dirname, '../example.csv'), { encoding: 'utf8' })
                }
            },
            session: { userid: 1 }
        };
        const res = {
            redirect: sinon.stub()
        };

        const questionsCallCount = mock.questionsParseData.length;
        const answersCallCount = mock.answersParseData.length;

        const questionStub = sinon.stub(QuestionModel, 'insert');
        const answerStub = sinon.stub(AnswerModel, 'insert');
        for (let i = 0; i < questionsCallCount; i++) {
            questionStub.onCall(i).resolves(i + 1);
        }

        await questionController.store(req as any, res as any);

        assert.callCount(questionStub, questionsCallCount);
        assert.callCount(answerStub, answersCallCount);
        for (let i = 0; i < questionsCallCount; i++) {
            assert.calledWith(questionStub.getCall(i), match(mock.questionsParseData[i]));
        }
        for (let i = 0; i < questionsCallCount; i++) {
            assert.calledWith(answerStub.getCall(i), match(mock.answersParseData[i]));
        }

        assert.calledOnce(res.redirect);
    });

    it('store: should store question with answers within database', async () => {
        const req = {
            body: {
                question: { text: 'Question Text' },
                answer: [
                    { text: 'Answer 1', correct: '1' },
                    { text: 'Answer 2', correct: 0 },
                    { text: 'Answer 3' }
                ],
                category: '1'
            },
            session: { userid: 1 }
        };
        const res = {
            redirect: sinon.stub()
        };

        const answer = [
            { text: 'Answer 1', correct: '1', question: 1 },
            { text: 'Answer 2', correct: '0', question: 1 },
            { text: 'Answer 3', correct: '0', question: 1 }
        ];

        const questionStub = sinon.stub(QuestionModel, 'insert').resolves(1);
        const answerStub = sinon.stub(AnswerModel, 'insert');
        sinon.stub(QuestionModel, 'getNewerThan').resolves([]);

        await questionController.store(req as any, res as any);

        assert.calledOnceWithExactly(questionStub, match(req.body.question));

        const callCount = 3;
        assert.callCount(answerStub, callCount);
        for (let i = 0; i < callCount; i++) {
            assert.calledWith(answerStub.getCall(i), match(answer[i]));
        }
        assert.calledOnce(res.redirect);
    });

    it('destroy: should delete question by id', async () => {
        const req = { params: { id: 1 } };
        const res = {
            redirect: sinon.spy()
        };

        const questionStub = sinon.stub(QuestionModel, 'deleteById').resolves(1);

        await questionController.destroy(req as any, res as any);

        assert.calledOnceWithExactly(questionStub, req.params.id);
        assert.calledOnce(res.redirect);
    });

    it('update: should update question by id', async () => {
        const req = {
            params: { id: 1 },
            body: mock.questionEditFormData
        };
        const res = {
            redirect: sinon.stub()
        };

        const answer = [
            { id: '49', text: '1', correct: '0' },
            { id: '50', text: '10', correct: '0' },
            { id: '51', text: '11', correct: '0' },
            { id: '52', text: '20', correct: '1' }
        ];

        const questionStub = sinon.stub(QuestionModel, 'editById').resolves(1);
        const answerStub = sinon.stub(AnswerModel, 'editById').resolves(4);

        await questionController.update(req as any, res as any);

        assert.calledOnceWithExactly(questionStub, 1,
            {
                text: mock.questionEditFormData.question.text,
                category: mock.questionEditFormData.category,
                status: 'private'
            }
        );

        const callCount = 4;
        assert.callCount(answerStub, callCount);
        for (let i = 0; i < callCount; i++) {
            assert.calledWith(answerStub.getCall(i), match(answer[i].id), match(answer[i]));
        }
        assert.calledOnce(res.redirect);
    });
});
