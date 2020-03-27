import pool from 'common/database';
import { format } from 'mysql2';

const sqlTable = 'answers';
export interface Answer {
    id: number;
    text: string;
    correct: '0' | '1';
    question: number;
}

export default {
    // SELECT
    getByQuestionId: async (id: number) => {
        const [rows] = await pool.execute(`SELECT * FROM ${sqlTable} WHERE question = ?`, [id]) as any;
        return rows as Answer[];
    },

    getByQuestionIdArray: async (idList: number[]) => {
        const [rows] = await pool.query(`SELECT * FROM ${sqlTable} WHERE question IN (?)`, [idList]) as any;
        return rows as Answer[];
    },

    // UPDATE
    editById: async (id: number, data: { [key: string]: string }) => {
        delete data.id;
        const query = format(`UPDATE ${sqlTable} SET ? WHERE id = ?`, [data, id]);
        const [rows] = await pool.query(query) as any;
        return rows.affectedRows;
    },

    // INSERT
    insert: async (data: { [key: string]: string }) => {
        const [rows] = await pool.query(`INSERT INTO ${sqlTable} SET ?`, [data]) as any;
        return rows.insertId;
    }
};
