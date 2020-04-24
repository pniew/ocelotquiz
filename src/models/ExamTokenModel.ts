import { Base, BaseModel } from './BaseModel';

export interface ExamToken extends Base {
    exam: number;
    user: number;
    token: string;
    validDuration?: number;
    examDuration: number;
    examQuestions: number;
}

class ExamTokenModel extends BaseModel<ExamToken> {
    public readonly sqlTable = 'examTokens';

    public async getByUserId(id: number): Promise<ExamToken[]> {
        return (await super.getByField('user', id));
    }

    public async getByToken(token: string): Promise<ExamToken> {
        return (await super.getByField('token', token))[0];
    }

    public async getByExamId(examId: number): Promise<ExamToken[]> {
        return (await super.getByField('exam', examId));
    }
}

export default new ExamTokenModel();
