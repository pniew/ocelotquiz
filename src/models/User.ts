import pool from 'common/database';
import { format } from 'mysql2';

const sqlTable = 'users';
export interface User {
    id: number;
    email: string;
    activationToken: string;
    username: string;
    password: string;
}

export default {
    // SELECT
    getAll: async () => {
        const [rows] = await pool.execute(`SELECT * FROM ${sqlTable}`) as any[];
        return rows as User[];
    },

    getById: async (id: number) => {
        const [rows] = await pool.execute(`SELECT * FROM ${sqlTable} WHERE id = ? LIMIT 1`, [id]) as any;
        return rows[0] as User;
    },

    getByName: async (username: string) => {
        const [rows] = await pool.execute(`SELECT * FROM ${sqlTable} WHERE username = ? LIMIT 1`, [username]) as any;
        return rows[0] as User;
    },

    // UPDATE
    editById: async (id: number, data: { [key: string]: string }) => {
        const query = format(`UPDATE ${sqlTable} SET ? WHERE id = ?`, [data, id]) as any;
        const [rows] = await pool.query(query) as any[];
        return rows.affectedRows;
    },

    // INSERT
    insert: async (data: { [key: string]: string }) => {
        const [rows] = await pool.query(`INSERT INTO ${sqlTable} SET ?`, [data]) as any;
        return rows.insertId;
    }
};
