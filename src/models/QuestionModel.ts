import { Base, BaseModel } from './BaseModel';

export interface Question extends Base {
    user: number;
    category: number;
    status: string; // 'private';
    text: string;
}

class QuestionModel extends BaseModel<Question> {
    public readonly sqlTable = 'questions';

    public async getByUser(user: string): Promise<Question[]> {
        return (await super.getByField('user', user));
    }

    public async getByStatus(user: string): Promise<Question[]> {
        return (await super.getByField('status', user));
    }
}

export default new QuestionModel();
