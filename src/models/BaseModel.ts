import pool from 'common/database';
import { format as mysqlFormat } from 'mysql2';
import dotenv from 'dotenv';
import { getDistinctArray } from 'src/common/utils';

dotenv.config();
const debugLogs = process.env.DEBUG_LOGS === 'true';

export interface Base {
    id?: number;
    created?: Date;
}

export interface KeyValString {
    [key: string]: string | number;
}

export abstract class BaseModel<T extends Base> {
    public readonly sqlTable?: string = undefined;

    public async getAll(): Promise<T[]> {
        const query = `SELECT * FROM \`${this.sqlTable}\``;
        return await this.execute(query) as T[];
    }

    public async getById(id: number): Promise<T> {
        return (await this.getByField('id', id))[0];
    }

    protected async getByField(fieldName: keyof T, fieldValue: string | number): Promise<T[]> {
        const query = `SELECT * FROM \`${this.sqlTable}\` WHERE \`${fieldName}\` = ?`;
        return (await this.execute(query, [fieldValue])) as T[];
    }

    public async getByIdArray(idList: number[]): Promise<T[]> {
        return (await this.getByFieldArray('id', idList)) as T[];
    }

    protected async getByFieldArray(fieldName: keyof T, valueList: number[]): Promise<T[]> {
        const query = `SELECT * FROM \`${this.sqlTable}\` WHERE \`${fieldName}\` IN (?)`;
        const valueSet = getDistinctArray(valueList);
        if (valueSet.length > 0) {
            return (await this.execute(query, [valueSet])) as T[];
        } else {
            if (debugLogs) {
                console.log('Cancelling query as list is empty.');
            }
            return [];
        }
    }

    public async getNewerThan(date: Date) {
        const query = `SELECT * FROM \`${this.sqlTable}\` WHERE \`created\` > ?`;
        return (await this.execute(query, [date])) as T[];
    }

    public async editById(id: number, data: { [key: string]: string } | T): Promise<number> {
        return (await this.editByField('id', id, data)) as number;
    }

    protected async editByField(fieldName: keyof T, fieldValue: string | number, data: { [key: string]: string | number } | T): Promise<number> {
        const query = mysqlFormat(`UPDATE \`${this.sqlTable}\` SET ? WHERE \`${fieldName}\` = ?`);
        const result = await this.execute(query, [data, fieldValue]);
        return result.affectedRows as number;
    }

    public async insert(data: T): Promise<number> { // We would like to make sure that data beign inserted matches with DTO
        const query = `INSERT INTO \`${this.sqlTable}\` SET ?`;
        const result = await this.execute(query, [data]);
        return result.insertId as number;
    }

    public async deleteById(id: number): Promise<number> {
        const query = `DELETE FROM \`${this.sqlTable}\` WHERE \`id\` = ? LIMIT 1`;
        const result = await this.execute(query, [id]);
        return result.affectedRows as number;
    }

    public async deleteByIdArray(idList: number[]): Promise<number> {
        const query = `DELETE FROM \`${this.sqlTable}\` WHERE \`id\` IN (?)`;
        const valueSet = getDistinctArray(idList);
        if (valueSet.length > 0) {
            const result = await this.execute(query, [getDistinctArray(idList)]);
            return result.affectedRows as number;
        } else {
            if (debugLogs) {
                console.log('Cancelling query as list is empty.');
            }
            return 0;
        }
    }

    protected validateSqlTableName(): void {
        if (!this.sqlTable || this.sqlTable === 'undefined') {
            throw new Error('Table name has not been defined.');
        }
    }

    protected async execute(sql: string, values?: any[]): Promise<KeyValString & T & T[] & KeyValString[]> {
        this.validateSqlTableName();
        const preparedQuery = mysqlFormat(sql, values);
        try {
            if (debugLogs) {
                console.log('Query:', preparedQuery);
            }
            const [rows] = await pool.execute(preparedQuery) as any;
            return rows;
        } catch (error) {
            console.error(error);
        }
    }
}
