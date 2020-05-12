import { Base, BaseModel } from './BaseModel';

export interface ExamProgress extends Base {
    exam: number;
    user: number;
    questionsData: string;
    selectedAnswersData: string;
    token: string;
    timeLimit?: number;
    completed?: string;
    startTime?: Date;
}

class ExamProgressModel extends BaseModel<ExamProgress> {
    public readonly sqlTable = 'examProgressRecords';

    public async getByUserId(id: number): Promise<ExamProgress[]> {
        return (await super.getByField('user', id));
    }

    public async getByTokenForUser(token: string, userId: number): Promise<ExamProgress> {
        const query = 'SELECT * FROM `examProgressRecords` WHERE `token` = ? AND `user` = ?';
        return (await super.execute(query, [token, userId]))[0];
    }
}

export default new ExamProgressModel();
