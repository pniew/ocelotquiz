import { Base, BaseModel } from './BaseModel';

export interface Exam extends Base {
    name: string;
    user: number;
    questionIdsArray: string;
    visibleInProfile?: number;
}

class ExamModel extends BaseModel<Exam> {
    public readonly sqlTable = 'exam';

    public async getByUserId(id: number): Promise<Exam[]> {
        return (await super.getByField('user', id));
    }
}

export default new ExamModel();
