import { BaseModel, Base } from 'src/models/BaseModel';

export interface Test extends Base {
    column1: string;
    somefk: number;
}

export class TestModel extends BaseModel<Test> {
    public readonly sqlTable = 'testtable'

    public async getBySomeFK(fk: number | string) {
        return await super.getByField('somefk', fk);
    }

    public async getByColumnArray(list: number[]) {
        return await super.getByFieldArray('column1', list);
    }
}

export const model = new TestModel();

export const selectMock: Test[] = [{
    id: 1,
    column1: '1234',
    somefk: 3
}, {
    id: 2,
    column1: 'aaa',
    somefk: 5
}, {
    id: 3,
    column1: 'bbb',
    somefk: 7
}];
