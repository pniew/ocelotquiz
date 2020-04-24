import { Base, BaseModel } from './BaseModel';

export interface StaticQuizSolution extends Base {
    user: number;
    data: string;
    answers: string;
    points: number;
    timeTaken: number;
}

class StaticQuizModel extends BaseModel<StaticQuizSolution> {
    public readonly sqlTable = 'staticQuizSolution';

    public async getByUserId(id: number): Promise<StaticQuizSolution[]> {
        return (await super.getByField('user', id));
    }

    public async getByUserIdLimit(id: number, limit: number): Promise<StaticQuizSolution[]> {
        const query = `SELECT * FROM \`${this.sqlTable}\` WHERE \`user\` = ? ORDER BY \`created\` DESC LIMIT ?`;
        return (await this.execute(query, [id, limit])) as StaticQuizSolution[];
    }
}

export default new StaticQuizModel();
