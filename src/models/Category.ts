import pool from 'common/database';
// import { format } from 'mysql2';

const sqlTable = 'categories';
export interface Category {
    id: number;
    subId: number;
    subcategories: [Object?];
    name: string;
    description: string;
}

export default {
    // SELECT
    getAll: async () => {
        const [rows] = await pool.execute(`SELECT * FROM ${sqlTable}`) as any;
        return rows as Category[];
    },

    getById: async (key: string) => {
        const [rows] = await pool.execute(`SELECT * FROM ${sqlTable} WHERE id = ? LIMIT 1`, [key]) as any;
        return rows[0] as Category;
    },

    getByIdArray: async (idList: number[]) => {
        const [rows] = await pool.query(`SELECT * FROM ${sqlTable} WHERE id IN (?)`, [idList]) as any;
        return rows as Category[];
    }
};
