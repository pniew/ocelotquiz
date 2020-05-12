import { Base, BaseModel } from './BaseModel';

export interface QuizRecords extends Base {
    user: number;
    data: string;
    points: number;
    length: number;
}

class QuizRecordsModel extends BaseModel<QuizRecords> {
    public readonly sqlTable = 'dynamicScores';

    public async getByUserId(id: number): Promise<QuizRecords[]> {
        return (await super.getByField('user', id));
    }

    public async getByUserIdLimit(id: number, limit: number): Promise<QuizRecords[]> {
        const query = `SELECT * FROM \`${this.sqlTable}\` WHERE \`user\` = ? ORDER BY \`created\` DESC LIMIT ?`;
        return (await this.execute(query, [id, limit])) as QuizRecords[];
    }

    public async getRanking(): Promise<{ id: number, username: string, pointSum: number }[]> {
        const query = 'SELECT `users`.`id`, `users`.`username`, SUM(`points`) AS `pointSum` FROM `dynamicScores` JOIN `users` ON `dynamicScores`.`user` = `users`.`id` GROUP BY `users`.`id` ORDER BY `pointSum` DESC';
        return (await this.execute(query)) as any;
    }
}

export default new QuizRecordsModel();
