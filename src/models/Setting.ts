import pool from 'common/database';
import { format } from 'mysql2';

export interface Setting {
    id: number;
    key: string;
    value: string;
    description: string;
}

export default {
    // SELECT
    getAll: async () => {
        const [rows] = await pool.execute('SELECT * FROM settings ') as any[];
        return rows as Setting[];
    },

    getById: async (id: number) => {
        const [rows] = await pool.execute('SELECT * FROM settings WHERE id = ? LIMIT 1', [id]) as any;
        return rows[0] as Setting;
    },

    getByKey: async (key: string) => {
        const [rows] = await pool.execute('SELECT * FROM settings WHERE `key` = ? LIMIT 1', [key]) as any;
        return rows[0] as Setting;
    },

    // UPDATE
    editById: async (id: number, data: { [key: string]: string }) => {
        const query = format('UPDATE settings SET ? WHERE id = ?', [data, id]) as any;
        const [rows] = await pool.query(query) as any[];
        return rows.affectedRows;
    },

    editByKey: async (key: string, data: { [key: string]: string }) => {
        const query = format('UPDATE settings SET ? WHERE `key` = ?', [data, key]) as any;
        const [rows] = await pool.query(query) as any[];
        return rows.affectedRows;
    },

    // INSERT
    insert: async (data: { [key: string]: string }) => {
        const [rows] = await pool.query('INSERT INTO settings SET ?', [data]) as any;
        return rows.insertId;
    }
};
