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
import categoriesController from 'controllers/categoriesController';

describe('Question Controller', () => {
    afterEach(() => {
        // Restore the default sandbox here
        sinon.restore();
    });

    beforeEach(() => {
        sinon.stub(settingsCache, 'cacheData' as any).value(settingsMock.settingsCache);
        sinon.stub(Utils, 'saveSession').resolves();
    });

    it('index: should get a list of questions for normal user', async () => {
        const req = { session: { userId: 1, isAdmin: false } };
        const res = { render: sinon.spy() };

        const usersStub = sinon.stub(UserModel, 'getByIdArray').resolves(usersMock.users);
        const questionStub = sinon.stub(QuestionModel, 'getByUser').resolves(mock.questions.filter(question => question.user === req.session.userId));
        const answerStub = sinon.stub(AnswerModel, 'getByQuestionIdArray').resolves(mock.answers as any); // TODO: Fix any type (Answer)
        const categoriesStub = sinon.stub(CategoryModel, 'getByIdArray').resolves(categoriesMock.categories as any); // TODO: Fix any type (Category)

        await questionController.index(req as any, res as any);

        const expectedResult = {
            data: [{
                answers: [{ correct: 1, id: 1, question: 1, text: 'A1' }, { correct: 0, id: 2, question: 1, text: 'A2' }, { correct: 0, id: 3, question: 1, text: 'A3' }, { correct: 0, id: 4, question: 1, text: 'A4' }],
                category: { description: 'string', id: 1, name: 'C1', parent: null },
                creator: {
                    activationToken: 'abc123',
                    admin: 0,
                    email: 'patryk@checinski.dev',
                    id: 1,
                    password: '1234',
                    username: 'pchecinski'
                },
                id: 1,
                isPublic: false,
                status: 'btn-secondary fa-circle',
                statusDescription: 'Pytanie prywatne',
                text: 'Question1',
                user: 1
            }, {
                answers: [{ correct: 1, id: 5, question: 2, text: 'B1' }, { correct: 1, id: 6, question: 2, text: 'B2' }, { correct: 0, id: 7, question: 2, text: 'B3' }],
                category: { description: 'string2', id: 2, name: 'C2', parent: null },
                creator: {
                    activationToken: 'abc123',
                    admin: 0,
                    email: 'patryk@checinski.dev',
                    id: 1,
                    password: '1234',
                    username: 'pchecinski'
                },
                id: 2,
                isPublic: false,
                status: 'btn-secondary fa-circle',
                statusDescription: 'Pytanie prywatne',
                text: 'Question2',
                user: 1
            }],
            isAdmin: false,
            title: 'Pytania'
        };

        assert.calledOnceWithExactly(res.render, 'question/index', sinon.match.any);
        assert.calledOnceWithExactly(usersStub, [1]);
        assert.calledOnceWithExactly(questionStub, 1);
        assert.calledOnceWithExactly(answerStub, [1, 2]);
        assert.calledOnceWithExactly(categoriesStub, [1, 2]);
    });

    it('edit: should show question with id owned by user', async () => {
        const req = { params: { id: 1 }, session: { userId: 1, isAdmin: false } };
        const res = { render: sinon.spy() };

        const questionStub = sinon.stub(QuestionModel, 'getById').resolves(mock.questions[0]);
        const answerStub = sinon.stub(AnswerModel, 'getByQuestionId').resolves(mock.answers.slice(0, 4) as any); // TODO: Fix any type (Answer)
        const categoriesStub = sinon.stub(CategoryModel, 'getTree').resolves(categoriesMock.categoryTree as any); // TODO: Fix any type (Answer)

        await questionController.edit(req as any, res as any);

        const expectedResult = {
            title: 'Pytanie',
            maxQuestionLength: 300,
            question: mock.questions[0],
            answers: mock.answers.slice(0, 4),
            categoriesTree: categoriesMock.categoryTree,
            selected: 1,
            isAdmin: false,
            isPublicCandidate: true,
            isPending: false,
            isPrivate: true,
            isPublic: false
        };

        assert.calledOnceWithExactly(res.render, 'question/createEdit', sinon.match.any);
        assert.calledOnceWithExactly(questionStub, req.params.id);
        assert.calledOnceWithExactly(answerStub, req.params.id);
        // assert.calledOnce(categoriesStub);
    });

    it('edit: should get 404 for question with non-existing id', async () => {
        const req = { params: { id: 1 }, session: { userId: 1 } };
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

        const categoryStub = sinon.stub(categoriesController, 'getOrCreatePrivate').resolves({ id: 1, name: 'a', description: 'ab' });
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
