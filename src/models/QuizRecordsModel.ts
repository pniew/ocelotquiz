import { Base, BaseModel } from './BaseModel';

export interface QuizRecords extends Base {
    user: number;
    data: string;
    points: number;
    length: number;
}

class QuizRecordsModel extends BaseModel<QuizRecords> {
    public readonly sqlTable = 'quiz';

    public async getByUserId(id: number): Promise<QuizRecords[]> {
        return (await super.getByField('user', id));
    }

    public async getByUserIdLimit(id: number, limit: number): Promise<QuizRecords[]> {
        const query = `SELECT * FROM \`${this.sqlTable}\` WHERE \`user\` = ? ORDER BY \`created\` DESC LIMIT ?`;
        return (await this.execute(query, [id, limit])) as QuizRecords[];
    }
}

export default new QuizRecordsModel();
