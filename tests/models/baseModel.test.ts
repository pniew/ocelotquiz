import sinon, { assert, SinonStub } from 'sinon';
import pool from 'src/common/database';
import { model, Test, selectMock } from './baseModel.mock';

describe('Base Model', () => {
    describe('should prepare select', () => {
        let poolStub: SinonStub;

        beforeEach(() => {
            poolStub = sinon.stub(pool, 'execute').resolves([selectMock] as any);
        });

        afterEach(() => { sinon.restore(); });

        it('get all query', async () => {
            const result = await model.getAll();
            assert.match(result, selectMock);
            assert.calledOnceWithExactly(poolStub, 'SELECT * FROM `testtable`');
        });

        it('get by id query', async () => {
            const result = await model.getById(1);
            assert.match(result, selectMock[0]);
            assert.calledOnceWithExactly(poolStub, 'SELECT * FROM `testtable` WHERE `id` = 1');
        });

        it('get by field impl query', async () => {
            await model.getBySomeFK(123);
            await model.getBySomeFK('abc');
            await model.getBySomeFK('a\'b"c');
            await model.getBySomeFK('mmm\\`m;`mm');
            assert.callCount(poolStub, 4);
            assert.calledWithExactly(poolStub.getCall(0), 'SELECT * FROM `testtable` WHERE `somefk` = 123');
            assert.calledWithExactly(poolStub.getCall(1), 'SELECT * FROM `testtable` WHERE `somefk` = \'abc\'');
            assert.calledWithExactly(poolStub.getCall(2), 'SELECT * FROM `testtable` WHERE `somefk` = \'a\\\'b\\"c\'');
            assert.calledWithExactly(poolStub.getCall(3), 'SELECT * FROM `testtable` WHERE `somefk` = \'mmm\\\\`m;`mm\'');
        });

        it('get by field array impl query', async () => {
            await model.getByColumnArray([1, 2, 3, 4]);
            assert.calledOnceWithExactly(poolStub, 'SELECT * FROM `testtable` WHERE `column1` IN (1, 2, 3, 4)');
        });
    });

    describe('should prepare', () => {
        let poolStub: SinonStub;

        beforeEach(() => {
            poolStub = sinon.stub(pool, 'execute').resolves([[], []]);
        });

        afterEach(() => { sinon.restore(); });

        it('edit by id query', async () => {
            const data: Test = {
                column1: 'aaa',
                somefk: 19
            };
            await model.editById(1, data);
            assert.calledOnceWithExactly(poolStub, 'UPDATE `testtable` SET `column1` = \'aaa\', `somefk` = 19 WHERE `id` = 1');
        });

        it('insert query', async () => {
            const data: Test = {
                column1: 'aaa',
                somefk: 19
            };
            await model.insert(data);
            assert.calledOnceWithExactly(poolStub, 'INSERT INTO `testtable` SET `column1` = \'aaa\', `somefk` = 19');
        });

        it('delete by id query', async () => {
            await model.deleteById(1);
            assert.calledOnceWithExactly(poolStub, 'DELETE FROM `testtable` WHERE `id` = 1 LIMIT 1');
        });
    });

    describe('should fail when', () => {
        it('preparing query with undefined', async () => {
            const poolStub = sinon.stub(pool, 'execute').resolves([selectMock] as any);
            sinon.stub(model, 'sqlTable').value(undefined);

            try {
                await model.getAll();
            } catch (error) {
                assert.match(error.message, 'Table name has not been defined.');
            }

            assert.notCalled(poolStub);
            sinon.restore();
        });
    });
});
