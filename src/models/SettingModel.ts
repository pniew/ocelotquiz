import { Base, BaseModel } from './BaseModel';

export interface Setting extends Base {
    key: string;
    value: string;
    description: string;
}

class QuestionModel extends BaseModel<Setting> {
    public readonly sqlTable = 'settings';

    public async getByKey(key: string): Promise<Setting> {
        return (await super.getByField('key', key))[0];
    }

    public async editByKey(key: string, data: { [key: string]: string } | Setting): Promise<number> {
        return (await super.editByField('key', key, data));
    }
}

export default new QuestionModel();
