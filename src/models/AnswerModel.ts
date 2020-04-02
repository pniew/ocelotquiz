import { Base, BaseModel } from './BaseModel';

export interface Answer extends Base {
    text: string;
    user: number;
    question: number;
    correct: '0' | '1';
}

class AnswerModel extends BaseModel<Answer> {
    public readonly sqlTable = 'answers';

    public async getByQuestionId(id: number): Promise<Answer[]> {
        return (await super.getByField('question', id));
    }

    public async getByQuestionIdArray(idList: number[]): Promise<Answer[]> {
        return (await this.getByFieldArray('question', idList));
    }
}

export default new AnswerModel();
