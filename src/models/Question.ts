import pool from 'common/database';
import { format } from 'mysql2';

export interface Question {
    id: number;
    text: string;
    user: number;
}

export default {
    // SELECT
    getAll: async () => {
        const [rows] = await pool.execute('SELECT * FROM questions') as any;
        return rows as Question[];
    },

    getById: async (id: number) => {
        const [rows] = await pool.execute('SELECT * FROM questions WHERE id = ? LIMIT 1', [id]) as any;
        return rows[0] as Question;
    },

    // UPDATE
    editById: async (id: number, data: { [key: string]: string }) => {
        const query = format('UPDATE questions SET ? WHERE id = ?', [data, id]) as any;
        const [rows] = await pool.query(query) as any[];
        return rows.affectedRows;
    },

    // INSERT
    insert: async (data: { [key: string]: string }) => {
        const [rows] = await pool.query('INSERT INTO questions SET ?', [data]) as any;
        return rows.insertId;
    },

    // DELETE
    deleteById: async (id: number) => {
        const [rows] = await pool.execute('DELETE FROM questions WHERE id = ? LIMIT 1', [id]) as any;
        return rows.affectedRows;
    }
};
