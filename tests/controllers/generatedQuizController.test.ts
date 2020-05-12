import sinon, { assert, match } from 'sinon';
import AnswerModel from 'models/AnswerModel';
import QuestionModel from 'models/QuestionModel';
import CategoryModel from 'models/CategoryModel';
import UserModel from 'models/UserModel';
import questionController from 'controllers/questionController';
import * as mock from '../mocks/questions.mock';
import * as categoriesMock from '../mocks/categories.mock';
import settingsCache from 'common/settingsCache';
import * as settingsMock from 'settings.mock';
import path from 'path';
import fs from 'fs';
import * as usersMock from '../mocks/users.mock';
import * as Utils from 'src/common/utils';
import generatedQuizController from 'src/controllers/generatedQuizController';

describe('Generated Quiz Controller', () => {
    afterEach(() => {
        // Restore the default sandbox here
        sinon.restore();
    });

    beforeEach(() => {
        sinon.stub(settingsCache, 'cacheData' as any).value(settingsMock.settingsCache);
        sinon.stub(Utils, 'saveSession').resolves();
    });

    it('index: should show quiz page', async () => {
        const req = { session: { userId: 1, isAdmin: false }, query: {} };
        const res = { render: sinon.spy() };

        sinon.stub(UserModel, 'getByIdArray').resolves(usersMock.users);
        sinon.stub(QuestionModel, 'getByUser').resolves(mock.questions.filter(question => question.user === req.session.userId));
        sinon.stub(AnswerModel, 'getByQuestionIdArray').resolves(mock.answers as any); // TODO: Fix any type (Answer)
        sinon.stub(CategoryModel, 'getByIdArray').resolves(categoriesMock.categories as any); // TODO: Fix any type (Category)
        sinon.stub(CategoryModel, 'getAllWithPublicQuestions').resolves(categoriesMock.categories as any); // TODO: Fix any type (Category)

        await generatedQuizController.index(req as any, res as any);

        assert.calledOnce(res.render);
    });

    it('generate: should generate new quiz for user', async () => {
        const req = { session: { userId: 1, isAdmin: false }, query: {}, body: { categories: [1, 2] } };
        const res = { json: sinon.spy() };

        sinon.stub(QuestionModel, 'getRandomPublic');

        try {
            await generatedQuizController.generate(req as any, res as any);
            // eslint-disable-next-line no-empty
        } catch (e) {

        }
    });

    it('generate: should not generate new quiz for user if length not number', async () => {
        const req = { session: { userId: 1, isAdmin: false }, query: {}, body: { questionCount: NaN } };
        const res = { redirect: sinon.spy() };

        sinon.stub(QuestionModel, 'getRandomPublic').resolves([]);

        await generatedQuizController.generate(req as any, res as any);
    });

    it('edit: should get 404 for question not created by logged user', async () => {
        const req = { params: { id: 1 }, session: { userId: 2 } };
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
            session: { userId: 1, save: sinon.spy() }
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
            session: { userId: 1, save: sinon.spy() }
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
        sinon.stub(QuestionModel, 'getNewerThanForUser').resolves([]);

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
        const req = { params: { id: 1 }, session: { save: sinon.spy() } };
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
            body: mock.questionEditFormData,
            session: { save: sinon.spy(), isAdmin: false, userId: 1 }
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

        const oldQuestionStub = sinon.stub(QuestionModel, 'getById').resolves(mock.questions.find(q => q.id === 1));
        const questionStub = sinon.stub(QuestionModel, 'editById').resolves(1);
        const answerStub = sinon.stub(AnswerModel, 'editById').resolves(4);

        await questionController.update(req as any, res as any);

        const expectedResult = {
            text: mock.questionEditFormData.question.text,
            category: mock.questionEditFormData.category,
            status: 'private'
        };

        assert.calledOnceWithExactly(oldQuestionStub, 1);
        assert.calledOnceWithExactly(questionStub, 1, expectedResult as any);

        const callCount = 4;
        assert.callCount(answerStub, callCount);
        for (let i = 0; i < callCount; i++) {
            assert.calledWith(answerStub.getCall(i), match(answer[i].id), match(answer[i]));
        }
        assert.calledOnce(res.redirect);
    });
});
