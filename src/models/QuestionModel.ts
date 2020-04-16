import { Base, BaseModel } from './BaseModel';

export interface Question extends Base {
    user: number;
    category: number;
    status: string; // 'private';
    text: string;
}

class QuestionModel extends BaseModel<Question> {
    public readonly sqlTable = 'questions';

    public async getByUser(user: number): Promise<Question[]> {
        return (await super.getByField('user', user));
    }

    public async getByStatus(user: string): Promise<Question[]> {
        return (await super.getByField('status', user));
    }

    public async getPublicCount(): Promise<number> {
        const result = (await super.execute(`SELECT COUNT(*) AS \`rows\` FROM \`${this.sqlTable}\` WHERE \`status\` = 'public'`));
        return (result[0] as any).rows;
    }

    public async getByRow(row: number) {
        return (await super.execute(`SELECT * FROM \`${this.sqlTable}\` WHERE \`status\` = 'public' LIMIT ?, 1`, [row]))[0];
    }

    public async getRandomPublic(categoryIds: number[], numberOfQuestions: number = 1): Promise<Question[]> {
        return await super.execute(
            'SELECT questions.id, COUNT(answers.id) AS answerCount FROM questions JOIN answers ON answers.question = questions.id WHERE `category` IN (?) AND answers.correct = \'1\' AND questions.status = \'public\' GROUP BY questions.id ORDER BY RAND() LIMIT 0, ?',
            [categoryIds, numberOfQuestions]
        );
    }

    // Override
    public async getNewerThanForUser(date: Date, userId: number) {
        const query = `SELECT * FROM \`${this.sqlTable}\` WHERE \`created\` > ? AND \`user\` = ?`;
        return (await this.execute(query, [date, userId])) as Question[];
    }
}

export default new QuestionModel();
